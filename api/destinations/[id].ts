import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import { isValidSlug } from '../_destinations.js';
import type { DestinationRow } from '../_destinations.js';
import type { ResultSetHeader } from 'mysql2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawId = req.query.id;
  const id = parseInt(typeof rawId === 'string' ? rawId : '', 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid destination ID' });
    return;
  }

  // GET /api/destinations/:id — get single (public)
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute<DestinationRow[]>(
        'SELECT * FROM destinations WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Destination not found' });
        return;
      }

      res.json(rows[0]);
    } catch (err) {
      console.error('Error fetching destination:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // PUT /api/destinations/:id — update (auth required)
  if (req.method === 'PUT') {
    if (!verifyAuth(req, res)) return;

    const { name, slug, description, map_x, map_y, icon, audio } = req.body;

    if (name != null && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({ error: 'Name must be a non-empty string' });
      return;
    }

    if (name != null && name.trim().length > 255) {
      res.status(400).json({ error: 'Name must be 255 characters or fewer' });
      return;
    }

    if (slug != null && (typeof slug !== 'string' || !isValidSlug(slug))) {
      res.status(400).json({ error: 'Slug must be lowercase alphanumeric with hyphens (e.g. "the-citadel")' });
      return;
    }

    if (slug != null && slug.length > 255) {
      res.status(400).json({ error: 'Slug must be 255 characters or fewer' });
      return;
    }

    if (map_x != null) {
      const x = parseFloat(map_x);
      if (isNaN(x) || x < 0 || x > 100) {
        res.status(400).json({ error: 'map_x must be a number between 0 and 100' });
        return;
      }
    }

    if (map_y != null) {
      const y = parseFloat(map_y);
      if (isNaN(y) || y < 0 || y > 100) {
        res.status(400).json({ error: 'map_y must be a number between 0 and 100' });
        return;
      }
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

    const fields: string[] = [];
    const values: any[] = [];

    if (name != null) { fields.push('name = ?'); values.push(name.trim()); }
    if (slug != null) { fields.push('slug = ?'); values.push(slug); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description?.trim() ?? null); }
    if (map_x != null) { fields.push('map_x = ?'); values.push(parseFloat(map_x)); }
    if (map_y != null) { fields.push('map_y = ?'); values.push(parseFloat(map_y)); }
    if (icon !== undefined) { fields.push('icon = ?'); values.push(icon?.trim() ?? null); }
    if (audio !== undefined) { fields.push('audio = ?'); values.push(audio?.trim() ?? null); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE destinations SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Destination not found' });
        return;
      }

      const [rows] = await pool.execute<DestinationRow[]>(
        'SELECT * FROM destinations WHERE id = ?',
        [id]
      );

      res.json(rows[0]);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A destination with that slug already exists' });
        return;
      }
      console.error('Error updating destination:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // DELETE /api/destinations/:id — delete (auth required)
  if (req.method === 'DELETE') {
    if (!verifyAuth(req, res)) return;

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM destinations WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Destination not found' });
        return;
      }

      res.json({ message: 'Destination deleted' });
    } catch (err) {
      console.error('Error deleting destination:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
