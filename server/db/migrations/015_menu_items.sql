-- Menu items for The Tavern
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('beer', 'coffee', 'food', 'dessert') NOT NULL,
  price_gold INT NOT NULL DEFAULT 0,
  buffs JSON NOT NULL DEFAULT ('[]'),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- === BEERS ===
INSERT INTO menu_items (name, description, category, price_gold, buffs, sort_order) VALUES
('Bonesaw Swoosh IPA', 'A dangerously smooth IPA brewed in the shadow of the Glasslands. One sip and you''ll be talking to strangers like you''ve known them for years.', 'beer', 8, '[{"stat": "Charisma", "value": 15}, {"stat": "Courage", "value": 10}]', 1),
('Golden Monkey', 'This treacherous Belgian tripel whispers sweet promises and delivers chaos. You''ll feel invincible right up until you don''t. Legends say no one has ever ordered just one.', 'beer', 10, '[{"stat": "Judgment", "value": -50}, {"stat": "Confidence", "value": 30}]', 2),
('Mad Elf', 'A ruby-red ale brewed with honey, cherries, and questionable life choices. The wild card of the menu — you never know which version of yourself will emerge.', 'beer', 9, '[{"stat": "Chaos", "value": 20}, {"stat": "Wisdom", "value": -10}]', 3),
('Cape May Coastal Evacuation', 'A hazy DIPA that tastes like sunset over the Shore. Close your eyes and you can almost feel the sand between your toes and hear the gulls overhead.', 'beer', 9, '[{"stat": "Relaxation", "value": 25}, {"stat": "Beach Vibes", "value": 10}]', 4);

-- === COFFEE ===
INSERT INTO menu_items (name, description, category, price_gold, buffs, sort_order) VALUES
('Wawa Coffee', 'The undisputed GOAT. Brewed fresh at every hour by the benevolent monks of the Wawa Order. Loyal patrons swear it grants clarity of mind and purpose.', 'coffee', 3, '[{"stat": "Energy", "value": 30}, {"stat": "Loyalty", "value": 15}, {"stat": "Wisdom", "value": 10}]', 1),
('Dunkin Coffee', 'A reliable companion on any quest. It won''t change your life, but it''ll keep you moving. Respect the consistency.', 'coffee', 4, '[{"stat": "Energy", "value": 20}, {"stat": "Reliability", "value": 10}]', 2),
('Starbucks Coffee', 'When there''s literally nothing else available and you''ve been walking the merchant district for twenty minutes. At least the cup looks nice, I guess.', 'coffee', 12, '[{"stat": "Gold", "value": -10}, {"stat": "Energy", "value": 5}]', 3);

-- === FOOD ===
INSERT INTO menu_items (name, description, category, price_gold, buffs, sort_order) VALUES
('Ribeye Steak', 'A thick-cut slab of prime beef, seared over dragonfire and rested to perfection. The warrior''s meal. You can feel your armor fitting better after every bite.', 'food', 20, '[{"stat": "Strength", "value": 25}, {"stat": "Constitution", "value": 15}]', 1),
('Pizza', 'A perfect wheel of cheesy, saucy joy. No quest is too daunting, no dungeon too dark, when there''s pizza waiting at the end of it.', 'food', 10, '[{"stat": "Happiness", "value": 20}, {"stat": "Comfort", "value": 10}]', 2),
('Wings', 'Crispy, fiery, and dangerously addictive. Eating them without making a mess is a Dexterity check most adventurers fail. The sauce grants temporary fire immunity.', 'food', 12, '[{"stat": "Fire Resistance", "value": 15}, {"stat": "Dexterity", "value": 10}]', 3),
('Sushi', 'Precision-crafted by the blade masters of the Eastern Kingdoms. Each piece is a work of art. Your mind sharpens with every bite.', 'food', 15, '[{"stat": "Intelligence", "value": 20}, {"stat": "Dexterity", "value": 15}]', 4);

-- === DESSERT ===
INSERT INTO menu_items (name, description, category, price_gold, buffs, sort_order) VALUES
('Chocolate (ALL of it)', 'Every form of chocolate known to the realm — bars, truffles, mousse, cake, fondue, lava pools, chocolate-covered chocolate. There is no such thing as too much. Your willpower surges but your self-control crumbles. Worth it. Always worth it.', 'dessert', 15, '[{"stat": "Happiness", "value": 50}, {"stat": "Willpower", "value": 30}, {"stat": "Self-Control", "value": -20}]', 1);
