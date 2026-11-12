"use server";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export async function saveCustomerAddress(formData: FormData) {
  const client = await authClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Please sign in to save an address.");
  const admin = adminClient();
  const { data: existing, error: lookupError } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (lookupError || existing?.role !== "customer") throw new Error("Only customer accounts can update this address.");
  const address = String(formData.get("primary_address") || "").trim();
  if (address.length < 5 || address.length > 500) throw new Error("Please enter a valid delivery address.");
  const getCoord = (field: string, limit: number) => {
    const raw = String(formData.get(field) || "");
    return raw && Number.isFinite(Number(raw)) && Math.abs(Number(raw)) <= limit ? Number(raw) : null;
  };
  const metadata = {
    primary_address: address,
    primary_address_latitude: getCoord("primary_address_latitude", 90),
    primary_address_longitude: getCoord("primary_address_longitude", 180),
    primary_address_place_id: String(formData.get("primary_address_place_id") || "").slice(0, 255) || null,
  };
  const { error: updateError } = await admin.from("profiles").update(metadata).eq("id", user.id);
  if (updateError) throw new Error(`Could not save address: ${updateError.message}`);
  await client.auth.updateUser({ data: metadata });
  redirect("/");
}
