-- Phase 2 of the Google Maps work: "kitchens near you".
-- Run once in the Supabase SQL Editor before testing the updated site.
-- It only adds columns, a log table and a function; it does not change or
-- delete any existing customer, vendor or order data. Safe to run twice.

-- 1. Each kitchen's delivery radius (default 15 km).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS delivery_radius_km integer NOT NULL DEFAULT 15;

-- The vendor settings form already saves these two, but the live table does
-- not have them, so "Save All Changes" on /vendor/settings fails without them.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;

-- profiles uses column-by-column read permissions. Signed-in users read their
-- own row with select("*") (account page, vendor settings), which fails if
-- any column is not readable, so allow the three new ones.
GRANT SELECT (delivery_radius_km, bio, notify_email)
  ON public.profiles TO authenticated;

-- 2. Where each order is delivered to, and how far that was from the kitchen.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_longitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_place_id text,
  ADD COLUMN IF NOT EXISTS delivery_distance_km numeric(6, 1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_delivery_radius_km_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_delivery_radius_km_range
      CHECK (delivery_radius_km BETWEEN 1 AND 50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_latitude_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_location_latitude_range
      CHECK (location_latitude IS NULL OR location_latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_location_longitude_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_location_longitude_range
      CHECK (location_longitude IS NULL OR location_longitude BETWEEN -180 AND 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_delivery_latitude_range'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_delivery_latitude_range
      CHECK (delivery_latitude IS NULL OR delivery_latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_delivery_longitude_range'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_delivery_longitude_range
      CHECK (delivery_longitude IS NULL OR delivery_longitude BETWEEN -180 AND 180);
  END IF;
END $$;

-- 3. A log of every time a vendor moves their kitchen pin or changes their
-- delivery radius. Written only by the server (service role); a vendor can
-- read their own history.
CREATE TABLE IF NOT EXISTS public.vendor_location_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  old_location text,
  new_location text,
  old_latitude double precision,
  old_longitude double precision,
  new_latitude double precision,
  new_longitude double precision,
  old_radius_km integer,
  new_radius_km integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_location_changes_vendor_created_idx
  ON public.vendor_location_changes (vendor_id, created_at DESC);

ALTER TABLE public.vendor_location_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor reads own location changes"
  ON public.vendor_location_changes;
CREATE POLICY "vendor reads own location changes"
  ON public.vendor_location_changes
  FOR SELECT TO authenticated
  USING (vendor_id = (SELECT auth.uid()));

-- 4. Distance from a delivery point to every approved kitchen that has a pin.
-- Returns only a distance rounded to 100 m and whether the kitchen delivers
-- there; kitchen coordinates never leave the database.
-- Straight-line (haversine) distance, so it costs nothing to run.
CREATE OR REPLACE FUNCTION public.kitchen_distances(
  p_latitude double precision,
  p_longitude double precision,
  p_vendor_id uuid DEFAULT NULL
)
RETURNS TABLE (vendor_id uuid, distance_km numeric, delivers boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    round(d.km::numeric, 1),
    d.km <= p.delivery_radius_km
  FROM public.profiles AS p
  CROSS JOIN LATERAL (
    SELECT 6371 * 2 * asin(least(1, sqrt(
      power(sin(radians(p.location_latitude - p_latitude) / 2), 2) +
      cos(radians(p_latitude)) * cos(radians(p.location_latitude)) *
      power(sin(radians(p.location_longitude - p_longitude) / 2), 2)
    ))) AS km
  ) AS d
  WHERE p.role = 'vendor'
    AND p.status IN ('active', 'approved')
    AND p.location_latitude IS NOT NULL
    AND p.location_longitude IS NOT NULL
    AND (p_vendor_id IS NULL OR p.id = p_vendor_id)
    AND p_latitude BETWEEN -90 AND 90
    AND p_longitude BETWEEN -180 AND 180;
$$;

REVOKE ALL ON FUNCTION public.kitchen_distances(double precision, double precision, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kitchen_distances(double precision, double precision, uuid) TO anon, authenticated;
