"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PendingSave } from "@/components/pending-save";
import { useShop } from "@/lib/client-store";
import { useAuth, refreshAuth } from "@/lib/auth-store";
import { RequestError, errorText, requestJson } from "@/lib/api-client";
import { money, shortDate } from "@/lib/format";
import type { TestOrder } from "@/lib/types";
function OrderCard({ order }: { order: TestOrder }) {
  return (
    <article className="saved-order-card">
      <div>
        <span className="saved-status">
          {order.accountId ? "Account order" : "Guest record"} · test only
        </span>
        <h2>{order.vendorName}</h2>
        <p>
          {shortDate(order.date)} · {order.area}
        </p>
        <p className="order-reference-small">{order.id}</p>
      </div>
      <div className="saved-order-action">
        <strong>{money(order.total)}</strong>
        <Link
          className={buttonVariants({ variant: "secondary", size: "lg" })}
          href={`/orders/${order.id}`}
        >
          View record <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
export function SavedOrders() {
  const shop = useShop(),
    auth = useAuth();
  const [reload, setReload] = useState(0),
    [limit, setLimit] = useState(20);
  const [account, setAccount] = useState<{
    owner: string;
    orders: TestOrder[];
    error: string;
  }>({ owner: "", orders: [], error: "" });
  const [guest, setGuest] = useState<{
    scope: string;
    orders: TestOrder[];
    unavailable: number;
  }>({ scope: "", orders: [], unavailable: 0 });
  const userId = auth.user?.id || "";
  const scope = `${userId}:${reload}:${limit}:${shop.access.map((entry) => entry.id).join(",")}`;
  useEffect(() => {
    let active = true;
    if (auth.loading || !userId) return;
    requestJson<{ orders: TestOrder[] }>(`/api/account/orders?reload=${reload}`)
      .then((result) => {
        if (active)
          setAccount({
            owner: userId,
            orders: result.orders.filter((order) => order.accountId === userId),
            error: "",
          });
      })
      .catch((reason) => {
        if (active) {
          setAccount({ owner: userId, orders: [], error: errorText(reason) });
          if (reason instanceof RequestError && reason.status === 401)
            refreshAuth().catch(() => {});
        }
      });
    return () => {
      active = false;
    };
  }, [auth.loading, userId, reload]);
  useEffect(() => {
    let active = true;
    if (!shop.ready || auth.loading) return;
    Promise.all(
      shop.access.slice(0, limit).map(async (entry) => {
        try {
          return (
            await requestJson<{ order: TestOrder }>(
              `/api/orders/${entry.id}?reload=${reload}`,
              { headers: { Authorization: `Bearer ${entry.key}` } },
            )
          ).order;
        } catch {
          return null;
        }
      }),
    ).then((result) => {
      if (active)
        setGuest({
          scope,
          orders: result.filter(
            (order): order is TestOrder => !!order && !order.accountId,
          ),
          unavailable: result.filter((order) => !order).length,
        });
    });
    return () => {
      active = false;
    };
  }, [shop.ready, shop.access, auth.loading, scope, limit, reload]);
  const accountVisible =
    !auth.loading && !auth.error && !!userId && account.owner === userId;
  const guestVisible = !auth.loading && guest.scope === scope;
  return (
    <div className="shell page-space narrow-page">
      <p className="eyebrow">YOUR RECORDS, KEPT TOGETHER</p>
      <h1 className="page-title">Your test orders.</h1>
      <p className="page-intro">
        Account orders require the owner’s login. Guest records use the private
        keys saved by this browser. No real food purchases are made.
      </p>
      <PendingSave />
      <section
        className="history-section"
        aria-labelledby="account-orders-title"
      >
        <h2 id="account-orders-title">Account orders</h2>
        {auth.loading ? (
          <p role="status" className="loading-note">
            Verifying your session…
          </p>
        ) : auth.error ? (
          <p className="error-panel" role="alert">
            {auth.error}
          </p>
        ) : !auth.user ? (
          <div className="account-login-note">
            <p>
              Sign in to see orders saved to your customer account on this or
              another device.
            </p>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href="/login?next=/orders"
            >
              Log in
            </Link>
          </div>
        ) : !accountVisible ? (
          <p className="loading-note" role="status">
            Loading this account’s records…
          </p>
        ) : account.error ? (
          <p className="error-panel" role="alert">
            {account.error}
          </p>
        ) : account.orders.length ? (
          <div className="saved-order-list">
            {account.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <p className="muted-small">
            No account orders yet. Save a new test order while signed in, or
            explicitly link one of your guest records below.
          </p>
        )}
      </section>
      <section
        id="guest-orders"
        className="history-section"
        aria-labelledby="guest-orders-title"
      >
        <h2 id="guest-orders-title">Guest records in this browser</h2>
        {!shop.ready || !guestVisible ? (
          <p className="loading-note" role="status">
            Retrieving browser-key records…
          </p>
        ) : guest.orders.length ? (
          <div className="saved-order-list">
            {guest.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No guest records available here."
            description="A guest checkout keeps a private lookup key in the browser. Account orders are listed separately above."
          />
        )}
        {guestVisible && guest.unavailable > 0 && (
          <p className="muted-small">
            Some older browser references are unavailable. They may belong to
            another account, a previous local database, or a server that is not
            connected. No records have been deleted.
          </p>
        )}
      </section>
      <div className="history-actions">
        <Button
          variant="outline"
          onClick={() => {
            setReload((value) => value + 1);
            refreshAuth().catch(() => {});
          }}
        >
          <RefreshCcw aria-hidden="true" />
          Reload records
        </Button>
        {shop.access.length > limit && (
          <Button
            variant="link"
            onClick={() => setLimit((value) => value + 20)}
          >
            Show more guest references
          </Button>
        )}
      </div>
      <p className="muted-small">
        Guest records are never automatically attached to whichever account
        signs in on a shared computer.
      </p>
    </div>
  );
}
