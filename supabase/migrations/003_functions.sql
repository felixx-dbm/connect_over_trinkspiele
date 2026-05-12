-- Returns nearby open matches for the map view
CREATE OR REPLACE FUNCTION nearby_open_matches(user_lat float, user_lng float, radius_km int)
RETURNS TABLE (
  id uuid, game_type_name text, mode text,
  challenger_username text, distance_m float,
  lat float, lng float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    m.id,
    gt.name AS game_type_name,
    m.mode,
    u.username AS challenger_username,
    ST_Distance(m.location::geography, ST_Point(user_lng, user_lat)::geography) AS distance_m,
    ST_Y(m.location::geometry) AS lat,
    ST_X(m.location::geometry) AS lng
  FROM matches m
  JOIN game_types gt ON gt.id = m.game_type_id
  JOIN users u ON u.id = m.challenger_id
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

-- Returns nearby match queue entries for the map view
CREATE OR REPLACE FUNCTION nearby_queue_entries(user_lat float, user_lng float, radius_km int)
RETURNS TABLE (
  id uuid, game_type_name text,
  username text, distance_m float,
  lat float, lng float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    q.id,
    gt.name AS game_type_name,
    u.username,
    ST_Distance(q.location::geography, ST_Point(user_lng, user_lat)::geography) AS distance_m,
    ST_Y(q.location::geometry) AS lat,
    ST_X(q.location::geometry) AS lng
  FROM match_queue q
  JOIN game_types gt ON gt.id = q.game_type_id
  JOIN users u ON u.id = q.user_id
  WHERE q.location IS NOT NULL
    AND ST_DWithin(
      q.location::geography,
      ST_Point(user_lng, user_lat)::geography,
      radius_km * 1000
    )
  ORDER BY distance_m
  LIMIT 50;
$$;

-- Atomic proximity matchmaking with race-condition protection
CREATE OR REPLACE FUNCTION find_or_create_match(p_user_id uuid, p_game_type_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_opponent_id uuid;
  v_match_id    uuid;
  v_user_loc    geography;
  v_radius_km   int;
BEGIN
  -- Lock user's own row first to serialize concurrent matchmaking calls for the same user
  SELECT location, radius_km INTO v_user_loc, v_radius_km
  FROM match_queue WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Find nearest compatible opponent (skip locked prevents race conditions)
  SELECT q.user_id INTO v_opponent_id
  FROM match_queue q
  WHERE q.user_id <> p_user_id
    AND q.game_type_id = p_game_type_id
    AND (
      v_user_loc IS NULL OR q.location IS NULL
      OR ST_DWithin(
           v_user_loc,
           q.location,
           LEAST(v_radius_km, q.radius_km) * 1000
         )
    )
  ORDER BY
    CASE WHEN q.location IS NOT NULL AND v_user_loc IS NOT NULL
         THEN ST_Distance(v_user_loc, q.location)
         ELSE 999999 END
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_opponent_id IS NULL THEN RETURN NULL; END IF;

  -- Create match
  INSERT INTO matches (game_type_id, mode, status, challenger_id, opponent_id)
  VALUES (p_game_type_id, 'solo', 'active', p_user_id, v_opponent_id)
  RETURNING id INTO v_match_id;

  -- Remove both queue entries atomically
  DELETE FROM match_queue WHERE user_id IN (p_user_id, v_opponent_id);

  RETURN v_match_id;
END;
$$;

-- Atomic result submission: update match + increment win/loss counters
CREATE OR REPLACE FUNCTION submit_match_result(p_match_id uuid, p_winner_id uuid, p_loser_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE matches
  SET status = 'completed', winner_id = p_winner_id, completed_at = now()
  WHERE id = p_match_id AND status = 'active' AND winner_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'match_not_updatable';
  END IF;

  UPDATE users SET wins = wins + 1 WHERE id = p_winner_id;
  UPDATE users SET losses = losses + 1 WHERE id = p_loser_id;
END;
$$;
