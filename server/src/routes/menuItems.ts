import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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

const router = Router();

const VALID_CATEGORIES = ['beer', 'coffee', 'food', 'dessert'] as const;
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_PRICE = 99999;

// GET /api/menu-items — list all (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<MenuItemRow[]>(
      'SELECT id, name, description, category, price_gold, buffs, sort_order FROM menu_items ORDER BY FIELD(category, \'beer\', \'coffee\', \'food\', \'dessert\'), sort_order ASC'
    );

    // Parse buffs JSON for each row since mysql2 returns it as a string
    const items = rows.map(row => ({
      ...row,
      buffs: typeof row.buffs === 'string' ? JSON.parse(row.buffs) : row.buffs
    }));

    res.json(items);
  } catch (err) {
    console.error('Error listing menu items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/menu-items — create (auth required)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
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
});

// PUT /api/menu-items/:id — update (auth required)
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid menu item ID' });
    return;
  }

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
});

// DELETE /api/menu-items/:id — delete (auth required)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid menu item ID' });
    return;
  }

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
});

export default router;
