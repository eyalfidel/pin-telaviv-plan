-- ============================================================================
-- FIX: Remove direct public SELECT access to base table
-- ============================================================================
-- Problem: The "Public can view approved submissions" policy on bicycle_submissions
--          allows direct SELECT access to all columns including email/phone.
--
-- Solution: Drop this policy. Public access should ONLY be through the 
--           bicycle_submissions_public view which excludes PII columns.
--           The view uses security_invoker=on, so it will use the caller's
--           permissions - but we'll grant SELECT on the VIEW itself, not the table.
-- ============================================================================

-- Step 1: Drop the problematic public SELECT policy from the base table
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.bicycle_submissions;

-- Step 2: Create a security definer function for the view to use internally
-- This allows the view to access rows while denying direct table access
CREATE OR REPLACE FUNCTION public.get_public_submissions()
RETURNS SETOF public.bicycle_submissions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.bicycle_submissions
  WHERE status IN ('approved'::submission_status, 'in_review'::submission_status)
$$;

-- Step 3: Recreate the view using the function (bypasses need for direct table policy)
DROP VIEW IF EXISTS public.bicycle_submissions_public;

CREATE VIEW public.bicycle_submissions_public AS
SELECT 
  id,
  latitude,
  longitude,
  address,
  parking_condition,
  points_of_interest,
  other_poi_text,
  comments,
  photo_url,
  reporter_name,
  status,
  admin_response,
  created_at,
  updated_at
  -- EXCLUDED: email, phone, existing_spaces_count (PII)
FROM public.get_public_submissions();

-- Step 4: Grant SELECT on the view to public roles
GRANT SELECT ON public.bicycle_submissions_public TO anon;
GRANT SELECT ON public.bicycle_submissions_public TO authenticated;

-- Step 5: Document the security architecture
COMMENT ON VIEW public.bicycle_submissions_public IS 
'Public-safe view that uses a SECURITY DEFINER function internally. 
Row filtering: get_public_submissions() returns only approved/in_review rows.
Column filtering: View excludes email, phone, existing_spaces_count.
Direct table access: Only admins via "Admins can view all submissions" policy.';