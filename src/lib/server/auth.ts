import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { AccountUser, AuthStatus } from "@/lib/types";
import { canonicalSupabaseUrl } from "./supabase-url";
import { AuthProblem } from "./problems";

const COOKIE_NAME = "jie_bulk_order-customer-auth";

function configuration() {
  if (process.env.ORDER_STORAGE !== "supabase")
    return {
      ready: false as const,
      reason:
        "Customer login needs your Supabase project. Local mode still supports guest test orders.",
    };
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key)
    return {
      ready: false as const,
      reason:
        "Add SUPABASE_PUBLISHABLE_KEY in your local .env.local file. Do not replace the server secret.",
    };
  if (key.startsWith("sb_secret_"))
    return {
      ready: false as const,
      reason:
        "Use a publishable key for customer authentication, not a server secret.",
    };
  try {
    if (key.startsWith("eyJ")) {
      const claims = JSON.parse(
        Buffer.from(key.split(".")[1] || "", "base64url").toString("utf8"),
      );
      if (claims.role !== "anon")
        return {
          ready: false as const,
          reason:
            "The legacy authentication key must be anon, never service_role.",
        };
    } else if (!key.startsWith("sb_publishable_"))
      return {
        ready: false as const,
        reason:
          "Use the publishable key from the same Supabase development project.",
      };
    return {
      ready: true as const,
      url: canonicalSupabaseUrl(process.env.SUPABASE_URL),
      key,
    };
  } catch {
    return {
      ready: false as const,
      reason:
        "Check the Supabase base URL and publishable-key format locally. Do not share their contents.",
    };
  }
}

export function authSetupStatus() {
  const config = configuration();
  return {
    configured: config.ready,
    reason: config.ready ? undefined : config.reason,
  };
}

export async function authClient() {
  const config = configuration();
  if (!config.ready)
    throw new AuthProblem(config.reason, 503, "AUTH_NOT_CONFIGURED");
  const jar = await cookies();
  const h = await headers();
  const host = (h.get("host") || "").split(":")[0];
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(host);
  const secure = process.env.NODE_ENV === "production" && !local;
  
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      name: COOKIE_NAME,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    },
    cookies: {
      getAll: () => jar.getAll(),
      // ✅ FIX: Wrapped in try/catch to prevent crashing Server Components (like Layouts)
      setAll: (values) => {
        try {
          for (const { name, value, options } of values)
            jar.set(name, value, {
              ...options,
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure,
            });
        } catch {
          // Cookies can only be set in Server Actions or Route Handlers.
          // We ignore errors when this is called from a standard Server Component.
        }
      },
    },
  });
}

export async function clearCustomerCookies() {
  const jar = await cookies();
  for (const cookie of jar.getAll())
    if (
      cookie.name === COOKIE_NAME ||
      cookie.name.startsWith(`${COOKIE_NAME}.`) ||
      cookie.name === `${COOKIE_NAME}-code-verifier`
    )
      jar.set(cookie.name, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0,
      });
}

export async function verifiedCustomer(): Promise<AccountUser | null> {
  if (!configuration().ready) return null;
  const jar = await cookies();
  const hasCookie = jar
    .getAll()
    .some(
      (cookie) =>
        (cookie.name === COOKIE_NAME ||
          cookie.name.startsWith(`${COOKIE_NAME}.`)) &&
        cookie.value,
    );
  if (!hasCookie) return null;
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    if (error && (!error.status || error.status >= 500))
      throw new AuthProblem(
        "The account session could not be verified. Retry after the connection recovers.",
        503,
        "AUTH_UNAVAILABLE",
      );
    await clearCustomerCookies();
    throw new AuthProblem(
      "Your session needs a fresh login. Sign in before retrying an account checkout.",
      401,
      "SESSION_EXPIRED",
    );
  }
 
  return {
    id: data.user.id,
    email: data.user.email || "",
    name:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name.slice(0, 80)
        : "",
  };
}

export async function requireCustomer() {
  const user = await verifiedCustomer();
  if (!user)
    throw new AuthProblem(
      "Sign in to access your account orders.",
      401,
      "AUTH_REQUIRED",
    );
  return user;
}

