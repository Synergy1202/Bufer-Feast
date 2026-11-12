import { requireCustomer } from "@/lib/server/auth";
import { apiError, guard, reply } from "@/lib/server/http";
import { listAccountOrders } from "@/lib/server/orders";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    guard(request);
    const user = await requireCustomer();
    return reply({ orders: await listAccountOrders(user.id) });
  } catch (error) {
    return apiError(error);
  }
}
