import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import type { RowDataPacket } from 'mysql2';

interface WaypointRow extends RowDataPacket {
  x: number;
  y: number;
}

function isValidWaypointSlug(slug: string): boolean {
  return /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(slug);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawSlug = req.query.slug;
  const slug = typeof rawSlug === 'string' ? rawSlug : '';

  if (!slug || !isValidWaypointSlug(slug)) {
    res.status(400).json({ error: 'Invalid slug format' });
    return;
  }

  // GET /api/road-waypoints/:slug — waypoints for a specific slug (public)
  if (req.method === 'GET') {
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
    return;
  }

  // PUT /api/road-waypoints/:slug — replace all waypoints (auth required)
  if (req.method === 'PUT') {
    if (!verifyAuth(req, res)) return;

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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
