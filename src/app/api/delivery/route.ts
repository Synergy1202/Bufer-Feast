import { NextResponse } from "next/server";
import { verifyShipbubbleSignature } from "@/lib/server/shipbubble";

export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyShipbubbleSignature(body, request.headers.get("x-ship-signature"))) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(body) as { order_id?: string; status?: string; tracking_url?: string };
    console.info("Shipbubble delivery event", event.order_id, event.status, event.tracking_url);
    // Order-status persistence is added with the delivery migration and order mapping.
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ message: "Invalid webhook body." }, { status: 400 });
  }
}
