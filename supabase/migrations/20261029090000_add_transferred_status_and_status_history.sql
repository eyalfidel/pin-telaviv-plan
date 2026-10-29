-- New submission status "transferred to Shafa" (הועבר לשפ"ע), sitting between
-- in_review and approved/rejected in the review workflow.
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'transferred_to_shafa' AFTER 'in_review';

-- Per-submission status change history, so the admin dashboard can show when
-- a submission was received and every status it has passed through since.
-- Populated by a trigger rather than from the client, so it can't be missed
-- or spoofed regardless of which code path changes the status.
CREATE TABLE public.submission_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.bicycle_submissions(id) ON DELETE CASCADE,
  old_status submission_status,
  new_status submission_status NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_submission_status_history_submission_id
  ON public.submission_status_history(submission_id);

ALTER TABLE public.submission_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view status history"
ON public.submission_status_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Logs every status a submission is created with or moved to, whichever
-- client/code path makes the change (dashboard, future tooling, etc).
CREATE OR REPLACE FUNCTION public.log_submission_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.submission_status_history (submission_id, old_status, new_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.submission_status_history (submission_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_submission_status_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_submission_status_change() FROM anon;

CREATE TRIGGER trg_log_submission_status_change
AFTER INSERT OR UPDATE ON public.bicycle_submissions
FOR EACH ROW EXECUTE FUNCTION public.log_submission_status_change();

-- Backfill: the trigger only logs changes from here on, so give every
-- submission that already existed a starting history entry too, using its
-- creation time as the "received at" moment.
INSERT INTO public.submission_status_history (submission_id, old_status, new_status, changed_at, changed_by)
SELECT bs.id, NULL, bs.status, bs.created_at, NULL
FROM public.bicycle_submissions bs
WHERE NOT EXISTS (
  SELECT 1 FROM public.submission_status_history h WHERE h.submission_id = bs.id
);
