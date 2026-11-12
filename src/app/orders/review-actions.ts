"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient, requireCustomer } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function ratingValue(value: FormDataEntryValue | null) {
  const number = Number(textValue(value));

  return Number.isInteger(number) ? number : 0;
}

export async function submitOrderReview(formData: FormData) {
  const customer = await requireCustomer();

  const orderId = textValue(formData.get("order_id"));
  const kitchenRating = ratingValue(
    formData.get("kitchen_rating"),
  );
  const foodRating = ratingValue(
    formData.get("food_rating"),
  );
  const comment = textValue(formData.get("comment"));

  if (!orderId) {
    throw new Error("The order ID is required.");
  }

  if (
    kitchenRating < 1 ||
    kitchenRating > 5
  ) {
    throw new Error(
      "Please provide a kitchen rating between 1 and 5.",
    );
  }

  if (
    foodRating < 1 ||
    foodRating > 5
  ) {
    throw new Error(
      "Please provide a food rating between 1 and 5.",
    );
  }

  if (comment.length > 1000) {
    throw new Error(
      "Your review must not exceed 1,000 characters.",
    );
  }

  const client = await authClient();

  const { data: order, error: orderError } =
    await client
      .from("orders")
      .select("id, user_id, vendor_id, status")
      .eq("id", orderId)
      .eq("user_id", customer.id)
      .maybeSingle();

  if (orderError) {
    throw new Error(
      `Could not verify order: ${orderError.message}`,
    );
  }

  if (!order) {
    throw new Error(
      "Order not found or you do not own this order.",
    );
  }

  if (
    order.status !== "completed" &&
    order.status !== "delivered"
  ) {
    throw new Error(
      "You can review an order only after it has been delivered.",
    );
  }

  const admin = adminClient();

  const { error: reviewError } = await admin
    .from("vendor_reviews")
    .insert({
      order_id: order.id,
      customer_id: customer.id,
      vendor_id: order.vendor_id,
      kitchen_rating: kitchenRating,
      food_rating: foodRating,
      comment: comment || null,
      is_visible: true,
    });

  if (reviewError) {
    if (
      reviewError.code === "23505" ||
      reviewError.message
        .toLowerCase()
        .includes("duplicate")
    ) {
      throw new Error(
        "You have already reviewed this order.",
      );
    }

    throw new Error(
      `Could not save review: ${reviewError.message}`,
    );
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  revalidatePath(`/kitchens/${order.vendor_id}`);

  redirect(`/orders/${order.id}?reviewed=true`);
}