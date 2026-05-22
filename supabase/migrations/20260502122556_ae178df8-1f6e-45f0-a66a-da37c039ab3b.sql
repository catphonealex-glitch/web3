ALTER TABLE public.projects DROP CONSTRAINT projects_author_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT comments_author_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.applications DROP CONSTRAINT applications_applicant_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;