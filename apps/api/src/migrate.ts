import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'sql');

export async function migrate() {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await pool.query(readFileSync(join(dir, f), 'utf8'));
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate()
    .then(() => { console.log('Migraciones aplicadas'); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
