import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'db', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const [rows] = await pool.execute('SELECT filename FROM migrations');
  return new Set((rows as Array<{ filename: string }>).map(r => r.filename));
}

async function getPendingMigrations(applied: Set<string>): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter(f => f.endsWith('.sql') && !applied.has(f))
    .sort();
}

export async function runMigrations(): Promise<string[]> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const pending = await getPendingMigrations(applied);

  if (pending.length === 0) {
    return [];
  }

  const results: string[] = [];

  for (const filename of pending) {
    const filePath = join(MIGRATIONS_DIR, filename);
    const sql = await readFile(filePath, 'utf-8');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      await conn.commit();
      results.push(filename);
    } catch (err) {
      await conn.rollback();
      throw new Error(
        `Migration "${filename}" failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      conn.release();
    }
  }

  return results;
}
