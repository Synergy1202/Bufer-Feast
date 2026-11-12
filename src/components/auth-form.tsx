"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, authChanged } from "@/lib/auth-store";
import { errorText, requestJson } from "@/lib/api-client";
import { loginSchema, signupSchema, safeNextPath } from "@/lib/auth-validation";
export function AuthForm({
  mode,
  next = "/account",
  confirmationError = false,
  confirmed = false,
}: {
  mode: "login" | "signup";
  next?: string;
  confirmationError?: boolean;
  confirmed?: boolean;
}) {
  const auth = useAuth(),
    router = useRouter();
  const signup = mode === "signup";
  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmation: "",
    acknowledged: false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(
      confirmationError
        ? "That confirmation link could not be opened. Use the link from your own signup email."
        : "",
    ),
    [message, setMessage] = useState("");
  function change(name: keyof typeof fields, value: string | boolean) {
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
  }
  async function submit() {
    if (busy || auth.loading || !auth.configured) return;
    const parsed = signup
      ? signupSchema.safeParse(fields)
      : loginSchema.safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (signup && fields.password !== fields.confirmation) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{
        ok: boolean;
        confirmationRequired?: boolean;
        message?: string;
      }>(`/api/auth/${mode}`, {
        method: "POST",
        bodyJSON: JSON.stringify(parsed.data),
      });
      setFields((current) => ({ ...current, password: "", confirmation: "" }));
      if (signup && result.confirmationRequired) {
        setMessage(
          result.message || "Check your email for the confirmation link.",
        );
      } else {
        const session = await authChanged();
        if (!session.user)
          throw new Error(
            "The account session was not established. Check cookies and the local app address, then sign in again.",
          );
        router.replace(
          signup && result.confirmationRequired === false
            ? "/account?setup=confirmation-off"
            : safeNextPath(next),
        );
        router.refresh();
      }
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="shell page-space auth-page">
      <div className="auth-intro">
        <p className="eyebrow">YOUR FAVOURITES, A LITTLE CLOSER</p>
        <h1 className="page-title">
          {signup ? (
            <>
              A place at
              <br />
              <em>the table.</em>
            </>
          ) : (
            <>
              Good to have
              <br />
              <em>you back.</em>
            </>
          )}
        </h1>
        <p className="page-intro">
          {signup
            ? "Create a development customer account to keep your test orders together."
            : "Sign in to access the test orders saved to your account—not someone else’s."}
        </p>
        <div className="auth-privacy">
          <LockKeyhole size={20} aria-hidden="true" />
          <p>
            Passwords are handled by Supabase Auth, not stored in the food-order
            table. This remains a development service: no payments or deliveries
            happen.
          </p>
        </div>
        <Link className="text-link" href="/kitchens">
          Keep exploring as a guest <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <section className="auth-panel" aria-labelledby="auth-panel-title">
        <h2 id="auth-panel-title">
          {signup ? "Create your account" : "Log in"}
        </h2>
        {confirmed && (
          <p className="setup-note">
            Your email confirmation was accepted. Log in with the password you
            chose.
          </p>
        )}
        {auth.loading ? (
          <p className="loading-note" role="status">
            Checking account setup…
          </p>
        ) : !auth.configured ? (
          <div className="setup-note">
            <strong>Account setup is not ready here yet.</strong>
            <p>
              {auth.reason ||
                "Check the authentication setup guide in your local project."}
            </p>
            <p>
              The separate Arena preview does not use your computer’s .env.local
              settings.
            </p>
          </div>
        ) : auth.user ? (
          <div>
            <p>
              You’re signed in as <strong>{auth.user.email}</strong>.
            </p>
            <Link className={buttonVariants({ size: "lg" })} href="/account">
              Open my account
            </Link>
            <p className="muted-small">
              Sign out from the account page before using a different account.
            </p>
          </div>
        ) : message ? (
          <div className="auth-success">
            <Check aria-hidden="true" />
            <h3>Check your email</h3>
            <p>{message}</p>
            <p>
              Open the link and then press{" "}
              <strong>Confirm email and sign in</strong> on the page it opens.
              If the account already exists, use Log in instead.
            </p>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href="/login"
            >
              Go to log in
            </Link>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                event.target instanceof HTMLInputElement &&
                event.target.type !== "checkbox"
              ) {
                event.preventDefault();
                submit();
              }
            }}
          >
            {signup && (
              <div className="form-field">
                <Label htmlFor="signup-name">Display name</Label>
                <Input
                  id="signup-name"
                  value={fields.name}
                  onChange={(event) => change("name", event.target.value)}
                  autoComplete="name"
                  maxLength={80}
                  placeholder="Demo Customer"
                  disabled={busy}
                />
              </div>
            )}
            <div className="form-field">
              <Label htmlFor="auth-email">Email address you control</Label>
              <Input
                id="auth-email"
                type="email"
                value={fields.email}
                onChange={(event) => change("email", event.target.value)}
                autoComplete="email"
                maxLength={254}
                required
                disabled={busy}
              />
            </div>
            <div className="form-field">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={fields.password}
                onChange={(event) => change("password", event.target.value)}
                autoComplete={signup ? "new-password" : "current-password"}
                maxLength={128}
                required
                disabled={busy}
              />
              {signup && (
                <small>
                  Use at least 12 characters and a unique test-account
                  password—not your Supabase administrator password.
                </small>
              )}
            </div>
            {signup && (
              <>
                <div className="form-field">
                  <Label htmlFor="auth-confirm-password">Repeat password</Label>
                  <Input
                    id="auth-confirm-password"
                    type="password"
                    value={fields.confirmation}
                    onChange={(event) =>
                      change("confirmation", event.target.value)
                    }
                    autoComplete="new-password"
                    maxLength={128}
                    disabled={busy}
                  />
                </div>
                <label className="test-ack">
                  <input
                    type="checkbox"
                    checked={fields.acknowledged}
                    onChange={(event) =>
                      change("acknowledged", event.target.checked)
                    }
                    disabled={busy}
                  />
                  <span>
                    I own this email address and understand that this is a
                    development customer account.
                  </span>
                </label>
                <p className="muted-small">
                  If you use Supabase’s default email sender, test with your
                  project-owner/team email. General customer email delivery
                  needs appropriate SMTP setup. Keep email confirmation enabled.
                </p>
              </>
            )}
            {(error || auth.error) && (
              <p className="error-panel" role="alert">
                {error || auth.error}
              </p>
            )}
            <Button
              type="button"
              size="lg"
              className="summary-action"
              onClick={submit}
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : signup
                  ? "Create test account"
                  : "Log in"}
              <ArrowRight aria-hidden="true" />
            </Button>
            <p className="auth-switch">
              {signup
                ? "Already have an account?"
                : "New to this test service?"}{" "}
              <Link
                href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(safeNextPath(next))}`}
              >
                {signup ? "Log in" : "Create an account"}
              </Link>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
