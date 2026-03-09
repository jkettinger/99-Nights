import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../_db.js';
import { verifyAuth } from '../_auth.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_MESSAGES = 3;

function getClientIp(req: VercelRequest): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim() || null;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET /api/messages — list all messages (auth required)
  if (req.method === 'GET') {
    if (!verifyAuth(req, res)) return;

    try {
      const [rows] = await pool.execute<MessageRow[]>(
        'SELECT * FROM messages ORDER BY created_at DESC'
      );
      res.json(rows);
    } catch (err) {
      console.error('Error listing messages:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // POST /api/messages — submit a message (public, no auth)
  if (req.method === 'POST') {
    const { name, message, website } = req.body;

    // Honeypot: bots fill hidden fields. Silently discard.
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

    // Rate limit by IP
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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
