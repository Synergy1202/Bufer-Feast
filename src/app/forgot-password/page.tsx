"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // ✅ FIXED: Using shared client
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage("Check your email! We've sent you a link to reset your password.");
      setMessageType("success");
      setEmail("");
    } catch (error: any) {
      setMessage(error.message || "Failed to send reset email. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f5] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#183e32] mb-6">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#183e32] rounded-full mb-4">
            <Mail size={28} className="text-[#90a765]" />
          </div>
          <h1 className="text-3xl font-bold text-[#183e32] mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">Enter your email and we'll send you a reset link.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
            messageType === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {messageType === "success" ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 uppercase">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#90a765] focus:border-transparent outline-none transition-all" 
              placeholder="you@example.com" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#183e32] text-white font-bold rounded-xl hover:bg-[#90a765] hover:text-[#183e32] transition-all duration-300 shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="text-[#90a765] font-bold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}