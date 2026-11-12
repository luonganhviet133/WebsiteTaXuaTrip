// Lệnh [build] của wrangler.toml: build giao diện vào dist/client trước khi wrangler upload.
// Test đặt SKIP_CLIENT_BUILD=1 để dùng dist/client đã build sẵn: nếu mỗi lần test khởi động Worker
// lại build, Vite xóa dist/client giữa chừng và các file test chạy song song nhận 404.
import { execSync } from 'node:child_process';

if (process.env.SKIP_CLIENT_BUILD === '1') {
  console.log('[build-worker-assets] SKIP_CLIENT_BUILD=1: dùng dist/client có sẵn.');
} else {
  execSync('npm run build:client', { stdio: 'inherit' });
}
