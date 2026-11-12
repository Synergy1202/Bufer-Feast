"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  MapPin,
  Truck,
  Users,
  X,
} from "lucide-react";
import { updateOrderStatus } from "./actions";

interface OrderItem {
  id: string;
  dish_name: string | null;
  headcount: number | null;
  total_price: number | null;
}

interface Order {
  id: string;
  user_id: string | null;
  delivery_address: string | null;
  event_type: string | null;
  scheduled_time: string | null;
  allergies: string | null;
  special_instructions: string | null;
  headcount: number | null;
  total_price: number | null;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

const statusOptions = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

function statusClass(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    ready: "bg-green-100 text-green-700",
    out_for_delivery: "bg-indigo-100 text-indigo-700",
    delivered: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return styles[status] || "bg-gray-100 text-gray-700";
}

export function OrdersList({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function changeStatus(
    orderId: string,
    status: string,
  ) {
    setLoadingId(orderId);

    try {
      await updateOrderStatus(orderId, status);

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status }
            : order,
        ),
      );

      setSelected((current) =>
        current?.id === orderId
          ? { ...current, status }
          : current,
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update order status.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-20 text-center">
        <ShoppingBagEmpty />
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          No orders yet
        </h2>
        <p className="text-gray-500 mt-2">
          Customer orders will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-bold text-gray-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </h2>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusClass(
                      order.status,
                    )}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  {order.headcount || 0} people ·{" "}
                  {new Date(order.created_at).toLocaleString()}
                </p>

                <p className="text-sm text-gray-600 mt-2">
                  {order.delivery_address || "No address provided"}
                </p>

                <p className="text-lg font-bold text-gray-900 mt-3">
                  ₦{Number(order.total_price || 0).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <select
                  value={order.status}
                  disabled={loadingId === order.id}
                  onChange={(event) =>
                    changeStatus(order.id, event.target.value)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 disabled:opacity-50"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSelected(order)}
                  className="rounded-xl bg-gray-900 text-white px-4 py-3 font-bold hover:bg-green-700"
                >
                  View Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Order Details
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  #{selected.id.slice(0, 8).toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-red-600"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Info
                  icon={<Users size={17} />}
                  label="Headcount"
                  value={`${selected.headcount || 0} people`}
                />

                <Info
                  icon={<Calendar size={17} />}
                  label="Scheduled Time"
                  value={
                    selected.scheduled_time
                      ? new Date(
                          selected.scheduled_time,
                        ).toLocaleString()
                      : "Not scheduled"
                  }
                />

                <Info
                  icon={<MapPin size={17} />}
                  label="Delivery Address"
                  value={
                    selected.delivery_address ||
                    "Not provided"
                  }
                />

                <Info
                  icon={<Clock size={17} />}
                  label="Event Type"
                  value={selected.event_type || "Home"}
                />
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">
                  Items Ordered
                </h3>

                <div className="space-y-3">
                  {selected.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 rounded-xl bg-gray-50 p-4"
                    >
                      <div>
                        <p className="font-bold text-gray-900">
                          {item.dish_name || "Menu Item"}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {item.headcount || 0} people
                        </p>
                      </div>

                      <p className="font-bold text-gray-900">
                        ₦{Number(
                          item.total_price || 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.allergies && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-orange-800 flex gap-3">
                  <AlertTriangle size={20} />
                  <div>
                    <p className="font-bold">Allergy Information</p>
                    <p className="text-sm mt-1">
                      {selected.allergies}
                    </p>
                  </div>
                </div>
              )}

              {selected.special_instructions && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-blue-800">
                  <p className="font-bold">
                    Special Instructions
                  </p>
                  <p className="text-sm mt-1">
                    {selected.special_instructions}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-5">
                <p className="text-sm font-bold text-gray-500 mb-3">
                  Update Status
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    ["preparing", <ChefHat size={17} />, "Preparing"],
                    ["ready", <CheckCircle size={17} />, "Ready"],
                    [
                      "out_for_delivery",
                      <Truck size={17} />,
                      "Out for Delivery",
                    ],
                    [
                      "delivered",
                      <CheckCircle size={17} />,
                      "Delivered",
                    ],
                  ].map(([status, icon, label]) => (
                    <button
                      key={String(status)}
                      type="button"
                      disabled={loadingId === selected.id}
                      onClick={() =>
                        changeStatus(
                          selected.id,
                          String(status),
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-3 font-bold disabled:opacity-50"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 text-green-700">
        {icon}
        <p className="text-xs font-bold uppercase">{label}</p>
      </div>

      <p className="text-sm text-gray-900 font-medium mt-2">
        {value}
      </p>
    </div>
  );
}

function ShoppingBagEmpty() {
  return (
    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
      <ShoppingBagIcon />
    </div>
  );
}

function ShoppingBagIcon() {
  return <span className="text-2xl">🛍️</span>;
}