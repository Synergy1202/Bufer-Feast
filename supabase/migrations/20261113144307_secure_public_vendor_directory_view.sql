-- Keep the public vendor directory constrained by the caller's RLS policies.
GRANT SELECT (id, business_name, full_name, vendor_type, location, status, is_open, opening_hours, role)
ON TABLE public.profiles TO anon;

DROP POLICY IF EXISTS "public can browse approved vendor profiles" ON public.profiles;
CREATE POLICY "public can browse approved vendor profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (role = 'vendor' AND status IN ('active', 'approved'));

ALTER VIEW public.public_vendor_profiles SET (security_invoker = true);
