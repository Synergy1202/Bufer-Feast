import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function EmptyState({
  title,
  description,
  href = "/kitchens",
  label = "Explore sample kitchens",
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4 bg-[#111111] border border-dashed border-[#333333] rounded-3xl shadow-2xl">
      {/* Glowing Icon Background */}
      <div className="w-24 h-24 bg-[#FF5500]/10 rounded-full flex items-center justify-center mb-8 relative">
        <div className="absolute inset-0 bg-[#FF5500]/20 rounded-full blur-xl animate-pulse"></div>
        <ShoppingBag size={40} className="text-[#FF5500] relative z-10" aria-hidden="true" />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">{title}</h2>
      <p className="text-[#a0a0a0] text-lg max-w-md mb-10 leading-relaxed">{description}</p>
      
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF5500] hover:bg-[#e64d00] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#FF5500]/20 hover:scale-105 active:scale-95"
      >
        {label}
      </Link>
    </div>
  );
}