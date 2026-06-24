-- is_open_lobby: host manually starts instead of auto-activating when slots fill
-- custom_game_name: freestyle matches can have a custom display name
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS is_open_lobby    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS custom_game_name TEXT    CHECK (char_length(custom_game_name) <= 50);

-- Flunky Ball allows up to 10 per team in open lobby mode
UPDATE game_types SET team_size = 10 WHERE name = 'flunky_ball';

-- Update trigger: skip auto-activate for open lobby matches
CREATE OR REPLACE FUNCTION auto_activate_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_team_size     int;
  v_match_status  text;
  v_is_open_lobby bool;
  v_slots_c       int;
  v_slots_o       int;
BEGIN
  SELECT team_size, status, is_open_lobby
  INTO   v_team_size, v_match_status, v_is_open_lobby
  FROM   matches WHERE id = NEW.match_id;

  IF v_match_status <> 'open' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_slots_c FROM match_members
  WHERE match_id = NEW.match_id AND team = 'challenger';

  SELECT COUNT(*) INTO v_slots_o FROM match_members
  WHERE match_id = NEW.match_id AND team = 'opponent';

  UPDATE matches
  SET slots_challenger = v_slots_c,
      slots_opponent   = v_slots_o
  WHERE id = NEW.match_id;

  -- Open lobby matches: never auto-activate; host uses /start endpoint instead
  IF NOT v_is_open_lobby AND v_slots_c >= v_team_size AND v_slots_o >= v_team_size THEN
    UPDATE matches SET status = 'active' WHERE id = NEW.match_id AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$;
