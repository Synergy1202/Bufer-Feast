import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  ShoppingBag,
  Truck,
  Eye,
} from "lucide-react";
import { authClient, requireCustomer } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

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
      return "bg-gray-100 text-gray-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCircle size={13} />;
  if (status === "out_for_delivery") return <Truck size={13} />;
  return <Clock size={13} />;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const customer = await requireCustomer();
  const params = await searchParams;
  const client = await authClient();

  const { data: orders, error } = await client
    .from("orders")
    .select(`
      id,
      vendor_id,
      delivery_address,
      event_type,
      scheduled_time,
      allergies,
      special_instructions,
      headcount,
      total_price,
      status,
      created_at,
      order_items (
        id,
        menu_id,
        vendor_id,
        headcount,
        total_price,
        dish_name
      )
    `)
    .eq("user_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="text-[#FF5500]" />
              My Orders
            </h1>

            <p className="text-[#a0a0a0] mt-2">
              Track your customer orders.
            </p>
          </div>

          <Link
            href="/kitchens"
            className="text-[#FF5500] font-bold text-sm"
          >
            Browse Kitchens
          </Link>
        </div>

        {params.success === "true" && (
          <div className="mb-8 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 p-4 flex items-center gap-3">
            <CheckCircle size={20} />
            Your order was placed successfully.
          </div>
        )}

        {!orders || orders.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#333333] rounded-2xl text-center py-20">
            <ShoppingBag className="mx-auto text-[#555]" size={48} />
            <h2 className="text-xl font-bold text-white mt-4">
              No orders yet
            </h2>
            <p className="text-[#a0a0a0] mt-2 mb-6">
              Your completed orders will appear here.
            </p>
            <Link
              href="/kitchens"
              className="inline-block bg-[#FF5500] text-white font-bold px-6 py-3 rounded-xl"
            >
              Browse Kitchens
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <article
                key={order.id}
                className="bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden"
              >
                <div className="bg-[#1a1a1a] border-b border-[#333333] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#a0a0a0] uppercase">
                      Order reference
                    </p>

                    <Link
                      href={`/orders/${order.id}`}
                      className="text-white font-bold flex items-center gap-2"
                    >
                      #{order.id.slice(0, 8).toUpperCase()}
                      <Eye size={14} className="text-[#FF5500]" />
                    </Link>
                  </div>

                  <span
                    className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-2 capitalize ${statusClass(
                      order.status,
                    )}`}
                  >
                    <StatusIcon status={order.status} />
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#a0a0a0] mb-5">
                    <Calendar size={14} />
                    {new Date(order.created_at).toLocaleString()}
                  </div>

                  <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-4 border-b border-[#333333] pb-3"
                      >
                        <div>
                          <p className="text-white font-bold">
                            {item.dish_name}
                          </p>
                          <p className="text-xs text-[#a0a0a0]">
                            {item.headcount} people
                          </p>
                        </div>

                        <p className="text-white font-bold">
                          ₦{Number(item.total_price || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6 pt-5 border-t border-[#333333]">
                    <div>
                      <p className="text-xs text-[#a0a0a0] uppercase">
                        Delivery Address
                      </p>
                      <p className="text-white mt-1">
                        {order.delivery_address}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-xs text-[#a0a0a0] uppercase">
                        Total
                      </p>
                      <p className="text-2xl text-[#FF5500] font-bold">
                        ₦{Number(order.total_price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {order.allergies && (
                    <div className="mt-5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3 text-yellow-300">
                      <AlertTriangle size={18} />
                      <div>
                        <p className="font-bold text-sm">
                          Dietary information
                        </p>
                        <p className="text-sm mt-1">{order.allergies}</p>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}