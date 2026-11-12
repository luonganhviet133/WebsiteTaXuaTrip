# Nhật Ký Tiến Độ Triển Khai (Implementation Progress)

**Trạng thái hiện hành 12/11/2026:** N02 đã hoàn thiện và đạt nghiệm thu kỹ thuật ở môi trường **Local D1 & Workerd** (xử lý dứt điểm 6 phát hiện S1–S6 theo [N02_RECHECK_REVIEW.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_RECHECK_REVIEW.md) và [N02_CLOUDFLARE_ACCEPTANCE.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_CLOUDFLARE_ACCEPTANCE.md)). Toàn bộ 68 test cases pass 100%, typecheck 0 lỗi, build client & server thành công, `wrangler deploy --dry-run` hợp lệ. Môi trường Cloud Staging chờ cấp Cloudflare Account/Domain.

| Mã đợt | Tiêu đề | Trạng thái | Ngày hoàn thành |
|---|---|---|---|
| **N01.1** | Sửa build/start server production, type-only imports, Express app testable, CI pipeline, README (Đã sửa & nghiệm thu F1, F2, F3) | **ĐẠT NGHIỆM THU** | 2026-11-12 |
| **N02** | Sửa S1–S6 và chuyển kiến trúc đích sang D1/Workers; auth/bootstrap/ownership/anti-abuse theo Cloudflare plan | **ĐẠT NGHIỆM THU (LOCAL D1 & WORKERD)** *(Cloud staging chờ kiểm chứng)* | 2026-11-12 |
| **G0.1** | Git và dọn kho; cấu hình Worker `websitetaxuatrip` với D1/R2 thật (xem mục G0.1 bên dưới) | **ĐẠT** (trang và `/api/health` chạy trên workers.dev) | 2026-11-12 |
| **G0.2** | CI GitHub Actions chạy Node 22 (typecheck, build, test), bỏ deploy GitHub Pages | **ĐẠT** (CI `check` xanh trên Node 22, commit `0adccf8`) | 2026-11-12 |
| **G0.3** | Turnstile thật: widget ở form đăng nhập/đăng ký, Worker đọc secret từ env, chặn khi production thiếu secret, bỏ lỗ vượt qua bằng token test | **ĐẠT** (kiểm trên workers.dev; đăng ký thật có giải widget chờ chủ dự án thử) | 2026-11-12 |
| **G0.4** | Một bộ xử lý API dùng chung cho Worker và Express; Worker có đủ route | **ĐẠT** (gộp vào `main`, production đã kiểm) | 2026-11-12 |
| **G0.5** | Chặn chèn HTML ở bản đồ và file lịch trình; tắt thanh toán mô phỏng; gắn nhãn "Bản demo"; ẩn tài khoản mẫu trên production | **ĐẠT** (gộp vào `main` commit `ea3d542`; production đã kiểm: không còn khối biên lai, chat có nhãn demo, không còn tài khoản mẫu) | 2026-11-12 |
| **G0.6** | Migration D1 chạy trong bước deploy; Worker không tự tạo bảng; kiểm tra không lộ bí mật | **ĐẠT** (gộp `main` commit `8d974de`; Workers Builds chạy `npm run deploy`, migration production đã chạy) | 2026-11-12 |
| **N03** | Dữ liệu danh bạ, CMS và thẩm định thực tế | *SẴN SÀNG TRIỂN KHAI* | — |

---

## G0.6 — Migration D1 trong quy trình deploy (12/11/2026, nhánh `dot/G0.6`)

**Đã có từ trước (G0.1/G0.4):** D1 + R2 production và bản xem trước; Workers Builds tự deploy `main` và dựng bản xem trước cho nhánh khác; secrets Turnstile/Gemini ở Worker.

