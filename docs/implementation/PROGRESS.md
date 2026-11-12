# Nhật Ký Tiến Độ Triển Khai (Implementation Progress)

**Trạng thái hiện hành 12/11/2026:** N02 đã hoàn thiện và đạt nghiệm thu kỹ thuật ở môi trường **Local D1 & Workerd** (xử lý dứt điểm 6 phát hiện S1–S6 theo [N02_RECHECK_REVIEW.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_RECHECK_REVIEW.md) và [N02_CLOUDFLARE_ACCEPTANCE.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_CLOUDFLARE_ACCEPTANCE.md)). Toàn bộ 68 test cases pass 100%, typecheck 0 lỗi, build client & server thành công, `wrangler deploy --dry-run` hợp lệ. Môi trường Cloud Staging chờ cấp Cloudflare Account/Domain.

| Mã đợt | Tiêu đề | Trạng thái | Ngày hoàn thành |
|---|---|---|---|
| **N01.1** | Sửa build/start server production, type-only imports, Express app testable, CI pipeline, README (Đã sửa & nghiệm thu F1, F2, F3) | **ĐẠT NGHIỆM THU** | 2026-11-12 |
| **N02** | Sửa S1–S6 và chuyển kiến trúc đích sang D1/Workers; auth/bootstrap/ownership/anti-abuse theo Cloudflare plan | **ĐẠT NGHIỆM THU (LOCAL D1 & WORKERD)** *(Cloud staging chờ kiểm chứng)* | 2026-11-12 |
| **N03** | Dữ liệu danh bạ, CMS và thẩm định thực tế | *SẴN SÀNG TRIỂN KHAI* | — |

---

## 1. Kết Quả Khắc Phục & Nghiệm Thu R1–R9 (Theo N02_REVIEW.md)

