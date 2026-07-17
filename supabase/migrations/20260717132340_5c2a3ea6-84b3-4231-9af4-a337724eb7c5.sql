
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'review' BEFORE 'published';
-- newsletter_status already has pending/confirmed; add unsubscribed if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unsubscribed' AND enumtypid = 'public.newsletter_status'::regtype) THEN
    ALTER TYPE public.newsletter_status ADD VALUE 'unsubscribed';
  END IF;
END $$;
