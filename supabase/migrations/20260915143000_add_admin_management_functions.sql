-- Lets an existing admin manage other admins from within the app itself,
-- instead of needing direct Supabase dashboard/SQL access every time.
--
-- auth.users isn't readable by the anon/authenticated client directly, so
-- these go through SECURITY DEFINER. That bypasses table RLS entirely, so
-- each function enforces its own admin check explicitly in the body -
-- RLS on user_roles is not what's protecting this.

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list admins';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, au.email::text, ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_admin_by_email(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can add admins';
  END IF;

  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No user found with this email. They need to sign up at /auth first.';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove admins';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own admin access';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin';
END;
$$;

-- New functions get an implicit EXECUTE grant to PUBLIC, and Supabase
-- separately auto-grants anon/authenticated on new functions in the
-- public schema. Revoke both explicitly and grant only to authenticated -
-- the functions' own admin check would reject an anon caller anyway
-- (auth.uid() is null), but there's no reason to leave the grant open.
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_admin_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.remove_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_admin_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_admin(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin(uuid) TO authenticated;