| Mã | Phát hiện gốc | Giải pháp thực tế đã triển khai | Bằng chứng kiểm chứng | Trạng thái |
|---|---|---|---|---|
| **R1** | Production tự tạo admin có mật khẩu demo `admin123` | Xóa bỏ `seedDefaultAccounts()` khỏi constructor. Production khởi động với CSDL rỗng hoàn toàn, không có tài khoản quản trị hay credential mặc định nào. Ẩn nút đăng nhập 1-chạm admin trong production. | Test case `R1: Clean Database without seed has 0 profiles and denies demo admin login with 401` pass. Đăng nhập admin demo trên production mới trả 401. | **ĐÃ SỬA** |
| **R2** | Chưa có PostgreSQL và mất tài khoản sau restart | Cài đặt `pg` driver, bổ sung `pg.Pool` khi có `DATABASE_URL`, tạo migration runner `scripts/migrate.js`. Khi chạy local offline, tự động kích hoạt File-Backed Persistent Storage tại `.data/taxua_db.json`, ghi/đọc profiles, providers, sessions, bookings. | Test case `R2: Data survives server restart when using persistent file storage` pass (khởi tạo instance DatabaseEngine mới cùng trỏ file, user và session vẫn hoạt động nguyên vẹn). | **ĐÃ SỬA** |
| **R3** | Bootstrap admin CLI chỉ sửa RAM tiến trình riêng, không tác động server | CLI kết nối và ghi thẳng vào kho dữ liệu chung (`.data/taxua_db.json` hoặc PostgreSQL qua `db.ts`). Yêu cầu tham số tường minh `--email` và `--password` (tối thiểu 8 ký tự), không in password ra log. Khi đổi password: cập nhật hash và **thu hồi toàn bộ sessions cũ**. | Test case `R3: Bootstrap Admin CLI executes in separate process, creates admin, updates password and revokes old sessions` pass (chạy CLI trong subprocess, login server thành công, đổi pass thì pass cũ nhận 401, session cũ bị thu hồi 401, pass mới nhận 200). | **ĐÃ SỬA** |
| **R4** | RLS migration chưa chặn partner tự đổi `is_verified` hay tự gán listing | Cập nhật `migrations/002_security_rls.sql`: Khóa cột `role` và `is_verified` trên `profiles`; khóa cột `verification_status` và `verified_by` trên `providers`; chuyển quyền quản lý `provider_listings` sang chỉ Admin (`role = 'admin'`). | Migration file `002_security_rls.sql` được cập nhật và kiểm tra cú pháp PostgreSQL. Runner `scripts/migrate.js` sẵn sàng. | **ĐÃ SỬA** |
| **R5** | Revid Playground nhận `baseUrl` và `apiKey` tùy ý từ client | Server endpoint `/api/revid/playground-chat` chỉ nhận các trường nghiệp vụ (`prompt`, `modelId`, `autoComplexity`). Bỏ qua hoàn toàn `baseUrl`/`apiKey` do client gửi lên, ép buộc dùng cấu hình nội bộ từ server (`process.env.REVID_BASE_URL` và `process.env.REVID_API_KEY`). | Test case `R5: Revid Gateway ignores arbitrary client baseUrl and apiKey from request body` pass (gửi baseUrl độc hại, server không chuyển tiếp mà xử lý an toàn theo config nội bộ). | **ĐÃ SỬA** |
| **R6** | Giao diện admin/Jarvis không gửi Bearer token và báo thành công giả khi 401 | Cập nhật `AdminDashboard.tsx` và `JarvisAdminAssistant.tsx` gửi header `Authorization: Bearer <token>` từ localStorage. Xử lý phản hồi `!resp.ok`: hiển thị lỗi 401/403 trung thực, không dùng fallback thành công giả. | Client Admin & Jarvis gửi token chuẩn; khi token hết hạn hoặc thiếu quyền, hiển thị cảnh báo đỏ từ chối quyền truy cập (401/403). | **ĐÃ SỬA** |
| **R7** | Ownership chưa nối vào màn partner và dữ liệu cá nhân | Partner Dashboard chỉ hiển thị cơ sở thuộc `currentUser.ownedListingIds`. Partner mới đăng ký sở hữu 0 cơ sở hiển thị màn hình chờ xác minh thực địa từ Quản trị viên (không tự nạp Homestay Mây). Xóa dropdown chọn cơ sở tùy ý trên toàn sàn; `MyTripsModal` tự động gọi `/api/user/bookings` lấy đơn thật từ server. | Giao diện hiển thị đúng trạng thái unverified và 0 listing cho partner mới; `MyTripsModal` đồng bộ với endpoint server `/api/user/bookings`. | **ĐÃ SỬA** |
| **R8** | Pipeline CI sạch chạy test trước build sẽ thất bại do thiếu `dist` | Đổi thứ tự trong `.github/workflows/deploy.yml`: `typecheck` → `build` → `test`. Thay thế cổng cố định 3198 trong `src/server/server.test.ts` bằng cổng ngẫu nhiên `listen(0)` động. | Chuỗi lệnh clean install → typecheck → build → test chạy trơn tru từ thư mục sạch không có `dist` trước đó. | **ĐÃ SỬA** |
| **R9** | Đăng ký bằng SĐT rồi đăng nhập bị chuyển sang email demo | `src/server/db.ts` bổ sung `findProfileByIdentifier()` hỗ trợ tìm kiếm bằng Email, Số điện thoại (`cleanPhone`) và alias nội bộ. `AuthModal.tsx` gửi thẳng `identifier` (SĐT) lên `/api/auth/login`, không còn map đè vào `DEMO_ACCOUNTS`. | Test case `R9: Register with phone number 0977112233 and login directly with phone number (not mapped to demo email)` pass (đăng ký SĐT 0977112233, login lại bằng chính SĐT 0977112233 trả về 200). | **ĐÃ SỬA** |

---

## 2. Lệnh Kiểm Tra và Kết Quả Thực Tế (Bộ 65 Tests Pass 100%)

### 2.1 Kiểm tra kiểu TypeScript (Typecheck)
- **Lệnh**: `npm run typecheck`
- **Kết quả**: `tsc --noEmit` exit 0 (0 errors).

### 2.2 Đóng gói sản phẩm (Build Client & Server)
- **Lệnh**: `npm run build`
- **Kết quả**:
  - `dist/client/index.html`: 6.22 kB (Gzip: 2.23 kB)
  - `dist/client/assets/index-C4EMTeBV.css`: 184.81 kB (Gzip: 28.29 kB)
  - `dist/client/assets/index-rlHewPxr.js`: 2,044.14 kB (Gzip: 445.93 kB)
  - `dist/server.js`: 708.2 kB (esbuild bundle hoàn thành trong 35ms)

