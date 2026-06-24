-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  url        TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_unread ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger: notify challenger when someone joins their match
CREATE OR REPLACE FUNCTION notify_match_joined()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenger_id UUID;
  v_joiner_name   TEXT;
  v_game_name     TEXT;
BEGIN
  SELECT m.challenger_id, gt.name
  INTO   v_challenger_id, v_game_name
  FROM   matches m
  JOIN   game_types gt ON gt.id = m.game_type_id
  WHERE  m.id = NEW.id;

  IF NEW.opponent_id IS NOT NULL
     AND OLD.opponent_id IS NULL
     AND NEW.opponent_id <> v_challenger_id THEN
    SELECT username INTO v_joiner_name FROM users WHERE id = NEW.opponent_id;
    INSERT INTO notifications(user_id, type, title, body, url)
    VALUES (
      v_challenger_id,
      'match_accepted',
      'Challenge accepted!',
      v_joiner_name || ' accepted your ' || replace(v_game_name, '_', ' ') || ' challenge.',
      '/matches/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_match_joined
  AFTER UPDATE OF opponent_id ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_match_joined();

-- Trigger: notify both players when a result is confirmed / disputed
CREATE OR REPLACE FUNCTION notify_match_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenger_name TEXT;
  v_opponent_name   TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    SELECT username INTO v_challenger_name FROM users WHERE id = NEW.challenger_id;
    SELECT username INTO v_opponent_name   FROM users WHERE id = NEW.opponent_id;

    IF NEW.challenger_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (NEW.challenger_id, 'result_confirmed', 'Result confirmed', 'Your match result has been recorded. 🍺', '/matches/' || NEW.id);
    END IF;
    IF NEW.opponent_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (NEW.opponent_id, 'result_confirmed', 'Your match result has been recorded. 🍺', 'Your match result has been recorded. 🍺', '/matches/' || NEW.id);
    END IF;
  END IF;

  IF NEW.disputed AND NOT OLD.disputed THEN
    IF NEW.challenger_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (NEW.challenger_id, 'result_disputed', 'Result disputed', 'Both sides claimed a win — challenger gets it.', '/matches/' || NEW.id);
    END IF;
    IF NEW.opponent_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (NEW.opponent_id, 'result_disputed', 'Result disputed', 'Both sides claimed a win — challenger gets it.', '/matches/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_match_result
  AFTER UPDATE OF status, disputed ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_match_result();

-- Trigger: notify when someone gets a direct challenge
CREATE OR REPLACE FUNCTION notify_direct_challenge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_challenger_name TEXT;
  v_game_name       TEXT;
BEGIN
  IF NEW.direct_opponent_id IS NOT NULL THEN
    SELECT username INTO v_challenger_name FROM users WHERE id = NEW.challenger_id;
    SELECT name    INTO v_game_name        FROM game_types WHERE id = NEW.game_type_id;
    INSERT INTO notifications(user_id, type, title, body, url)
    VALUES (
      NEW.direct_opponent_id,
      'direct_challenge',
      v_challenger_name || ' challenged you!',
      v_challenger_name || ' wants to play ' || replace(v_game_name, '_', ' ') || ' with you.',
      '/matches/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_direct_challenge
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_direct_challenge();

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  match_id         UUID        REFERENCES matches(id) ON DELETE SET NULL,
  reason           TEXT        NOT NULL CHECK (char_length(reason) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert" ON reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own" ON reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
