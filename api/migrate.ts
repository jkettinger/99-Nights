import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import pool from './_db.js';

async function ensureMigrationsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function runMigrations(): Promise<string[]> {
  await ensureMigrationsTable();

  const [rows] = await pool.execute('SELECT filename FROM migrations');
  const applied = new Set((rows as Array<{ filename: string }>).map(r => r.filename));

  const migrationsDir = path.resolve(process.cwd(), 'server/db/migrations');
  const files = await readdir(migrationsDir);
  const pending = files.filter(f => f.endsWith('.sql') && !applied.has(f)).sort();

  if (pending.length === 0) return [];

  const results: string[] = [];

  for (const filename of pending) {
    const sql = await readFile(path.join(migrationsDir, filename), 'utf-8');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.execute('INSERT INTO migrations (filename) VALUES (?)', [filename]);
      await conn.commit();
      results.push(filename);
    } catch (err) {
      await conn.rollback();
      throw new Error(`Migration "${filename}" failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      conn.release();
    }
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.MIGRATION_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'MIGRATION_SECRET is not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  if (authHeader.slice(7) !== secret) {
    res.status(401).json({ error: 'Invalid migration secret' });
    return;
  }

  try {
    const applied = await runMigrations();
    res.json({
      message: applied.length === 0 ? 'No pending migrations' : `Applied ${applied.length} migration(s)`,
      applied,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Migration failed',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
