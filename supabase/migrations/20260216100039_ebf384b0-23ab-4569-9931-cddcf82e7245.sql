-- Add admin response photo column
ALTER TABLE public.bicycle_submissions 
ADD COLUMN admin_photo_url text DEFAULT NULL;