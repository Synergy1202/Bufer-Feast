export const APPROVED_VENDOR_STATUSES = ["active", "approved"] as const;

export function isApprovedVendorStatus(status: string | null | undefined) {
  return status === "active" || status === "approved";
}
