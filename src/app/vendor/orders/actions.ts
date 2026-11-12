"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/server/admin";
import { requireVendor } from "@/lib/server/auth";

const allowedStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  const vendor = await requireVendor();

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid order status.");
  }

  const admin = adminClient();

  const { error } = await admin
    .from("orders")
    .update({
      status,
    })
    .eq("id", orderId)
    .eq("vendor_id", vendor.id);

  if (error) {
    throw new Error(
      `Could not update order status: ${error.message}`,
    );
  }

  revalidatePath("/vendor/orders");
  revalidatePath("/vendor/prep-sheet");
  revalidatePath("/admin/orders");
}