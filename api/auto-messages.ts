import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db.js';
import { verifyAuth } from './_auth.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AutoMessageRow extends RowDataPacket {
  id: number;
  name: string;
  message: string;
  created_at: Date;
}

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/auto-messages — list all (public)
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.execute<AutoMessageRow[]>(
        'SELECT id, name, message FROM auto_messages ORDER BY id ASC'
      );
      res.json(rows);
    } catch (err) {
      console.error('Error listing auto messages:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // POST /api/auto-messages — create (auth required)
  if (req.method === 'POST') {
    if (!verifyAuth(req, res)) return;

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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
