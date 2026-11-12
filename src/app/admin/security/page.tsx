import {
  CheckCircle2,
  FileLock2,
  MailCheck,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { requireAdmin } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type SecurityItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
  statusClass: string;
};

export default async function AdminSecurityPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Security
        </h1>

        <p className="mt-2 text-gray-500">
          Review the protection status of important platform systems.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SecurityItem
          icon={<ShieldCheck size={26} />}
          title="Admin authorization"
          description="Admin pages require an authenticated profile with role admin and active status."
          status="Protected"
          statusClass="bg-green-100 text-green-700"
        />

        <SecurityItem
          icon={<CheckCircle2 size={26} />}
          title="Vendor route authorization"
          description="Vendor access is checked against the database profile role and status."
          status="Protected"
          statusClass="bg-green-100 text-green-700"
        />

        <SecurityItem
          icon={<FileLock2 size={26} />}
          title="Private vendor documents"
          description="Identity and CAC documents are stored in a private bucket and served through temporary signed links."
          status="Protected"
          statusClass="bg-green-100 text-green-700"
        />

        <SecurityItem
          icon={<MailCheck size={26} />}
          title="Email confirmation"
          description="New customer and vendor accounts must verify their email address before login."
          status="Required"
          statusClass="bg-blue-100 text-blue-700"
        />

        <SecurityItem
          icon={<WalletCards size={26} />}
          title="Payment integration"
          description="Paystack and payment processing remain deferred until ordering authorization is fully verified."
          status="Deferred"
          statusClass="bg-yellow-100 text-yellow-700"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          Authorization rules
        </h2>

        <div className="mt-5 space-y-4">
          <Rule
            title="Admin access"
            value="profiles.role = admin AND profiles.status = active"
          />

          <Rule
            title="Approved vendor access"
            value="profiles.role = vendor AND profiles.status = active"
          />

          <Rule
            title="Pending vendor access"
            value="Redirected to /vendor/pending"
          />

          <Rule
            title="Rejected or suspended vendor access"
            value="Vendor portal access denied"
          />

          <Rule
            title="Private documents"
            value="Only active admins can generate temporary signed URLs"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <h2 className="text-xl font-bold text-orange-900">
          Security reminders
        </h2>

        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-orange-900">
          <li>
            Never expose the Supabase service-role key in browser code.
          </li>

          <li>
            Never make the vendor-documents bucket public.
          </li>

          <li>
            Do not authorize vendors using user-editable metadata.
          </li>

          <li>
            Always check the database profile role and status on the server.
          </li>

          <li>
            Payments remain disabled until secure order ownership is verified.
          </li>
        </ul>
      </section>
    </main>
  );
}

function SecurityItem({
  icon,
  title,
  description,
  status,
  statusClass,
}: SecurityItemProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
        >
          {status}
        </span>
      </div>

      <h2 className="mt-5 text-lg font-bold text-gray-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </article>
  );
}

function Rule({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-1 font-mono text-sm text-gray-900">
        {value}
      </p>
    </div>
  );
}