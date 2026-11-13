/**
 * R3 — Đổi một bản sao lưu D1 (thư mục tải từ R2 `taxua-trip-private/backups/d1/<bản>/`) thành tệp .sql.
 *   npx tsx scripts/d1-backup-to-sql.ts <thư-mục-bản-sao-lưu> > restore.sql
 *   npx wrangler d1 create taxua-trip-restore-test
 *   npx wrangler d1 execute taxua-trip-restore-test --remote --file restore.sql
 * Luôn khôi phục vào cơ sở dữ liệu MỚI rồi đối chiếu, không ghi đè production. Xóa restore.sql sau khi xong.
 */
import fs from 'node:fs';
import path from 'node:path';
import { backupToSql } from '../src/server/backup/restore.ts';

const dir = process.argv[2];
if (!dir || !fs.existsSync(path.join(dir, 'manifest.json'))) {
  console.error('Cách dùng: npx tsx scripts/d1-backup-to-sql.ts <thư-mục có manifest.json, schema.sql, data/>');
  process.exit(1);
}
process.stdout.write(backupToSql((rel) => fs.readFileSync(path.join(dir, rel), 'utf8')));
