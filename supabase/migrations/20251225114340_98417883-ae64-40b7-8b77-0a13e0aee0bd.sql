-- Add reporter_name column to bicycle_submissions
ALTER TABLE public.bicycle_submissions 
ADD COLUMN reporter_name text;