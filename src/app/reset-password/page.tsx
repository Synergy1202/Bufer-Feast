"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // ✅ FIXED: Using shared client
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      setIsReady(true);
    } else {
      setMessage("Invalid or expired reset link. Please request a new one.");
      setMessageType("error");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setMessage("Password updated successfully! Redirecting to login...");
      setMessageType("success");
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setMessage(error.message || "Failed to update password.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#183e32] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f5] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#183e32] mb-6">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#183e32] rounded-full mb-4">
            <Lock size={28} className="text-[#90a765]" />
          </div>
          <h1 className="text-3xl font-bold text-[#183e32] mb-2">Set New Password</h1>
          <p className="text-gray-500 text-sm">Enter a new password for your account.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
            messageType === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {messageType === "success" ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
            <p className="text-sm">{message}</p>
          </div>
        )}

        {isReady && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">New Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#90a765] focus:border-transparent outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Confirm Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#90a765] focus:border-transparent outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#183e32] text-white font-bold rounded-xl hover:bg-[#90a765] hover:text-[#183e32] transition-all duration-300 shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}