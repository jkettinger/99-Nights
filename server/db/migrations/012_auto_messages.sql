CREATE TABLE IF NOT EXISTS auto_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO auto_messages (name, message) VALUES
('Guard', 'I used to be an adventurer like you, then I took an arrow to the knee.'),
('Merchant', 'Fresh sweetrolls! Get ''em while they''re warm!'),
('Bard', '♪ Our hero, our hero, claims a warrior''s heart... ♪'),
('Villager', 'Did you hear? Dragons have been spotted near the mountains.'),
('Innkeeper', 'Nothing like some fried dragon to lift a wanderer''s spirit.'),
('Scout', 'The roads aren''t safe these days. Watch yourself, traveler.'),
('Blacksmith', 'Steel''s not cheap, but neither is your life.'),
('Elder', 'The ancient texts speak of one who would come...'),
('Child', 'Tag! You''re it! ...oh wait, you''re not playing.'),
('Fisherman', 'Caught a mudcrab the other day. Nasty creatures.'),
('Alchemist', 'I could brew you a potion, but the last one turned a man into a newt.'),
('Courier', 'I''ve been looking for you. Got something I''m supposed to deliver.'),
('Stablehand', 'The horses are restless tonight. Something in the air.'),
('Wizard', 'I tried to refactor reality once. Got a stack overflow.'),
('Scribe', 'The logs are full of warnings. As usual, no one reads them.'),
('Merchant', 'Two copper for a health potion? In THIS economy?'),
('Guard', 'Nothing to report. Which is exactly what worries me.'),
('Bard', 'They say the dev who built this realm never sleeps.'),
('Villager', 'My cousin saw a pixel out of place near the tavern. Terrifying.'),
('Innkeeper', 'We serve ale, mead, and cold brew coffee. Adventurers need caffeine.'),
('Elder', 'In my day, we deployed on Fridays and lived to tell the tale.'),
('Child', 'When I grow up, I want to be a div with position: absolute!'),
('Fisherman', 'The network''s been slow today. Must be the sea serpents.'),
('Scout', 'I found a hidden path behind the waterfall. It led to a 404.'),
('Blacksmith', 'I forged this blade from pure TypeScript. It''s strictly typed.');
