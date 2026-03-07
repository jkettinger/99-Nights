import { Router, Request, Response } from 'express';
import { runMigrations } from '../migrate.js';

const router = Router();

router.post('/migrate', async (req: Request, res: Response) => {
  const secret = process.env.MIGRATION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'MIGRATION_SECRET is not configured on the server' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== secret) {
    res.status(401).json({ error: 'Invalid migration secret' });
    return;
  }

  try {
    const applied = await runMigrations();
    if (applied.length === 0) {
      res.json({ message: 'No pending migrations', applied: [] });
    } else {
      res.json({ message: `Applied ${applied.length} migration(s)`, applied });
    }
  } catch (err) {
    res.status(500).json({
      error: 'Migration failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
