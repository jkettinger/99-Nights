import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../server/db/connection.js';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid input types' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );

    const user = rows[0];

    if (!user) {
      await bcrypt.compare(password, '$2b$12$000000000000000000000uGHTEFQXMCPJFaJFihBGDBqArxn0NaGS');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      secret,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
