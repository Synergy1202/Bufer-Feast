import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type KitchenDistance = {
  vendorId: string;
  distanceKm: number;
  delivers: boolean;
};

export function isCoordinate(latitude: unknown, longitude: unknown) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export async function getKitchenDistances(
  client: SupabaseClient,
  latitude: number,
  longitude: number,
  vendorId?: string,
): Promise<KitchenDistance[] | null> {
  if (!isCoordinate(latitude, longitude)) return [];

  const { data, error } = await client.rpc("kitchen_distances", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_vendor_id: vendorId ?? null,
  });

  if (error) {
    console.error("Kitchen distance lookup failed:", error.message);
    return null;
  }

  return (data ?? []).map(
    (row: { vendor_id: string; distance_km: number | string; delivers: boolean }) => ({
      vendorId: row.vendor_id,
      distanceKm: Number(row.distance_km),
      delivers: row.delivers === true,
    }),
  );
}
