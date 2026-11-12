import Link from "next/link";
import { registerVendor } from "./actions";
import { GoogleAddressInput } from "@/components/google-address-input";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

export default function VendorSignupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
            Vendor onboarding
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Apply to sell with Bufer Feast
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Create your vendor account and submit your business documents for
            review.
          </p>
        </div>

        <form
          action={registerVendor}
          encType="multipart/form-data"
          className="space-y-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
        >
          {/* Account details */}
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Account details
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              These details will be used to create your vendor login.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="full_name" className={labelClass}>
                  Full legal name
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Your full legal name"
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  className={inputClass}
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
          </section>

          {/* Business details */}
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Business details
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              Tell us about the kitchen or food business you operate.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="business_name" className={labelClass}>
                  Business name
                </label>

                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Your kitchen or business name"
                />
              </div>

              <div>
                <label htmlFor="vendor_type" className={labelClass}>
                  Vendor type
                </label>

                <select
                  id="vendor_type"
                  name="vendor_type"
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select vendor type
                  </option>

                  <option value="home_food">
                    Home Food
                  </option>

                  <option value="restaurant">
                    Restaurant
                  </option>

                  <option value="local_dish">
                    Local Dish
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="location" className={labelClass}>
                  Kitchen location
                </label>

                <GoogleAddressInput
                  name="location"
                  placeholder="Search for the full kitchen address"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-500">
                  Example: Yaba, Lagos State
                </p>
              </div>
            </div>
          </section>

          {/* Identity verification */}
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Identity verification
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              Your identity documents are private and will only be available
              to authorized administrators during review.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="id_proof_type" className={labelClass}>
                  ID proof type
                </label>

                <select
                  id="id_proof_type"
                  name="id_proof_type"
                  required
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select ID type
                  </option>

                  <option value="national_id">
                    National ID
                  </option>

                  <option value="drivers_license">
                    Driver&apos;s License
                  </option>

                  <option value="international_passport">
                    International Passport
                  </option>

                  <option value="voters_card">
                    Voter&apos;s Card
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="id_proof_number" className={labelClass}>
                  ID proof number
                </label>

                <input
                  id="id_proof_number"
                  name="id_proof_number"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Enter your ID number"
                />
              </div>

              <div>
                <label htmlFor="id_document" className={labelClass}>
                  Identity document
                </label>

                <input
                  id="id_document"
                  name="id_document"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-500">
                  Required. PDF, JPG, or PNG. Maximum size: 10 MB.
                </p>
              </div>
            </div>
          </section>

          {/* CAC verification */}
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              CAC verification
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              CAC registration is required for all vendor applications.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="cac_number" className={labelClass}>
                  CAC registration number
                </label>

                <input
                  id="cac_number"
                  name="cac_number"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Enter CAC registration number"
                />
              </div>

              <div>
                <label htmlFor="cac_document" className={labelClass}>
                  CAC certificate
                </label>

                <input
                  id="cac_document"
                  name="cac_document"
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-500">
                  Required. PDF, JPG, or PNG. Maximum size: 10 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Bank details */}
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              Bank information
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              Bank information is optional during application and can be
              updated later.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="bank_name" className={labelClass}>
                  Bank name
                </label>

                <input
                  id="bank_name"
                  name="bank_name"
                  type="text"
                  className={inputClass}
                  placeholder="Bank name"
                />
              </div>

              <div>
                <label htmlFor="account_number" className={labelClass}>
                  Account number
                </label>

                <input
                  id="account_number"
                  name="account_number"
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="Account number"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="account_name" className={labelClass}>
                  Account name
                </label>

                <input
                  id="account_name"
                  name="account_name"
                  type="text"
                  className={inputClass}
                  placeholder="Name on bank account"
                />
              </div>
            </div>
          </section>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            <input
              type="checkbox"
              name="commission_terms"
              value="accepted"
              required
              className="mt-1 h-4 w-4 accent-orange-600"
            />
            <span>
              I understand that Bufer Feast charges a 10% commission on every
              completed order, and I agree to the applicable terms and
              conditions.
            </span>
          </label>

          {/* Process notice */}
          <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-900">
            After submitting this application, you will receive an email
            verification link. You must verify your email before logging in.
            An administrator will then review your CAC and identity documents.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-orange-600 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Submit vendor application
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-600 hover:text-orange-700"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
