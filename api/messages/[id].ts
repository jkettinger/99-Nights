import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import type { ResultSetHeader } from 'mysql2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawId = req.query.id;
  const id = parseInt(typeof rawId === 'string' ? rawId : '', 10);

  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid message ID' });
    return;
  }

  // DELETE /api/messages/:id — delete a message (auth required)
  if (req.method === 'DELETE') {
    if (!verifyAuth(req, res)) return;

    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM messages WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.json({ message: 'Message deleted' });
    } catch (err) {
      console.error('Error deleting message:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
