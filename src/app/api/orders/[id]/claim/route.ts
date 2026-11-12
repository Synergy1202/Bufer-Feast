import { requireCustomer } from "@/lib/server/auth";
import { apiError, guard, reply, readJson } from "@/lib/server/http";
import { AuthProblem } from "@/lib/server/problems";
import { claimGuestOrder } from "@/lib/server/orders";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    guard(request);
    const user = await requireCustomer(),
      { id } = await context.params;
    const { body } = await readJson(request);
    if (
      !body ||
      typeof body !== "object" ||
      !("expectedAccountId" in body) ||
      body.expectedAccountId !== user.id
    )
      throw new AuthProblem(
        "The signed-in account changed. Review the link action again.",
        409,
        "ACCOUNT_CHANGED",
      );
    const key =
      request.headers
        .get("authorization")
        ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1] || null;
    return reply({ order: await claimGuestOrder(id, key, user.id) });
  } catch (error) {
    return apiError(error);
  }
}
