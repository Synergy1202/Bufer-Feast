import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authClient, requireVendor } from "@/lib/server/auth";
import { updateMenu } from "../../actions";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-500";

export default async function EditMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await requireVendor();
  const client = await authClient();

  const { data: menu, error } = await client
    .from("menus")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!menu) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Menu not found
        </h1>

        <Link
          href="/vendor/menus"
          className="inline-block mt-6 text-green-600 font-bold"
        >
          Back to menus
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Link
        href="/vendor/menus"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Menus
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Menu
        </h1>

        <p className="text-gray-500 mt-2 mb-8">
          Update your menu details and availability.
        </p>

        <form
  action={updateMenu.bind(null, menu.id)}
  className="space-y-6"
>
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Menu Title *
            </label>

            <input
              id="title"
              name="title"
              required
              defaultValue={menu.title}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Description *
            </label>

            <textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={menu.description || ""}
              className={inputClass}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Category *
              </label>

              <select
                id="category"
                name="category"
                required
                defaultValue={menu.category || ""}
                className={inputClass}
              >
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
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Replace Menu Image
              </label>

              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-700"
              />

              {menu.image_url && (
                <p className="text-xs text-gray-500 mt-2">
                  An image is already uploaded. Leave this empty to keep it.
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="base_servings"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Base Servings *
              </label>

              <input
                id="base_servings"
                name="base_servings"
                type="number"
                required
                min={1}
                defaultValue={menu.base_servings}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="price_per_serving"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Price Per Person *
              </label>

              <input
                id="price_per_serving"
                name="price_per_serving"
                type="number"
                required
                min={100}
                defaultValue={menu.price_per_serving}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="min_order_quantity"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Minimum Order Quantity *
              </label>

              <input
                id="min_order_quantity"
                name="min_order_quantity"
                type="number"
                required
                min={1}
                defaultValue={menu.min_order_quantity || 1}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="max_supply_limit"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Maximum Supply Limit *
              </label>

              <input
                id="max_supply_limit"
                name="max_supply_limit"
                type="number"
                required
                min={1}
                defaultValue={menu.max_supply_limit || 100}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="cut_off_time"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Daily Cut-off Time
              </label>

              <input
                id="cut_off_time"
                name="cut_off_time"
                type="time"
                defaultValue={menu.cut_off_time || ""}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={menu.status || "draft"}
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="allergens"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Allergens and Dietary Information
            </label>

            <textarea
              id="allergens"
              name="allergens"
              rows={3}
              defaultValue={menu.allergens || ""}
              className={inputClass}
            />
          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href="/vendor/menus"
              className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}