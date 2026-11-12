import { GoogleAddressInput } from "@/components/google-address-input";
import { saveCustomerAddress } from "./actions";

export default function AddressCompletionPage() {
  return <main className="min-h-screen bg-slate-50 px-4 py-14">
    <form action={saveCustomerAddress} className="mx-auto max-w-xl space-y-5 rounded-2xl bg-white p-7 shadow">
      <h1 className="text-2xl font-bold text-slate-900">Where should we deliver?</h1>
      <p className="text-sm text-slate-600">Google sign-in doesn't share your delivery address. Please select one before ordering.</p>
      <GoogleAddressInput name="primary_address" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900" placeholder="Search for your address" />
      <button type="submit" className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white">Save delivery address</button>
    </form>
  </main>;
}
