// The customer's most recently chosen delivery location, kept in this browser
// only. It lets the homepage search, the map picker and (later) the kitchen
// list start from the same place. It is a convenience, never a source of truth:
// orders always use the address the customer confirms at checkout.

export type DeliveryLocation = {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

const STORAGE_KEY = "bufer-feast:delivery-location";

function isValid(value: unknown): value is DeliveryLocation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.address === "string" &&
    typeof v.latitude === "number" &&
    typeof v.longitude === "number" &&
    Math.abs(v.latitude) <= 90 &&
    Math.abs(v.longitude) <= 180 &&
    typeof v.placeId === "string"
  );
}

export function readDeliveryLocation(): DeliveryLocation | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    // No window (server render), storage blocked, or bad JSON.
    return null;
  }
}

export function saveDeliveryLocation(location: DeliveryLocation) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Ignore.
  }
}
