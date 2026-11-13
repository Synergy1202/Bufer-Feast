"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";
import { recordAdminAudit } from "@/lib/server/audit";
import { sendVendorRejectionEmail } from "@/lib/server/resend";

function validateUserId(userId: string) {
  if (!userId || typeof userId !== "string") {
    throw new Error("A valid vendor user ID is required.");
  }
}

function policyNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function cleanReason(reason: string) {
  const value = reason.trim();

  if (!value) {
    throw new Error("A reason is required.");
  }

  if (value.length < 5) {
    throw new Error(
      "The reason must contain at least 5 characters.",
    );
  }

  if (value.length > 2000) {
    throw new Error(
      "The reason must not exceed 2,000 characters.",
    );
  }

  return value;
}

async function getApplication(userId: string) {
  validateUserId(userId);

  const admin = adminClient();

  const result = await admin
    .from("fernami_vendor_applications")
    .select(
      "user_id, email, business_name, status, reapplication_count",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(
      `Could not load vendor application: ${result.error.message}`,
    );
  }

  if (!result.data) {
    throw new Error("Vendor application not found.");
  }

  return result.data as unknown as {
    user_id: string;
    email: string | null;
    business_name: string | null;
    status: string | null;
    reapplication_count: number | null;
  };
}

function refreshAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/vendor-applications");
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/security");
  revalidatePath("/vendor/pending");
}

export async function approveVendor(userId: string, note = ""): Promise<void> {
  const adminUser = await requireAdmin();
  if (adminUser.id === userId) throw new Error("You cannot approve your own vendor application.");
  const application = await getApplication(userId);
  const admin = adminClient();
  const maxResubmissions = policyNumber(process.env.VENDOR_MAX_RESUBMISSIONS, 2);
  const cooldownDays = policyNumber(process.env.VENDOR_REAPPLICATION_COOLDOWN_DAYS, 7);
  const { error } = await admin.rpc("review_vendor_application", {
    p_user_id: userId,
    p_admin_id: adminUser.id,
    p_decision: "approve",
    p_reason: note.trim() || "Application approved after administrator review.",
    p_max_resubmissions: maxResubmissions,
    p_cooldown_days: cooldownDays,
  });
  if (error) {
    console.error("[vendor-review] approval failed", { code: error.code, message: error.message, userId });
    throw new Error("The vendor application could not be approved. Refresh and try again.");
  }
  await recordAdminAudit({
    adminUserId: adminUser.id,
    action: "vendor_approved",
    targetUserId: userId,
    targetApplicationUserId: userId,
    notes: note.trim() || "Vendor application approved.",
  });
  refreshAdminPages();
}

export async function rejectVendor(userId: string, reason: string): Promise<void> {
  const adminUser = await requireAdmin();
  const rejectionReason = cleanReason(reason);
  const application = await getApplication(userId);
  const admin = adminClient();
  const maxResubmissions = Math.max(0, Number.parseInt(process.env.VENDOR_MAX_RESUBMISSIONS || "2", 10) || 0);
  const cooldownDays = Math.max(0, Number.parseInt(process.env.VENDOR_REAPPLICATION_COOLDOWN_DAYS || "7", 10) || 0);

  const { data: reviewData, error: reviewError } = await admin.rpc("review_vendor_application", {
    p_user_id: userId,
    p_admin_id: adminUser.id,
    p_decision: "reject",
    p_reason: rejectionReason,
    p_max_resubmissions: maxResubmissions,
    p_cooldown_days: cooldownDays,
  });
  if (reviewError) {
    console.error("[vendor-review] rejection failed", { code: reviewError.code, message: reviewError.message, userId });
    throw new Error("The vendor application could not be rejected. Refresh and try again.");
  }
  const review = Array.isArray(reviewData) ? reviewData[0] : reviewData;
  const reapplicationAllowed = review?.reapplication_allowed === true;
  const nextReapplicationAt = review?.next_reapplication_at || null;
  const used = review?.reapplication_count ?? application.reapplication_count ?? 0;
  const reviewedAt = review?.reviewed_at || new Date().toISOString();

  await recordAdminAudit({
    adminUserId: adminUser.id,
    action: "vendor_rejected",
    targetUserId: userId,
    targetApplicationUserId: userId,
    notes: rejectionReason,
  });

  try {
    if (!application.email) throw new Error("The vendor application has no email address.");
    await sendVendorRejectionEmail({
      to: application.email,
      businessName: application.business_name || "your business",
      reason: rejectionReason,
      reapplicationAllowed,
      nextReapplicationAt,
      remainingAttempts: Math.max(0, maxResubmissions - used),
      idempotencyKey: "vendor-rejection-" + userId + "-" + new Date(reviewedAt).getTime(),
    });
    await admin.from("fernami_vendor_applications").update({
      rejection_email_status: "sent",
      rejection_email_sent_at: new Date().toISOString(),
      rejection_email_error: null,
    }).eq("user_id", userId).eq("status", "rejected");
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : "Unknown email error";
    console.error("[vendor-rejection-email] delivery failed", { userId, message });
    await admin.from("fernami_vendor_applications").update({
      rejection_email_status: "failed",
      rejection_email_error: message.slice(0, 500),
    }).eq("user_id", userId).eq("status", "rejected");
  }
  refreshAdminPages();
}

