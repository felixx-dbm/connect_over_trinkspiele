-- Allow birth_date to be NULL for OAuth users (Google does not provide it).
-- Regular email/password registrations still pass birth_date via raw_user_meta_data.
ALTER TABLE public.users ALTER COLUMN birth_date DROP NOT NULL;

-- Update trigger to handle missing birth_date and use Google's full_name as username fallback.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, birth_date)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