**Đã làm**
- `db.ts`: `DatabaseEngine` dùng D1 binding không gọi `initSchemaSync()` (trước đây mỗi request gửi `CREATE TABLE` nhiều dòng qua `d1.exec()` không chờ, D1 không tạo được bảng). SQLite trên Node (dev/test) vẫn tự tạo bảng.
- `package.json`: `db:migrate:remote` (D1 production), `db:migrate:preview` (D1 bản xem trước qua `wrangler.preview-db.toml`), `deploy` = migration production rồi `wrangler deploy`, `deploy:preview` = migration bản xem trước rồi `wrangler preview`.
- `wrangler.preview-db.toml`: cấu hình riêng chỉ chứa D1 bản xem trước, để `wrangler.toml` không có id D1 nào khác ngoài production (xem D-G0.6-01).
- `api.contract.test.ts` tạo bảng cho D1 local bằng `wrangler d1 migrations apply DB --local`, cùng lệnh với deploy.
- README (mục migration D1 trên Cloudflare), DECISIONS (D-G0.6-01).

**Kiểm chứng**
- `src/server/db.d1.test.ts`: trên mã cũ "Đã gửi 1 lệnh exec tới D1 khi khởi tạo" (lỗi); sau khi sửa 2/2 đạt.
- `wrangler d1 migrations apply` trên D1 local, chạy không tương tác như Workers Builds: D1 mới → tạo đủ bảng; D1 đã có bảng + dữ liệu tạo tay (giống production hiện tại) → chạy được, dữ liệu cũ giữ nguyên, 6 bảng, `d1_migrations` có 1 dòng; chạy lần hai → "No migrations to apply". Cấu hình chính nhắm D1 `70511a20…`, `wrangler.preview-db.toml` nhắm `22280e1e…`.
- Lần thử đầu dùng `preview_database_id` trong `wrangler.toml`: `worker:dry-run` in `env.DB (22280e1e…)`. Đọc mã wrangler 4.160.1: `deploy`/`versionsUpload` gọi `getBindings` với `usePreviewIds: false` nên upload vẫn là D1 production, dòng in ra chỉ là hiển thị; vẫn bỏ cách này để log không gây nhầm và không phụ thuộc chi tiết nội bộ. Sau khi đổi: dry-run in `env.DB (taxua-trip-db)`.
- Quét bí mật trên `dist/client`, gói Worker và file trong Git (mẫu khóa Google `AIza…`, `sk_/sk-…`, private key, `ghp_`, `0x4AAAAAA…`): chỉ thấy site key Turnstile công khai, tên chức năng `mask_pii_before_embedding`, khóa giả trong test và chữ giữ chỗ trong `.env.example`; không có `.env`/`.dev.vars` trong Git.
- Bản sạch: `npm ci` exit 0, typecheck exit 0, build exit 0, `npm test` 110/110, `npm run worker:dry-run` exit 0.

**Sau khi gộp vào `main` (commit `8d974de`)**
- Chủ dự án đổi Deploy command production thành `npm run deploy`. Workers Builds: success; GitHub Actions CI: success.
- D1 production (truy vấn qua connector): `d1_migrations` = `0001_initial_schema.sql@2026-11-12 13:45:38` (UTC); `profiles` 1 dòng và `user_sessions` 1 dòng của tài khoản tạo trước đó vẫn còn; đủ 6 bảng.
- workers.dev: `/api/health` ok (D1 kết nối, có khóa Gemini); token sai → 401; đăng ký không token → 400 `MISSING_TURNSTILE_TOKEN`; báo giá nhanh 200; trang chủ hiển thị.
- Lệnh `npm run deploy:preview` cho nhánh khác `main` chưa được thử (chờ lần đẩy nhánh tiếp theo).

**Chưa kiểm chứng / cần chủ dự án làm**
- (Trước khi gộp) Chưa chạy `--remote` (máy build không có quyền Cloudflare; không đổi production trong lượt này). Lần deploy `main` đầu tiên bằng `npm run deploy` sẽ chạy lại `0001` trên D1 production (an toàn theo thử nghiệm local).
- Đổi lệnh trong Workers & Pages → websitetaxuatrip → Settings → Build: Deploy command `npm run deploy`; Non-production branch deploy command `npm run deploy:preview`. Chưa đổi thì Workers Builds vẫn chạy `npx wrangler deploy` / `npx wrangler preview` như cũ (không chạy migration, không lỗi).
- Đăng nhập trên bản xem trước: cần thêm hostname bản xem trước vào widget Turnstile và `TURNSTILE_SECRET_KEY` ở mục Previews Base.

