"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authChanged, useAuth } from "@/lib/auth-store";
import { errorText, requestJson } from "@/lib/api-client";

export function ConfirmEmail() {
  const router = useRouter();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ ok: boolean; signedIn?: boolean; role?: string; status?: string; hasAddress?: boolean }>(
        "/api/auth/confirm",
        { method: "POST", bodyJSON: "{}" },
      );
      const session = await authChanged();
      if (result.signedIn === false || !session.user) router.replace("/login?confirmed=1");
      else if (result.role === "vendor") router.replace(result.status === "approved" || result.status === "active" ? "/vendor/dashboard" : "/vendor/pending");
      else router.replace(result.hasAddress ? "/account" : "/account/address");
      router.refresh();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email || resending) return;
    setResending(true);
    setError("");
    setResendMessage("");
    try {
      const result = await requestJson<{ message?: string }>("/api/auth/resend-otp", {
        method: "POST",
        bodyJSON: JSON.stringify({ email }),
      });
      setResendMessage(result.message || "A fresh confirmation link has been sent.");
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="shell page-space narrow-page">
      <p className="eyebrow">EMAIL CONFIRMATION</p>
      <h1 className="page-title">Your email link is ready.</h1>
      <div className="auth-panel confirmation-panel">
        <MailCheck size={35} aria-hidden="true" />
        <p>Only continue if you requested this signup and opened the link from your own email. This final step confirms the account and starts its session in this browser.</p>
        {auth.user && <p className="setup-note">You’re currently signed in as {auth.user.email}. Confirming may change the account in this browser.</p>}
        <Button size="lg" onClick={confirm} disabled={busy}>{busy ? "Confirming…" : "Confirm email and continue"}</Button>
        {error && <p className="error-panel" role="alert">{error}</p>}
        <div className="mt-6 space-y-2">
          <label htmlFor="resend-confirmation-email" className="block text-sm font-semibold">Expired link? Enter your email to get a fresh one.</label>
          <input id="resend-confirmation-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <Button size="lg" onClick={resend} disabled={resending || !email}>{resending ? "Sending..." : "Resend confirmation link"}</Button>
          {resendMessage && <p role="status" className="text-sm text-green-700">{resendMessage}</p>}
        </div>
        <Link href="/login" className="text-link">Return to log in</Link>
      </div>
    </div>
  );
}
