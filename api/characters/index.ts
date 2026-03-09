import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CharacterRow extends RowDataPacket {
  id: number;
  name: string;
  title: string | null;
  class: string | null;
  birthday: string | null;
  photo: string | null;
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
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/characters — list all (public)
  if (req.method === 'GET') {
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
    return;
  }

  // POST /api/characters — create (auth required)
  if (req.method === 'POST') {
    if (!verifyAuth(req, res)) return;

    const {
      name, title, class: charClass, birthday, photo,
      strength, dexterity, intellect, charisma, chaos, resolve,
      unique_trait_name, unique_trait_desc,
      passive_ability_name, passive_ability_desc,
      weakness, lore, status, sort_order, destination_slug,
    } = req.body;

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

    const attrValues: Record<string, number> = {};
    const attrInputs = { strength, dexterity, intellect, charisma, chaos, resolve } as Record<string, unknown>;
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
          name, title, class, birthday, photo,
          strength, dexterity, intellect, charisma, chaos, resolve,
          unique_trait_name, unique_trait_desc,
          passive_ability_name, passive_ability_desc,
          weakness, lore, status, sort_order, destination_slug
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          title?.trim() ?? null,
          charClass?.trim() ?? null,
          birthday ?? null,
          photo?.trim() ?? null,
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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
