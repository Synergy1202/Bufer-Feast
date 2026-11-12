import "server-only";

import { adminClient } from "@/lib/server/admin";

export type AdminAuditAction =
  | "vendor_approved"
  | "vendor_rejected"
  | "vendor_suspended"
  | "vendor_document_viewed"
  | "customer_account_reviewed"
  | "order_reviewed"
  | "support_ticket_updated";

export async function recordAdminAudit(input: {
  adminUserId: string;
  action: AdminAuditAction;
  targetUserId?: string | null;
  targetApplicationUserId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = adminClient();

  const { error } = await admin
    .from("admin_audit_logs")
    .insert({
      admin_user_id: input.adminUserId,
      action: input.action,
      target_user_id: input.targetUserId || null,
      target_application_user_id:
        input.targetApplicationUserId || null,
      notes: input.notes || null,
      metadata: input.metadata || {},
    });

  if (error) {
    console.error(
      "Admin audit log error:",
      error.message,
    );

    throw new Error(
      "The admin action was completed, but the audit log could not be saved.",
    );
  }

  return {
    success: true,
  };
}