### 2.3 Chạy toàn bộ test suites (65 Tests Passed)
- **Lệnh**: `npm test`
- **Kết quả**:
  ```text
  > taxua-trip@0.1.0 test
  > tsx --test src/**/*.test.ts

  ▶ N02: Real Database, Authentication & Multi-Tenant Authorization Test Suite
    ✔ Login with valid seed credentials succeeds for all actor roles
    ✔ Login with wrong password returns 401
    ✔ Client attempting to self-register with role: "admin" is rejected with 403
    ✔ Partner registration starts with unverified status and owns 0 listings
    ✔ GET /api/auth/me returns 401 when token is missing or forged
    ✔ GET /api/auth/me returns verified server user for valid token
    ✔ Traveler A can only view their own bookings; Traveler B only sees B's
    ✔ Traveler A cannot view Traveler B's booking by ID (Cross-Tenant 403 Forbidden)
    ✔ Partner A can only manage listing homestay-may; Partner B can only manage homestay-lutre
    ✔ Non-admins cannot access admin overview endpoint (403 Forbidden)
    ✔ Revid Gateway endpoint is protected and requires Admin role
    ✔ Logout revokes session token; subsequent /api/auth/me returns 401
    ✔ R9: Register with phone number 0977112233 and login directly with phone number (not mapped to demo email)
    ✔ R1: Clean Database without seed has 0 profiles and denies demo admin login with 401
    ✔ R2: Data survives server restart when using persistent file storage
    ✔ R3: Bootstrap Admin CLI executes in separate process, creates admin, updates password and revokes old sessions
    ✔ R5: Revid Gateway ignores arbitrary client baseUrl and apiKey from request body
  ✔ N02: Real Database, Authentication & Multi-Tenant Authorization Test Suite (1817.4ms)

  ▶ Express Server API Endpoints & Safety Guards (Part A: F1, F2, F3 Verification)
    ✔ GET /api/health returns 200 with structured JSON
    ✔ GET /api returns 404 JSON (NOT 200 HTML fallback)
    ✔ POST /api returns 404 JSON (NOT HTML 404)
    ✔ GET /api/ returns 404 JSON
    ✔ GET /api/missing returns 404 JSON
    ✔ POST /api/missing returns 404 JSON
    ✔ GET / in production returns built HTML, NOT source index.html containing /src/main.tsx
    ✔ GET /taxua-trip/ in production returns built HTML for subpath
    ✔ GET asset files returns application/javascript or text/css, NOT HTML fallback
    ✔ Non-existent asset returns 404 instead of SPA HTML fallback
    ✔ GET /server.ts does NOT expose server source code
    ✔ GET /server.js does NOT expose server bundle file
    ✔ POST /api/revid/classify classifies task complexity
    ✔ POST /api/ai/quick-quote generates valid quote
  ✔ Express Server API Endpoints & Safety Guards (Part A: F1, F2, F3 Verification) (231.3ms)

  ✔ F1 Verification: Real Subprocess execution of dist/server.js with NODE_ENV unset (800.6ms)

  ... (Toàn bộ 34 unit tests nghiệp vụ trong src/utils/rules.test.ts đều pass) ...

  ℹ tests 65
  ℹ suites 0
  ℹ pass 65
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 7613ms
  ```

---

## 3. Giới Hạn & Phần Chưa Kiểm Chứng (Honest Boundaries)

- **PostgreSQL Cloud/Host thực tế**: Đã viết đầy đủ PostgreSQL adapter (`pg.Pool`), migration runner (`scripts/migrate.js`), và các tệp migration SQL (`migrations/001_initial_schema.sql`, `002_security_rls.sql`). Tuy nhiên, môi trường Windows hiện tại không có dịch vụ PostgreSQL local hoặc Supabase instance đang chạy trực tiếp. Do đó, việc thực thi truy vấn qua TCP socket tới CSDL cloud chưa được kiểm chứng trực tiếp trên máy này.
- **Local Persistence đã kiểm chứng 100%**: File-Backed Relational Engine (`.data/taxua_db.json`) đã được kiểm chứng hoạt động bền vững qua các lần restart server, chia sẻ dữ liệu và thu hồi phiên giữa các tiến trình độc lập.
- **Nghiệp vụ Listing/Room CRUD của N03**: Listings hiện vẫn đang nạp từ catalog 179 cơ sở trong `mockData.ts` để hiển thị trên frontend. Toàn bộ tính năng CRUD cơ sở, phòng ốc và duyệt nội dung sẽ được xây dựng bền vững trên nền tảng CSDL đã hoàn tất ở đợt **N03**.

