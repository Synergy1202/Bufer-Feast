import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

type CustomerRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  status: string | null;
  birthday: string | null;
  primary_address: string | null;
  marketing_opt_in: boolean | null;
  created_at: string | null;
};

export default async function AdminCustomersPage() {
  await requireAdmin();

  const admin = adminClient();

  const result = await admin
    .from("profiles")
    .select(
      [
        "id",
        "email",
        "full_name",
        "phone",
        "status",
        "birthday",
        "primary_address",
        "marketing_opt_in",
        "created_at",
      ].join(", "),
    )
    .eq("role", "customer")
    .order("created_at", {
      ascending: false,
    });

  if (result.error) {
    throw new Error(
      `Could not load customers: ${result.error.message}`,
    );
  }

  const customers = (result.data || []) as unknown as CustomerRow[];

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Customers
        </h1>

        <p className="mt-2 text-gray-500">
          View customer accounts and registration information.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            No customers found
          </h2>

          <p className="mt-2 text-gray-500">
            Registered customer accounts will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeading>Customer</TableHeading>
                  <TableHeading>Contact</TableHeading>
                  <TableHeading>Address</TableHeading>
                  <TableHeading>Status</TableHeading>
                  <TableHeading>Joined</TableHeading>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap px-6 py-5">
                      <p className="font-semibold text-gray-900">
                        {customer.full_name ||
                          "Unnamed customer"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {customer.email || "No email"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-700">
                      {customer.phone || "Not provided"}
                    </td>

                    <td className="max-w-xs px-6 py-5 text-sm text-gray-700">
                      <p className="break-words">
                        {customer.primary_address ||
                          "Not provided"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5">
                      <StatusBadge status={customer.status} />
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {customer.created_at
                        ? new Date(
                            customer.created_at,
                          ).toLocaleDateString()
                        : "Unknown"}
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

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalizedStatus = status || "unknown";

  const classes =
    normalizedStatus === "active"
      ? "bg-green-100 text-green-700"
      : normalizedStatus === "suspended"
        ? "bg-orange-100 text-orange-700"
        : normalizedStatus === "rejected"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}
    >
      {normalizedStatus.replace(/_/g, " ")}
    </span>
  );
}