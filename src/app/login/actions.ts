"use server";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/server/auth";

export type LoginState = {
  error: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const email =
    typeof emailValue === "string"
      ? emailValue.trim().toLowerCase()
      : "";

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  if (!email || !password) {
    return {
      error: "Please enter your email and password.",
    };
  }

  const client = await authClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (
      error.code === "email_not_confirmed" ||
      error.message.toLowerCase().includes("email not confirmed")
    ) {
      return {
        error:
          "Please verify your email address before logging in. Check your inbox for the verification link.",
      };
    }

    return {
      error: "Incorrect email or password. Please try again.",
    };
  }

  if (!data.user) {
    return {
      error: "Incorrect email or password. Please try again.",
    };
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError.message);

    return {
      error:
        "Your account profile could not be loaded. Please try again.",
    };
  }

  if (!profile) {
    return {
      error:
        "Your account profile could not be found. Please contact support.",
    };
  }

  /*
   * Administrator routing
   */
  if (
    profile.role === "admin" &&
    profile.status === "active"
  ) {
    redirect("/admin");
  }

  if (profile.role === "admin") {
    return {
      error: "This administrator account is inactive.",
    };
  }

  /*
   * Vendor routing
   */
  if (profile.role === "vendor") {
    if (
      profile.status === "active" ||
      profile.status === "approved"
    ) {
      redirect("/vendor/dashboard");
    }

    if (
      profile.status === "pending" ||
      profile.status === "pending_review"
    ) {
      redirect("/vendor/pending");
    }

    if (profile.status === "rejected") {
      return {
        error:
          "Your vendor application was rejected. Please contact support.",
      };
    }

    if (profile.status === "suspended") {
      return {
        error:
          "Your vendor account is suspended. Please contact support.",
      };
    }

    return {
      error:
        "Your vendor account is not currently approved. Please contact support.",
    };
  }

  /*
   * Customer routing
   */
  if (profile.role === "customer") {
    if (
      profile.status === "active" ||
      profile.status === "approved"
    ) {
      redirect("/");
    }

    return {
      error:
        "Your customer account is not currently active. Please contact support.",
    };
  }

  return {
    error:
      "This account has an invalid role. Please contact support.",
  };
}