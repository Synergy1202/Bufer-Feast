import Link from "next/link";
import {
  Eye,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { authClient, requireVendor } from "@/lib/server/auth";
import {
  deleteMenu,
  toggleMenuStatus,
} from "./actions";

export const dynamic = "force-dynamic";

type MenuRow = {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price_per_serving: number | null;
  base_servings: number | null;
  min_order_quantity: number | null;
  max_supply_limit: number | null;
  cut_off_time: string | null;
  status: string | null;
  image_url: string | null;
  created_at: string | null;
};

export default async function VendorMenusPage() {
  const vendor = await requireVendor();
  const client = await authClient();

  const result = await client
    .from("menus")
    .select(
      "id, vendor_id, title, description, category, price_per_serving, base_servings, min_order_quantity, max_supply_limit, cut_off_time, status, image_url, created_at",
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", {
      ascending: false,
    });

  if (result.error) {
    throw new Error(
      `Could not load menus: ${result.error.message}`,
    );
  }

  const menus = (result.data || []) as unknown as MenuRow[];

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <UtensilsCrossed className="text-green-600" />
            My Menus
          </h1>

          <p className="mt-2 text-gray-500">
            Manage the meals customers can order from your kitchen.
          </p>
        </div>

        <Link
          href="/vendor/menus/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
        >
          <Plus size={19} />
          Create Menu
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <UtensilsCrossed
            className="mx-auto text-gray-300"
            size={48}
          />

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            No menus yet
          </h2>

          <p className="mb-6 mt-2 text-gray-500">
            Create your first menu to start receiving orders.
          </p>

          <Link
            href="/vendor/menus/new"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
          >
            <Plus size={18} />
            Create Your First Menu
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Menu
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Price
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Limits
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {menus.map((menu) => {
                  const isPublished =
                    menu.status === "published";

                  return (
                    <tr
                      key={menu.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {menu.image_url ? (
                              <img
                                src={menu.image_url}
                                alt={menu.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <UtensilsCrossed
                                  className="text-gray-400"
                                  size={22}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-gray-900">
                              {menu.title}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {menu.category || "General"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold text-gray-900">
                          ₦
                          {Number(
                            menu.price_per_serving || 0,
                          ).toLocaleString("en-NG")}
                        </p>

                        <p className="text-xs text-gray-500">
                          per person
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        <p>
                          Min:{" "}
                          {menu.min_order_quantity ||
                            menu.base_servings ||
                            0}
                        </p>

                        <p>
                          Max:{" "}
                          {menu.max_supply_limit ||
                            "Unlimited"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isPublished
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/kitchens/${menu.vendor_id}`}
                            title="View kitchen"
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </Link>

                          <Link
                            href={`/vendor/menus/${menu.id}/edit`}
                            title="Edit menu"
                            className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                          >
                            <Pencil size={17} />
                          </Link>

                          <form
                            action={async () => {
                              "use server";

                              await toggleMenuStatus(
                                menu.id,
                                menu.status || "draft",
                              );
                            }}
                          >
                            <button
                              type="submit"
                              title={
                                isPublished
                                  ? "Move to draft"
                                  : "Publish menu"
                              }
                              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                            >
                              {isPublished
                                ? "Unpublish"
                                : "Publish"}
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";

                              await deleteMenu(menu.id);
                            }}
                          >
                            <button
                              type="submit"
                              title="Delete menu"
                              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}