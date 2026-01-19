
-- ============================================================================
-- SECURITY FIX: Proper public view for bicycle submissions
-- ============================================================================
-- Problem 1: The view was created with security_invoker=on, which means it 
--            inherits the caller's permissions. Since the base table only 
--            allows admin SELECT, public users can't query the view at all.
--
-- Problem 2: The view includes potentially sensitive fields and shows 
--            pending/rejected submissions that shouldn't be public.
--
-- Solution: Recreate the view WITHOUT security_invoker (uses definer's rights),
--           grant explicit SELECT to anon/authenticated, and filter to only
--           show approved/in_review submissions.
-- ============================================================================

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public.bicycle_submissions_public;

-- Step 2: Recreate the view WITHOUT security_invoker
-- This allows the view to execute with the owner's permissions,
-- bypassing the restrictive RLS on the base table
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
  -- Deliberately EXCLUDING: email, phone, existing_spaces_count (PII)
FROM public.bicycle_submissions
WHERE status IN ('approved', 'in_review');  
-- Only show approved/in_review submissions publicly
-- Pending, rejected, and hidden are kept private

-- Step 3: Grant SELECT permission on the view to public roles
-- This allows unauthenticated and authenticated users to query the view
GRANT SELECT ON public.bicycle_submissions_public TO anon;
GRANT SELECT ON public.bicycle_submissions_public TO authenticated;

-- Step 4: Add a comment documenting the security design
COMMENT ON VIEW public.bicycle_submissions_public IS 
'Public-safe view of bicycle submissions. Excludes PII columns (email, phone) 
and only shows approved/in_review submissions. Uses definer rights to bypass 
base table RLS while maintaining security through column/row filtering.';
