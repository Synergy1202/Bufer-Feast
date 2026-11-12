import { sessionStatus } from "@/lib/server/auth";
import { apiError, guard, reply } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    guard(request);
    return reply(await sessionStatus());
  } catch (error) {
    return apiError(error);
  }
}
