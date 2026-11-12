"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { adminClient } from "@/lib/server/admin";
import { recordAdminAudit } from "@/lib/server/audit";

function validateUserId(userId: string) {
  if (!userId || typeof userId !== "string") {
    throw new Error("A valid vendor user ID is required.");
  }
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
      "user_id, email, business_name, status",
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
  };
}

function refreshAdminPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/vendor-applications");
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/security");
  revalidatePath("/vendor/pending");
}

export async function approveVendor(
  userId: string,
  note = "",
): Promise<void> {
  const adminUser = await requireAdmin();
  const application = await getApplication(userId);
  const admin = adminClient();
  const now = new Date().toISOString();

  const { error: applicationError } = await admin
    .from("fernami_vendor_applications")
    .update({
      status: "approved",
      reviewed_at: now,
      reviewed_by: adminUser.id,
      admin_notes:
        note.trim() ||
        "Application approved after administrator review.",
      rejection_reason: null,
      suspension_reason: null,
    })
    .eq("user_id", userId);

  if (applicationError) {
    throw new Error(
      `Could not approve application: ${applicationError.message}`,
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "vendor",
      status: "active",
      is_open: false,
      rejection_reason: null,
      suspension_reason: null,
    })
    .eq("id", userId)
    .eq("role", "vendor");

  if (profileError) {
    throw new Error(
      `Could not activate vendor profile: ${profileError.message}`,
    );
  }

  await recordAdminAudit({
    adminUserId: adminUser.id,
    action: "vendor_approved",
    targetUserId: userId,
    targetApplicationUserId: userId,
    notes:
      note.trim() ||
      "Vendor application approved.",
  });

  refreshAdminPages();
}

export async function rejectVendor(
  userId: string,
  reason: string,
): Promise<void> {
  const adminUser = await requireAdmin();
  const rejectionReason = cleanReason(reason);
  const application = await getApplication(userId);
  const admin = adminClient();
  const now = new Date().toISOString();

  const { error: applicationError } = await admin
    .from("fernami_vendor_applications")
    .update({
      status: "rejected",
      reviewed_at: now,
      reviewed_by: adminUser.id,
      rejection_reason: rejectionReason,
      admin_notes: rejectionReason,
      suspension_reason: null,
    })
    .eq("user_id", userId);

  if (applicationError) {
    throw new Error(
      `Could not reject application: ${applicationError.message}`,
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "vendor",
      status: "rejected",
      is_open: false,
      rejection_reason: rejectionReason,
      suspension_reason: null,
    })
    .eq("id", userId)
    .eq("role", "vendor");

  if (profileError) {
    throw new Error(
      `Could not update rejected vendor profile: ${profileError.message}`,
    );
  }

  await recordAdminAudit({
    adminUserId: adminUser.id,
    action: "vendor_rejected",
    targetUserId: userId,
    targetApplicationUserId: userId,
    notes: rejectionReason,
  });

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