-- Migration 021: Privilege hardening
--
-- RLS policies decide WHICH ROWS a role may touch. They do not decide WHICH
-- COLUMNS. Because the anon key ships to every browser, "you may update your
-- own row" was effectively "you may set your own wins, losses and birth_date".
-- This migration adds the missing column-level GRANTs, the missing WITH CHECK
-- clauses, and moves the 18+ gate into the database.
--
-- SECURITY DEFINER functions (submit_player_result, auto_resolve_match,
-- submit_crew_match_result, find_or_create_match) run as the function owner and
-- are unaffected by everything below — they remain the only way to write
-- wins/losses/status.

-- ─── 1. users: only profile + privacy columns are user-writable ──────────────
-- Closes: self-awarded wins/losses, birth_date rewriting (defeats the age gate),
-- and silently flipping other users' visibility columns.

REVOKE UPDATE ON public.users FROM authenticated, anon;

GRANT UPDATE (
  username,
  city,
  avatar_url,
  show_on_leaderboard,
  allow_direct_challenges,
  share_location
) ON public.users TO authenticated;

-- ─── 2. notifications: read receipts only, and never re-target a row ─────────
-- The old policy had USING but no WITH CHECK, so a user could PATCH their own
-- notification, set user_id to a victim, and rewrite title/body/url — the
-- notification bell navigates to that url on tap.

DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON public.notifications FROM authenticated, anon;
GRANT  UPDATE (read) ON public.notifications TO authenticated;

-- ─── 3. event_members: same missing WITH CHECK ──────────────────────────────

DROP POLICY IF EXISTS "event_members_update" ON event_members;

CREATE POLICY "event_members_update" ON event_members
  FOR UPDATE TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POST /api/events/join upserts on (event_id, user_id), and PostgREST's
-- ON CONFLICT DO UPDATE writes every supplied column — so all three need the
-- privilege. The new WITH CHECK above is what actually prevents a row from
-- being re-pointed at another user.
REVOKE UPDATE ON public.event_members FROM authenticated, anon;
GRANT  UPDATE (event_id, user_id, is_active) ON public.event_members TO authenticated;

-- ─── 4. matches / crew_matches: no direct UPDATE from the browser at all ─────
-- The accept policies gated the row but not the columns, so the UPDATE that
-- claimed opponent_id could also set status='completed' and winner_id=self.
-- Accepts now go through the API routes, which use the service_role client with
-- the same open/unclaimed guards. Nothing in the client bundle updates these
-- tables directly.

DROP POLICY IF EXISTS "matches_update_accept"      ON matches;
DROP POLICY IF EXISTS "crew_matches_update_accept" ON crew_matches;

REVOKE UPDATE ON public.matches      FROM authenticated, anon;
REVOKE UPDATE ON public.crew_matches FROM authenticated, anon;

-- ─── 5. 18+ enforcement in the signup trigger ───────────────────────────────
-- The age check lived only in the signUp() server action, but auth.signUp is
-- callable directly with the public anon key. Email signups must now carry a
-- birth_date and be 18+. OAuth providers do not supply a birth date, so those
-- rows are still created with NULL — see the note at the bottom of this file.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_birth_date date;
  v_provider   text;
BEGIN
  v_birth_date := NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date;
  v_provider   := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Email/password signups must prove they are 18+.
  IF v_provider = 'email' AND v_birth_date IS NULL THEN
    RAISE EXCEPTION 'birth_date_required';
  END IF;

  -- Whatever the provider, a supplied birth date must clear 18.
  IF v_birth_date IS NOT NULL
     AND v_birth_date > CURRENT_DATE - INTERVAL '18 years' THEN
    RAISE EXCEPTION 'under_18';
  END IF;

  INSERT INTO public.users (id, username, birth_date)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    v_birth_date
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- NOTE: OAuth (Google) users still land with birth_date NULL because the
-- provider does not release it, and nothing in the app collects it afterwards.
-- Closing that requires an onboarding step that blocks the app until a DOB is
-- supplied. Tracked separately — this migration does not address it.
