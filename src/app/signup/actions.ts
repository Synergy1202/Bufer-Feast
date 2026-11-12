"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/server/admin";

function getField(formData: FormData, ...names: string[]) {
  for (const name of names) {
    const value = formData.get(name);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getFile(formData: FormData, name: string): File | null {
  const value = formData.get(name);

  if (!(value instanceof File)) {
    return null;
  }

  if (value.size === 0) {
    return null;
  }

  return value;
}

function normalizeCategory(value: string) {
  const category = value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    category === "home food" ||
    category === "home kitchen" ||
    category === "food vendor"
  ) {
    return "home_food";
  }

  if (
    category === "restaurant" ||
    category === "restaurants"
  ) {
    return "restaurant";
  }

  if (
    category === "local dish" ||
    category === "local dishes" ||
    category === "local food" ||
    category === "caterer" ||
    category === "catering"
  ) {
    return "local_dish";
  }

  return "";
}

function getSupabasePublicClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing Supabase URL.");
  }

  if (!key) {
    throw new Error("Missing Supabase publishable key.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

function validateFile(file: File, label: string) {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  const maximumSize = 10 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `${label} must be a PDF, JPG, or PNG file.`,
    );
  }

  if (file.size > maximumSize) {
    throw new Error(
      `${label} must not be larger than 10 MB.`,
    );
  }
}

function getFileExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return extension || "bin";
}

