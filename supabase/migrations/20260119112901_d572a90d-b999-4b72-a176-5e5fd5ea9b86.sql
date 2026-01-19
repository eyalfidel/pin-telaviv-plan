-- Step 1: Create a public view that excludes sensitive PII columns
-- This view will be used by unauthenticated/public users
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
  -- Deliberately excluding: email, phone, existing_spaces_count
FROM public.bicycle_submissions
WHERE status <> 'hidden';

-- Step 2: Drop the old permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view non-hidden submissions" ON public.bicycle_submissions;

-- Step 3: Create a new restrictive policy - public users get NO direct access to the base table for SELECT
-- Only admins can SELECT from the base table directly (they already have a policy for this)
-- Public users must use the view instead

-- Note: The existing "Admins can view all submissions" policy already handles admin access
-- We don't need to create any new SELECT policy for the base table since:
-- - Admins already have access via their existing policy
-- - Public users should use the view, not the base table