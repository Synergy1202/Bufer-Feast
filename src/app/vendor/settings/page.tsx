import { requireVendor, authClient } from "@/lib/server/auth";
import Link from "next/link";
import { updateVendorSettings } from "./actions";
import { 
  Settings, Lock, MessageCircle, Phone, Bell, Shield, 
  CheckCircle, FileText, Clock 
} from "lucide-react";

export default async function VendorSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireVendor();
  const client = await authClient();

  // Fetch the vendor's profile data
  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
<div className="vendor-settings max-w-4xl mx-auto py-12 px-4">      
      {/* Success Message */}
      {resolvedSearchParams.success === "true" && (
        <div className="bg-[#84CC16]/10 border border-[#84CC16]/30 text-[#1C1917] p-4 rounded-xl flex items-center gap-3 mb-8">
          <CheckCircle size={20} className="text-[#84CC16] shrink-0" />
          <div>
            <p className="font-bold text-sm">Settings Updated Successfully!</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1C1917] flex items-center gap-3">
          <Settings className="text-[#EA580C]" size={32} />
          Account Settings
        </h1>
        <p className="text-gray-500 mt-1 ml-11">Manage your vendor profile, preferences, and verification.</p>
      </div>

      {/* encType is required for file uploads */}
<form action={updateVendorSettings} className="space-y-8">        
        {/* Section 1: Business Identity (LOCKED) */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#1C1917] mb-6 flex items-center gap-2 border-b border-[#E7E5E4] pb-4">
            <Shield size={20} className="text-[#EA580C]" />
            Business Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                Business Name <Lock size={12} className="text-gray-400" />
              </label>
              <input type="text" value={profile?.business_name || "Not set"} readOnly className="w-full px-4 py-3 bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl text-gray-500 cursor-not-allowed outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                Location / Address <Lock size={12} className="text-gray-400" />
              </label>
              <input type="text" value={profile?.location || "Not set"} readOnly className="w-full px-4 py-3 bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl text-gray-500 cursor-not-allowed outline-none" />
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#FFF7ED] border border-[#EA580C]/20 rounded-xl flex items-start gap-3">
            <MessageCircle size={20} className="text-[#EA580C] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#1C1917]">Need to change your Business Name or Location?</p>
              <p className="text-xs text-gray-600 mt-1">
                To protect your brand identity, these details cannot be changed automatically. 
                <Link href="/support" className="text-[#EA580C] font-bold underline ml-1 hover:text-[#C2410C]">Contact Support</Link> to request a manual update.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Store Operations (Vacation Mode & Hours) */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#1C1917] mb-6 flex items-center gap-2 border-b border-[#E7E5E4] pb-4">
            <Clock size={20} className="text-[#EA580C]" />
            Store Operations
          </h2>
          <div className="space-y-6">
            
                      {/* Store Status Toggle */}
            <div className="flex items-center justify-between p-5 bg-[#FDFBF7] rounded-xl border border-[#E7E5E4]">
              <div>
                <p className="font-bold text-[#1C1917] text-lg">Accepting Orders</p>
                <p className="text-sm text-gray-500 mt-1">Turn this <span className="text-red-500 font-bold">OFF</span> to enable Vacation Mode and pause new orders.</p>
              </div>
              <div className="relative inline-block w-14 h-8 align-middle select-none">
                <input 
                  type="checkbox" 
                  name="is_open" 
                  id="is_open"
                  defaultChecked={profile?.is_open !== false}
                  className="peer sr-only" 
                />
                <label 
                  htmlFor="is_open" 
                  className="block overflow-hidden h-8 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-[#84CC16] transition-colors duration-300"
                >
                  <span className="block w-6 h-6 rounded-full bg-white shadow-md transform translate-x-1 peer-checked:translate-x-7 transition-transform duration-300 mt-1"></span>
                </label>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Opening Hours / Availability</label>
              <textarea 
                name="opening_hours" 
                rows={2} 
                defaultValue={profile?.opening_hours || "Monday - Saturday: 8:00 AM - 6:00 PM"}
                placeholder="e.g., Mon - Fri: 9am - 5pm"
                className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none resize-none" 
              />
              <p className="text-xs text-gray-400">Let customers know when you are usually available to cook.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Verification & Documents */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#1C1917] mb-6 flex items-center gap-2 border-b border-[#E7E5E4] pb-4">
            <FileText size={20} className="text-[#EA580C]" />
            Verification & Documents
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID Proof Type</label>
                <select name="id_proof_type" defaultValue={profile?.id_proof_type || ""} className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none">
                  <option value="">Select ID Type...</option>
                  <option value="NIN">National ID (NIN)</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="Passport">International Passport</option>
                  <option value="Voter's Card">Voter's Card</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID Number</label>
                <input name="id_proof_number" type="text" defaultValue={profile?.id_proof_number || ""} placeholder="Enter ID number" className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">CAC Registration Number</label>
              <input name="cac_number" type="text" defaultValue={profile?.cac_number || ""} placeholder="e.g., RC123456" className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E7E5E4]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">Upload ID Document (Image/PDF)</label>
                <input type="hidden" name="current_id_url" value={profile?.id_document_url || ""} />
                <input type="file" name="id_document" accept="image/*,.pdf" className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#84CC16] file:text-[#1C1917] hover:file:bg-[#A3E635] transition-all cursor-pointer" />
                {profile?.id_document_url && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Document currently on file</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">Upload CAC Document (Image/PDF)</label>
                <input type="hidden" name="current_cac_url" value={profile?.cac_document_url || ""} />
                <input type="file" name="cac_document" accept="image/*,.pdf" className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#84CC16] file:text-[#1C1917] hover:file:bg-[#A3E635] transition-all cursor-pointer" />
                {profile?.cac_document_url && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12}/> Document currently on file</p>}
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Uploading new documents may temporarily flag your account for "Pending Review" until our admin team verifies the new files.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Contact & Preferences */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#1C1917] mb-6 flex items-center gap-2 border-b border-[#E7E5E4] pb-4">
            <Phone size={20} className="text-[#EA580C]" />
            Contact & Preferences
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input name="phone" type="tel" defaultValue={profile?.phone || ""} placeholder="e.g., 08012345678" className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <input type="email" value={user.email || ""} readOnly className="w-full px-4 py-3 bg-[#F5F5F4] border border-[#E7E5E4] rounded-xl text-gray-500 cursor-not-allowed outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Kitchen Bio / Description</label>
              <textarea name="bio" rows={3} defaultValue={profile?.bio || ""} placeholder="Tell customers a little bit about your kitchen..." className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E7E5E4] rounded-xl focus:ring-2 focus:ring-[#84CC16] outline-none resize-none" />
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#F5F5F4] rounded-xl border border-[#E7E5E4]">
              <input type="checkbox" name="notify_email" id="notify_email" defaultChecked={profile?.notify_email !== false} className="w-5 h-5 text-[#84CC16] rounded border-gray-300 focus:ring-[#84CC16]" />
              <label htmlFor="notify_email" className="text-sm font-medium text-[#1C1917] flex items-center gap-2 cursor-pointer">
                <Bell size={16} className="text-[#EA580C]" />
                Email me instantly when a new order is placed
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 pb-12">
          <button type="submit" className="px-8 py-3.5 bg-[#84CC16] text-[#1C1917] font-bold rounded-xl hover:bg-[#A3E635] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#84CC16]/20 flex items-center gap-2">
            <CheckCircle size={18} /> Save All Changes
          </button>
        </div>

      </form>
    </div>
  );
}