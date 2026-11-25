"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "jie_bulk_order-customer-auth",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore in server actions
          }
        },
      },
    }
  );
}

// ✅ FIXED: Uses .upsert() to create the row if it's missing, or update it if it exists
export async function updateFullName(fullName: string) {
  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated. Please log in again.");

  const { error, data } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName })
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  
  console.log("✅ SERVER ACTION: Name upserted in DB:", data);
  return { success: true };
}

export async function updatePhone(phone: string) {
  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated. Please log in again.");

  const { error, data } = await supabase
    .from("profiles")
    .upsert({ id: user.id, phone })
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  
  console.log("✅ SERVER ACTION: Phone upserted in DB:", data);
  return { success: true };
}

export async function addAddress(
  label: string,
  address: string,
  location?: { latitude: number; longitude: number; placeId: string } | null,
) {
  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated. Please log in again.");

  const cleanLabel = String(label ?? "").trim().slice(0, 50);
  const cleanAddress = String(address ?? "").trim().slice(0, 500);
  if (!cleanLabel || cleanAddress.length < 5) {
    throw new Error("Please enter a label and a full delivery address.");
  }

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  const { error } = await supabase.from("saved_addresses").insert({
    user_id: user.id,
    label: cleanLabel,
    address: cleanAddress,
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    place_id: hasCoordinates ? String(location?.placeId ?? "").slice(0, 255) || null : null,
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteAddress(addressId: string) {
  const supabase = await getSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated. Please log in again.");

  const { error } = await supabase.from("saved_addresses").delete().eq("id", addressId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
  };
}

// Keep this alias so any existing account page code using logoutUser()
// continues to work.
export const logoutUser = logout;