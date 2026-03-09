ALTER TABLE destinations ADD COLUMN audio VARCHAR(255) DEFAULT NULL;

UPDATE destinations SET audio='/audio/ember.mp3' WHERE slug='the-hearth';
