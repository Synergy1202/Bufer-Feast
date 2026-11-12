import Link from "next/link";

type CheckEmailPageProps = {
  searchParams: Promise<{
    type?: string;
    email?: string;
  }>;
};

export default async function CheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const params = await searchParams;

  const isVendor = params.type === "vendor";
  const email = params.email || "your email address";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
          âœ‰ï¸
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Check your email
        </h1>

        <p className="mt-4 text-slate-600">
          We sent a verification link to:
        </p>

        <p className="mt-2 break-all font-semibold text-orange-600">
          {email}
        </p>

        <p className="mt-6 text-sm leading-6 text-slate-600">
          Click the link in the email to verify your account. After
          verification, return here and log in.
        </p>

        {isVendor && (
          <p className="mt-4 rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900">
            Your vendor application has been received. After verifying your
            email, an administrator will review your business and documents.
          </p>
        )}

        <p className="mt-6 text-sm text-slate-500">
          The email may take a few minutes to arrive. Check your spam or junk
          folder if you cannot find it.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
        >
          Go to login
        </Link>
      </div>
    </main>
  );
}
