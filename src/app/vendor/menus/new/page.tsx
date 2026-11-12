import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireVendor } from "@/lib/server/auth";
import { createMenu } from "../actions";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";

const labelClass =
  "mb-2 block text-sm font-bold text-gray-700";

export default async function CreateMenuPage() {
  await requireVendor();

  return (
    <main className="mx-auto max-w-3xl py-10">
      <Link
        href="/vendor/menus"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600"
      >
        <ArrowLeft size={16} />
        Back to Menus
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Menu
        </h1>

        <p className="mb-8 mt-2 text-gray-500">
          Add a meal customers can order from your kitchen.
        </p>

       <form
  action={createMenu}
  className="space-y-6"
>
          <div>
            <label
              htmlFor="title"
              className={labelClass}
            >
              Menu Title *
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Example: Party Jollof Rice and Chicken"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className={labelClass}
            >
              Description *
            </label>

            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Describe the meal and its portion details."
              className={inputClass}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className={labelClass}
              >
                Category *
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Select category
                </option>

                <option value="Party Trays & Platters">
                  Party Trays & Platters
                </option>

                <option value="Swallows & Soups">
                  Swallows & Soups
                </option>

                <option value="Rice Dishes">
                  Rice Dishes
                </option>

                <option value="Pasta & Noodles">
                  Pasta & Noodles
                </option>

                <option value="Continental Dishes">
                  Continental Dishes
                </option>

                <option value="Bulk Meal Packs">
                  Bulk Meal Packs
                </option>

                <option value="Sides, Proteins & Extras">
                  Sides, Proteins & Extras
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="image"
                className={labelClass}
              >
                Menu Image
              </label>

              <input
                id="image"
                name="image"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-700"
              />

              <p className="mt-2 text-xs text-gray-500">
                JPG, PNG, or WEBP. Maximum size: 5 MB.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="base_servings"
                className={labelClass}
              >
                Base Servings *
              </label>

              <input
                id="base_servings"
                name="base_servings"
                type="number"
                required
                min={1}
                defaultValue={5}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="price_per_serving"
                className={labelClass}
              >
                Price Per Person *
              </label>

              <input
                id="price_per_serving"
                name="price_per_serving"
                type="number"
                required
                min={100}
                defaultValue={3000}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="min_order_quantity"
                className={labelClass}
              >
                Minimum Order Quantity *
              </label>

              <input
                id="min_order_quantity"
                name="min_order_quantity"
                type="number"
                required
                min={1}
                defaultValue={5}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="max_supply_limit"
                className={labelClass}
              >
                Maximum Supply Limit *
              </label>

              <input
                id="max_supply_limit"
                name="max_supply_limit"
                type="number"
                required
                min={1}
                defaultValue={100}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="cut_off_time"
                className={labelClass}
              >
                Daily Cut-off Time
              </label>

              <input
                id="cut_off_time"
                name="cut_off_time"
                type="time"
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-500">
                Orders after this time will not be accepted today.
              </p>
            </div>

            <div>
              <label
                htmlFor="status"
                className={labelClass}
              >
                Menu Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue="draft"
                className={inputClass}
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="allergens"
              className={labelClass}
            >
              Allergens and Dietary Information
            </label>

            <textarea
              id="allergens"
              name="allergens"
              rows={3}
              placeholder="Example: Contains peanuts, dairy, and gluten."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Link
              href="/vendor/menus"
              className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
            >
              Create Menu
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}