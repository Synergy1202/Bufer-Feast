import { z } from "zod";
import { adminClient } from "@/lib/server/admin";
import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { authRateLimit } from "@/lib/server/auth-rate";
import { AuthProblem } from "@/lib/server/problems";
import { apiError, guard, readJson, reply } from "@/lib/server/http";

export const runtime = "nodejs";

const otpSchema = z.object({
  email: z.string().trim().email().max(320),
  token: z.string().regex(/^\\d{6}$/, "Enter the six-digit code from your email."),
});

export async function POST(request: Request) {
  try {
    guard(request);
    authRateLimit(request, "verify-otp");
    const { body } = await readJson(request);
    const parsed = otpSchema.safeParse(body);
    if (!parsed.success) {
      throw new AuthProblem("Enter a valid email address and six-digit code.", 400, "AUTH_INVALID_INPUT");
    }

    const email = parsed.data.email.toLowerCase();
    const client = await authClient();
    const { data, error } = await client.auth.verifyOtp({
      email,
      token: parsed.data.token,
      type: "signup",
    });
    if (error) throw safeAuthFailure(error, "confirm");
    if (!data.user) throw new AuthProblem("Email verification could not be completed. Please try again.", 400, "AUTH_CONFIRM_FAILED");

    const admin = adminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,email,role,status")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) throw new AuthProblem("Your account profile could not be checked. Please contact support.", 503, "PROFILE_UNAVAILABLE");
    if (!profile || (profile.email || "").toLowerCase() !== email) {
      throw new AuthProblem("The verified email does not match a registered account profile.", 403, "PROFILE_MISMATCH");
    }

    if (profile.role === "customer") {
      if (profile.status === "pending") {
        const { error: updateError } = await admin
          .from("profiles")
          .update({ status: "active" })
          .eq("id", data.user.id)
          .eq("role", "customer")
          .eq("status", "pending");
        if (updateError) throw new AuthProblem("Your email was verified, but your profile status could not be updated. Please contact support.", 503, "PROFILE_UPDATE_FAILED");
      }
    } else if (profile.role === "vendor") {
      const { data: application, error: applicationError } = await admin
        .from("fernami_vendor_applications")
        .select("user_id,email,status")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (applicationError) throw new AuthProblem("Your vendor application could not be checked. Please contact support.", 503, "VENDOR_APPLICATION_UNAVAILABLE");
      if (!application || (application.email || "").toLowerCase() !== email) {
        throw new AuthProblem("Your vendor application could not be matched to this verified email.", 403, "VENDOR_APPLICATION_MISMATCH");
      }
      // Email verification does not approve the application. Its existing review status is preserved.
    } else {
      throw new AuthProblem("This account type cannot complete public signup verification.", 403, "ACCOUNT_ROLE_INVALID");
    }

    return reply({ ok: true, role: profile.role, signedIn: !!data.session });
  } catch (error) {
    return apiError(error);
  }
}