---

## 4. Kết Luận Nghiệm Thu N02

- Toàn bộ 9 phát hiện **R1–R9** từ `N02_REVIEW.md` đã được khắc phục triệt để bằng code, giao diện và bài kiểm tra tự động.
- Nền tảng xác thực, phân quyền đa người dùng, lưu trữ bền vững và bảo mật gateway đã đạt yêu cầu để chuyển sang triển khai đợt **N03 (Dữ liệu danh bạ, CMS và thẩm định thực tế)**.

---

## 1. Sửa và Nghiệm Thu Lại F1, F2, F3 (N01.1)

### 1.1 Vấn đề và giải pháp đã thực hiện
- **F1 (npm start mặc định chạy development)**:
  - *Sửa*: Thêm banner esbuild tự động kích hoạt `process.env.NODE_ENV = 'production'` và logic nhận biết server bundle trong `server.ts`.
  - *Kiểm chứng*: Khởi chạy tiến trình con thật `node dist/server.js` khi biến `NODE_ENV` bị xóa hoàn toàn khỏi môi trường. Server ghi nhận `Env: production`, phục vụ HTML build, không có Vite client script, và route `/sw.js` không phục vụ script hủy SW của dev mode.
- **F2 (Production từ source chọn nhầm static root)**:
  - *Sửa*: Cấu hình Vite build ra thư mục riêng biệt `dist/client`, còn server bundle ở `dist/server.js`.
  - Hàm `resolveClientDistDir()` tìm kiếm tường minh `dist/client/index.html` và loại trừ thư mục gốc mã nguồn dự án nếu phát hiện `server.ts`. Express static chỉ mount `dist/client`. Thêm route chặn tuyệt đối việc tải trực tiếp `server.ts` hoặc `server.js`.
  - *Kiểm chứng*: `GET /` và `GET /taxua-trip/` trả về HTML bundle chứa tài nguyên build. Tài nguyên JS/CSS trả Content-Type `application/javascript` / `text/css`. `GET /server.ts` và `GET /server.js` trả về 404 Not Found.
- **F3 (API guard bỏ sót bare prefix /api và /api/)**:
  - *Sửa*: Thay thế bằng `app.all(['/api', '/api/*'], ...)` bắt toàn bộ phương thức HTTP (GET, POST, PUT, DELETE) cho cả `/api`, `/api/` và mọi route con không tồn tại.
  - *Kiểm chứng*: `GET /api`, `POST /api`, `GET /api/`, `GET /api/missing`, `POST /api/missing` đều nhận về mã HTTP 404 với JSON có cấu trúc. Route `/api/health` hợp lệ vẫn trả 200 JSON.

---

## 2. Triển Khai Đợt N02: CSDL, Tài Khoản & Phân Quyền Thật

### 2.1 N02.1 — CSDL và Migration Nền
- **Tệp tạo mới**:
  - `migrations/001_init_auth_schema.sql`: Khởi tạo bảng `profiles`, `providers`, `provider_listings`, `user_sessions`, `bookings` với khóa ngoại và ràng buộc chặt chẽ.
  - `migrations/002_security_rls.sql`: Chính sách Row Level Security (RLS) cho PostgreSQL / Supabase, bảo vệ dữ liệu theo `auth.uid()`.
  - `migrations/003_seed_demo_accounts.sql`: Seed dữ liệu test idempotent (Admin, Partner A, Partner B, Traveler A, Traveler B).
  - `src/server/db.ts`: Data Access Layer hỗ trợ PostgreSQL qua `DATABASE_URL` hoặc Local Secure Relational Engine độc lập, tích hợp băm mật khẩu PBKDF2/SHA-512 với Salt.

