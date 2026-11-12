import { authClient } from "@/lib/server/auth";
import { MenuCalculator } from "@/components/menu-calculator";
import { notFound } from "next/navigation";
import { Star, MapPin } from "lucide-react";

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await authClient();

  const { data: menu } = await client.from("menus").select("*").eq("id", id).single();
  if (!menu) return notFound();

  let vendor = null;
  if (menu.vendor_id) {
    const { data: vendorData } = await client
      .from("profiles")
      .select("full_name, business_name, location")
      .eq("id", menu.vendor_id)
      .single();
    vendor = vendorData;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="rounded-2xl overflow-hidden mb-8 h-96 bg-gray-200 shadow-sm">
            <img 
              src={menu.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"} 
              alt={menu.title} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {menu.category}
            </span>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-medium text-gray-700">4.8</span>
            </div>
          </div>
          <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
            <MapPin size={14} /> {vendor?.business_name || vendor?.full_name || "Local Vendor"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{menu.title}</h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">{menu.description}</p>
        </div>
        <MenuCalculator menu={{ ...menu, profiles: vendor }} />
      </div>
    </div>
  );
}