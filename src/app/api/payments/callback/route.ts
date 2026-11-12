import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/server/paystack";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")?.trim();
  if (!reference) return NextResponse.redirect(new URL("/checkout?payment=missing-reference", request.url));

  try {
    const result = await markOrderPaid(reference);
    if (result.paid && result.orderId) {
      return NextResponse.redirect(new URL(`/orders/${result.orderId}?payment=success`, request.url));
    }
    return NextResponse.redirect(new URL("/orders?payment=not-confirmed", request.url));
  } catch (error) {
    console.error("Paystack callback verification failed", error);
    return NextResponse.redirect(new URL("/orders?payment=verification-failed", request.url));
  }
}
