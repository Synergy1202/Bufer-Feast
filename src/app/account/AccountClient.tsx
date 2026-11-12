"use client";

import { useState } from "react";
import { User, Phone, MapPin, CheckCircle2, AlertCircle, X, Save, LogOut, ShoppingBag, Settings } from "lucide-react";
import Link from "next/link";
import { updatePhone, updateFullName, addAddress, deleteAddress, logoutUser } from "./actions";

export default function AccountClient({ user, profile: initialProfile, addresses: initialAddresses }: any) {
  const [fullName, setFullName] = useState(initialProfile?.full_name === "User" ? "" : initialProfile?.full_name || "");
  const [phone, setPhone] = useState(initialProfile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddressValue, setNewAddressValue] = useState("");

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await updateFullName(fullName);
      alert("Name saved successfully!");
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSaving(true);
    try {
      await updatePhone(phone);
      alert("Phone number saved successfully!");
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLabel.trim() || !newAddressValue.trim()) {
      alert("Please fill in both fields");
      return;
    }
    try {
      await addAddress(newAddressLabel, newAddressValue);
      alert("Address saved successfully!");
      window.location.reload(); 
    } catch (err: any) {
      alert("Failed to save address: " + err.message);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      window.location.reload(); 
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/login";
  };

  const hasName = !!initialProfile?.full_name && initialProfile.full_name !== "User";
  const hasPhone = !!initialProfile?.phone; 
  const hasAddress = (initialAddresses || []).length > 0;

  let completionPercentage = 0;
  if (hasName) completionPercentage += 33;
  if (hasPhone) completionPercentage += 33;
  if (hasAddress) completionPercentage += 34;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
          <p className="text-[#a0a0a0]">Manage your profile and account settings</p>
        </div>

        <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Profile Completion
                {completionPercentage === 100 && <CheckCircle2 className="text-[#FF5500]" size={20} />}
              </h2>
              <p className="text-sm text-[#a0a0a0]">
                {completionPercentage === 100 ? "You're all set! You can place orders." : "Complete your profile to unlock checkout."}
              </p>
            </div>
            <span className={`text-2xl font-bold ${completionPercentage === 100 ? "text-[#FF5500]" : "text-white"}`}>
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${completionPercentage === 100 ? "bg-[#FF5500]" : "bg-[#FF5500]/50"}`} style={{ width: `${completionPercentage}%` }}></div>
          </div>
          {completionPercentage < 100 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-white bg-[#1a1a1a] p-3 rounded-xl border border-[#FF5500]/20">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-[#FF5500]" />
              <span className="flex flex-wrap gap-1">
                Please complete: 
                {!hasName && <strong>Full Name</strong>}
                {!hasPhone && <strong>Phone Number</strong>}
                {!hasAddress && <strong>Saved Address</strong>}
                to reach 100%.
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6 text-center">
              <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-[#FF5500]" size={40} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {hasName ? initialProfile.full_name : "User"}
              </h2>
              <p className="text-sm text-[#a0a0a0] mb-4">{user.email}</p>
              {hasName && <span className="text-xs text-[#FF5500] font-bold flex items-center justify-center gap-1"><CheckCircle2 size={12}/> Name Verified</span>}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-[#FF5500]" /> Full Name
              </h3>
              <form onSubmit={handleSaveName} className="flex gap-3">
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] outline-none text-white placeholder-[#666]" required />
                <button type="submit" disabled={saving} className="px-6 py-3 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-all disabled:opacity-50 flex items-center gap-2">
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </form>
              {hasName && <p className="text-xs text-[#FF5500] mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Name saved</p>}
            </div>

            <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Phone size={20} className="text-[#FF5500]" /> Contact Information
              </h3>
              <form onSubmit={handleSavePhone} className="flex gap-3">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-xl focus:ring-2 focus:ring-[#FF5500] outline-none text-white placeholder-[#666]" required />
                <button type="submit" disabled={saving} className="px-6 py-3 bg-[#FF5500] text-white font-bold rounded-xl hover:bg-[#e64d00] transition-all disabled:opacity-50 flex items-center gap-2">
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </form>
              {hasPhone && <p className="text-xs text-[#FF5500] mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Phone number saved</p>}
            </div>

            <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin size={20} className="text-[#FF5500]" /> Saved Addresses
                </h3>
                {(initialAddresses || []).length > 0 && <button onClick={() => setShowAddressForm(true)} className="text-sm font-bold text-[#FF5500] hover:text-[#e64d00]">+ Add New</button>}
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mb-4 p-4 bg-[#1a1a1a] border border-[#333333] rounded-xl space-y-3">
                  <input type="text" placeholder="Label (e.g., Home, Office)" value={newAddressLabel} onChange={(e) => setNewAddressLabel(e.target.value)} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-sm outline-none focus:border-[#FF5500] text-white placeholder-[#666]" required />
                  <textarea placeholder="Full address..." value={newAddressValue} onChange={(e) => setNewAddressValue(e.target.value)} className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333333] rounded-lg text-sm outline-none focus:border-[#FF5500] text-white placeholder-[#666] resize-none" rows={2} required />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 px-4 py-2 bg-[#FF5500] text-white text-sm font-bold rounded-lg hover:bg-[#e64d00] transition-all">Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="px-4 py-2 bg-[#2a2a2a] text-[#a0a0a0] text-sm font-bold rounded-lg hover:bg-[#333333] transition-all">Cancel</button>
                  </div>
                </form>
              )}

              {(initialAddresses || []).length > 0 ? (
                <div className="space-y-3">
                  {(initialAddresses || []).map((addr: any) => (
                    <div key={addr.id} className="flex items-start gap-3 p-4 bg-[#1a1a1a] border border-[#333333] rounded-xl group">
                      <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center shrink-0"><MapPin className="text-[#FF5500]" size={20} /></div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{addr.label}</p>
                        <p className="text-sm text-[#a0a0a0] mt-1">{addr.address}</p>
                      </div>
                      <button onClick={() => handleDeleteAddress(addr.id)} className="opacity-0 group-hover:opacity-100 p-2 text-[#666] hover:text-red-500 transition-all"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#1a1a1a] border border-[#333333] rounded-xl">
                  <p className="text-sm text-white font-bold mb-2">No saved addresses yet</p>
                  <p className="text-xs text-[#a0a0a0] mb-3">Add your first address to complete your profile and unlock checkout.</p>
                  <button onClick={() => setShowAddressForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5500] text-white text-sm font-bold rounded-lg hover:bg-[#e64d00] transition-all"><MapPin size={14} /> Add Address</button>
                </div>
              )}
            </div>

            <div className="bg-[#111111] rounded-3xl border border-[#333333] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Settings size={20} className="text-[#FF5500]" /> Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/orders" className="flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-xl hover:bg-[#2a2a2a] transition-all">
                  <ShoppingBag className="text-[#FF5500]" size={20} />
                  <div>
                    <div className="font-bold text-white text-sm">My Orders</div>
                    <div className="text-xs text-[#a0a0a0]">View order history</div>
                  </div>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all text-left w-full">
                  <LogOut className="text-red-500" size={20} />
                  <div>
                    <div className="font-bold text-red-500 text-sm">Logout</div>
                    <div className="text-xs text-[#a0a0a0]">Sign out of account</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}