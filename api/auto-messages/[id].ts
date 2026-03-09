import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
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
  const rawId = req.query.id;
  const id = parseInt(typeof rawId === 'string' ? rawId : '', 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid auto message ID' });
    return;
  }

  // PUT /api/auto-messages/:id — update (auth required)
  if (req.method === 'PUT') {
    if (!verifyAuth(req, res)) return;

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
    return;
  }

  // DELETE /api/auto-messages/:id — delete (auth required)
  if (req.method === 'DELETE') {
    if (!verifyAuth(req, res)) return;

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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
