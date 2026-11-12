import { z } from "zod";
import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { authRateLimit } from "@/lib/server/auth-rate";
import { AuthProblem } from "@/lib/server/problems";
import { apiError, guard, readJson, reply } from "@/lib/server/http";

export const runtime = "nodejs";

const resendSchema = z.object({ email: z.string().trim().email().max(320) });

export async function POST(request: Request) {
  try {
    guard(request);
    authRateLimit(request, "resend-otp");
    const { body } = await readJson(request);
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) throw new AuthProblem("Enter a valid email address.", 400, "AUTH_INVALID_INPUT");

    const client = await authClient();
    const { error } = await client.auth.resend({
      type: "signup",
      email: parsed.data.email.toLowerCase(),
    });
    if (error) throw safeAuthFailure(error, "confirm");

    return reply({ ok: true, message: "If this account is awaiting verification, a new six-digit code has been sent." });
  } catch (error) {
    return apiError(error);
  }
}
