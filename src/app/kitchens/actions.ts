"use server";

import { createClient } from "@supabase/supabase-js";
import {
  getKitchenDistances,
  isCoordinate,
  type KitchenDistance,
} from "@/lib/server/kitchen-distance";

/**
 * Called by the kitchens list with the customer's chosen delivery point.
 * Only distances come back, never where a kitchen is.
 */
export async function kitchenDistancesFor(
  latitude: number,
  longitude: number,
): Promise<KitchenDistance[] | null> {
  if (!isCoordinate(latitude, longitude)) return [];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  return getKitchenDistances(supabase, latitude, longitude);
}
