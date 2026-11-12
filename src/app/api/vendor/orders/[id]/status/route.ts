import { authClient, requireVendor } from "@/lib/server/auth";
import { apiError, guard, readJson, reply } from "@/lib/server/http";
import { z } from "zod";

export const runtime = "nodejs";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    guard(request);
    
    // Ensure user is a logged-in vendor
    const user = await requireVendor();
    const { id } = await params; // Next.js 16 requires awaiting params
    
    const { body } = await readJson(request);
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ message: "Invalid status" }), { status: 400 });
    }

    const client = await authClient();

    // 1. Check if order exists and belongs to this vendor
    const { data: order, error: fetchError } = await client
      .from("orders")
      .select("id, vendor_id")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ message: "Order not found" }), { status: 404 });
    }

    if (order.vendor_id !== user.id) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 403 });
    }

    // 2. Update the status
    const { error: updateError } = await client
      .from("orders")
      .update({ status: parsed.data.status })
      .eq("id", id);

    if (updateError) throw updateError;

    return reply({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}