CREATE TABLE IF NOT EXISTS road_waypoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destination_slug VARCHAR(255) NOT NULL,
  waypoint_order INT NOT NULL,
  x DECIMAL(6,3) NOT NULL,
  y DECIMAL(6,3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slug_order (destination_slug, waypoint_order)
);
