-- Migration 007: Crew Battles
-- Adds crew_matches + crew_match_participants tables, crew_wins counter,
-- two SECURITY DEFINER functions, and RLS policies.

-- ─── 1. Extend crews table ────────────────────────────────────────────────────

ALTER TABLE crews ADD COLUMN IF NOT EXISTS crew_wins INTEGER NOT NULL DEFAULT 0;

-- ─── 2. crew_matches ─────────────────────────────────────────────────────────

CREATE TABLE crew_matches (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type_id        UUID        NOT NULL REFERENCES game_types(id),
  status              TEXT        NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open','active','completed','cancelled')),
  challenger_crew_id  UUID        NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  opponent_crew_id    UUID        REFERENCES crews(id) ON DELETE SET NULL,
  winner_crew_id      UUID        REFERENCES crews(id) ON DELETE SET NULL,
  location            GEOGRAPHY(POINT,4326),
  join_code           TEXT        NOT NULL UNIQUE
    DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT || GEN_RANDOM_UUID()::TEXT), 1, 6)),
  created_by          UUID        NOT NULL REFERENCES users(id),
  accepted_by         UUID        REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ
);

-- ─── 3. crew_match_participants ───────────────────────────────────────────────

CREATE TABLE crew_match_participants (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_match_id  UUID        NOT NULL REFERENCES crew_matches(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES users(id),
  crew_id        UUID        NOT NULL REFERENCES crews(id),
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(crew_match_id, user_id)
);

-- ─── 4. Function: submit_crew_match_result ────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_crew_match_result(
  p_crew_match_id uuid,
  p_winner_crew_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loser_crew_id uuid;
BEGIN
  -- Atomic update; guard prevents double-submission
  UPDATE crew_matches
  SET
    status           = 'completed',
    winner_crew_id   = p_winner_crew_id,
    completed_at     = NOW()
  WHERE id             = p_crew_match_id
    AND status         = 'active'
    AND winner_crew_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'crew_match_not_updatable';
  END IF;

  -- Determine loser crew
  SELECT
    CASE
      WHEN challenger_crew_id = p_winner_crew_id THEN opponent_crew_id
      ELSE challenger_crew_id
    END
  INTO v_loser_crew_id
  FROM crew_matches
  WHERE id = p_crew_match_id;

  -- Increment crew-level win counter
  UPDATE crews SET crew_wins = crew_wins + 1
  WHERE id = p_winner_crew_id;

  -- Personal wins for participants in winning crew
  UPDATE users SET wins = wins + 1
  WHERE id IN (
    SELECT user_id FROM crew_match_participants
    WHERE crew_match_id = p_crew_match_id
      AND crew_id = p_winner_crew_id
  );

  -- Personal losses for participants in losing crew
  UPDATE users SET losses = losses + 1
  WHERE id IN (
    SELECT user_id FROM crew_match_participants
    WHERE crew_match_id = p_crew_match_id
      AND crew_id = v_loser_crew_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_crew_match_result(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION submit_crew_match_result(uuid, uuid) TO service_role;

-- ─── 5. Function: nearby_open_crew_matches ────────────────────────────────────

CREATE OR REPLACE FUNCTION nearby_open_crew_matches(
  user_lat float8,
  user_lng float8,
  radius_km int
)
RETURNS TABLE (
  id                  uuid,
  game_type_name      text,
  challenger_crew_name text,
  challenger_crew_id  uuid,
  distance_m          float8,
  lat                 float8,
  lng                 float8
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    cm.id,
    gt.name                                                            AS game_type_name,
    c.name                                                             AS challenger_crew_name,
    c.id                                                               AS challenger_crew_id,
    ST_Distance(
      cm.location::geography,
      ST_Point(user_lng, user_lat)::geography
    )                                                                  AS distance_m,
    ST_Y(cm.location::geometry)                                        AS lat,
    ST_X(cm.location::geometry)                                        AS lng
  FROM crew_matches cm
  JOIN game_types gt ON gt.id = cm.game_type_id
  JOIN crews      c  ON c.id  = cm.challenger_crew_id
  WHERE cm.status           = 'open'
    AND cm.location         IS NOT NULL
    AND cm.opponent_crew_id IS NULL
    AND ST_DWithin(
      cm.location::geography,
      ST_Point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_m
  LIMIT 50;
$$;

-- ─── 6. RLS: crew_matches ─────────────────────────────────────────────────────

ALTER TABLE crew_matches ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can see open matches or matches their crew is in
CREATE POLICY "crew_matches_select" ON crew_matches
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR status = 'active'
    OR challenger_crew_id IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
    OR opponent_crew_id IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
  );

-- Any crew member can post a challenge for their own crew
CREATE POLICY "crew_matches_insert" ON crew_matches
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND challenger_crew_id IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
  );

-- Accept: caller must be in a different crew; match must be open and unclaimed
CREATE POLICY "crew_matches_update_accept" ON crew_matches
  FOR UPDATE TO authenticated
  USING (
    status = 'open'
    AND opponent_crew_id IS NULL
    AND challenger_crew_id NOT IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    opponent_crew_id IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
  );

-- ─── 7. RLS: crew_match_participants ─────────────────────────────────────────

ALTER TABLE crew_match_participants ENABLE ROW LEVEL SECURITY;

-- Everyone can see who is participating (needed for lobby page)
CREATE POLICY "crew_match_participants_select" ON crew_match_participants
  FOR SELECT TO authenticated USING (true);

-- Users can only insert themselves, and only with their own crew_id
CREATE POLICY "crew_match_participants_insert" ON crew_match_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND crew_id IN (
      SELECT crew_id FROM crew_members WHERE user_id = auth.uid()
    )
  );
