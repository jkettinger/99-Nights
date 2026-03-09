UPDATE destinations SET name = 'The Hearth', slug = 'the-hearth' WHERE slug = 'the-keep';
UPDATE road_waypoints SET destination_slug = 'the-hearth' WHERE destination_slug = 'the-keep';
