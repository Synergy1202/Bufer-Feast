import "server-only";
import crypto from "node:crypto";

const API = "https://api.shipbubble.com/v1";

function key() {
  const value = process.env.SHIPBUBBLE_API_KEY?.trim();
  if (!value) throw new Error("SHIPBUBBLE_API_KEY is not configured.");
  return value;
}

async function shipbubble(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status === "error") {
    throw new Error(body?.message || "Shipbubble request failed.");
  }
  return body;
}

export function verifyShipbubbleSignature(body: string, signature: string | null) {
  if (!signature) return false;
  const expected = Buffer.from(crypto.createHmac("sha512", key()).update(body).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function validateShipbubbleAddress(input: {
  name: string; email: string; phone: string; address: string;
}) {
  return shipbubble("/shipping/address/validate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function requestShipbubbleRates(input: {
  sender_address_code: number;
  reciever_address_code: number;
  pickup_date: string;
  category_id: number;
  package_items: Array<{ name: string; description: string; unit_weight: string; unit_amount: string; quantity: string }>;
  package_dimension: { length: number; width: number; height: number };
  delivery_instructions?: string;
}) {
  return shipbubble("/shipping/fetch_rates", { method: "POST", body: JSON.stringify(input) });
}

export function createShipbubbleShipment(input: {
  request_token: string; service_code: string; courier_id: string | number;
}) {
  return shipbubble("/shipping/labels", { method: "POST", body: JSON.stringify(input) });
}
