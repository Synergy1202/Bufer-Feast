import { NextResponse } from "next/server";
import { authClient } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=invalid_confirmation_link", url.origin));

  const client = await authClient();
  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=confirmation_failed", url.origin));

  const user = data.user;
  const admin = adminClient();
  const { data: existing, error: lookupError } = await admin.from("profiles")
    .select("role,primary_address,status").eq("id", user.id).maybeSingle();
  if (lookupError) throw new Error(`Unable to load account profile: ${lookupError.message}`);
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
    if (insertError) throw new Error(`Unable to create account profile: ${insertError.message}`);
  }
  if (role === "customer" && user.email_confirmed_at && existing?.status === "pending") {
    const { error: statusError } = await admin.from("profiles").update({ status: "active" }).eq("id", user.id);
    if (statusError) throw new Error(`Could not update account verification status: ${statusError.message}`);
  }
  if (role === "customer" && !(existing?.primary_address || user.user_metadata?.primary_address)) {
    return NextResponse.redirect(new URL("/account/address", url.origin));
  }
  return NextResponse.redirect(new URL(role === "vendor" ? "/vendor/pending" : "/", url.origin));
}
