-- Migration 022: P1 integrity fixes
--
--   1. crews.deleted_at — the column leaveCrew() has always written to but that
--      no migration ever created.
--   2. Crew battle results now need confirmation from BOTH crews, mirroring the
--      solo submit_player_result flow, instead of letting one participant
--      declare their own crew the winner.
--   3. auto_resolve_match is SECURITY DEFINER and was callable by any
--      authenticated user against any match id.

-- ─── 1. Soft-delete column for crews ────────────────────────────────────────

ALTER TABLE crews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS crews_active ON crews(id) WHERE deleted_at IS NULL;

-- ─── 2. Dual-confirmation crew results ──────────────────────────────────────
-- Each side records the crew it says won. The match completes only once both
-- crews have spoken; if they contradict each other the challenger crew gets the
-- benefit of the doubt and the row is flagged, exactly as solo matches do.

ALTER TABLE crew_matches
  ADD COLUMN IF NOT EXISTS challenger_claim  UUID REFERENCES crews(id),
  ADD COLUMN IF NOT EXISTS opponent_claim    UUID REFERENCES crews(id),
  ADD COLUMN IF NOT EXISTS disputed          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_result_at   TIMESTAMPTZ;

-- Shared completion path used by both the dual-confirm and auto-resolve funcs.
CREATE OR REPLACE FUNCTION finalize_crew_match(
  p_crew_match_id  uuid,
  p_winner_crew_id uuid,
  p_disputed       boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loser_crew_id uuid;
BEGIN
  UPDATE crew_matches
  SET status         = 'completed',
      winner_crew_id = p_winner_crew_id,
      disputed       = p_disputed,
      completed_at   = NOW()
  WHERE id             = p_crew_match_id
    AND status         = 'active'
    AND winner_crew_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'crew_match_not_updatable';
  END IF;

  SELECT CASE
           WHEN challenger_crew_id = p_winner_crew_id THEN opponent_crew_id
           ELSE challenger_crew_id
         END
  INTO v_loser_crew_id
  FROM crew_matches
  WHERE id = p_crew_match_id;

  UPDATE crews SET crew_wins = crew_wins + 1
  WHERE id = p_winner_crew_id;

  UPDATE users SET wins = wins + 1
  WHERE id IN (
    SELECT user_id FROM crew_match_participants
    WHERE crew_match_id = p_crew_match_id AND crew_id = p_winner_crew_id
  );

  UPDATE users SET losses = losses + 1
  WHERE id IN (
    SELECT user_id FROM crew_match_participants
    WHERE crew_match_id = p_crew_match_id AND crew_id = v_loser_crew_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION finalize_crew_match(uuid, uuid, boolean) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION finalize_crew_match(uuid, uuid, boolean) TO service_role;

-- The old signature let a single caller name the winner outright.
DROP FUNCTION IF EXISTS submit_crew_match_result(uuid, uuid);

-- Returns 'waiting' | 'completed' | 'disputed'
CREATE OR REPLACE FUNCTION submit_crew_match_result(
  p_crew_match_id  uuid,
  p_user_id        uuid,
  p_winner_crew_id uuid
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status            text;
  v_challenger_crew   uuid;
  v_opponent_crew     uuid;
  v_challenger_claim  uuid;
  v_opponent_claim    uuid;
  v_caller_crew       uuid;
  v_winner            uuid;
  v_disputed          boolean := false;
BEGIN
  SELECT status, challenger_crew_id, opponent_crew_id, challenger_claim, opponent_claim
  INTO   v_status, v_challenger_crew, v_opponent_crew, v_challenger_claim, v_opponent_claim
  FROM   crew_matches
  WHERE  id = p_crew_match_id
  FOR UPDATE;

  IF NOT FOUND          THEN RAISE EXCEPTION 'crew_match_not_found';  END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'crew_match_not_active'; END IF;

  IF p_winner_crew_id <> v_challenger_crew AND p_winner_crew_id <> v_opponent_crew THEN
    RAISE EXCEPTION 'invalid_winner_crew';
  END IF;

  -- Which side is the caller reporting for?
  SELECT crew_id INTO v_caller_crew
  FROM   crew_match_participants
  WHERE  crew_match_id = p_crew_match_id AND user_id = p_user_id;

  IF v_caller_crew IS NULL THEN RAISE EXCEPTION 'not_participant'; END IF;

  IF v_caller_crew = v_challenger_crew THEN
    IF v_challenger_claim IS NOT NULL THEN RAISE EXCEPTION 'already_submitted'; END IF;
    UPDATE crew_matches
    SET challenger_claim = p_winner_crew_id,
        first_result_at  = COALESCE(first_result_at, NOW())
    WHERE id = p_crew_match_id;
    v_challenger_claim := p_winner_crew_id;
  ELSIF v_caller_crew = v_opponent_crew THEN
    IF v_opponent_claim IS NOT NULL THEN RAISE EXCEPTION 'already_submitted'; END IF;
    UPDATE crew_matches
    SET opponent_claim  = p_winner_crew_id,
        first_result_at = COALESCE(first_result_at, NOW())
    WHERE id = p_crew_match_id;
    v_opponent_claim := p_winner_crew_id;
  ELSE
    -- Participant row exists but for a crew no longer in this match.
    RAISE EXCEPTION 'not_participant';
  END IF;

  IF v_challenger_claim IS NOT NULL AND v_opponent_claim IS NOT NULL THEN
    IF v_challenger_claim = v_opponent_claim THEN
      v_winner := v_challenger_claim;
    ELSE
      -- Both crews claimed the win: challenger crew takes it, flagged disputed.
      v_winner   := v_challenger_crew;
      v_disputed := true;
    END IF;

    PERFORM finalize_crew_match(p_crew_match_id, v_winner, v_disputed);

    IF v_disputed THEN RETURN 'disputed'; END IF;
    RETURN 'completed';
  END IF;

  RETURN 'waiting';
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_crew_match_result(uuid, uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION submit_crew_match_result(uuid, uuid, uuid) TO service_role;

-- Auto-resolve after 10 minutes, so one crew going quiet can't strand a match.
-- Mirrors auto_resolve_match for solo battles.
CREATE OR REPLACE FUNCTION auto_resolve_crew_match(p_crew_match_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status           text;
  v_challenger_claim uuid;
  v_opponent_claim   uuid;
  v_first_result_at  timestamptz;
  v_winner           uuid;
BEGIN
  SELECT status, challenger_claim, opponent_claim, first_result_at
  INTO   v_status, v_challenger_claim, v_opponent_claim, v_first_result_at
  FROM   crew_matches
  WHERE  id = p_crew_match_id
  FOR UPDATE;

  IF NOT FOUND                                        THEN RETURN 'not_found';    END IF;
  IF v_status <> 'active'                             THEN RETURN 'already_done'; END IF;
  IF v_first_result_at IS NULL                        THEN RETURN 'not_ready';    END IF;
  IF NOW() < v_first_result_at + INTERVAL '10 minutes' THEN RETURN 'not_ready';   END IF;
  IF v_challenger_claim IS NOT NULL AND v_opponent_claim IS NOT NULL
                                                      THEN RETURN 'already_done'; END IF;

  v_winner := COALESCE(v_challenger_claim, v_opponent_claim);
  IF v_winner IS NULL THEN RETURN 'not_ready'; END IF;

  PERFORM finalize_crew_match(p_crew_match_id, v_winner, false);
  RETURN 'resolved';
END;
$$;

REVOKE EXECUTE ON FUNCTION auto_resolve_crew_match(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION auto_resolve_crew_match(uuid) TO service_role;

-- ─── 3. auto_resolve_match: participants only ───────────────────────────────
-- SECURITY DEFINER + no caller check meant any authenticated user could reach
-- this over PostgREST and force-close a stranger's match. The check reads
-- auth.uid() directly rather than trusting a parameter. A NULL uid means the
-- call came from service_role (or a future cron job), which is allowed.

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
  v_caller            uuid := auth.uid();
BEGIN
  SELECT challenger_id, opponent_id, status, challenger_result, opponent_result, first_result_at
  INTO   v_challenger_id, v_opponent_id, v_status, v_challenger_result, v_opponent_result, v_first_result_at
  FROM   matches
  WHERE  id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF v_caller IS NOT NULL
     AND v_caller <> v_challenger_id
     AND v_caller IS DISTINCT FROM v_opponent_id THEN
    RAISE EXCEPTION 'not_participant';
  END IF;

  IF v_status <> 'active'                             THEN RETURN 'already_done'; END IF;
  IF v_first_result_at IS NULL                        THEN RETURN 'not_ready';    END IF;
  IF NOW() < v_first_result_at + INTERVAL '10 minutes' THEN RETURN 'not_ready';   END IF;
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
  SET status = 'completed', winner_id = v_winner_id, completed_at = NOW()
  WHERE id = p_match_id;

  UPDATE users SET wins   = wins   + 1 WHERE id = v_winner_id;
  UPDATE users SET losses = losses + 1 WHERE id = v_loser_id;

  RETURN 'resolved';
END;
$$;
