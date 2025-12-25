-- Fix RLS policies - they need to be PERMISSIVE (not RESTRICTIVE) to work with OR logic
-- Drop existing restrictive policies and recreate as permissive

DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.bicycle_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.bicycle_submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.bicycle_submissions;
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.bicycle_submissions;
DROP POLICY IF EXISTS "Anyone can submit" ON public.bicycle_submissions;

-- Recreate as PERMISSIVE policies (default, uses OR logic)
CREATE POLICY "Anyone can view approved submissions" 
ON public.bicycle_submissions 
FOR SELECT 
USING (status = 'approved'::submission_status);

CREATE POLICY "Admins can view all submissions" 
ON public.bicycle_submissions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit" 
ON public.bicycle_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update submissions" 
ON public.bicycle_submissions 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions" 
ON public.bicycle_submissions 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));