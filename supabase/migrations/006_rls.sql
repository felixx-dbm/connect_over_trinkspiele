-- Enable Row Level Security on all application tables.
-- SECURITY DEFINER functions (find_or_create_match, submit_match_result,
-- nearby_open_matches, nearby_queue_entries) and the service_role used by
-- adminClient bypass RLS — policies only govern the anon/authenticated roles.

ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies so this migration is idempotent.
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users','game_types','matches','match_queue','crews','crew_members')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
CREATE POLICY "users_select"
  ON users FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT is handled exclusively by the handle_new_user trigger
-- (SECURITY DEFINER), so no INSERT policy is required.

-- ----------------------------------------------------------------
-- game_types  (read-only reference data)
-- ----------------------------------------------------------------
CREATE POLICY "game_types_select"
  ON game_types FOR SELECT TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- matches
-- ----------------------------------------------------------------
-- Participants always see their own matches; open matches are visible
-- to all authenticated users so anyone can accept a nearby challenge.
CREATE POLICY "matches_select"
  ON matches FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR auth.uid() = challenger_id
    OR auth.uid() = opponent_id
  );

-- Challenger posts a new open match from the browser client.
CREATE POLICY "matches_insert_challenger"
  ON matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

-- Any authenticated user (not the challenger) can accept an open match
-- by claiming opponent_id.  Cancel and result writes go through either
-- adminClient (service_role, bypasses RLS) or a SECURITY DEFINER RPC.
CREATE POLICY "matches_update_accept"
  ON matches FOR UPDATE TO authenticated
  USING  (status = 'open' AND opponent_id IS NULL AND auth.uid() != challenger_id)
  WITH CHECK (auth.uid() = opponent_id);

-- ----------------------------------------------------------------
-- match_queue
-- ----------------------------------------------------------------
CREATE POLICY "match_queue_select_own"
  ON match_queue FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "match_queue_insert_own"
  ON match_queue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Required for the upsert (INSERT … ON CONFLICT DO UPDATE) in the
-- matchmaking route.
CREATE POLICY "match_queue_update_own"
  ON match_queue FOR UPDATE TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "match_queue_delete_own"
  ON match_queue FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- crews
-- ----------------------------------------------------------------
CREATE POLICY "crews_select"
  ON crews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "crews_insert_captain"
  ON crews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "crews_update_captain"
  ON crews FOR UPDATE TO authenticated
  USING  (auth.uid() = captain_id)
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "crews_delete_captain"
  ON crews FOR DELETE TO authenticated
  USING (auth.uid() = captain_id);

-- ----------------------------------------------------------------
-- crew_members
-- ----------------------------------------------------------------
CREATE POLICY "crew_members_select"
  ON crew_members FOR SELECT TO authenticated
  USING (true);

-- Users insert themselves when creating or joining a crew.
CREATE POLICY "crew_members_insert_own"
  ON crew_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users remove themselves when leaving a crew.
CREATE POLICY "crew_members_delete_own"
  ON crew_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Restrict find_or_create_match to service_role only.
-- It locks rows across multiple users, so it must not be callable
-- by a regular authenticated user via the public API.
-- ----------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION find_or_create_match(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION find_or_create_match(uuid, uuid) TO service_role;
