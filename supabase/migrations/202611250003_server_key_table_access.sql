-- Give the server's secret (service_role) key its normal access to the app's
-- tables. In this database it could only read profiles; every other table
-- (menus, orders, order_items, saved_addresses, admin_audit_logs,
-- vendor_location_changes, ...) answered "permission denied", which breaks
-- the admin pages, payment confirmation and the kitchen-location log.
--
-- service_role is the key that stays on the server (SUPABASE_SECRET_KEY).
-- Supabase normally grants it everything; browsers never receive it.
-- This does not change what customers, vendors or visitors can see.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Tables and functions created later get the same access automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Let a signed-in vendor read their own location history (the row policy
-- "vendor reads own location changes" limits it to their own rows).
GRANT SELECT ON public.vendor_location_changes TO authenticated;
