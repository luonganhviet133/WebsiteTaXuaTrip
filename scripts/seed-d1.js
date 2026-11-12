/**
 * Explicit Test & Demo Fixtures Seed for Cloudflare D1
 * Only for test/demo environments!
 * Usage:
 *   npx tsx scripts/seed-d1.js
 */
import { db } from '../src/server/db.ts';

async function seed() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu vào D1 (Chỉ dành cho môi trường dev/demo/test)...');
  // Temporary enable test mode on operational instance for explicit dev seed script
  db.isTestInstance = true;
  await db.seedTestFixtures();
  console.log('✅ Đã nạp thành công các tài khoản thử nghiệm và dữ liệu mẫu.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Lỗi nạp dữ liệu:', err);
  process.exit(1);
});
