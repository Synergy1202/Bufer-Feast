import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  business_name: string | null;
  vendor_type: string | null;
  location: string | null;
  status: string | null;
  is_open: boolean | null;
  created_at: string | null;
};

export default async function AdminVendorsPage() {
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
        "business_name",
        "vendor_type",
        "location",
        "status",
        "is_open",
        "created_at",
      ].join(", "),
    )
    .eq("role", "vendor")
    .order("created_at", {
      ascending: false,
    });

  if (result.error) {
    throw new Error(
      `Could not load vendors: ${result.error.message}`,
    );
  }

const vendors = (result.data || []) as unknown as VendorRow[];
  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Approved Vendors
        </h1>

        <p className="mt-2 text-gray-500">
          View vendor accounts and their current marketplace status.
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            No vendors found
          </h2>

          <p className="mt-2 text-gray-500">
            Approved vendor accounts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {vendors.map((vendor) => {
            const isActive =
              vendor.status === "active" ||
              vendor.status === "approved";

            const isSuspended =
              vendor.status === "suspended";

            return (
              <article
                key={vendor.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {vendor.business_name ||
                          "Unnamed vendor"}
                      </h2>

                      <StatusBadge status={vendor.status} />

                      {isActive && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            vendor.is_open
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {vendor.is_open
                            ? "Kitchen open"
                            : "Kitchen closed"}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                      <Detail
                        label="Vendor name"
                        value={vendor.full_name}
                      />

                      <Detail
                        label="Email"
                        value={vendor.email}
                      />

                      <Detail
                        label="Phone"
                        value={vendor.phone}
                      />

                      <Detail
                        label="Category"
                        value={vendor.vendor_type}
                      />

                      <Detail
                        label="Location"
                        value={vendor.location}
                      />

                      <Detail
                        label="Joined"
                        value={
                          vendor.created_at
                            ? new Date(
                                vendor.created_at,
                              ).toLocaleString()
                            : null
                        }
                      />
                    </div>
                  </div>

                  <div className="flex min-w-48 flex-col gap-3">
                    <Link
                      href={`/admin/vendor-applications?user_id=${encodeURIComponent(
                        vendor.id,
                      )}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      View application
                    </Link>

                    {isActive && !isSuspended && (
                      <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                        Active vendor
                      </div>
                    )}

                    {isSuspended && (
                      <div className="rounded-xl bg-orange-50 px-4 py-3 text-center text-sm font-semibold text-orange-700">
                        Suspended vendor
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalizedStatus = status || "unknown";

  const classes =
    normalizedStatus === "active" ||
    normalizedStatus === "approved"
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-gray-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}