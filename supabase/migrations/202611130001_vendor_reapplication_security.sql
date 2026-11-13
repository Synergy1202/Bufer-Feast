-- Vendor application history, controlled reapplication and privilege boundaries.
ALTER TABLE public.fernami_vendor_applications
  ADD COLUMN IF NOT EXISTS reapplication_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reapplication_allowed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS next_reapplication_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_email_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS rejection_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_email_error text;

CREATE TABLE IF NOT EXISTS public.fernami_vendor_application_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, attempt_number)
);

ALTER TABLE public.fernami_vendor_application_history ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.protect_vendor_application_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
BEGIN
  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'Vendor application history is read-only to client sessions';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS protect_vendor_application_history ON public.fernami_vendor_application_history;
CREATE TRIGGER protect_vendor_application_history
BEFORE INSERT OR UPDATE OR DELETE ON public.fernami_vendor_application_history
FOR EACH ROW EXECUTE FUNCTION public.protect_vendor_application_history();

CREATE INDEX IF NOT EXISTS fernami_vendor_application_history_user_idx
  ON public.fernami_vendor_application_history(user_id, attempt_number DESC);

INSERT INTO public.fernami_vendor_application_history
  (user_id, attempt_number, status, snapshot, submitted_at, reviewed_at, reviewed_by, rejection_reason)
SELECT user_id, 1, status, to_jsonb(app), submitted_at, reviewed_at, reviewed_by, rejection_reason
FROM public.fernami_vendor_applications AS app
ON CONFLICT (user_id, attempt_number) DO NOTHING;

UPDATE public.fernami_vendor_applications
SET next_reapplication_at = COALESCE(next_reapplication_at, reviewed_at + interval '7 days'),
    reapplication_allowed = COALESCE(reapplication_allowed, true)
WHERE status = 'rejected';

-- Authenticated users may edit permitted profile fields, but only trusted server-side
-- service-role operations may change account role or approval status.
CREATE OR REPLACE FUNCTION public.protect_profile_role_and_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role IS DISTINCT FROM 'customer' OR
         (NEW.status IS DISTINCT FROM 'pending' AND NEW.status IS DISTINCT FROM 'active') THEN
        RAISE EXCEPTION 'Only trusted server operations may create privileged or active profiles';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status OR
          NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR
          NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN
      RAISE EXCEPTION 'Only authorized server operations may change profile role or status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_and_status ON public.profiles;
CREATE TRIGGER protect_profile_role_and_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_and_status();

CREATE OR REPLACE FUNCTION public.protect_vendor_application_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Vendor applications must be created or deleted through the trusted server workflow';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR
       NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
       NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR
       NEW.reapplication_count IS DISTINCT FROM OLD.reapplication_count OR
       NEW.reapplication_allowed IS DISTINCT FROM OLD.reapplication_allowed OR
       NEW.next_reapplication_at IS DISTINCT FROM OLD.next_reapplication_at OR
       NEW.admin_notes IS DISTINCT FROM OLD.admin_notes OR
       NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason OR
       NEW.rejection_email_status IS DISTINCT FROM OLD.rejection_email_status OR
       NEW.rejection_email_sent_at IS DISTINCT FROM OLD.rejection_email_sent_at OR
       NEW.rejection_email_error IS DISTINCT FROM OLD.rejection_email_error THEN
      RAISE EXCEPTION 'Only authorized administrators may change vendor application review fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_vendor_application_review_fields ON public.fernami_vendor_applications;
CREATE TRIGGER protect_vendor_application_review_fields
BEFORE INSERT OR UPDATE OR DELETE ON public.fernami_vendor_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_vendor_application_review_fields();

