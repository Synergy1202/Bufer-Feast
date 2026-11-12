import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "jie_bulk_order-customer-auth";

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/admin")
  );
}

function isAuthPage(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookieOptions: {
      name: COOKIE_NAME,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },

    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);

          response.cookies.set(name, value, {
            ...options,
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);

requestHeaders.set("x-pathname", pathname);

response = NextResponse.next({
  request: {
    headers: requestHeaders,
  },
});

  if (!user && isProtectedRoute(pathname)) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    next.searchParams.set("redirect", pathname);

    return NextResponse.redirect(next);
  }

  if (user && isAuthPage(pathname)) {
    const next = request.nextUrl.clone();
    next.pathname = "/";

    return NextResponse.redirect(next);
  }

  if (user && pathname.startsWith("/vendor")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "vendor") {
      const next = request.nextUrl.clone();
      next.pathname = "/";
      return NextResponse.redirect(next);
    }

    if (pathname === "/vendor/pending") {
      if (profile.status === "approved") {
        const next = request.nextUrl.clone();
        next.pathname = "/vendor/dashboard";
        return NextResponse.redirect(next);
      }

      return response;
    }

    if (profile.status !== "approved") {
      const next = request.nextUrl.clone();
      next.pathname = "/vendor/pending";
      return NextResponse.redirect(next);
    }
  }

  if (user && pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profile ||
      profile.role !== "admin" ||
      profile.status !== "active"
    ) {
      const next = request.nextUrl.clone();
      next.pathname = "/";
      return NextResponse.redirect(next);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};