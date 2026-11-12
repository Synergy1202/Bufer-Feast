import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function FloatingSupportButton() {
  return (
    <Link
      href="/support"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white text-[#183e32] px-5 py-3 rounded-full shadow-xl border border-gray-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
      aria-label="Contact Support"
    >
      <MessageCircle size={20} className="text-[#90a765] group-hover:rotate-12 transition-transform" />
      <span className="font-bold text-sm hidden sm:block">Need Help?</span>
    </Link>
  );
}