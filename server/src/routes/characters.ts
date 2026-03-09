import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CharacterRow extends RowDataPacket {
  id: number;
  name: string;
  title: string | null;
  class: string | null;
  birthday: string | null;
  photo: string | null;
  video: string | null;
  strength: number;
  dexterity: number;
  intellect: number;
  charisma: number;
  chaos: number;
  resolve: number;
  unique_trait_name: string | null;
  unique_trait_desc: string | null;
  passive_ability_name: string | null;
  passive_ability_desc: string | null;
  weakness: string | null;
  lore: string | null;
  status: string | null;
  sort_order: number;
  destination_slug: string;
  created_at: Date;
  updated_at: Date;
}

const router = Router();

const ATTRIBUTES = ['strength', 'dexterity', 'intellect', 'charisma', 'chaos', 'resolve'] as const;

function validateAttribute(value: unknown, name: string): { valid: boolean; parsed?: number; error?: string } {
  if (value == null) return { valid: true };
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 5) {
    return { valid: false, error: `${name} must be an integer between 1 and 5` };
  }
  return { valid: true, parsed: n };
}

function isValidDate(str: string): boolean {
  // Accepts YYYY-MM-DD format
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

// GET /api/characters — list all (public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const destination = req.query.destination;
    let query = 'SELECT * FROM characters';
    const params: string[] = [];

    if (destination && typeof destination === 'string') {
      query += ' WHERE destination_slug = ?';
      params.push(destination);
    }

    query += ' ORDER BY sort_order ASC';

    const [rows] = await pool.execute<CharacterRow[]>(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error listing characters:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/characters/:id — get single (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid character ID' });
    return;
  }

  try {
    const [rows] = await pool.execute<CharacterRow[]>(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching character:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/characters — create (auth required)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const {
    name, title, class: charClass, birthday, photo, video,
    strength, dexterity, intellect, charisma, chaos, resolve,
    unique_trait_name, unique_trait_desc,
    passive_ability_name, passive_ability_desc,
    weakness, lore, status, sort_order, destination_slug,
  } = req.body;

  // Name is required
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required and must be a non-empty string' });
    return;
  }
  if (name.trim().length > 100) {
    res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    return;
  }

  if (title != null && (typeof title !== 'string' || title.length > 255)) {
    res.status(400).json({ error: 'Title must be a string of 255 characters or fewer' });
    return;
  }

  if (charClass != null && (typeof charClass !== 'string' || charClass.length > 100)) {
    res.status(400).json({ error: 'Class must be a string of 100 characters or fewer' });
    return;
  }

  if (birthday != null && (typeof birthday !== 'string' || !isValidDate(birthday))) {
    res.status(400).json({ error: 'Birthday must be a valid date in YYYY-MM-DD format' });
    return;
  }

  if (photo != null && (typeof photo !== 'string' || photo.length > 255)) {
    res.status(400).json({ error: 'Photo must be a string of 255 characters or fewer' });
    return;
  }

  if (video != null && (typeof video !== 'string' || video.length > 255)) {
    res.status(400).json({ error: 'Video must be a string of 255 characters or fewer' });
    return;
  }

  // Validate all 6 attributes
  const attrValues: Record<string, number> = {};
  const attrInputs = { strength, dexterity, intellect, charisma, chaos, resolve };
  for (const attr of ATTRIBUTES) {
    const result = validateAttribute(attrInputs[attr], attr);
    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }
    if (result.parsed != null) attrValues[attr] = result.parsed;
  }

  if (unique_trait_name != null && typeof unique_trait_name !== 'string') {
    res.status(400).json({ error: 'unique_trait_name must be a string' });
    return;
  }
  if (unique_trait_desc != null && typeof unique_trait_desc !== 'string') {
    res.status(400).json({ error: 'unique_trait_desc must be a string' });
    return;
  }
  if (passive_ability_name != null && typeof passive_ability_name !== 'string') {
    res.status(400).json({ error: 'passive_ability_name must be a string' });
    return;
  }
  if (passive_ability_desc != null && typeof passive_ability_desc !== 'string') {
    res.status(400).json({ error: 'passive_ability_desc must be a string' });
    return;
  }
  if (weakness != null && typeof weakness !== 'string') {
    res.status(400).json({ error: 'weakness must be a string' });
    return;
  }
  if (lore != null && typeof lore !== 'string') {
    res.status(400).json({ error: 'lore must be a string' });
    return;
  }
  if (status != null && typeof status !== 'string') {
    res.status(400).json({ error: 'status must be a string' });
    return;
  }

  const order = sort_order != null ? parseInt(String(sort_order), 10) : 0;
  if (isNaN(order)) {
    res.status(400).json({ error: 'sort_order must be an integer' });
    return;
  }

  const destSlug = destination_slug != null ? String(destination_slug) : 'the-hearth';

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO characters (
        name, title, class, birthday, photo, video,
        strength, dexterity, intellect, charisma, chaos, resolve,
        unique_trait_name, unique_trait_desc,
        passive_ability_name, passive_ability_desc,
        weakness, lore, status, sort_order, destination_slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        title?.trim() ?? null,
        charClass?.trim() ?? null,
        birthday ?? null,
        photo?.trim() ?? null,
        video?.trim() ?? null,
        attrValues.strength ?? 1,
        attrValues.dexterity ?? 1,
        attrValues.intellect ?? 1,
        attrValues.charisma ?? 1,
        attrValues.chaos ?? 1,
        attrValues.resolve ?? 1,
        unique_trait_name?.trim() ?? null,
        unique_trait_desc?.trim() ?? null,
        passive_ability_name?.trim() ?? null,
        passive_ability_desc?.trim() ?? null,
        weakness?.trim() ?? null,
        lore?.trim() ?? null,
        status?.trim() ?? null,
        order,
        destSlug,
      ]
    );

    const [rows] = await pool.execute<CharacterRow[]>(
      'SELECT * FROM characters WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating character:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/characters/:id — update (auth required)
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid character ID' });
    return;
  }

  const {
    name, title, class: charClass, birthday, photo, video,
    strength, dexterity, intellect, charisma, chaos, resolve,
    unique_trait_name, unique_trait_desc,
    passive_ability_name, passive_ability_desc,
    weakness, lore, status, sort_order, destination_slug,
  } = req.body;

  if (name != null && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json({ error: 'Name must be a non-empty string' });
    return;
  }
  if (name != null && name.trim().length > 100) {
    res.status(400).json({ error: 'Name must be 100 characters or fewer' });
    return;
  }
  if (title != null && (typeof title !== 'string' || title.length > 255)) {
    res.status(400).json({ error: 'Title must be a string of 255 characters or fewer' });
    return;
  }
  if (charClass != null && (typeof charClass !== 'string' || charClass.length > 100)) {
    res.status(400).json({ error: 'Class must be a string of 100 characters or fewer' });
    return;
  }
  if (birthday != null && (typeof birthday !== 'string' || !isValidDate(birthday))) {
    res.status(400).json({ error: 'Birthday must be a valid date in YYYY-MM-DD format' });
    return;
  }
  if (photo != null && (typeof photo !== 'string' || photo.length > 255)) {
    res.status(400).json({ error: 'Photo must be a string of 255 characters or fewer' });
    return;
  }
  if (video != null && (typeof video !== 'string' || video.length > 255)) {
    res.status(400).json({ error: 'Video must be a string of 255 characters or fewer' });
    return;
  }

  // Validate attributes if provided
  for (const attr of ATTRIBUTES) {
    const val = req.body[attr];
    if (val != null) {
      const result = validateAttribute(val, attr);
      if (!result.valid) {
        res.status(400).json({ error: result.error });
        return;
      }
    }
  }

  if (unique_trait_name != null && typeof unique_trait_name !== 'string') {
    res.status(400).json({ error: 'unique_trait_name must be a string' });
    return;
  }
  if (unique_trait_desc != null && typeof unique_trait_desc !== 'string') {
    res.status(400).json({ error: 'unique_trait_desc must be a string' });
    return;
  }
  if (passive_ability_name != null && typeof passive_ability_name !== 'string') {
    res.status(400).json({ error: 'passive_ability_name must be a string' });
    return;
  }
  if (passive_ability_desc != null && typeof passive_ability_desc !== 'string') {
    res.status(400).json({ error: 'passive_ability_desc must be a string' });
    return;
  }
  if (weakness != null && typeof weakness !== 'string') {
    res.status(400).json({ error: 'weakness must be a string' });
    return;
  }
  if (lore != null && typeof lore !== 'string') {
    res.status(400).json({ error: 'lore must be a string' });
    return;
  }
  if (status != null && typeof status !== 'string') {
    res.status(400).json({ error: 'status must be a string' });
    return;
  }
  if (sort_order != null && isNaN(parseInt(String(sort_order), 10))) {
    res.status(400).json({ error: 'sort_order must be an integer' });
    return;
  }
  if (destination_slug != null && typeof destination_slug !== 'string') {
    res.status(400).json({ error: 'destination_slug must be a string' });
    return;
  }

  // Build dynamic update query
  const fields: string[] = [];
  const values: any[] = [];

  if (name != null) { fields.push('name = ?'); values.push(name.trim()); }
  if (title !== undefined) { fields.push('title = ?'); values.push(title?.trim() ?? null); }
  if (charClass !== undefined) { fields.push('class = ?'); values.push(charClass?.trim() ?? null); }
  if (birthday !== undefined) { fields.push('birthday = ?'); values.push(birthday ?? null); }
  if (photo !== undefined) { fields.push('photo = ?'); values.push(photo?.trim() ?? null); }
  if (video !== undefined) { fields.push('video = ?'); values.push(video?.trim() ?? null); }
  for (const attr of ATTRIBUTES) {
    const val = req.body[attr];
    if (val != null) {
      fields.push(`${attr} = ?`);
      values.push(typeof val === 'number' ? val : parseInt(String(val), 10));
    }
  }
  if (unique_trait_name !== undefined) { fields.push('unique_trait_name = ?'); values.push(unique_trait_name?.trim() ?? null); }
  if (unique_trait_desc !== undefined) { fields.push('unique_trait_desc = ?'); values.push(unique_trait_desc?.trim() ?? null); }
  if (passive_ability_name !== undefined) { fields.push('passive_ability_name = ?'); values.push(passive_ability_name?.trim() ?? null); }
  if (passive_ability_desc !== undefined) { fields.push('passive_ability_desc = ?'); values.push(passive_ability_desc?.trim() ?? null); }
  if (weakness !== undefined) { fields.push('weakness = ?'); values.push(weakness?.trim() ?? null); }
  if (lore !== undefined) { fields.push('lore = ?'); values.push(lore?.trim() ?? null); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status?.trim() ?? null); }
  if (sort_order != null) { fields.push('sort_order = ?'); values.push(parseInt(String(sort_order), 10)); }
  if (destination_slug != null) { fields.push('destination_slug = ?'); values.push(destination_slug); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE characters SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const [rows] = await pool.execute<CharacterRow[]>(
      'SELECT * FROM characters WHERE id = ?',
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating character:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/characters/:id — delete (auth required)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid character ID' });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM characters WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json({ message: 'Character deleted' });
  } catch (err) {
    console.error('Error deleting character:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
