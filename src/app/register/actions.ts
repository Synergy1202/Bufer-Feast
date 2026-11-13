"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/server/admin";

type RegistrationState = { error?: string };

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeSignupError(error: { code?: string; status?: number; message?: string }) {
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();

  console.error("[customer-signup] Supabase auth error", {
    code,
    status: error.status,
    message: error.message,
  });

  if (error.status === 429 || code === "over_email_send_rate_limit") {
    return "Too many verification emails have been requested. Please wait a few minutes and try again.";
  }
  if (code === "email_address_not_authorized") {
    return "The development email sender does not allow this recipient. Use an authorised test email or check your SMTP settings.";
  }
  if (code === "user_already_exists" || code === "email_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Log in or use the resend-confirmation-link option if you have not verified it yet.";
  }
  if (code === "weak_password" || message.includes("password")) {
    return "Please choose a stronger password with at least 8 characters.";
  }
  if (message.includes("smtp") || message.includes("email") && message.includes("send")) {
    return "We couldn't send your verification email. Please try again shortly.";
  }
  return "We couldn't create your account. Please check your details and try again.";
}

function profileFromMetadata(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata || {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name.trim() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : "";
  const address = typeof metadata.primary_address === "string" ? metadata.primary_address.trim() : "";
  const latitude = typeof metadata.primary_address_latitude === "number" ? metadata.primary_address_latitude : null;
  const longitude = typeof metadata.primary_address_longitude === "number" ? metadata.primary_address_longitude : null;
  const placeId = typeof metadata.primary_address_place_id === "string" ? metadata.primary_address_place_id : null;

  return {
    id: user.id,
    email: (user.email || "").toLowerCase(),
    full_name: fullName,
    phone: phone || null,
    role: "customer",
    status: "pending",
    birthday: typeof metadata.birthday === "string" && metadata.birthday ? metadata.birthday : null,
    primary_address: address || null,
    primary_address_latitude: latitude,
    primary_address_longitude: longitude,
    primary_address_place_id: placeId,
    marketing_opt_in: metadata.marketing_opt_in === true,
  };
}

async function saveCustomerProfile(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}, submitted?: {
  email: string;
  fullName: string;
  phone: string;
  birthday: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  marketing: boolean;
}) {
  const profile = submitted
    ? {
        id: user.id,
        email: submitted.email,
        full_name: submitted.fullName,
        phone: submitted.phone,
        role: "customer",
        status: "pending",
        birthday: submitted.birthday || null,
        primary_address: submitted.address,
        primary_address_latitude: submitted.latitude,
        primary_address_longitude: submitted.longitude,
        primary_address_place_id: submitted.placeId,
        marketing_opt_in: submitted.marketing,
      }
    : profileFromMetadata(user);

  const { error } = await adminClient()
    .from("profiles")
    .upsert(profile, { onConflict: "id" });

  if (error) {
    console.error("[customer-signup] profiles upsert failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: user.id,
    });
    return false;
  }
  return true;
}

export async function registerCustomer(
  _previous: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const phone = field(formData, "phone");
  const birthday = field(formData, "birthday");
  const address = field(formData, "primary_address");
  const latitudeValue = field(formData, "primary_address_latitude");
  const longitudeValue = field(formData, "primary_address_longitude");
  const latitudeNumber = latitudeValue ? Number(latitudeValue) : NaN;
  const longitudeNumber = longitudeValue ? Number(longitudeValue) : NaN;
  const latitude = Number.isFinite(latitudeNumber) && Math.abs(latitudeNumber) <= 90 ? latitudeNumber : null;
  const longitude = Number.isFinite(longitudeNumber) && Math.abs(longitudeNumber) <= 180 ? longitudeNumber : null;
  const placeId = field(formData, "primary_address_place_id") || null;
  const marketing = formData.get("marketing_opt_in") === "on" || formData.get("marketing_opt_in") === "true";

  if (!email || !password || !firstName || !lastName || !phone) {
    return { error: "Please complete all required account fields." };
  }
  if (!address) return { error: "Please enter your primary delivery address." };
  if (password.length < 8) return { error: "Password must contain at least 8 characters." };

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[customer-signup] Supabase URL or publishable key is not configured.");
    return { error: "Customer registration is temporarily unavailable. Please contact support." };
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
  let isExistingUnverifiedAccount = false;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bufer-feast.vercel.app";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/confirm`,
        data: {
          full_name: fullName,
          phone,
          role: "customer",
          birthday: birthday || null,
          primary_address: address,
          primary_address_latitude: latitude,
          primary_address_longitude: longitude,
          primary_address_place_id: placeId,
          marketing_opt_in: marketing,
        },
      },
    });

    if (error) return { error: safeSignupError(error) };
    if (!data.user) return { error: "We couldn't create your account. Please try again." };

    user = data.user;

    // Supabase may return an empty identities array for an email that already exists.
    // Recover only an unverified customer created by this signup flow. Never overwrite another account.
    if (data.user.identities?.length === 0) {
      isExistingUnverifiedAccount = true;
      const { data: authLookup, error: authLookupError } = await adminClient()
        .auth.admin.getUserById(data.user.id);

      if (authLookupError || !authLookup.user ||
          authLookup.user.email?.toLowerCase() !== email ||
          authLookup.user.user_metadata?.role !== "customer" ||
          authLookup.user.email_confirmed_at) {
        return { error: "An account with this email already exists. Please log in or request help recovering it." };
      }
      user = authLookup.user;
    }

    const saved = await saveCustomerProfile(
      user,
      isExistingUnverifiedAccount
        ? undefined
        : { email, fullName, phone, birthday, address, latitude, longitude, placeId, marketing },
    );

    if (!saved) {
      return {
        error: "Your login has been created, but your customer profile could not be saved. Please try Create Account once more with the same email to recover the pending registration.",
      };
    }
  } catch (error) {
    console.error("[customer-signup] Unexpected registration failure", {
      message: error instanceof Error ? error.message : "Unknown error",
      userId: user?.id,
      existingPendingAccount: isExistingUnverifiedAccount,
    });
    if (user) {
      return {
        error: "Your login may already exist, but we couldn't finish saving your profile. Please retry with the same email or contact support.",
      };
    }
    return { error: "We couldn't complete your registration. Please try again. If the problem continues, contact support." };
  }

  redirect(`/check-email?type=customer&email=${encodeURIComponent(email)}`);
}
