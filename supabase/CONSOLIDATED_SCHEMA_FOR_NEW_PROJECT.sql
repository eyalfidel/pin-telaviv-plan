-- ============================================================
-- Consolidated schema for a NEW, self-owned Supabase project.
-- This is the *real* schema (reconstructed from the 14 real
-- migrations in this repo, collapsed to their final state) —
-- not a guess. It matches exactly what pin-telaviv-plan's code
-- expects: table/column/enum names, RLS behavior, the public
-- view, and the storage bucket for submission photos.
-- ============================================================

-- ---------- enums ----------
CREATE TYPE public.submission_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'hidden');
CREATE TYPE public.parking_condition AS ENUM ('existing_needs_more', 'none', 'nearby');
CREATE TYPE public.point_of_interest AS ENUM ('cultural', 'educational', 'health', 'commercial', 'transport', 'park', 'residential', 'other');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ---------- user_roles ----------
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- bicycle_submissions ----------
CREATE TABLE public.bicycle_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    parking_condition parking_condition NOT NULL,
    points_of_interest point_of_interest[] DEFAULT '{}',
    other_poi_text TEXT,
    comments TEXT,
    photo_url TEXT,
    email TEXT,
    phone TEXT,
    status submission_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reporter_name TEXT,
    admin_response TEXT DEFAULT NULL,
    existing_spaces_count INTEGER,
    admin_photo_url TEXT DEFAULT NULL
);
ALTER TABLE public.bicycle_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all submissions"
ON public.bicycle_submissions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit"
ON public.bicycle_submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update submissions"
ON public.bicycle_submissions FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete submissions"
ON public.bicycle_submissions FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bicycle_submissions_updated_at
BEFORE UPDATE ON public.bicycle_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- public view (no direct anon/public access to the base table) ----------
CREATE VIEW public.bicycle_submissions_public AS
SELECT
  id, latitude, longitude, address, parking_condition, points_of_interest,
  other_poi_text, comments, photo_url, reporter_name, status,
  admin_response, admin_photo_url, created_at, updated_at
FROM public.bicycle_submissions
WHERE status != 'hidden'::submission_status;

GRANT SELECT ON public.bicycle_submissions_public TO anon, authenticated;

-- ---------- storage: submission photos ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-photos', 'submission-photos', true);

CREATE POLICY "Anyone can upload submission photos"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'submission-photos');

CREATE POLICY "Anyone can view submission photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'submission-photos');

CREATE POLICY "Admins can delete submission photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'submission-photos' AND public.has_role(auth.uid(), 'admin'));
