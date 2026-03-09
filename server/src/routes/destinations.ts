import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface DestinationRow extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  map_x: number;
  map_y: number;
  icon: string | null;
  audio: string | null;
  created_at: Date;
  updated_at: Date;
}

const router = Router();

// Validate slug format: lowercase alphanumeric and hyphens only
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// GET /api/destinations — list all (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<DestinationRow[]>(
      'SELECT * FROM destinations ORDER BY name ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listing destinations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/destinations/:id — get single (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid destination ID' });
    return;
  }

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
});

// POST /api/destinations — create (auth required)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
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
});

// PUT /api/destinations/:id — update (auth required)
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid destination ID' });
    return;
  }

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

  // Build dynamic update query — only update fields that were provided
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
});

// DELETE /api/destinations/:id — delete (auth required)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid destination ID' });
    return;
  }

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
});

export default router;
