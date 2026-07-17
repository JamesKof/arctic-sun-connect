
-- Email events audit log
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,                    -- 'newsletter_confirm' | 'newsletter_welcome' | 'event_registration' | 'test' | 'other'
  recipient TEXT NOT NULL,
  subject TEXT,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | sent | delivered | bounced | complained | opened | clicked | delivery_delayed | failed
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_events_created_at_idx ON public.email_events (created_at DESC);
CREATE INDEX email_events_recipient_idx ON public.email_events (recipient);
CREATE INDEX email_events_status_idx ON public.email_events (status);
CREATE INDEX email_events_provider_message_id_idx ON public.email_events (provider_message_id);

GRANT SELECT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view email events"
  ON public.email_events FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER email_events_set_updated_at
  BEFORE UPDATE ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-grant admin to the institute inbox on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url');

  IF lower(coalesce(NEW.email, '')) = 'afropolarinstitute@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