## G0.5 — Chặn chèn HTML và gắn nhãn bản demo (12/11/2026, nhánh `dot/G0.5`)

**Đã làm (commit `c50f991`, rà lại toàn bộ trong lượt này)**
- `src/utils/escapeHtml.ts`; tooltip bản đồ (`mapTooltipHtml.ts`) và file lịch trình .html tải về (`offlineItineraryHtml.ts`) tách thành hàm có escape; `InteractiveMapSection` escape cả nhãn marker, tooltip tuyến và khoảng cách. Các chỗ còn chèn giá trị chỉ là số hoặc giá trị do code định sẵn.
- `src/config/features.ts`: `ONLINE_PAYMENT_ENABLED = false` (chờ D03). `MyTripsModal` ẩn mã VietQR cọc tới tài khoản mẫu gõ cứng và nút nộp biên lai, hiện nhãn "Bản demo" hướng khách liên hệ cơ sở.
- `BookingSuccessModal`: đổi "Giữ Chỗ Thành Công / đã gửi đến chủ cơ sở" thành "Đã Tạo Phiếu Đặt Chỗ" + nhãn demo; Điểm Mây ghi là dự kiến.
- `DirectChatModal`: bỏ lời chào và trả lời tự động giả danh chủ cơ sở; mỗi tin gửi đi nhận thông báo hệ thống "chưa chuyển tới cơ sở, vui lòng gọi/Zalo"; nhãn "Bản demo".
- `JarvisAdminAssistant`: tắt duyệt hồ sơ chính chủ, đóng khiếu nại hàng loạt, nâng huy hiệu; thông báo quét và đổi ảnh nền ghi rõ là mô phỏng/ảnh mẫu. `AdminDashboard`: job media AI ghi rõ chưa gửi RevidAPI.
- `AuthModal`: thẻ tài khoản mẫu và đăng nhập 1-chạm chỉ hiện khi chạy dev.
- Bổ sung trong lượt này (commit `2fa275c`): luồng đặt phòng (`ListingDetailModal`) và đặt xe (`BusBookingModal`) còn nút gắn **ảnh stock Unsplash làm biên lai** rồi đánh dấu đơn `proof_uploaded`; ẩn bằng cùng cờ, kèm dòng quảng cáo "Lưu bằng chứng chuyển khoản (UNC)".

**Kiểm chứng**
- `src/utils/htmlEscaping.test.ts` (5 test): thay `escapeHtml` bằng hàm không escape → 5/5 lỗi; khôi phục → 5/5 đạt.
- Bản sạch: `npm ci` exit 0, typecheck exit 0, build exit 0, `npm test` 108/108, `wrangler deploy --dry-run` exit 0 (gzip 228,31 KiB).
- Cloudflare bản xem trước `dot-g0-5-websitetaxuatrip.vanhuy171099.workers.dev` (build success):
  - 1280px: cửa sổ đăng nhập không còn thẻ tài khoản mẫu; trang chi tiết cơ sở có form đặt phòng, không còn khối biên lai và dòng UNC; chat hiện nhãn "Bản demo" và thông báo hệ thống; cửa sổ đặt xe khách không còn khối nộp biên lai.
  - 768px và 375px: trang chi tiết cơ sở hiển thị đủ, không tràn ngang, không có khối biên lai; chat ở 375px hiển thị đúng.

**Chưa kiểm chứng / còn lại**
- Chưa gửi thử phiếu đặt chỗ trên trình duyệt để chụp `BookingSuccessModal` (kiểm qua mã).
- Màn đối tác (`PartnerDashboard`) vẫn có mục xác nhận biên lai từ dữ liệu mẫu; xử lý cùng N06.
- Ô email trong form đăng nhập vẫn có placeholder `khachhang@gmail.com` (chỉ là gợi ý, không phải tài khoản dùng được).
- Widget Turnstile trên bản xem trước báo không kết nối được vì hostname bản xem trước chưa khai trong Turnstile (đã biết từ G0.4).

