import Link from "next/link";
import {
  BarChart3,
  ClipboardCheck,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-[#111111] text-white">
        <div className="p-6 border-b border-gray-800">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <span className="w-9 h-9 rounded-full bg-[#FF5500] flex items-center justify-center font-bold">
              J
            </span>

            <span className="font-bold">
              Admin Panel
            </span>
          </Link>

          <p className="text-xs text-gray-400 mt-3 uppercase tracking-wider">
            Bufer Feast
          </p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <BarChart3 size={18} />
            Dashboard
          </Link>

          <Link
            href="/admin/vendor-applications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ClipboardCheck size={18} />
            Vendor Applications
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ShoppingBag size={18} />
            Orders
          </Link>

          <Link
            href="/admin/customers"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Users size={18} />
            Customers
          </Link>

          <Link
            href="/admin/security"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ShieldCheck size={18} />
            Security
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </nav>
      </aside>

      <main className="min-h-screen ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