export async function retryVendorRejectionEmail(userId: string): Promise<void> {
  const adminUser = await requireAdmin();
  const admin = adminClient();
  const { data: application, error } = await admin.from("fernami_vendor_applications")
    .select("user_id,email,business_name,status,rejection_reason,reviewed_at,reapplication_count,reapplication_allowed,next_reapplication_at")
    .eq("user_id", userId).maybeSingle();
  if (error || !application || application.status !== "rejected" || !application.rejection_reason || !application.reviewed_at) {
    throw new Error("A rejected application with a saved reason is required before retrying its email.");
  }
  const maxResubmissions = Math.max(0, Number.parseInt(process.env.VENDOR_MAX_RESUBMISSIONS || "2", 10) || 0);
  const used = application.reapplication_count || 0;
  try {
    if (!application.email) throw new Error("The vendor application has no email address.");
    await sendVendorRejectionEmail({
      to: application.email,
      businessName: application.business_name || "your business",
      reason: application.rejection_reason,
      reapplicationAllowed: application.reapplication_allowed === true,
      nextReapplicationAt: application.next_reapplication_at,
      remainingAttempts: Math.max(0, maxResubmissions - used),
      idempotencyKey: "vendor-rejection-" + userId + "-" + new Date(application.reviewed_at).getTime(),
    });
    await admin.from("fernami_vendor_applications").update({
      rejection_email_status: "sent", rejection_email_sent_at: new Date().toISOString(), rejection_email_error: null,
    }).eq("user_id", userId).eq("status", "rejected");
    await recordAdminAudit({
      adminUserId: adminUser.id, action: "vendor_rejection_email_retried",
      targetUserId: userId, targetApplicationUserId: userId, notes: "Resent vendor rejection email.",
    });
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : "Unknown email error";
    await admin.from("fernami_vendor_applications").update({
      rejection_email_status: "failed", rejection_email_error: message.slice(0, 500),
    }).eq("user_id", userId).eq("status", "rejected");
    throw new Error("The rejection email could not be sent. Check the Resend configuration and try again.");
  }
  refreshAdminPages();
}

export async function suspendVendor(
  userId: string,
  reason: string,
): Promise<void> {
  const adminUser = await requireAdmin();
  const suspensionReason = cleanReason(reason);
  const application = await getApplication(userId);
  const admin = adminClient();
  const now = new Date().toISOString();

  if (
    application.status !== "approved"
  ) {
    throw new Error(
      "Only approved vendors can be suspended.",
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      status: "suspended",
      is_open: false,
      suspension_reason: suspensionReason,
    })
    .eq("id", userId)
    .eq("role", "vendor");

  if (profileError) {
    throw new Error(
      `Could not suspend vendor: ${profileError.message}`,
    );
  }

  const { error: applicationError } = await admin
    .from("fernami_vendor_applications")
    .update({
      reviewed_at: now,
      reviewed_by: adminUser.id,
      suspension_reason: suspensionReason,
      admin_notes: suspensionReason,
    })
    .eq("user_id", userId);

  if (applicationError) {
    throw new Error(
      `Could not save suspension reason: ${applicationError.message}`,
    );
  }

  await recordAdminAudit({
    adminUserId: adminUser.id,
    action: "vendor_suspended",
    targetUserId: userId,
    targetApplicationUserId: userId,
    notes: suspensionReason,
  });

  refreshAdminPages();
}