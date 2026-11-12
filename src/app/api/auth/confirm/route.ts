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
    if (data.user) {
      const admin = adminClient();
      const { data: profile, error: lookupError } = await admin.from("profiles")
        .select("role,status").eq("id", data.user.id).maybeSingle();
      if (lookupError) throw lookupError;
      if (profile?.role === "customer" && profile.status === "pending") {
        const { error: statusError } = await admin.from("profiles")
          .update({ status: "active" }).eq("id", data.user.id);
        if (statusError) throw statusError;
      }
    }
    return reply({ ok: true, signedIn: !!data.session });
  } catch (error) {
    return apiError(error);
  }
}
