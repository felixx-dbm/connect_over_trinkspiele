-- Migration 010: Events / Hotspot mode + Personal challenge QR

CREATE TABLE events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  join_code  TEXT        NOT NULL UNIQUE
    DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT || GEN_RANDOM_UUID()::TEXT), 1, 6)),
  created_by UUID        NOT NULL REFERENCES users(id),
  city       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE event_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id  UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id),
  is_active BOOLEAN     NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE OR REPLACE FUNCTION deactivate_other_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE event_members SET is_active = false
    WHERE user_id = NEW.user_id AND event_id <> NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER event_members_one_active
AFTER INSERT OR UPDATE OF is_active ON event_members
FOR EACH ROW WHEN (NEW.is_active = true)
EXECUTE FUNCTION deactivate_other_events();

ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "event_members_select" ON event_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_members_insert" ON event_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_members_update" ON event_members FOR UPDATE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE matches      ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE crew_matches ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE matches      ADD COLUMN IF NOT EXISTS direct_opponent_id UUID REFERENCES users(id);

DROP POLICY IF EXISTS "matches_select" ON matches;
CREATE POLICY "matches_select" ON matches
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR challenger_id      = auth.uid()
    OR opponent_id        = auth.uid()
    OR direct_opponent_id = auth.uid()
  );
