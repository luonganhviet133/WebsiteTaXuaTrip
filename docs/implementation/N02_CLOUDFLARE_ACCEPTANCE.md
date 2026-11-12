# Báo cáo nghiệm thu kỹ thuật N02 — Kiến trúc Cloudflare D1 / Workers / Anti-Abuse

**Dự án**: Tà Xùa Trip  
**Thời điểm nghiệm thu**: 12/11/2026  
**Mục tiêu**: Hoàn thiện toàn bộ giai đoạn N02 (Cơ sở dữ liệu D1, Xác thực phiên, Phân quyền Multi-tenant, Chống bot Turnstile & Rate limiting), giải quyết dứt điểm các phát hiện S1–S6 từ `N02_RECHECK_REVIEW.md`.

---

## 1. Bảng đối chiếu giải quyết các phát hiện S1–S6

| Mã | Vấn đề phát hiện trước đó | Giải pháp thực tế đã triển khai | Trạng thái | Bằng chứng kiểm thử |
|---|---|---|---|---|
| **S1** | `auth.test.ts` gọi `resetDatabaseForTest()` trên singleton DB mặc định, xóa nhầm file dữ liệu vận hành `.data` và nạp admin demo. | 1. Tách DB test độc lập (`isTest: true`, SQLite tạm hoặc in-memory `:memory:`).<br>2. Cấm gọi `resetDatabaseForTest()` trên operational instance (ném lỗi `CRITICAL_SECURITY_VIOLATION`).<br>3. Thêm file `.data/` và `.wrangler/` vào `.gitignore`. | **ĐÃ GIẢI QUYẾT** | Subtest `S1: Operational database is protected and never modified by test suite` chạy thành công; tệp `.data/taxua_trip.sqlite` giữ nguyên tính toàn vẹn. |
| **S2** | D1 dùng ngữ nghĩa SQLite nhưng script migration trước đó dùng cú pháp PostgreSQL RLS (`CREATE POLICY`). | 1. Xóa bỏ nhánh PostgreSQL `pg.Pool` và `CREATE POLICY`.<br>2. Soạn migration D1 chuẩn SQLite tại `migrations_d1/0001_initial_schema.sql` với foreign keys, unique constraints và index tối ưu.<br>3. Viết migration runner `scripts/migrate-d1.js` lưu lịch sử trong `schema_migrations`, đảm bảo tính lũy kế (idempotent). | **ĐÃ GIẢI QUYẾT** | Chạy `npm run db:migrate` áp dụng thành công; chạy lần hai exit 0 không lỗi hoặc duplicate data. |
| **S3** | Lệch đường dẫn kho dữ liệu `.data` giữa CLI bootstrap (`scripts/bootstrap-admin.js`) và server bundle `dist/server.js`. | Viết hàm `resolveProjectRoot()` chuẩn hóa đường dẫn dựa trên việc tìm file `package.json` từ thư mục hiện tại lên trên; đồng bộ biến môi trường `DATABASE_SQLITE_PATH`. | **ĐÃ GIẢI QUYẾT** | Test CLI bootstrap trong tiến trình riêng (spawn) tạo admin và đăng nhập ngay qua HTTP server thành công. |
| **S4** | CRUD chuyển đổi Map giả lập; khi DB lỗi vẫn trả success hoặc fallback sang RAM. | 1. Tái cấu trúc `DatabaseEngine` tại `src/server/db.ts` chạy 100% prepared statements async trên D1.<br>2. Bỏ hoàn toàn Map và JSON fallback.<br>3. Health check kiểm tra thực tế bằng `SELECT 1 as alive`, ném lỗi nếu truy vấn thất bại. | **ĐÃ GIẢI QUYẾT** | `checkHealth()` phản hồi đúng trạng thái DB; các truy vấn thất bại ném exception đúng chuẩn. |
| **S5** | Phân quyền multi-tenant bị rò rỉ nếu phụ thuộc vào SQL RLS của PostgreSQL (không hỗ trợ trên SQLite). | Thực thi kiểm soát quyền (RBAC và Multi-tenant) nghiêm ngặt tại tầng backend query (`WHERE user_id = ?`) kết hợp middleware xác thực token phiên SHA-256 (`token_hash`). | **ĐÃ GIẢI QUYẾT** | Khách A và Khách B bị cách ly 100%; Đối tác A không thể chỉnh sửa hoặc xem listing của Đối tác B (HTTP 403 Forbidden). |
| **S6** | Lệch hợp đồng Booking DTO giữa API và `MyTripsModal`: thiếu `listingTitle`, `guestName`, `guestPhone`, `checkInDate`, `checkOutDate` gây crash `TypeError`; hiển thị booking chung khi unauthenticated. | 1. Bổ sung đầy đủ các cột vào bảng `bookings` trong D1 và chuẩn hóa `BookingDTO`.<br>2. Sửa `MyTripsModal.tsx`: bọc an toàn `toLowerCase()` tránh TypeError.<br>3. Tuyệt đối không fallback sang mock bookings khi unauthenticated (HTTP 401); hiển thị màn hình yêu cầu đăng nhập rõ ràng. | **ĐÃ GIẢI QUYẾT** | Tìm kiếm không crash; khách chưa đăng nhập được chuyển hướng đăng nhập; hủy stale request khi đổi phiên. |

---

## 2. Chi tiết triển khai theo các đợt N02.0 – N02.6

