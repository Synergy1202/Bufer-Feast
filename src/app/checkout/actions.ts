"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authClient, requireCustomer } from "@/lib/server/auth";
import { requestShipbubbleRates, validateShipbubbleAddress } from "@/lib/server/shipbubble";

interface SubmittedCartItem {
  id?: string;
  menu_id?: string;
  vendor_id?: string;
  headcount?: number;
}

interface MenuRecord {
  id: string;
  vendor_id: string;
  title: string;
  price_per_serving: number;
  base_servings: number;
  status: string;
  cut_off_time: string | null;
  min_order_quantity: number | null;
  max_supply_limit: number | null;
}

function textValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getLagosTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function hasCutoffPassed(cutoff: string | null) {
  if (!cutoff) {
    return false;
  }

  const current = getLagosTime().slice(0, 5);
  const limit = cutoff.slice(0, 5);

  return current >= limit;
}

export async function getCheckoutData() {
  const customer = await requireCustomer();
  const client = await authClient();

  const [{ data: profile }, { data: addresses, error }] =
    await Promise.all([
      client
        .from("profiles")
        .select("phone, full_name")
        .eq("id", customer.id)
        .maybeSingle(),

      client
        .from("saved_addresses")
        .select(
          "id, label, address, is_default, created_at",
        )
        .eq("user_id", customer.id)
        .order("is_default", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        }),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: customer,
    profile,
    addresses: addresses || [],
    isComplete: Boolean(
      profile?.phone && addresses?.length,
    ),
  };
}

