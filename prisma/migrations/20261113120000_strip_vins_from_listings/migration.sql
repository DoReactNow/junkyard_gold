-- Data fix: the sales sheet's Specification column sometimes held a full 17-character VIN, which leaked into
-- public listing titles, specs and URLs. Remove VIN tokens (17 VIN characters with at least one letter and
-- one digit) from existing rows. Old URLs are 301-redirected by src/app/parts/[slug]/page.tsx.

CREATE FUNCTION pg_temp.jg_strip_vins(s text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE m text;
BEGIN
  IF s IS NULL THEN RETURN s; END IF;
  FOR m IN SELECT (regexp_matches(s, '\m[A-HJ-NPR-Za-hj-npr-z0-9]{17}\M', 'g'))[1] LOOP
    IF m ~ '[0-9]' AND m ~ '[A-Za-z]' THEN s := replace(s, m, ''); END IF;
  END LOOP;
  s := regexp_replace(s, '(\s*/\s*){2,}', ' / ', 'g');
  s := regexp_replace(s, '\(\s*\)', '', 'g');
  s := regexp_replace(s, '\s+([,;)])', '\1', 'g');
  s := regexp_replace(s, '[\s/,;:-]+$', '');
  s := regexp_replace(s, '^[\s/,;:-]+', '');
  s := regexp_replace(s, '\s{2,}', ' ', 'g');
  RETURN btrim(s);
END $$;

CREATE FUNCTION pg_temp.jg_strip_vin_slug(s text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT string_agg(seg, '-' ORDER BY n)
  FROM unnest(string_to_array(s, '-')) WITH ORDINALITY AS t(seg, n)
  WHERE NOT (seg ~ '^[a-hj-npr-z0-9]{17}$' AND seg ~ '[0-9]' AND seg ~ '[a-z]')
$$;

UPDATE "Part"
SET title = pg_temp.jg_strip_vins(title),
    spec = pg_temp.jg_strip_vins(spec),
    description = pg_temp.jg_strip_vins(description)
WHERE title <> pg_temp.jg_strip_vins(title)
   OR spec <> pg_temp.jg_strip_vins(spec)
   OR description <> pg_temp.jg_strip_vins(description);

-- New slugs must stay unique: add a short id suffix when the cleaned slug is taken or shared.
WITH changed AS (
  SELECT id, pg_temp.jg_strip_vin_slug(slug) AS clean
  FROM "Part"
  WHERE pg_temp.jg_strip_vin_slug(slug) <> slug
), ranked AS (
  SELECT c.id, c.clean,
         row_number() OVER (PARTITION BY c.clean ORDER BY c.id) AS rn,
         EXISTS (SELECT 1 FROM "Part" p WHERE p.slug = c.clean AND p.id NOT IN (SELECT id FROM changed)) AS taken
  FROM changed c
)
UPDATE "Part" p
SET slug = CASE WHEN r.rn > 1 OR r.taken THEN r.clean || '-' || right(p.id, 6) ELSE r.clean END
FROM ranked r
WHERE p.id = r.id;
