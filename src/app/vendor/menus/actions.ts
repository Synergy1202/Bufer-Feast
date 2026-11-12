"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/server/admin";
import { requireVendor } from "@/lib/server/auth";

const MENU_BUCKET = "menu-images";

function getFileExtension(file: File) {
  return (
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin"
  );
}

function validateImage(file: File) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const maximumSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Menu image must be a JPG, PNG, or WebP file.",
    );
  }

  if (file.size > maximumSize) {
    throw new Error(
      "Menu image must not be larger than 5 MB.",
    );
  }
}

export async function toggleMenuStatus(
  menuId: string,
  currentStatus: string,
): Promise<void> {
  const vendor = await requireVendor();
  const admin = adminClient();

  const nextStatus =
    currentStatus === "published"
      ? "draft"
      : "published";

  const { error } = await admin
    .from("menus")
    .update({
      status: nextStatus,
    })
    .eq("id", menuId)
    .eq("vendor_id", vendor.id);

  if (error) {
    throw new Error(
      `Could not update menu status: ${error.message}`,
    );
  }

  revalidatePath("/vendor/menus");
  revalidatePath("/");
}

export async function deleteMenu(
  menuId: string,
): Promise<void> {
  const vendor = await requireVendor();
  const admin = adminClient();

  const menuResult = await admin
    .from("menus")
    .select("id, image_url")
    .eq("id", menuId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (menuResult.error) {
    throw new Error(
      `Could not find menu: ${menuResult.error.message}`,
    );
  }

  if (!menuResult.data) {
    throw new Error(
      "Menu not found or you do not own this menu.",
    );
  }

  const menu = menuResult.data as unknown as {
    id: string;
    image_url: string | null;
  };

  const { error: deleteError } = await admin
    .from("menus")
    .delete()
    .eq("id", menuId)
    .eq("vendor_id", vendor.id);

  if (deleteError) {
    throw new Error(
      `Could not delete menu: ${deleteError.message}`,
    );
  }

  if (menu.image_url) {
    await admin.storage
      .from(MENU_BUCKET)
      .remove([menu.image_url]);
  }

  revalidatePath("/vendor/menus");
  revalidatePath("/");
}

export async function uploadMenuImage(file: File) {
  const vendor = await requireVendor();

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please select a menu image.");
  }

  validateImage(file);

  const admin = adminClient();

  const imagePath =
    `${vendor.id}/${Date.now()}-${crypto.randomUUID()}.${getFileExtension(file)}`;

  const { error } = await admin.storage
    .from(MENU_BUCKET)
    .upload(imagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Could not upload menu image: ${error.message}`,
    );
  }

  const { data } = admin.storage
    .from(MENU_BUCKET)
    .getPublicUrl(imagePath);

  return {
    path: imagePath,
    publicUrl: data.publicUrl,
  };
}

export async function createMenu(
  formData: FormData,
): Promise<void> {
  const vendor = await requireVendor();
  const admin = adminClient();

  const title = String(
    formData.get("title") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const category = String(
    formData.get("category") || "",
  ).trim();

  const baseServings = Number(
    formData.get("base_servings") || 0,
  );

  const pricePerServing = Number(
    formData.get("price_per_serving") || 0,
  );

  const minOrderQuantity = Number(
    formData.get("min_order_quantity") || 1,
  );

  const maxSupplyLimit = Number(
    formData.get("max_supply_limit") || 100,
  );

  const cutOffTime = String(
    formData.get("cut_off_time") || "",
  ).trim();

  const allergens = String(
    formData.get("allergens") || "",
  ).trim();

  const imageFile = formData.get("image");

  if (!title) {
    throw new Error("Menu title is required.");
  }

  if (!category) {
    throw new Error("Menu category is required.");
  }

  if (baseServings <= 0) {
    throw new Error(
      "Base servings must be greater than zero.",
    );
  }

  if (pricePerServing <= 0) {
    throw new Error(
      "Price per serving must be greater than zero.",
    );
  }

  let imageUrl: string | null = null;

  if (
    imageFile instanceof File &&
    imageFile.size > 0
  ) {
    const uploaded = await uploadMenuImage(imageFile);
    imageUrl = uploaded.publicUrl;
  }

  const { error } = await admin.from("menus").insert({
    vendor_id: vendor.id,
    title,
    description: description || null,
    category,
    base_servings: baseServings,
    price_per_serving: pricePerServing,
    min_order_quantity: minOrderQuantity,
    max_supply_limit: maxSupplyLimit,
    cut_off_time: cutOffTime || null,
    allergens: allergens || null,
    image_url: imageUrl,
    status: "draft",
  });

  if (error) {
    throw new Error(
      `Could not create menu: ${error.message}`,
    );
  }

  revalidatePath("/vendor/menus");
  revalidatePath("/");
}

export async function updateMenu(
  menuId: string,
  formData: FormData,
): Promise<void> {
  const vendor = await requireVendor();
  const admin = adminClient();

  const title = String(
    formData.get("title") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const category = String(
    formData.get("category") || "",
  ).trim();

  const baseServings = Number(
    formData.get("base_servings") || 0,
  );

  const pricePerServing = Number(
    formData.get("price_per_serving") || 0,
  );

  const minOrderQuantity = Number(
    formData.get("min_order_quantity") || 1,
  );

  const maxSupplyLimit = Number(
    formData.get("max_supply_limit") || 100,
  );

  const cutOffTime = String(
    formData.get("cut_off_time") || "",
  ).trim();

  const allergens = String(
    formData.get("allergens") || "",
  ).trim();

  if (!title || !category) {
    throw new Error(
      "Title and category are required.",
    );
  }

  if (
    baseServings <= 0 ||
    pricePerServing <= 0
  ) {
    throw new Error(
      "Servings and price must be greater than zero.",
    );
  }

  const existingResult = await admin
    .from("menus")
    .select("image_url")
    .eq("id", menuId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (existingResult.error) {
    throw new Error(
      `Could not load menu: ${existingResult.error.message}`,
    );
  }

  if (!existingResult.data) {
    throw new Error(
      "Menu not found or you do not own this menu.",
    );
  }

  const existing = existingResult.data as unknown as {
    image_url: string | null;
  };

  const imageFile = formData.get("image");
  let imageUrl = existing.image_url;

  if (
    imageFile instanceof File &&
    imageFile.size > 0
  ) {
    const uploaded = await uploadMenuImage(imageFile);
    imageUrl = uploaded.publicUrl;

    if (existing.image_url) {
      await admin.storage
        .from(MENU_BUCKET)
        .remove([existing.image_url]);
    }
  }

  const { error } = await admin
    .from("menus")
    .update({
      title,
      description: description || null,
      category,
      base_servings: baseServings,
      price_per_serving: pricePerServing,
      min_order_quantity: minOrderQuantity,
      max_supply_limit: maxSupplyLimit,
      cut_off_time: cutOffTime || null,
      allergens: allergens || null,
      image_url: imageUrl,
    })
    .eq("id", menuId)
    .eq("vendor_id", vendor.id);

  if (error) {
    throw new Error(
      `Could not update menu: ${error.message}`,
    );
  }

  revalidatePath("/vendor/menus");
  revalidatePath(`/vendor/menus/${menuId}/edit`);
  revalidatePath("/");
}