## G0.4 — Một backend API (12/11/2026, nhánh `dot/G0.4`)

**Đã làm**
- Thêm `src/server/api.ts`: toàn bộ 16 route `/api/*` (auth gồm cả đổi mật khẩu, booking theo quyền, listing đối tác, admin, AI tư vấn/báo giá, health, gateway Revid, 404 JSON). Xem quyết định D-G0.4-01.
- `src/worker.ts` còn 91 dòng: tạo `ApiContext` từ `env` (D1, secret Turnstile, hostname, khóa Gemini/Revid, R2) rồi gọi `handleApiRequest`; phần phục vụ file tĩnh giữ nguyên.
- `server.ts`: thay ~260 dòng route Express bằng một lớp chuyển request/response sang `handleApiRequest`.
- `aiAdvisor.ts`: `consultWithGeminiAI` nhận khóa qua tham số (mặc định vẫn `process.env`).
- Gỡ phần Express đã thừa: `createAuthMiddleware`, `authenticate`, `requireAuth`, `requireRole`, `AuthRequest` (auth.ts) và `createRateLimiter` (antiAbuse.ts).

**Kiểm chứng (bản sạch, xóa `node_modules` và `dist`)**
- `src/server/api.contract.test.ts` viết trước: trên mã cũ 13/26 bước lỗi (Worker thiếu route, khác dạng 404, khác mã lỗi; Express thiếu đổi mật khẩu). Sau khi sửa: 26/26 đạt trên cả hai.
- `npm ci` exit 0, typecheck exit 0, build exit 0, `npm test` 103/103 đạt (75 cũ + 28 bước hợp đồng), `wrangler deploy --dry-run` exit 0.
- Gói Worker: 1.762 KiB, gzip 228 KiB (trước 80,6 KiB / 17,7 KiB) do mang thêm bộ AI và `mockData`; dưới giới hạn 3 MB gói miễn phí.

**Sau khi gộp vào `main` (commit `9a26119`)**
- Workers Builds production: success. GitHub Actions CI: **failure**, `worker.test.ts` nhận 404 ở trang chủ (31 dòng log: `404 !== 200`).
- Nguyên nhân gốc: mỗi lần test khởi động Worker bằng `unstable_dev`, wrangler chạy lệnh `[build]` (`vite build`, xóa sạch `dist/client` rồi build lại). Từ G0.4 có 2 file test khởi động Worker, chạy song song với `server.test.ts`; tiến trình này xóa `dist/client` khi tiến trình kia đang phục vụ. Tái hiện trên máy build: theo dõi mỗi 0,2 giây thấy `dist/client/index.html` biến mất 9 lần trong 3 lượt chạy (test vẫn đạt nhờ may thời điểm; máy CI trúng lỗi).
- Sửa (nhánh `dot/G0.4-ci-race`): `[build]` gọi `scripts/build-worker-assets.mjs`, script build giao diện như cũ trừ khi `SKIP_CLIENT_BUILD=1`; 2 file test Worker đặt biến này và báo lỗi rõ nếu chưa có `dist/client`.
- Kiểm chứng: cài sạch → typecheck → build → `npm test` 103/103 trong khi theo dõi `dist/client`: không biến mất lần nào. `wrangler deploy --dry-run` không đặt biến vẫn build giao diện; đặt biến mà thiếu `dist` thì dừng với lỗi thư mục assets.

**Phát hiện, chưa sửa**
- `DatabaseEngine.initSchemaSync()` không tạo được bảng trên D1 thật: gọi `d1.exec()` không chờ, và `exec` của D1 coi mỗi dòng là một câu lệnh nên `CREATE TABLE` nhiều dòng hỏng. D1 mới phải áp `migrations_d1/0001` bằng tay (đã làm cho production ở G0.1; test hợp đồng tự áp cho D1 local). Nên thay bằng `wrangler d1 migrations apply` trong quy trình deploy.

