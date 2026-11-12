import "server-only";
import { AuthProblem } from "./problems";
const attempts = new Map<string, { start: number; count: number }>();
export function authRateLimit(request: Request, action: string) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const key = `${action}:${ip}`,
    now = Date.now();
  let state = attempts.get(key);
  if (!state || now - state.start > 10 * 60 * 1000)
    state = { start: now, count: 0 };
  state.count++;
  attempts.set(key, state);
  if (state.count > 10)
    throw new AuthProblem(
      "Too many authentication attempts. Wait before trying again.",
      429,
      "AUTH_RATE_LIMIT",
    );
  if (attempts.size > 1000)
    for (const [entry, value] of attempts)
      if (now - value.start > 10 * 60 * 1000) attempts.delete(entry);
}
