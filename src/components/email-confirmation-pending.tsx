"use client";
import Link from "next/link";
import { useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";
import { requestJson, errorText } from "@/lib/api-client";

export function EmailConfirmationPending({ email, accountType }: { email: string; accountType: "customer" | "vendor" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function resend() {
    if (!email || busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await requestJson<{ message?: string }>("/api/auth/resend-otp", {
        method: "POST",
        bodyJSON: JSON.stringify({ email }),
      });
      setMessage(result.message || "A new confirmation link has been sent.");
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600"><MailCheck size={30}/></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Check your inbox</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Confirm your email</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">We sent a confirmation link to</p>
        <p className="mt-1 break-all font-semibold text-orange-600">{email || "the email address you registered with"}</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">Open the email and select the confirmation link. We will then sign you in and take you to the correct {accountType === "vendor" ? "vendor application status" : "customer account"} page. Check Spam or Promotions if you cannot find it.</p>
        {accountType === "vendor" && <p className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">Email confirmation does not approve a vendor application. Your application remains pending until an administrator reviews it.</p>}
        {message && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={resend} disabled={busy || !email} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={busy ? "animate-spin" : ""}/>{busy ? "Sending link..." : "Resend confirmation link"}</button>
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-orange-600">Back to login</Link>
      </section>
    </main>
  );
}
