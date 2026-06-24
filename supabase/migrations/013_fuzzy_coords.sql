-- Store fuzzy lat/lng as plain floats alongside the PostGIS location column
-- so the match lobby can build a Google Maps deep-link without parsing WKB
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fuzzy_lat FLOAT8;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fuzzy_lng FLOAT8;
