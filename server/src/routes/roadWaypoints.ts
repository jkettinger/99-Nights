import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket } from 'mysql2';

interface WaypointRow extends RowDataPacket {
  id: number;
  destination_slug: string;
  waypoint_order: number;
  x: number;
  y: number;
  created_at: Date;
}

const router = Router();

// Slug format: lowercase alphanumeric, hyphens, and underscores (for __start_to_town__)
function isValidWaypointSlug(slug: string): boolean {
  return /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(slug);
}

// GET /api/road-waypoints — all waypoints grouped by slug (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<WaypointRow[]>(
      'SELECT destination_slug, x, y FROM road_waypoints ORDER BY destination_slug, waypoint_order ASC'
    );

    const grouped: Record<string, [number, number][]> = {};
    for (const row of rows) {
      if (!grouped[row.destination_slug]) {
        grouped[row.destination_slug] = [];
      }
      grouped[row.destination_slug]!.push([Number(row.x), Number(row.y)]);
    }

    res.json(grouped);
  } catch (err) {
    console.error('Error listing road waypoints:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/road-waypoints/:slug — waypoints for a specific slug (public)
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug ?? '');

  if (!slug || !isValidWaypointSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug format' });
    return;
  }

  try {
    const [rows] = await pool.execute<WaypointRow[]>(
      'SELECT x, y FROM road_waypoints WHERE destination_slug = ? ORDER BY waypoint_order ASC',
      [slug]
    );

    const waypoints: [number, number][] = rows.map(row => [Number(row.x), Number(row.y)]);
    res.json({ slug, waypoints });
  } catch (err) {
    console.error('Error fetching road waypoints:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/road-waypoints/:slug — replace all waypoints for a slug (auth required)
router.put('/:slug', authenticate, async (req: Request, res: Response): Promise<void> => {
  const slug = String(req.params.slug ?? '');

  if (!slug || !isValidWaypointSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug format' });
    return;
  }

  if (slug.length > 255) {
    res.status(400).json({ error: 'Slug must be 255 characters or fewer' });
    return;
  }

  const { waypoints } = req.body;

  if (!Array.isArray(waypoints)) {
    res.status(400).json({ error: 'waypoints must be an array of [x, y] coordinate pairs' });
    return;
  }

  if (waypoints.length === 0) {
    res.status(400).json({ error: 'waypoints array must not be empty — deleting all waypoints is not allowed' });
    return;
  }

  // Validate every single coordinate — garbage in, garbage out
  for (let i = 0; i < waypoints.length; i++) {
    const point = waypoints[i];
    if (!Array.isArray(point) || point.length !== 2) {
      res.status(400).json({ error: `waypoints[${i}] must be a [x, y] pair` });
      return;
    }
    const [x, y] = point;
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      res.status(400).json({ error: `waypoints[${i}] coordinates must be numbers` });
      return;
    }
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      res.status(400).json({ error: `waypoints[${i}] coordinates must be between 0 and 100` });
      return;
    }
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM road_waypoints WHERE destination_slug = ?', [slug]);

    for (let i = 0; i < waypoints.length; i++) {
      const [x, y] = waypoints[i];
      await connection.execute(
        'INSERT INTO road_waypoints (destination_slug, waypoint_order, x, y) VALUES (?, ?, ?, ?)',
        [slug, i, x, y]
      );
    }

    await connection.commit();

    res.json({ slug, waypoints, count: waypoints.length });
  } catch (err) {
    await connection.rollback();
    console.error('Error saving road waypoints:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
});

export default router;
