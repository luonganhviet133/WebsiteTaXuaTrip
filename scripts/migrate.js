/**
 * PostgreSQL Database Migration Runner (R2, R4)
 * Runs all .sql files in migrations/ sequentially in an ACID transaction.
 * Usage:
 *   node scripts/migrate.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.resolve(projectRoot, 'migrations');

const databaseUrl = process.env.DATABASE_URL;

async function runMigrations() {
  if (!databaseUrl) {
    console.log('ℹ️  DATABASE_URL chưa được cấu hình. Hệ thống hiện đang chạy Local Persistent Storage Engine.');
    console.log('Để chạy migrations trên PostgreSQL thật:');
    console.log('1. Cài đặt PostgreSQL local (hoặc Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -d postgres:16)');
    console.log('2. Đặt biến DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taxuatrip" trong .env');
    console.log('3. Chạy lại: node scripts/migrate.js');
    process.exit(0);
  }

  console.log(`🚀 Bắt đầu thực thi migrations tới: ${databaseUrl.replace(/:[^:]+@/, ':****@')}`);
  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Đã kết nối thành công tới PostgreSQL.');

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`📄 Đang chạy migration: ${file}...`);
      const sql = fs.readFileSync(path.resolve(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`   ✔ Hoàn thành: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`   ✖ Lỗi migration ${file}:`, err.message);
        throw err;
      }
    }
    console.log('🎉 Toàn bộ migrations đã được thực thi thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối CSDL hoặc chạy migration:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigrations();
