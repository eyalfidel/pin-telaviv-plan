-- Per-admin display nickname, shown in logs (e.g. status history) instead
-- of their raw email. Decoupled from user_roles so it survives role
-- changes and isn't ambiguous if a user ever has more than one role row.
CREATE TABLE public.admin_nicknames (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_nicknames ENABLE ROW LEVEL SECURITY;
-- No client-facing RLS policies: only accessed through the SECURITY
-- DEFINER functions below, same as auth.users itself.

CREATE OR REPLACE FUNCTION public.set_admin_nickname(target_user_id uuid, new_nickname text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can set nicknames';
  END IF;

  IF new_nickname IS NULL OR btrim(new_nickname) = '' THEN
    DELETE FROM public.admin_nicknames WHERE user_id = target_user_id;
  ELSE
    INSERT INTO public.admin_nicknames (user_id, nickname, updated_at)
    VALUES (target_user_id, btrim(new_nickname), now())
    ON CONFLICT (user_id) DO UPDATE SET nickname = EXCLUDED.nickname, updated_at = now();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_admin_nickname(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_admin_nickname(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_admin_nickname(uuid, text) TO authenticated;

-- list_admins now also returns each admin's nickname. Return type is
-- changing, so this must be dropped and recreated rather than replaced.
DROP FUNCTION IF EXISTS public.list_admins();

CREATE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, nickname text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list admins';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, au.email::text, ur.created_at, an.nickname
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.admin_nicknames an ON an.user_id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_admins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- Resolves each status-history row's acting admin to their nickname (or
-- email if none is set) for display, instead of exposing a raw user id.
CREATE OR REPLACE FUNCTION public.list_submission_status_history(p_submission_id uuid)
RETURNS TABLE (
  old_status submission_status,
  new_status submission_status,
  changed_at timestamptz,
  changed_by_label text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view status history';
  END IF;

  RETURN QUERY
  SELECT
    h.old_status,
    h.new_status,
    h.changed_at,
    COALESCE(an.nickname, au.email::text) AS changed_by_label
  FROM public.submission_status_history h
  LEFT JOIN auth.users au ON au.id = h.changed_by
  LEFT JOIN public.admin_nicknames an ON an.user_id = h.changed_by
  WHERE h.submission_id = p_submission_id
  ORDER BY h.changed_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_submission_status_history(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_submission_status_history(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_submission_status_history(uuid) TO authenticated;
