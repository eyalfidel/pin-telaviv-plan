DROP VIEW IF EXISTS public.bicycle_submissions_public;

CREATE VIEW public.bicycle_submissions_public AS
SELECT 
  id, latitude, longitude, address, parking_condition, points_of_interest,
  other_poi_text, comments, photo_url, reporter_name, status, 
  admin_response, admin_photo_url, created_at, updated_at
FROM public.bicycle_submissions
WHERE status != 'hidden'::submission_status;