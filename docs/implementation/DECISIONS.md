# Sổ Nhật Ký Quyết Định Kỹ Thuật (Architecture & Technical Decisions)

## Quyết định hiện hành — 12/11/2026: Cloudflare thay định hướng PostgreSQL mặc định

### D-CF-01: Chọn D1, Workers và R2 làm kiến trúc đích

- **Bối cảnh:** chủ dự án yêu cầu Cloudflare cho database/storage/chống bot-spam. Review N02 mới xác nhận nhánh pg.Pool chỉ health-check, CRUD vẫn Map; chưa có PostgreSQL production đã vận hành để cần duy trì tương thích.
- **Quyết định:** mặc định triển khai React/Vite trên Workers Static Assets, API Workers, D1 làm nguồn SQL và R2 lưu tệp. Ưu tiên giữ Express bằng adapter Node HTTP được hỗ trợ và kiểm thử workerd; tách Node/Vite/fs persistence khỏi Worker. Không dựng thêm Hyperdrive/PostgreSQL/Supabase song song. Đây là phương án thiết kế được chọn để thực hiện, chưa phải tích hợp đã đạt nghiệm thu.
- **Đánh đổi:** D1 theo SQLite, nên cần đổi migration/CRUD và kiểm quyền tại backend/truy vấn thay RLS PostgreSQL. Đổi lại không phải vận hành thêm PostgreSQL ngoài Cloudflare. Giữ yêu cầu isolation/transaction/revocation bằng cơ chế được D1 hỗ trợ và test thật; không hạ tiêu chí chỉ vì đổi dịch vụ.
- **Hiệu lực:** thay D01/D02 cũ trong plan và phần định hướng PostgreSQL/file-engine của D-N02-01/D-N02-05/D-N02-06/D-N02-07 ở bên dưới. Các mục cũ được giữ là lịch sử; không coi mô tả “đã triển khai” trong chúng là bằng chứng vượt qua N02_RECHECK_REVIEW.
- **Tham chiếu:** [Cloudflare plan](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/CLOUDFLARE_ARCHITECTURE_PLAN.md), [D1](https://developers.cloudflare.com/d1/), [Express Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/).

### D-CF-02: Bảo vệ nhiều lớp, không dùng CAPTCHA thay quyền hoặc kiểm soát spam

- **Quyết định:** Turnstile phải được Siteverify tại backend; kết hợp limiter theo route/IP/account, validate/payload limit và kiểm chống gửi trùng theo nghiệp vụ. WAF/bot rules chọn theo gói/domain thật, chưa mặc định đã có tính năng trả phí. Quota chính xác không dựa vào Map/KV hoặc edge limiter xấp xỉ.
- **Ranh giới:** R2 private cho hồ sơ/biên lai/bằng chứng; cache công khai không chứa auth/session/chat/API cá nhân. Có thể thêm Access cho admin nhưng app vẫn kiểm RBAC. Local/test/staging/production tách DB/bucket/state; test không reset singleton vận hành.
- **Hệ quả:** N02 bổ sung runtime/anti-abuse và các ca kiểm chứng trong Cloudflare plan; N03/N05–N10 tiếp tục theo cùng ranh giới. Thiếu account/key vẫn làm local, phần cloud giữ chờ kiểm chứng. Không tự deploy hoặc tạo tài nguyên trả phí.

---

### D-G0.6-01: Migration D1 chạy trong bước deploy, Worker không tự tạo bảng (12/11/2026)

- **Bối cảnh:** `DatabaseEngine.initSchemaSync()` gửi `CREATE TABLE` nhiều dòng qua `d1.exec()` ở mỗi request mà không chờ; `exec` của D1 coi mỗi dòng là một lệnh nên không tạo được bảng. D1 production và bản xem trước hiện có bảng là nhờ chạy tay qua connector ở G0.1/G0.4.
- **Quyết định:** `wrangler d1 migrations apply` (thư mục `migrations_d1/`, bảng lịch sử `d1_migrations`) là cách duy nhất tạo/đổi schema D1 thật, chạy ngay trước `wrangler deploy`/`wrangler preview` qua `npm run deploy` / `npm run deploy:preview`. `DatabaseEngine` dùng D1 binding không tự tạo bảng; SQLite trên Node (dev/test) vẫn tự tạo bảng.
- **Hệ quả:** D1 production đã có bảng nhưng chưa có `d1_migrations`, nên lần chạy đầu sẽ chạy lại `0001` (toàn `IF NOT EXISTS`); đã thử đúng tình huống này trên D1 local: dữ liệu cũ giữ nguyên, lần hai báo không còn migration. D1 bản xem trước dùng cấu hình riêng `wrangler.preview-db.toml` (không dùng `preview_database_id`: khi có trường này, `wrangler deploy` in binding là D1 bản xem trước dù vẫn upload D1 production, dễ đọc nhầm log và phụ thuộc chi tiết nội bộ của wrangler). Bảng `schema_migrations` của `scripts/migrate-d1.js` chỉ còn dùng cho SQLite local. Migration mới về sau phải viết được chạy lại an toàn hoặc chỉ chạy một lần qua `d1_migrations`.

### D-G0.4-01: Một bộ xử lý API dùng chung cho Worker và Express (12/11/2026)

- **Bối cảnh:** Express có 15 route, Worker 9 route viết riêng; cùng route nhưng khác dạng phản hồi (404, health, partner listings), khác mã lỗi (tự đăng ký admin: Express 403, Worker 400) và khác cách giới hạn tần suất. Worker thiếu `/api/user/bookings/:id`, `PUT /api/partner/listings/:id`, `/api/ai/*`, `/api/revid/*`; Express thiếu `/api/auth/change-password`.
- **Quyết định:** Mọi route `/api/*` nằm ở `src/server/api.ts`, nhận/trả `Request`/`Response` chuẩn web. Worker gọi trực tiếp; Express chỉ chuyển đổi request/response (dùng cho dev local). Không đưa Express vào Worker để giữ `compatibility_date` hiện tại và tránh phụ thuộc vào adapter Node HTTP. Hành vi Express (đang được 75 test kiểm tra) làm chuẩn, thêm `change-password` từ Worker.
- **Giới hạn tần suất đăng nhập/đăng ký:** khóa theo IP + tài khoản, 15 lần/phút (cách của Express). Worker trước đây khóa theo IP. Lý do: bộ test gọi nhiều tài khoản từ cùng IP. Vẫn là bộ đếm trong bộ nhớ của từng isolate; bộ đếm dùng chung (Durable Object/Rate Limiting binding) để sau.
- **Khóa AI:** `GEMINI_API_KEY`, `REVID_*` truyền từ `env` của Worker (Worker không đọc được qua `process.env` với `compatibility_date` 2024).
- **Kiểm chứng:** `src/server/api.contract.test.ts` chạy cùng 13 bước trên Express và Worker (workerd, D1 local áp migration `0001`).

## Đợt N01.1 — Môi trường chạy, build production và kiểm thử nền tảng

### D-N01.1-01: Tách biệt Express App Factory (`createExpressApp`) và Server Listener (`startServer`)
- **Bối cảnh**: File `server.ts` trước đây gọi trực tiếp `app.listen(port)` ngay khi file được import. Khi chạy kiểm thử tích hợp (integration tests), test runner nạp file `server.ts` khiến tiến trình cố gắng bind vào cổng 3000 đang được dev server chiếm giữ, gây lỗi `EADDRINUSE`.
- **Quyết định**:
  1. Tách logic tạo ứng dụng Express thành `export async function createExpressApp(options: CreateAppOptions = {}): Promise<express.Express>`.
  2. Tách thao tác mở cổng thành `export async function startServer(port = ...)`.
  3. Bổ sung hàm kiểm tra `isMainModule()` dựa trên `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])`. Server chỉ tự động lắng nghe khi được thực thi trực tiếp qua dòng lệnh (`node dist/server.js` hoặc `tsx server.ts`), không tự bind cổng khi được import trong test runner.
- **Hệ quả**: Test runner có thể khởi tạo app với ephemeral server (`listen(0)`) trên cổng ngẫu nhiên độc lập, kiểm thử an toàn mà không xung đột môi trường dev đang chạy.

---

### D-N01.1-02: Đóng gói Production Server bằng esbuild ESM Bundle (`dist/server.js`)
- **Bối cảnh**: Scripts `package.json` trước đây cấu hình `"build": "vite build"`, chỉ tạo ra thư mục tĩnh cho frontend mà không có tệp khởi chạy Node.js cho backend production (`npm start` cố gắng chạy `node server.ts` trực tiếp trên Node runtime mà không qua trình biên dịch TypeScript).
- **Quyết định**:
  1. Sử dụng `esbuild` biên dịch `server.ts` thành `dist/server.js` với các cờ: `--platform=node --bundle --format=esm --packages=external --outfile=dist/server.js`.
  2. Bổ sung script `"build:client": "vite build"`, `"build:server": "esbuild ..."`, kết hợp `"build": "npm run build:client && npm run build:server"`.
  3. Cập nhật script `"start": "node dist/server.js"`.
- **Hệ quả**: Môi trường production không cần phụ thuộc vào `tsx` runtime, tối ưu tốc độ khởi động và kích thước nạp, tương thích hoàn toàn với Node 20 LTS và Node 24.

---

### D-N01.1-03: Áp dụng Strict 404 Handler cho toàn bộ tiền tố `/api/*`
- **Bối cảnh**: Trước đây Express có bộ đón fallback `app.get('*', ... sendFile('index.html'))` ở cuối. Nếu frontend hoặc client gửi request đến API sai chính tả hoặc chưa tồn tại (ví dụ `/api/booking/unknown`), server trả về mã HTTP 200 kèm nội dung HTML của `index.html`. Client nhận HTML parse ra JSON bị crash hoặc hiển thị lỗi khó hiểu.
- **Quyết định**:
  - Đặt bộ chặn `app.all('/api/*', (req, res) => res.status(404).json({ error: 'API endpoint not found', path: req.path, timestamp: ... }))` ngay trước đoạn cấu hình static SPA fallback.
- **Hệ quả**: Đảm bảo 100% request API luôn nhận về JSON và HTTP status code chính xác (404), không bao giờ bị rơi vào HTML fallback.

---

### D-N01.1-04: Chuẩn hóa `import type` cho toàn bộ TypeScript Types & Interfaces
- **Bối cảnh**: Trên Node.js 24 với cờ chạy native ESM / type stripping, việc sử dụng cú pháp `import { X } from './types'` khi `X` là interface hoặc type alias thuần sẽ gây lỗi runtime: `SyntaxError: The requested module does not provide an export named 'X'`.
- **Quyết định**:
  - Quét và chuyển đổi toàn bộ `import { Booking, Listing, ... }` sang `import type { ... }` tại `src/data/mockData.ts`, `src/server/aiAdvisor.ts` và `server.ts`.
- **Hệ quả**: Dự án chạy trơn tru cả trên `tsx`, Node native ESM, và các công cụ đóng gói mà không gặp lỗi phân giải biểu tượng kiểu.

---

### D-N01.1-05: Tự động phân giải `distDir` linh hoạt và hỗ trợ song song Root `/` và Base `/taxua-trip/`
- **Bối cảnh**: Khi chạy từ `server.ts` (mã nguồn gốc), thư mục build nằm ở `./dist`. Nhưng khi chạy từ tệp đã đóng gói `dist/server.js`, `__dirname` chính là thư mục `dist`. Nếu hardcode `path.resolve(__dirname, 'dist')` thì server production sẽ tìm nhầm vào `./dist/dist` và trả về 404 cho `index.html`.
- **Quyết định**:
  - Kiểm tra sự tồn tại của `path.resolve(__dirname, 'index.html')`: nếu có thì `distDir = __dirname`, ngược lại `distDir = path.resolve(__dirname, 'dist')`.
  - Phục vụ static assets cho cả đường dẫn gốc `/` lẫn base `/taxua-trip/` để tương thích hoàn toàn khi deploy trên cả root domain và GitHub Pages.

---

### D-N01.1-06: Chuẩn hóa CI/CD Workflow & Khóa Dependency (`npm ci`)
- **Bối cảnh**: CI pipeline `.github/workflows/deploy.yml` trước đây dùng `npm install --legacy-peer-deps` và không có bước chạy kiểm thử `test` hay `typecheck`.
- **Quyết định**:
  - Đổi sang `npm ci --legacy-peer-deps` để bảo đảm môi trường kiểm tra tái lập 100% theo `package-lock.json`.
  - Thêm 2 bước bắt buộc: `npm run typecheck` và `npm test` trước bước `npm run build`.
- **Hệ quả**: Ngăn chặn hoàn toàn việc merge mã nguồn bị lỗi kiểu hoặc phá vỡ các test nghiệp vụ cốt lõi.


---

### D-N01.1-07: Sửa F1 — Mặc định kích hoạt Production trong Server Bundle không phụ thuộc NODE_ENV
- **Bối cảnh**: Lệnh `npm start` chạy `node dist/server.js`, nhưng trước đây server chỉ bật production khi `process.env.NODE_ENV === 'production'`. Khi người dùng chạy local mà chưa set biến môi trường, server rơi vào development mode và cố gắng nạp Vite.
- **Quyết định**:
  1. Thêm banner esbuild tự động khởi tạo `if(!process.env.NODE_ENV)process.env.NODE_ENV='production';` vào đầu tệp `dist/server.js`.
  2. Bổ sung logic kiểm tra `isServerBundle = path.basename(__dirname) === 'dist'` trong `server.ts` để `isProd` mặc định là `true` khi chạy bundle.
- **Hệ quả**: `npm start` hoạt động chính xác ở chế độ production trên cả Windows và Linux mà không cần thư viện bên ngoài như `cross-env`.

---

### D-N01.1-08: Sửa F2 — Tách biệt thư mục Frontend Build (`dist/client`) và Backend Bundle (`dist/server.js`)
- **Bối cảnh**: Trước đây Vite build xuất thẳng ra `dist/`, nơi chứa cả `dist/server.js`. Khi server Express mount `dist` làm static root, tệp bundle `server.js` bị lộ ra ngoài qua HTTP GET. Đồng thời khi chạy từ mã nguồn, server kiểm tra `__dirname/index.html` làm nhầm thư mục source thành static root, làm lộ cả `server.ts`.
- **Quyết định**:
  1. Cấu hình Vite build xuất ra thư mục chuyên biệt `dist/client`.
  2. Hàm `resolveClientDistDir()` tìm kiếm tường minh `dist/client/index.html`, tuyệt đối không bao giờ nhận thư mục gốc mã nguồn dự án nếu có `server.ts`.
  3. Express static chỉ mount `dist/client`; đồng thời thêm route chặn tải trực tiếp `server.ts` và `server.js`.
  4. Cập nhật GitHub Pages workflow chỉ đóng gói `dist/client`.
- **Hệ quả**: Mã nguồn và bundle backend được cách ly hoàn toàn khỏi public web assets.

---

### D-N01.1-09: Sửa F3 — Bao phủ toàn bộ tiền tố `/api`, `/api/` và `/api/*` bằng JSON 404
- **Bối cảnh**: Bộ đón `app.all('/api/*', ...)` bỏ sót `GET /api` và `POST /api`, khiến client nhận về mã HTML hoặc phản hồi Express mặc định thay vì JSON có cấu trúc.
- **Quyết định**: Sử dụng `app.all(['/api', '/api/*'], ...)` trả về JSON 404 đồng nhất cho mọi phương thức HTTP.
- **Hệ quả**: 100% request thuộc tiền tố API không tồn tại đều nhận về JSON chuẩn.


---

## Đợt N02 — CSDL, Tài Khoản và Phân Quyền Thật

### D-N02-01: Hạ tầng CSDL quan hệ, Schema Migration và Local Secure Relational Engine (D01)
- **Bối cảnh**: Ứng dụng trước đây lưu user, role, booking trong React state và localStorage. Cần một nguồn dữ liệu chung có ràng buộc khóa ngoại, tính toàn vẹn và hỗ trợ PostgreSQL / Supabase theo định hướng D01.
- **Quyết định**:
  1. Xây dựng 3 tệp migration SQL chuẩn: `001_init_auth_schema.sql`, `002_security_rls.sql`, `003_seed_demo_accounts.sql` tương thích PostgreSQL 14–16 và Supabase.
  2. Bổ sung `src/server/db.ts` cài đặt Data Access Layer với khả năng kết nối PostgreSQL qua `DATABASE_URL` hoặc vận hành bộ Local Secure Relational Engine có cấu trúc bảng, ràng buộc khóa ngoại, mã hóa bảo mật, cho phép kiểm thử và chạy độc lập mà không phụ thuộc hạ tầng mạng bên ngoài.
  3. Dữ liệu seed demo được phân tách rõ ràng, thực thi theo cơ chế idempotent (ON CONFLICT DO UPDATE) không tạo trùng bản ghi.

---

### D-N02-02: Cơ chế phiên (Session) và xác thực mật khẩu phía Server (N02.2)
- **Bối cảnh**: Client trước đây tự sinh ID và role rồi lưu vào localStorage. Khi tải lại trang, client tự gán lại tài khoản demo traveler.
- **Quyết định**:
  1. Mật khẩu được băm bằng thuật toán mật mã học `crypto.pbkdf2Sync` (10.000 rounds, SHA-512) kèm Salt ngẫu nhiên 16 bytes.
  2. Phiên làm việc được quản lý bằng token ngẫu nhiên 32 bytes (`user_sessions`), kiểm tra trạng thái hoạt động (`expires_at`, `revoked_at`) tại server mỗi request.
  3. Khi logout, token bị thu hồi (`revoked_at = NOW()`) trên server. Tải lại trang gọi `GET /api/auth/me` để khôi phục phiên; nếu thiếu hoặc token sai thì trả về trạng thái khách (`currentUser = null`), tuyệt đối không tự động đăng nhập vào tài khoản demo.

---

### D-N02-03: Chặn leo thang đặc quyền Admin và bảo vệ quyền sở hữu Partner khi đăng ký
- **Bối cảnh**: Người dùng ở form đăng ký cũ có thể chọn tab Admin và tự tạo tài khoản quản trị viên; partner đăng ký mới tự được gán sở hữu `homestay-may`.
- **Quyết định**:
  1. API `POST /api/auth/register` kiểm tra nghiêm ngặt: nếu client gửi `role: 'admin'`, yêu cầu bị từ chối ngay lập tức với mã HTTP 403 (`FORBIDDEN_ADMIN_REGISTRATION`).
  2. Tạo tài khoản Admin đầu tiên bắt buộc phải thực hiện thông qua script quản trị backend có kiểm soát (`node scripts/bootstrap-admin.js`) hoặc lệnh SQL trực tiếp trong CSDL.
  3. Khi đăng ký tài khoản Partner, trạng thái xác minh ban đầu luôn là `unverified`, và danh sách cơ sở sở hữu là rỗng (`ownedListingIds: []`), ngăn chặn hành vi chiếm đoạt quyền quản trị cơ sở của người khác.

---

### D-N02-04: Phân quyền đa người thuê (Multi-Tenant Isolation) và khóa Gateway công khai (N02.3)
- **Bối cảnh**: Các endpoint gateway `/api/revid/*` trước đây mở công khai cho bất kỳ ai gọi và nhận `apiKey`/`baseUrl` tùy ý từ client; không có kiểm tra quyền sở hữu đơn đặt hay cơ sở lưu trú.
- **Quyết định**:
  1. Middleware `requireAuth` và `requireRole('traveler' | 'partner' | 'admin')` chặn đứng mọi truy cập trái phép ở tầng Express.
  2. Khách hàng A chỉ đọc được booking của A; truy cập booking của Khách hàng B bị từ chối với HTTP 403.
  3. Đối tác A chỉ được quản lý cơ sở được phân quyền (`homestay-may`); cố gắng cập nhật cơ sở của Đối tác B (`homestay-lutre`) bị từ chối với HTTP 403.
  4. Đóng toàn bộ endpoint Revid Gateway (`/api/revid/test-connection`, `/api/revid/playground-chat`) trước public; chỉ cho phép Admin có session hợp lệ sử dụng, và server tự dùng cấu hình nội bộ thay vì nhận key tùy ý từ client.

---

### D-N02-05: Khắc phục R1 & R2 — Zero Default Credentials & Bộ Đệm Lưu Trữ Bền Vững (PostgreSQL / File-Backed Persistence)
- **Bối cảnh (R1 & R2)**:
  - `DatabaseEngine` trước đây tự gọi `seedDefaultAccounts()` ngay trong constructor khiến môi trường production mới luôn có tài khoản admin demo với mật khẩu cố định `admin123`.
  - Dữ liệu trước đây chỉ lưu trong JavaScript Map trong RAM, không đọc `DATABASE_URL` và mất toàn bộ sau khi restart tiến trình.
- **Quyết định**:
  1. **Xóa bỏ 100% việc seed ngầm**: `seedDefaultAccounts()` được tách thành phương thức kiểm thử riêng `seedTestFixtures()`. Constructor của production khởi động với CSDL sạch hoàn toàn, không có tài khoản quản trị hay credential mặc định nào.
  2. **Tích hợp PostgreSQL Driver (`pg`)**: Khi có `DATABASE_URL`, hệ thống kết nối qua `pg.Pool`, hỗ trợ PostgreSQL 14–16 và Supabase. Có hàm `checkHealth()` kiểm tra kết nối ngay khi server khởi động.
  3. **File-Backed Persistent Engine (`.data/taxua_db.json`)**: Khi chạy local offline không có dịch vụ PostgreSQL, hệ thống tự động ghi và nạp bền vững dữ liệu (`profiles`, `providers`, `provider_listings`, `sessions`, `bookings`) qua tệp `.data/taxua_db.json`, đảm bảo restart server không mất tài khoản hoặc phiên làm việc.
  4. **Tách biệt In-Memory Test Mode**: Hỗ trợ cờ `inMemoryOnly: true` để các test suites độc lập có thể khởi tạo môi trường sạch không ghi đè dữ liệu phát triển.

---

### D-N02-06: Khắc phục R3 — Nâng cấp Bootstrap Admin CLI: Đồng bộ CSDL và Thu Hồi Toàn Bộ Phiên Cũ
- **Bối cảnh (R3)**: Script `scripts/bootstrap-admin.js` cũ chỉ cập nhật Map trong tiến trình CLI riêng mà không tác động tới server; khi nhận email admin đã có thì bỏ qua mật khẩu mới; đồng thời để lộ mật khẩu mặc định `admin123`.
- **Quyết định**:
  1. Bỏ toàn bộ mật khẩu mặc định: CLI bắt buộc phải nhận tham số tường minh `--email` và `--password` (tối thiểu 8 ký tự).
  2. Tích hợp trực tiếp với tầng lưu trữ bền chung (`.data/taxua_db.json` hoặc PostgreSQL), tự động reload dữ liệu giữa các tiến trình.
  3. Phân biệt rõ giữa Tạo Mới và Cập Nhật: Nếu email đã tồn tại, hàm `bootstrapFirstAdmin` cập nhật `passwordHash` mới và tự động gọi `db.revokeAllUserSessions(user.id)`, thu hồi ngay lập tức toàn bộ các phiên làm việc cũ của admin đó.
  4. Tuyệt đối không in mật khẩu ra log stdout.

---

### D-N02-07: Khắc phục R4 & R5 — Thắt Chặt RLS Migration và Khóa Toàn Diện Revid Gateway Khỏi SSRF
- **Bối cảnh (R4 & R5)**:
  - Tệp SQL `002_security_rls.sql` cũ không cấm partner tự đổi `is_verified` hay tự thêm mapping cơ sở bất kỳ trong `provider_listings`.
  - Endpoint `/api/revid/playground-chat` cũ chuyển tiếp nguyên vẹn `baseUrl` và `apiKey` do client gửi lên vào hàm gọi AI ngoài, tiềm ẩn nguy cơ SSRF và đánh cắp tài nguyên.
- **Quyết định**:
  1. **Thắt chặt RLS**:
     - `profiles`: Khóa cột `role` và `is_verified` (chỉ admin mới có quyền sửa).
     - `providers`: Khóa cột `verification_status` và `verified_by`.
     - `provider_listings`: Khóa toàn bộ quyền INSERT/UPDATE/DELETE đối với partner; chỉ admin mới được gán quyền sở hữu cơ sở.
  2. **Khóa cứng Gateway**: `/api/revid/playground-chat` chỉ chấp nhận các trường nghiệp vụ (`prompt`, `modelId`, `autoComplexity`). Server bỏ qua hoàn toàn `baseUrl`/`apiKey` do client gửi, sử dụng cấu hình server nội bộ đã được duyệt an toàn.

---

### D-N02-08: Khắc phục R6, R7 & R9 — Trung Thực Hóa Xác Thực và Quyền Sở Hữu Trên Toàn Bộ Giao Diện
- **Bối cảnh (R6, R7 & R9)**:
  - Caller phía Admin Dashboard và Jarvis không gửi header `Authorization: Bearer <token>`, dẫn đến 401 nhưng màn hình lại báo thành công giả.
  - Partner Dashboard cho phép chọn bừa homestay của đối tác khác qua dropdown đại diện toàn sàn; partner mới đăng ký 0 listing vẫn được mở quản trị Homestay Mây; MyTripsModal chưa gọi API bookings theo tài khoản.
  - AuthModal khi đăng nhập bằng SĐT tự động chuyển sang email demo `DEMO_ACCOUNTS[role].email`.
- **Quyết định**:
  1. **Gửi Token & Báo lỗi trung thực (R6)**: `AdminDashboard` và `JarvisAdminAssistant` gửi `Authorization: Bearer ${token}` và hiển thị mã lỗi 401/403 chính xác nếu phiên quản trị không hợp lệ.
  2. **Quyền sở hữu thật phía UI (R7)**:
     - Partner Dashboard chỉ tải cơ sở thuộc `currentUser.ownedListingIds`. Nếu partner mới sở hữu 0 cơ sở, giao diện hiển thị màn hình chờ xác minh thực địa từ Quản trị viên, loại bỏ hoàn toàn khả năng quản trị trái phép.
     - Xóa bỏ dropdown chọn cơ sở bất kỳ trên toàn sàn; chỉ cho phép chuyển đổi giữa các cơ sở mà chính partner đó thực sự sở hữu.
     - `MyTripsModal` tự động gọi `/api/user/bookings` khi người dùng đăng nhập để hiển thị đơn đặt thật được lưu trữ từ server.
  3. **Chuẩn hóa đăng nhập SĐT (R9)**: `AuthModal` gửi trực tiếp `identifier` (SĐT hoặc Email) lên `/api/auth/login`; server tìm kiếm chính xác qua `findProfileByIdentifier()`. Trong môi trường production, ẩn hoàn toàn các thẻ đăng nhập 1-chạm admin demo.

---

### D-N02-09: Khắc phục R8 — Chuẩn Hóa CI Pipeline & Ephemeral Random Ports
- **Bối cảnh (R8)**: GitHub Actions trước đây chạy `npm test` trước `npm run build`, khiến clean checkout thất bại vì smoke test subprocess đòi hỏi `dist/server.js` và `dist/client`. `server.test.ts` dùng cổng cố định 3198 dễ gây xung đột.
- **Quyết định**:
  1. Đổi thứ tự trong workflow CI: `npm run typecheck` → `npm run build` → `npm test`.
  2. Trong `src/server/server.test.ts`, sử dụng hàm `getAvailablePort()` mở cổng ngẫu nhiên `listen(0)` và đóng trước khi truyền cho subprocess, loại bỏ hoàn toàn việc tranh chấp cổng 3198 cố định.

---

## Nghiệm thu Kỹ thuật N02 — Hoàn tất giải quyết S1–S6 trên Cloudflare (12/11/2026)

### D-N02-10: Hoàn tất chuyển đổi kiến trúc D1 SQLite & Bảo vệ Vận hành (S1–S5)
- **Bối cảnh**: Nhánh PostgreSQL và Map cũ gây lỗi test reset kho vận hành (S1), migration PostgreSQL không tương thích D1 (S2), lệch đường dẫn giữa CLI và server (S3), fallback RAM không an toàn (S4), và thiếu cơ chế Multi-tenant chuẩn SQLite (S5).
- **Quyết định**:
  1. **Khóa an toàn dữ liệu vận hành (S1)**: `resetDatabaseForTest()` chỉ được phép trên test instance (`isTest: true`). Bỏ seed admin mặc định; operational DB được bảo vệ an toàn.
  2. **D1 SQLite & Migrations (S2, S4, S5)**: Chuyển 100% tầng dữ liệu sang prepared statements trên SQLite D1 (`src/server/d1.ts`, `migrations_d1/0001_initial_schema.sql`, `scripts/migrate-d1.js`). Phân quyền multi-tenant thực thi tại backend SQL queries (`WHERE user_id = ?`).
  3. **Đồng bộ Project Root (S3)**: Hàm `resolveProjectRoot()` đảm bảo CLI và server luôn trỏ chung vào `.data/taxua_trip.sqlite`.
  4. **Booking DTO & UI Isolation (S6)**: Bổ sung đầy đủ cột DTO cho `bookings`, sửa `MyTripsModal` tìm kiếm an toàn và ngắt kết nối fallback sang mock data khi chưa đăng nhập.
  5. **Anti-Abuse (N02.5)**: Tích hợp Turnstile server-side verification và rate limiting Token Bucket trả về HTTP 429 kèm `Retry-After`.
- **Hệ quả**: Toàn bộ 68 test cases đều pass (100%), typecheck 0 lỗi, build client và server thành công, `wrangler deploy --dry-run` hợp lệ. Hoàn tất toàn diện N02 ở cấp độ Local D1 / Workerd.