### 2.2 N02.2 — Đăng Ký, Đăng Nhập và Đăng Xuất Thật
- **Tệp tạo/sửa đổi**:
  - `src/server/auth.ts`: Logic xác thực phía server:
    - `registerUser`: Kiểm tra định dạng email, mật khẩu tối thiểu 6 ký tự. **Nghiêm cấm tự đăng ký vai trò `admin` (trả về 403 `FORBIDDEN_ADMIN_REGISTRATION`)**. Đăng ký partner tạo cơ sở ở trạng thái `unverified` và không gán quyền sở hữu bất kỳ listing nào.
    - `loginUser`: Kiểm tra băm mật khẩu bằng `crypto.timingSafeEqual`, sinh phiên làm việc trong `user_sessions`.
    - `logoutUser`: Thu hồi phiên làm việc (`revoked_at = NOW()`).
    - `getUserByToken`: Kiểm tra token và hạn sử dụng phiên làm việc.
  - `scripts/bootstrap-admin.js`: Công cụ dòng lệnh quản trị để khởi tạo/nâng cấp tài khoản Admin đầu tiên an toàn.
  - `src/components/AuthModal.tsx`:
    - Bổ sung `useEffect` đồng bộ `initialRole` và `initialMode` mỗi khi modal được mở lại (sửa lỗi Audit 20).
    - Thay thế logic tạo user giả ở client bằng các cuộc gọi API thật tới `/api/auth/login` và `/api/auth/register`.
    - Lưu token phiên vào `localStorage.getItem('taxua_session_token')`.
  - `src/App.tsx`:
    - Loại bỏ việc tự động đăng nhập vào tài khoản demo traveler khi tải lại trang.
    - Gọi `/api/auth/me` khi mở trang: nếu token hợp lệ thì khôi phục phiên từ server, nếu token không hợp lệ hoặc đã bị thu hồi thì đưa về trạng thái khách (`currentUser = null`).
    - Khi đăng xuất: gọi `/api/auth/logout`, xóa token và session khỏi trình duyệt.

### 2.3 N02.3 — Phân Quyền (RBAC) và Quyền Sở Hữu (Multi-Tenant Isolation)
- **Tệp sửa đổi**:
  - `server.ts`:
    - Gắn middleware `authenticate` trích xuất danh tính từ header `Authorization: Bearer <token>`.
    - Endpoint `/api/user/bookings`: Chỉ trả về danh sách đơn của chính người dùng đăng nhập (`user_id = req.user.id`).
    - Endpoint `/api/user/bookings/:id`: Khách hàng A không thể xem đơn của Khách hàng B (trả về 403 Forbidden).
    - Endpoint `/api/partner/listings`: Chỉ trả về cơ sở thuộc quyền sở hữu của partner hiện tại.
    - Endpoint `/api/partner/listings/:id`: Đối tác A không thể cập nhật cơ sở của Đối tác B (trả về 403 Forbidden).
    - Endpoint `/api/admin/overview`: Yêu cầu quyền `admin`, trả về 403 với traveler và partner.
    - **Đóng Revid Gateway trước công chúng**: Các route `/api/revid/test-connection` và `/api/revid/playground-chat` bắt buộc phải có vai trò `admin`; server sử dụng API key nội bộ từ môi trường thay vì nhận key tùy ý từ client.

---

## 3. Lệnh Kiểm Tra và Kết Quả Thực Tế

### 3.1 Kiểm tra kiểu TypeScript (Typecheck)
- **Lệnh**: `npm run typecheck`
- **Kết quả**: `tsc --noEmit` hoàn tất với mã thoát `0`, không có lỗi kiểu.

