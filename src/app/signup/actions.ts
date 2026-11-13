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
    "https://bufer-feast.vercel.app"
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

async function registerVendorImpl(formData: FormData): Promise<string> {
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
        emailRedirectTo: `${getSiteUrl()}/auth/confirm`,
        data: {
          full_name: fullName,
          business_name: businessName,
          phone,
          role: "vendor",
          business_name: businessName,
          vendor_type: vendorType,
          location,
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

  const admin = adminClient();
  let signupUser = authData.user;
  // Recover only an unconfirmed vendor account created by this flow.
  if (signupUser.identities?.length === 0) {
    const { data: lookup, error: lookupError } = await admin.auth.admin.getUserById(signupUser.id);
    if (lookupError || !lookup.user || lookup.user.email?.toLowerCase() !== email ||
        lookup.user.user_metadata?.role !== "vendor" || lookup.user.email_confirmed_at) {
      throw new Error("An account with this email already exists. Please log in or contact support to recover the application.");
    }
    signupUser = lookup.user;
  }
  const userId = signupUser.id;

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
      .select("user_id,status,submitted_at,reapplication_count")
      .eq("user_id", userId)
      .maybeSingle();

    if (applicationLookupError) {
      throw new Error(`Vendor application could not be checked: ${applicationLookupError.message}`);
    }
    if (existingApplication) {
      if (!["pending_review", "pending"].includes(existingApplication.status || "")) {
        throw new Error("A vendor application already exists for this account. Please log in to view its status.");
      }
      const { error: historyError } = await admin.from("fernami_vendor_application_history").upsert({
        user_id: userId,
        attempt_number: (existingApplication.reapplication_count || 0) + 1,
        status: existingApplication.status,
        snapshot: existingApplication,
        submitted_at: existingApplication.submitted_at || new Date().toISOString(),
      }, { onConflict: "user_id,attempt_number", ignoreDuplicates: true });
      if (historyError) throw new Error("The existing vendor application history could not be recovered.");
      return email;
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

    const { data: savedApplication, error: savedApplicationError } = await admin
      .from("fernami_vendor_applications")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (savedApplicationError || !savedApplication) {
      throw new Error("The vendor application was saved but its history could not be initialized.");
    }
    const { error: historyError } = await admin.from("fernami_vendor_application_history").upsert({
      user_id: userId,
      attempt_number: (savedApplication.reapplication_count || 0) + 1,
      status: savedApplication.status || "pending_review",
      snapshot: savedApplication,
      submitted_at: savedApplication.submitted_at || now,
    }, { onConflict: "user_id,attempt_number", ignoreDuplicates: true });
    if (historyError) throw new Error("Vendor application history could not be saved.");
  } catch (error) {
    // Preserve Auth and profile records so incomplete registrations can be recovered safely.
    console.error("[vendor-signup] profile/application persistence failed", {
      userId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    if (error instanceof Error) throw error;
    throw new Error("Vendor application could not be completed. Please retry with the same email.");
  }

  return email;
}

function safeVendorSignupMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/Missing required fields|Please |must |You must /i.test(message)) return message;
  if (/already exists|already registered|duplicate key/i.test(message)) return "A vendor account or application already exists for this email. Please log in to check its status.";
  if (/rate limit|too many/i.test(message)) return "Too many confirmation emails have been requested. Please wait before trying again.";
  if (/not configured|Missing Supabase/i.test(message)) return "Vendor registration is temporarily unavailable. Please contact support.";
  return "We couldn't complete your vendor application. Your account may have been saved. Please retry with the same email or contact support.";
}

export async function registerVendor(formData: FormData) {
  let email = "";
  try {
    email = await registerVendorImpl(formData);
  } catch (error) {
    console.error("[vendor-signup] registration failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    redirect(`/signup?error=${encodeURIComponent(safeVendorSignupMessage(error))}`);
  }
  redirect(`/check-email?type=vendor&email=${encodeURIComponent(email)}`);
}
