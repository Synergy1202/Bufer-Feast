import { authClient, requireCustomer } from "@/lib/server/auth";
import { apiError, guard, readJson, reply } from "@/lib/server/http";
import { z } from "zod";

export const runtime = "nodejs";

// Validate the incoming form data
const menuSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description is too short"),
  base_servings: z.number().min(1, "Must serve at least 1 person"),
  price_per_serving: z.number().min(100, "Price must be at least 100"),
  category: z.string().min(1, "Category is required"),
  image_url: z.string().url("Please enter a valid image URL").optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function POST(request: Request) {
  try {
    guard(request);

    // 1. Ensure the user is logged in
    const user = await requireCustomer();

    const client = await authClient();

    // 2. Check if the user is actually a vendor in the database
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "vendor") {
      return new Response(JSON.stringify({ message: "Access denied. Only vendors can create menus." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Parse and validate the form data
    const { body } = await readJson(request);
    const parsed = menuSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ message: parsed.error.issues[0]?.message ?? "Invalid menu data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Insert the menu into the database
    // Note: We use user.id for vendor_id to prevent spoofing!
    const { data, error } = await client
      .from("menus")
      .insert([
        {
          vendor_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          base_servings: parsed.data.base_servings,
          price_per_serving: parsed.data.price_per_serving,
          category: parsed.data.category,
          image_url: parsed.data.image_url || null,
          status: parsed.data.status,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return reply({ ok: true, menu: data });
  } catch (error) {
    return apiError(error);
  }
}