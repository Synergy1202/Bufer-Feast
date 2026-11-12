import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

type GenericRow = Record<string, unknown>;

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
};

type DisplayOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  vendorName: string;
  status: string;
  total: string;
  createdAt: string;
  raw: GenericRow;
};

function stringValue(
  row: GenericRow,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value);
    }
  }

  return "";
}

function numberValue(
  row: GenericRow,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG");
}

function getProfileId(
  order: GenericRow,
  ...keys: string[]
) {
  return stringValue(order, ...keys);
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "delivered" ||
    normalized === "paid"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "failed"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalized === "preparing" ||
    normalized === "processing" ||
    normalized === "confirmed"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export default async function AdminOrdersPage() {
  await requireAdmin();

  const admin = adminClient();

  const ordersResult = await admin
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (ordersResult.error) {
    throw new Error(
      `Could not load orders: ${ordersResult.error.message}`,
    );
  }

  const rawOrders =
    (ordersResult.data || []) as unknown as GenericRow[];

  const profileIds = Array.from(
    new Set(
      rawOrders
        .flatMap((order) => [
          getProfileId(
            order,
            "customer_id",
            "customer_user_id",
            "user_id",
            "profile_id",
          ),
          getProfileId(
            order,
            "vendor_id",
            "vendor_user_id",
          ),
        ])
        .filter(Boolean),
    ),
  );

  let profiles: ProfileRow[] = [];

  if (profileIds.length > 0) {
    const profilesResult = await admin
      .from("profiles")
      .select(
        "id, email, full_name, business_name",
      )
      .in("id", profileIds);

    if (profilesResult.error) {
      throw new Error(
        `Could not load order profiles: ${profilesResult.error.message}`,
      );
    }

    profiles =
      (profilesResult.data || []) as unknown as ProfileRow[];
  }

  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const orders: DisplayOrder[] = rawOrders.map((order) => {
    const customerId = getProfileId(
      order,
      "customer_id",
      "customer_user_id",
      "user_id",
      "profile_id",
    );

    const vendorId = getProfileId(
      order,
      "vendor_id",
      "vendor_user_id",
    );

    const customer = profileMap.get(customerId);
    const vendor = profileMap.get(vendorId);

    const status =
      stringValue(
        order,
        "status",
        "order_status",
        "payment_status",
      ) || "unknown";

    const total = numberValue(
      order,
      "total_amount",
      "total",
      "amount",
      "grand_total",
      "total_price",
    );

    const createdAt =
      stringValue(
        order,
        "created_at",
        "ordered_at",
        "created",
      );

    return {
      id:
        stringValue(
          order,
          "id",
          "order_id",
          "reference",
          "order_number",
        ) || "Unknown order",
      customerName:
        customer?.full_name ||
        customer?.email ||
        "Unknown customer",
      customerEmail: customer?.email || "Not provided",
      vendorName:
        vendor?.business_name ||
        vendor?.full_name ||
        "Unknown vendor",
      status,
      total: formatMoney(total),
      createdAt: formatDate(createdAt),
      raw: order,
    };
  });

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Orders
        </h1>

        <p className="mt-2 text-gray-500">
          Monitor marketplace orders, customers, vendors, totals,
          and order statuses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SummaryCard
          label="Total orders"
          value={orders.length}
          className="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          label="Active orders"
          value={
            orders.filter((order) =>
              [
                "pending",
                "confirmed",
                "processing",
                "preparing",
                "ready",
                "out_for_delivery",
              ].includes(order.status.toLowerCase()),
            ).length
          }
          className="bg-yellow-50 text-yellow-700"
        />

        <SummaryCard
          label="Completed orders"
          value={
            orders.filter((order) =>
              [
                "completed",
                "delivered",
              ].includes(order.status.toLowerCase()),
            ).length
          }
          className="bg-green-50 text-green-700"
        />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            No orders found
          </h2>

          <p className="mt-2 text-gray-500">
            Marketplace orders will appear here when customers place
            orders.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeading>Order</TableHeading>
                  <TableHeading>Customer</TableHeading>
                  <TableHeading>Vendor</TableHeading>
                  <TableHeading>Total</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Created</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-6 py-5">
                      <p className="font-semibold text-gray-900">
                        #{order.id}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-semibold text-gray-900">
                        {order.customerName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {order.customerEmail}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-700">
                      {order.vendorName}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-gray-900">
                      {order.total}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          order.status,
                        )}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {order.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}>
      <p className="text-sm font-semibold">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}