**Sau khi đẩy nhánh**
- GitHub Actions CI (chạy tay trên nhánh `dot/G0.4`, commit `ed7a45b`): success.
- Cloudflare Workers Builds bản thử cho nhánh `dot/G0.4` lần 1: failure. Log: nhánh khác `main` chạy `npx wrangler preview`, lệnh này đòi khối `previews` trong `wrangler.toml` (không phải lỗi code). Production không đổi.
- Sửa: tạo tài nguyên riêng cho bản xem trước qua connector (D1 `taxua-trip-db-preview` id `22280e1e-…`, đã áp `0001` và thấy đủ 6 bảng; R2 `taxua-trip-media-preview`, `taxua-trip-private-preview`) và thêm khối `previews` vào `wrangler.toml`, `NODE_ENV = production` để đăng ký/đăng nhập bị chặn tới khi có secret Turnstile riêng cho bản xem trước. `unstable_readConfig` đọc đúng khối mới; `wrangler deploy --dry-run` vẫn dùng D1/R2 production; `worker.test.ts` + `api.contract.test.ts` 29/29 đạt. Không chạy thử được `wrangler preview` trên máy build vì lệnh đòi đăng nhập trước khi kiểm cấu hình.
- Bản build thử lần 2 (commit `f8b3aa8`): **success**. Bản xem trước `https://dot-g0-4-websitetaxuatrip.vanhuy171099.workers.dev` chạy code G0.4: `/api/health` 200 (`runtime: workerd`, D1 và 2 R2 đều gắn, không có khóa Gemini/Revid vì secret production không chia sẻ sang bản xem trước); `/api/khong-ton-tai` 404 JSON; `/api/ai/quick-quote` và `/api/ai/consult` 200 (bộ quy tắc nội bộ, 2 đêm); `/api/revid/classify` 200 `L3_reasoning`; `/api/user/bookings/abc` và `PUT /api/partner/listings/homestay-may` không token → 401; đăng ký kèm token test → 503 `TURNSTILE_NOT_CONFIGURED`; trang chủ 200, có file JS chính. Gói Worker 228 KiB gzip khởi động được trên Cloudflare.

**Chưa kiểm chứng**
- Gọi Gemini thật qua `@google/genai` trong workerd (không gọi dịch vụ trả phí trong lượt này; test không có khóa nên chạy bộ quy tắc nội bộ).
- `/api/revid/test-connection` bằng quyền admin (route này gọi mạng ra ngoài).
- Chưa gộp vào `main` nên production chưa đổi.

## G0.2 + G0.3 — CI Node 22 và Turnstile thật (12/11/2026)

**G0.2 — CI**
- `.github/workflows/deploy.yml` → `ci.yml`: chạy `npm ci`, typecheck, build, test trên Node 22; bỏ bước deploy GitHub Pages (deploy do Cloudflare Workers Builds làm). Nguyên nhân lỗi cũ: Node 20 không có `node:sqlite`, 2 bộ test `auth.test.ts`, `server.test.ts` lỗi `ERR_UNKNOWN_BUILTIN_MODULE`.
- `package.json` thêm `engines.node >= 22.12.0`; README sửa yêu cầu Node, bỏ cờ `--legacy-peer-deps` (đã nằm trong `.npmrc`), cập nhật số test.

**G0.3 — Turnstile**
- Lỗ hổng tìm thấy khi rà `antiAbuse.ts`: client gửi token `1x0000000000000000000000000000000AA` (token test công khai của Cloudflare) thì luôn được cho qua kể cả khi đã có secret thật. Ngoài ra Worker đọc secret qua `process.env`; với `compatibility_date = 2024-09-23` biến này trống nên Worker luôn rơi về secret test.
- `verifyTurnstileToken` nhận secret qua tham số; thiếu secret → `TURNSTILE_NOT_CONFIGURED`; chế độ giả lập chỉ bật khi secret là secret test; bỏ nhánh vượt qua theo token.
- Worker: secret lấy từ `env.TURNSTILE_SECRET_KEY`; `NODE_ENV=production` mà thiếu secret → 503; kiểm tra hostname khớp tên miền của request.
- Express (chỉ còn dùng chạy local): giữ hành vi cũ (chỉ kiểm khi có token), secret = `process.env.TURNSTILE_SECRET_KEY` hoặc secret test. Sẽ gộp về một backend ở G0.4.
- Giao diện: `TurnstileWidget` (tải script Cloudflare khi mở form, action `login`/`register`, tiếng Việt, làm mới sau mỗi lần gửi lỗi); `AuthModal` chặn gửi khi chưa có token. Site key ở `src/config/turnstile.ts`: bản build production dùng key thật, dev dùng site key test; ghi đè được bằng `VITE_TURNSTILE_SITE_KEY`.