export async function registerVendor(formData: FormData) {
  if (formData.get("commission_terms") !== "accepted") {
    throw new Error("You must accept the Bufer Feast commission terms.");
  }
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");

  const fullName = getField(
    formData,
    "full_name",
    "fullName",
    "name",
  );

  const phone = getField(
    formData,
    "phone",
    "phone_number",
    "telephone",
  );

  const businessName = getField(
    formData,
    "business_name",
    "businessName",
  );

  const rawVendorType = getField(
    formData,
    "vendor_type",
    "vendorType",
    "category",
  );

  const vendorType = normalizeCategory(rawVendorType);

  const location = getField(
    formData,
    "location",
    "kitchen_location",
    "address",
  );

  const locationLatitudeRaw = getField(formData, "location_latitude");
  const locationLatitude = locationLatitudeRaw ? Number(locationLatitudeRaw) : NaN;
  const locationLongitudeRaw = getField(formData, "location_longitude");
  const locationLongitude = locationLongitudeRaw ? Number(locationLongitudeRaw) : NaN;
  const locationPlaceId = getField(formData, "location_place_id");

  const idProofType = getField(
    formData,
    "id_proof_type",
    "id_type",
    "identity_type",
    "identification_type",
  );

  const idProofNumber = getField(
    formData,
    "id_proof_number",
    "id_number",
    "identity_number",
    "identification_number",
  );

  const cacNumber = getField(
    formData,
    "cac_number",
    "cacNumber",
  );

  const bankName = getField(
    formData,
    "bank_name",
    "bankName",
  );

  const accountNumber = getField(
    formData,
    "account_number",
    "accountNumber",
  );

  const accountName = getField(
    formData,
    "account_name",
    "accountName",
  );

  const idDocument = getFile(formData, "id_document");
  const cacDocument = getFile(formData, "cac_document");

  const requiredFields = [
    {
      label: "Email address",
      value: email,
    },
    {
      label: "Password",
      value: password,
    },
    {
      label: "Full legal name",
      value: fullName,
    },
    {
      label: "Phone number",
      value: phone,
    },
    {
      label: "Business name",
      value: businessName,
    },
    {
      label: "Vendor type",
      value: rawVendorType,
    },
    {
      label: "Kitchen location",
      value: location,
    },
    {
      label: "ID proof type",
      value: idProofType,
    },
    {
      label: "ID proof number",
      value: idProofNumber,
    },
    {
      label: "CAC registration number",
      value: cacNumber,
    },
  ];

  const missingFields = requiredFields
    .filter((field) => !field.value)
    .map((field) => field.label);

  if (!idDocument) {
    missingFields.push("Identity document");
  }

  if (!cacDocument) {
    missingFields.push("CAC document");
  }

  if (missingFields.length > 0) {
    console.log("Missing vendor signup fields:", {
      missingFields,
      receivedKeys: Array.from(formData.keys()),
    });

    throw new Error(
      `Missing required fields: ${missingFields.join(", ")}`,
    );
  }

  /*
   * These explicit checks narrow both values from
   * File | null to File for TypeScript.
   */
  if (!idDocument) {
    throw new Error(
      "Please upload your identity document.",
    );
  }

  if (!cacDocument) {
    throw new Error(
      "Please upload your CAC certificate.",
    );
  }

  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters.",
    );
  }

  if (fullName.length < 2 || fullName.length > 120) {
    throw new Error(
      "Full legal name must be between 2 and 120 characters.",
    );
  }

  if (businessName.length < 2 || businessName.length > 120) {
    throw new Error(
      "Business name must be between 2 and 120 characters.",
    );
  }

  if (location.length < 2 || location.length > 120) {
    throw new Error(
      "Kitchen location must be between 2 and 120 characters.",
    );
  }

  if (
    !["home_food", "restaurant", "local_dish"].includes(
      vendorType,
    )
  ) {
    throw new Error(
      "Please select Home Food, Restaurant, or Local Dish.",
    );
  }

  validateFile(idDocument, "Identity document");
  validateFile(cacDocument, "CAC document");

  const supabase = getSupabasePublicClient();

  const { data: authData, error: authError } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          full_name: fullName,
          business_name: businessName,
          phone,
          role: "vendor",
        },
      },
    });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error(
      "The vendor account could not be created.",
    );
  }

  // Supabase may return an empty identities array for an existing email.
  // Do not treat that response as a new signup or overwrite existing records.
  if (authData.user.identities?.length === 0) {
    throw new Error("An account with this email already exists. Please log in instead.");
  }

  const userId = authData.user.id;
  const admin = adminClient();

  const timestamp = Date.now();

  const idPath =
    `${userId}/identity-${timestamp}.${getFileExtension(idDocument)}`;

  const cacPath =
    `${userId}/cac-${timestamp}.${getFileExtension(cacDocument)}`;

  try {
    const idUpload = await admin.storage
      .from("vendor-documents")
      .upload(idPath, idDocument, {
        contentType: idDocument.type,
        upsert: false,
      });

    if (idUpload.error) {
      throw new Error(
        `Identity document upload failed: ${idUpload.error.message}`,
      );
    }

    const cacUpload = await admin.storage
      .from("vendor-documents")
      .upload(cacPath, cacDocument, {
        contentType: cacDocument.type,
        upsert: false,
      });

    if (cacUpload.error) {
      throw new Error(
        `CAC document upload failed: ${cacUpload.error.message}`,
      );
    }

    const now = new Date().toISOString();

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          phone,
          business_name: businessName,
          vendor_type: vendorType,
          location,
          location_latitude: Number.isFinite(locationLatitude) && Math.abs(locationLatitude) <= 90 ? locationLatitude : null,
          location_longitude: Number.isFinite(locationLongitude) && Math.abs(locationLongitude) <= 180 ? locationLongitude : null,
          location_place_id: locationPlaceId || null,

          role: "vendor",
          status: "pending",
          is_open: false,

          id_proof_type: idProofType,
          id_proof_number: idProofNumber,
          id_document_url: idPath,

          cac_number: cacNumber,
          cac_document_url: cacPath,

          bank_name: bankName || null,
          account_number: accountNumber || null,
          account_name: accountName || null,
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      throw new Error(
        `Vendor profile could not be created: ${profileError.message}`,
      );
    }

    const { data: existingApplication, error: applicationLookupError } = await admin
      .from("fernami_vendor_applications")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (applicationLookupError) {
      throw new Error(`Vendor application could not be checked: ${applicationLookupError.message}`);
    }
    if (existingApplication) {
      throw new Error("A vendor application already exists for this account. Please contact support.");
    }

    const { error: applicationError } = await admin
      .from("fernami_vendor_applications")
      .insert({
        user_id: userId,

        full_legal_name: fullName,
        business_name: businessName,
        category: vendorType,

        public_area: location,
        public_address: location,
        public_address_acknowledged: true,
        public_address_acknowledged_at: now,

        status: "pending_review",
        created_at: now,
        submitted_at: now,

        email,
        full_name: fullName,
        phone,
        vendor_type: vendorType,
        location,

        id_proof_type: idProofType,
        id_proof_number: idProofNumber,
        id_document_url: idPath,

        cac_number: cacNumber,
        cac_document_url: cacPath,

        bank_name: bankName || null,
        account_number: accountNumber || null,
        account_name: accountName || null,
      });

    if (applicationError) {
      throw new Error(
        `Vendor application could not be created: ${applicationError.message}`,
      );
    }
  } catch (error) {
    await admin.storage
      .from("vendor-documents")
      .remove([idPath, cacPath]);

    await admin
      .from("profiles")
      .delete()
      .eq("id", userId);

    await admin.auth.admin.deleteUser(userId);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Vendor application could not be completed.",
    );
  }

  redirect(
    `/verify-email?type=vendor&email=${encodeURIComponent(email)}`,
  );
}