export async function sessionStatus(): Promise<AuthStatus> {
  const setup = authSetupStatus();
  if (!setup.configured) return { ...setup, user: null };
  try {
    return { ...setup, user: await verifiedCustomer() };
  } catch (error) {
    if (error instanceof AuthProblem && error.status === 401)
      return { ...setup, user: null, reason: "Please sign in again." };
    throw error;
  }
}

export function safeAuthFailure(
  error: unknown,
  operation: "signup" | "login" | "confirm",
) {
  console.error("🔴 FULL SUPABASE AUTH ERROR:", JSON.stringify(error, null, 2));

  const value =
    error && typeof error === "object"
      ? (error as { code?: unknown; status?: unknown; message?: unknown })
      : {};
      
  const code =
    typeof value.code === "string" && /^[a-z_]{2,60}$/.test(value.code)
      ? value.code
      : "auth_request_failed";

  console.error("Customer authentication failed: ", { operation, code, message: value.message });

  if (code === "over_email_send_rate_limit" || value.status === 429)
    return new AuthProblem(
      "The authentication service is rate-limiting requests. Wait before trying again.",
      429,
      "AUTH_RATE_LIMIT",
    );
    
  if (code === "email_address_not_authorized")
    return new AuthProblem(
      "Supabase's default email sender is restricted. For this development test, you MUST use the exact same email address you used to create your Supabase account, or configure a custom SMTP.",
      400,
      "AUTH_EMAIL_RESTRICTED",
    );
    
  if (code === "email_not_confirmed")
    return new AuthProblem(
      "Confirm your email using the message from Supabase, then sign in.",
      401,
      "AUTH_EMAIL_UNCONFIRMED",
    );
    
  if (operation === "login")
    return new AuthProblem(
      "Unable to sign in. Check your email, password and confirmation status.",
      401,
      "AUTH_SIGNIN_FAILED",
    );
    
  if (operation === "confirm")
    return new AuthProblem(
      "The confirmation link is invalid or expired.",
      400,
      "AUTH_CONFIRM_FAILED",
    );
    
  return new AuthProblem(
    `Signup failed: ${value.message || "Check the terminal for the full Supabase error."}`,
    400,
    "AUTH_SIGNUP_FAILED",
  );
}

export async function requireVendor() {
  const customer = await verifiedCustomer();

  if (!customer) {
    throw new AuthProblem(
      "Sign in to access the vendor dashboard.",
      401,
      "AUTH_REQUIRED",
    );
  }

  const client = await authClient();

  const { data: profile, error } = await client
    .from("profiles")
    .select("id, role, status, business_name, full_name, is_open")
    .eq("id", customer.id)
    .maybeSingle();

  if (error) {
    throw new AuthProblem(
      "The vendor profile could not be verified.",
      503,
      "VENDOR_PROFILE_UNAVAILABLE",
    );
  }

  if (!profile || profile.role !== "vendor") {
    throw new AuthProblem(
      "Access denied. This area is for registered vendors only.",
      403,
      "FORBIDDEN",
    );
  }

  if (profile.status !== "approved") {
    throw new AuthProblem(
      "Your vendor application is still awaiting approval.",
      403,
      "VENDOR_NOT_APPROVED",
    );
  }

  return {
    ...customer,
    role: "vendor" as const,
    status: profile.status,
    businessName: profile.business_name || profile.full_name,
    isOpen: profile.is_open !== false,
  };
}
export async function requireAdmin() {
  const customer = await verifiedCustomer();

  if (!customer) {
    throw new AuthProblem(
      "Sign in to access the admin panel.",
      401,
      "AUTH_REQUIRED",
    );
  }

  const client = await authClient();

  const { data: profile, error } = await client
    .from("profiles")
    .select("id, role, status")
    .eq("id", customer.id)
    .maybeSingle();

  if (error) {
    throw new AuthProblem(
      "The administrator profile could not be verified.",
      503,
      "ADMIN_PROFILE_UNAVAILABLE",
    );
  }

  if (!profile || profile.role !== "admin") {
    throw new AuthProblem(
      "Access denied. Administrators only.",
      403,
      "ADMIN_FORBIDDEN",
    );
  }

  if (profile.status !== "active") {
    throw new AuthProblem(
      "This administrator account is inactive.",
      403,
      "ADMIN_INACTIVE",
    );
  }

  return {
    ...customer,
    role: "admin" as const,
  };
}