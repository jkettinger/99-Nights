ALTER TABLE characters ADD COLUMN video VARCHAR(255) DEFAULT NULL;

UPDATE characters SET video='/videos/layla.mp4' WHERE name='Layla' AND destination_slug='the-hearth';
UPDATE characters SET video='/videos/cece.mp4' WHERE name='Cecelia' AND destination_slug='the-hearth';
UPDATE characters SET video='/videos/james.mp4' WHERE name='James' AND destination_slug='the-hearth';
UPDATE characters SET video='/videos/nora.mp4' WHERE name='Nora' AND destination_slug='the-hearth';
UPDATE characters SET video='/videos/owen.mp4' WHERE name='Owen' AND destination_slug='the-hearth';
UPDATE characters SET video='/videos/jim.mp4' WHERE name='Jim' AND destination_slug='the-hearth'