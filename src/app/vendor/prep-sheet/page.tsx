import {
  CalendarDays,
  ChefHat,
  ClipboardList,
} from "lucide-react";
import { authClient, requireVendor } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type PrepItem = {
  dish_name: string | null;
  headcount: number | null;
};

type PrepOrder = {
  id: string;
  scheduled_time: string | null;
  created_at: string | null;
  status: string | null;
  order_items: PrepItem[] | null;
};

export default async function KitchenPrepSheetPage() {
  const vendor = await requireVendor();
  const client = await authClient();

  const today = new Date();

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await client
    .from("orders")
    .select(
      `
        id,
        scheduled_time,
        created_at,
        status,
        order_items (
          dish_name,
          headcount
        )
      `,
    )
    .eq("vendor_id", vendor.id)
    .in("status", [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
    ])
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", {
      ascending: true,
    });

  if (result.error) {
    throw new Error(
      `Could not load prep sheet: ${result.error.message}`,
    );
  }

  const orders =
    (result.data || []) as unknown as PrepOrder[];

  const totals = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.order_items || []) {
      const name = item.dish_name || "Unknown menu item";
      const quantity = Number(item.headcount || 0);

      totals.set(
        name,
        (totals.get(name) || 0) + quantity,
      );
    }
  }

  const prepItems = Array.from(totals.entries()).sort(
    ([nameA], [nameB]) =>
      nameA.localeCompare(nameB),
  );

  const totalPortions = prepItems.reduce(
    (sum, [, quantity]) => sum + quantity,
    0,
  );

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <ClipboardList className="text-green-600" />
            Kitchen Prep Sheet
          </h1>

          <p className="mt-2 text-gray-500">
            Aggregated preparation requirements for today.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
          <CalendarDays
            size={18}
            className="text-green-600"
          />

          {today.toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Menu items to prepare
          </p>

          <p className="mt-2 text-4xl font-bold text-gray-900">
            {prepItems.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total portions
          </p>

          <p className="mt-2 text-4xl font-bold text-green-600">
            {totalPortions}
          </p>
        </div>
      </div>

      {prepItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <ChefHat
            className="mx-auto text-gray-300"
            size={52}
          />

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Nothing to prepare yet
          </h2>

          <p className="mt-2 text-gray-500">
            Active orders for today will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">
              Today&apos;s Preparation List
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {prepItems.map(([dishName, quantity]) => (
              <div
                key={dishName}
                className="flex items-center justify-between gap-4 px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                    {quantity}
                  </div>

                  <div>
                    <p className="font-bold text-gray-900">
                      {dishName}
                    </p>

                    <p className="text-sm text-gray-500">
                      portions to prepare
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-gray-500">
                  {quantity} portions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}