import { NextResponse } from "next/server";
import { authClient, requireCustomer } from "@/lib/server/auth";
import { initializePaystackPayment } from "@/lib/server/paystack";

export async function GET(request: Request) {
  try {
    const customer = await requireCustomer();
    const orderId = new URL(request.url).searchParams.get("order_id")?.trim();
    if (!orderId) return NextResponse.json({ message: "Order is required." }, { status: 400 });

    const client = await authClient();
    const { data: order, error } = await client
      .from("orders")
      .select("id, total_price, delivery_fee, payment_status, payment_reference")
      .eq("id", orderId)
      .eq("user_id", customer.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (order.payment_status === "paid") return NextResponse.redirect(new URL(`/orders/${order.id}?payment=already-paid`, request.url));

    const payment = await initializePaystackPayment({
      email: customer.email,
      orderId: order.id,
      amountNaira: Number(order.total_price) + Number(order.delivery_fee || 0),
    });

    const { error: updateError } = await client
      .from("orders")
      .update({ payment_reference: payment.reference, payment_status: "pending" })
      .eq("id", order.id)
      .eq("user_id", customer.id);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.redirect(payment.authorization_url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start payment.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
