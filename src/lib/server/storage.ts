import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { StoredOrder } from "@/lib/types";
import { canonicalSupabaseUrl } from "./supabase-url";
export interface OrderStore {
  mode: "local-test" | "supabase-test";
  ping: () => Promise<void>;
  find: (id: string) => Promise<StoredOrder | null>;
  findRequest: (key: string) => Promise<StoredOrder | null>;
  insert: (
    row: StoredOrder,
  ) => Promise<{ row: StoredOrder; replayed: boolean }>;
  count: () => Promise<number>;
  listCustomer: (id: string) => Promise<StoredOrder[]>;
  claimGuest: (
    id: string,
    accessHash: string,
    customerId: string,
  ) => Promise<StoredOrder | null>;
}
type Operation =
  | "configuration"
  | "health"
  | "lookup-id"
  | "lookup-request"
  | "count"
  | "insert"
  | "decode-row"
  | "list-account"
  | "claim-guest";
export class SupabaseStorageError extends Error {
  readonly name = "SupabaseStorageError";
  constructor(
    public readonly operation: Operation,
    public readonly storageCode: string,
    public readonly providerStatus = 0,
  ) {
    super(`Supabase ${operation} was not confirmed (${storageCode}).`);
  }
}
function providerFailure(operation: Operation, error: unknown, status = 0) {
  const value =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  const safeStatus =
    Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
  const code =
    typeof value === "string" && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(value)
      ? value
      : safeStatus
        ? `HTTP_${safeStatus}`
        : "NETWORK_UNCONFIRMED";
  return new SupabaseStorageError(operation, code, safeStatus);
}
function decodeRow(value: unknown): StoredOrder {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new SupabaseStorageError("decode-row", "UNEXPECTED_ROW");
  const row = value as Partial<StoredOrder>;
  if (
    typeof row.id !== "string" ||
    typeof row.request_key !== "string" ||
    typeof row.request_hash !== "string" ||
    typeof row.access_hash !== "string" ||
    typeof row.created_at !== "string" ||
    row.status !== "received" ||
    !row.payload ||
    typeof row.payload !== "object" ||
    Array.isArray(row.payload) ||
    (row.customer_id != null && typeof row.customer_id !== "string")
  )
    throw new SupabaseStorageError("decode-row", "UNEXPECTED_ROW");
  return { ...row, customer_id: row.customer_id ?? null } as StoredOrder;
}
export function storageMode() {
  const mode = process.env.ORDER_STORAGE || "local";
  if (!["local", "supabase"].includes(mode))
    throw new SupabaseStorageError("configuration", "INVALID_STORAGE_MODE");
  if (mode === "local" && process.env.VERCEL)
    throw new SupabaseStorageError("configuration", "LOCAL_NOT_DURABLE");
  return mode;
}
let cloud: OrderStore | undefined;
export async function getStore(): Promise<OrderStore> {
  if (storageMode() === "local")
    return (await import("./sqlite-store")).getSqliteStore();
  if (cloud) return cloud;
  const key = (
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  if (!key || !process.env.SUPABASE_URL)
    throw new SupabaseStorageError("configuration", "CONFIG_MISSING");
  let url: string;
  try {
    url = canonicalSupabaseUrl(process.env.SUPABASE_URL);
  } catch {
    throw new SupabaseStorageError("configuration", "INVALID_PROJECT_URL");
  }
  if (key.startsWith("sb_publishable_"))
    throw new SupabaseStorageError("configuration", "PUBLIC_KEY_NOT_ALLOWED");
  const db = (() => {
    try {
      return createClient(url, key, {
        db: { schema: "public" },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    } catch {
      throw new SupabaseStorageError("configuration", "CLIENT_INIT_FAILED");
    }
  })();
  const table = "jie_bulk_order_test_orders";
  async function findBy(column: "id" | "request_key", value: string) {
    const { data, error, status } = await db
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (error)
      throw providerFailure(
        column === "id" ? "lookup-id" : "lookup-request",
        error,
        status,
      );
    return data == null ? null : decodeRow(data);
  }
  cloud = {
    mode: "supabase-test",
    async ping() {
      // A real GET must return an array. A HEAD 404 can be normalized to 204 by
      // the SDK, so checking only `error` previously gave a misleading success.
      const { data, error, status } = await db
        .from(table)
        .select("id,customer_id")
        .limit(1);
      if (error) throw providerFailure("health", error, status);
      if (status < 200 || status >= 300 || !Array.isArray(data))
        throw new SupabaseStorageError("health", "READ_NOT_CONFIRMED", status);
    },
    find: (id) => findBy("id", id),
    findRequest: (key) => findBy("request_key", key),
    async count() {
      const { data, count, error, status } = await db
        .from(table)
        .select("id", { count: "exact" })
        .limit(1);
      if (error) throw providerFailure("count", error, status);
      if (
        !Array.isArray(data) ||
        !Number.isInteger(count) ||
        count === null ||
        count < 0
      )
        throw new SupabaseStorageError("count", "COUNT_NOT_CONFIRMED", status);
      return count;
    },
    async insert(row) {
      const { data, error, status } = await db
        .from(table)
        .insert(row)
        .select("*")
        .single();
      if (!error && data) return { row: decodeRow(data), replayed: false };
      if (error?.code === "23505") {
        const existing = await findBy("request_key", row.request_key);
        if (existing) return { row: existing, replayed: true };
      }
      throw providerFailure("insert", error, status);
    },
    async listCustomer(id) {
      const { data, error, status } = await db
        .from(table)
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw providerFailure("list-account", error, status);
      if (!Array.isArray(data))
        throw new SupabaseStorageError(
          "list-account",
          "READ_NOT_CONFIRMED",
          status,
        );
      return data.map(decodeRow);
    },
    async claimGuest(id, accessHash, customerId) {
      const { data, error, status } = await db
        .from(table)
        .update({ customer_id: customerId })
        .eq("id", id)
        .eq("access_hash", accessHash)
        .is("customer_id", null)
        .select("*")
        .maybeSingle();
      if (error) throw providerFailure("claim-guest", error, status);
      return data == null ? null : decodeRow(data);
    },
  };
  return cloud;
}
