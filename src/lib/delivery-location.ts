
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
    return null;
  }
}

export function saveDeliveryLocation(location: DeliveryLocation) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
  }
}
