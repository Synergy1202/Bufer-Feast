import { authClient, clearCustomerCookies } from "@/lib/server/auth";
import { apiError, guard, reply } from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    guard(request);
    let remoteRevocationConfirmed = false;
    try {
      const client = await authClient();
      const { error } = await client.auth.signOut({ scope: "local" });
      remoteRevocationConfirmed = !error;
    } catch {
    } finally {
      await clearCustomerCookies();
    }
    return reply({ ok: true, remoteRevocationConfirmed });
  } catch (error) {
    return apiError(error);
  }
}
