
-- ============================================================================
-- COMPREHENSIVE SECURITY FIX: Convert to security_invoker view
-- ============================================================================
-- Problem: The current view uses SECURITY DEFINER (default), which bypasses
--          RLS and runs with the view owner's permissions.
--
-- Solution: 
-- 1. Add a SELECT policy allowing public access to approved/in_review rows
-- 2. Recreate the view with security_invoker=on
-- 3. The view filters COLUMNS (excludes PII), RLS filters ROWS
-- ============================================================================

-- Step 1: Drop the existing security definer view
DROP VIEW IF EXISTS public.bicycle_submissions_public;

-- Step 2: Add a SELECT policy for public access to approved submissions
-- This policy allows anon/authenticated users to SELECT approved/in_review rows
-- IMPORTANT: This only controls ROW access, not COLUMN access
CREATE POLICY "Public can view approved submissions"
ON public.bicycle_submissions
FOR SELECT
TO anon, authenticated
USING (status IN ('approved'::submission_status, 'in_review'::submission_status));

-- Step 3: Recreate the view WITH security_invoker
-- This view will respect the caller's RLS permissions
-- The view controls COLUMN access by explicitly listing only safe columns
CREATE VIEW public.bicycle_submissions_public
WITH (security_invoker = on) AS
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
FROM public.bicycle_submissions
WHERE status IN ('approved', 'in_review');

-- Step 4: Grant SELECT on the view to public roles
GRANT SELECT ON public.bicycle_submissions_public TO anon;
GRANT SELECT ON public.bicycle_submissions_public TO authenticated;

-- Step 5: Document the security design
COMMENT ON VIEW public.bicycle_submissions_public IS 
'Public-safe view using security_invoker. Row access controlled by RLS policy 
"Public can view approved submissions". Column access controlled by view 
definition (excludes email, phone, existing_spaces_count). Admins retain full 
access to all columns via "Admins can view all submissions" policy.';
