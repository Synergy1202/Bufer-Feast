import Link from "next/link";
import {
  ShoppingBag,
  MapPin,
  HelpCircle,
  User,
  ArrowRight,
} from "lucide-react";
import { requireCustomer } from "@/lib/server/auth";
import LogoutButton from "./logout-button";

export default async function CustomerDashboard() {
  const user = await requireCustomer();

  const displayName =
    user.email?.split("@")[0] || "Customer";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h1>

          <p className="text-gray-500">
            Here is your personal dashboard to manage your meals.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Browse Kitchens */}
          <Link
            href="/"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-green-300 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <MapPin
                  className="text-green-600"
                  size={24}
                />
              </div>

              <ArrowRight
                className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-green-600"
                size={20}
              />
            </div>

            <h2 className="mb-1 text-xl font-bold text-gray-900">
              Browse Kitchens
            </h2>

            <p className="text-sm text-gray-500">
              Explore local vendors and order fresh, home-style meals.
            </p>
          </Link>

          {/* My Orders */}
          <Link
            href="/orders"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <ShoppingBag
                  className="text-blue-600"
                  size={24}
                />
              </div>

              <ArrowRight
                className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-blue-600"
                size={20}
              />
            </div>

            <h2 className="mb-1 text-xl font-bold text-gray-900">
              My Orders
            </h2>

            <p className="text-sm text-gray-500">
              Track your active deliveries and view order history.
            </p>
          </Link>

          {/* How It Works */}
          <Link
            href="/how-it-works"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <HelpCircle
                  className="text-purple-600"
                  size={24}
                />
              </div>

              <ArrowRight
                className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-purple-600"
                size={20}
              />
            </div>

            <h2 className="mb-1 text-xl font-bold text-gray-900">
              How it Works
            </h2>

            <p className="text-sm text-gray-500">
              Learn about our bulk ordering process and delivery.
            </p>
          </Link>

          {/* Account Settings */}
          <Link
            href="/account"
            className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-orange-300 hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <User
                  className="text-orange-600"
                  size={24}
                />
              </div>

              <ArrowRight
                className="text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-orange-600"
                size={20}
              />
            </div>

            <h2 className="mb-1 text-xl font-bold text-gray-900">
              Account Settings
            </h2>

            <p className="text-sm text-gray-500">
              Manage your profile, address, and preferences.
            </p>
          </Link>
        </div>

        {/* Sign Out */}
        <div className="mt-8 text-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
