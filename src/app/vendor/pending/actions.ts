"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedCustomer } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";

function policyNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function reapplyVendor() {
  const user = await verifiedCustomer();
  if (!user) redirect("/login");

  const admin = adminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profileError || !profile || profile.role !== "vendor" || profile.status !== "rejected") {
    redirect("/vendor/pending?error=This+account+is+not+eligible+to+reapply.");
  }

  const maxResubmissions = policyNumber(process.env.VENDOR_MAX_RESUBMISSIONS, 2);
  const cooldownDays = policyNumber(process.env.VENDOR_REAPPLICATION_COOLDOWN_DAYS, 7);
  const { error } = await admin.rpc("reapply_vendor_application", {
    p_user_id: user.id,
    p_max_resubmissions: maxResubmissions,
    p_cooldown_days: cooldownDays,
  });

  if (error) {
    console.error("[vendor-reapply] application resubmission failed", {
      code: error.code,
      message: error.message,
      userId: user.id,
    });
    const message = /available after/i.test(error.message)
      ? "Your reapplication cooldown has not ended yet."
      : /permitted number/i.test(error.message)
        ? "You have reached the reapplication limit."
        : "We could not resubmit your application. Please contact support.";
    redirect(`/vendor/pending?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/vendor/pending");
  revalidatePath("/admin");
  revalidatePath("/admin/vendor-applications");
  redirect("/vendor/pending?submitted=1");
}
