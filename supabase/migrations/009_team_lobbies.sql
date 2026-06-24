-- Migration 009: Team lobbies for solo players

ALTER TABLE game_types ADD COLUMN IF NOT EXISTS team_size INT NOT NULL DEFAULT 1;
UPDATE game_types SET team_size = 2 WHERE name = 'beer_pong';
UPDATE game_types SET team_size = 3 WHERE name = 'flunky_ball';

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS team_size         INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_challenger  INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_opponent    INT NOT NULL DEFAULT 0;

CREATE TABLE match_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  UUID        NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id),
  team      TEXT        NOT NULL CHECK (team IN ('challenger','opponent')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

ALTER TABLE match_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_members_select" ON match_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "match_members_insert" ON match_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND match_id IN (
      SELECT id FROM matches WHERE status IN ('open','active')
    )
  );

CREATE OR REPLACE FUNCTION auto_activate_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_team_size    int;
  v_match_status text;
  v_slots_c      int;
  v_slots_o      int;
BEGIN
  SELECT team_size, status INTO v_team_size, v_match_status
  FROM matches WHERE id = NEW.match_id;

  IF v_match_status <> 'open' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_slots_c FROM match_members
  WHERE match_id = NEW.match_id AND team = 'challenger';

  SELECT COUNT(*) INTO v_slots_o FROM match_members
  WHERE match_id = NEW.match_id AND team = 'opponent';

  UPDATE matches
  SET slots_challenger = v_slots_c, slots_opponent = v_slots_o
  WHERE id = NEW.match_id;

  IF v_slots_c >= v_team_size AND v_slots_o >= v_team_size THEN
    UPDATE matches SET status = 'active' WHERE id = NEW.match_id AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER match_members_fill_check
AFTER INSERT ON match_members
FOR EACH ROW EXECUTE FUNCTION auto_activate_match();

DROP FUNCTION IF EXISTS nearby_open_matches(float, float, int);

CREATE OR REPLACE FUNCTION nearby_open_matches(user_lat float, user_lng float, radius_km int)
RETURNS TABLE (
  id uuid, game_type_name text, mode text,
  challenger_username text, distance_m float,
  lat float, lng float,
  team_size int, slots_challenger int, slots_opponent int
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    m.id,
    gt.name       AS game_type_name,
    m.mode,
    u.username    AS challenger_username,
    ST_Distance(m.location::geography, ST_Point(user_lng, user_lat)::geography) AS distance_m,
    ST_Y(m.location::geometry) AS lat,
    ST_X(m.location::geometry) AS lng,
    m.team_size,
    m.slots_challenger,
    m.slots_opponent
  FROM matches m
  JOIN game_types gt ON gt.id = m.game_type_id
  JOIN users u       ON u.id  = m.challenger_id
  WHERE m.status = 'open'
    AND m.location IS NOT NULL
    AND ST_DWithin(
      m.location::geography,
      ST_Point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_m
  LIMIT 50;
$$;
