import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import type { RowDataPacket } from 'mysql2';

interface WaypointRow extends RowDataPacket {
  destination_slug: string;
  x: number;
  y: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const [rows] = await pool.execute<WaypointRow[]>(
      'SELECT destination_slug, x, y FROM road_waypoints ORDER BY destination_slug, waypoint_order ASC'
    );

    const grouped: Record<string, [number, number][]> = {};
    for (const row of rows) {
      if (!grouped[row.destination_slug]) {
        grouped[row.destination_slug] = [];
      }
      grouped[row.destination_slug].push([Number(row.x), Number(row.y)]);
    }

    res.json(grouped);
  } catch (err) {
    console.error('Error listing road waypoints:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
