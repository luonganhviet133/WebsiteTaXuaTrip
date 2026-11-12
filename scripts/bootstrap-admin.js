/**
 * CLI Script to Bootstrap or Update Administrator Account (R3, S3)
 * Usage:
 *   npx tsx scripts/bootstrap-admin.js --email admin@taxuatrip.vn --password "SecureAdmin123!" --name "Super Admin"
 */
import { bootstrapFirstAdmin } from '../src/server/auth.ts';

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const email = getArg('--email');
const password = getArg('--password');
const fullName = getArg('--name') || 'Super Admin';
const phone = getArg('--phone') || '';

if (!email || !password) {
  console.error('❌ Lỗi: Vui lòng cung cấp đầy đủ tham số --email và --password (tối thiểu 8 ký tự).');
  console.error('Ví dụ: npx tsx scripts/bootstrap-admin.js --email admin@taxuatrip.vn --password "MatKhauBaoMat123!" --name "Super Admin"');
  process.exit(1);
}

async function run() {
  try {
    const admin = await bootstrapFirstAdmin({ email, password, fullName, phone });
    console.log('✅ Đã cập nhật / khởi tạo tài khoản Quản Trị Viên thành công:');
    console.log(`- Email: ${admin.email}`);
    console.log(`- Tên: ${admin.fullName}`);
    console.log(`- Vai trò: ${admin.role} (Đã xác minh: ${admin.isVerified})`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Thao tác quản trị thất bại:', err.message);
    process.exit(1);
  }
}

run();
