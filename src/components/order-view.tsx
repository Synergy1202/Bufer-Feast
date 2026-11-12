import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  authClient,
  requireCustomer,
} from "@/lib/server/auth";
import OrderReviewForm from "@/components/OrderReviewForm";

type ReviewRecord = {
  id: string;
  kitchen_rating: number;
  food_rating: number;
  comment: string | null;
  created_at: string;
};

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "confirmed":
      return "bg-blue-100 text-blue-700";

    case "preparing":
      return "bg-purple-100 text-purple-700";

    case "ready":
      return "bg-green-100 text-green-700";

    case "out_for_delivery":
      return "bg-indigo-100 text-indigo-700";

    case "delivered":
    case "completed":
      return "bg-gray-100 text-gray-700";

    case "cancelled":
    case "canceled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (
    status === "delivered" ||
    status === "completed"
  ) {
    return <CheckCircle size={16} />;
  }

  if (status === "out_for_delivery") {
    return <Truck size={16} />;
  }

  return <Clock size={16} />;
}

export async function OrderView({
  id,
}: {
  id: string;
}) {
  const customer = await requireCustomer();
  const client = await authClient();

  const orderResult = await client
    .from("orders")
    .select(
      `
        id,
        user_id,
        vendor_id,
        delivery_address,
        delivery_window,
        event_type,
        scheduled_time,
        allergies,
        special_instructions,
        headcount,
        total_price,
        status,
        payment_status,
        delivery_provider,
        delivery_status,
        delivery_fee,
        shipbubble_tracking_url,
        created_at,
        order_items (
          id,
          menu_id,
          vendor_id,
          headcount,
          total_price,
          dish_name
        )
      `,
    )
    .eq("id", id)
    .eq("user_id", customer.id)
    .maybeSingle();

  if (orderResult.error) {
    throw new Error(orderResult.error.message);
  }

  const order = orderResult.data as unknown as {
    id: string;
    user_id: string;
    vendor_id: string;
    delivery_address: string | null;
    delivery_window: string | null;
    event_type: string | null;
    scheduled_time: string | null;
    allergies: string | null;
    special_instructions: string | null;
    headcount: number | null;
    total_price: number | null;
    status: string;
    payment_status: string | null;
    delivery_provider: string | null;
    delivery_status: string | null;
    delivery_fee: number | null;
    shipbubble_tracking_url: string | null;
    created_at: string;
    order_items:
      | Array<{
          id: string;
          menu_id: string | null;
          vendor_id: string | null;
          headcount: number | null;
          total_price: number | null;
          dish_name: string | null;
        }>
      | null;
  } | null;

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">
            Order not found
          </h1>

          <p className="mb-6 mt-3 text-[#a0a0a0]">
            This order does not exist or does not belong to your account.
          </p>

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF5500] px-6 py-3 font-bold text-white"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const vendorResult = await client
    .from("public_vendor_profiles")
    .select("display_name, location")
    .eq("id", order.vendor_id)
    .maybeSingle();

  if (vendorResult.error) {
    throw new Error(vendorResult.error.message);
  }

  const vendor = vendorResult.data as unknown as {
    display_name: string | null;
    location: string | null;
  } | null;

  const reviewResult = await client
    .from("vendor_reviews")
    .select(
      "id, kitchen_rating, food_rating, comment, created_at",
    )
    .eq("order_id", order.id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (reviewResult.error) {
    throw new Error(
      `Could not load order review: ${reviewResult.error.message}`,
    );
  }

  const existingReview =
    reviewResult.data as unknown as ReviewRecord | null;

  const canReview =
    order.status === "completed" ||
    order.status === "delivered";

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/orders"
          className="mb-8 inline-flex items-center gap-2 text-[#a0a0a0] hover:text-[#FF5500]"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-[#FF5500]">
              Order Details
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              #{order.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>

          <span
            className={`flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold capitalize ${statusClass(
              order.status,
            )}`}
          >
            <StatusIcon status={order.status} />
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
          <CheckCircle size={22} />
          Your order has been received.
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <p className="text-xs uppercase text-[#a0a0a0]">
              Kitchen
            </p>

            <p className="mt-2 text-xl font-bold text-white">
              {vendor?.display_name || "Partner Kitchen"}
            </p>

            <p className="mt-2 text-sm text-[#a0a0a0]">
              {vendor?.location || "Lagos, Nigeria"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <p className="text-xs uppercase text-[#a0a0a0]">
              Created
            </p>

            <p className="mt-2 flex items-center gap-2 font-bold text-white">
              <Calendar
                size={16}
                className="text-[#FF5500]"
              />

              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#333333] bg-[#111111] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-[#a0a0a0]">Delivery</p>
              <p className="mt-1 font-bold capitalize text-white">{statusLabel(order.delivery_status || "awaiting shipment")}</p>
              {order.delivery_fee ? <p className="mt-1 text-sm text-[#a0a0a0]">Delivery fee: ₦{Number(order.delivery_fee).toLocaleString("en-NG")}</p> : null}
            </div>
            {order.shipbubble_tracking_url && (
              <a href={order.shipbubble_tracking_url} target="_blank" rel="noreferrer" className="rounded-xl bg-[#FF5500] px-4 py-3 text-sm font-bold text-white">Track delivery</a>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
            <ShoppingBag
              className="text-[#FF5500]"
              size={21}
            />
            Items Ordered
          </h2>

          <div className="space-y-4">
            {(order.order_items || []).map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b border-[#333333] pb-4"
              >
                <div>
                  <p className="font-bold text-white">
                    {item.dish_name || "Unnamed item"}
                  </p>

                  <p className="mt-1 text-sm text-[#a0a0a0]">
                    {item.headcount || 0} people
                  </p>
                </div>

                <p className="font-bold text-white">
                  ₦
                  {Number(
                    item.total_price || 0,
                  ).toLocaleString("en-NG")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between border-t border-[#333333] pt-5">
            <span className="font-bold text-white">
              Total
            </span>

            <strong className="text-2xl text-[#FF5500]">
              ₦
              {Number(
                order.total_price || 0,
              ).toLocaleString("en-NG")}
            </strong>
          </div>
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-[#333333] bg-[#111111] p-6">
          <div className="flex gap-3">
            <MapPin
              className="shrink-0 text-[#FF5500]"
              size={20}
            />

            <div>
              <p className="text-xs uppercase text-[#a0a0a0]">
                Delivery Address
              </p>

              <p className="mt-1 text-white">
                {order.delivery_address || "Not provided"}
              </p>
            </div>
          </div>

          {order.delivery_window && (
            <div className="flex gap-3">
              <Clock
                className="shrink-0 text-[#FF5500]"
                size={20}
              />

              <div>
                <p className="text-xs uppercase text-[#a0a0a0]">
                  Delivery Period
                </p>

                <p className="mt-1 capitalize text-white">
                  {order.delivery_window}
                </p>
              </div>
            </div>
          )}

          {order.scheduled_time && (
            <div className="flex gap-3">
              <Calendar
                className="shrink-0 text-[#FF5500]"
                size={20}
              />

              <div>
                <p className="text-xs uppercase text-[#a0a0a0]">
                  Preferred Date and Time
                </p>

                <p className="mt-1 text-white">
                  {new Date(
                    order.scheduled_time,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {order.event_type && (
            <div>
              <p className="text-xs uppercase text-[#a0a0a0]">
                Event Type
              </p>

              <p className="mt-1 capitalize text-white">
                {order.event_type}
              </p>
            </div>
          )}

          {order.allergies && (
            <div className="flex gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
              <AlertTriangle
                size={20}
                className="shrink-0"
              />

              <div>
                <p className="text-sm font-bold">
                  Allergy information
                </p>

                <p className="mt-1 text-sm">
                  {order.allergies}
                </p>
              </div>
            </div>
          )}

          {order.special_instructions && (
            <div>
              <p className="text-xs uppercase text-[#a0a0a0]">
                Special Instructions
              </p>

              <p className="mt-1 text-white">
                {order.special_instructions}
              </p>
            </div>
          )}
        </div>

        {/* Review section */}
        {canReview && !existingReview && (
          <div className="mt-6">
            <OrderReviewForm orderId={order.id} />
          </div>
        )}

        {existingReview && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-xl font-bold text-green-900">
              Thank you for your review
            </h2>

            <p className="mt-2 text-sm text-green-800">
              You rated the kitchen{" "}
              {existingReview.kitchen_rating}/5 and the food{" "}
              {existingReview.food_rating}/5.
            </p>

            {existingReview.comment && (
              <p className="mt-3 text-sm text-green-900">
                “{existingReview.comment}”
              </p>
            )}

            <p className="mt-3 text-xs text-green-700">
              Review submitted on{" "}
              {new Date(
                existingReview.created_at,
              ).toLocaleDateString("en-NG")}
            </p>
          </div>
        )}

        {!canReview && !existingReview && (
          <div className="mt-6 rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <h2 className="text-xl font-bold text-white">
              Review this order after delivery
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#a0a0a0]">
              Once this order is delivered, you can rate the kitchen service
              and food quality.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}