### N02.0: Cô lập Test & Bảo vệ Dữ liệu Vận hành
- Đã thêm quy tắc an toàn trong `src/server/db.ts`: `resetDatabaseForTest()` chỉ được phép thực thi khi `this.isTestInstance === true`. Nếu gọi trên operational instance, lập tức ném ngoại lệ `CRITICAL_SECURITY_VIOLATION`.
- Cập nhật `.gitignore` loại trừ các thư mục cục bộ: `.data/`, `.wrangler/`, `.dev.vars`, `tmp/`, `*.sqlite`.

### N02.1: Cloudflare D1 Compatibility & Migrations
- Tạo `src/server/d1.ts`: Triển khai interface `D1Database`, `D1PreparedStatement`, `D1Result` bọc trên `node:sqlite.DatabaseSync` (tương thích 100% với môi trường local Node.js và test runner), kết nối trực tiếp với `env.DB` trên Cloudflare Workers.
- Tạo file migration chuẩn SQLite: `migrations_d1/0001_initial_schema.sql` (bảng `profiles`, `providers`, `provider_listings`, `user_sessions`, `bookings`, `schema_migrations`).
- Viết migration runner `scripts/migrate-d1.js` và seed test `scripts/seed-d1.js`.

### N02.2: Xác thực & Quản trị (Auth, Session, Bootstrap)
- `src/server/auth.ts`: 100% các hàm (`registerUser`, `loginUser`, `logoutUser`, `getUserByToken`, `bootstrapFirstAdmin`, `changeUserPassword`) chuyển sang `async/await` làm việc với D1.
- Mật khẩu được mã hóa an toàn bằng PBKDF2 (10,000 rounds SHA-512 với 16 bytes salt ngẫu nhiên).
- Token phiên được lưu dưới dạng băm SHA-256 (`token_hash`) trong D1 với thời hạn cụ thể (`expires_at`), hỗ trợ thu hồi tức thì (`revoked_at`).

### N02.3: Phân quyền Truy vấn & Hợp đồng UI
- Cách ly hoàn toàn dữ liệu giữa Khách hàng A và B, Đối tác A và B.
- Khóa toàn bộ endpoint quản trị (`/api/admin/*`) với người dùng không mang role `admin`.
- Sửa `MyTripsModal.tsx` và `App.tsx`:
  - Không fallback về mock bookings khi người dùng chưa đăng nhập.
  - Xử lý chuỗi tìm kiếm an toàn (`(b.listingTitle || '').toLowerCase()`).
  - Hỗ trợ AbortController và sequence counter để bỏ qua các phản hồi trễ khi chuyển đổi người dùng.

### N02.4: Runtime Cloudflare Workers & Bảo vệ Static Assets
- Tạo cấu hình `wrangler.toml` định nghĩa:
  - Database binding: `DB` trỏ tới D1.
  - Bucket bindings: `MEDIA_BUCKET` và `PRIVATE_BUCKET` trỏ tới R2.
  - Assets binding: `ASSETS` trỏ tới `./dist/client`.
  - Flags: `compatibility_flags = ["nodejs_compat"]`.
- Tạo entry point `src/worker.ts` phục vụ Cloudflare Workers:
  - Xử lý các route API trực tiếp với `DatabaseEngine({ d1: env.DB })`.
  - Giữ vững quy tắc API JSON 404 cho bare `/api` và các route không tồn tại (Regression F3).
  - Phục vụ Static Assets an toàn; chặn triệt để việc truy cập mã nguồn máy chủ (`/server.ts`, `/src/*`, `.env`).

### N02.5: Anti-Abuse (Cloudflare Turnstile & Rate Limiting)
- Tạo module `src/server/antiAbuse.ts`:
  - Xác thực token Turnstile tại máy chủ với endpoint Cloudflare Siteverify (`https://challenges.cloudflare.com/turnstile/v0/siteverify`), kiểm tra `action` (`login`/`register`), `hostname` và mã lỗi timeout/invalid.
  - Rate limiting theo cơ chế Token Bucket dựa trên IP thật (`cf-connecting-ip`) và định danh tài khoản, trả về HTTP 429 kèm header `Retry-After`.
- Tích hợp gửi `turnstileToken` trong `AuthModal.tsx`.

### N02.6: Kiểm thử Toàn diện & Nghiệm thu
- **Typecheck**: `npm run typecheck` (`tsc --noEmit`) đạt **0 errors**.
- **Build Client**: `npm run build:client` (`vite build`) thành công 100%.
- **Build Server**: `npm run build:server` (`esbuild`) thành công 100%.
- **Wrangler Dry-Run**: `npm run worker:dry-run` (`wrangler deploy --dry-run`) đọc 26 files static assets và xác nhận 5 bindings hợp lệ.
- **Test Suite**: `npm test` (`tsx --test src/**/*.test.ts`) đạt **68/68 passed (100%)**, 0 failures, 0 skipped.

---

## 3. Ranh giới Môi trường (Local vs Cloud Staging)

- **Local D1 & Workerd (ĐÃ ĐẠT)**:
  - Cơ sở dữ liệu SQLite D1 cục bộ chạy hoàn toàn bằng prepared statements.
  - Runner migration, seed fixtures, bootstrap CLI và test suite chạy cô lập 100%.
  - Artifact Worker dry-run kiểm tra binding thành công trên workerd runtime.
- **Cloud Staging (CHỜ KIỂM CHỨNG)**:
  - Triển khai remote lên Cloudflare Dashboard yêu cầu: Cloudflare Account ID, API Token và Custom Domain có thật.
  - WAF và Bot Management Enterprise phụ thuộc vào gói cước Cloudflare thực tế của chủ dự án.
  - Tuyệt đối không tự ý deploy lên production khi chưa được cấp thông tin tài khoản Cloudflare.
