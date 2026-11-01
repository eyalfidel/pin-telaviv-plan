-- Internal, team-only note per submission. Never exposed to the public:
-- bicycle_submissions_public selects an explicit column list that does not
-- include this column, and RLS already restricts full-row reads of
-- bicycle_submissions itself to admins.
ALTER TABLE public.bicycle_submissions ADD COLUMN internal_note text;