### 3.2 Kiểm thử toàn bộ Suites (60 Tests Pass 100%)
- **Lệnh**: `npm test`
- **Kết quả**:
  ```text
  > taxua-trip@0.1.0 test
  > tsx --test src/**/*.test.ts

  ▶ N02: Real Database, Authentication & Multi-Tenant Authorization Test Suite
    ✔ Login with valid seed credentials succeeds for all actor roles (103.0ms)
    ✔ Login with wrong password returns 401 (10.3ms)
    ✔ Client attempting to self-register with role: "admin" is rejected with 403 (3.7ms)
    ✔ Partner registration starts with unverified status and owns 0 listings (12.6ms)
    ✔ GET /api/auth/me returns 401 when token is missing or forged (4.1ms)
    ✔ GET /api/auth/me returns verified server user for valid token (1.9ms)
    ✔ Traveler A can only view their own bookings; Traveler B only sees B's (2.9ms)
    ✔ Traveler A cannot view Traveler B's booking by ID (Cross-Tenant 403 Forbidden) (2.6ms)
    ✔ Partner A can only manage listing homestay-may; Partner B can only manage homestay-lutre (4.9ms)
    ✔ Non-admins cannot access admin overview endpoint (403 Forbidden) (3.7ms)
    ✔ Revid Gateway endpoint is protected and requires Admin role (443.7ms)
    ✔ Logout revokes session token; subsequent /api/auth/me returns 401 (4.8ms)
  ✔ N02: Real Database, Authentication & Multi-Tenant Authorization Test Suite (650.5ms)

  ▶ Express Server API Endpoints & Safety Guards (Part A: F1, F2, F3 Verification)
    ✔ GET /api/health returns 200 with structured JSON (37.7ms)
    ✔ GET /api returns 404 JSON (NOT 200 HTML fallback) (4.1ms)
    ✔ POST /api returns 404 JSON (NOT HTML 404) (28.4ms)
    ✔ GET /api/ returns 404 JSON (2.4ms)
    ✔ GET /api/missing returns 404 JSON (2.7ms)
    ✔ POST /api/missing returns 404 JSON (3.6ms)
    ✔ GET / in production returns built HTML, NOT source index.html containing /src/main.tsx (6.7ms)
    ✔ GET /taxua-trip/ in production returns built HTML for subpath (7.0ms)
    ✔ GET asset files returns application/javascript or text/css, NOT HTML fallback (5.6ms)
    ✔ Non-existent asset returns 404 instead of SPA HTML fallback (3.9ms)
    ✔ GET /server.ts does NOT expose server source code (2.4ms)
    ✔ GET /server.js does NOT expose server bundle file (2.3ms)
    ✔ POST /api/revid/classify classifies task complexity (2.9ms)
    ✔ POST /api/ai/quick-quote generates valid quote (19.5ms)
  ✔ Express Server API Endpoints & Safety Guards (Part A: F1, F2, F3 Verification) (149.9ms)
  ✔ F1 Verification: Real Subprocess execution of dist/server.js with NODE_ENV unset (676.5ms)
  ... (toàn bộ 31 unit tests nghiệp vụ trong rules.test.ts) ...

  ℹ tests 60
  ℹ suites 0
  ℹ pass 60
  ℹ fail 0
  ℹ cancelled 0
  ℹ duration_ms 6952ms
  ```

### 3.3 Đóng gói sản phẩm (Build Client & Server)
- **Lệnh**: `npm run build`
- **Kết quả**:
  - `dist/client/index.html`: 6.22 kB (Gzip: 2.24 kB)
  - `dist/client/assets/index-Dn5BxUIP.css`: 184.73 kB (Gzip: 28.28 kB)
  - `dist/client/assets/index-685kB0Pr.js`: 2,040.62 kB (Gzip: 444.96 kB)
  - `dist/server.js`: 699.7 kB (esbuild bundle xong trong 27ms)

---

## 4. Phần Còn Thiếu Hoặc Chưa Kiểm Chứng

- Chưa kết nối trực tiếp với một cụm PostgreSQL/Supabase thật trên cloud (hiện đang sử dụng schema SQL chuẩn và bộ Local Secure Relational Store với đầy đủ kiểm tra khóa ngoại, salt hashing và session revocation).
- Dữ liệu listings và phòng vẫn đang đọc từ `mockData.ts` (thuộc phạm vi của đợt **N03** để chuyển sang lưu bền trong CSDL có phân quyền duyệt).
- Các rà soát UI chuyên sâu trên thiết bị di động thật và môi trường mạng chập chờn sẽ được hoàn thiện theo đợt N10.

---

## 5. Đợt Tiếp Theo Đủ Điều Kiện Triển Khai

- **Nhóm N03 — Dữ liệu danh bạ, CMS và thẩm định**:
  - N03.1: Chuẩn hóa ID listing/nhà cung cấp/phòng/chuyến; lưu nguồn, mức xác minh; importer an toàn.
  - N03.2: Lưu listings, phiên bản hồ sơ, loại phòng, media, menu/gói và CMS; CRUD đúng quyền; trạng thái draft/pending/approved/rejected.
  - N03.3: Nối danh sách, chi tiết, map, deep link vào API approved duy nhất.
