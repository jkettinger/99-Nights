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
  const rawId = req.query.id;
  const id = parseInt(typeof rawId === 'string' ? rawId : '', 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid menu item ID' });
    return;
  }

  // PUT /api/menu-items/:id — update (auth required)
  if (req.method === 'PUT') {
    if (!verifyAuth(req, res)) return;

    const { name, description, category, price_gold, buffs, sort_order } = req.body;

    if (name != null && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json({ error: 'Name must be a non-empty string' });
      return;
    }

    if (name != null && name.trim().length > MAX_NAME_LENGTH) {
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

    if (category != null && !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    if (price_gold != null) {
      const p = parseInt(String(price_gold), 10);
      if (isNaN(p) || p < 0 || p > MAX_PRICE) {
        res.status(400).json({ error: `Price must be between 0 and ${MAX_PRICE}` });
        return;
      }
    }

    if (buffs != null && !Array.isArray(buffs)) {
      res.status(400).json({ error: 'Buffs must be an array' });
      return;
    }

    if (sort_order != null && isNaN(parseInt(String(sort_order), 10))) {
      res.status(400).json({ error: 'Sort order must be a number' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (name != null) { fields.push('name = ?'); values.push(name.trim()); }
    if (description != null) { fields.push('description = ?'); values.push(description.trim()); }
    if (category != null) { fields.push('category = ?'); values.push(category); }
    if (price_gold != null) { fields.push('price_gold = ?'); values.push(parseInt(String(price_gold), 10)); }
    if (buffs != null) { fields.push('buffs = ?'); values.push(JSON.stringify(buffs)); }
    if (sort_order != null) { fields.push('sort_order = ?'); values.push(parseInt(String(sort_order), 10)); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    values.push(id);

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      const [rows] = await pool.execute<MenuItemRow[]>(
        'SELECT id, name, description, category, price_gold, buffs, sort_order FROM menu_items WHERE id = ?',
        [id]
      );

      const item = rows[0]!;
      res.json({
        ...item,
        buffs: typeof item.buffs === 'string' ? JSON.parse(item.buffs) : item.buffs
      });
    } catch (err) {
      console.error('Error updating menu item:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // DELETE /api/menu-items/:id — delete (auth required)
  if (req.method === 'DELETE') {
    if (!verifyAuth(req, res)) return;

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM menu_items WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      res.json({ message: 'Menu item deleted' });
    } catch (err) {
      console.error('Error deleting menu item:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
