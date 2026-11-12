# Tà Xùa Trip - Nền Tảng Đặt Phòng & Thông Tin Thẩm Định Thực Tế Tà Xùa

> **Kiến trúc Cloudflare (12/11/2026):** Dự án sử dụng Cloudflare Workers + Static Assets + Cloudflare D1 (SQLite) + R2 + Cloudflare Turnstile & Rate Limiting. Toàn bộ giai đoạn N02 đã được triển khai và nghiệm thu ở môi trường Local D1 & Workerd (đối chiếu S1–S6 tại [N02_CLOUDFLARE_ACCEPTANCE.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_CLOUDFLARE_ACCEPTANCE.md)).

Cổng thông tin và đặt dịch vụ du lịch Tà Xùa (179+ homestay & điểm lưu trú thẩm định thực địa, xe cabin/limousine, thuê xe máy và lịch trình săn mây minh bạch).

## 1. Yêu Cầu Môi Trường

- **Node.js**: `>= 22.12.0` (dev/test dùng `node:sqlite`, Node 20 không có; Vite 8 cũng yêu cầu bản này)
- **NPM**: `>= 10.x`
- **Wrangler**: `^4.x` (đã có trong `devDependencies`)
- Hệ điều hành: Linux / macOS / Windows

## 2. Cài Đặt (Clean Install)

Cài đặt chính xác theo `package-lock.json` để đồng nhất phiên bản dependency:

```bash
npm ci
```

*(Lưu ý: Nếu sử dụng Windows PowerShell khi script execution bị hạn chế, sử dụng `npm.cmd ci` (cờ `legacy-peer-deps` đã nằm trong `.npmrc`))*

## 3. Cấu Hình Môi Trường (.env) & Cơ Sở Dữ Liệu D1

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cấu hình các biến:
- `PORT`: Cổng chạy server local (mặc định `3000`).
- `NODE_ENV`: `development` hoặc `production` (mặc định `npm start` tự kích hoạt `production`).
- `DATABASE_SQLITE_PATH`: Đường dẫn kho SQLite D1 local (mặc định `.data/taxua_trip.sqlite`).
- `TURNSTILE_SECRET_KEY`: Khóa bí mật Cloudflare Turnstile cho máy chủ.
- `GEMINI_API_KEY`: API Key cho Trợ lý AI Google Gemini.
- `REVID_API_KEY`: API Key cho Revid Gateway & Nano Banana (được bảo mật phía server, không nhận URL/Key tùy ý từ client).

### Chạy Migration D1 CSDL:
```bash
npm run db:migrate
# hoặc: npx tsx scripts/migrate-d1.js
```
*Migration runner sẽ tự động quét và áp dụng tuần tự các tệp migration trong thư mục `migrations_d1/` (`0001_initial_schema.sql`) kèm lưu lịch sử vào bảng `schema_migrations`, đảm bảo tính lũy kế an toàn.*

### Migration D1 trên Cloudflare (production và bản xem trước):
Bảng trên D1 thật do `wrangler d1 migrations apply` tạo từ `migrations_d1/`, lịch sử lưu ở bảng `d1_migrations`. Worker không tự tạo bảng.
```bash
npm run db:migrate:remote    # D1 production (database_id trong wrangler.toml)
npm run db:migrate:preview   # D1 bản xem trước (cấu hình riêng wrangler.preview-db.toml)
```
Workers Builds cần dùng các lệnh deploy sau (Workers & Pages → websitetaxuatrip → Settings → Build):
- Deploy command (nhánh `main`): `npm run deploy` = áp migration production rồi `wrangler deploy`.
- Non-production branch deploy command: `npm run deploy:preview` = áp migration bản xem trước rồi `wrangler preview`.

### Khởi tạo Quản trị viên (Bootstrap Admin):
```bash
npm run db:bootstrap -- --email admin@taxuatrip.vn --password "MatKhauBaoMat123!" --name "Super Admin"
```

## 4. Kiểm Thử & Pipeline (Clean CI/CD Pipeline)

