-- Follow-up to 20261113120000_strip_vins_from_listings. Two leftovers:
-- 1. A slug cut at 90 characters ends in a partial VIN ("...-pickup-vin-1ft7w2bt1lee5"); the 17-character
--    rule missed it. Drop the partial VIN (and the "vin" segment before it). The page 308s old URLs.
-- 2. Text that kept the "VIN" label after the VIN was removed ("(Pickup) / VIN").

UPDATE "Part"
SET spec = btrim(regexp_replace(spec, '[\s/,(]*\mVIN\s*[:#]?\s*$', '', 'i'))
WHERE spec ~* '\mVIN\s*[:#]?\s*$';

UPDATE "Part"
SET title = btrim(regexp_replace(title, '[\s/,(]*\mVIN\s*[:#]?\s*$', '', 'i'))
WHERE title ~* '\mVIN\s*[:#]?\s*$';

WITH changed AS (
  SELECT id, regexp_replace(regexp_replace(slug, '-[a-hj-npr-z0-9]{11,16}$', ''), '-vin$', '') AS clean
  FROM "Part"
  WHERE length(slug) >= 90
    AND substring(slug from '-([a-hj-npr-z0-9]{11,16})$') IS NOT NULL
    AND length(regexp_replace(substring(slug from '-([a-hj-npr-z0-9]{11,16})$'), '[^0-9]', '', 'g')) >= 3
    AND length(regexp_replace(substring(slug from '-([a-hj-npr-z0-9]{11,16})$'), '[^a-z]', '', 'g')) >= 3
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
