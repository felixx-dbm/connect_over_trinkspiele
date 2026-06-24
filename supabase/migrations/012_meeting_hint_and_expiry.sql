-- meeting_hint: free-text landmark the challenger writes when posting
ALTER TABLE matches ADD COLUMN IF NOT EXISTS meeting_hint TEXT;

-- expires_at: set by trigger on insert (created_at + 6h)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE matches SET expires_at = created_at + INTERVAL '6 hours' WHERE expires_at IS NULL;

CREATE OR REPLACE FUNCTION set_match_expires_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '6 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_expires_at ON matches;
CREATE TRIGGER trg_match_expires_at
  BEFORE INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION set_match_expires_at();

CREATE OR REPLACE FUNCTION nearby_open_matches(
  user_lat  float8,
  user_lng  float8,
  radius_km int DEFAULT 10
)
RETURNS TABLE (
  id                  uuid,
  game_type_name      text,
  mode                text,
  challenger_username text,
  distance_m          float8,
  lat                 float8,
  lng                 float8,
  team_size           int,
  slots_challenger    int,
  slots_opponent      int
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    m.id,
    gt.name,
    m.mode,
    u.username,
    ST_Distance(
      m.location::geography,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ),
    ST_Y(m.location::geometry),
    ST_X(m.location::geometry),
    m.team_size,
    m.slots_challenger,
    m.slots_opponent
  FROM   matches    m
  JOIN   game_types gt ON gt.id = m.game_type_id
  JOIN   users      u  ON u.id  = m.challenger_id
  WHERE  m.status   = 'open'
  AND    m.location IS NOT NULL
  AND    (m.expires_at IS NULL OR m.expires_at > NOW())
  AND    ST_DWithin(
    m.location::geography,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY 5;
$$;

-- pg_cron hourly cleanup — only runs if pg_cron extension is enabled in Supabase dashboard
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cancel-expired-matches',
      '0 * * * *',
      'UPDATE matches SET status = ''cancelled'' WHERE status = ''open'' AND expires_at < NOW();'
    );
  END IF;
END;
$$;
