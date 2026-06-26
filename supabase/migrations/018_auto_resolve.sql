-- Migration 018: 10-minute auto-resolve for stale results
-- When one side submits a result and the other doesn't respond within 10 minutes,
-- the submitted result is taken as truth.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_result_at TIMESTAMPTZ;

-- Re-create submit_player_result to record first_result_at
CREATE OR REPLACE FUNCTION submit_player_result(
  p_match_id uuid,
  p_user_id  uuid,
  p_result   text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenger_id     uuid;
  v_opponent_id       uuid;
  v_status            text;
  v_challenger_result text;
  v_opponent_result   text;
  v_winner_id         uuid;
  v_loser_id          uuid;
  v_disputed          boolean := false;
BEGIN
  IF p_result NOT IN ('win','loss') THEN
    RAISE EXCEPTION 'invalid_result';
  END IF;

  SELECT challenger_id, opponent_id, status, challenger_result, opponent_result
  INTO   v_challenger_id, v_opponent_id, v_status, v_challenger_result, v_opponent_result
  FROM   matches
  WHERE  id = p_match_id
  FOR UPDATE;

  IF NOT FOUND                                        THEN RAISE EXCEPTION 'match_not_found';   END IF;
  IF v_status <> 'active'                             THEN RAISE EXCEPTION 'match_not_active';  END IF;
  IF p_user_id <> v_challenger_id AND p_user_id <> v_opponent_id
                                                      THEN RAISE EXCEPTION 'not_participant';   END IF;

  IF p_user_id = v_challenger_id THEN
    IF v_challenger_result IS NOT NULL THEN RAISE EXCEPTION 'already_submitted'; END IF;
    UPDATE matches
    SET challenger_result = p_result,
        first_result_at   = COALESCE(first_result_at, now())
    WHERE id = p_match_id;
    v_challenger_result := p_result;
  ELSE
    IF v_opponent_result IS NOT NULL THEN RAISE EXCEPTION 'already_submitted'; END IF;
    UPDATE matches
    SET opponent_result = p_result,
        first_result_at = COALESCE(first_result_at, now())
    WHERE id = p_match_id;
    v_opponent_result := p_result;
  END IF;

  IF v_challenger_result IS NOT NULL AND v_opponent_result IS NOT NULL THEN
    IF v_challenger_result = 'win' AND v_opponent_result = 'loss' THEN
      v_winner_id := v_challenger_id; v_loser_id := v_opponent_id;
    ELSIF v_challenger_result = 'loss' AND v_opponent_result = 'win' THEN
      v_winner_id := v_opponent_id; v_loser_id := v_challenger_id;
    ELSE
      v_winner_id := v_challenger_id; v_loser_id := v_opponent_id;
      v_disputed  := true;
    END IF;

    UPDATE matches
    SET    status = 'completed', winner_id = v_winner_id,
           completed_at = now(), disputed = v_disputed
    WHERE  id = p_match_id;

    UPDATE users SET wins   = wins   + 1 WHERE id = v_winner_id;
    UPDATE users SET losses = losses + 1 WHERE id = v_loser_id;

    IF v_disputed THEN RETURN 'disputed'; END IF;
    RETURN 'completed';
  END IF;

  RETURN 'waiting';
END;
$$;

-- Auto-resolve: accept the submitted result as truth after 10 minutes
CREATE OR REPLACE FUNCTION auto_resolve_match(p_match_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenger_id     uuid;
  v_opponent_id       uuid;
  v_status            text;
  v_challenger_result text;
  v_opponent_result   text;
  v_first_result_at   timestamptz;
  v_winner_id         uuid;
  v_loser_id          uuid;
BEGIN
  SELECT challenger_id, opponent_id, status, challenger_result, opponent_result, first_result_at
  INTO   v_challenger_id, v_opponent_id, v_status, v_challenger_result, v_opponent_result, v_first_result_at
  FROM   matches
  WHERE  id = p_match_id
  FOR UPDATE;

  IF NOT FOUND                                        THEN RETURN 'not_found';    END IF;
  IF v_status <> 'active'                             THEN RETURN 'already_done'; END IF;
  IF v_first_result_at IS NULL                        THEN RETURN 'not_ready';    END IF;
  IF now() < v_first_result_at + INTERVAL '10 minutes' THEN RETURN 'not_ready';  END IF;
  IF v_challenger_result IS NOT NULL AND v_opponent_result IS NOT NULL
                                                      THEN RETURN 'already_done'; END IF;

  IF v_challenger_result IS NOT NULL THEN
    IF v_challenger_result = 'win' THEN
      v_winner_id := v_challenger_id; v_loser_id := v_opponent_id;
    ELSE
      v_winner_id := v_opponent_id; v_loser_id := v_challenger_id;
    END IF;
  ELSIF v_opponent_result IS NOT NULL THEN
    IF v_opponent_result = 'win' THEN
      v_winner_id := v_opponent_id; v_loser_id := v_challenger_id;
    ELSE
      v_winner_id := v_challenger_id; v_loser_id := v_opponent_id;
    END IF;
  ELSE
    RETURN 'not_ready';
  END IF;

  UPDATE matches
  SET status = 'completed', winner_id = v_winner_id, completed_at = now()
  WHERE id = p_match_id;

  UPDATE users SET wins   = wins   + 1 WHERE id = v_winner_id;
  UPDATE users SET losses = losses + 1 WHERE id = v_loser_id;

  RETURN 'resolved';
END;
$$;
