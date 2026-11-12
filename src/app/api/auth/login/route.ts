import { loginSchema } from "@/lib/auth-validation";
import { authClient, safeAuthFailure } from "@/lib/server/auth";
import { authRateLimit } from "@/lib/server/auth-rate";
import { AuthProblem } from "@/lib/server/problems";
import { apiError, guard, readJson, reply } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guard(request);
    authRateLimit(request, "login");

    const { body } = await readJson(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success)
      throw new AuthProblem(
        "Enter a valid email and password.",
        400,
        "AUTH_INVALID_INPUT",
      );

    const client = await authClient();
    const { data, error } = await client.auth.signInWithPassword(parsed.data);

    if (error) throw safeAuthFailure(error, "login");

    // ✅ REMOVED: The email_confirmed_at check so you can login instantly
    
    return reply({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}