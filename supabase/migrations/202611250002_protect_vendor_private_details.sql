-- Stop exposing kitchens' private details (bank account, ID numbers,
-- documents, exact coordinates, email, phone) to every signed-in user.
--
-- Before: the policy "public can browse approved vendor profiles" let anyone
-- signed in read every column of every approved vendor's profiles row.
-- After: the public reads kitchens only through public_vendor_profiles, which
-- shows the safe columns; profiles rows are readable only by their owner
-- (policy "read own profile") and the server's service role.
--
-- Run in the Supabase SQL Editor AFTER 202611250001_kitchen_delivery_areas.sql
-- and after deploying the matching code (the homepage, menu page and
-- delivery-rates route no longer read other users' profiles rows).

-- 0. Safety check. The view below reads profiles as its owner; that only
-- skips row level security when the view and the table have the same owner.
-- If they differ, stop here rather than empty the kitchens list.
DO $$
DECLARE
  view_owner name;
  table_owner name;
BEGIN
  SELECT pg_get_userbyid(relowner) INTO view_owner
  FROM pg_class WHERE oid = 'public.public_vendor_profiles'::regclass;

  SELECT pg_get_userbyid(relowner) INTO table_owner
  FROM pg_class WHERE oid = 'public.profiles'::regclass;

  IF view_owner IS DISTINCT FROM table_owner THEN
    RAISE EXCEPTION
      'public_vendor_profiles is owned by %, profiles by %. Nothing was changed; ask for help before continuing.',
      view_owner, table_owner;
  END IF;
END $$;

-- 1. The view reads with its owner's rights, so it no longer needs the broad
-- policy or column grants on profiles. It still only returns approved
-- vendors and only the columns in its definition.
ALTER VIEW public.public_vendor_profiles SET (security_invoker = false);
GRANT SELECT ON public.public_vendor_profiles TO anon, authenticated;

-- 2. Remove the policy that opened whole vendor rows to everyone.
DROP POLICY IF EXISTS "public can browse approved vendor profiles"
  ON public.profiles;

-- 3. Visitors who are not signed in never need the profiles table itself.
-- (Revoking on the table also removes their column-level grants.)
REVOKE ALL ON TABLE public.profiles FROM anon;

-- Check afterwards (both should return what you expect):
--   select count(*) from public.public_vendor_profiles;   -- your approved kitchens
--   select policyname from pg_policies
--   where schemaname = 'public' and tablename = 'profiles';
--   -- no "public can browse approved vendor profiles"
