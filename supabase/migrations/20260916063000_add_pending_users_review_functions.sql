-- "Pending" = someone who signed up (exists in auth.users) but has no
-- row in user_roles at all yet - neither 'admin' nor anything else.
-- Approve inserts an 'admin' row (matching this app's only real role).
-- Reject inserts a 'user' row - the existing, previously-unused 'user'
-- value in app_role - purely as a "reviewed, declined" marker, so a
-- rejected signup doesn't keep reappearing in the pending list. Nothing
-- in this app grants any capability to the 'user' role - a rejected
-- account stays exactly as powerless as before they signed up, it's just
-- no longer un-reviewed. This avoids ever needing to delete an auth user
-- (which would require the service-role key / an Edge Function) for a
-- purely administrative "no thanks" decision.

CREATE OR REPLACE FUNCTION public.list_pending_users()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list pending users';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text, au.created_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  WHERE ur.user_id IS NULL
  ORDER BY au.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_pending_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_pending_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_pending_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_pending_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_pending_user(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_pending_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_pending_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_pending_user(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.list_pending_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pending_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_pending_user(uuid) TO authenticated;
