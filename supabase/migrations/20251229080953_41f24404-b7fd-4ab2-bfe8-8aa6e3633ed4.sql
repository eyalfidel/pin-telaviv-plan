-- Add admin_response column to bicycle_submissions table
ALTER TABLE public.bicycle_submissions 
ADD COLUMN admin_response TEXT DEFAULT NULL;