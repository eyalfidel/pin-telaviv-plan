-- Drop the old policy that only allows viewing approved submissions
DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.bicycle_submissions;

-- Create new policy that allows viewing all submissions except hidden ones
CREATE POLICY "Anyone can view non-hidden submissions" 
ON public.bicycle_submissions 
FOR SELECT 
USING (status != 'hidden'::submission_status);