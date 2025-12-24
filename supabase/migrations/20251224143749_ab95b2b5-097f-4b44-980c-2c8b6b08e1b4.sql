-- Create enum for submission status
CREATE TYPE public.submission_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'hidden');

-- Create enum for parking conditions
CREATE TYPE public.parking_condition AS ENUM ('existing_needs_more', 'none', 'nearby');

-- Create enum for points of interest
CREATE TYPE public.point_of_interest AS ENUM ('cultural', 'educational', 'health', 'commercial', 'transport', 'park', 'other');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create bicycle submissions table
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
    -- Private contact info (only visible to admins)
    email TEXT,
    phone TEXT,
    -- Status and metadata
    status submission_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.bicycle_submissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bicycle_submissions

-- Public can view approved submissions (without contact info - handled in query)
CREATE POLICY "Anyone can view approved submissions"
ON public.bicycle_submissions
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.bicycle_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert submissions (public form)
CREATE POLICY "Anyone can submit"
ON public.bicycle_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.bicycle_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.bicycle_submissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bicycle_submissions_updated_at
BEFORE UPDATE ON public.bicycle_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for submission photos
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-photos', 'submission-photos', true);

-- Storage policies for submission photos
CREATE POLICY "Anyone can upload submission photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'submission-photos');

CREATE POLICY "Anyone can view submission photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'submission-photos');

CREATE POLICY "Admins can delete submission photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'submission-photos' AND public.has_role(auth.uid(), 'admin'));