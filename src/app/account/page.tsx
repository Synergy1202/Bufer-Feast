import AccountClient from "./AccountClient";
import { authClient, requireCustomer } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await requireCustomer();
  const supabase = await authClient();

  const [
    { data: userResult },
    { data: profile },
    { data: addresses, error: addressesError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", customer.id)
      .maybeSingle(),
    supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", customer.id)
      .order("created_at", { ascending: false }),
  ]);

  if (addressesError) {
    console.error("Failed to load saved addresses:", addressesError.message);
  }

  const user = userResult.user;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="bg-[#111111] p-8 rounded-3xl shadow-xl border border-[#333333] max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Access Denied
          </h2>

          <p className="text-[#a0a0a0] mb-6">
            You must be logged in to view this page.
          </p>

          <a
            href="/login"
            className="inline-block px-6 py-3 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-all"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AccountClient
      user={user}
      profile={profile}
      addresses={addresses || []}
    />
  );
}