-- Reapplication is serialized by locking the one current application row.
-- The server checks the verified user and invokes this function with the configured limits.
CREATE OR REPLACE FUNCTION public.reapply_vendor_application(
  p_user_id uuid,
  p_max_resubmissions integer,
  p_cooldown_days integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app public.fernami_vendor_applications%ROWTYPE;
  v_updated public.fernami_vendor_applications%ROWTYPE;
  v_next_allowed timestamptz;
BEGIN
  IF p_max_resubmissions < 0 OR p_cooldown_days < 0 THEN
    RAISE EXCEPTION 'Invalid reapplication policy';
  END IF;

  SELECT email_confirmed_at INTO v_email_confirmed_at FROM auth.users WHERE id = p_user_id;
  IF v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'The vendor must confirm the signup email before administrator review';
  END IF;

  SELECT * INTO v_app
  FROM public.fernami_vendor_applications
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_app.status <> 'rejected' THEN
    RAISE EXCEPTION 'Only rejected vendor applications may be resubmitted';
  END IF;

  IF v_app.reapplication_count >= p_max_resubmissions THEN
    RAISE EXCEPTION 'The permitted number of reapplications has been reached';
  END IF;

  v_next_allowed := COALESCE(
    v_app.reviewed_at + make_interval(days => p_cooldown_days),
    v_app.next_reapplication_at
  );

  IF v_next_allowed IS NOT NULL AND now() < v_next_allowed THEN
    RAISE EXCEPTION 'Reapplication is available after %', v_next_allowed;
  END IF;

  UPDATE public.fernami_vendor_applications
  SET status = 'pending_review',
      reapplication_count = reapplication_count + 1,
      reapplication_allowed = false,
      next_reapplication_at = NULL,
      rejection_reason = NULL,
      reviewed_at = NULL,
      reviewed_by = NULL,
      rejection_email_status = 'not_sent',
      rejection_email_sent_at = NULL,
      rejection_email_error = NULL,
      submitted_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_updated;

  UPDATE public.profiles
  SET status = 'pending',
      rejection_reason = NULL,
      is_open = false
  WHERE id = p_user_id AND role = 'vendor';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor profile is missing';
  END IF;

  INSERT INTO public.fernami_vendor_application_history
    (user_id, attempt_number, status, snapshot, submitted_at)
  VALUES
    (p_user_id, v_updated.reapplication_count + 1, 'pending_review', to_jsonb(v_updated), v_updated.submitted_at)
  ON CONFLICT (user_id, attempt_number) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.reapply_vendor_application(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reapply_vendor_application(uuid, integer, integer) TO service_role;

-- Approval/rejection is atomic: application, profile and history change together.
CREATE OR REPLACE FUNCTION public.review_vendor_application(
  p_user_id uuid,
  p_admin_id uuid,
  p_decision text,
  p_reason text,
  p_max_resubmissions integer,
  p_cooldown_days integer
)
RETURNS TABLE (
  email text,
  business_name text,
  reapplication_count integer,
  reapplication_allowed boolean,
  next_reapplication_at timestamptz,
  reviewed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
DECLARE
  v_app public.fernami_vendor_applications%ROWTYPE;
  v_admin public.profiles%ROWTYPE;
  v_email_confirmed_at timestamptz;
  v_now timestamptz := now();
  v_allowed boolean := false;
  v_next timestamptz := NULL;
BEGIN
  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid vendor review decision';
  END IF;
  IF p_max_resubmissions < 0 OR p_cooldown_days < 0 THEN
    RAISE EXCEPTION 'Invalid reapplication policy';
  END IF;
  IF p_decision = 'reject' AND length(btrim(COALESCE(p_reason, ''))) < 5 THEN
    RAISE EXCEPTION 'A rejection reason of at least five characters is required';
  END IF;

  SELECT * INTO v_admin FROM public.profiles WHERE id = p_admin_id;
  IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
    RAISE EXCEPTION 'An active administrator is required';
  END IF;

  SELECT * INTO v_app
  FROM public.fernami_vendor_applications
  WHERE user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_app.status NOT IN ('pending_review', 'pending') THEN
    RAISE EXCEPTION 'Only pending vendor applications can be reviewed';
  END IF;

  IF p_decision = 'approve' THEN
    UPDATE public.fernami_vendor_applications
    SET status = 'approved', reviewed_at = v_now, reviewed_by = p_admin_id,
        admin_notes = COALESCE(NULLIF(btrim(p_reason), ''), 'Application approved after administrator review.'),
        rejection_reason = NULL, suspension_reason = NULL
    WHERE user_id = p_user_id;

    UPDATE public.profiles
    SET role = 'vendor', status = 'active', is_open = false,
        rejection_reason = NULL, suspension_reason = NULL
    WHERE id = p_user_id AND role = 'vendor';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor profile is missing';
    END IF;

    UPDATE public.fernami_vendor_application_history
    SET status = 'approved', reviewed_at = v_now, reviewed_by = p_admin_id
    WHERE user_id = p_user_id AND attempt_number = v_app.reapplication_count + 1;
  ELSE
    v_allowed := v_app.reapplication_count < p_max_resubmissions;
    IF v_allowed THEN
      v_next := v_now + make_interval(days => p_cooldown_days);
    END IF;

    UPDATE public.fernami_vendor_applications
    SET status = 'rejected', reviewed_at = v_now, reviewed_by = p_admin_id,
        rejection_reason = btrim(p_reason), admin_notes = btrim(p_reason),
        suspension_reason = NULL, reapplication_allowed = v_allowed,
        next_reapplication_at = v_next, rejection_email_status = 'pending',
        rejection_email_sent_at = NULL, rejection_email_error = NULL
    WHERE user_id = p_user_id;

    UPDATE public.profiles
    SET role = 'vendor', status = 'rejected', is_open = false,
        rejection_reason = btrim(p_reason), suspension_reason = NULL
    WHERE id = p_user_id AND role = 'vendor';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vendor profile is missing';
    END IF;

    UPDATE public.fernami_vendor_application_history
    SET status = 'rejected', reviewed_at = v_now, reviewed_by = p_admin_id,
        rejection_reason = btrim(p_reason)
    WHERE user_id = p_user_id AND attempt_number = v_app.reapplication_count + 1;
  END IF;

  RETURN QUERY
  SELECT v_app.email, v_app.business_name, v_app.reapplication_count,
         v_allowed, v_next, v_now;
END;
$$;

REVOKE ALL ON FUNCTION public.review_vendor_application(uuid, uuid, text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_vendor_application(uuid, uuid, text, text, integer, integer) TO service_role;
