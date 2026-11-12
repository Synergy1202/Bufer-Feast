-- Customer profile columns required by the customer signup and OTP recovery flow.
-- Safe for the development database: existing columns and records are preserved.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS primary_address text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_address_latitude double precision,
  ADD COLUMN IF NOT EXISTS primary_address_longitude double precision,
  ADD COLUMN IF NOT EXISTS primary_address_place_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_primary_address_latitude_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_primary_address_latitude_range
      CHECK (primary_address_latitude IS NULL OR primary_address_latitude BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_primary_address_longitude_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_primary_address_longitude_range
      CHECK (primary_address_longitude IS NULL OR primary_address_longitude BETWEEN -180 AND 180);
  END IF;
END $$;
