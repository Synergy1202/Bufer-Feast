import Link from "next/link";
import {
  ClipboardList,
  DollarSign,
  Plus,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { authClient, requireVendor } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const vendor = await requireVendor();
  const client = await authClient();

  const [
    { data: orders, error: ordersError },
    { count: menuCount, error: menusError },
  ] = await Promise.all([
    client
      .from("orders")
      .select(
        "id, total_price, status, headcount, delivery_address, created_at, order_items(dish_name, headcount, total_price)",
      )
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),

    client
      .from("menus")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("status", "published"),
  ]);

  if (ordersError) {
    console.error("Vendor dashboard orders error:", ordersError.message);
  }

  if (menusError) {
    console.error("Vendor dashboard menus error:", menusError.message);
  }

  const vendorOrders = orders || [];

  const activeOrders = vendorOrders.filter(
    (order) =>
      !["delivered", "cancelled"].includes(order.status),
  );

  const pendingOrders = vendorOrders.filter(
    (order) =>
      ["pending", "confirmed"].includes(order.status),
  );

  const totalRevenue = vendorOrders
    .filter((order) => order.status !== "cancelled")
    .reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0,
    );

  const formatMoney = (amount: number) =>
    `₦${amount.toLocaleString("en-NG")}`;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {vendor.businessName || vendor.name}
        </h1>

        <p className="text-gray-500 mt-1">
          Here is what is happening with your kitchen today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Orders"
          value={String(vendorOrders.length)}
          detail={`${pendingOrders.length} awaiting action`}
          icon={<ShoppingBag size={22} />}
          color="bg-blue-600"
        />

        <StatCard
          label="Active Orders"
          value={String(activeOrders.length)}
          detail="Currently in progress"
          icon={<TrendingUp size={22} />}
          color="bg-purple-600"
        />

        <StatCard
          label="Revenue"
          value={formatMoney(totalRevenue)}
          detail="Excluding cancelled orders"
          icon={<DollarSign size={22} />}
          color="bg-green-600"
        />

        <StatCard
          label="Published Menus"
          value={String(menuCount || 0)}
          detail="Visible to customers"
          icon={<UtensilsCrossed size={22} />}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Recent Orders
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your latest customer orders.
              </p>
            </div>

            <Link
              href="/vendor/orders"
              className="text-sm font-bold text-green-700 hover:text-green-800"
            >
              View all
            </Link>
          </div>

          {vendorOrders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag
                className="mx-auto text-gray-300"
                size={42}
              />

              <p className="text-gray-500 mt-4">
                No orders have been placed yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {vendorOrders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>

                      <OrderStatus status={order.status} />
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                      {order.headcount || 0} people ·{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                      {order.delivery_address}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-gray-900">
                    {formatMoney(Number(order.total_price || 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Quick Actions
          </h2>

          <div className="space-y-3 mt-5">
            <Link
              href="/vendor/menus/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Plus className="text-green-600" size={22} />

              <div>
                <p className="font-bold text-gray-900">
                  Create Menu
                </p>
                <p className="text-xs text-gray-500">
                  Add a new food offering
                </p>
              </div>
            </Link>

            <Link
              href="/vendor/orders"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <ShoppingBag className="text-blue-600" size={22} />

              <div>
                <p className="font-bold text-gray-900">
                  Manage Orders
                </p>
                <p className="text-xs text-gray-500">
                  Review and update orders
                </p>
              </div>
            </Link>

            <Link
              href="/vendor/prep-sheet"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <ClipboardList className="text-purple-600" size={22} />

              <div>
                <p className="font-bold text-gray-900">
                  Kitchen Prep Sheet
                </p>
                <p className="text-xs text-gray-500">
                  See what needs to be prepared
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl text-white ${color}`}>
          {icon}
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-5">{label}</p>

      <p className="text-2xl font-bold text-gray-900 mt-1 break-words">
        {value}
      </p>

      <p className="text-xs text-gray-500 mt-2">{detail}</p>
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    ready: "bg-green-100 text-green-700",
    out_for_delivery: "bg-indigo-100 text-indigo-700",
    delivered: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}