
begin;

-- projects(id) <- project_tags.project_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE c.conname = 'project_tags_project_id_fkey'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.project_tags
      ADD CONSTRAINT project_tags_project_id_fkey
      FOREIGN KEY (project_id)
      REFERENCES public.projects(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- tags(id) <- project_tags.tag_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class r ON r.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE c.conname = 'project_tags_tag_id_fkey'
      AND n.nspname = 'public'
  ) THEN
    ALTER TABLE public.project_tags
      ADD CONSTRAINT project_tags_tag_id_fkey
      FOREIGN KEY (tag_id)
      REFERENCES public.tags(id)
      ON DELETE CASCADE;
  END IF;
END $$;

commit;

