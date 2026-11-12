"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Database, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { PendingSave } from "@/components/pending-save";
import { QuoteLines, QuoteTotals } from "@/components/quote-summary";
import { kitchens, slots } from "@/lib/catalog";
import { randomHex, savePending, useShop } from "@/lib/client-store";
import { RequestError, errorText, requestJson } from "@/lib/api-client";
import { sendPending } from "@/lib/save-order";
import { useAuth } from "@/lib/auth-store";
import { customerSchema } from "@/lib/schema";
import { shiftDay } from "@/lib/format";
import type { Health, Quote, QuoteLine } from "@/lib/types";
type CheckoutFields = {
  name: string;
  phone: string;
  address: string;
  area: string | null;
  date: string | null;
  slot: string | null;
  ack: boolean;
};
export function CheckoutView({ today }: { today: string }) {
  const auth = useAuth();
  const shop = useShop(),
    router = useRouter();
  const kitchen = kitchens.find((k) => k.id === shop.cart[0]?.vendorId);
  const [health, setHealth] = useState<Health | null>(null),
    [connectionError, setConnectionError] = useState("");
  const [fields, setFields] = useState<CheckoutFields>({
    name: "",
    phone: "",
    address: "",
    area: null,
    date: null,
    slot: null,
    ack: false,
  });
  const [quote, setQuote] = useState<Quote | null>(null),
    [quoteMessage, setQuoteMessage] = useState(
      "Choose an area, date and time window to calculate the test total.",
    ),
    [error, setError] = useState(""),
    [invalid, setInvalid] = useState("");
  const [refresh, setRefresh] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const area =
    fields.area ??
    (kitchen?.areas.includes(shop.plan.area) ? shop.plan.area : "");
  const earliest = shiftDay(health?.today || today, kitchen?.leadDays || 1);
  const date = fields.date ?? (shop.plan.date || earliest);
  const slot = fields.slot ?? shop.plan.slot;
  const draftJSON = JSON.stringify({
    vendorId: kitchen?.id || "",
    items: shop.cart.map((line) => ({
      itemId: line.itemId,
      packIndex: line.packIndex,
      quantity: line.quantity,
    })),
    area,
    date,
    slot,
  });
  useEffect(() => {
    let active = true;
    requestJson<Health>("/api/health")
      .then((result) => {
        if (active) {
          setHealth(result);
          setConnectionError("");
        }
      })
      .catch((reason) => {
        if (active) {
          setHealth(null);
          setConnectionError(errorText(reason));
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setQuote(null);
    if (!health || !kitchen || !area || !date || !slot || shop.pending) {
      setQuoteMessage(
        "Choose an area, date and time window to calculate the test total.",
      );
      return;
    }
    setQuoteMessage("Checking prices and availability rules with the server…");
    const timer = setTimeout(() => {
      requestJson<{ quote: Quote }>(`/api/quote?revision=${refresh}`, {
        method: "POST",
        bodyJSON: draftJSON,
        signal: controller.signal,
      })
        .then((result) => {
          if (active) {
            setQuote(result.quote);
            setQuoteMessage(
              "The server calculated this test total. Complete your fictional details to save.",
            );
          }
        })
        .catch((reason) => {
          if (active) setQuoteMessage(errorText(reason));
        });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [health, kitchen, area, date, slot, draftJSON, shop.pending, refresh]);
  function update<K extends keyof CheckoutFields>(
    name: K,
    value: CheckoutFields[K],
  ) {
    if (["area", "date", "slot"].includes(name)) setQuote(null);
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
    setInvalid("");
  }
  function sample() {
    setQuote(null);
    setFields((current) => ({
      ...current,
      name: "Demo Customer",
      phone: "08000000000",
      address: "12 Example Street (fictional)",
      area: kitchen?.areas[0] || "",
      date: earliest,
      slot: "lunch",
    }));
    setError("");
    setInvalid("");
  }
  async function submit() {
    if (!quote || shop.submitting || auth.loading || auth.error) return;
    const checked = customerSchema.safeParse({
      name: fields.name,
      phone: fields.phone,
      address: fields.address,
    });
    if (!checked.success) {
      const issue = checked.error.issues[0],
        field = String(issue.path[0]);
      setError(
        field === "name"
          ? "Enter a fictional customer name of 2–80 characters."
          : field === "address"
            ? "Enter a fictional street address of 8–200 characters."
            : issue.message,
      );
      setInvalid(field);
      document.getElementById(`checkout-${field}`)?.focus();
      return;
    }
    if (!fields.ack) {
      setError(
        "Please acknowledge that this is a test order using fictional details.",
      );
      setInvalid("ack");
      document.getElementById("checkout-ack")?.focus();
      return;
    }
    const body = {
      ...JSON.parse(draftJSON),
      customer: checked.data,
      testAcknowledged: true,
      expectedTotal: quote.total,
      accountCheckout: !!auth.user,
      accountUserId: auth.user?.id ?? null,
    };
    const pending = {
      requestKey: randomHex(16),
      key: randomHex(32),
      bodyJSON: JSON.stringify(body),
    };
    savePending(pending);
    try {
      const order = await sendPending(pending);
      router.push(`/orders/${order.id}`);
    } catch (reason) {
      setError(errorText(reason));
      if (reason instanceof RequestError && reason.code === "TOTAL_CHANGED")
        setRefresh((value) => value + 1);
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  }
  if (!shop.ready)
    return (
      <div className="shell page-space" role="status">
        Loading your checkout…
      </div>
    );
  if (shop.pending)
    return (
      <div className="shell page-space">
        <PendingSave />
      </div>
    );
  if (!kitchen || !shop.cart.length)
    return (
      <div className="shell page-space">
        <EmptyState
          title="Choose something good first."
          description="Your basket is empty. Add a sample food pack to try the checkout."
        />
      </div>
    );
  const estimated: QuoteLine[] = shop.cart.flatMap((line) => {
    const item = kitchen.menu.find((i) => i.id === line.itemId),
      pack = item?.packs[line.packIndex];
    return item && pack
      ? [
          {
            itemId: item.id,
            name: item.name,
            packIndex: line.packIndex,
            pack: pack.label,
            quantity: line.quantity,
            unitPrice: pack.price,
            lineTotal: pack.price * line.quantity,
          },
        ]
      : [];
  });
  const displayed = quote?.items || estimated;
  return (
    <div className="shell page-space checkout-page">
      <Link href="/basket" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to basket
      </Link>
      <p className="eyebrow">CHECKOUT · FICTIONAL DETAILS ONLY</p>
      <h1 className="page-title">
        A little planning.
        <br />
        <em>A lighter week.</em>
      </h1>
      <p className="checkout-disclosure">
        This writes a <strong>test record to a database</strong>. No payment,
        kitchen notification or delivery happens. Do not enter real personal
        information.
      </p>
      <div
        className={`storage-status ${connectionError ? "storage-error" : ""}`}
        role="status"
      >
        <Database size={15} aria-hidden="true" />
        {connectionError ||
          (!health
            ? "Connecting to the Next.js order server…"
            : health.mode === "local-test"
              ? "Local SQLite test mode · Your Supabase project is not connected yet."
              : "Supabase PostgreSQL connected · Test orders only.")}
      </div>
      <div className="checkout-account-note">
        {auth.loading ? (
          "Checking account session…"
        ) : auth.error ? (
          <>
            <p role="alert">{auth.error}</p>
            <Link href="/login?next=/checkout">Sign in again</Link>
          </>
        ) : auth.user ? (
          <>
            Saving to <strong>{auth.user.email}</strong>. Only this account can
            view the record.
          </>
        ) : (
          <>
            Guest checkout: this browser keeps a private lookup key.{" "}
            <Link href="/login?next=/checkout">Log in</Link> to save new orders
            to your account.
          </>
        )}
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="checkout-grid">
          <div>
            <div className="details-heading">
              <h2>Delivery details</h2>
              <Button type="button" variant="link" onClick={sample}>
                Fill sample details
              </Button>
            </div>
            <div className="form-field">
              <Label htmlFor="checkout-name">Test customer name</Label>
              <Input
                id="checkout-name"
                autoComplete="off"
                value={fields.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={80}
                placeholder="Demo Customer"
                aria-invalid={invalid === "name"}
                aria-describedby="checkout-error"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="checkout-phone">Test phone number</Label>
              <Input
                id="checkout-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                value={fields.phone}
                onChange={(event) => update("phone", event.target.value)}
                maxLength={20}
                placeholder="08000000000"
                aria-invalid={invalid === "phone"}
                aria-describedby="phone-help checkout-error"
              />
              <small id="phone-help">
                Format check only. This number is not called or verified.
              </small>
            </div>
            <div className="form-field">
              <Label htmlFor="checkout-address">Fictional street address</Label>
              <textarea
                id="checkout-address"
                autoComplete="off"
                value={fields.address}
                onChange={(event) => update("address", event.target.value)}
                maxLength={200}
                rows={2}
                placeholder="12 Example Street (fictional)"
                aria-invalid={invalid === "address"}
                aria-describedby="checkout-error"
              />
            </div>
            <div className="form-two">
              <div className="form-field">
                <Label htmlFor="checkout-area">Demo delivery area</Label>
                <select
                  id="checkout-area"
                  value={area}
                  onChange={(event) => update("area", event.target.value)}
                >
                  <option value="">Choose an area</option>
                  {kitchen.areas.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <Label htmlFor="checkout-date">Preferred date</Label>
                <Input
                  id="checkout-date"
                  type="date"
                  value={date}
                  min={earliest}
                  max={shiftDay(health?.today || today, 30)}
                  onChange={(event) => update("date", event.target.value)}
                />
              </div>
            </div>
            <p className="muted-small">
              {kitchen.leadDays}-day preparation time in this demo. Addresses
              and kitchen availability are not verified.
            </p>
            <div className="form-field">
              <Label htmlFor="checkout-slot">Demo delivery window</Label>
              <select
                id="checkout-slot"
                value={slot}
                onChange={(event) => update("slot", event.target.value)}
              >
                <option value="">Choose a time window</option>
                {slots.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="test-ack">
              <input
                id="checkout-ack"
                type="checkbox"
                checked={fields.ack}
                onChange={(event) => update("ack", event.target.checked)}
                aria-invalid={invalid === "ack"}
                aria-describedby="checkout-error"
              />
              <span>
                I’m using fictional details. I understand that this creates a
                test record—not a paid or confirmed food delivery.
              </span>
            </label>
            <p
              ref={errorRef}
              id="checkout-error"
              tabIndex={-1}
              className="error-panel"
              role="alert"
              hidden={!error}
            >
              {error}
            </p>
          </div>
          <aside className="summary-panel">
            <p className="eyebrow">YOUR PRACTICE ORDER</p>
            <h2>{kitchen.name}</h2>
            <QuoteLines items={displayed} />
            <QuoteTotals
              food={
                quote?.foodSubtotal ||
                estimated.reduce((sum, line) => sum + line.lineTotal, 0)
              }
              delivery={quote?.deliveryFee}
              total={quote?.total}
            />
            <p className="quote-status" role="status">
              {quoteMessage}
            </p>
            <p className="muted-small">
              Sample food and delivery prices only. Tax and service-fee policies
              are not implemented. No money will be charged.
            </p>
            <Button
              type="button"
              size="lg"
              className="summary-action"
              disabled={
                !quote ||
                !health ||
                shop.submitting ||
                auth.loading ||
                !!auth.error
              }
              onClick={submit}
            >
              {shop.submitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                "Save test order"
              )}
              <ArrowRight aria-hidden="true" />
            </Button>
            <p className="muted-small">
              Only a successful server response creates a confirmation.
            </p>
          </aside>
        </div>
      </form>
    </div>
  );
}
