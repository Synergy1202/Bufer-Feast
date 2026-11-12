"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Users, Minus, Plus, ShoppingCart } from "lucide-react";

export function MenuCalculator({ menu }: { menu: any }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [headcount, setHeadcount] = useState(10);
  const [eventType, setEventType] = useState<"home" | "office" | "event">("home");

  // Calculate price based on headcount
  const calculatedPrice = useMemo(() => {
    const multiplier = headcount / menu.base_servings;
    return Math.round(multiplier * menu.price_per_serving * menu.base_servings);
  }, [headcount, menu]);

  const handleAddToCart = () => {
    addToCart({
      id: `${menu.id}-${headcount}`,
      menu_id: menu.id,
      vendor_id: menu.vendor_id,
      dishName: menu.title,
      vendorName: menu.profiles?.business_name || menu.profiles?.full_name || "Vendor",
      basePrice: menu.price_per_serving,
      headcount,
      baseServings: menu.base_servings,
      totalPrice: calculatedPrice,
    });
    router.push(`/basket`);
  };

  return (
    <div className="lg:sticky lg:top-24 h-fit">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Order</h2>

        {/* Event Type Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(["home", "office", "event"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setEventType(type)}
                className={`py-2 px-4 rounded-lg text-sm font-medium capitalize transition-colors ${
                  eventType === type ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Headcount Calculator */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of People (Headcount)</label>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setHeadcount(Math.max(1, headcount - 1))}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Minus size={20} />
            </button>
            <div className="flex-1 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg py-3">
              <Users className="text-gray-400 mr-2" size={20} />
              <span className="text-2xl font-bold text-gray-900">{headcount}</span>
            </div>
            <button 
              onClick={() => setHeadcount(headcount + 1)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Base recipe is for {menu.base_servings} people. We scale ingredients automatically.
          </p>
        </div>

        {/* Price Summary */}
        <div className="border-t border-gray-100 pt-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Price per head</span>
            <span className="font-medium">₦{menu.price_per_serving.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Headcount</span>
            <span className="font-medium">x {headcount}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-3xl font-bold text-green-700">₦{calculatedPrice.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-lg"
        >
          <ShoppingCart size={24} />
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}