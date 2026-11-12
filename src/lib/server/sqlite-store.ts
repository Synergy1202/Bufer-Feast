import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { StoredOrder } from "@/lib/types";
import type { OrderStore } from "./storage";
const globalStore = globalThis as typeof globalThis & {
  jie_bulk_orderSqliteV4?: OrderStore;
};
export function getSqliteStore(): OrderStore {
  if (globalStore.jie_bulk_orderSqliteV4) return globalStore.jie_bulk_orderSqliteV4;
  const dir = path.resolve(
    /* turbopackIgnore: true */ process.env.DATA_DIR ||
      path.join(process.cwd(), "data"),
  );
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "orders.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, access_hash TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status='received'), payload TEXT NOT NULL, customer_id TEXT)",
  );
  const columns = db.prepare("PRAGMA table_info(orders)").all();
  if (!columns.some((column) => column.name === "customer_id"))
    db.exec("ALTER TABLE orders ADD COLUMN customer_id TEXT");
  const lookup = db.prepare("SELECT * FROM orders WHERE id=?"),
    request = db.prepare("SELECT * FROM orders WHERE request_key=?"),
    list = db.prepare(
      "SELECT * FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 100",
    ),
    claim = db.prepare(
      "UPDATE orders SET customer_id=? WHERE id=? AND access_hash=? AND customer_id IS NULL",
    );
  const insert = db.prepare(
    "INSERT INTO orders(id,request_key,request_hash,access_hash,created_at,status,payload,customer_id) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING",
  );
  type SqlRow = Omit<StoredOrder, "payload"> & { payload: string };
  const decode = (value: unknown): StoredOrder | null => {
    if (!value) return null;
    const row = value as SqlRow;
    return {
      ...row,
      customer_id: row.customer_id ?? null,
      payload: JSON.parse(row.payload),
    };
  };
  const store: OrderStore = {
    mode: "local-test",
    async ping() {
      db.prepare("SELECT 1").get();
    },
    async find(id) {
      return decode(lookup.get(id));
    },
    async findRequest(key) {
      return decode(request.get(key));
    },
    async count() {
      return Number(
        db.prepare("SELECT COUNT(*) AS n FROM orders").get()?.n ?? 0,
      );
    },
    async insert(row) {
      const result = insert.run(
        row.id,
        row.request_key,
        row.request_hash,
        row.access_hash,
        row.created_at,
        row.status,
        JSON.stringify(row.payload),
        row.customer_id ?? null,
      );
      const saved = decode(request.get(row.request_key));
      if (!saved) throw new Error("SQLite did not confirm the save.");
      return { row: saved, replayed: Number(result.changes) === 0 };
    },
    async listCustomer(id) {
      return list.all(id).map((value) => decode(value) as StoredOrder);
    },
    async claimGuest(id, accessHash, customerId) {
      const result = claim.run(customerId, id, accessHash);
      return Number(result.changes) > 0 ? decode(lookup.get(id)) : null;
    },
  };
  globalStore.jie_bulk_orderSqliteV4 = store;
  return store;
}
