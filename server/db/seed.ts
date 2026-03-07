import bcrypt from 'bcrypt';
import pool from './connection.js';

const SALT_ROUNDS = 12;

async function seed() {
  try {
    const hash = await bcrypt.hash('Winterfell0$', SALT_ROUNDS);

    await pool.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      ['jkettinger', hash]
    );

    console.log('Seed complete: user jkettinger created.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
