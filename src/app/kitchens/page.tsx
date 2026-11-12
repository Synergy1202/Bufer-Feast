import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { MapPin, ChefHat, Star, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KitchensPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: vendors, error } = await supabase
    .from("public_vendor_profiles")
    .select(
      "id, display_name, business_name, full_name, vendor_type, location, status, is_open, opening_hours",
    )
    .order("display_name", { ascending: true });

  if (error) {
    console.error("Error fetching kitchens:", error.message);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="bg-[#111111] border-b border-[#333333] py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF5500] rounded-full blur-[150px] opacity-20" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 tracking-tight text-white">
            Our Partner Kitchens
          </h1>

          <p className="text-[#FF5500] text-lg font-medium">
            Authentic flavors. Local chefs. Delivered to your door.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Available Now</h2>
          <span className="text-sm text-[#a0a0a0]">
            {vendors?.length || 0} Kitchens
          </span>
        </div>

        {vendors && vendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors.map((vendor) => {
              const isOpen = vendor.is_open !== false;

              return (
                <div
                  key={vendor.id}
                  className="group bg-[#111111] border border-[#333333] rounded-3xl p-6 hover:border-[#FF5500] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#FF5500] transition-colors">
                        <ChefHat
                          className="text-[#FF5500] group-hover:text-white transition-colors"
                          size={32}
                        />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white leading-tight">
                          {vendor.display_name || "Local Kitchen"}
                        </h3>

                        <div className="flex items-center gap-1 mt-1">
                          <Star
                            size={14}
                            className="text-[#FF5500] fill-[#FF5500]"
                          />
                          <span className="text-sm font-bold text-white">
                            4.9
                          </span>
                          <span className="text-xs text-[#a0a0a0] ml-1">
                            (120+ reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        isOpen
                          ? "bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {isOpen ? "Open Now" : "Currently Closed"}
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                      <MapPin size={16} className="text-[#666]" />
                      <span className="truncate">
                        {vendor.location || "Lagos, Nigeria"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-[#a0a0a0]">
                      <ChefHat size={16} className="text-[#666]" />
                      <span className="capitalize">
                        {vendor.vendor_type || "Home Kitchen"} · Authentic
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/kitchens/${vendor.id}`}
                    className="flex items-center justify-between w-full py-3 px-4 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-colors"
                  >
                    <span>{isOpen ? "Browse Menu" : "View Menu"}</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#111111] border border-dashed border-[#333333] rounded-3xl">
            <ChefHat className="mx-auto h-12 w-12 text-[#444] mb-4" />
            <h3 className="text-lg font-medium text-white">
              No kitchens available yet
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}