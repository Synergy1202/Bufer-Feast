import { verifiedCustomer } from "@/lib/server/auth";
import { apiError, guard, reply } from "@/lib/server/http";
import { readTestOrder } from "@/lib/server/orders";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    guard(request);
    const { id } = await context.params;
    const token =
      request.headers
        .get("authorization")
        ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || null;
    const user = await verifiedCustomer();
    return reply({ order: await readTestOrder(id, token, user?.id ?? null) });
  } catch (error) {
    return apiError(error);
  }
}
