import { createBrowserClient } from "@supabase/ssr";

const COOKIE_NAME = "jie_bulk_order-customer-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
}

if (!supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseKey,
  {
    cookieOptions: {
      name: COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
);