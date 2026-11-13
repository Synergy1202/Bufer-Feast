import Link from "next/link";
import {
  BarChart3,
  CheckSquare,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const admin = adminClient();

  const [totalVendorResult, approvedVendorResult, rejectedVendorResult, pendingVendorResult] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor").in("status", ["active", "approved"]),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor").eq("status", "rejected"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor").in("status", ["pending", "pending_review"]),
  ]);
  const countErrors = [totalVendorResult.error, approvedVendorResult.error, rejectedVendorResult.error, pendingVendorResult.error].filter(Boolean);
  if (countErrors.length) {
    console.error("Vendor statistics query failed:", countErrors.map((item) => item?.message));
    throw new Error("Vendor statistics could not be loaded. Please refresh the dashboard.");
  }
  const totalVendors = totalVendorResult.count ?? 0;
  const activeVendors = approvedVendorResult.count ?? 0;
  const rejectedVendors = rejectedVendorResult.count ?? 0;
  const pendingApplications = pendingVendorResult.count ?? 0;

  const { count: totalCustomers, error: customersError } =
    await admin
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("role", "customer");

  if (customersError) {
    console.error(
      "Customer count error:",
      customersError.message,
    );
  }

  const { count: totalOrders, error: ordersError } =
    await admin
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      });

  if (ordersError) {
    console.error(
      "Order count error:",
      ordersError.message,
    );
  }

  const { data: paidOrders, error: revenueError } = await admin
    .from("orders")
    .select("total_price, delivery_fee, payment_status")
    .eq("payment_status", "paid");

  if (revenueError) {
    console.error("Paid revenue error:", revenueError.message);
  }

  const grossReceived = (paidOrders || []).reduce(
    (sum, order) =>
      sum + Number(order.total_price || 0) + Number(order.delivery_fee || 0),
    0,
  );
  const deliveryReceived = (paidOrders || []).reduce(
    (sum, order) => sum + Number(order.delivery_fee || 0),
    0,
  );
  const commissionReceived = grossReceived * 0.1;
  const vendorPayouts = grossReceived - commissionReceived;
  const money = (amount: number) => `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Manage trust, vendors, and marketplace operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard href="/admin/vendors" title="Total Vendors" value={totalVendors} description="View vendor accounts" icon={<Store size={28} />} iconClass="bg-blue-100 text-blue-600" linkClass="text-blue-700" />
        <DashboardCard href="/admin/vendor-applications" title="Approved Vendors" value={activeVendors} description="Manage approved vendors" icon={<CheckSquare size={28} />} iconClass="bg-green-100 text-green-600" linkClass="text-green-700" />
        <DashboardCard href="/admin/vendor-applications" title="Rejected Vendors" value={rejectedVendors} description="Review rejected applications" icon={<ShieldCheck size={28} />} iconClass="bg-red-100 text-red-600" linkClass="text-red-700" />
        <DashboardCard href="/admin/vendor-applications" title="Pending Applications" value={pendingApplications} description="Review applications" icon={<ClipboardCheck size={28} />} iconClass="bg-orange-100 text-orange-600" linkClass="text-orange-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DashboardCard href="/admin/customers" title="Customers" value={totalCustomers ?? 0} description="View customer accounts" icon={<Users size={28} />} iconClass="bg-purple-100 text-purple-600" linkClass="text-purple-700" />
        <DashboardCard href="/admin/orders" title="Orders" value={totalOrders ?? 0} description="Monitor marketplace orders" icon={<ShoppingBag size={28} />} iconClass="bg-blue-100 text-blue-600" linkClass="text-blue-700" />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueCard label="Total received" value={money(grossReceived)} tone="green" />
        <RevenueCard label="Delivery collected" value={money(deliveryReceived)} tone="blue" />
        <RevenueCard label="Bufer Feast commission" value={money(commissionReceived)} tone="orange" />
        <RevenueCard label="Vendor payout amount" value={money(vendorPayouts)} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link
          href="/admin/vendor-applications"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckSquare size={26} />
            </div>

            <span className="text-sm font-semibold text-green-700 group-hover:underline">
              Review applications →
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Vendor applications
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review submitted business details, identity documents, CAC
            certificates, and approval requests.
          </p>
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <ShieldCheck size={28} />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Platform Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Admin access is restricted to active administrator profiles.
            Vendor authorization is checked against database role and status.
          </p>

          <div className="mt-5 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            Protected
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-gray-700" size={24} />

          <h2 className="text-xl font-bold text-gray-900">
            Quick status
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <StatusItem label="Total vendors" value={totalVendors} tone="blue" />
          <StatusItem label="Approved vendors" value={activeVendors} tone="green" />
          <StatusItem label="Rejected vendors" value={rejectedVendors} tone="yellow" />

          <StatusItem
            label="Total orders"
            value={totalOrders ?? 0}
            tone="blue"
          />
        </div>
      </div>
    </div>
  );
}

function RevenueCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "orange" | "purple";
}) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs opacity-75">Verified paid orders only</p>
    </div>
  );
}

function DashboardCard({
  href,
  title,
  value,
  description,
  icon,
  iconClass,
  linkClass,
}: {
  href: string;
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  linkClass: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-4xl font-bold text-gray-900">
        {value}
      </p>

      <p
        className={`mt-4 text-sm font-semibold group-hover:underline ${linkClass}`}
      >
        {description} →
      </p>
    </Link>
  );
}

function StatusItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "yellow" | "green" | "blue";
}) {
  const toneClasses = {
    yellow: "bg-yellow-50 text-yellow-800",
    green: "bg-green-50 text-green-800",
    blue: "bg-blue-50 text-blue-800",
  };

  return (
    <div className={`rounded-xl p-4 ${toneClasses[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}