"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/client-store";
import { sendPending } from "@/lib/save-order";
export function PendingSave() {
  const auth = useAuth();
  const shop = useShop(),
    router = useRouter();
  if (!shop.pending) return null;
  let accountNeeded = false;
  try {
    const draft = JSON.parse(shop.pending.bodyJSON);
    accountNeeded =
      !!draft.accountCheckout && draft.accountUserId !== auth.user?.id;
  } catch {}
  async function retry() {
    if (!shop.pending) return;
    try {
      const order = await sendPending(shop.pending);
      router.push(`/orders/${order.id}`);
    } catch {}
  }
  return (
    <section className="pending-panel" aria-labelledby="pending-title">
      <p className="eyebrow">DUPLICATE-SAVE PROTECTION</p>
      <h2 id="pending-title">
        {shop.submitting
          ? "Saving your test order…"
          : "A previous save needs checking."}
      </h2>
      <p>
        {shop.submitting
          ? "Please wait for the server to confirm the database record. No payment is being taken."
          : "The response may have been interrupted after the database saved your order. Retry the identical request to retrieve or finish it—without creating a second order."}
      </p>
      {shop.submissionError && (
        <p className="error-panel" role="alert">
          {shop.submissionError}
        </p>
      )}
      <Button
        size="lg"
        disabled={shop.submitting || auth.loading || accountNeeded}
        onClick={retry}
      >
        {shop.submitting ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCcw aria-hidden="true" />
        )}
        {shop.submitting ? "Waiting for confirmation" : "Retry the same save"}
      </Button>
      {accountNeeded && (
        <p className="setup-note">
          This request belongs to the account used when checkout started.{" "}
          <Link href="/login?next=/checkout">Sign in to that account</Link>{" "}
          before retrying. If another account is signed in, sign out from My
          account first.
        </p>
      )}
      <p className="muted-small">
        This pending request is remembered for this browser session. Resolve it
        before starting another checkout.
      </p>
    </section>
  );
}
