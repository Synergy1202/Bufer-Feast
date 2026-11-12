import { apiError, guard, readJson, reply } from "@/lib/server/http";
import { buildQuote } from "@/lib/server/orders";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    guard(request);
    const { body } = await readJson(request);
    return reply({ quote: buildQuote(body) });
  } catch (error) {
    return apiError(error);
  }
}
