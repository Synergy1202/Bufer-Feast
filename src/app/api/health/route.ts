import { authSetupStatus } from "@/lib/server/auth";
import { shiftDay, todayLagos } from "@/lib/format";
import { apiError, guard, reply } from "@/lib/server/http";
import { getStore } from "@/lib/server/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    guard(request);
    const store = await getStore();
    await store.ping();
    const today = todayLagos();
    return reply({
      ok: true,
      version: "0.4.0",
      framework: "Next.js",
      mode: store.mode,
      database:
        store.mode === "local-test"
          ? "SQLite local test adapter"
          : "Supabase PostgreSQL",
      today,
      minimumDate: shiftDay(today, 1),
      maximumDate: shiftDay(today, 30),
      authConfigured: authSetupStatus().configured,
      paymentsConnected: false,
    });
  } catch (error) {
    return apiError(error);
  }
}