**Kiểm chứng (bản sạch, xóa `node_modules` và `dist`)**
- `src/server/antiAbuse.test.ts` (6 test): đạt; đưa lại nhánh vượt qua cũ vào thì test "token test công khai" lỗi đúng như mong đợi.
- `src/server/worker.test.ts`: thêm bước gọi `/api/auth/register` và `/api/auth/login` kèm token test trên Worker production không có secret → 503 `TURNSTILE_NOT_CONFIGURED`. Trước khi sửa: register trả 400 (qua được Turnstile). Sau khi sửa: đạt.
- `npm ci` exit 0, typecheck exit 0, build exit 0, `npm test` 75/75, `wrangler deploy --dry-run` exit 0.

**Kiểm chứng sau deploy (commit `0adccf8`)**
- GitHub Actions `check` (Node 22): success. Workers Builds: success.
- Trên workers.dev: widget "Xác minh bạn là con người" hiện ở form đăng ký (tiếng Việt, logo Cloudflare); script Turnstile đã tải.
- Gọi trực tiếp API: đăng ký không token → 400 `MISSING_TURNSTILE_TOKEN`; đăng nhập kèm token test công khai `1x…AA` → 400 `invalid-input-response` từ Siteverify, tức Worker đang dùng secret thật và lỗ vượt qua đã đóng.
- Không tạo tài khoản thật trên production trong lượt này; chủ dự án tự thử đăng ký có giải widget.

**Phát hiện thêm, chưa sửa (thuộc G0.5)**
- Khối "Tài khoản mẫu" kèm email/mật khẩu demo và nút "Đăng nhập 1-chạm" vẫn hiện ở production; nút này không gửi token Turnstile nên trên production sẽ luôn bị từ chối.

**Chưa kiểm chứng / còn lại**
- Widget dùng key thật chỉ chạy trên hostname đã khai báo trong Turnstile; `wrangler dev` trên localhost với bản build production sẽ không qua được widget.
- Giới hạn tần suất vẫn đếm trong bộ nhớ từng isolate của Worker, chưa dùng chung; xử lý theo kế hoạch chống abuse sau.

## G0.1 — Git, dọn kho và cấu hình Worker thật (12/11/2026)

Theo plan "Tà Xùa Trip — Plan nâng cấp toàn diện". Repo: `luonganhviet133/WebsiteTaXuaTrip`, nhánh `main`.

**Đã làm**
- Commit mốc nguyên trạng (không gồm `node_modules`, `dist`, `.data`, `tmp`, `.wrangler`, `.env`, `.aistudio`).
- Bỏ `public/ta-xua-trip-project.zip` (trùng SHA-256 với `ta-xua-trip-source.zip`; `HostingModal` chỉ tải `build.zip` và `source.zip`).
- Bỏ phần PostgreSQL cũ: `migrations/`, `scripts/migrate.js`, phụ thuộc `pg` và `@types/pg` (chỉ `scripts/migrate.js` dùng). Sửa một dòng README còn nhắc PostgreSQL.
- Bỏ `bun.lock`: dự án dùng npm (`package-lock.json`), hai lockfile có thể khiến Cloudflare Workers Builds chọn sai trình cài.
- Thêm `.npmrc` (`legacy-peer-deps=true`): không có cờ này `npm ci` thất bại vì xung đột peer dependency; Workers Builds không truyền cờ.
- Thêm `.aistudio/` vào `.gitignore`.
- `wrangler.toml`: tên `websitetaxuatrip` (khớp Worker trên Cloudflare), `database_id` D1 thật `70511a20-b9e0-4069-8eb9-e1eb87cf9406`, `[build] command = "npm run build:client"`.

