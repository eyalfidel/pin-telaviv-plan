CREATE TABLE public.site_settings (
    id BOOLEAN PRIMARY KEY DEFAULT true,
    submissions_open BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT site_settings_singleton CHECK (id = true)
);

INSERT INTO public.site_settings (id, submissions_open) VALUES (true, true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Anyone can submit" ON public.bicycle_submissions;

CREATE POLICY "Anyone can submit while open"
ON public.bicycle_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (SELECT submissions_open FROM public.site_settings WHERE id = true)
);
