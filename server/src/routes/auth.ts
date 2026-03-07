import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../db/connection.js';
import { authenticate, JwtPayload } from '../middleware/auth.js';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
}

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
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
    console.error('JWT_SECRET is not set — cannot sign tokens');
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
      // Timing-safe: still run bcrypt compare against a dummy hash
      // so attackers can't distinguish "user not found" by response time
      await bcrypt.compare(password, '$2b$12$000000000000000000000uGHTEFQXMCPJFaJFihBGDBqArxn0NaGS');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload: JwtPayload = { userId: user.id, username: user.username };
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    userId: req.user.userId,
    username: req.user.username,
  });
});

export default router;