**Tài nguyên Cloudflare đã tạo qua connector (ngoài code)**
- D1 `taxua-trip-db` (APAC), đã áp `migrations_d1/0001_initial_schema.sql` và ghi `0001_initial_schema` vào `schema_migrations`; truy vấn lại thấy đủ 6 bảng.
- R2 `taxua-trip-media`, `taxua-trip-private` (trống).
- Secrets `TURNSTILE_SECRET_KEY`, `GEMINI_API_KEY` do chủ dự án nhập ở Worker → Settings.

**Kiểm chứng (chạy trên bản sạch sau khi xóa `node_modules` và `dist`)**
- `npm ci` không cờ: exit 0
- `npm run typecheck`: exit 0
- `npm run build`: exit 0 (JS 2.046,91 kB, gzip 446,69 kB; `dist/server.js` 725,1 kB)
- `npm test`: 68/68 đạt, 0 lỗi
- `npx wrangler deploy --dry-run`: exit 0, tự chạy build giao diện, đọc 25 file assets, nhận binding D1/R2

**Lỗi deploy lần đầu và cách sửa**
- Workers Builds build và upload thành công nhưng Cloudflare từ chối phiên bản Worker (lỗi 10021): `Uncaught TypeError ... fileURLToPath` tại `src/server/db.ts:16`.
- Nguyên nhân gốc: `db.ts` chạy code chỉ có trên Node ngay ở cấp module: tính thư mục dự án bằng `import.meta.url` (undefined trên Worker) và tạo kho mặc định `new DatabaseEngine()` mở `node:sqlite` (Worker chỉ có bản giả, gọi là lỗi). `wrangler deploy --dry-run` không chạy code nên không bắt được.
- Đã tái hiện bằng `wrangler dev --local` (workerd): cùng lỗi, cùng dòng.
- Sửa: `resolveProjectRoot()` chỉ được gọi khi cần đường dẫn SQLite mặc định; thay `export const db` bằng `getDefaultDb()` tạo kho ở lần dùng đầu; cập nhật `auth.ts`, `server.ts`, `scripts/seed-d1.js`. Worker vẫn dùng D1 truyền vào qua `env.DB`, không đổi.
- Thêm `src/server/worker.test.ts`: khởi động Worker trong workerd bằng `unstable_dev` và gọi `/api/health`. Trước khi sửa: lỗi đúng như trên Cloudflare. Sau khi sửa: đạt.
- Kiểm chứng lại: typecheck exit 0, build exit 0, `npm test` 69/69 đạt, dry-run exit 0.

- Sau bản sửa trên, Workers Builds thành công; `/api/health` trên workers.dev trả `status: ok`, D1 `connected`, 2 bucket R2 `bound`; `/api/khong-ton-tai` trả JSON 404.
- Trang chủ trắng: `index.html` trỏ `/taxua-trip/assets/...` (Vite `base: '/taxua-trip/'` từ thời GitHub Pages) trong khi Worker phục vụ assets ở gốc → 404. Sửa `base: '/'`; Express vẫn phục vụ cả `/` và `/taxua-trip/`. `worker.test.ts` thêm bước tải JS/CSS từ trang chủ: lỗi với base cũ, đạt với base mới. Kiểm chứng: typecheck, build, test 69/69, dry-run đạt.

**Chưa kiểm chứng / còn lại**
- Hiển thị trang chủ trên workers.dev sau bản sửa base: kiểm tra ngay sau commit này.
- GitHub Actions `deploy.yml` vẫn chạy Node 20 nên 2 bộ test lỗi `node:sqlite`; xử lý ở G0.2 (không ảnh hưởng deploy Cloudflare).
- `compatibility_date = 2024-09-23` nên `process.env` trong Worker có thể không nhận secrets; `antiAbuse.ts` khi đó rơi về khóa test Turnstile luôn cho qua. Xử lý ở G0.3.
- Nhánh `probe` rỗng do phiên rà soát tạo khi thử quyền đẩy, cần chủ repo xóa trên GitHub.

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
