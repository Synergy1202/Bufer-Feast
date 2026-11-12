"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  CheckCircle2,
  MapPin,
  Plus,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useCart } from "@/context/cart-context";

interface Vendor {
  id: string;
  display_name: string;
  vendor_type: string | null;
  location: string | null;
  is_open: boolean | null;
  opening_hours: string | null;
}

interface Menu {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  category: string | null;
  base_servings: number;
  price_per_serving: number;
  image_url: string | null;
  status: string;
  allergens: string | null;
  min_order_quantity: number | null;
  max_supply_limit: number | null;
}

export default function KitchenProfilePage() {
  const params = useParams();
  const id = String(params.id);
  const { items, addToCart } = useCart();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function load() {
      const [{ data: vendorData }, { data: menuData }] = await Promise.all([
        supabase
          .from("public_vendor_profiles")
          .select(
            "id, display_name, vendor_type, location, is_open, opening_hours",
          )
          .eq("id", id)
          .maybeSingle(),

        supabase
          .from("menus")
          .select("*")
          .eq("vendor_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
      ]);

      setVendor(vendorData);

      const availableMenus = menuData || [];
      setMenus(availableMenus);

      const initial: Record<string, number> = {};

      for (const menu of availableMenus) {
        initial[menu.id] = menu.base_servings || 1;
      }

      setQuantities(initial);
      setLoading(false);
    }

    load();
  }, [id]);

  function changeQuantity(menu: Menu, delta: number) {
    const minimum = menu.min_order_quantity || menu.base_servings || 1;
    const maximum = menu.max_supply_limit || 999;

    setQuantities((current) => ({
      ...current,
      [menu.id]: Math.min(
        maximum,
        Math.max(minimum, (current[menu.id] || minimum) + delta),
      ),
    }));
  }

  function handleAdd(menu: Menu) {
    if (!vendor) return;

    if (vendor.is_open === false) {
      setMessage("This kitchen is currently closed.");
      return;
    }

    const headcount = quantities[menu.id] || menu.base_servings || 1;

    addToCart({
      id: menu.id,
      menu_id: menu.id,
      vendor_id: vendor.id,
      dishName: menu.title,
      vendorName: vendor.display_name,
      basePrice: menu.price_per_serving,
      headcount,
      baseServings: menu.base_servings,
      totalPrice: menu.price_per_serving * headcount,
    });

    setMessage(`${menu.title} added to your basket.`);
    setAdded((current) => ({ ...current, [menu.id]: true }));

    window.setTimeout(() => {
      setAdded((current) => ({ ...current, [menu.id]: false }));
    }, 1800);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        Loading kitchen...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        Kitchen not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="bg-[#111111] border-b border-[#333333] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/kitchens"
            className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-[#FF5500] mb-6"
          >
            <ArrowLeft size={16} />
            Back to kitchens
          </Link>

          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="w-24 h-24 bg-[#FF5500] rounded-3xl flex items-center justify-center">
              <ChefHat className="text-white" size={48} />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-white mb-3">
                {vendor.display_name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-[#FF5500]">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {vendor.location || "Lagos, Nigeria"}
                </span>

                <span className="flex items-center gap-1">
                  <Star size={16} className="fill-[#FF5500]" />
                  4.9 rating
                </span>
              </div>
            </div>
          </div>

          {vendor.is_open === false && (
            <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-xl p-4">
              This kitchen is currently closed. You can view the menu, but new
              items cannot be added right now.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">
            Menu Items ({menus.length})
          </h2>

          {items.length > 0 && (
            <Link
              href="/basket"
              className="flex items-center gap-2 px-5 py-3 bg-[#FF5500] text-white font-bold rounded-xl"
            >
              <ShoppingBag size={18} />
              Basket ({items.length})
            </Link>
          )}
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-[#FF5500]/30 bg-[#FF5500]/10 text-[#FF5500] p-4">
            {message}
          </div>
        )}

        {menus.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-2xl border border-dashed border-[#333333]">
            <ChefHat className="mx-auto text-[#555]" size={48} />
            <p className="text-white mt-4">No published menu items yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => {
              const minimum =
                menu.min_order_quantity || menu.base_servings || 1;
              const headcount = quantities[menu.id] || minimum;
              const total = menu.price_per_serving * headcount;

              return (
                <article
                  key={menu.id}
                  className="bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden"
                >
                  <div className="h-48 bg-[#1a1a1a]">
                    {menu.image_url ? (
                      <img
                        src={menu.image_url}
                        alt={menu.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <ChefHat className="text-[#FF5500]" size={48} />
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <p className="text-xs text-[#FF5500] uppercase font-bold">
                      {menu.category || "Menu item"}
                    </p>

                    <h3 className="text-xl font-bold text-white mt-2">
                      {menu.title}
                    </h3>

                    <p className="text-sm text-[#a0a0a0] mt-2 min-h-10">
                      {menu.description || "Prepared fresh by this kitchen."}
                    </p>

                    {menu.allergens && (
                      <p className="text-xs text-yellow-300 mt-3">
                        Allergens: {menu.allergens}
                      </p>
                    )}

                    <div className="mt-5">
                      <label className="text-xs font-bold text-[#a0a0a0] uppercase flex items-center gap-1">
                        <Users size={14} />
                        People to feed
                      </label>

                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => changeQuantity(menu, -1)}
                          className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333333] text-white"
                        >
                          -
                        </button>

                        <span className="flex-1 text-center text-white font-bold">
                          {headcount}
                        </span>

                        <button
                          type="button"
                          onClick={() => changeQuantity(menu, 1)}
                          className="w-10 h-10 rounded-lg bg-[#1a1a1a] border border-[#333333] text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#333333]">
                      <div>
                        <p className="text-xs text-[#a0a0a0] uppercase">
                          Estimated total
                        </p>
                        <p className="text-xl font-bold text-[#FF5500]">
                          ₦{total.toLocaleString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={vendor.is_open === false}
                        onClick={() => handleAdd(menu)}
                        className="flex items-center gap-2 px-4 py-3 bg-[#FF5500] text-white font-bold rounded-xl disabled:opacity-40"
                      >
                        {added[menu.id] ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Plus size={18} />
                        )}
                        {added[menu.id] ? "Added" : "Add"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}