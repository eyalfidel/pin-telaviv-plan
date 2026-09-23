-- Full, permanent log of every signup and its current review status, for
-- the admin management screen. auth.users.created_at is already an
-- immutable record of every registration - no need for a separate log
-- table/trigger, just a read-only view over it plus the current role.
--
-- A user can end up with two rows in user_roles (e.g. rejected first via
-- reject_pending_user, later promoted via add_admin_by_email/
-- approve_pending_user) - pick 'admin' over 'user' when both exist.

CREATE OR REPLACE FUNCTION public.list_all_registrations()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list registrations';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.created_at,
    (
      SELECT ur.role::text
      FROM public.user_roles ur
      WHERE ur.user_id = au.id
      ORDER BY CASE ur.role WHEN 'admin' THEN 0 ELSE 1 END
      LIMIT 1
    ) AS role
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_all_registrations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_all_registrations() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_all_registrations() TO authenticated;
