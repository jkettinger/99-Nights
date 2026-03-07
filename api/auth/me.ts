import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  username: string;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    res.json({ userId: decoded.userId, username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
