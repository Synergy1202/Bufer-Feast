"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Users, Flame } from "lucide-react";

export function HomeMenuGrid({ menus, vendors }: { menus: any[]; vendors: any[] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState("All");

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCats = new Set(menus.map((m) => m.category).filter(Boolean));
    return ["All", ...Array.from(uniqueCats)];
  }, [menus]);

  // Filter logic
  const filteredMenus = useMemo(() => {
    if (activeCategory === "All") return menus;
    return menus.filter((m) => m.category === activeCategory);
  }, [menus, activeCategory]);

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v: any) => v.id === vendorId);
    return vendor?.business_name || vendor?.full_name || "Local Kitchen";
  };

  const handleAddToCart = (menu: any) => {
    const count = headcounts[menu.id] || 10;
    const pricePerHead = menu.price_per_serving || 0;
    const totalPrice = count * pricePerHead;

    addToCart({
      id: `${menu.id}-${count}`,
      menu_id: menu.id,
      vendor_id: menu.vendor_id,
      dishName: menu.title,
      vendorName: getVendorName(menu.vendor_id),
      basePrice: pricePerHead,
      headcount: count,
      baseServings: menu.base_servings || 5,
      totalPrice: totalPrice,
    });

    router.push("/checkout");
  };

  return (
    <div className="w-full">
      {/* 1. GLASSMORPHISM CATEGORY BAR */}
      <div className="sticky top-24 z-30 mb-12 -mt-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full shadow-lg overflow-x-auto max-w-[90vw] scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300
                ${activeCategory === cat 
                  ? "bg-[#183e32] text-white shadow-md scale-105" 
                  : "bg-transparent text-gray-600 hover:bg-gray-100"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. THE FOOD CARDS */}
      {filteredMenus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMenus.map((menu: any) => (
            <div key={menu.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#90a765]/30 transition-all duration-500 flex flex-col">
              
              {/* Image Area */}
              <div className="relative h-64 overflow-hidden bg-gray-100">
                                <img 
                  src={menu.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"} 
                  alt={menu.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"; }}
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#183e32] flex items-center gap-1 shadow-sm">
                  <Flame size={12} className="text-orange-500" /> {menu.category}
                </div>
              </div>
              
              {/* Content Area */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-bold text-[#90a765] uppercase tracking-wider">{getVendorName(menu.vendor_id)}</p>
                </div>
                
                <h3 className="text-2xl font-bold text-[#183e32] mb-2 leading-tight group-hover:text-[#90a765] transition-colors">
                  {menu.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{menu.description}</p>
                
                {/* Interactive Footer */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                      <Users size={14} />
                      <span>Heads</span>
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      value={headcounts[menu.id] || 10}
                      onChange={(e) => setHeadcounts({ ...headcounts, [menu.id]: parseInt(e.target.value) || 1 })}
                      className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-[#183e32] focus:ring-2 focus:ring-[#90a765] focus:border-transparent outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 font-medium">Total Estimate</span>
                    <span className="text-xl font-black text-[#183e32]">₦{((headcounts[menu.id] || 10) * (menu.price_per_serving || 0)).toLocaleString()}</span>
                  </div>

                  <button 
                    onClick={() => handleAddToCart(menu)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#183e32] text-white font-bold rounded-xl hover:bg-[#90a765] hover:text-[#183e32] transition-all duration-300 shadow-lg hover:shadow-[#90a765]/40"
                  >
                    <ShoppingCart size={18} />
                    Add to Basket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-xl font-medium">No dishes found in this category.</p>
          <button onClick={() => setActiveCategory("All")} className="mt-4 text-[#183e32] font-bold hover:underline">
            View all dishes
          </button>
        </div>
      )}
    </div>
  );
}