import { NextResponse } from "next/server";
import { markOrderPaid, verifyPaystackSignature } from "@/lib/server/paystack";

export async function POST(request: Request) {
  const body = await request.text();
  try {
    if (!verifyPaystackSignature(body, request.headers.get("x-paystack-signature"))) {
      return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
    }

    const event = JSON.parse(body) as { event?: string; data?: { reference?: string } };
    if (event.event === "charge.success" && event.data?.reference) {
      await markOrderPaid(event.data.reference);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook failed", error);
    return NextResponse.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