Pipeline chuẩn hóa theo đúng trình tự để đảm bảo tính tái lập:
1. `npm run typecheck` (Kiểm tra kiểu TypeScript - 0 lỗi)
2. `npm run build` (Tạo artifact frontend tại `dist/client` và backend tại `dist/server.js`)
3. `npm test` (75 test, dùng CSDL test cô lập; GitHub Actions `.github/workflows/ci.yml` chạy đúng 3 bước này trên Node 22, deploy do Cloudflare Workers Builds đảm nhận)

### Kiểm tra kiểu TypeScript (0 lỗi):
```bash
npm run typecheck
```

### Đóng gói (Build):
```bash
npm run build
```

### Chạy toàn bộ test suites (Đơn vị & Tích hợp Express/D1):
```bash
npm test
```
*Bộ test bao gồm:
- 34 unit tests nghiệp vụ bản địa Tà Xùa (`src/utils/rules.test.ts`)
- 14 kiểm thử F1/F2/F3 và cô lập tài nguyên tĩnh Express (`src/server/server.test.ts`)
- 20 kiểm thử xác thực, phân quyền multi-tenant, Turnstile, Rate limiting, D1 persistence, và cô lập kho vận hành S1 (`src/server/auth.test.ts`)
- 6 kiểm thử Turnstile phía server: thiếu secret, thiếu token, token test công khai, hostname, action (`src/server/antiAbuse.test.ts`)
- 1 kiểm thử khởi động Worker trong workerd: `/api/health`, tải JS/CSS trang chủ, chặn đăng ký/đăng nhập khi production thiếu secret Turnstile (`src/server/worker.test.ts`)*

## 5. Chạy Môi Trường Phát Triển & Cloudflare Workers

### Chạy Express Dev Server:
```bash
npm run dev
```

### Chạy Cloudflare Workers Local (Wrangler Workerd):
```bash
npm run worker:dev
# hoặc kiểm tra artifact build worker:
npm run worker:dry-run
```

Khởi động server phát triển tích hợp Vite HMR:

```bash
npm run dev
```
Truy cập: `http://localhost:3000`

## 6. Đóng Gói & Chạy Production

### Đóng gói cả Frontend và Express Server:
```bash
npm run build
```
- `dist/client/`: Thư mục chứa toàn bộ frontend SPA đã build (`index.html`, `assets/`).
- `dist/server.js`: Server bundle độc lập từ esbuild ESM (được cách ly bên ngoài `dist/client/` để bảo mật mã nguồn backend).

### Khởi chạy Server Production:
```bash
npm start
```
`npm start` mặc định phục vụ ứng dụng ở chế độ production trên cả Windows và Linux mà không bắt buộc người dùng phải gán trước biến `NODE_ENV`. Server phục vụ:
- Giao diện SPA tại root `/` và subpath `/taxua-trip/`
- Chặn nghiêm ngặt các route API không tồn tại (`/api`, `/api/`, `/api/*`) bằng phản hồi JSON 404 có cấu trúc thay vì HTML fallback
- Ngăn chặn truy cập trực tiếp vào các tệp mã nguồn server (`server.ts`, `server.js`)

## 7. Khởi Tạo Tài Khoản Quản Trị Đầu Tiên (First Admin Bootstrap)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Zero Default Credentials**:
- Không tự động tạo tài khoản Admin hay mật khẩu mặc định khi khởi động production (R1).
- Để tạo tài khoản Quản trị viên (Admin) đầu tiên hoặc cập nhật mật khẩu cho tài khoản hiện có, chạy lệnh CLI bootstrap:

```bash
npm run db:bootstrap -- --email admin@taxuatrip.vn --password "MatKhauBaoMat123!" --name "Super Admin"
```

*Đặc tính của lệnh Bootstrap Admin:*
- Đọc và ghi đồng bộ vào cùng kho dữ liệu với server (D1/SQLite local tại `DATABASE_SQLITE_PATH`, mặc định `.data/taxua_trip.sqlite`).
- Không in mật khẩu hoặc thông tin nhạy cảm ra log.
- Nếu tài khoản đã tồn tại: Cập nhật mật khẩu mới và tự động **thu hồi toàn bộ các phiên làm việc (sessions) cũ** của user đó để bảo vệ an toàn.
- Server ngay lập tức nhận diện mật khẩu mới qua cơ sở dữ liệu chung; phiên đăng nhập cũ bị từ chối 401.
