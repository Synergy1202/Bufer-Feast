"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authChanged, useAuth } from "@/lib/auth-store";
import { errorText, requestJson } from "@/lib/api-client";
export function ConfirmEmail() {
  const router = useRouter(),
    auth = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ ok: boolean; signedIn?: boolean }>(
        "/api/auth/confirm",
        {
          method: "POST",
          bodyJSON: "{}",
        },
      );
      const session = await authChanged();
      router.replace(
        result.signedIn === false || !session.user
          ? "/login?confirmed=1"
          : "/account",
      );
      router.refresh();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="shell page-space narrow-page">
      <p className="eyebrow">ONE MORE STEP</p>
      <h1 className="page-title">Confirm your email.</h1>
      <div className="auth-panel confirmation-panel">
        <MailCheck size={35} aria-hidden="true" />
        <p>
          Only continue if you requested this signup and opened the link from
          your own email. Confirming will start that account’s session in this
          browser.
        </p>
        {auth.user && (
          <p className="setup-note">
            You’re currently signed in as {auth.user.email}. This confirmation
            may change the account in this browser.
          </p>
        )}
        <Button size="lg" onClick={confirm} disabled={busy}>
          {busy ? "Confirming…" : "Confirm email and sign in"}
        </Button>
        {error && (
          <p className="error-panel" role="alert">
            {error}
          </p>
        )}
        <Link href="/login" className="text-link">
          Return to log in
        </Link>
      </div>
    </div>
  );
}
