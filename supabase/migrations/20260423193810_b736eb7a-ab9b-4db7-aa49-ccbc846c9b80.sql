
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','moderator')
  )
$$;

CREATE POLICY "anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "staff update any profile" ON public.profiles FOR UPDATE
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TAGS ============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags are public" ON public.tags FOR SELECT USING (true);
CREATE POLICY "auth users create tags" ON public.tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "staff delete tags" ON public.tags FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  text_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects are public" ON public.projects FOR SELECT USING (true);
CREATE POLICY "auth create projects" ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author update project" ON public.projects FOR UPDATE
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author or staff delete project" ON public.projects FOR DELETE
  USING (auth.uid() = author_id OR public.is_staff(auth.uid()));

-- ============ PROJECT TAGS ============
CREATE TABLE public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_tags public" ON public.project_tags FOR SELECT USING (true);
CREATE POLICY "author manages project_tags" ON public.project_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.author_id = auth.uid() OR public.is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.author_id = auth.uid()));

-- ============ COMMENTS ============
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "auth create comment" ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author update comment" ON public.comments FOR UPDATE
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "author or staff delete comment" ON public.comments FOR DELETE
  USING (auth.uid() = author_id OR public.is_staff(auth.uid()));

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  demo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applicant sees own" ON public.applications FOR SELECT
  USING (auth.uid() = applicant_id);
CREATE POLICY "project owner sees apps" ON public.applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.author_id = auth.uid()));
CREATE POLICY "staff sees apps" ON public.applications FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "auth create app" ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "applicant or staff delete app" ON public.applications FOR DELETE
  USING (auth.uid() = applicant_id OR public.is_staff(auth.uid()));

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth create report" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "staff view reports" ON public.reports FOR SELECT
  USING (public.is_staff(auth.uid()));
CREATE POLICY "reporter views own" ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff delete reports" ON public.reports FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES
  ('media','media',true),
  ('texts','texts',true),
  ('demos','demos',true),
  ('avatars','avatars',true);

CREATE POLICY "public read media" ON storage.objects FOR SELECT USING (bucket_id IN ('media','texts','demos','avatars'));
CREATE POLICY "auth upload media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('media','texts','demos','avatars') AND auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner update media" ON storage.objects FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner or staff delete media" ON storage.objects FOR DELETE
  USING (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()));

-- ============ INDEXES ============
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);
CREATE INDEX idx_projects_author ON public.projects(author_id);
CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_apps_project ON public.applications(project_id);
CREATE INDEX idx_project_tags_tag ON public.project_tags(tag_id);
