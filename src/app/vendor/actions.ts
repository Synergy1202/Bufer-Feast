"use server";

import { requireVendor, authClient } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createMenu(formData: FormData) {
  const user = await requireVendor();
  const client = await authClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const base_servings = parseInt(formData.get("base_servings") as string);
  const price_per_serving = parseFloat(formData.get("price_per_serving") as string);
  const allergens = formData.get("allergens") as string;
  const min_order_quantity = parseInt(formData.get("min_order_quantity") as string);
  const max_supply_limit = parseInt(formData.get("max_supply_limit") as string);
  
  // Read which button was clicked ("draft" or "published")
  const status = (formData.get("status") as string) || "draft";

  // 1. Handle Image Upload
  const imageFile = formData.get("image") as File;
  let image_url = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await client.storage
      .from("menu-images")
      .upload(filePath, imageFile);

    if (!uploadError) {
      const { data } = client.storage.from("menu-images").getPublicUrl(filePath);
      image_url = data.publicUrl;
    } else {
      console.error("Image upload failed:", uploadError);
    }
  }

  // 2. Save to Database
  const { error } = await client.from("menus").insert({
    vendor_id: user.id,
    title,
    description,
    category,
    base_servings,
    price_per_serving,
    allergens,
    min_order_quantity,
    max_supply_limit,
    image_url,
    status, // Saves as either "draft" or "published"
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/vendor/menus");
}

// NEW ACTION: Toggle between Draft and Published
export async function toggleMenuStatus(menuId: string, currentStatus: string) {
  const user = await requireVendor();
  const client = await authClient();

  const newStatus = currentStatus === "published" ? "draft" : "published";

  const { error } = await client
    .from("menus")
    .update({ status: newStatus })
    .eq("id", menuId)
    .eq("vendor_id", user.id); // Security: ensure they only edit their own menus

  if (error) {
    throw new Error(error.message);
  }

  // Refresh the page to show the new status
  revalidatePath("/vendor/menus");
}