export async function saveAddress(formData: FormData) {
  const customer = await requireCustomer();
  const client = await authClient();

  const label = textValue(formData.get("label"));
  const address = textValue(formData.get("address"));
  const latitude = Number(formData.get("address_latitude"));
  const longitude = Number(formData.get("address_longitude"));
  const placeId = textValue(formData.get("address_place_id"));

  if (!label || !address) {
    throw new Error(
      "Address label and address are required.",
    );
  }

  const { error } = await client
    .from("saved_addresses")
    .insert({
      user_id: customer.id,
      label: label.slice(0, 50),
      address: address.slice(0, 500),
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      place_id: placeId || null,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/checkout");
  revalidatePath("/account");
}

export async function deleteAddress(id: string) {
  const customer = await requireCustomer();
  const client = await authClient();

  if (!id || typeof id !== "string") {
    throw new Error("A valid address is required.");
  }

  const { error } = await client
    .from("saved_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", customer.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/checkout");
  revalidatePath("/account");
}

export async function placeOrderAction(formData: FormData) {
  const customer = await requireCustomer();
  const client = await authClient();

  const deliveryAddress = textValue(
    formData.get("delivery_address"),
  );

  const eventType =
    textValue(formData.get("event_type")) || "home";

  /*
   * New delivery-window field.
   *
   * The fallback supports any older checkout page that still
   * sends delivery_slot.
   */
  const deliveryWindow =
    textValue(formData.get("delivery_window")) ||
    textValue(formData.get("delivery_slot"));

  const scheduledTime = textValue(
    formData.get("scheduled_time"),
  );

  const allergies = textValue(
    formData.get("allergies"),
  );

  const specialInstructions = textValue(
    formData.get("special_instructions"),
  );

  const cartItemsValue = textValue(
    formData.get("cart_items"),
  );

  if (!deliveryAddress) {
    throw new Error(
      "A delivery address is required.",
    );
  }

  if (
    !["morning", "afternoon", "evening"].includes(
      deliveryWindow,
    )
  ) {
    throw new Error(
      "Please select a delivery period.",
    );
  }

  let submittedItems: SubmittedCartItem[];

  try {
    submittedItems = JSON.parse(
      cartItemsValue || "[]",
    );
  } catch {
    throw new Error(
      "The basket data is invalid.",
    );
  }

  if (
    !Array.isArray(submittedItems) ||
    submittedItems.length === 0
  ) {
    throw new Error("Your basket is empty.");
  }

  const cleanItems = submittedItems
    .map((item) => ({
      menu_id:
        typeof item.menu_id === "string"
          ? item.menu_id
          : "",

      vendor_id:
        typeof item.vendor_id === "string"
          ? item.vendor_id
          : "",

      headcount: Number(item.headcount),
    }))
    .filter(
      (item) =>
        item.menu_id &&
        item.vendor_id &&
        Number.isInteger(item.headcount) &&
        item.headcount > 0,
    );

  if (cleanItems.length === 0) {
    throw new Error(
      "Your basket contains no valid items.",
    );
  }

  const vendorIds = [
    ...new Set(
      cleanItems.map((item) => item.vendor_id),
    ),
  ];

  if (vendorIds.length !== 1) {
    throw new Error(
      "A basket can contain items from only one kitchen.",
    );
  }

  const vendorId = vendorIds[0];

  const {
    data: vendor,
    error: vendorError,
  } = await client
    .from("public_vendor_profiles")
    .select("id, is_open, status")
    .eq("id", vendorId)
    .maybeSingle();

  if (vendorError) {
    throw new Error(vendorError.message);
  }

  if (!vendor) {
    throw new Error(
      "The selected kitchen could not be found.",
    );
  }

  if (vendor.status !== "active") {
    throw new Error(
      "This kitchen is not currently approved.",
    );
  }

  if (vendor.is_open === false) {
    throw new Error(
      "This kitchen is currently closed.",
    );
  }

  const menuIds = cleanItems.map(
    (item) => item.menu_id,
  );

  const {
    data: menus,
    error: menusError,
  } = await client
    .from("menus")
    .select(
      [
        "id",
        "vendor_id",
        "title",
        "price_per_serving",
        "base_servings",
        "status",
        "cut_off_time",
        "min_order_quantity",
        "max_supply_limit",
      ].join(", "),
    )
    .in("id", menuIds)
    .eq("vendor_id", vendorId);

  if (menusError) {
    throw new Error(menusError.message);
  }

  const menuMap = new Map(
    (
      (menus || []) as unknown as MenuRecord[]
    ).map((menu) => [
      menu.id,
      menu,
    ]),
  );

  if (menuMap.size !== menuIds.length) {
    throw new Error(
      "One or more menu items are no longer available.",
    );
  }

  let totalHeadcount = 0;
  let totalPrice = 0;

  const orderItems = cleanItems.map((submitted) => {
    const menu = menuMap.get(
      submitted.menu_id,
    );

    if (!menu) {
      throw new Error(
        "One or more menu items are no longer available.",
      );
    }

    if (menu.status !== "published") {
      throw new Error(
        `${menu.title} is no longer published.`,
      );
    }

    const minimum =
      menu.min_order_quantity ||
      menu.base_servings ||
      1;

    const maximum =
      menu.max_supply_limit || 999999;

    if (submitted.headcount < minimum) {
      throw new Error(
        `${menu.title} requires a minimum order of ${minimum} people.`,
      );
    }

    if (submitted.headcount > maximum) {
      throw new Error(
        `${menu.title} is limited to ${maximum} people per order.`,
      );
    }

    if (hasCutoffPassed(menu.cut_off_time)) {
      throw new Error(
        `The order cut-off time for ${menu.title} has passed.`,
      );
    }

    const lineTotal =
      menu.price_per_serving *
      submitted.headcount;

    totalHeadcount += submitted.headcount;
    totalPrice += lineTotal;

    return {
      menu_id: menu.id,
      vendor_id: vendorId,
      headcount: submitted.headcount,
      total_price: lineTotal,
      dish_name: menu.title,
    };
  });

  const {
    data: order,
    error: orderError,
  } = await client
    .from("orders")
    .insert({
      user_id: customer.id,
      vendor_id: vendorId,
      headcount: totalHeadcount,
      total_price: totalPrice,
      delivery_address: deliveryAddress.slice(0, 500),
      delivery_window: deliveryWindow,
      event_type: eventType.slice(0, 80),
      scheduled_time: scheduledTime || null,
      allergies: allergies
        ? allergies.slice(0, 500)
        : null,
      special_instructions: specialInstructions
        ? specialInstructions.slice(0, 1000)
        : null,
      status: "pending",
      payment_status: "unpaid",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(
      orderError?.message ||
        "Could not create the order.",
    );
  }

  const {
    error: itemsError,
  } = await client
    .from("order_items")
    .insert(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      })),
    );

  if (itemsError) {
    await client
      .from("orders")
      .delete()
      .eq("id", order.id)
      .eq("user_id", customer.id);

    throw new Error(itemsError.message);
  }

  const { data: customerProfile } = await client
    .from("profiles")
    .select("phone")
    .eq("id", customer.id)
    .maybeSingle();
  const { data: pickup } = await client
    .from("public_vendor_profiles")
    .select("display_name, location")
    .eq("id", vendorId)
    .maybeSingle();

  const pickupPhone = process.env.SHIPBUBBLE_PICKUP_PHONE || customerProfile?.phone || "";
  if (!pickup?.location || !pickupPhone) {
    throw new Error("A complete kitchen pickup address and phone number are required for delivery.");
  }

  const [sender, receiver] = await Promise.all([
    validateShipbubbleAddress({
      name: pickup.display_name || "Bufer Feast kitchen",
      email: customer.email,
      phone: pickupPhone,
      address: pickup.location,
    }),
    validateShipbubbleAddress({
      name: customer.name || customer.email,
      email: customer.email,
      phone: customerProfile?.phone || pickupPhone,
      address: deliveryAddress,
    }),
  ]);

  const rateResponse = await requestShipbubbleRates({
    sender_address_code: sender.data.address_code,
    reciever_address_code: receiver.data.address_code,
    pickup_date: scheduledTime ? scheduledTime.slice(0, 10) : new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    category_id: Number(process.env.SHIPBUBBLE_CATEGORY_ID || "69709726"),
    package_items: orderItems.map((item) => ({
      name: item.dish_name,
      description: "Prepared food order",
      unit_weight: "2",
      unit_amount: String(Math.round(item.total_price / Math.max(1, item.headcount))),
      quantity: String(item.headcount),
    })),
    package_dimension: { length: 30, width: 20, height: 15 },
    delivery_instructions: "Keep upright and handle with care.",
  });
  const rates = Array.isArray(rateResponse.data?.couriers) ? rateResponse.data.couriers : [];
  const selectedRate = rates.find((rate: { service_type?: string }) => rate.service_type === "pickup") || rates[0];
  if (!selectedRate) throw new Error("No Shipbubble delivery rate is available for this address.");

  const { error: deliveryError } = await client
    .from("orders")
    .update({
      delivery_provider: "shipbubble",
      delivery_status: "rate_selected",
      delivery_fee: Number(selectedRate.total || selectedRate.rate_card_amount || 0),
      shipbubble_request_token: rateResponse.data.request_token,
      shipbubble_service_code: selectedRate.service_code,
      shipbubble_courier_id: String(selectedRate.courier_id),
      shipbubble_courier_name: selectedRate.courier_name,
      shipbubble_rate_amount: Number(selectedRate.total || selectedRate.rate_card_amount || 0),
    })
    .eq("id", order.id)
    .eq("user_id", customer.id);
  if (deliveryError) throw new Error(deliveryError.message);

  revalidatePath("/orders");
  revalidatePath("/vendor/orders");
  revalidatePath("/vendor/prep-sheet");
  revalidatePath("/admin/orders");

  redirect(`/api/payments/initialize?order_id=${encodeURIComponent(order.id)}`);
}