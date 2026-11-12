import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("jie_bulk_order-customer-auth");

    let user_id = null;
    let accessToken = null;

    if (sessionCookie?.value) {
      // FIX: The cookie is just the raw token string now, no JSON.parse needed!
      accessToken = sessionCookie.value; 

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) user_id = user.id;
    }

    if (!user_id) {
      return NextResponse.json({ message: "You must be logged in to place an order." }, { status: 401 });
    }

    const body = await request.json();
    const { delivery_address, event_type, scheduled_time, allergies, items } = body;

    const vendor_id = items[0]?.vendor_id;
    const total_headcount = items.reduce((sum: number, item: any) => sum + (item.headcount || 0), 0);
    const total_price = items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    );

    // Save the Order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user_id,
        vendor_id: vendor_id,
        headcount: total_headcount,
        total_price: total_price, 
        delivery_address,
        event_type,
        scheduled_time: scheduled_time || null,
        allergies: allergies || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Save the Order Items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        menu_id: item.menu_id,
        vendor_id: item.vendor_id,
        headcount: item.headcount,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) console.error("Order items error:", itemsError);
    }

    return NextResponse.json({ message: "Order placed successfully", order_id: order.id });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ message: error.message || "Failed to place order" }, { status: 500 });
  }
}