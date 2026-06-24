-- Migration 011: Achievements / Badges

CREATE TABLE user_achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  achievement TEXT        NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION award_achievements(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wins    int;
  v_losses  int;
  v_on_fire boolean := false;
BEGIN
  SELECT wins, losses INTO v_wins, v_losses FROM users WHERE id = p_user_id;

  SELECT (COUNT(*) = 3) INTO v_on_fire
  FROM (
    SELECT winner_id FROM matches
    WHERE (challenger_id = p_user_id OR opponent_id = p_user_id)
      AND status = 'completed'
    ORDER BY completed_at DESC NULLS LAST LIMIT 3
  ) sub WHERE winner_id = p_user_id;

  INSERT INTO user_achievements (user_id, achievement)
  SELECT p_user_id, a
  FROM (VALUES ('first_win'),('five_wins'),('loss_accepted'),('honest_10'),('legend_20'),('on_fire')) AS t(a)
  WHERE
    (a = 'first_win'     AND v_wins >= 1)  OR
    (a = 'five_wins'     AND v_wins >= 5)  OR
    (a = 'loss_accepted' AND v_losses >= 1) OR
    (a = 'honest_10'     AND v_losses >= 10) OR
    (a = 'legend_20'     AND v_wins + v_losses >= 20) OR
    (a = 'on_fire'       AND v_on_fire)
  ON CONFLICT (user_id, achievement) DO NOTHING;
END;
$$;
