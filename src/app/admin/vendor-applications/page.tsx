import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";
import {
  approveVendor,
  rejectVendor,
  suspendVendor,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function VendorApplicationsPage() {
  await requireAdmin();

  const client = adminClient();

  const { data: applications, error } = await client
    .from("fernami_vendor_applications")
    .select("*")
    .order("submitted_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Vendor Applications
        </h1>

        <p className="mt-2 text-gray-500">
          Review vendor businesses, identity documents, CAC certificates,
          and application decisions.
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            No applications yet
          </h2>

          <p className="mt-2 text-gray-500">
            New vendor applications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {applications.map((application: any) => {
            const applicationKey = `${application.user_id}-${application.submitted_at}`;

            const isPending =
              application.status === "pending_review" ||
              application.status === "pending";

            const isApproved =
              application.status === "approved" ||
              application.status === "active";

            const identityDocumentUrl =
              application.id_document_url
                ? `/admin/vendor-applications/document?user_id=${encodeURIComponent(
                    application.user_id,
                  )}&type=identity`
                : null;

            const cacDocumentUrl =
              application.cac_document_url
                ? `/admin/vendor-applications/document?user_id=${encodeURIComponent(
                    application.user_id,
                  )}&type=cac`
                : null;

            return (
              <article
                key={applicationKey}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        {application.business_name ||
                          "Unnamed business"}
                      </h2>

                      <StatusBadge status={application.status} />
                    </div>

                    {/* Application details */}
                    <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                      <Detail
                        label="Applicant"
                        value={application.full_legal_name}
                      />

                      <Detail
                        label="Email"
                        value={application.email}
                      />

                      <Detail
                        label="Phone"
                        value={application.phone}
                      />

                      <Detail
                        label="Category"
                        value={application.category}
                      />

                      <Detail
                        label="Area"
                        value={application.public_area}
                      />

                      <Detail
                        label="Address"
                        value={application.public_address}
                      />

                      <Detail
                        label="ID Type"
                        value={application.id_proof_type}
                      />

                      <Detail
                        label="ID Number"
                        value={application.id_proof_number}
                      />

                      <Detail
                        label="CAC Number"
                        value={application.cac_number}
                      />

                      <Detail
                        label="Submitted"
                        value={
                          application.submitted_at
                            ? new Date(
                                application.submitted_at,
                              ).toLocaleString()
                            : null
                        }
                      />

                      {application.reviewed_at && (
                        <Detail
                          label="Reviewed"
                          value={new Date(
                            application.reviewed_at,
                          ).toLocaleString()}
                        />
                      )}
                    </div>

                    {/* Private document viewing */}
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                        Verification documents
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Documents open through temporary private links and
                        expire after five minutes.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {identityDocumentUrl ? (
                          <a
                            href={identityDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            View identity document
                          </a>
                        ) : (
                          <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">
                            Identity document missing
                          </span>
                        )}

                        {cacDocumentUrl ? (
                          <a
                            href={cacDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                          >
                            View CAC certificate
                          </a>
                        ) : (
                          <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">
                            CAC certificate missing
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Saved rejection reason */}
                    {application.rejection_reason && (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                          Rejection reason
                        </p>

                        <p className="mt-2 text-sm leading-6 text-red-950">
                          {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Saved suspension reason */}
                    {application.suspension_reason && (
                      <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                          Suspension reason
                        </p>

                        <p className="mt-2 text-sm leading-6 text-orange-950">
                          {application.suspension_reason}
                        </p>
                      </div>
                    )}

                    {/* General admin notes */}
                    {application.admin_notes &&
                      !application.rejection_reason &&
                      !application.suspension_reason && (
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            Admin notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-900">
                            {application.admin_notes}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Admin actions */}
                  <div className="flex min-w-64 flex-col gap-3">
                    {isPending && (
                      <>
                        <form
                          action={async () => {
                            "use server";

                            await approveVendor(
                              application.user_id,
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition hover:bg-green-700"
                          >
                            Approve Vendor
                          </button>
                        </form>

                        <form
                          action={async (formData) => {
                            "use server";

                            const reason = String(
                              formData.get("reason") || "",
                            );

                            await rejectVendor(
                              application.user_id,
                              reason,
                            );
                          }}
                          className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
                        >
                          <div>
                            <label
                              htmlFor={`rejection-${application.user_id}`}
                              className="mb-2 block text-sm font-bold text-red-900"
                            >
                              Reason for rejection
                            </label>

                            <textarea
                              id={`rejection-${application.user_id}`}
                              name="reason"
                              required
                              minLength={5}
                              maxLength={2000}
                              rows={4}
                              placeholder="Explain why this application is being rejected."
                              className="w-full rounded-lg border border-red-200 bg-white px-3 py-3 text-sm text-red-950 outline-none placeholder:text-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700"
                          >
                            Reject Application
                          </button>
                        </form>
                      </>
                    )}

                    {isApproved && (
                      <form
                        action={async (formData) => {
                          "use server";

                          const reason = String(
                            formData.get("reason") || "",
                          );

                          await suspendVendor(
                            application.user_id,
                            reason,
                          );
                        }}
                        className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
                      >
                        <div>
                          <label
                            htmlFor={`suspension-${application.user_id}`}
                            className="mb-2 block text-sm font-bold text-orange-900"
                          >
                            Reason for suspension
                          </label>

                          <textarea
                            id={`suspension-${application.user_id}`}
                            name="reason"
                            required
                            minLength={5}
                            maxLength={2000}
                            rows={4}
                            placeholder="Explain why this vendor is being suspended."
                            className="w-full rounded-lg border border-orange-200 bg-white px-3 py-3 text-sm text-orange-950 outline-none placeholder:text-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white transition hover:bg-orange-700"
                        >
                          Suspend Vendor
                        </button>
                      </form>
                    )}

                    {application.status === "rejected" && (
                      <div className="rounded-xl bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
                        Application rejected
                      </div>
                    )}

                    {application.status === "suspended" && (
                      <div className="rounded-xl bg-orange-50 p-4 text-center text-sm font-semibold text-orange-700">
                        Vendor suspended
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
  status: string | null | undefined;
}) {
  const value = status || "unknown";

  const classes =
    value === "approved" || value === "active"
      ? "bg-green-100 text-green-700"
      : value === "rejected"
        ? "bg-red-100 text-red-700"
        : value === "suspended"
          ? "bg-orange-100 text-orange-700"
          : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}
    >
      {value.replace(/_/g, " ")}
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