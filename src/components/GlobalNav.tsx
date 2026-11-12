import { authClient, sessionStatus } from "@/lib/server/auth";
import GlobalNavClient from "./GlobalNavClient";

export default async function GlobalNav() {
  const status = await sessionStatus();

  let role: "customer" | "vendor" | "admin" = "customer";
  let accountStatus: string | null = null;

  if (status.user) {
    const client = await authClient();

    const { data: profile } = await client
      .from("profiles")
      .select("role, status")
      .eq("id", status.user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      role = "admin";
      accountStatus = profile.status;
    } else if (profile?.role === "vendor") {
      role = "vendor";
      accountStatus = profile.status;
    }
  }

  return (
    <GlobalNavClient
      isLoggedIn={Boolean(status.user)}
      role={role}
      accountStatus={accountStatus}
    />
  );
}