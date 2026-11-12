/**
 * Cloudflare D1 Migration Runner for Tà Xùa Trip
 * Applies SQLite migrations sequentially with version tracking in `schema_migrations`.
 *
 * Usage:
 *   node scripts/migrate-d1.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createD1Database } from '../src/server/d1.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveProjectRoot() {
  let curr = __dirname;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}

const projectRoot = resolveProjectRoot();
const migrationsDir = path.resolve(projectRoot, 'migrations_d1');
const dbPath = process.env.DATABASE_SQLITE_PATH || path.resolve(projectRoot, '.data', 'taxua_trip.sqlite');

export async function runD1Migrations(customDb) {
  const db = customDb || createD1Database(dbPath);

  // Ensure migration tracking table exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  let appliedCount = 0;

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    const alreadyApplied = await db.prepare('SELECT version FROM schema_migrations WHERE version = ?').bind(version).first();

    if (alreadyApplied) {
      continue;
    }

    console.log(`📄 Đang thực thi D1 migration: ${file}...`);
    const sql = fs.readFileSync(path.resolve(migrationsDir, file), 'utf8');

    // Run migration script
    await db.exec(sql);

    // Record migration
    await db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
      .bind(version, new Date().toISOString())
      .run();

    console.log(`   ✔ Hoàn thành: ${file}`);
    appliedCount++;
  }

  if (appliedCount === 0) {
    console.log('✅ Cơ sở dữ liệu D1 đã cập nhật đầy đủ các migrations mới nhất.');
  } else {
    console.log(`🎉 Đã áp dụng thành công ${appliedCount} migration(s) D1!`);
  }

  return { appliedCount };
}

// When executed directly from CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runD1Migrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration D1 thất bại:', err);
      process.exit(1);
    });
}
