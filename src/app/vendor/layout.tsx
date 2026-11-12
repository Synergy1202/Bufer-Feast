import Link from "next/link";
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings, LogOut, ChefHat, ClipboardList } from "lucide-react";

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* 1. THE SIDEBAR NAVIGATION BOARD */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo Area */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 text-[#183e32]">
            <div className="w-8 h-8 bg-[#183e32] rounded-lg flex items-center justify-center">
              <ChefHat size={20} className="text-[#90a765]" />
            </div>
            <span className="font-bold text-xl tracking-tight">Bufer Feast<span className="text-[#90a765]">.</span></span>
          </Link>
          <p className="text-xs text-gray-400 mt-2 ml-10 font-medium uppercase tracking-wider">Vendor Portal</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/vendor/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#183e32] transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-[#90a765]" />
            <span className="font-medium text-sm">Overview</span>
          </Link>
          
          <Link href="/vendor/menus" className="flex items-center gap-3 px-4 py-3 bg-[#f0f3e8] text-[#183e32] rounded-xl transition-all">
            <UtensilsCrossed size={20} className="text-[#90a765]" />
            <span className="font-bold text-sm">My Menus</span>
          </Link>
   <Link href="/vendor/prep-sheet" className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#183e32] transition-all group">
     <ClipboardList size={20} className="group-hover:text-[#90a765]" />
     <span className="font-medium text-sm">Kitchen Prep Sheet</span>
   </Link>
          <Link href="/vendor/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#183e32] transition-all group">
            <ShoppingBag size={20} className="group-hover:text-[#90a765]" />
            <span className="font-medium text-sm">Orders</span>
            {/* Fake notification badge to look pro */}
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
          </Link>

          <Link href="/vendor/settings" className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#183e32] transition-all group">
            <Settings size={20} className="group-hover:text-[#90a765]" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </nav>

        {/* Bottom Profile / Logout */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#183e32] text-white flex items-center justify-center font-bold text-sm">
              MK
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mama Kech</p>
              <p className="text-xs text-gray-500">Vendor Account</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={16} /> Sign Out
          </Link>
        </div>
      </aside>

      {/* 2. THE MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>

    </div>
  );
}
