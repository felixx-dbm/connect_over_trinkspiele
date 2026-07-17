-- Fix FK constraints so deleting a user cascades through all related tables.
-- Without this, adminClient.auth.admin.deleteUser() fails with FK violations.

-- matches: delete match when challenger leaves, nullify opponent slot
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_challenger_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_challenger_id_fkey
  FOREIGN KEY (challenger_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_opponent_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_opponent_id_fkey
  FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_direct_opponent_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_direct_opponent_id_fkey
  FOREIGN KEY (direct_opponent_id) REFERENCES users(id) ON DELETE SET NULL;

-- match_members: cascade when user or match is deleted
ALTER TABLE match_members DROP CONSTRAINT IF EXISTS match_members_user_id_fkey;
ALTER TABLE match_members ADD CONSTRAINT match_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- crews: delete crew when captain deletes account
ALTER TABLE crews DROP CONSTRAINT IF EXISTS crews_captain_id_fkey;
ALTER TABLE crews ADD CONSTRAINT crews_captain_id_fkey
  FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE;

-- crew_members: cascade when user or crew is deleted
ALTER TABLE crew_members DROP CONSTRAINT IF EXISTS crew_members_user_id_fkey;
ALTER TABLE crew_members ADD CONSTRAINT crew_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE crew_members DROP CONSTRAINT IF EXISTS crew_members_crew_id_fkey;
ALTER TABLE crew_members ADD CONSTRAINT crew_members_crew_id_fkey
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE;

-- crew_matches: cascade when creator leaves, nullify acceptor
ALTER TABLE crew_matches DROP CONSTRAINT IF EXISTS crew_matches_created_by_fkey;
ALTER TABLE crew_matches ADD CONSTRAINT crew_matches_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE crew_matches DROP CONSTRAINT IF EXISTS crew_matches_accepted_by_fkey;
ALTER TABLE crew_matches ADD CONSTRAINT crew_matches_accepted_by_fkey
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;

-- crew_match_participants: cascade when user or crew is deleted
ALTER TABLE crew_match_participants DROP CONSTRAINT IF EXISTS crew_match_participants_user_id_fkey;
ALTER TABLE crew_match_participants ADD CONSTRAINT crew_match_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE crew_match_participants DROP CONSTRAINT IF EXISTS crew_match_participants_crew_id_fkey;
ALTER TABLE crew_match_participants ADD CONSTRAINT crew_match_participants_crew_id_fkey
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE CASCADE;

-- event_members: cascade when user is deleted
ALTER TABLE event_members DROP CONSTRAINT IF EXISTS event_members_user_id_fkey;
ALTER TABLE event_members ADD CONSTRAINT event_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
