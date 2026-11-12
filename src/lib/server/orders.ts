import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { deliveryFees, kitchens, slots } from "@/lib/catalog";
import { shiftDay, todayLagos, validDate } from "@/lib/format";
import { orderSchema, quoteSchema } from "@/lib/schema";
import type { Quote, QuoteLine, StoredOrder, TestOrder } from "@/lib/types";
import { getStore } from "./storage";
import { AuthProblem } from "./problems";
import { accountForDraft, canReadOrder, publicOrder } from "./order-access";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public field: string | null = null,
    public code = "INVALID_INPUT",
    public quote?: Quote,
  ) {
    super(message);
  }
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const sameHash = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function buildQuote(input: unknown): Quote {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(issue.message, 400, issue.path.join("."));
  }
  const body = parsed.data,
    kitchen = kitchens.find((k) => k.id === body.vendorId);
  if (!kitchen) throw new ApiError("Choose a sample kitchen.", 400, "vendorId");
  if (!kitchen.areas.includes(body.area))
    throw new ApiError(
      "This sample kitchen does not serve that demo area.",
      400,
      "area",
    );
  const today = todayLagos();
  if (
    !validDate(body.date) ||
    body.date < shiftDay(today, kitchen.leadDays) ||
    body.date > shiftDay(today, 30)
  )
    throw new ApiError(
      `Choose a date from ${shiftDay(today, kitchen.leadDays)} to ${shiftDay(today, 30)} for this kitchen.`,
      400,
      "date",
    );
  const slot = slots.find((s) => s.id === body.slot);
  if (!slot) throw new ApiError("Choose a delivery window.", 400, "slot");
  const lines = new Map<string, QuoteLine>();
  for (const line of body.items) {
    if (line.vendorId && line.vendorId !== kitchen.id)
      throw new ApiError(
        "Only one kitchen is allowed per order.",
        400,
        "items",
      );
    const item = kitchen.menu.find((i) => i.id === line.itemId),
      pack = item?.packs[line.packIndex];
    if (!item || !pack)
      throw new ApiError(
        "An item or pack size is not in this sample menu.",
        400,
        "items",
      );
    const key = `${line.itemId}:${line.packIndex}`,
      quantity = (lines.get(key)?.quantity || 0) + line.quantity;
    if (quantity > 99)
      throw new ApiError("The demo limit is 99 packs per item.", 400, "items");
    lines.set(key, {
      itemId: item.id,
      name: item.name,
      packIndex: line.packIndex,
      pack: pack.label,
      quantity,
      unitPrice: pack.price,
      lineTotal: pack.price * quantity,
    });
  }
  const items = [...lines.values()],
    foodSubtotal = items.reduce((total, line) => total + line.lineTotal, 0),
    deliveryFee = deliveryFees[body.area];
  return {
    vendorId: kitchen.id,
    vendorName: kitchen.name,
    area: body.area,
    date: body.date,
    slot: slot.id,
    slotLabel: slot.label,
    currency: "NGN",
    items,
    foodSubtotal,
    deliveryFee,
    total: foodSubtotal + deliveryFee,
    notice:
      "Illustrative food and delivery prices only. Tax and service-fee policies are not implemented. Not a real payable quote.",
  };
}
function replay(
  row: StoredOrder,
  accessHash: string,
  requestHash: string,
  userId: string | null,
) {
  if (
    !sameHash(row.access_hash, accessHash) ||
    !sameHash(row.request_hash, requestHash)
  )
    throw new ApiError(
      "This request key was used for different details. Do not start a duplicate order.",
      409,
      null,
      "REQUEST_CONFLICT",
    );
  if (row.customer_id && row.customer_id !== userId)
    throw new AuthProblem(
      "Sign in to the original account before retrying this account order.",
      userId ? 409 : 401,
      userId ? "ACCOUNT_CHANGED" : "AUTH_REQUIRED",
    );
  return { order: publicOrder(row), replayed: true };
}
export async function createTestOrder(
  raw: string,
  input: unknown,
  requestKey: string | null,
  accessKey: string | null,
  verifiedId: string | null = null,
) {
  if (!requestKey || !/^[A-Za-z0-9_-]{20,80}$/.test(requestKey))
    throw new ApiError("A request key is required.");
  if (!accessKey || !/^[a-f0-9]{64}$/.test(accessKey))
    throw new ApiError("A private order-access key is required.");
  const store = await getStore(),
    requestHash = hash(raw),
    accessHash = hash(accessKey);
  const existing = await store.findRequest(requestKey);
  if (existing) return replay(existing, accessHash, requestHash, verifiedId);
  if ((await store.count()) >= 1000)
    throw new ApiError(
      "This development database reached its demo-record limit.",
      503,
      null,
      "DEMO_FULL",
    );
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(issue.message, 400, issue.path.join("."));
  }
  const body = parsed.data,
    ownerId = accountForDraft(body, verifiedId),
    quote = buildQuote(body);
  if (body.expectedTotal !== quote.total)
    throw new ApiError(
      "The total changed. Review a fresh server quote before saving.",
      409,
      null,
      "TOTAL_CHANGED",
      quote,
    );
  const order: TestOrder = {
    ...quote,
    id: `FNM-${todayLagos().replaceAll("-", "")}-${randomBytes(8).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "received",
    statusLabel: "Received — test record only",
    paymentStatus: "not_requested",
    customer: body.customer,
    testOnly: true,
    nextStep:
      "No kitchen has been notified. Vendor acceptance, payment and delivery are not connected.",
    accountId: ownerId,
  };
  const row: StoredOrder = {
    id: order.id,
    request_key: requestKey,
    request_hash: requestHash,
    access_hash: accessHash,
    created_at: order.createdAt,
    status: "received",
    payload: order,
    customer_id: ownerId,
  };
  const inserted = await store.insert(row);
  return inserted.replayed
    ? replay(inserted.row, accessHash, requestHash, verifiedId)
    : { order: publicOrder(inserted.row), replayed: false };
}
function validId(id: string) {
  return /^FNM-\d{8}-[A-F0-9]{16}$/.test(id);
}
function missingOrder(): never {
  throw new ApiError(
    "Test record not found or you do not have access. Account orders require their owner's login.",
    404,
    null,
    "ORDER_NOT_FOUND",
  );
}
export async function readTestOrder(
  id: string,
  token: string | null,
  userId: string | null = null,
) {
  if (!validId(id)) return missingOrder();
  const accessHash = token && /^[a-f0-9]{64}$/.test(token) ? hash(token) : null;
  if (!userId && !accessHash) return missingOrder();
  const row = await (await getStore()).find(id);
  if (!row || !canReadOrder(row, userId, accessHash)) return missingOrder();
  return publicOrder(row);
}
export async function listAccountOrders(userId: string) {
  return (await (await getStore()).listCustomer(userId))
    .filter((row) => row.customer_id === userId)
    .map(publicOrder);
}
export async function claimGuestOrder(
  id: string,
  token: string | null,
  userId: string,
) {
  if (!validId(id) || !token || !/^[a-f0-9]{64}$/.test(token))
    return missingOrder();
  const store = await getStore();
  const updated = await store.claimGuest(id, hash(token), userId);
  if (updated) return publicOrder(updated);
  // Repeating a claim to the SAME verified account is safe. Never reassign it.
  const existing = await store.find(id);
  if (existing?.customer_id === userId) return publicOrder(existing);
  return missingOrder();
}
