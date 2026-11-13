import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { verifiedCustomer } from "@/lib/server/auth";
import { reapplyVendor } from "./actions";
import { adminClient } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

function policyNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

type ProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  business_name: string | null;
  role: string | null;
  status: string | null;
  rejection_reason: string | null;
  suspension_reason: string | null;
};

type ApplicationRecord = {
  user_id: string;
  business_name: string | null;
  status: string | null;
  rejection_reason: string | null;
  suspension_reason: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  reapplication_count: number | null;
  reapplication_allowed: boolean | null;
  next_reapplication_at: string | null;
};

export default async function VendorPendingPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const params = await searchParams;
  const customer = await verifiedCustomer();

  if (!customer) {
    redirect("/login");
  }

  const admin = adminClient();

  const profileResult = await admin
    .from("profiles")
    .select(
      [
        "id",
        "email",
        "full_name",
        "business_name",
        "role",
        "status",
        "rejection_reason",
        "suspension_reason",
      ].join(", "),
    )
    .eq("id", customer.id)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(
      `Could not load vendor profile: ${profileResult.error.message}`,
    );
  }

  const profile =
    profileResult.data as unknown as ProfileRecord | null;

  if (profile?.role !== "vendor") {
    redirect("/");
  }

  if (
    profile.status === "active" ||
    profile.status === "approved"
  ) {
    redirect("/vendor/dashboard");
  }

  const applicationResult = await admin
    .from("fernami_vendor_applications")
    .select(
      [
        "user_id",
        "business_name",
        "status",
        "rejection_reason",
        "suspension_reason",
        "admin_notes",
        "reviewed_at",
        "submitted_at",
        "reapplication_count",
        "reapplication_allowed",
        "next_reapplication_at",
      ].join(", "),
    )
    .eq("user_id", customer.id)
    .maybeSingle();

  if (applicationResult.error) {
    throw new Error(
      `Could not load vendor application: ${applicationResult.error.message}`,
    );
  }

  const application =
    applicationResult.data as unknown as ApplicationRecord | null;

  const status =
    profile.status ||
    application?.status ||
    "pending";

  const rejectionReason =
    application?.rejection_reason ||
    profile.rejection_reason ||
    "";

  const suspensionReason =
    application?.suspension_reason ||
    profile.suspension_reason ||
    "";

  const isRejected =
    status === "rejected" ||
    Boolean(rejectionReason);

  const isSuspended =
    status === "suspended" ||
    Boolean(suspensionReason);

  const isPending =
    !isRejected &&
    !isSuspended;
  const maxResubmissions = policyNumber(process.env.VENDOR_MAX_RESUBMISSIONS, 2);
  const reapplicationCount = application?.reapplication_count || 0;
  const nextReapplicationAt = application?.reviewed_at
    ? new Date(new Date(application.reviewed_at).getTime() + policyNumber(process.env.VENDOR_REAPPLICATION_COOLDOWN_DAYS, 7) * 86400000).toISOString()
    : application?.next_reapplication_at || null;
  const reapplicationAvailable = isRejected
    && reapplicationCount < maxResubmissions
    && (!nextReapplicationAt || Date.now() >= new Date(nextReapplicationAt).getTime());

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                isRejected
                  ? "bg-red-100 text-red-600"
                  : isSuspended
                    ? "bg-orange-100 text-orange-600"
                    : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {isRejected ? (
                <AlertTriangle size={32} />
              ) : isSuspended ? (
                <ShieldAlert size={32} />
              ) : (
                <Clock3 size={32} />
              )}
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              {isRejected
                ? "Application not approved"
                : isSuspended
                  ? "Vendor account suspended"
                  : "Application under review"}
            </h1>

            <p className="mt-3 text-slate-600">
              {profile.business_name ||
                application?.business_name ||
                "Your vendor application"}
            </p>
          </div>

          {params.error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</p>}
          {params.submitted === "1" && <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">Your reapplication has been submitted and is awaiting review.</p>}

          {isPending && (
            <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex gap-3">
                <Clock3
                  className="mt-0.5 shrink-0 text-yellow-700"
                  size={22}
                />

                <div>
                  <h2 className="font-bold text-yellow-900">
                    Your application is being reviewed
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-yellow-900">
                    Our team is reviewing your business information, identity
                    document, and CAC certificate. You will be able to access
                    the vendor portal after approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex gap-3">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-red-700"
                  size={22}
                />

                <div>
                  <h2 className="font-bold text-red-900">
                    Reason for rejection
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-950">
                    {rejectionReason ||
                      "Your application was not approved. Please contact support for more information."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
              {reapplicationAvailable ? (
                <>
                  <h2 className="font-bold text-slate-900">You can submit a reapplication</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">You have used {reapplicationCount} of {maxResubmissions} permitted reapplications. Submitting again will return your existing application to review.</p>
                  <form action={reapplyVendor} className="mt-4">
                    <button type="submit" className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">Resubmit application</button>
                  </form>
                </>
              ) : nextReapplicationAt && reapplicationCount < maxResubmissions ? (
                <p className="text-sm leading-6 text-slate-700">You may reapply after {new Date(nextReapplicationAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} (Nigeria time).</p>
              ) : (
                <p className="text-sm leading-6 text-slate-700">The reapplication limit for this account has been reached. Please contact support if you need help.</p>
              )}
            </div>
          )}

          {isSuspended && (
            <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex gap-3">
                <ShieldAlert
                  className="mt-0.5 shrink-0 text-orange-700"
                  size={22}
                />

                <div>
                  <h2 className="font-bold text-orange-900">
                    Reason for suspension
                  </h2>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-950">
                    {suspensionReason ||
                      "Your vendor account has been suspended. Please contact support for more information."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard
              label="Account email"
              value={profile.email || customer.email}
              icon={<Mail size={18} />}
            />

            <InfoCard
              label="Application status"
              value={formatStatus(status)}
              icon={<CheckCircle2 size={18} />}
            />

            {application?.submitted_at && (
              <InfoCard
                label="Submitted"
                value={new Date(
                  application.submitted_at,
                ).toLocaleDateString("en-NG")}
                icon={<Clock3 size={18} />}
              />
            )}

            {application?.reviewed_at && (
              <InfoCard
                label="Reviewed"
                value={new Date(
                  application.reviewed_at,
                ).toLocaleDateString("en-NG")}
                icon={<CheckCircle2 size={18} />}
              />
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to marketplace
            </Link>

            <a
              href="mailto:support@jie-bulk-order.com"
              className="rounded-xl bg-orange-600 px-5 py-3 text-center font-semibold text-white hover:bg-orange-700"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function formatStatus(status: string | null) {
  return String(status || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <p className="text-xs font-bold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}