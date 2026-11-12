-- Apply once to the existing Supabase database BEFORE testing the updated site.
-- This migration does not create or delete customer/vendor accounts.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_address_latitude double precision,
  ADD COLUMN IF NOT EXISTS primary_address_longitude double precision,
  ADD COLUMN IF NOT EXISTS primary_address_place_id text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_primary_address_latitude_range CHECK (primary_address_latitude IS NULL OR primary_address_latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT profiles_primary_address_longitude_range CHECK (primary_address_longitude IS NULL OR primary_address_longitude BETWEEN -180 AND 180);
