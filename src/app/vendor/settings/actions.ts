"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";
import { DELIVERY_RADIUS_OPTIONS } from "@/lib/delivery-radius";

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function booleanValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

async function uploadPrivateDocument(
  formData: FormData,
  fieldName: string,
  vendorId: string,
  documentType: "id" | "cac",
) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(value.type)) {
    throw new Error(
      "Documents must be PDF, JPG, PNG, or WEBP files.",
    );
  }

  if (value.size > MAX_DOCUMENT_SIZE) {
    throw new Error("Each document must be smaller than 10 MB.");
  }

  const extension =
    value.type === "application/pdf"
      ? "pdf"
      : value.type === "image/png"
        ? "png"
        : value.type === "image/webp"
          ? "webp"
          : "jpg";

  const path = `${vendorId}/${documentType}-${crypto.randomUUID()}.${extension}`;
  const buffer = await value.arrayBuffer();
  const admin = adminClient();

  const { error } = await admin.storage
    .from("vendor-documents")
    .upload(path, buffer, {
      contentType: value.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Document upload failed: ${error.message}`);
  }

  // Store the private storage path, not a public URL.
  return path;
}

export async function updateVendorSettings(formData: FormData) {
  const vendor = await requireVendor();
  const admin = adminClient();

  const phone = textValue(formData, "phone");
  const bio = textValue(formData, "bio");
  const idProofType = textValue(formData, "id_proof_type");
  const idProofNumber = textValue(formData, "id_proof_number");
  const cacNumber = textValue(formData, "cac_number");
  const openingHours = textValue(formData, "opening_hours");

  const notifyEmail = booleanValue(formData, "notify_email");
  const isOpen = booleanValue(formData, "is_open");

  const currentIdUrl = textValue(formData, "current_id_url");
  const currentCacUrl = textValue(formData, "current_cac_url");

  const [idDocumentPath, cacDocumentPath] = await Promise.all([
    uploadPrivateDocument(
      formData,
      "id_document",
      vendor.id,
      "id",
    ),

    uploadPrivateDocument(
      formData,
      "cac_document",
      vendor.id,
      "cac",
    ),
  ]);

  const { error } = await admin
    .from("profiles")
    .update({
      phone: phone || null,
      bio: bio || null,
      id_proof_type: idProofType || null,
      id_proof_number: idProofNumber || null,
      cac_number: cacNumber || null,
      notify_email: notifyEmail,
      is_open: isOpen,
      opening_hours:
        openingHours || "Monday - Saturday: 8:00 AM - 6:00 PM",
      id_document_url: idDocumentPath || currentIdUrl || null,
      cac_document_url: cacDocumentPath || currentCacUrl || null,
    })
    .eq("id", vendor.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/vendor/settings");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/kitchens");
  revalidatePath(`/kitchens/${vendor.id}`);

  redirect("/vendor/settings?success=true");
}

export type KitchenLocationState = {
  ok: boolean;
  message: string;
} | null;

/**
 * Moves the kitchen's map pin and/or changes its delivery radius.
 * Every change is written to vendor_location_changes before the profile is
 * updated. The business name is never touched here.
 */
export async function updateKitchenLocation(
  _previous: KitchenLocationState,
  formData: FormData,
): Promise<KitchenLocationState> {
  const vendor = await requireVendor();
  const admin = adminClient();

  const address = textValue(formData, "kitchen_location").slice(0, 500);
  const latitude = Number(textValue(formData, "kitchen_location_latitude"));
  const longitude = Number(textValue(formData, "kitchen_location_longitude"));
  const placeId = textValue(formData, "kitchen_location_place_id").slice(0, 255);
  const radius = Number(textValue(formData, "delivery_radius_km"));

  if (address.length < 5) {
    return { ok: false, message: "Enter your kitchen's full address." };
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return {
      ok: false,
      message: "Choose your kitchen's address from the list or place the pin on the map.",
    };
  }

  if (!(DELIVERY_RADIUS_OPTIONS as readonly number[]).includes(radius)) {
    return { ok: false, message: "Choose a delivery distance from the list." };
  }

  const { data: current, error: readError } = await admin
    .from("profiles")
    .select("location, location_latitude, location_longitude, delivery_radius_km")
    .eq("id", vendor.id)
    .single();

  if (readError || !current) {
    return { ok: false, message: "Your kitchen details could not be loaded. Please try again." };
  }

  const unchanged =
    current.location === address &&
    current.location_latitude === latitude &&
    current.location_longitude === longitude &&
    current.delivery_radius_km === radius;

  if (unchanged) {
    return { ok: true, message: "Nothing to save: your location and delivery distance are unchanged." };
  }

  const { data: logRow, error: logError } = await admin
    .from("vendor_location_changes")
    .insert({
      vendor_id: vendor.id,
      changed_by: vendor.id,
      old_location: current.location,
      new_location: address,
      old_latitude: current.location_latitude,
      old_longitude: current.location_longitude,
      new_latitude: latitude,
      new_longitude: longitude,
      old_radius_km: current.delivery_radius_km,
      new_radius_km: radius,
    })
    .select("id")
    .single();

  if (logError || !logRow) {
    console.error("Kitchen location log error:", logError?.message);
    return { ok: false, message: "Your change could not be saved. Please try again." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      location: address,
      location_latitude: latitude,
      location_longitude: longitude,
      location_place_id: placeId || null,
      delivery_radius_km: radius,
    })
    .eq("id", vendor.id);

  if (updateError) {
    // Keep the log honest: remove the entry for a change that did not happen.
    await admin.from("vendor_location_changes").delete().eq("id", logRow.id);
    console.error("Kitchen location update error:", updateError.message);
    return { ok: false, message: "Your change could not be saved. Please try again." };
  }

  revalidatePath("/vendor/settings");
  revalidatePath("/kitchens");
  revalidatePath(`/kitchens/${vendor.id}`);

  return { ok: true, message: "Kitchen location and delivery distance saved." };
}
