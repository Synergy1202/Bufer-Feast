"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { requestJson, errorText } from "@/lib/api-client";

type AccountType = "customer" | "vendor";

export function EmailOtpVerification({
  email,
  accountType,
}: {
  email: string;
  accountType: AccountType;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Your email address is missing. Please return to registration and try again.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code sent to your email.");
      return;
    }
    setBusy(true);
    try {
      await requestJson<{ ok: boolean }>("/api/auth/verify-otp", {
        method: "POST",
        bodyJSON: JSON.stringify({ email, token: code }),
      });
      router.replace(accountType === "vendor" ? "/vendor/pending" : "/account");
      router.refresh();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setError("");
    setMessage("");
    if (!email) {
      setError("Your email address is missing. Please return to registration and try again.");
      return;
    }
    setResending(true);
    try {
      const result = await requestJson<{ message: string }>("/api/auth/resend-otp", {
        method: "POST",
        bodyJSON: JSON.stringify({ email }),
      });
      setMessage(result.message || "A new verification code has been sent.");
      setCode("");
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setResending(false);
    }
  }

  const isVendor = accountType === "vendor";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-9">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <MailCheck size={30} aria-hidden="true" />
        </div>
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
          Email verification
        </p>
        <h1 className="mt-2 text-center text-3xl font-bold text-slate-900">
          Verify your email
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-600">
          Enter the six-digit code we sent to
        </p>
        <p className="mt-1 break-all text-center font-semibold text-orange-600">{email || "your email address"}</p>

        {isVendor && (
          <div className="mt-5 rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900">
            Your vendor application has been saved and will remain pending until an administrator reviews and approves it.
          </div>
        )}

        <form onSubmit={verifyCode} className="mt-7 space-y-5">
          <label htmlFor="email-otp" className="block text-sm font-semibold text-slate-700">
            Six-digit verification code
          </label>
          <input
            id="email-otp"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            aria-describedby="otp-help"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.65em] text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            required
          />
          <p id="otp-help" className="text-xs text-slate-500">
            The code is six digits. Check your spam folder if you cannot find the email.
          </p>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={busy || code.length !== 6 || !email}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Verifying..." : <><ShieldCheck size={18} /> Verify email</>}
          </button>
        </form>

        <button
          type="button"
          onClick={resendCode}
          disabled={resending || busy || !email}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
          {resending ? "Sending code..." : "Resend code"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">Log in</Link>
        </p>
      </section>
    </main>
  );
}
