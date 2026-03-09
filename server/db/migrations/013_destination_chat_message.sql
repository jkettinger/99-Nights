ALTER TABLE destinations ADD COLUMN chat_message VARCHAR(255) DEFAULT NULL;

UPDATE destinations SET chat_message='Ah, I can''t wait to see the brood!' WHERE slug='the-hearth';
UPDATE destinations SET chat_message='To the Keep! Important business awaits.' WHERE slug='the-keep';
UPDATE destinations SET chat_message='Time to test our mettle in the Arena!' WHERE slug='the-arena';
UPDATE destinations SET chat_message='Knowledge awaits in the ancient stacks...' WHERE slug='the-library';
UPDATE destinations SET chat_message='Nothing like a cold mead after a long journey.' WHERE slug='the-tavern';
UPDATE destinations SET chat_message='Duty calls at the forge.' WHERE slug='work';
