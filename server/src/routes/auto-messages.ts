import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AutoMessageRow extends RowDataPacket {
  id: number;
  name: string;
  message: string;
  created_at: Date;
}

const router = Router();

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

// GET /api/auto-messages — list all (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<AutoMessageRow[]>(
      'SELECT id, name, message FROM auto_messages ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listing auto messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auto-messages — create (auth required)
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { name, message } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    res.status(400).json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO auto_messages (name, message) VALUES (?, ?)',
      [name.trim(), message.trim()]
    );

    const [rows] = await pool.execute<AutoMessageRow[]>(
      'SELECT id, name, message FROM auto_messages WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating auto message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auto-messages/:id — update (auth required)
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid auto message ID' });
    return;
  }

  const { name, message } = req.body;

  if (name != null && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json({ error: 'Name must be a non-empty string' });
    return;
  }

  if (name != null && name.trim().length > MAX_NAME_LENGTH) {
    res.status(400).json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` });
    return;
  }

  if (message != null && (typeof message !== 'string' || message.trim().length === 0)) {
    res.status(400).json({ error: 'Message must be a non-empty string' });
    return;
  }

  if (message != null && message.trim().length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (name != null) { fields.push('name = ?'); values.push(name.trim()); }
  if (message != null) { fields.push('message = ?'); values.push(message.trim()); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  values.push(id);

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE auto_messages SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Auto message not found' });
      return;
    }

    const [rows] = await pool.execute<AutoMessageRow[]>(
      'SELECT id, name, message FROM auto_messages WHERE id = ?',
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating auto message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auto-messages/:id — delete (auth required)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid auto message ID' });
    return;
  }

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM auto_messages WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Auto message not found' });
      return;
    }

    res.json({ message: 'Auto message deleted' });
  } catch (err) {
    console.error('Error deleting auto message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
