# Implementation Plan

This is a large, multi-system build. To ship it safely I'll break it into 4 phases, each independently deployable. Before starting I need a few decisions from you.

## Phase 1 — Foundation & Auth
- Enable Lovable Cloud (Supabase-backed).
- Auth: email/password + Google sign-in on `/auth`; `/reset-password` route.
- Roles table (`app_role` enum: `admin`, `editor`, `member`) with `has_role()` security-definer function.
- Protected `/admin` layout under `_authenticated/` gated by editor/admin role.
- Profiles table auto-created on signup.

## Phase 2 — CMS Admin Dashboard (`/admin`)
Content types, each with CRUD, draft/published status, slugs, RLS:
- **Pages** (about-style long-form)
- **Posts** (magazine articles: title, excerpt, body markdown, cover image, category, tags, author, reading time auto-calc)
- **Fellows** (name, role, region, bio, photo)
- **Events** (title, date, venue, description, capacity, sponsors[], speakers[])
- **Resources** (title, type, file/link, description)
- **Categories** (for posts)
- **Speakers**, **Venues**, **Sponsors** (linked to events)
Admin UI: sidebar nav, list tables with filters, form editors with image upload to Supabase Storage.

## Phase 3 — Public Magazine
Rebuild `/magazine`:
- Category filter chips, full-text search (Postgres `tsvector`).
- Infinite scroll (TanStack Query `useInfiniteQuery` + IntersectionObserver).
- Reading time badge, author byline, cover images.
- Article detail route `/magazine/$slug` with related articles (same category), bookmark button (per-user, stored in `bookmarks` table), newsletter CTA inline + at end.
- Bookmarks page `/bookmarks` for signed-in users.

## Phase 4 — Events + Newsletter
- Rebuild `/events` from DB; detail route `/events/$slug` with speakers, venue, sponsors.
- Registration form → `event_registrations` table → sends confirmation email.
- Newsletter form (site-wide footer + magazine CTAs): email + name, Zod validation, double opt-in (token emailed, `/newsletter/confirm?token=…` verifies).
- All email via **Lovable Emails** (built-in) — I recommend this over Resend since it's zero-config, has managed suppression/unsubscribe, and no extra API key. **If you specifically want Resend**, I'll wire the connector instead.

## Technical Notes
- Server functions (`createServerFn`) for all mutations; `requireSupabaseAuth` + role check for admin ops.
- Public reads (magazine list, event list) via server publishable client with narrow `TO anon` SELECT policies.
- Image uploads to Supabase Storage bucket `media` (public read, admin write).
- Search: Postgres `to_tsvector` GIN index on posts.
- Every new public table gets `GRANT`s + RLS + policies in one migration.

## Questions Before I Start

1. **Email provider**: Lovable Emails (recommended, built-in) or Resend (needs connector + your own domain in Resend)?
2. **Scope order**: Ship all 4 phases in one go (large, ~20+ files, will take multiple turns), or start with Phase 1+2 (auth + CMS) and iterate?
3. **Seed data**: Migrate the existing hardcoded fellows/events/articles into the DB as seed rows, or start empty and let you populate via the admin?
4. **Admin bootstrap**: How should the first admin be created — I can hardcode your email in the signup trigger to auto-grant `admin`, or you'll manually promote via SQL after first signup?
