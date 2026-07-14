
-- Restrict SECURITY DEFINER helpers to server/service role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten event registration INSERT to require basic email shape and name length
DROP POLICY "Anyone can register" ON public.event_registrations;
CREATE POLICY "Anyone can register" ON public.event_registrations FOR INSERT
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status = 'published')
  );
