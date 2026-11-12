import {
  CalendarDays,
  ClipboardList,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { authClient, requireVendor } from "@/lib/server/auth";
import { updateOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

type OrderItem = {
  id: string;
  dish_name: string | null;
  headcount: number | null;
  total_price: number | null;
};

type VendorOrder = {
  id: string;
  user_id: string | null;
  vendor_id: string;
  delivery_address: string | null;
  event_type: string | null;
  scheduled_time: string | null;
  allergies: string | null;
  headcount: number | null;
  total_price: number | null;
  status: string | null;
  created_at: string | null;
  order_items: OrderItem[] | null;
};

function formatMoney(value: number | null) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG");
}

function statusClass(status: string | null) {
  const value = String(status || "pending").toLowerCase();

  if (
    value === "completed" ||
    value === "delivered"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    value === "confirmed" ||
    value === "preparing" ||
    value === "ready"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default async function VendorOrdersPage() {
  const vendor = await requireVendor();
  const client = await authClient();

  const result = await client
    .from("orders")
    .select(
      `
        id,
        user_id,
        vendor_id,
        delivery_address,
        event_type,
        scheduled_time,
        allergies,
        headcount,
        total_price,
        status,
        created_at,
        order_items (
          id,
          dish_name,
          headcount,
          total_price
        )
      `,
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", {
      ascending: false,
    });

  if (result.error) {
    throw new Error(
      `Could not load vendor orders: ${result.error.message}`,
    );
  }

  const orders =
    (result.data || []) as unknown as VendorOrder[];

  return (
    <main className="mx-auto max-w-7xl space-y-8 bg-white px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
          <ClipboardList className="text-green-600" />
          Vendor Orders
        </h1>

        <p className="mt-2 text-gray-500">
          Manage orders assigned to your kitchen.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <PackageCheck
            className="mx-auto text-gray-300"
            size={52}
          />

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            No orders yet
          </h2>

          <p className="mt-2 text-gray-500">
            Orders assigned to your kitchen will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">
                      Order #{order.id}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                        order.status,
                      )}`}
                    >
                      {String(
                        order.status || "pending",
                      ).replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <Info
                      icon={<CalendarDays size={16} />}
                      label="Scheduled"
                      value={formatDate(order.scheduled_time)}
                    />

                    <Info
                      icon={<PackageCheck size={16} />}
                      label="Headcount"
                      value={String(order.headcount || 0)}
                    />

                    <Info
                      icon={<MapPin size={16} />}
                      label="Delivery address"
                      value={
                        order.delivery_address ||
                        "Not provided"
                      }
                    />

                    <Info
                      icon={<ClipboardList size={16} />}
                      label="Event type"
                      value={
                        order.event_type || "Not provided"
                      }
                    />
                  </div>

                  {order.allergies && (
                    <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
                      <strong>Allergies:</strong>{" "}
                      {order.allergies}
                    </div>
                  )}
                </div>

                <div className="min-w-60">
                  <p className="text-sm text-gray-500">
                    Order total
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {formatMoney(order.total_price)}
                  </p>

                  <form
                    action={async (formData) => {
                      "use server";

                      const nextStatus = String(
                        formData.get("status") || "",
                      );

                      await updateOrderStatus(
                        order.id,
                        nextStatus,
                      );
                    }}
                    className="mt-4"
                  >
                    <label
                      htmlFor={`status-${order.id}`}
                      className="mb-2 block text-xs font-bold uppercase text-gray-500"
                    >
                      Update status
                    </label>

                    <select
                      id={`status-${order.id}`}
                      name="status"
                      defaultValue={order.status || "pending"}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    >
                      <option
                        value="pending"
                        className="bg-white text-gray-900"
                      >
                        Pending
                      </option>

                      <option
                        value="confirmed"
                        className="bg-white text-gray-900"
                      >
                        Confirmed
                      </option>

                      <option
                        value="preparing"
                        className="bg-white text-gray-900"
                      >
                        Preparing
                      </option>

                      <option
                        value="ready"
                        className="bg-white text-gray-900"
                      >
                        Ready
                      </option>

                      <option
                        value="out_for_delivery"
                        className="bg-white text-gray-900"
                      >
                        Out for delivery
                      </option>

                      <option
                        value="completed"
                        className="bg-white text-gray-900"
                      >
                        Completed
                      </option>

                      <option
                        value="cancelled"
                        className="bg-white text-gray-900"
                      >
                        Cancelled
                      </option>
                    </select>

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                    >
                      Save status
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                  Order items
                </h3>

                <div className="mt-3 divide-y divide-gray-100">
                  {(order.order_items || []).length === 0 ? (
                    <p className="py-3 text-sm text-gray-500">
                      No order items found.
                    </p>
                  ) : (
                    (order.order_items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-3 text-sm"
                      >
                        <span className="font-semibold text-gray-900">
                          {item.dish_name || "Unnamed item"}
                        </span>

                        <span className="text-gray-600">
                          {item.headcount || 0} portions
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
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
    <div className="flex gap-2 rounded-lg bg-gray-50 p-3">
      <span className="mt-0.5 text-green-600">
        {icon}
      </span>

      <div>
        <p className="text-xs font-bold uppercase text-gray-500">
          {label}
        </p>

        <p className="mt-1 text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}