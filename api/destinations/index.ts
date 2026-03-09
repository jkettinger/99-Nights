import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { isValidSlug } from '../_destinations.js';
import type { DestinationRow } from '../_destinations.js';
import type { ResultSetHeader } from 'mysql2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/destinations — list all (public)
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute<DestinationRow[]>(
        'SELECT * FROM destinations ORDER BY name ASC'
      );
      res.json(rows);
    } catch (err) {
      console.error('Error listing destinations:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // POST /api/destinations — create (auth required)
  if (req.method === 'POST') {
    if (!verifyAuth(req, res)) return;

    const { name, slug, description, map_x, map_y, icon, audio } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required and must be a non-empty string' });
      return;
    }

    if (name.trim().length > 255) {
      res.status(400).json({ error: 'Name must be 255 characters or fewer' });
      return;
    }

    if (!slug || typeof slug !== 'string' || !isValidSlug(slug)) {
      res.status(400).json({ error: 'Slug is required and must be lowercase alphanumeric with hyphens (e.g. "the-citadel")' });
      return;
    }

    if (slug.length > 255) {
      res.status(400).json({ error: 'Slug must be 255 characters or fewer' });
      return;
    }

    if (map_x == null || map_y == null) {
      res.status(400).json({ error: 'map_x and map_y coordinates are required' });
      return;
    }

    const x = parseFloat(map_x);
    const y = parseFloat(map_y);

    if (isNaN(x) || isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      res.status(400).json({ error: 'map_x and map_y must be numbers between 0 and 100' });
      return;
    }

    if (icon != null && typeof icon !== 'string') {
      res.status(400).json({ error: 'Icon must be a string if provided' });
      return;
    }

    if (icon != null && icon.trim().length > 100) {
      res.status(400).json({ error: 'Icon must be 100 characters or fewer' });
      return;
    }

    if (description != null && typeof description !== 'string') {
      res.status(400).json({ error: 'Description must be a string if provided' });
      return;
    }

    if (audio != null && typeof audio !== 'string') {
      res.status(400).json({ error: 'Audio must be a string if provided' });
      return;
    }

    if (audio != null && audio.trim().length > 255) {
      res.status(400).json({ error: 'Audio path must be 255 characters or fewer' });
      return;
    }

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO destinations (name, slug, description, map_x, map_y, icon, audio) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), slug, description?.trim() ?? null, x, y, icon?.trim() ?? null, audio?.trim() ?? null]
      );

      const [rows] = await pool.execute<DestinationRow[]>(
        'SELECT * FROM destinations WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A destination with that slug already exists' });
        return;
      }
      console.error('Error creating destination:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
