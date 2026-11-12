import { NextResponse } from "next/server";
import { authClient, requireCustomer } from "@/lib/server/auth";
import { requestShipbubbleRates, validateShipbubbleAddress } from "@/lib/server/shipbubble";

function nextPickupDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const customer = await requireCustomer();
    const body = await request.json() as {
      orderId?: string;
      deliveryAddress?: string;
      deliveryPhone?: string;
    };
    if (!body.orderId || !body.deliveryAddress || !body.deliveryPhone) {
      return NextResponse.json({ message: "Order, delivery address, and phone are required." }, { status: 400 });
    }

    const categoryId = Number(process.env.SHIPBUBBLE_CATEGORY_ID || "69709726");
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json({ message: "SHIPBUBBLE_CATEGORY_ID is not configured." }, { status: 503 });
    }

    const client = await authClient();
    const { data: order, error } = await client
      .from("orders")
      .select("id, vendor_id, total_price, delivery_address, scheduled_time, order_items(name:dish_name, quantity:headcount, total_price)")
      .eq("id", body.orderId)
      .eq("user_id", customer.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return NextResponse.json({ message: "Order not found." }, { status: 404 });

    const { data: vendor, error: vendorError } = await client
      .from("public_vendor_profiles")
      .select("display_name, location, phone, email")
      .eq("id", order.vendor_id)
      .maybeSingle();
    if (vendorError) throw new Error(vendorError.message);
    if (!vendor?.location) return NextResponse.json({ message: "The kitchen pickup address is not configured." }, { status: 422 });

    const [sender, receiver] = await Promise.all([
      validateShipbubbleAddress({
        name: vendor.display_name || "Bufer Feast kitchen",
        email: customer.email,
        phone: vendor.phone || body.deliveryPhone,
        address: vendor.location,
      }),
      validateShipbubbleAddress({
        name: customer.name || customer.email,
        email: customer.email,
        phone: body.deliveryPhone,
        address: body.deliveryAddress,
      }),
    ]);

    const packageItems = ((order.order_items || []) as Array<{ name: string; quantity: number; total_price: number }>).map((item) => ({
      name: item.name || "Prepared meal",
      description: "Prepared food order",
      unit_weight: "2",
      unit_amount: String(Math.max(0, Math.round(Number(item.total_price || 0) / Math.max(1, Number(item.quantity || 1))))),
      quantity: String(Math.max(1, Number(item.quantity || 1))),
    }));

    const rates = await requestShipbubbleRates({
      sender_address_code: sender.data.address_code,
      reciever_address_code: receiver.data.address_code,
      pickup_date: order.scheduled_time ? String(order.scheduled_time).slice(0, 10) : nextPickupDate(),
      category_id: categoryId,
      package_items: packageItems.length ? packageItems : [{ name: "Prepared meal", description: "Prepared food order", unit_weight: "2", unit_amount: String(Math.round(Number(order.total_price || 0))), quantity: "1" }],
      package_dimension: { length: 30, width: 20, height: 15 },
      delivery_instructions: "Keep upright and handle with care.",
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error("Shipbubble rates error", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to fetch delivery rates." }, { status: 500 });
  }
}
