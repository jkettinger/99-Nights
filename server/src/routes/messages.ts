import { Router, Request, Response } from 'express';
import pool from '../../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface MessageRow extends RowDataPacket {
  id: number;
  name: string;
  message: string;
  ip: string | null;
  created_at: Date;
}

interface RateCheckRow extends RowDataPacket {
  count: number;
}

const router = Router();

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_MESSAGES = 3;

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // x-forwarded-for can be comma-separated; first entry is the real client
    const first = forwarded.split(',')[0];
    return first ? first.trim() || null : null;
  }
  return req.ip || null;
}

// POST /api/messages — submit a message (public, no auth)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, message, website } = req.body;

  // Honeypot: if website field has any value, silently discard.
  // Bots fill hidden fields. Real users never see this field.
  if (website) {
    res.json({ success: true });
    return;
  }

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

  const clientIp = getClientIp(req);

  // Rate limit by IP — max N messages per window
  if (clientIp) {
    try {
      const [rows] = await pool.execute<RateCheckRow[]>(
        'SELECT COUNT(*) AS count FROM messages WHERE ip = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)',
        [clientIp, RATE_LIMIT_WINDOW_MINUTES]
      );

      if (rows[0] && rows[0].count >= RATE_LIMIT_MAX_MESSAGES) {
        res.status(429).json({ error: 'Too many messages. Please try again later.' });
        return;
      }
    } catch (err) {
      console.error('Error checking rate limit:', err);
      // Don't block the message if rate limit check fails — fail open for UX,
      // but log it so we know something is wrong
    }
  }

  try {
    await pool.execute<ResultSetHeader>(
      'INSERT INTO messages (name, message, ip) VALUES (?, ?, ?)',
      [name.trim(), message.trim(), clientIp]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error inserting message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages — list all messages (auth required)
router.get('/', authenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<MessageRow[]>(
      'SELECT * FROM messages ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error listing messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/messages/:id — delete a message (auth required)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(String(req.params.id ?? ''), 10);
  if (isNaN(id) || id < 1) {
    res.status(400).json({ error: 'Invalid message ID' });
    return;
  }

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
});

export default router;
