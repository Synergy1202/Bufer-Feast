-- Restore the server-side profile writes required by customer and vendor registration.
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO service_role;

-- Trigger functions are implementation details, not public RPC endpoints.
REVOKE EXECUTE ON FUNCTION public.protect_vendor_application_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role_and_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_vendor_application_review_fields() FROM PUBLIC, anon, authenticated;
