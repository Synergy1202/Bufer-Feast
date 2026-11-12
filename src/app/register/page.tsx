import Link from "next/link";
import { User, Gift, MapPin, ArrowRight } from "lucide-react";
import { registerCustomer } from "./actions";
import { GoogleAddressInput } from "@/components/google-address-input";

export default function CustomerSignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-[#111111] rounded-3xl shadow-xl border border-[#333333] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#111111] border-b border-[#333333] p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF5500] rounded-full mb-4">
            <User size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Bufer Feast</h1>
          <p className="text-[#a0a0a0] text-sm">Order delicious bulk meals from your favorite local kitchens.</p>
        </div>

        {/* Form */}
        <form action={registerCustomer} className="p-8 space-y-8">
          
          {/* Section 1: Account Basics */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FF5500] text-white rounded-full flex items-center justify-center text-xs">1</span>
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">First Name</label>
                <input name="first_name" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="Jane" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Last Name</label>
                <input name="last_name" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Email Address</label>
                <input name="email" type="email" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="jane@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Phone Number</label>
                <input name="phone" required className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="+234 800 000 0000" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Password</label>
                <input name="password" type="password" required minLength={8} className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="Create a secure password" />
              </div>
            </div>
          </div>

          {/* Section 2: Extra Details */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FF5500] text-white rounded-full flex items-center justify-center text-xs">2</span>
              Preferences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Birthday</label>
                <input name="birthday" type="date" className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#a0a0a0] uppercase">Referral Code (Optional)</label>
                <div className="relative">
                  <input name="referral_code" className="w-full px-4 py-3 pl-10 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] focus:border-transparent outline-none transition-all text-white placeholder-[#666]" placeholder="FRIEND20" />
                  <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Address */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FF5500] text-white rounded-full flex items-center justify-center text-xs">3</span>
              Primary Delivery Address
            </h2>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#a0a0a0] uppercase">Home / Office / Event Venue</label>
              <div className="relative">
                <GoogleAddressInput name="primary_address" className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl text-white placeholder-[#666]" placeholder="Search your delivery address" />
                <MapPin size={16} className="absolute left-3 top-4 text-[#666]" />
              </div>
              <p className="text-xs text-[#a0a0a0] mt-1">You can add more saved addresses in your profile later.</p>
            </div>
          </div>

          {/* Section 4: Marketing Checkbox */}
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333333]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="marketing_opt_in" defaultChecked className="mt-1 w-4 h-4 text-[#FF5500] bg-[#2a2a2a] border-[#444444] rounded focus:ring-[#FF5500] focus:ring-2" />
              <span className="text-sm text-white leading-snug">
                Yes, I want to receive emails about new kitchens, special bulk discounts, and promotional offers.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-all duration-300 shadow-lg shadow-[#FF5500]/20">
            Create Account <ArrowRight size={20} />
          </button>

          <p className="text-center text-sm text-[#a0a0a0]">
            Already have an account? <Link href="/login" className="text-[#FF5500] font-bold hover:underline">Log in</Link>
          </p>
          <p className="text-center text-sm text-[#a0a0a0] mt-4 pt-4 border-t border-[#333333]">
            Are you a chef or caterer? <Link href="/signup" className="text-[#FF5500] font-bold hover:underline">Become a Vendor</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
