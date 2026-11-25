-- Columns the checkout, Paystack confirmation and order page already use but
-- the live orders table does not have. Without them:
--   * checkout fails when it saves the Shipbubble courier rate,
--   * payment confirmation fails when it records how the order was paid,
--   * the order page fails to load (it asks for shipbubble_tracking_url).
-- Only adds empty columns; existing orders are unchanged. Safe to run twice.
--
-- Customers still cannot edit orders: these columns are written by the
-- server (secret key) after it has checked the order belongs to the customer.

ALTER TABLE public.orders
  -- Courier chosen at checkout (from Shipbubble's rate list).
  ADD COLUMN IF NOT EXISTS shipbubble_service_code text,
  ADD COLUMN IF NOT EXISTS shipbubble_courier_id text,
  ADD COLUMN IF NOT EXISTS shipbubble_courier_name text,
  ADD COLUMN IF NOT EXISTS shipbubble_rate_amount numeric(12, 2),
  -- Shipment booked after payment.
  ADD COLUMN IF NOT EXISTS shipbubble_order_id text,
  ADD COLUMN IF NOT EXISTS shipbubble_tracking_url text,
  -- Payment details from Paystack.
  ADD COLUMN IF NOT EXISTS payment_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_channel text;

-- Signed-in users read orders column by column in this database; let the
-- customer and vendor of an order read the new columns (the row policy
-- "customer or vendor read order" still limits which orders they see).
GRANT SELECT (
  shipbubble_service_code,
  shipbubble_courier_id,
  shipbubble_courier_name,
  shipbubble_rate_amount,
  shipbubble_order_id,
  shipbubble_tracking_url,
  payment_paid_at,
  payment_channel
) ON public.orders TO authenticated;

-- Phase 2 added these to orders; make sure signed-in users can read them too.
GRANT SELECT (
  delivery_latitude,
  delivery_longitude,
  delivery_place_id,
  delivery_distance_km
) ON public.orders TO authenticated;

-- Payment confirmation looks orders up by their Paystack reference.
CREATE INDEX IF NOT EXISTS orders_payment_reference_idx
  ON public.orders (payment_reference)
  WHERE payment_reference IS NOT NULL;
