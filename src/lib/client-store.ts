"use client";
import { useSyncExternalStore } from "react";
import { kitchens } from "./catalog";
import type {
  CartLine,
  OrderAccess,
  PendingOrder,
  Plan,
  TestOrder,
} from "./types";
type Snapshot = {
  cart: CartLine[];
  plan: Plan;
  access: OrderAccess[];
  pending: PendingOrder | null;
  ready: boolean;
  canRemember: boolean;
  submitting: boolean;
  submissionError: string;
};
const EMPTY: Snapshot = {
  cart: [],
  plan: { area: "", date: "", slot: "" },
  access: [],
  pending: null,
  ready: false,
  canRemember: true,
  submitting: false,
  submissionError: "",
};
let state = EMPTY;
const listeners = new Set<() => void>();
let hydrationScheduled = false;
const keys = {
  cart: "jie_bulk_order-demo-cart-v1",
  plan: "jie_bulk_order-next-plan-v3",
  access: "jie_bulk_order-test-order-access-v2",
  pending: "jie_bulk_order-pending-test-order-v2",
};
function validAccess(value: unknown): value is OrderAccess {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    "key" in value &&
    typeof value.id === "string" &&
    typeof value.key === "string" &&
    /^FNM-\d{8}-[A-F0-9]{16}$/.test(value.id) &&
    /^[a-f0-9]{64}$/.test(value.key)
  );
}
function validCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const result: CartLine[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const line = raw as CartLine,
      kitchen = kitchens.find((k) => k.id === line.vendorId),
      item = kitchen?.menu.find((i) => i.id === line.itemId);
    if (
      !item ||
      !Number.isInteger(line.packIndex) ||
      !item.packs[line.packIndex] ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99
    )
      continue;
    if (result.length && result[0].vendorId !== line.vendorId) continue;
    if (!result.some((existing) => lineKey(existing) === lineKey(line)))
      result.push({
        vendorId: line.vendorId,
        itemId: line.itemId,
        packIndex: line.packIndex,
        quantity: line.quantity,
      });
  }
  return result;
}
function announce() {
  for (const listener of listeners) listener();
}
function hydrate() {
  if (state.ready) return;
  let cart: CartLine[] = [],
    plan = EMPTY.plan,
    access: OrderAccess[] = [],
    pending: PendingOrder | null = null,
    canRemember = true;
  try {
    cart = validCart(JSON.parse(sessionStorage.getItem(keys.cart) || "[]"));
    const p = JSON.parse(sessionStorage.getItem(keys.plan) || "null");
    if (p && typeof p.area === "string" && typeof p.date === "string")
      plan = {
        area: p.area,
        date: p.date,
        slot: typeof p.slot === "string" ? p.slot : "",
      };
    const draft = JSON.parse(sessionStorage.getItem(keys.pending) || "null");
    if (
      draft &&
      typeof draft.bodyJSON === "string" &&
      /^[a-f0-9]{32}$/.test(draft.requestKey) &&
      /^[a-f0-9]{64}$/.test(draft.key)
    )
      pending = draft;
  } catch {}
  try {
    const list = JSON.parse(localStorage.getItem(keys.access) || "[]");
    if (Array.isArray(list)) access = list.filter(validAccess);
  } catch {
    canRemember = false;
  }
  state = {
    cart,
    plan,
    access,
    pending,
    ready: true,
    canRemember,
    submitting: false,
    submissionError: "",
  };
  announce();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!hydrationScheduled && typeof window !== "undefined") {
    hydrationScheduled = true;
    queueMicrotask(hydrate);
  }
  return () => listeners.delete(listener);
}
function update(next: Partial<Snapshot>) {
  if (!state.ready) hydrate();
  state = { ...state, ...next };
  try {
    sessionStorage.setItem(keys.cart, JSON.stringify(state.cart));
    sessionStorage.setItem(keys.plan, JSON.stringify(state.plan));
    if (state.pending)
      sessionStorage.setItem(keys.pending, JSON.stringify(state.pending));
    else sessionStorage.removeItem(keys.pending);
  } catch {}
  try {
    localStorage.setItem(keys.access, JSON.stringify(state.access));
  } catch {
    state = { ...state, canRemember: false };
  }
  announce();
}
export function useShop() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}
export const lineKey = (line: CartLine) =>
  `${line.vendorId}:${line.itemId}:${line.packIndex}`;
export function addCartItem(
  line: Omit<CartLine, "quantity">,
  replace = false,
): "added" | "switch" | "limit" {
  hydrate();
  if (state.cart.length && state.cart[0].vendorId !== line.vendorId && !replace)
    return "switch";
  const cart = replace ? [] : [...state.cart];
  const index = cart.findIndex(
    (item) => lineKey(item) === lineKey({ ...line, quantity: 1 }),
  );
  if (index >= 0) {
    if (cart[index].quantity >= 99) return "limit";
    cart[index] = { ...cart[index], quantity: cart[index].quantity + 1 };
  } else cart.push({ ...line, quantity: 1 });
  update({ cart });
  return "added";
}
export function changeQuantity(key: string, delta: number) {
  update({
    cart: state.cart
      .map((line) =>
        lineKey(line) === key
          ? { ...line, quantity: Math.min(99, line.quantity + delta) }
          : line,
      )
      .filter((line) => line.quantity > 0),
  });
}
export function removeCartLine(key: string) {
  update({ cart: state.cart.filter((line) => lineKey(line) !== key) });
}
export function savePlan(plan: Plan) {
  update({ plan });
}
export function savePending(pending: PendingOrder | null) {
  update({ pending, submissionError: "" });
}
export function setSubmission(submitting: boolean, submissionError = "") {
  update({ submitting, submissionError });
}
export function finishOrder(order: TestOrder, key: string) {
  const cartSignature = state.cart
    .map(
      (line) =>
        `${line.vendorId}:${line.itemId}:${line.packIndex}:${line.quantity}`,
    )
    .sort()
    .join("|");
  const orderSignature = order.items
    .map(
      (line) =>
        `${order.vendorId}:${line.itemId}:${line.packIndex}:${line.quantity}`,
    )
    .sort()
    .join("|");
  update({
    submitting: false,
    submissionError: "",
    cart: cartSignature === orderSignature ? [] : state.cart,
    plan: { area: order.area, date: order.date, slot: order.slot },
    pending: null,
    access: order.accountId
      ? state.access.filter((entry) => entry.id !== order.id)
      : [
          { id: order.id, key },
          ...state.access.filter((entry) => entry.id !== order.id),
        ].slice(0, 100),
  });
}
export const randomHex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");

export function forgetGuestAccess(id: string) {
  update({ access: state.access.filter((entry) => entry.id !== id) });
}
