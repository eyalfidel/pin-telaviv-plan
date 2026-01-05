-- Add column to store existing spaces count
ALTER TABLE public.bicycle_submissions 
ADD COLUMN existing_spaces_count integer;