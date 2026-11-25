"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, ChefHat, MapPin, Navigation, Star } from "lucide-react";
import { GoogleAddressInput, type PickedLocation } from "@/components/google-address-input";
import { readDeliveryLocation, type DeliveryLocation } from "@/lib/delivery-location";
import type { KitchenDistance } from "@/lib/server/kitchen-distance";
import { kitchenDistancesFor } from "./actions";

export type KitchenSummary = {
  id: string;
  display_name: string | null;
  vendor_type: string | null;
  location: string | null;
  is_open: boolean | null;
};

type Ranked = KitchenSummary & { distance: KitchenDistance | null };

function formatKm(km: number) {
  return km < 1 ? "Under 1 km away" : `${km.toFixed(1)} km away`;
}

export function KitchenList({ kitchens }: { kitchens: KitchenSummary[] }) {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [distances, setDistances] = useState<Map<string, KitchenDistance> | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const lookUp = useCallback((next: DeliveryLocation) => {
    startTransition(async () => {
      const result = await kitchenDistancesFor(next.latitude, next.longitude);
      if (result === null) {
        setLookupFailed(true);
        setDistances(null);
        return;
      }
      setLookupFailed(false);
      setDistances(new Map(result.map((row) => [row.vendorId, row])));
    });
  }, []);

  // Start from where this browser last chose to deliver (homepage search,
  // signup, saved addresses).
  useEffect(() => {
    const saved = readDeliveryLocation();
    if (saved) {
      setLocation(saved);
      lookUp(saved);
    }
  }, [lookUp]);

  function handleLocation(picked: PickedLocation | null) {
    // Typing a new search clears the pick; keep the last list until a new
    // place is chosen.
    if (!picked) return;
    const next = {
      address: picked.address,
      latitude: picked.latitude,
      longitude: picked.longitude,
      placeId: picked.placeId,
    };
    setLocation(next);
    lookUp(next);
  }

  const ranked = useMemo<Ranked[]>(() => {
    const rows = kitchens.map((kitchen) => ({
      ...kitchen,
      distance: distances?.get(kitchen.id) ?? null,
    }));
    if (!distances) return rows;

    // Delivers to you (nearest first), then kitchens without a map pin yet,
    // then kitchens that are too far (nearest first).
    const group = (row: Ranked) =>
      row.distance ? (row.distance.delivers ? 0 : 2) : 1;
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const byGroup = group(a.row) - group(b.row);
        if (byGroup !== 0) return byGroup;
        if (a.row.distance && b.row.distance) {
          return a.row.distance.distanceKm - b.row.distance.distanceKm;
        }
        return a.index - b.index;
      })
      .map(({ row }) => row);
  }, [kitchens, distances]);

  const deliverCount = distances
    ? ranked.filter((row) => row.distance?.delivers).length
    : null;

  return (
    <>
      {/* Room below the bar for the search's own messages. */}
      <div className="mb-12">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#a0a0a0]">
          <Navigation size={14} className="text-[#FF5500]" />
          Deliver to
        </p>
        <div className="relative flex items-center gap-3 rounded-2xl border border-[#333333] bg-[#111111] px-4 py-3 focus-within:border-[#FF5500]">
          <MapPin size={18} className="shrink-0 text-[#FF5500]" />
          <GoogleAddressInput
            showMap={false}
            rememberAsDeliveryLocation
            value={location?.address ?? ""}
            onLocationChange={handleLocation}
            ariaLabel="Delivery address"
            placeholder="Enter your delivery address to see kitchens near you"
            className="w-full bg-transparent text-white outline-none placeholder-[#777]"
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {distances ? "Kitchens near you" : "Available Now"}
          </h2>
          <p role="status" className="mt-1 min-h-5 text-sm text-[#a0a0a0]">
            {pending
              ? "Finding kitchens near you…"
              : lookupFailed
                ? "We couldn't work out distances right now. All kitchens are listed below."
                : deliverCount === null
                  ? ""
                  : deliverCount === 0
                    ? "No kitchens deliver to this address yet. Try another address nearby."
                    : `${deliverCount} ${deliverCount === 1 ? "kitchen delivers" : "kitchens deliver"} to this address.`}
          </p>
        </div>
        <span className="shrink-0 pt-1.5 text-sm text-[#a0a0a0]">{kitchens.length} Kitchens</span>
      </div>

      {ranked.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ranked.map((vendor) => (
            <KitchenCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111111] border border-dashed border-[#333333] rounded-3xl">
          <ChefHat className="mx-auto h-12 w-12 text-[#444] mb-4" />
          <h3 className="text-lg font-medium text-white">No kitchens available yet</h3>
        </div>
      )}
    </>
  );
}

function KitchenCard({ vendor }: { vendor: Ranked }) {
  const isOpen = vendor.is_open !== false;
  const tooFar = vendor.distance !== null && !vendor.distance.delivers;

  return (
    <div
      className={`group bg-[#111111] border border-[#333333] rounded-3xl p-6 transition-all duration-300 ${
        tooFar
          ? "opacity-60 grayscale hover:opacity-80"
          : "hover:border-[#FF5500] hover:-translate-y-1"
      }`}
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
              <Star size={14} className="text-[#FF5500] fill-[#FF5500]" />
              <span className="text-sm font-bold text-white">4.9</span>
              <span className="text-xs text-[#a0a0a0] ml-1">(120+ reviews)</span>
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
          <MapPin size={16} className="text-[#666] shrink-0" />
          <span className="truncate">{vendor.location || "Lagos, Nigeria"}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#a0a0a0]">
          <ChefHat size={16} className="text-[#666] shrink-0" />
          <span className="capitalize">
            {vendor.vendor_type || "Home Kitchen"} · Authentic
          </span>
        </div>

        {vendor.distance && (
          <div className="flex items-center gap-3 text-sm">
            <Navigation size={16} className="text-[#666] shrink-0" />
            <span className={tooFar ? "text-[#a0a0a0]" : "font-semibold text-white"}>
              {formatKm(vendor.distance.distanceKm)}
            </span>
            {tooFar && (
              <span className="rounded-full border border-gray-500/30 px-2 py-0.5 text-xs font-bold text-gray-300">
                Doesn&apos;t deliver to your area
              </span>
            )}
          </div>
        )}
      </div>

      <Link
        href={`/kitchens/${vendor.id}`}
        className={`flex items-center justify-between w-full py-3 px-4 font-bold rounded-xl transition-colors ${
          tooFar
            ? "bg-[#222222] text-[#a0a0a0] hover:bg-[#2a2a2a]"
            : "bg-[#FF5500] text-white hover:bg-[#e64d00]"
        }`}
      >
        <span>{isOpen && !tooFar ? "Browse Menu" : "View Menu"}</span>
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
