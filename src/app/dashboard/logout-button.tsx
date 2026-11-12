"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/account/actions";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await logout();

      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-6 py-3 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={18} />

      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}