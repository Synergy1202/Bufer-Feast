"use server";

import { verifiedCustomer } from "@/lib/server/auth";

export async function checkAuthStatus() {
  // This runs on the server, so it CAN see your secure httpOnly cookie
  const user = await verifiedCustomer();
  return !!user; // Returns true if logged in, false if not
}