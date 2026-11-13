import { NextResponse } from "next/server";
import { authClient } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const runtime = "nodejs";

function failure(url: URL, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const code = url.searchParams.get("code");
    if (!code) return failure(url, "invalid_confirmation_link");

    const client = await authClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error("[auth-callback] code exchange failed", { code: error?.code, message: error?.message });
      return failure(url, "confirmation_failed");
    }

    const user = data.user;
    const admin = adminClient();
    const { data: existing, error: lookupError } = await admin.from("profiles")
      .select("role,primary_address,status,email").eq("id", user.id).maybeSingle();
    if (lookupError) {
      console.error("[auth-callback] profile lookup failed", { code: lookupError.code, message: lookupError.message, userId: user.id });
      return failure(url, "profile_unavailable");
    }

    const role = existing?.role || (user.user_metadata?.role === "vendor" ? "vendor" : "customer");
    if (!existing) {
      const { error: insertError } = await admin.from("profiles").upsert({
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        phone: user.user_metadata?.phone || null,
        primary_address: user.user_metadata?.primary_address || null,
        role,
        status: "pending",
      }, { onConflict: "id" });
      if (insertError) {
        console.error("[auth-callback] profile recovery failed", { code: insertError.code, message: insertError.message, userId: user.id });
        return failure(url, "profile_recovery_failed");
      }
    }

    if (role === "vendor") {
      const { data: application, error: applicationError } = await admin.from("fernami_vendor_applications")
        .select("user_id,email,status").eq("user_id", user.id).maybeSingle();
      if (applicationError || !application || (application.email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
        console.error("[auth-callback] vendor application lookup failed", { code: applicationError?.code, message: applicationError?.message, userId: user.id });
        return failure(url, "vendor_application_unavailable");
      }
      return NextResponse.redirect(new URL(application.status === "approved" ? "/vendor/dashboard" : "/vendor/pending", url.origin));
    }

    if (role !== "customer") return failure(url, "account_role_invalid");
    if (user.email_confirmed_at && existing?.status === "pending") {
      const { error: statusError } = await admin.from("profiles").update({ status: "active" })
        .eq("id", user.id).eq("role", "customer").eq("status", "pending");
      if (statusError) {
        console.error("[auth-callback] customer activation failed", { code: statusError.code, message: statusError.message, userId: user.id });
        return failure(url, "profile_activation_failed");
      }
    }
    if (!(existing?.primary_address || user.user_metadata?.primary_address)) {
      return NextResponse.redirect(new URL("/account/address", url.origin));
    }
    return NextResponse.redirect(new URL("/account", url.origin));
  } catch (error) {
    console.error("[auth-callback] unexpected failure", error instanceof Error ? error.message : "Unknown error");
    return failure(url, "confirmation_failed");
  }
}
