"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "jie_bulk_order-customer-auth";

export async function logoutAction() {
  const jar = await cookies();
  
  // 1. Clear all related cookies (Auth cookie, code verifier, etc.)
  for (const cookie of jar.getAll()) {
    if (
      cookie.name === COOKIE_NAME ||
      cookie.name.startsWith(`${COOKIE_NAME}.`) ||
      cookie.name === `${COOKIE_NAME}-code-verifier`
    ) {
      jar.set(cookie.name, "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0, // This instantly deletes the cookie
      });
    }
  }

  // 2. Return success (DO NOT use redirect() here to avoid Next.js bugs)
  return { success: true };
}