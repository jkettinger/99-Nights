import type { VercelRequest, VercelResponse } from '@vercel/node';

// TODO: Use @vercel/blob for production uploads
// Local dev uses multer with disk storage via the Express server.
// This endpoint is a placeholder for when production file uploads are needed.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.status(501).json({
    error: 'File uploads are not yet supported in production. Use the local dev server.',
  });
}
