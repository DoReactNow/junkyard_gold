-- Display fix: "Suburban-1500", "Escalade-ESV", "Montero-Sport" → "Suburban 1500", … in the stored model
-- and title (same rule as normalizeModel in src/lib/models.ts). Short prefixes keep their hyphen
-- ("F-150", "CX-5"). Slugs are untouched, so no URL changes.
UPDATE "Part"
SET title = replace(title, model, regexp_replace(model, '([A-Za-z]{3,})-(?=[A-Za-z0-9])', '\1 ', 'g')),
    model = regexp_replace(model, '([A-Za-z]{3,})-(?=[A-Za-z0-9])', '\1 ', 'g')
WHERE model ~ '[A-Za-z]{3,}-[A-Za-z0-9]';
