
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'member');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.resource_type AS ENUM ('report', 'brief', 'dataset', 'video', 'link');
CREATE TYPE public.newsletter_status AS ENUM ('pending', 'confirmed', 'unsubscribed');

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'));
$$;

-- Admins can manage roles
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- POSTS (magazine)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  reading_time INT NOT NULL DEFAULT 1,
  status public.content_status NOT NULL DEFAULT 'draft',
  issue_label TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(body,'')), 'C')
  ) STORED
);
CREATE INDEX posts_search_idx ON public.posts USING GIN (search);
CREATE INDEX posts_published_idx ON public.posts (published_at DESC) WHERE status = 'published';
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts public" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Staff view all posts" ON public.posts FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage posts" ON public.posts FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAGES
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  meta_description TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages public" ON public.pages FOR SELECT USING (status = 'published');
CREATE POLICY "Staff view all pages" ON public.pages FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage pages" ON public.pages FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FELLOWS
CREATE TABLE public.fellows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  region TEXT,
  bio TEXT,
  photo_url TEXT,
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fellows TO anon, authenticated;
GRANT ALL ON public.fellows TO service_role;
ALTER TABLE public.fellows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published fellows public" ON public.fellows FOR SELECT USING (status = 'published');
CREATE POLICY "Staff view all fellows" ON public.fellows FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage fellows" ON public.fellows FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_fellows_updated BEFORE UPDATE ON public.fellows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VENUES
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT ALL ON public.venues TO service_role;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues readable" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Staff manage venues" ON public.venues FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SPEAKERS
CREATE TABLE public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.speakers TO anon, authenticated;
GRANT ALL ON public.speakers TO service_role;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Speakers readable" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Staff manage speakers" ON public.speakers FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- SPONSORS
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sponsors TO anon, authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsors readable" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Staff manage sponsors" ON public.sponsors FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tag TEXT,
  description TEXT,
  cover_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  capacity INT,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_starts_idx ON public.events (starts_at);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published events public" ON public.events FOR SELECT USING (status = 'published');
CREATE POLICY "Staff view all events" ON public.events FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage events" ON public.events FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- EVENT_SPEAKERS
CREATE TABLE public.event_speakers (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES public.speakers(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (event_id, speaker_id)
);
GRANT SELECT ON public.event_speakers TO anon, authenticated;
GRANT ALL ON public.event_speakers TO service_role;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event speakers readable" ON public.event_speakers FOR SELECT USING (true);
CREATE POLICY "Staff manage event speakers" ON public.event_speakers FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- EVENT_SPONSORS
CREATE TABLE public.event_sponsors (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  tier TEXT,
  PRIMARY KEY (event_id, sponsor_id)
);
GRANT SELECT ON public.event_sponsors TO anon, authenticated;
GRANT ALL ON public.event_sponsors TO service_role;
ALTER TABLE public.event_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event sponsors readable" ON public.event_sponsors FOR SELECT USING (true);
CREATE POLICY "Staff manage event sponsors" ON public.event_sponsors FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- EVENT_REGISTRATIONS
CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);
GRANT INSERT ON public.event_registrations TO anon, authenticated;
GRANT SELECT ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register" ON public.event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own registrations" ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage registrations" ON public.event_registrations FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- RESOURCES
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type public.resource_type NOT NULL DEFAULT 'report',
  url TEXT,
  file_path TEXT,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published resources public" ON public.resources FOR SELECT USING (status = 'published');
CREATE POLICY "Staff view all resources" ON public.resources FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage resources" ON public.resources FOR ALL
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NEWSLETTER SUBSCRIBERS
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status public.newsletter_status NOT NULL DEFAULT 'pending',
  confirm_token TEXT UNIQUE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view subscribers" ON public.newsletter_subscribers FOR SELECT
  USING (public.is_staff(auth.uid()));
