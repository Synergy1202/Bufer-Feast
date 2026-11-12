"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/server/admin";

function getField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function publicSupabaseClient() {
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

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  );
}

export async function registerCustomer(
  formData: FormData,
): Promise<void> {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");

  const firstName = getField(formData, "first_name");
  const lastName = getField(formData, "last_name");
  const phone = getField(formData, "phone");

  const birthday = getField(formData, "birthday");
  const referralCode = getField(formData, "referral_code");
  const primaryAddress = getField(
    formData,
    "primary_address",
  );

  const latitudeRaw = getField(formData, "primary_address_latitude");
  const longitudeRaw = getField(formData, "primary_address_longitude");
  const latitude = latitudeRaw && Number.isFinite(Number(latitudeRaw)) && Math.abs(Number(latitudeRaw)) <= 90 ? Number(latitudeRaw) : null;
  const longitude = longitudeRaw && Number.isFinite(Number(longitudeRaw)) && Math.abs(Number(longitudeRaw)) <= 180 ? Number(longitudeRaw) : null;
  const placeId = getField(formData, "primary_address_place_id");

  const marketingOptIn =
    formData.get("marketing_opt_in") === "on" ||
    formData.get("marketing_opt_in") === "true";

  if (!email || !password || !firstName || !lastName || !phone) {
    throw new Error(
      "Please complete all required account fields.",
    );
  }

  if (!primaryAddress) {
    throw new Error("Please enter your primary delivery address.");
  }

  if (password.length < 8) {
    throw new Error(
      "Password must contain at least 8 characters.",
    );
  }

  const supabase = publicSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: {
        full_name: `${firstName} ${lastName}`,
        phone,
        role: "customer",
        birthday: birthday || null,
        referral_code: referralCode || null,
        marketing_opt_in: marketingOptIn,
        primary_address: primaryAddress,
        primary_address_latitude: latitude,
        primary_address_longitude: longitude,
        primary_address_place_id: placeId || null,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("The customer account could not be created.");
  }

  // Persist in the same table the admin customer dashboard actually reads.
  // This also works when email confirmation has not yet been completed.
  const { error: profileError } = await adminClient().from("profiles").upsert({
    id: data.user.id, email, full_name: `${firstName} ${lastName}`, phone,
    role: "customer", status: "pending", birthday: birthday || null,
    primary_address: primaryAddress, marketing_opt_in: marketingOptIn,
    primary_address_latitude: latitude, primary_address_longitude: longitude,
    primary_address_place_id: placeId || null,
  }, { onConflict: "id" });
  if (profileError) {
    throw new Error(`Account created, but the customer profile was not saved: ${profileError.message}. Contact support before registering again.`);
  }

  redirect(
    `/check-email?type=customer&email=${encodeURIComponent(email)}`,
  );
}