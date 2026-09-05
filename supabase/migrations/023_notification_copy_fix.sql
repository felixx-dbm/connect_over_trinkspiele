-- Migration 023: notification copy fix
--
-- notify_match_result built the opponent's row with the body text in the title
-- slot, so the notification bell rendered the same sentence twice — once bold as
-- a heading, once as the body. Only the opponent branch was affected; the
-- challenger branch was already correct.

CREATE OR REPLACE FUNCTION notify_match_result()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    IF NEW.challenger_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (
        NEW.challenger_id,
        'result_confirmed',
        'Result confirmed',
        'Your match result has been recorded. 🍺',
        '/matches/' || NEW.id
      );
    END IF;

    IF NEW.opponent_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (
        NEW.opponent_id,
        'result_confirmed',
        'Result confirmed',
        'Your match result has been recorded. 🍺',
        '/matches/' || NEW.id
      );
    END IF;
  END IF;

  IF NEW.disputed AND NOT OLD.disputed THEN
    IF NEW.challenger_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (
        NEW.challenger_id,
        'result_disputed',
        'Result disputed',
        'Both sides claimed a win — challenger gets it.',
        '/matches/' || NEW.id
      );
    END IF;

    IF NEW.opponent_id IS NOT NULL THEN
      INSERT INTO notifications(user_id, type, title, body, url)
      VALUES (
        NEW.opponent_id,
        'result_disputed',
        'Result disputed',
        'Both sides claimed a win — challenger gets it.',
        '/matches/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
