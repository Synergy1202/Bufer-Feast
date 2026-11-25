// Delivery distances a kitchen can choose in vendor settings.
// The database allows 1–50 km (profiles_delivery_radius_km_range).
export const DELIVERY_RADIUS_OPTIONS = [3, 5, 10, 15, 20, 25, 30] as const;
export const DEFAULT_DELIVERY_RADIUS_KM = 15;
