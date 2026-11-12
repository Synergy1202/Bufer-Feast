"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth, logoutCustomer, refreshAuth } from "@/lib/auth-store";
import { errorText } from "@/lib/api-client";
export function AccountView({
  confirmationOff = false,
}: {
  confirmationOff?: boolean;
}) {
  const auth = useAuth(),
    router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    try {
      await logoutCustomer();
      router.replace("/login");
      router.refresh();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="shell page-space narrow-page">
      <p className="eyebrow">YOUR PLACE AT THE TABLE</p>
      <h1 className="page-title">My account.</h1>
      {auth.loading ? (
        <p role="status" className="loading-note">
          Verifying your session…
        </p>
      ) : auth.error ? (
        <div>
          <p className="error-panel" role="alert">
            {auth.error}
          </p>
          <Button onClick={() => refreshAuth().catch(() => {})}>
            Retry session check
          </Button>
        </div>
      ) : !auth.user ? (
        <section className="auth-panel">
          <h2>Sign in to continue</h2>
          <p>
            {auth.configured
              ? "Use the customer account you created for this application. Your Supabase dashboard login is a separate account."
              : auth.reason}
          </p>
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Log in <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <>
          {confirmationOff && (
            <p className="setup-note">
              Your Supabase project did not require email confirmation for this
              signup. Re-enable Confirm email before testing with other people.
              Do not treat auto-confirmation as proof that an email was
              verified.
            </p>
          )}
          <div className="account-summary">
            <ShieldCheck size={27} aria-hidden="true" />
            <div>
              <h2>{auth.user.name || "Your customer account"}</h2>
              <p>{auth.user.email}</p>
              <span>Session verified with Supabase Auth</span>
            </div>
          </div>
          <div className="about-stack">
            <div>
              <strong>Your account orders</strong>
              <span>
                New test orders saved while signed in are linked to your account
                and require this login to view.
              </span>
              <Link href="/orders" className="text-link">
                View my orders <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div>
              <strong>Older guest records</strong>
              <span>
                These stay separate. Open a guest record and explicitly link it
                to this account if it belongs to you.
              </span>
              <Link href="/orders#guest-orders" className="text-link">
                Review browser records{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <p className="muted-small">
            This is still a development service. Payments, vendor acceptance,
            delivery, password recovery and account-deletion workflows are not
            implemented.
          </p>
          <Button variant="outline" size="lg" disabled={busy} onClick={logout}>
            <LogOut aria-hidden="true" />
            {busy ? "Signing out…" : "Sign out of this browser"}
          </Button>
          {error && (
            <p className="error-panel" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
