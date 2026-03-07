import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const host = process.env.DB_HOST || '(not set)';
  res.json({
    DB_HOST_length: host.length,
    DB_HOST_preview: host.slice(0, 6) + '...',
    DB_PORT: process.env.DB_PORT || '(not set)',
    DB_NAME_set: !!process.env.DB_NAME,
    DB_USER_set: !!process.env.DB_USER,
    DB_PASS_set: !!process.env.DB_PASS,
  });
}
