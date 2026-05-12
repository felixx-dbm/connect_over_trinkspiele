-- Enforce one crew per user at the DB level (prevents TOCTOU race in crew actions)
ALTER TABLE crew_members ADD CONSTRAINT crew_members_one_crew_per_user UNIQUE (user_id);
