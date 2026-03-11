import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MenuItemRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  category: 'beer' | 'coffee' | 'food' | 'dessert';
  price_gold: number;
  buffs: any;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const VALID_CATEGORIES = ['beer', 'coffee', 'food', 'dessert'] as const;
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PRICE = 99999;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/menu-items — list all (public)
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute<MenuItemRow[]>(
        'SELECT id, name, description, category, price_gold, buffs, sort_order FROM menu_items ORDER BY FIELD(category, \'beer\', \'coffee\', \'food\', \'dessert\'), sort_order ASC'
      );

      const items = rows.map(row => ({
        ...row,
        buffs: typeof row.buffs === 'string' ? JSON.parse(row.buffs) : row.buffs
      }));

      res.json(items);
    } catch (err) {
      console.error('Error listing menu items:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // POST /api/menu-items — create (auth required)
  if (req.method === 'POST') {
    if (!verifyAuth(req, res)) return;

    const { name, description, category, price_gold, buffs, sort_order } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      res.status(400).json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` });
      return;
    }

    if (description != null && typeof description !== 'string') {
      res.status(400).json({ error: 'Description must be a string' });
      return;
    }

    if (description != null && description.length > MAX_DESCRIPTION_LENGTH) {
      res.status(400).json({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` });
      return;
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    const priceValue = price_gold != null ? parseInt(String(price_gold), 10) : 0;
    if (isNaN(priceValue) || priceValue < 0 || priceValue > MAX_PRICE) {
      res.status(400).json({ error: `Price must be between 0 and ${MAX_PRICE}` });
      return;
    }

    if (buffs != null && !Array.isArray(buffs)) {
      res.status(400).json({ error: 'Buffs must be an array' });
      return;
    }

    const sortValue = sort_order != null ? parseInt(String(sort_order), 10) : 0;
    if (isNaN(sortValue)) {
      res.status(400).json({ error: 'Sort order must be a number' });
      return;
    }

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO menu_items (name, description, category, price_gold, buffs, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [name.trim(), description?.trim() ?? null, category, priceValue, buffs ? JSON.stringify(buffs) : '[]', sortValue]
      );

      const [rows] = await pool.execute<MenuItemRow[]>(
        'SELECT id, name, description, category, price_gold, buffs, sort_order FROM menu_items WHERE id = ?',
        [result.insertId]
      );

      const item = rows[0]!;
      res.status(201).json({
        ...item,
        buffs: typeof item.buffs === 'string' ? JSON.parse(item.buffs) : item.buffs
      });
    } catch (err) {
      console.error('Error creating menu item:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
