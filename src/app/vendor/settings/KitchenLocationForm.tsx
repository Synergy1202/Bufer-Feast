"use client";

import { useActionState } from "react";
import { CheckCircle, MapPin, AlertCircle } from "lucide-react";
import { GoogleAddressInput, type PickedLocation } from "@/components/google-address-input";
import { DELIVERY_RADIUS_OPTIONS, DEFAULT_DELIVERY_RADIUS_KM } from "@/lib/delivery-radius";
import { updateKitchenLocation, type KitchenLocationState } from "./actions";

export function KitchenLocationForm({
  location,
  addressText,
  radiusKm,
}: {
  location: PickedLocation | null;
  addressText: string;
  radiusKm: number | null;
}) {
  const [state, formAction, pending] = useActionState<KitchenLocationState, FormData>(
    updateKitchenLocation,
    null,
  );
  const radius = DELIVERY_RADIUS_OPTIONS.includes(radiusKm as (typeof DELIVERY_RADIUS_OPTIONS)[number])
    ? (radiusKm as number)
    : DEFAULT_DELIVERY_RADIUS_KM;

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8 mb-8"
    >
      <h2 className="text-lg font-bold text-[#1C1917] mb-2 flex items-center gap-2 border-b border-[#E7E5E4] pb-4">
        <MapPin size={20} className="text-[#EA580C]" />
        Kitchen Location &amp; Delivery Area
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Customers see how far your kitchen is from them, never your exact
        location. Riders collect orders from this address.
      </p>

      <div className="space-y-6">
        <div className="space-y-1">
          <label
            htmlFor="kitchen_location"
            className="text-xs font-bold text-gray-500 uppercase"
          >
            Kitchen address
          </label>
          <GoogleAddressInput
            id="kitchen_location"
            name="kitchen_location"
            tone="light"
            initialLocation={location}
            value={location ? undefined : addressText}
            placeholder="Search for your kitchen's address"
            className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none"
          />
          {!location && (
            <p className="text-xs text-orange-700">
              Your kitchen has no map pin yet, so customers can&apos;t see how
              far away you are. Search for your address or move the map, then
              save.
            </p>
          )}
        </div>

        <div className="space-y-1 max-w-xs">
          <label
            htmlFor="delivery_radius_km"
            className="text-xs font-bold text-gray-500 uppercase"
          >
            Deliver up to
          </label>
          <select
            id="delivery_radius_km"
            name="delivery_radius_km"
            defaultValue={radius}
            className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none"
          >
            {DELIVERY_RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {km} km{km === DEFAULT_DELIVERY_RADIUS_KM ? " (recommended)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Customers further away than this see your kitchen marked
            &ldquo;Doesn&apos;t deliver to your area&rdquo; and can&apos;t order.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p role="status" className="text-sm">
            {state && (
              <span
                className={`flex items-center gap-2 font-medium ${
                  state.ok ? "text-green-700" : "text-red-600"
                }`}
              >
                {state.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {state.message}
              </span>
            )}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-3 bg-[#84CC16] text-[#1C1917] font-bold rounded-xl hover:bg-[#A3E635] transition-all disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save Location"}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Every change to your location or delivery distance is recorded.
        </p>
      </div>
    </form>
  );
}
