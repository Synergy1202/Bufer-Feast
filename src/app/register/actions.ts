"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/server/admin";

type RegistrationState = { error?: string };

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerCustomer(previous: RegistrationState, formData: FormData): Promise<RegistrationState> {
  void previous;
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const firstName = field(formData, "first_name");
  const lastName = field(formData, "last_name");
  const phone = field(formData, "phone");
  const birthday = field(formData, "birthday");
  const address = field(formData, "primary_address");
  const marketing = formData.get("marketing_opt_in") === "on" || formData.get("marketing_opt_in") === "true";

  if (!email || !password || !firstName || !lastName || !phone) return { error: "Please complete all required account fields." };
  if (!address) return { error: "Please enter your primary delivery address." };
  if (password.length < 8) return { error: "Password must contain at least 8 characters." };

  let accountCreated = false;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase public configuration is incomplete.");
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bufer-feast.vercel.app";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: siteUrl + "/auth/callback",
        data: {
          full_name: firstName + " " + lastName,
          phone,
          role: "customer",
          birthday: birthday || null,
          primary_address: address,
          marketing_opt_in: marketing,
        },
      },
    });

    if (error) {
      console.error("[customer-signup] auth.signUp failed", { code: error.code, status: error.status, message: error.message });
      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        return { error: "Too many verification emails have been requested. Please wait a few minutes and try again." };
      }
      if (error.code === "user_already_exists" || error.code === "email_exists" || error.message.toLowerCase().includes("already registered")) {
        return { error: "An account with this email already exists. Please log in or reset your password." };
      }
      return { error: "Supabase could not create your account or send its verification email. Please check your details and try again." };
    }
    if (!data.user) return { error: "We couldn't create your account. Please try again." };
    if (data.user.identities?.length === 0) return { error: "An account with this email already exists. Please log in or reset your password." };
    accountCreated = true;

    const { error: profileError } = await adminClient().from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: firstName + " " + lastName,
      phone,
      role: "customer",
      status: "pending",
      birthday: birthday || null,
      primary_address: address,
      marketing_opt_in: marketing,
    }, { onConflict: "id" });

    if (profileError) {
      console.error("[customer-signup] profiles upsert failed", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        userId: data.user.id,
      });
      redirect("/check-email?type=customer&email=" + encodeURIComponent(email));
    }
  } catch (error) {
    console.error("[customer-signup] unexpected failure", error);
    if (accountCreated) redirect("/check-email?type=customer&email=" + encodeURIComponent(email));
    return { error: "We couldn't complete your registration. Please try again. If it continues, contact support." };
  }

  redirect("/check-email?type=customer&email=" + encodeURIComponent(email));
}
