import { timingSafeEqual } from "node:crypto";
import { AuthProblem } from "./problems";
import type { StoredOrder, TestOrder } from "@/lib/types";
export function sameSecretHash(a: unknown, b: unknown): boolean {
  return (
    typeof a === "string" &&
    typeof b === "string" &&
    a.length === b.length &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b))
  );
}
export function canReadOrder(
  row: StoredOrder,
  userId: string | null,
  accessHash: string | null,
): boolean {
  // Once linked to an account, the old browser key alone is NOT sufficient.
  if (row.customer_id) return userId === row.customer_id;
  return !!accessHash && sameSecretHash(row.access_hash, accessHash);
}
export function accountForDraft(
  draft: { accountCheckout?: boolean; accountUserId?: string | null },
  verifiedId: string | null,
): string | null {
  if (!draft.accountCheckout) return null; // Explicit guest intent; never auto-claim.
  if (!verifiedId)
    throw new AuthProblem(
      "Sign in to the original account, then retry this same account checkout.",
      401,
      "AUTH_REQUIRED",
    );
  if (!draft.accountUserId || draft.accountUserId !== verifiedId)
    throw new AuthProblem(
      "The signed-in account changed. Return to the original account before retrying this saved request.",
      409,
      "ACCOUNT_CHANGED",
    );
  return verifiedId;
}
export const publicOrder = (row: StoredOrder): TestOrder => ({
  ...row.payload,
  accountId: row.customer_id || null,
});
