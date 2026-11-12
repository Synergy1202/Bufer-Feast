"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2, Store } from "lucide-react";
import { useCart } from "@/context/cart-context";

export function BasketView() {
  const { items, ready, updateQuantity, removeItem } = useCart();

  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-[#a0a0a0]">Loading your basket...</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-white">Your basket is empty</h1>
        <p className="mb-8 mt-3 text-[#a0a0a0]">Browse our partner kitchens and choose your meals.</p>
        <Link href="/kitchens" className="inline-flex items-center gap-2 rounded-xl bg-[#FF5500] px-6 py-3 font-bold text-white">Browse Kitchens <ArrowRight size={18} /></Link>
      </div>
    );
  }

  const kitchens = Array.from(
    items.reduce((groups, item) => {
      const group = groups.get(item.vendor_id) || { vendorId: item.vendor_id, vendorName: item.vendorName, items: [] };
      group.items.push(item);
      groups.set(item.vendor_id, group);
      return groups;
    }, new Map<string, { vendorId: string; vendorName: string; items: typeof items }>()).values(),
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FF5500]">YOUR BASKET</p>
        <h1 className="mt-2 text-4xl font-bold">Your basket</h1>
        <p className="mb-8 mt-2 text-[#a0a0a0]">Each kitchen is checked out separately.</p>

        <div className="space-y-6">
          {kitchens.map((kitchen) => {
            const kitchenTotal = kitchen.items.reduce((sum, item) => sum + item.totalPrice, 0);
            return (
              <section key={kitchen.vendorId} className="rounded-2xl border border-[#333] bg-[#111] p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#333] pb-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5500] text-white"><Store size={19} /></span>
                    <div>
                      <h2 className="text-xl font-bold">{kitchen.vendorName}</h2>
                      <p className="text-sm text-[#a0a0a0]">{kitchen.items.length} {kitchen.items.length === 1 ? "item" : "items"}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-[#FF5500]">₦{kitchenTotal.toLocaleString("en-NG")}</span>
                </div>

                <div className="space-y-4">
                  {kitchen.items.map((item) => (
                    <article key={item.id} className="flex justify-between gap-4 rounded-xl border border-[#292929] bg-[#171717] p-4">
                      <div>
                        <h3 className="font-bold">{item.dishName}</h3>
                        <p className="mt-1 text-sm text-[#a0a0a0]">₦{item.basePrice.toLocaleString("en-NG")} per person</p>
                        <div className="mt-4 flex items-center gap-3">
                          <button type="button" onClick={() => updateQuantity(item.id, item.headcount - 1)} className="h-9 w-9 rounded-lg border border-[#444] bg-[#111] text-white"><Minus size={15} className="mx-auto" /></button>
                          <span className="min-w-20 text-center text-sm font-bold">{item.headcount} people</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.headcount + 1)} className="h-9 w-9 rounded-lg border border-[#444] bg-[#111] text-white"><Plus size={15} className="mx-auto" /></button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₦{item.totalPrice.toLocaleString("en-NG")}</p>
                        <button type="button" onClick={() => removeItem(item.id)} className="mt-4 text-[#a0a0a0] hover:text-red-400" aria-label={`Remove ${item.dishName}`}><Trash2 size={18} /></button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-[#333] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#a0a0a0]">Delivery fee will be calculated for this kitchen at checkout.</p>
                  <Link href={`/checkout?vendor=${encodeURIComponent(kitchen.vendorId)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF5500] px-6 py-3 font-bold text-white">Checkout {kitchen.vendorName} <ArrowRight size={17} /></Link>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between border-t border-[#333] pt-5 text-lg font-bold">
          <span>Total across kitchens</span>
          <span className="text-[#FF5500]">₦{items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString("en-NG")}</span>
        </div>
      </div>
    </main>
  );
}
