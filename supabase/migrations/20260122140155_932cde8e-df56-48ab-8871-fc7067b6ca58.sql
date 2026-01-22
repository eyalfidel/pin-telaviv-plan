-- Fix: Include 'pending' status in public view (was accidentally excluded)
-- The public map should show all statuses EXCEPT 'hidden'

CREATE OR REPLACE FUNCTION public.get_public_submissions()
RETURNS SETOF public.bicycle_submissions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.bicycle_submissions
  WHERE status != 'hidden'::submission_status
$$;

COMMENT ON FUNCTION public.get_public_submissions() IS 
'Returns all submissions except hidden ones for public display.
Security: SECURITY DEFINER allows access without direct table policies.';