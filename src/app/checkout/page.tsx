"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { GoogleAddressInput } from "@/components/google-address-input";
import {
  deleteAddress,
  getCheckoutData,
  placeOrderAction,
  saveAddress,
} from "./actions";

interface Address {
  id: string;
  label: string;
  address: string;
}

export default function CheckoutPage() {
  const { items, ready } = useCart();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendor");
  const checkoutItems = useMemo(
    () => vendorId ? items.filter((item) => item.vendor_id === vendorId) : items,
    [items, vendorId],
  );
  const checkoutTotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [checkoutItems],
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressText, setAddressText] = useState("");
  const [allergies, setAllergies] = useState("");
  const [warning, setWarning] = useState("");
  const [complete, setComplete] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [error, setError] = useState("");

  async function loadCheckoutData() {
    try {
      const data = await getCheckoutData();

      setAddresses(data.addresses);
      setComplete(data.isComplete);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load checkout.",
      );
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadCheckoutData();
  }, []);

  function handleAllergies(value: string) {
    setAllergies(value);

    const terms = value
      .toLowerCase()
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);

    const matched = checkoutItems.some((item) =>
      terms.some((term) =>
        item.dishName.toLowerCase().includes(term),
      ),
    );

    setWarning(
      matched
        ? "One or more basket items may contain an allergen you entered."
        : "",
    );
  }

  function selectAddress(address: Address) {
    setSelectedAddress(address.id);
    setAddressText(address.address);
  }

  async function addNewAddress() {
    if (!newLabel.trim() || !newAddress.trim()) {
      return;
    }

    const data = new FormData();

    data.set("label", newLabel);
    data.set("address", newAddress);

    try {
      await saveAddress(data);

      setNewLabel("");
      setNewAddress("");
      setShowAddressForm(false);

      await loadCheckoutData();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save address.",
      );
    }
  }

  async function removeAddress(id: string) {
    try {
      await deleteAddress(id);
      await loadCheckoutData();

      if (selectedAddress === id) {
        setSelectedAddress("");
        setAddressText("");
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete address.",
      );
    }
  }

  if (!ready || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-[#a0a0a0]">
        Checking your checkout...
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-white">
          Your basket is empty
        </h1>

        <p className="mb-8 mt-3 text-[#a0a0a0]">
          Add meals before continuing to checkout.
        </p>

        <Link
          href="/kitchens"
          className="inline-block rounded-xl bg-[#FF5500] px-6 py-3 font-bold text-white"
        >
          Browse Kitchens
        </Link>
      </div>
    );
  }

  if (!complete) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertCircle
          className="mx-auto text-[#FF5500]"
          size={48}
        />

        <h1 className="mt-5 text-3xl font-bold text-white">
          Complete your profile first
        </h1>

        <p className="mb-8 mt-3 text-[#a0a0a0]">
          Add a phone number and saved delivery address before placing an
          order.
        </p>

        <Link
          href="/account"
          className="inline-block rounded-xl bg-[#FF5500] px-6 py-3 font-bold text-white"
        >
          Complete Profile
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold text-white">
        Checkout
      </h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      <form
        action={placeOrderAction}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <input
          type="hidden"
          name="cart_items"
          value={JSON.stringify(checkoutItems)}
        />

        <input
          type="hidden"
          name="delivery_address"
          value={addressText}
        />

        <div className="space-y-6 lg:col-span-2">
          {/* Delivery address */}
          <section className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <MapPin
                  className="text-[#FF5500]"
                  size={20}
                />
                Delivery Address
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowAddressForm((value) => !value)
                }
                className="flex items-center gap-1 text-sm font-bold text-[#FF5500]"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>

            {addresses.length > 0 && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => selectAddress(address)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 ${
                      selectedAddress === address.id
                        ? "border-[#FF5500] bg-[#FF5500]/10"
                        : "border-[#333333] bg-[#1a1a1a]"
                    }`}
                  >
                    {selectedAddress === address.id && (
                      <CheckCircle2
                        className="absolute right-3 top-3 text-[#FF5500]"
                        size={18}
                      />
                    )}

                    <div className="flex items-center gap-2 font-bold text-white">
                      {address.label.toLowerCase() === "home" ? (
                        <Home
                          size={16}
                          className="text-[#FF5500]"
                        />
                      ) : (
                        <Building2
                          size={16}
                          className="text-[#FF5500]"
                        />
                      )}

                      {address.label}
                    </div>

                    <p className="mt-2 pr-5 text-sm text-[#a0a0a0]">
                      {address.address}
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeAddress(address.id);
                      }}
                      className="absolute bottom-3 right-3 text-[#666] hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showAddressForm && (
              <div className="mb-5 space-y-3 rounded-xl border border-[#333333] bg-[#1a1a1a] p-4">
                <input
                  value={newLabel}
                  onChange={(event) =>
                    setNewLabel(event.target.value)
                  }
                  placeholder="Label e.g. Home or Office"
                  className="w-full rounded-lg border border-[#333333] bg-[#0a0a0a] px-3 py-3 text-white placeholder-[#777]"
                />

                <GoogleAddressInput
                  value={newAddress}
                  onChange={setNewAddress}
                  placeholder="Search for a full delivery address"
                  className="w-full rounded-lg border border-[#333333] bg-[#0a0a0a] px-3 py-3 text-white placeholder-[#777]"
                />

                <button
                  type="button"
                  onClick={addNewAddress}
                  className="rounded-lg bg-[#FF5500] px-4 py-2 font-bold text-white"
                >
                  Save Address
                </button>
              </div>
            )}

            <textarea
              value={addressText}
              onChange={(event) => {
                setAddressText(event.target.value);
                setSelectedAddress("");
              }}
              required
              placeholder="Or enter a delivery address manually"
              rows={3}
              className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#777]"
            />
          </section>

          {/* Delivery details */}
          <section className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
              <Clock
                className="text-[#FF5500]"
                size={20}
              />
              Delivery Details
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="delivery_window"
                  className="mb-2 block text-sm font-bold text-white"
                >
                  Preferred delivery period
                </label>

                <select
                  id="delivery_window"
                  name="delivery_window"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/30"
                >
                  <option
                    value=""
                    disabled
                    className="bg-[#1a1a1a] text-white"
                  >
                    Select delivery period
                  </option>

                  <option
                    value="morning"
                    className="bg-[#1a1a1a] text-white"
                  >
                    Morning
                  </option>

                  <option
                    value="afternoon"
                    className="bg-[#1a1a1a] text-white"
                  >
                    Afternoon
                  </option>

                  <option
                    value="evening"
                    className="bg-[#1a1a1a] text-white"
                  >
                    Evening
                  </option>
                </select>

                <p className="mt-2 text-xs text-[#a0a0a0]">
                  Choose the period that works best for your delivery. We will
                  coordinate the exact delivery time after confirmation.
                </p>
              </div>

              <div>
                <label
                  htmlFor="scheduled_time"
                  className="mb-2 block text-sm font-bold text-white"
                >
                  Preferred delivery date and time
                  <span className="ml-2 font-normal text-[#888888]">
                    Optional
                  </span>
                </label>

                <input
                  id="scheduled_time"
                  name="scheduled_time"
                  type="datetime-local"
                  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/30"
                />

                <p className="mt-2 text-xs text-[#a0a0a0]">
                  You may provide an exact preferred time, but the delivery
                  period is required.
                </p>
              </div>

              <div>
                <label
                  htmlFor="event_type"
                  className="mb-2 block text-sm font-bold text-white"
                >
                  Event type
                </label>

            <select
  id="event_type"
  name="event_type"
  defaultValue="personal"
  className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-[#FF5500] focus:ring-2 focus:ring-[#FF5500]/30"
>
  <option
    value="personal"
    className="bg-[#1a1a1a] text-white"
  >
    Personal
  </option>

  <option
    value="home"
    className="bg-[#1a1a1a] text-white"
  >
    Home Gathering
  </option>

  <option
    value="office"
    className="bg-[#1a1a1a] text-white"
  >
    Office Lunch
  </option>

  <option
    value="event"
    className="bg-[#1a1a1a] text-white"
  >
    Large Event
  </option>
</select>
              </div>
            </div>
          </section>

          {/* Allergies */}
          <section className="rounded-2xl border border-[#333333] bg-[#111111] p-6">
            <h2 className="mb-2 text-xl font-bold text-white">
              Allergies and Dietary Restrictions
            </h2>

            <p className="mb-4 text-sm text-[#a0a0a0]">
              Separate multiple allergies with commas.
            </p>

            <input
              name="allergies"
              value={allergies}
              onChange={(event) =>
                handleAllergies(event.target.value)
              }
              placeholder="Peanuts, gluten, dairy..."
              className="w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#777]"
            />

            {warning && (
              <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300">
                {warning}
              </div>
            )}

            <textarea
              name="special_instructions"
              placeholder="Special instructions, optional"
              rows={3}
              className="mt-4 w-full rounded-xl border border-[#333333] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#777]"
            />
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-[#333333] bg-[#111111] p-6 lg:sticky lg:top-24">
          <h2 className="mb-5 text-xl font-bold text-white">
            Order Summary
          </h2>

          <div className="space-y-4">
            {checkoutItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-3 border-b border-[#333333] pb-3"
              >
                <div>
                  <p className="font-bold text-white">
                    {item.dishName}
                  </p>

                  <p className="text-xs text-[#a0a0a0]">
                    {item.headcount} people
                  </p>
                </div>

                <p className="font-bold text-white">
                  ₦{item.totalPrice.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between border-t border-[#333333] pt-5">
            <span className="font-bold text-white">
              Food total
            </span>

            <strong className="text-2xl text-[#FF5500]">
              ₦{checkoutTotal.toLocaleString()}
            </strong>
          </div>

          <p className="mt-4 text-xs text-[#a0a0a0]">
            The server will recalculate and verify the final amount before
            creating the order.
          </p>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-[#FF5500] py-4 font-bold text-white hover:bg-[#e64d00]"
          >
            Place Order
          </button>
        </aside>
      </form>
    </main>
  );
}