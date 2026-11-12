"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

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