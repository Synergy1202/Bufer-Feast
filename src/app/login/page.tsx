"use client";

import { useActionState, useState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const initialLoginState: LoginState = {
    error: "",
  };

  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginState,
  );

  const [googleError, setGoogleError] = useState("");

  // Continue with the rest of your existing login page...
  async function handleGoogleLogin() {
    setGoogleError("");

    const { protocol, hostname, port } = window.location;

    const browserHostname =
      hostname === "0.0.0.0" ? "localhost" : hostname;

    const origin = `${protocol}//${browserHostname}${
      port ? `:${port}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setGoogleError(
        "Google sign-in could not start. Please try again.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111111] rounded-3xl border border-[#333333] p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF5500] rounded-full mb-4">
            <LogIn size={28} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="text-[#a0a0a0] text-sm mt-2">
            Sign in to your Bufer Feast account.
          </p>
        </div>

        {(state.error || googleError) && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {state.error || googleError}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3.5 bg-[#1a1a1a] border border-[#333333] text-white font-bold rounded-xl hover:bg-[#2a2a2a] transition-all mb-6"
        >
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333333]" />
          </div>

          <div className="relative flex justify-center text-sm">
            <span className="bg-[#111111] px-2 text-[#a0a0a0]">
              Or continue with email
            </span>
          </div>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-[#a0a0a0] uppercase mb-1"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl outline-none text-white placeholder-[#666] focus:border-[#FF5500]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-[#a0a0a0] uppercase mb-1"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl outline-none text-white placeholder-[#666] focus:border-[#FF5500]"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] disabled:opacity-50"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#333333] text-center">
          <p className="text-sm text-[#a0a0a0]">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="text-[#FF5500] font-bold hover:underline"
            >
              Sign up as a customer
            </a>
          </p>

          <p className="text-sm text-[#a0a0a0] mt-3">
            Want to sell food?{" "}
            <a
              href="/signup"
              className="text-[#FF5500] font-bold hover:underline"
            >
              Become a vendor
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
