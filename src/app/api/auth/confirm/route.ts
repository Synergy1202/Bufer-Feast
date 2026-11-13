import { cookies } from "next/headers";
import { adminClient } from "@/lib/server/admin";
import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { authRateLimit } from "@/lib/server/auth-rate";
import { AuthProblem } from "@/lib/server/problems";
import { apiError, guard, reply } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    guard(request);
    authRateLimit(request, "confirm");
    const jar = await cookies(),
      encoded = jar.get("jie_bulk_order-pending-confirmation")?.value;
    let value: { hash?: unknown; type?: unknown } | null = null;
    try {
      if (encoded)
        value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    } catch {}
    if (
      !value ||
      typeof value.hash !== "string" ||
      value.hash.length > 1024 ||
      value.type !== "email"
    )
      throw new AuthProblem(
        "Open the confirmation link from your own email first. The temporary link may have expired.",
        400,
        "AUTH_CONFIRM_MISSING",
      );
    const client = await authClient();
    const { data, error } = await client.auth.verifyOtp({
      token_hash: value.hash,
      type: "email",
    });
    jar.set("jie_bulk_order-pending-confirmation", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
    if (error) throw safeAuthFailure(error, "confirm");
    if (!data.user) throw new AuthProblem("The confirmation link could not be matched to an account.", 400, "AUTH_CONFIRM_USER_MISSING");
    const admin = adminClient();
    const { data: profile, error: lookupError } = await admin.from("profiles")
      .select("role,status,email,primary_address").eq("id", data.user.id).maybeSingle();
    if (lookupError) {
      console.error("[auth-confirm] profile lookup failed", { code: lookupError.code, message: lookupError.message, userId: data.user.id });
      throw new AuthProblem("Your account profile could not be loaded. Please contact support.", 503, "PROFILE_UNAVAILABLE");
    }
    if (!profile || (profile.email && profile.email.toLowerCase() !== (data.user.email || "").toLowerCase())) {
      throw new AuthProblem("Your account profile could not be matched to this verified email.", 403, "PROFILE_MISMATCH");
    }
    if (profile.role === "customer" && profile.status === "pending") {
      const { error: statusError } = await admin.from("profiles")
        .update({ status: "active" }).eq("id", data.user.id).eq("role", "customer").eq("status", "pending");
      if (statusError) {
        console.error("[auth-confirm] customer activation failed", { code: statusError.code, message: statusError.message, userId: data.user.id });
        throw new AuthProblem("Your email is confirmed, but your account could not be activated. Please contact support.", 503, "PROFILE_ACTIVATION_FAILED");
      }
    } else if (profile.role === "vendor") {
      const { data: application, error: applicationError } = await admin.from("fernami_vendor_applications")
        .select("user_id,email,status").eq("user_id", data.user.id).maybeSingle();
      if (applicationError || !application || (application.email || "").toLowerCase() !== (data.user.email || "").toLowerCase()) {
        console.error("[auth-confirm] vendor application check failed", { code: applicationError?.code, message: applicationError?.message, userId: data.user.id });
        throw new AuthProblem("Your vendor application could not be verified. Please contact support.", 503, "VENDOR_APPLICATION_UNAVAILABLE");
      }
    } else {
      throw new AuthProblem("This account cannot use public email confirmation.", 403, "ACCOUNT_ROLE_INVALID");
    }
    return reply({ ok: true, signedIn: !!data.session, role: profile.role, status: profile.status, hasAddress: !!profile.primary_address });
  } catch (error) {
    return apiError(error);
  }
}
