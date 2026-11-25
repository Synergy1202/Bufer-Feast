// Approved vendors have been stored with two status values: the admin
// "approve" action sets "active", while older records and some checks use
// "approved". Treat both as approved everywhere (public_vendor_profiles and
// kitchen_distances in the database do the same).
export const APPROVED_VENDOR_STATUSES = ["active", "approved"] as const;

export function isApprovedVendorStatus(status: string | null | undefined) {
  return status === "active" || status === "approved";
}
