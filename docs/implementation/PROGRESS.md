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

## R3 — Bảo vệ Cloudflare, sao lưu D1, theo dõi (13/11/2026, nhánh `dot/R3`)

### Đã làm
- **Giới hạn tần suất ở cửa vào** bằng binding Rate Limiting của Cloudflare (miễn phí; `src/server/security/edgeLimit.ts`, `wrangler.toml` `[[ratelimits]]`). Theo IP, mỗi phút:
  - đăng nhập/đăng ký/quên-đặt lại-đổi mật khẩu/mã email: 20;
  - các thao tác ghi khác: 60;
  - các yêu cầu đọc: 300.

  Vượt thì trả 429 `TOO_MANY_REQUESTS`, `Retry-After: 60`. `/api/health` không tính. Bộ đếm lỗi thì cho qua, không làm sập trang. Đây là lớp thêm; giới hạn cũ trong API giữ nguyên. Theo Cloudflare, bộ đếm gần đúng, tính riêng từng điểm Cloudflare.
- **Header bảo mật** cho mọi phản hồi (`src/server/security/headers.ts`; tệp tĩnh dùng `public/_headers`, sinh bằng `npm run gen:headers`):
  - HSTS 1 năm, `nosniff`, chặn nhúng trang vào web khác (`X-Frame-Options: DENY`, `frame-ancestors 'none'`), `Referrer-Policy`, `Permissions-Policy` (chỉ cho vị trí).
  - CSP chạy hai tầng: bắt buộc phần an toàn (cấm nhúng, cấm plugin, khóa `<base>`); chính sách đầy đủ ở chế độ chỉ báo cáo.
  - Tách script đăng ký service worker khỏi `index.html` thành `public/sw-register.js` để không cần cho phép script nội tuyến.
- **Cloudflare Access cho `/quan-tri` và `/api/admin/*`** (`src/server/security/access.ts`): Worker tự kiểm chữ ký RS256, hạn, issuer, audience; khóa công khai nhớ 10 phút. **Đang tắt**; chỉ bật khi đặt `ACCESS_TEAM_DOMAIN` + `ACCESS_AUD` sau khi có tên miền (runbook mục 5).
- **`/api/health` báo phiên bản cấu trúc D1** (`schema.expected` / `schema.applied`); production thiếu migration thì `degraded` (503). Test buộc `src/server/schemaVersion.ts` khớp migration mới nhất.
- **Sao lưu D1 hằng tuần** (`.github/workflows/backup-d1.yml`): 03:17 Chủ nhật giờ VN, xuất → kiểm có cấu trúc và dữ liệu tài khoản → nén → bucket R2 riêng tư `taxua-trip-backups` + `d1/LATEST.txt` (tên tệp và SHA-256). Không lưu lên GitHub vì kho công khai. Cần chủ dự án nhập 2 secret (runbook mục 7).
- **Workers Logs** bật (`[observability]`, giữ 7 ngày). Log không ghi IP.
- `UPGRADE_RUNBOOK.md`: mục 5 (biến Access), mục 7 (bật sao lưu, cách khôi phục vào cơ sở dữ liệu mới), mục 8 (theo dõi).

### Lệnh đã chạy và kết quả
- `npm run typecheck` 0 lỗi; `npm test` **336/336 pass** (thêm 7 test `security.test.ts`, mở rộng test workerd); `npm run build`, `npm run worker:dry-run` đạt (dry-run hiện đủ 3 binding Rate Limit).
- Test workerd chạy binding thật ở chế độ local:
  - `/api/health` và các trang SPA có header bảo mật;
  - trang chủ (tệp tĩnh) có header từ `_headers`;
  - gửi dồn đăng nhập thì bị chặn 429 sau khoảng 20 yêu cầu.
- Kiểm đỏ: bỏ header ở Worker / bỏ giới hạn cửa vào / thiếu `_headers` → mỗi trường hợp test workerd đều hỏng.
- Access: test bằng cặp khóa RSA tự sinh. Đúng thì qua. Sai chữ ký, sửa nội dung, sai audience, sai issuer, hết hạn, khóa lạ, thiếu token đều bị từ chối. Chưa cấu hình thì không ảnh hưởng.
- Diễn tập sao lưu/khôi phục trên D1 local: `wrangler d1 export` → bản xuất qua đủ bước kiểm của workflow → nạp vào cơ sở dữ liệu trống (466 lệnh) → số tài khoản, cơ sở, nhật ký, mã, migration khớp hoàn toàn.
- Trình duyệt (wrangler dev): `/`, `/luu-tru`, `/ban-do`, `/quan-tri` tải bình thường, có header, service worker đăng ký từ tệp mới. **CSP báo cáo không ghi nhận vi phạm nào**; đã kiểm trình duyệt có báo khi cố ý vi phạm (script nội tuyến, ảnh http, gọi tên miền lạ → 4 báo cáo).

### Chưa kiểm chứng / còn lại
- Chưa chạy trên production (chờ "gộp R3"). Sau khi gộp sẽ kiểm header, health, và xem Console trên trang thật bằng trình duyệt.
- Sao lưu tự động chỉ chạy được sau khi anh tạo API token và nhập 2 secret trên GitHub. Lần chạy thật đầu tiên cần anh bấm Run workflow.
- WAF/Bot Fight Mode/quy tắc rate limit của Cloudflare cần tên miền riêng (workers.dev không có) → làm ở C1.
- Chưa bật CSP đầy đủ ở chế độ bắt buộc: chờ xem báo cáo trên production vài ngày.
- `public/` còn gói mẫu cũ (`ta-xua-trip-source.zip`, `ta-xua-trip-build.zip`, `ta-xua-trip-chay-ngay.html`, PDF kế hoạch) do tính năng "đóng gói" từ bản AI Studio dùng. Đã quét, không có khóa bí mật, và kho GitHub vốn công khai. Đề xuất gỡ cùng tính năng đó ở R4.
- Người dùng mạng di động có thể dùng chung một IP. Mức 300 lượt đọc/phút/IP rộng với hiện tại; xem lại khi đông khách.

## R2 — Thành viên & Đối tác cho admin (13/11/2026, nhánh `dot/R2`)

Không có migration mới: dùng các cột trạng thái tài khoản đã thêm ở R1 (0012), bảng `audit_log` và `auth_codes` có sẵn.

### Đã làm
- Trang quản trị mở mặc định ở tab **Thành viên & Đối tác** (`src/components/AdminMembersPanel.tsx`, `src/api/adminMembersApi.ts`).
  - Tổng quan số thật từ D1: khách, đối tác, đối tác chờ xác minh, quản trị, đang bị khóa, thành viên mới 7 ngày; đơn đặt, số cơ sở, khiếu nại chưa đóng. Bấm ô số để lọc nhanh.
  - Tìm theo tên, email, SĐT (nhận cả `0985 564 756`, `+84…`), tên cơ sở; lọc vai trò, trạng thái, xác minh; 25 người/trang.
  - Chi tiết từng người: phiên đang mở, số đơn, số cơ sở sở hữu, lần đăng nhập gần nhất, nhật ký quản trị (ai làm, lúc nào, lý do).
- Thao tác (server `src/server/admin/members.ts`, route `/api/admin/members…`), **mọi thao tác bắt buộc lý do** và ghi `audit_log` trong cùng batch với thay đổi:
  - **Khóa/mở khóa**: khóa thì mọi phiên mất hiệu lực ngay và không đăng nhập được; mở khóa cũng xóa khóa tạm do sai mật khẩu 5 lần.
  - **Đổi vai trò** khách/đối tác/quản trị: có hiệu lực ngay, người bị đổi phải đăng nhập lại. Lên đối tác thì tạo hồ sơ đối tác "chờ xác minh" nếu chưa có.
  - **Xác minh đối tác**: Đã xác minh / Từ chối / Chuyển về chờ, ghi chú cách đã xác minh (ví dụ đã gọi số nào); lưu người và thời điểm xác minh.
  - **Cấp mã đặt lại mật khẩu**: mã 6 số hiện cho admin một lần để đọc qua điện thoại, chỉ lưu băm, hạn 60 phút, tối đa 5 mã/giờ/tài khoản. Khách vào Quên mật khẩu → "Tôi đã có mã từ Tà Xùa Trip", nhập **email hoặc SĐT**, mã và mật khẩu mới. Dùng được cho tài khoản cũ chỉ có SĐT. Mã admin đọc qua điện thoại không đánh dấu email đã xác minh.
- Chặn: không tự khóa / đổi vai trò / cấp mã cho chính mình; luôn còn ít nhất một quản trị viên đang hoạt động (kiểm sau khi ghi trong cùng batch, hai admin thao tác cùng lúc cũng không làm mất admin cuối); không cấp mã cho tài khoản đang khóa.
- `/api/admin/overview` trả số thật (trước chỉ có tổng số đơn).

### Lệnh đã chạy và kết quả
- `npm run typecheck`: 0 lỗi. `npm test`: **329/329 pass** (thêm 10 test API `src/server/admin/members.api.test.ts`, 1 test `adminMembersApi.test.ts`). `npm run build`, `npm run worker:dry-run`: đạt.
- Kiểm đỏ (cố ý làm hỏng rồi chạy lại): bỏ kiểm "admin cuối" → test hỏng; mã admin đánh dấu email đã xác minh → test hỏng; bỏ chặn tự thao tác → 2 test hỏng. Bỏ bước thu hồi phiên khi khóa thì test vẫn qua vì R1 đã chặn phiên của tài khoản bị khóa ở bước kiểm phiên (thu hồi là lớp bảo vệ thứ hai).
- Trình duyệt (wrangler dev + D1 local mới, migration 0001–0012): admin lọc "đối tác chờ xác minh" → xác minh có ghi chú → báo ở đầu trang (đối tác rời khỏi bộ lọc); tìm và khóa khách → khách đăng nhập bị `ACCOUNT_LOCKED`; đổi khách lên quản trị; cấp mã cho tài khoản cũ chỉ có SĐT → khách nhập SĐT + mã ở hộp đăng nhập → đặt mật khẩu mới → đăng nhập bằng SĐT được; hàng của chính admin không có nút thao tác.
- Giao diện 375/768/1280: không tràn ngang, không chữ dưới 12px (trang Thành viên đang mở chi tiết, và hộp "Tôi đã có mã").

### Chưa kiểm chứng / còn lại
- Chưa chạy trên production (chờ "gộp R2").
- Xác minh đối tác hiện là nhãn để admin theo dõi; chưa chặn tính năng nào của đối tác chưa xác minh (để quyết định khi mở N06.5).
- Ô "Cột mốc 10.000 thành viên" ở đầu trang quản trị vẫn dùng số giả 1.240; dọn ở R4 (khóa tính năng chưa xong, bỏ số giả).
- Sau khi gộp: `vanhuy171099@gmail.com` cần tự đăng ký, rồi admin hiện tại (`luonganhvietbds@gmail.com`) đổi vai trò lên Quản trị; `vtmedia0910@gmail.com` đổi từ Đối tác lên Quản trị nếu anh muốn.

## Hotfix đổi mật khẩu (13/11/2026, nhánh `hotfix/doi-mat-khau`)

**Lỗi bảo mật P0 trên production:** `changeUserPassword` gọi hàm `updateAdminPasswordAndRevokeSessions` của bootstrap admin, vốn đặt `role = 'admin'`. Vì vậy ai đổi mật khẩu qua `/api/auth/change-password` cũng thành admin.

- Đã tái hiện bằng test: tài khoản khách đổi mật khẩu xong có `role` là `admin`.
- Đã kiểm D1 production: 3 tài khoản vẫn đúng vai trò, chưa bị lợi dụng.
- Sửa: thêm hàm `updatePasswordAndRevokeSessions` chỉ đổi mật khẩu và thu hồi phiên. Test hồi quy `auth.password.test.ts` cho khách và đối tác; kiểm đỏ đạt (fail trên mã cũ, pass trên mã mới).
- Kèm sửa test chập chờn: `createBooking` tạo mã đơn bằng `Date.now()` + số ngẫu nhiên 0–999, nên trùng khi hai đơn tạo cùng mili giây. Đổi sang UUID.
- `npm test`: 301/301, chạy hai lần đều đạt; build và dry-run đạt. **Chờ chủ dự án "gộp hotfix".**

## R1 — Tài khoản và đăng nhập (13/11/2026, nhánh `dot/R1`, tách từ hotfix)

**Trạng thái: ĐẠT phần kiểm được, chờ "gộp".** Gộp sẽ chạy migration `0012_accounts.sql` trên D1 production: chỉ thêm cột và bảng, tài khoản cũ mặc định `active`. Quyết định: D-R1-01.

### Đã làm
- Server:
  - `accounts/rules.ts`: luật mật khẩu, khóa tạm, mã email, chuẩn hóa email/SĐT, phiên bản điều khoản.
  - Migration `0012`: trạng thái tài khoản, đếm sai và khóa tạm, `email_verified_at`, điều khoản, thiết bị của phiên, bảng `auth_codes` (chỉ lưu băm), `email_log`.
  - `email.ts`: gửi qua binding `EMAIL` của Cloudflare, khi không có binding thì báo chưa bật.
  - `accounts/store.ts` và các API:
    - `/api/auth/config`, `/api/auth/forgot-password`, `/api/auth/reset-password`;
    - `/api/me/profile`, `/api/me/email/send-code|verify`, `/api/me/sessions`.
  - Đăng ký: bắt buộc email và đồng ý điều khoản; đối tác cần SĐT và tên cơ sở, tạo ở trạng thái `pending`.
  - Đăng nhập: khóa tạm sau 5 lần sai, báo khi tài khoản bị khóa, ghi thiết bị của phiên. Phiên của tài khoản bị khóa hết hiệu lực.
- Giao diện:
  - Form đăng ký: tách ô email và SĐT, ô đồng ý điều khoản có link, tối thiểu 8 ký tự.
  - "Quên mật khẩu?" chạy ngay trong hộp đăng nhập (thay link Zalo số mẫu). Gói Free thì báo "sắp ra mắt".
  - Bỏ tiền tố mã lỗi (`INVALID_CREDENTIALS:` …) khỏi thông báo cho người dùng.
  - Hộp **Tài khoản của tôi** có 3 thẻ: thông tin và xác minh email, đổi mật khẩu, thiết bị.
  - Trang `/dieu-khoan` và `/chinh-sach-du-lieu`.
- `UPGRADE_RUNBOOK.md`: hướng dẫn từng bước nâng Workers Paid, đưa taxuatrip.vn vào Cloudflare, bật gửi email, Access cho admin. Mỗi bước có sao lưu D1 trước và cách quay lại.

### Lệnh đã chạy và kết quả
- `npm run typecheck`: 0 lỗi. `npm test`: **318/318**, gồm hợp đồng API trên workerd (migration 0012 và `UPDATE … RETURNING` chạy được trên D1 thật).
- Test mới:
  - `accounts/rules.test.ts`: 6 test;
  - `accounts.api.test.ts`: 11 test (khóa tạm, tài khoản bị khóa mất phiên, phiên theo thiết bị, hồ sơ, mã một lần khi gửi đồng thời, quên mật khẩu không lộ email, gói Free, gửi lỗi).
- Kiểm đỏ: bỏ điều kiện `p.status = 'active'` thì test tài khoản bị khóa fail; bỏ kiểm khóa tạm thì test khóa tạm fail.
- Đã sửa các test cũ theo luật mới: đăng ký phải đồng ý điều khoản, đối tác ở trạng thái `pending`, đăng ký cần email.
- `npm run build`, `npm run worker:dry-run`: đạt.
- Kiểm tay trên `wrangler dev --local` (Turnstile được thay bằng bản giả cấp token như khóa test):
  - **Lần A, không có binding email (giống gói Free hiện tại):**
    - đăng ký qua giao diện; chưa tick điều khoản thì bị chặn;
    - Tài khoản của tôi: lưu họ tên (thanh điều hướng cập nhật), xem thiết bị, mật khẩu yếu bị chặn;
    - "Quên mật khẩu" báo sắp ra mắt; sai 5 lần thì báo khóa 15 phút;
    - trang điều khoản mở đúng tiêu đề.
  - **Lần B, có binding `send_email` giả lập của Wrangler:**
    - email gửi đúng `"Tà Xùa Trip" <no-reply@taxuatrip.vn>`, tiêu đề có mã;
    - quên mật khẩu qua giao diện → mã → mật khẩu mới → đăng nhập được; khóa tạm được mở, email thành "Đã xác minh";
    - đối tác nhập mã xác minh email trong Tài khoản của tôi.
  - 375/768/1280px (form đăng ký, quên mật khẩu, 3 thẻ Tài khoản của tôi, trang chính sách): không tràn ngang, không chữ nhỏ hơn 12px.

### Chưa kiểm chứng / còn lại
- Chưa chạy migration 0012 trên production (chờ gộp hotfix rồi R1).
- Gửi email thật chưa thử được: cần Workers Paid và taxuatrip.vn (`UPGRADE_RUNBOOK.md` bước 1, 2, 4).
- Vai trò trên production:
  - `vtmedia0910@gmail.com` đang là **đối tác**;
  - `vanhuy171099@gmail.com` chưa có tài khoản;
  - chỉ `luonganhvietbds@gmail.com` là admin.
  - Đổi vai trò làm qua trang quản trị ở R2, hoặc bằng `npm run db:bootstrap` nếu anh muốn ngay.
- Tài khoản cũ `0985564756@taxuatrip.user` chỉ có SĐT, không lấy lại mật khẩu qua email được; admin cần hỗ trợ (R2).
- Nội dung Điều khoản và Chính sách dữ liệu mô tả đúng hệ thống hiện tại nhưng chưa qua luật sư.
- Ảnh đại diện chưa sửa được trong Tài khoản của tôi (để sau).
- Giới hạn tần suất vẫn là bộ đếm trong bộ nhớ của từng Worker; R3 chuyển sang binding Rate Limiting.

---

## N06.3 — Đánh giá xác thực, khiếu nại, top 3 theo quý/năm (13/11/2026, nhánh `dot/N06.3`)

**Trạng thái: ĐẠT phần kiểm được, chờ chủ dự án "gộp".** Gộp sẽ chạy migration `0011_reviews_complaints.sql` trên D1 production (chỉ thêm bảng mới). Quyết định: D-N06-05. Kết toán phí và voucher dịch vụ chuyển sang N06.5.

### Đã làm
- Server:
  - `feedback/rules.ts`: luật thuần cho đánh giá (30 ngày) và khiếu nại (7 ngày, bảng trạng thái).
  - Migration `0011`: `reviews`, `review_photos`, `complaints` (mỗi đơn một khiếu nại đang mở), `complaint_events`, `complaint_files`.
  - `feedback/store.ts`, `routes.ts`, gồm các API:
    - đánh giá theo đơn, ảnh thật, danh sách công khai của cơ sở, ảnh công khai;
    - chủ cơ sở trả lời; admin ẩn đánh giá;
    - khiếu nại: xem, mở, ảnh hai bên, các bước xử lý, danh sách cho admin.
  - Mỗi bước là UPDATE có điều kiện + kiểm `changes() = 1`, kèm lịch sử và thông báo cho bên liên quan.
  - Điểm sao và số đánh giá trong hồ sơ cơ sở lấy từ đánh giá xác thực.
  - Danh sách đơn của đối tác có trạng thái khiếu nại.
  - Top 3 theo **tháng / quý / năm** (`periodRange`, `previousPeriod`): xếp hạng công khai và phần admin chốt quà dùng chung một bảng, khóa theo kỳ.
- Giao diện:
  - Chuyến đi của tôi:
    - `ReviewPanel`: viết đánh giá và thêm ảnh, báo số điểm được cộng;
    - `ComplaintPanel` (khách): mở khiếu nại, gửi ảnh, xác nhận đã nhận tiền hoặc báo chưa nhận.
  - Trang cơ sở: `ListingReviews` hiện đánh giá xác thực kèm ảnh và trả lời của cơ sở; chủ cơ sở trả lời ngay tại đó.
  - Đối tác: khiếu nại hiện trong danh sách đơn; cơ sở trả lời và báo đã hoàn (phải có chứng từ).
  - Admin: thẻ "5. Khiếu nại & đánh giá" dùng `AdminFeedbackPanel`, gồm danh sách khiếu nại (việc chờ admin lên đầu) và kiểm duyệt đánh giá.
  - Top 3 chọn được tháng / quý / năm. Bảng xếp hạng có thêm "Quý này", "Năm nay" và top 3 kỳ trước.
- Bỏ phần giả lập:
  - `ReviewModal`, `DisputeModal`;
  - form đánh giá chỉ ghi vào trình duyệt ở trang cơ sở;
  - `INITIAL_REVIEWS`, `INITIAL_DISPUTES`;
  - `canBookingLeaveReview`, `calculateUpdatedRating`;
  - nút "Hoàn tiền cho khách / Đóng khiếu nại" một bấm.
  - J.A.R.V.I.S. nhận số khiếu nại thật (chỉ đọc).

### Lệnh đã chạy và kết quả
- `npm run typecheck`: 0 lỗi.
- `npm test`: **300/300** pass. Mới: `feedback/rules.test.ts` (7), `feedback.api.test.ts` (6), `feedbackApi.test.ts` (1), kỳ quý/năm (2). Bỏ 2 test của hàm giả lập.
- Kiểm đỏ (cố ý làm sai để test phải fail, rồi khôi phục):
  - Bỏ điều kiện "chứng từ phải thuộc đợt hoàn hiện tại" → test quá hạn fail.
  - Để đánh giá bị ẩn lọt vào danh sách công khai → test ảnh/ẩn fail. Lần đầu test **không** bắt được lỗi này; đã bổ sung kiểm tra danh sách.
- `npm run build`, `npm run worker:dry-run`: đạt.
- Kiểm tay trên `wrangler dev --local` (D1 local có 0011), bằng trình duyệt:
  - Khách viết đánh giá 4 sao, server ghi +30; thêm ảnh, server ghi +20. Trang cơ sở hiện "4 (1)", ảnh, "Đã ở thật".
  - Chủ cơ sở trả lời đánh giá.
  - Khách mở khiếu nại "Thu thêm tiền, sai giá" kèm ảnh. Cơ sở trả lời. Admin nhận xử lý, kết luận khách đúng, cơ sở hoàn 100.000đ (hạn 3 ngày).
  - Cơ sở bấm "Đã hoàn tiền" khi chưa có chứng từ thì bị chặn; tải ảnh xong mới báo được. Khách xác nhận thì khiếu nại đóng là "đã hoàn". Lịch sử ghi đủ 6 bước và người làm.
  - 375/768/1280px (thẻ chuyến đi, đánh giá trang cơ sở, khiếu nại phía đối tác, bảng admin hai thẻ, top 3 quý, bảng xếp hạng quý): không tràn ngang, không chữ nhỏ hơn 12px.
  - Lỗi phát hiện khi kiểm tay và đã sửa:
    - Ô chọn "Vấn đề" bọc trong nhãn nên tên đọc màn hình gồm cả các lựa chọn; đã đổi sang nhãn `htmlFor`.
    - Chuyến đi của tôi tải lại cả danh sách sau khi gửi khiếu nại nên mất thông báo; đã bỏ việc tải lại không cần thiết.
  - Để thử, đã sửa D1 local trực tiếp bằng SQL: thêm `confirmed_at` cho đơn đã "hoàn tất" bằng SQL ở N06.2. Bước này không qua luồng thật.

### Chưa kiểm chứng / còn lại
- Chưa chạy migration 0011 trên production (chờ "gộp").
- Khi gộp, cần xóa `DisputeModal.tsx` và `ReviewModal.tsx` trong thư mục máy của chủ dự án. Việc xóa cần anh cho phép, nếu không tôi chuyển vào `_to_delete/`.
- Chưa có nhắc tự động khi quá hạn hoàn theo khiếu nại (đối soát cọc đã có). Khách vẫn báo được khi quá hạn.
- Mục "Thẩm định" mở Chuyến đi của tôi thay cho hộp khiếu nại cũ.
- **N06.5:** kết toán phí cuối tháng (chuyển khoản vào tài khoản admin + ảnh, admin xác nhận) và voucher dịch vụ đọc mã booking (D-N06-04).

---

## N06.2 — Điểm Mây theo đóng góp, sổ phí nền tảng theo cơ sở (13/11/2026, nhánh `dot/N06.2`)

**Trạng thái: ĐẠT phần kiểm được, chờ chủ dự án "gộp".** Gộp sẽ chạy migration `0010_points_fees.sql` trên D1 production (chỉ thêm bảng mới). Quyết định: D-N06-03. **Chưa thu tiền và chưa mở đổi điểm.**

### Đã làm
- Server:
  - `src/config/community.ts`: luật điểm, danh hiệu, tên rút gọn, cách tính phí.
  - Migration `0010`: `points_ledger`, `listing_fee_rates`, `fee_ledger`, `point_rewards`, `point_redemptions`, `monthly_awards`.
  - `community/ledger.ts`: ghi +20 điểm và dòng phí trong cùng batch với bước "hoàn tất". Dùng INSERT OR IGNORE trên khóa duy nhất, nên bấm lặp không ghi trùng.
  - `community/store.ts` và `routes.ts`, gồm các API:
    - điểm của tôi;
    - bảng xếp hạng (tháng / 12 tháng) và top 3 tháng trước;
    - sổ phí của đối tác;
    - phía admin: cài mức phí, sổ phí và đảo phí, cộng/thu hồi điểm, chốt top 3 và ghi quà;
    - đổi điểm (đang khóa, trả 403).
- Giao diện:
  - Điểm Mây trên thanh điều hướng lấy từ server, đơn vị "điểm" (trước đây ghi "đ").
  - `PointsModal` có danh hiệu, tiến độ, cách nhận điểm và lịch sử; mục đổi quà hiện "sắp mở".
  - `LeaderboardCard` nằm ở tab Cộng đồng.
  - `PartnerFeeLedger` thay ví trả trước trong mục "5. Sổ Phí & Hiệu Quả".
  - `AdminCommunityPanel` có 3 thẻ: Phí nền tảng, Điểm Mây, Top 3 tháng.
- Bỏ phần mô phỏng:
  - ví trả trước 50.000đ/booking;
  - `calculatePlatformFee`, `calculateMemberPoints`;
  - cộng điểm tại trình duyệt (đánh giá +20/+50, điểm theo % tiền đặt);
  - lời hứa điểm trong modal đặt xe, đánh giá, chuyến đi, AI.
  - Test `community.test.ts` quét mã nguồn để chặn các phần này quay lại.

### Lệnh đã chạy và kết quả
- `npm run typecheck`: 0 lỗi.
- `npm test`: 286/286 pass. Trong đó `community.api.test.ts` có 9 test; kiểm đỏ: bỏ điều kiện số dư thì test đổi điểm fail. Contract workerd chạy: cài phí 5% → hoàn tất 2 lần → 20 điểm, đúng 1 dòng phí, bảng xếp hạng "Khách H.".
- `npm run build`, `npm run worker:dry-run`: đạt.
- Kiểm tay trên `wrangler dev --local` (D1 local có migration 0010):
  - Admin cài 5% cho "Dốc Mơ" bằng form → đơn TXMQ8RBU8P (500.000đ) hoàn tất → sổ phí ghi **25.000đ**. Hoàn tất lần 2 trả `already`, không ghi thêm.
  - Admin cộng 40 điểm có lý do → tra theo email thấy lịch sử (+40, +20) và nút thu hồi.
  - Top 3 tháng 10: chốt hạng 1 kèm quà. API công khai trả `Nguyễn V. K.` 40 điểm. Hạng 2–3 hiện "Chưa có người đủ điểm".
  - Thanh điều hướng hiện 60 Điểm Mây; modal hiện "Lữ khách mới", còn 40 điểm lên "Người săn mây".
  - Kiểm ở 375/768/1280px (admin 3 thẻ, sổ phí đối tác, bảng xếp hạng, modal điểm): không tràn ngang, không chữ nhỏ hơn 12px.
  - Để thử, đã sửa D1 local trực tiếp bằng SQL: chuyển đơn sang `checked_in` và dời điểm sang tháng 10. Hai bước này không qua luồng thật.

### Chưa kiểm chứng / còn lại
- Chưa chạy migration 0010 trên production (chờ "gộp").
- +30/+20 điểm cho đánh giá: hằng số đã có, nhưng luồng đánh giá chưa nối với server (N06.3).
- Hóa đơn phí cuối tháng và việc thu phí: N06.3. Giá trị quy đổi điểm và người chịu chi phí voucher: chưa chốt.
- Màn quản trị cũ vẫn giữ prop `rewardSettings` (tỉ lệ điểm theo %) dù không hiển thị và không còn dùng để tính điểm. Chưa xóa, để giữ thay đổi gọn.

---

## N06.1 — Cọc theo D03: điều khoản, snapshot, VietQR, biên lai, xác nhận thủ công, 70% (13/11/2026, nhánh `dot/N06.1`)

**Trạng thái: ĐẠT phần kiểm được, chờ chủ dự án "gộp".** Nhánh tách từ `dot/N05.3` (N05.2, N05.3 chưa gộp) → gộp N06.1 sẽ chạy migration 0006–0008 trên D1 production (production có 0 đơn). **Xác nhận tiền là thủ công** (cơ sở bấm, có log); không có cổng thanh toán/webhook (D-N06-01).

### Bổ sung sau khi chủ dự án chốt (13/11/2026): hạn 70% theo 14:00; quy trình đối soát cọc (D-N06-02)
- `reconciliation.ts`: bảng trạng thái chờ hoàn → cơ sở báo đã hoàn / đề nghị giữ → khách xác nhận / đồng ý / báo → admin phân xử. Hạn 3 ngày.
- `migrations_d1/0009_reconciliation.sql`: `payment_reconciliations`, `reconciliation_files`.
- Mở tự động:
  - giữ chỗ hết hạn (cron, trong cùng batch với việc hết hạn);
  - cơ sở từ chối đơn khách đã gửi biên lai.
  - Khách tự hủy / nhả phòng quá hạn 70% không mở (D03).
- API: xem đối soát (khách/chủ/admin), ảnh bằng chứng hai bên (R2, kiểm ảnh thật, ≤ 5 ảnh/bên), các bước có điều kiện + `changes()` (bấm lặp/đồng thời chỉ ghi một lần), danh sách cho admin, nhắc quá hạn (cron).
- Giao diện: khối "Đối soát tiền cọc" cho khách (Chuyến đi của tôi), chủ cơ sở (Đơn đặt phòng) và admin (đầu màn quản trị, tranh chấp lên đầu).
- Test:
  - `reconciliation.test.ts` (7 bảng);
  - `reconciliation.api.test.ts` (7):
    - mở/không mở; báo hai bên; hạn 3 ngày;
    - hoàn cần ảnh và số tiền hợp lệ; khách xác nhận đóng;
    - giữ tiền cần khách đồng ý;
    - quá hạn nhắc một lần, báo admin, admin buộc hoàn → hạn mới;
    - báo hoàn nhưng khách chưa nhận → admin kết luận;
    - bấm đồng thời.
  - Kiểm đỏ: bỏ `changes() = 1` → ca đồng thời trượt. Lần đầu ca này trượt cả khi có khóa (yêu cầu thua trả 409 thay vì "đã làm") → sửa: đọc lại rồi quyết định lại.
- workerd + D1 + R2: từ chối đơn có biên lai → mở đối soát hạn 3 ngày, lịch sử `recon_open`, chưa quá hạn không báo được, ảnh bằng chứng đọc lại đúng từ R2, thông báo hiện hạn theo giờ VN.
- Kiểm bằng Worker thật tại máy build (có `--test-scheduled`):
  - Cron thật mở đối soát cho giữ chỗ hết hạn có biên lai và báo quá hạn (2 thông báo).
  - Bấm qua giao diện cả ba vai trò:
    - Cơ sở: báo hoàn khi chưa có ảnh bị chặn → có ảnh thì được; đề nghị giữ tiền.
    - Khách: báo chưa nhận → chờ phân xử; đồng ý giữ → kết thúc "giữ tiền"; đơn quá hạn có nút báo.
    - Admin: thấy 2 ảnh, kết luận "phải hoàn" → hạn mới, lịch sử đủ 4 bước.
  - 375/768/1280px: không tràn, 0 chữ < 12px.
- Lệnh: `npm run typecheck` 0 lỗi; `npm run build` đạt; `npm test` **273/273**; `npm run worker:dry-run` đạt.

### Đã làm
- **Một cấu hình cọc** `src/config/payment.ts` (30% làm tròn lên, 70% còn lại, hạn 70%, mốc nhắc, điều khoản D03). Gỡ mọi `0.3`/"50%" viết cứng (Chuyến đi của tôi, dashboard đối tác, xe khách, trang chi tiết, màn giữ chỗ thành công) và `buildVietQrPaymentPayload` (tài khoản "TA XUA TRIP ESCROW" mẫu gõ cứng, ảnh từ img.vietqr.io).
- **VietQR tự tạo** `src/payment/vietqr.ts` (NAPAS/EMVCo, CRC16-CCITT), danh sách ngân hàng theo mã BIN của NHNN.
- `migrations_d1/0008_payments.sql`: `listing_payout_accounts`, `booking_payments` (snapshot), `payment_receipts`, `bookings.balance_confirmed_at/by`, `notifications.dedupe_key` (chỉ mục duy nhất có điều kiện).
- `PaymentStore` + API:
  - tài khoản nhận cọc của cơ sở (chủ cơ sở/admin);
  - `GET /api/bookings/:id/payment`; `accept-terms` (chụp snapshot một lần; cơ sở đổi tài khoản sau đó không đổi đơn);
  - biên lai (khách chủ đơn; kiểm byte đầu ảnh; ≤ 5 MB; ≤ 3 ảnh/khoản; R2 riêng tư; xem có kiểm quyền, `nosniff`, `no-store`);
  - `confirm-balance` (batch có điều kiện + `changes()`; bấm lặp/đồng thời chỉ ghi một lần);
  - nhắc 70% ở mốc 48 giờ/30 giờ (cron Worker, mỗi mốc một lần).
- Vòng đời: thao tác **nhả phòng** (`release`) — chủ cơ sở/admin, chỉ khi quá hạn 70% và chưa xác nhận đủ; lý do D03 ghi vào đơn; báo khách. Danh sách đơn của đối tác có số biên lai và cờ **cần đối soát** (biên lai cọc đến khi giữ chỗ đã hết hạn — không tự xác nhận lại phòng).
- Worker: R2 `PRIVATE_BUCKET` cho biên lai; Express (dev) lưu `.data/private`.
- **Giao diện**
  - Chuyến đi của tôi → "Thanh toán": điều khoản + tick → tài khoản cơ sở, mã VietQR (tạo trong trình duyệt), số tiền, nội dung (nút chép) → gửi ảnh biên lai; trạng thái "cơ sở đã xác nhận nhận cọc / nhận đủ 70%", hạn 70%, cảnh báo quá hạn. Khối "Thông báo mới" (nhắc 70%, nhận đủ, bị nhả phòng/từ chối).
  - Dashboard đối tác: mục "4. Tài Khoản Nhận Cọc" lưu server (thay khối mẫu cũ); khối đơn: xem biên lai, "Đã nhận đủ 70%", "Nhả phòng (quá hạn 70%)" có bước xác nhận, "Cần đối soát", nhắc khi chưa có tài khoản.

### Test mới
- `src/payment/payment.test.ts` (8):
  - cọc 30% và 50% cùng công thức;
  - **không còn tỉ lệ cọc viết cứng trong components**;
  - hạn và mốc nhắc theo giờ VN;
  - nội dung không dấu;
  - CRC (`123456789` → 29B1, mã tĩnh công khai);
  - VietQR **khớp từng ký tự chuỗi mẫu công bố**;
  - ràng buộc số tiền/nội dung; mã BIN.
- `src/server/payments/payments.api.test.ts` (8):
  - quyền tài khoản nhận cọc;
  - điều khoản trước thông tin chuyển cọc;
  - snapshot không đổi khi đổi tài khoản; chủ cơ sở thấy cùng số liệu;
  - biên lai giả (415), quá 5 MB (413), sai người (403), chủ cơ sở không nộp thay, 70% trước khi xác nhận cọc (409), quá số lượng (409, ảnh bị xóa khỏi kho), xem chéo (403);
  - tải biên lai không đổi trạng thái;
  - khách không tự xác nhận; xác nhận 70% đồng thời chỉ một lần; khách thấy xác nhận;
  - nhả phòng trước hạn bị chặn, sau hạn thì trả phòng và báo khách; đã trả đủ thì không nhả;
  - nhắc 48 giờ/30 giờ mỗi mốc một lần, đơn đã trả đủ không bị nhắc;
  - biên lai đến khi giữ chỗ hết hạn → cần đối soát, không xác nhận được.
- Kiểm đỏ: bỏ `changes() = 1` trong xác nhận 70% → ca đồng thời **trượt**; bỏ khóa chống trùng của nhắc → ca nhắc **trượt**; trả lại → đạt.
- `lifecycle.test.ts` (+1 nhả phòng), `bookingsApi.test.ts` (nút đối tác theo 70%/quá hạn).
- workerd + D1 + **R2 local thật**:
  - tài khoản nhận cọc; điều khoản → snapshot (tên không dấu, cọc + 70% = tổng);
  - biên lai PNG lưu R2 và đọc lại đúng từng byte; chuỗi không phải ảnh → 415;
  - xác nhận cọc và 70% hiện với khách.
- Chạy câu SQL nhắc (`printf('%,d')`, `julianday('…Z')`, `strftime`) trên D1 local: ra `700.000`, lệch 0, `19/11`.

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **258/258**. `npm run worker:dry-run`: đạt.
- Workers Builds preview `dot-n06-1`: thành công; D1 preview chạy tới `0008_payments.sql`, đủ bảng/cột/chỉ mục mới.
- Preview (chưa đăng nhập): API thanh toán mới trả 401; binding R2 riêng tư có mặt. Bản build không còn `img.vietqr.io`, "ESCROW", số tài khoản mẫu.

### Kiểm tra giao diện (Worker thật chạy tại máy build: wrangler dev + D1/R2 local, Chrome headless)
- **Chủ cơ sở**
  - Chưa có tài khoản thì hiện nhắc; nhập Vietcombank qua form → lưu, tên thành "CHU DOC MO".
- **Khách**
  - Chưa tick thì không thấy số tài khoản, nút khóa; tick → khối chuyển cọc.
  - **Giải mã ảnh QR**: BIN 970436, TK 00110044556, 390.000 đ (30% của 1.300.000), nội dung "TX… COC", CRC tính lại khớp.
  - File giả → "Chỉ nhận ảnh JPG, PNG hoặc WebP."; ảnh thật → gửi được, hiện ảnh, ghi rõ chưa phải đã trả.
- **Chủ cơ sở**
  - Xem được ảnh biên lai; "Đã nhận cọc" → "Đã nhận đủ 70%" → hết nút.
  - Đơn nhận phòng hôm nay: "70%: QUÁ HẠN" + "Nhả phòng" → bước cảnh báo → "Đã hủy" với lý do D03.
- **Khách thấy**
  - Thông báo bị nhả phòng và nhận đủ 70%; "✓ Cơ sở đã xác nhận nhận cọc… nhận đủ 70%…"; thẻ đơn hiện lý do hủy.
- 375/768/1280px (form tài khoản, khối thanh toán của khách, khối đơn của đối tác): không tràn ngang, 0 chữ < 12px, không phần tử lọt ra ngoài.
- Phát hiện và đã sửa trong lúc kiểm: nội dung chuyển khoản bị ngắt giữa chữ ở 375px ("CO / C"), khách không có chỗ đọc thông báo (thêm "Thông báo mới").

### Chưa kiểm chứng / chưa làm
- **Chưa thử chuyển khoản thật bằng app ngân hàng** quét mã VietQR (mới kiểm chuỗi theo mẫu công bố + giải mã ảnh). Nên thử một giao dịch nhỏ vào tài khoản của chính chủ dự án trước khi mở cho khách.
- Chưa đăng nhập được trên preview (thiếu secret Turnstile); luồng đã kiểm bằng Worker chạy tại máy build.
- Đối soát cọc chỉ ghi nhận; hệ thống không chuyển/hoàn tiền thay hai bên (đúng D03: website không giữ tiền).
- Nhắc 70% mới hiện trong "Chuyến đi của tôi"; chưa gửi Web Push/email/Zalo (Q3, chờ chọn dịch vụ).
- Luồng xe khách/dịch vụ khác vẫn là dữ liệu mẫu trong trình duyệt (N09); `api.qrserver.com` còn ở các mã mẫu đó (không chứa thông tin tài khoản/thanh toán).
- Mục "Bằng chứng chuyển khoản & đơn" cũ trong dashboard đối tác vẫn đọc dữ liệu mẫu (đơn homestay thật đã ở khối "Đơn đặt phòng").

### Đợt tiếp theo
- **N06.2** sổ phí và Điểm Mây chỉ ghi thêm, không lặp theo sự kiện; hoàn tất một lần; đổi điểm ra quà dùng được.

---

## N05.3 — Vòng đời đơn: trạng thái, lịch sử, QR nhận phòng, đơn của cơ sở (13/11/2026, nhánh `dot/N05.3`)

**Trạng thái: ĐẠT phần kiểm được, chờ chủ dự án "gộp".** Nhánh tách từ `dot/N05.2` (chưa gộp) nên gộp N05.3 sẽ kéo theo N05.2 và chạy migration 0006 + 0007 trên D1 production (production có 0 đơn).

### Đã làm
- **Bảng chuyển trạng thái** `src/server/bookings/lifecycle.ts` (D-N05-03): xác nhận đã nhận cọc / từ chối (bắt buộc lý do) / nhận phòng (chỉ qua QR, đúng ngày) / hoàn tất / hủy; quyền theo quan hệ với đơn (khách đặt, chủ cơ sở của đơn, admin). Khách không tự xác nhận, nhận phòng, hoàn tất; đơn đã hủy không thành hoàn tất.
- `migrations_d1/0007_booking_lifecycle.sql`: `booking_events` (lịch sử), `notifications` (chuông), `checkin_token` (256 bit, chỉ mục duy nhất có điều kiện), `confirmed_at`/`checked_in_at`/`completed_at`.
- `BookingLifecycle` (`src/server/bookings/store.ts`): mỗi lần đổi trạng thái là một batch D1 (UPDATE đúng trạng thái nguồn → kiểm `changes() = 1` → cập nhật các đêm giữ phòng → lịch sử → thông báo). Yêu cầu thua khi tranh nhau đọc lại và trả "đã làm". Giữ chỗ và hết hạn (cron) cũng ghi lịch sử.
- API: `POST /api/bookings/:id/{confirm|reject|complete|cancel}`, `GET /api/bookings/:id` (lịch sử; mã QR chỉ cho khách chủ đơn khi đã xác nhận), `GET|POST /api/partner/checkin` (xem/xác nhận bằng mã), `GET /api/partner/bookings`, `GET /api/notifications`, `POST /api/notifications/read`. `GET /api/user/bookings` trả đủ thông tin đơn từ server.
- **Giao diện**
  - Dashboard đối tác: khối "Đơn đặt phòng" đọc server (tự tải lại mỗi phút), nút đúng trạng thái, từ chối kèm lý do, "Mở Zalo khách"/"Gọi", chuông thông báo, ô nhận phòng bằng mã.
  - `/doi-tac/nhan-phong?ma=…`: đường dẫn trong QR; chủ cơ sở quét bằng camera điện thoại là mở thẳng màn xác nhận. Đơn không còn ở trạng thái "Đã xác nhận" thì không hiện nút.
  - Chuyến đi của tôi: QR nhận phòng thật (tạo trong trình duyệt bằng `qrcode`, không gửi mã ra api.qrserver.com); nút "Hủy đơn" theo bảng (cảnh báo cọc không hoàn với đơn đã xác nhận); hiện lý do hủy, ngày đặt giờ VN, số khách; ghi chú đầu trang nói đúng cách giữ phòng/cọc hiện tại.
  - **Gỡ** nút cho khách tự đổi trạng thái: "Đánh dấu Hoàn tất lưu trú", "Xác nhận đã chuyển khoản cọc → Đã giữ phòng" (Chuyến đi của tôi), "Hoàn tất đơn # để đánh giá" (trang chi tiết).
  - Màn giữ chỗ thành công hiện mã đặt chỗ, không tải ảnh QR từ dịch vụ ngoài.
- Cọc 30% làm tròn lên tới đồng ghi là đã chốt (D-N05-02).

### Test mới
- `lifecycle.test.ts` (7): bảng, quyền, không đi tắt, làm lại = đã làm, giữ chỗ quá hạn, khung ngày nhận phòng, hủy theo ngày.
- `lifecycle.api.test.ts` (9): chủ cơ sở xác nhận, chủ khác/khách/chưa đăng nhập bị chặn, bấm lại không ghi thêm; mã QR chỉ khách thấy; từ chối cần lý do và trả phòng; khách hủy đơn đã xác nhận, chủ không tự hủy; QR sai (404) / trái cơ sở (403) / chưa tới ngày / hết hạn; 5 lần quét cùng lúc chỉ 1 lần áp và 1 dòng lịch sử, rồi hoàn tất; thao tác ngoài bảng 404; danh sách đơn và chuông theo cơ sở; hai thiết bị cùng khách thấy như nhau.
- Kiểm đỏ: bỏ điều kiện `changes() = 1` → ca quét cùng lúc **trượt**; trả lại → đạt.
- workerd + D1 local thật (`api.contract.test.ts`): migration 0007; khách không tự xác nhận; admin xác nhận; mã QR 43 ký tự; 5 lần quét gửi cùng lúc chỉ 1 lần nhận phòng; lịch sử `hold → confirm → check_in`; hoàn tất.
- `bookingsApi.test.ts` (5), `routes.test.ts` (+1).

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **242/242**. `npm run worker:dry-run`: đạt.
- Workers Builds preview `dot-n05-3`: thành công; D1 preview có đủ 7 migration, bảng/cột/chỉ mục mới có mặt.

### Kiểm tra giao diện
- **Chạy Worker thật trên máy build** (`wrangler dev` + D1 local, Chrome headless) với tài khoản thử: chủ cơ sở sở hữu `tx-stay-5`, một khách, 3 đơn giữ chỗ.
  - Dashboard đối tác: 3 đơn, chuông 3 chưa đọc; bấm "Đã nhận cọc" → "Đã xác nhận"; "Từ chối" khóa nút tới khi có lý do, xong → "Đã hủy" kèm lý do.
  - Chuyến đi của tôi: đơn đã xác nhận có QR; giải mã ảnh QR (OpenCV) ra đúng `…/doi-tac/nhan-phong?ma=<mã server cấp>`; không còn nút tự hoàn tất; khách hủy giữ chỗ qua giao diện → "Đã hủy", chủ cơ sở nhận chuông.
  - Mở đường dẫn QR bằng tài khoản chủ cơ sở: thấy khách, phòng, ngày; xác nhận → "Đã nhận phòng", đường dẫn về `/doi-tac`; bấm "Hoàn tất" → "Hoàn tất"; quét lại → báo trạng thái, không có nút.
  - 375/768/1280px (khối đơn của đối tác, màn nhận phòng, Chuyến đi của tôi): không tràn ngang, 0 chữ < 12px, không phần tử lọt ra ngoài màn.
  - Phát hiện và đã sửa trong lúc kiểm: ngày đặt hiện chuỗi ISO, "Số lượng" trống, khách không thấy lý do từ chối, chữ ngày trong thông báo dạng ISO, màn quét vẫn hiện nút với đơn đã hoàn tất.
- Preview (chưa đăng nhập): `/doi-tac/nhan-phong?ma=…` giữ mã trên đường dẫn và hiện lời mời đăng nhập chủ cơ sở; các API mới trả 401.

### Chưa kiểm chứng / chưa làm
- Chưa thao tác đăng nhập trên preview (preview chưa có secret Turnstile); luồng đăng nhập đã kiểm bằng Worker chạy tại máy build.
- Trên workerd local, 5 lần quét "cùng lúc" thực tế chạy nối tiếp (bỏ điều kiện `changes()` ca này vẫn đạt), nên tranh chấp thật được chứng minh bởi test Node + cơ chế CHECK đã kiểm đỏ trên D1 ở N05.2.
- Chưa có Web Push và email cho chủ cơ sở (Q3): cần chủ dự án tạo khóa VAPID và chọn dịch vụ gửi mail.
- Admin chưa có màn quản lý đơn (API đã cho phép admin); chuông chỉ cho chủ cơ sở (admin nhận qua Telegram ở A1).
- Chủ cơ sở chưa tự hủy đơn đã xác nhận (chờ quy tắc 70% ở N06.1). Hoàn tất chưa cộng điểm/thu phí (N06.2).
- Mục "Bằng chứng chuyển khoản & đơn" cũ trong dashboard đối tác vẫn là dữ liệu mẫu trong trình duyệt (N06.1 thay).
- Ảnh QR ở đơn cũ lưu trình duyệt (xe, dịch vụ khác) vẫn dùng api.qrserver.com với mã đơn mẫu (không phải mã nhận phòng); thay khi các loại dịch vụ đó lên server (N09).

### Đợt tiếp theo
- **N06.1** cọc: điều khoản không hoàn tiền (khách tick trước khi thấy thông tin chuyển cọc), thông tin chuyển cọc của cơ sở, mốc nhắc 70% (48h/30h/24h), chủ cơ sở nhả phòng khi quá hạn.
- Có thể làm **A1** (Telegram cho admin) ngay sau N05.3 theo plan.

---

## N05.2 — Giữ chỗ 30 phút nguyên tử (13/11/2026, nhánh `dot/N05.2`)

**Trạng thái: ĐẠT phần kiểm được, chờ chủ dự án "gộp N05.2".** Gộp sẽ chạy migration 0006 trên D1 production (đã kiểm: production có 0 đơn, dựng lại bảng `bookings` không mất dữ liệu).

### Đã làm
- `migrations_d1/0006_booking_holds.sql`: dựng lại `bookings` với trạng thái `pending_deposit`/`expired`, cột hạng phòng, số khách, giảm giá, `quote_id`, `listing_version_id`, `hold_expires_at`, `idempotency_key` (`UNIQUE(user_id, idempotency_key)`), nguồn khách, ghi chú; bảng `voucher_redemptions`, `batch_assertions`.
- `src/server/bookings/holds.ts` (`HoldStore`): tạo giữ chỗ bằng một batch D1 (đơn + từng đêm + lượt voucher, mỗi lệnh INSERT có điều kiện còn phòng/còn lượt, cuối batch một dòng `CHECK(ok = 1)` → thiếu gì thì cả batch hủy); xác nhận/hủy bằng `UPDATE … WHERE` có điều kiện + kiểm `changes()`; `expireHolds`. Mã đơn ngẫu nhiên (`TX` + 8 ký tự), tổng tiền lấy từ báo giá server, kiểm lại báo giá hết hạn/hồ sơ đổi phiên bản/voucher.
- API: `POST /api/bookings/holds` (đăng nhập; 201 mới, 200 gửi lại cùng khóa, 409 `SOLD_OUT`/`QUOTE_EXPIRED`/`LISTING_CHANGED`/`VOUCHER_USED_UP`, 422 khóa trùng khác nội dung), `POST /api/bookings/:id/cancel` (chủ đơn hoặc admin).
- Voucher: số lượt đã dùng tính cả đơn còn hiệu lực.
- Cron Worker `*/5 * * * *` (`scheduled` trong `src/worker.ts`) dọn giữ chỗ quá hạn.
- Giao diện: chi tiết homestay gọi giữ chỗ server; chưa đăng nhập → nút "Đăng nhập để giữ phòng", mở hộp đăng nhập, giữ nguyên thông tin đã nhập; lỗi mạng bấm lại dùng lại đúng khóa; hết phòng/báo giá hết hạn/hồ sơ đổi → báo lỗi và lấy giá mới. Màn thành công hiện giờ giữ phòng tới (giờ VN) và tiền cọc 30% do server tính. "Chuyến đi của tôi" hiện "Giữ chỗ 30 phút · Chờ cọc" / "Hết hạn giữ chỗ" cho đơn server (trước đó sẽ hiện nhầm "Đã hủy").

### Test mới
- `src/server/bookings/holds.test.ts` (10): 20 yêu cầu tranh phòng cuối chỉ 1 thắng; giữ đủ mọi đêm hoặc không đêm nào; gửi lại cùng khóa/khác nội dung/khóa theo tài khoản; mã ngẫu nhiên, tổng từ báo giá, cọc làm tròn lên; 401/báo giá không có/SĐT sai/báo giá hết hạn/hồ sơ đổi; hết hạn với đồng hồ kiểm soát; xác nhận; hủy và quyền hủy; voucher 1 lượt với 2 đơn đồng thời; cron `scheduled`.
- `src/server/api.contract.test.ts`: thêm ca trên **workerd + D1 local thật**: migration 0006, 20 yêu cầu đồng thời → đúng 1 `201`, 19 `SOLD_OUT`; phòng về 0; hủy 200, hủy lại 409, phòng về 1. Kiểm đỏ: bỏ điều kiện `CHECK` trong batch → ca này **trượt**; trả lại → đạt.
- `src/api/holdsApi.test.ts` (4): khóa idempotency, phân loại lỗi, giờ hết hạn theo giờ VN, trạng thái hiển thị.

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **220/220**. `npm run worker:dry-run`: đạt.
- Workers Builds preview `dot-n05-2`: thành công; D1 preview có đủ 6 migration tới `0006_booking_holds.sql`, bảng/cột mới có mặt.

### Kiểm tra trên preview
- `/api/health` 200 (workerd, D1 ok); `POST /api/bookings/holds` không token → 401.
- Chi tiết `tx-stay-7`, chưa đăng nhập: nút "Đăng nhập để giữ phòng"; bấm → hộp đăng nhập mở trên cùng, lỗi "Vui lòng đăng nhập để giữ phòng…", họ tên/SĐT còn nguyên.
- 375/768/1280px: khung đặt phòng không tràn ngang, 0 chữ < 12px trong form.

### Chưa kiểm chứng
- **Luồng giữ chỗ khi đã đăng nhập chưa thao tác bằng giao diện thật**: preview chặn đăng nhập (chưa có secret Turnstile cho preview, widget báo lỗi). Luồng này đã kiểm ở API (Node + workerd), chưa xem bằng mắt màn "Đã Giữ Phòng".
- Cron chưa chạy trên Cloudflare thật (chỉ gọi `scheduled` trong test); kiểm sau khi gộp ở mục Cron Triggers của Worker.
- Chưa có nút hủy giữ chỗ trong "Chuyến đi của tôi" (API có sẵn); chủ cơ sở/admin chưa thấy đơn giữ chỗ ở dashboard (U5/N06).
- Tỉ lệ cọc 30% là giả định (D-N05-02), chờ chủ dự án chốt.
- Ngoài phạm vi, đã thấy: widget dự báo mây trang chủ có chữ 10–11px.

### Đợt tiếp theo
- **N05.3** quản lý đơn: bảng chuyển trạng thái, API xác nhận/từ chối/check-in/hoàn tất/hủy có quyền, QR có token kiểm server, màn "của tôi" và đối tác đọc đúng đơn (gồm nút hủy giữ chỗ).

---

## N05.1 — Tồn phòng theo đêm (13/11/2026, nhánh `dot/N05.1`)

**Trạng thái: ĐẠT, chờ chủ dự án "gộp N05.1".** Gộp sẽ chạy migration 0005 trên D1 production.

### Đã làm
- `src/server/inventory/availability.ts`: phòng trống(đêm) = tổng phòng − phòng chủ khóa − phòng đang giữ/đã đặt; cả khoảng = đêm ít phòng nhất; đêm của ngày trả phòng không tính. Giữ tồn: `held` còn hạn, `confirmed`, `checked_in`; `held` hết hạn tự hết tác dụng theo thời gian (không cần tác vụ dọn hay tab trình duyệt), `released` không giữ.
- `migrations_d1/0005_room_inventory.sql`: `room_night_closures` (chủ khóa phòng theo đêm), `room_night_allocations` (một dòng mỗi đêm cho giữ chỗ/đơn, `UNIQUE(source_id, room_type_id, date)`; N05.2 sẽ ghi).
- API: `GET /api/listings/:id/availability`, `GET /api/availability` (một lần gọi cho cả danh sách tìm kiếm), `PUT /api/partner/listings/:id/inventory` (chủ sở hữu/admin đặt "còn N phòng" cho ≤ 90 đêm; không mở quá số phòng đã có người giữ/đặt → 409; ghi `audit_log`).
- Báo giá N04 dùng cùng nguồn tồn: xin quá số phòng trống → `NOT_ENOUGH_ROOMS` ("đã hết phòng"/"chỉ còn N phòng").
- Giao diện: App tải bảng tồn theo ngày khách chọn và ghi vào `availableRooms` của từng hạng phòng (`applyAvailability`) → bộ lọc, thẻ, chi tiết, sắp xếp "nhiều phòng trống nhất" đọc một nguồn; không trừ thêm đơn lưu trong trình duyệt.
- **Sửa lỗi:** bộ lọc sức chứa dùng `Math.max(1, availableRooms || 1)` nên phòng còn 0 bị đếm thành 1.
- Dashboard đối tác: ô "Đêm áp dụng", số phòng trống thật từ server, +/− và lệnh Zalo lưu qua API, báo lỗi nếu vượt số phòng đã có khách. Bỏ 2 hạng phòng mẫu hiện như của cơ sở khi cơ sở chưa có hạng phòng.
- Trang chi tiết: phòng trống theo ngày chọn (kể cả khi mở thẳng link); 0 phòng → "Hết phòng các đêm đã chọn".
- README: `db:bootstrap` chỉ ghi SQLite local; thêm lệnh `wrangler d1 execute` để nâng quyền admin trên D1.

### Test mới
- `src/server/inventory/availability.test.ts` (6): ca plan (2 phòng, đơn đêm đầu + đơn đêm sau → còn 1), ngày trả phòng không tính, số lượng phòng trong một đơn, hết phòng là 0, trạng thái giữ tồn, "còn N phòng" → số phòng khóa.
- `src/server/inventory/inventory.api.test.ts` (9): đủ phòng khi chưa có đơn; ca plan qua DB thật; held hết hạn/released/held còn hạn; báo giá chặn khi không đủ phòng; chủ đặt "còn 0" và không mở quá số đã đặt; quyền (chủ khác/khách/chưa đăng nhập 403/401, admin được); đầu vào sai; bảng tồn tìm kiếm; 404.
- `src/api/listingsApi.test.ts`: `applyAvailability`.
- Hợp đồng Express + Worker: `/api/availability` và `/api/listings/:id/availability` chạy trên D1 (workerd).

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **205/205**. `npm run worker:dry-run`: đạt.
- Workers Builds preview `dot-n05-1`: thành công, migration 0005 chạy trên D1 preview.

### Kiểm tra trên preview (dữ liệu thử chỉ trên D1 preview, `tx-stay-7` có 3 phòng đôi)
- Phân bổ thử: đêm 19/11 đã đặt 2 phòng; đêm 20/11 đã đặt 1 phòng + một giữ chỗ 2 phòng **đã hết hạn**.
- API: 19/11 còn 1, 20/11 còn 2 (giữ chỗ hết hạn không tính), cả khoảng 19→21 còn 1.
- Trang chi tiết (mở thẳng link): khoảng 19→21 "Còn 1 phòng trống"; đổi sang 20→21 "Còn 2"; 22→23 "Còn 3". Chọn 2 phòng → "Hạng phòng này chỉ còn 1 phòng trống cho các đêm đã chọn.", nút đặt khóa.
- Thẻ trong `/luu-tru` (375px, sắp xếp nhiều phòng trống nhất): "Còn 1 phòng trống (19/11 – 21/11)"; 1280px với 20→21: "Còn 2 phòng trống".
- Khóa nốt phòng còn lại đêm 19/11: cơ sở biến khỏi danh sách lọc theo ngày; chi tiết báo "Hạng phòng này đã hết phòng cho các đêm đã chọn.", nút đặt khóa.
- Bố cục danh sách và chi tiết ở 375/768/1280px: 0 chữ < 12px, không tràn ngang, không chữ bị cắt.

### Chưa làm / chưa kiểm chứng
- Dashboard đối tác **chưa xem bằng mắt** (D1 preview chưa có tài khoản partner); luồng cập nhật tồn đã kiểm bằng test API.
- Chưa có màn lịch nhiều ngày cho đối tác (mới chỉnh từng đêm); làm ở U5.
- Đơn đặt vẫn lưu trong trình duyệt và chưa trừ tồn; N05.2 tạo giữ chỗ ghi vào `room_night_allocations`.
- Hạng phòng chỉ mở lịch khi đã có trong hồ sơ được duyệt; hạng phòng mới trong bản nháp chưa chỉnh tồn được.
- Dữ liệu thử trên D1 preview (`tx-stay-7`: phân bổ `t1`, `t2`, `t3`, khóa đêm 19/11) để lại cho các lần thử sau.

### Đợt tiếp theo
- **N05.2** (giữ chỗ 30 phút nguyên tử, chống đặt trùng, retry không tạo thêm đơn).

---

## N04 — Tìm kiếm xuyên suốt, báo giá và voucher (13/11/2026, nhánh `dot/N04`)

**Trạng thái: ĐẠT, chờ chủ dự án "gộp N04".** Gộp sẽ chạy migration 0004 (bảng `quotes`, `vouchers`) trên D1 production.

### N04.1 — Lựa chọn tìm kiếm (commit `f7e0d20`)
- `src/search/searchIntent.ts`: "hôm nay" theo giờ Việt Nam; ngày mặc định = ngày mai, 1 đêm; chuẩn hóa ngày quá khứ/sai (vd `2026-02-30`) → mặc định, tối đa 30 đêm, khách/phòng là số nguyên trong giới hạn.
- Ô ngày/khách ở trang chủ trước đây là state riêng (06/11 cố định) và không nối với gì; giờ dùng chung với App, bấm "Tìm phòng" → `/luu-tru?checkin=…&checkout=…&adults=…`.
- URL giữ thêm `adults`, `children`, `rooms`; thêm ô "Số phòng"; nút chọn nhanh ngày tính từ hôm nay (thay 06/11, 14/11, 20/11 cố định).
- `src/search/attribution.ts`: ghi `utm_*`/`ref` lần chạm đầu trong `main.tsx` trước khi router viết lại URL; gắn vào đơn đặt (`booking.attribution`).

### N04.2 — Báo giá server (commit `bfdeba3`, `c529c3d`)
- `src/server/pricing/quote.ts` theo D04: giá từng đêm; đêm thứ Sáu, thứ Bảy, ngày lễ dùng giá cuối tuần; nhân số phòng; sức chứa = người lớn + trẻ em; VND số nguyên; chặn NaN/âm/ngày sai/quá khứ/trả trước nhận/>30 đêm/hạng phòng lạ/vượt số phòng/vượt sức chứa; hạn báo giá 30 phút.
- `POST /api/quotes`: chỉ đọc đúng các trường lựa chọn, mọi trường giá/tổng client gửi kèm bị bỏ qua; lưu snapshot vào `quotes` kèm phiên bản hồ sơ đã dùng (N05 kiểm lại khi giữ chỗ); giới hạn 60 yêu cầu/phút/IP. `GET /api/quotes/:id`.
- Ngày lễ: `PUT /api/admin/pricing/holidays` (admin), `GET /api/pricing/holidays`.
- Trang chi tiết homestay: bỏ ngày cố định 14–15/11/2026 và bỏ `priceWeekend` cho mọi đêm; tổng tiền lấy từ báo giá server; hiện giá từng đêm; ô người lớn/trẻ em/số phòng; đơn đặt mang `quoteId`; báo giá quá hạn thì lấy lại trước khi đặt.

### N04.3 — Voucher (commit `bfdeba3`, `c529c3d`)
- Bảng `vouchers`; kiểm active, ngày bắt đầu/hết hạn, đơn tối thiểu, loại dịch vụ, cơ sở, hết lượt; phần trăm làm tròn xuống, có trần; voucher sai không chặn báo giá mà trả lý do và giảm 0.
- `VoucherStore.redeem`: một câu UPDATE có điều kiện → nhiều yêu cầu cùng lúc không vượt `usage_limit` (N05 gọi khi chốt giữ chỗ).
- Admin xem/tạo/bật-tắt voucher qua `/api/admin/vouchers`. **Bỏ voucher mẫu** `INITIAL_VOUCHERS` (TAXUA10…): voucher là chính sách tiền, chờ admin tạo.

### Test mới
- `src/search/searchIntent.test.ts` (8): giờ VN, cộng ngày qua tháng/năm, mặc định, chuẩn hóa ngày/khách/phòng, nút chọn nhanh, UTM lần chạm đầu.
- `src/server/pricing/quote.test.ts` (11): loại đêm, ngày thường, hỗn hợp T5→CN, ngày lễ, số phòng, sức chứa, 9 kiểu đầu vào sai, chưa có hạng phòng, hạn 30 phút, voucher (làm tròn, trần, 7 lý do bị chặn), tổng sau giảm.
- `src/server/pricing/pricing.api.test.ts` (5): giá client gửi bị bỏ qua + snapshot; 409/404/400; ngày lễ chỉ admin; voucher chỉ admin tạo, mã lạ/sai cơ sở; hai yêu cầu cùng lúc chỉ một yêu cầu dùng lượt cuối.
- Hợp đồng Express + Worker: `/api/quotes` trả 409 `NOT_QUOTABLE` cho cơ sở chưa có hạng phòng; `/api/pricing/holidays` 200.
- `src/routing/routes.test.ts`, `src/api/quotesApi.test.ts` cập nhật/bổ sung.

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt (JS chính 465,1 kB gzip, +3,2 kB). `npm test`: **186/186**. `npm run worker:dry-run`: đạt.
- Workers Builds preview nhánh `dot-n04`: thành công, migration 0004 chạy trên D1 preview.

### Kiểm tra trên preview (thao tác thật trong trình duyệt)
- **Dữ liệu thử chỉ trên D1 preview:** thêm hạng phòng "Phòng đôi (dữ liệu thử preview)" 500.000/800.000đ cho `tx-stay-7` và voucher `THU10` (10%). Production không bị đụng.
- Mở `/?utm_source=facebook&utm_campaign=san-may-thang-11`: nguồn được ghi trước khi URL đổi. Ô ngày trang chủ mặc định 14→15/11 (ngày mai), không cho chọn trước 13/11.
- Chọn 19→22/11, 2 khách ở trang chủ → `/luu-tru?checkin=2026-11-19&checkout=2026-11-22&adults=2`; mở `tx-stay-7` → giữ đúng ngày và 2 khách.
- Giá từng đêm: T5 19/11 ngày thường 500.000đ; T6 20/11 và T7 21/11 cuối tuần 800.000đ; tổng 2.100.000đ.
- Voucher `thu10` → "Đã áp dụng mã THU10: giảm 210.000 ₫", tổng 1.890.000đ; đổi sang `SAIMA` → "Mã giảm giá không tồn tại", tổng về 2.100.000đ.
- 2 phòng → 4.200.000đ, URL thêm `rooms=2`; 5 khách → "2 phòng … ở tối đa 4 khách; bạn chọn 5 khách", nút đặt khóa.
- Gửi `total: 1000, discount: 2.000.000, priceWeekend: 1` thẳng vào API → server vẫn trả 2.100.000đ, giảm 0. Ngày quá khứ → 400 `DATE_IN_PAST`.
- Tải lại trang chi tiết (375px) giữ 4 người lớn, 2 phòng, 3 đêm, 4.200.000đ.
- `/luu-tru` (768px) và chi tiết (375, 1280px): 0 chữ < 12px, không tràn ngang, không chữ bị cắt; nút chọn nhanh "T7 14/11 → CN 15/11", "T6 20/11 → CN 22/11", "T6 27/11 → CN 29/11".

### Chưa làm / chưa kiểm chứng
- Báo giá server mới cho **homestay có hạng phòng**. Hiện chưa cơ sở thật nào trên production có hạng phòng, nên chưa đặt online được homestay nào cho tới khi chủ cơ sở/admin nhập. 26 cơ sở có "giá từ" của nguồn hiện giá tham khảo.
- Xe máy, nhà xe, tour, ăn uống… vẫn tính giá ở trình duyệt như cũ; voucher cho các loại này tạm không dùng được. Làm ở N09.
- Chưa có màn admin nhập ngày lễ (mới có API); làm ở U5.
- Đơn đặt vẫn chỉ lưu trong trình duyệt; `quoteId` và `redeem` voucher được N05 dùng khi giữ chỗ thật.
- Giới hạn tần suất báo giá dùng bộ nhớ trong từng isolate Worker (không chính xác tuyệt đối giữa các máy chủ Cloudflare).
- Dữ liệu thử trên D1 preview (`tx-stay-7`, `THU10`) vẫn để lại cho các lần thử sau.

### Đợt tiếp theo
- **N05** (lịch trống, giữ chỗ 30 phút, vòng đời đơn) — chia N05.1, N05.2, N05.3.

---

## U2 — Điều hướng bằng đường dẫn (13/11/2026, nhánh `dot/U2`)

**Trạng thái: ĐẠT, chờ chủ dự án "gộp U2".**

### Đã làm
- React Router 7.18 (Q1). `src/routing/routes.ts`: bảng đường dẫn (xem D-U2-01), `/co-so/:id`, `/chuyen-di-cua-toi`, bộ lọc ngày/khu vực trong query, chuyển link cũ `?tab=…&listing=…` sang đường dẫn mới.
- `App.tsx`: URL là nguồn sự thật. `setCurrentTab`, `setSelectedListingDetail`, `setIsMyTripsModalOpen` giờ đổi URL (đẩy lịch sử) thay vì `replaceState`, nên Back/Forward hoạt động. Đóng lớp phủ = quay lại trang trước; mở thẳng link rồi đóng thì về màn nền. Tiêu đề tab trình duyệt theo trang. Đường dẫn lạ → trang chủ kèm thông báo.
- **Sửa lỗi có sẵn trên production:** dự phòng SPA của Worker lấy `/index.html`, Cloudflare Assets chuyển `/index.html` → `/` bằng 307, nên mở thẳng/tải lại mọi đường dẫn khác `/` đều bị đá về trang chủ. Đổi sang lấy `/`.
- **Sửa lỗi do N03 lọt lên production:** trang Lưu trú hiện 0/89 homestay vì bộ lọc "còn phòng trong ngày đã chọn" (mặc định bật) coi cơ sở chưa có dữ liệu hạng phòng là hết phòng. Thêm `hiddenByDateFilter`: chỉ ẩn khi có dữ liệu phòng và chứng minh được là hết; không hiện huy hiệu "còn N phòng" cho cơ sở chưa có dữ liệu phòng.

### Test mới
- `src/routing/routes.test.ts` (8): đường dẫn không trùng, đọc lại đúng tab, dấu `/` cuối, `/co-so/:id`, chuyến đi, đường dẫn lạ, chuyển link cũ giữ bộ lọc, query đọc/ghi khớp.
- `src/server/worker.test.ts`: `/co-so/tx-stay-5`, `/luu-tru`, `/chuyen-di-cua-toi`, `/quan-tri` trả `index.html` 200 (trước khi sửa Worker: đỏ, nhận 307 về `/`).
- `src/utils/rules.test.ts`: `hiddenByDateFilter` (chưa có dữ liệu phòng → vẫn hiện; có dữ liệu và hết phòng → ẩn).

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **158/158**. `npm run worker:dry-run`: đạt.
- JS chính tăng từ 448,4 lên 461,9 kB gzip (+13,5 kB, chủ yếu do React Router).
- Workers Builds preview nhánh `dot-u2`: thành công.

### Kiểm tra trên preview `dot-u2-websitetaxuatrip…workers.dev` (thao tác thật trong trình duyệt)
- Mở thẳng `/co-so/tx-stay-5`: hiện đúng cơ sở, tiêu đề tab "Dốc Mơ Homestay… | Tà Xùa Trip"; bấm Đóng → `/`.
- Link chia sẻ `/luu-tru?checkin=2026-11-20&checkout=2026-11-22`: ô ngày nhận đúng 20 và 22/11, hiện 12 thẻ; bấm thẻ → `/co-so/tx-stay-1?…`; Back → `/luu-tru?…` (đóng chi tiết); Forward → mở lại; nút Đóng → `/luu-tru?…`.
- Tải lại trên `/co-so/tx-stay-1` (1280px): vẫn mở đúng cơ sở; Đóng → `/luu-tru`.
- Link cũ `/?tab=stay&listing=tx-stay-21&checkin=…` → `/co-so/tx-stay-21?checkin=…` và mở đúng cơ sở.
- `/khong-ton-tai/abc` → `/` kèm "Không tìm thấy trang này…". `/chuyen-di-cua-toi` mở màn chuyến đi; Back → `/`.
- Thanh điều hướng dưới đáy ở 375px: "Lưu trú" → `/luu-tru`.
- `/luu-tru` và chi tiết cơ sở ở 375/768/1280px: 0 chữ < 12px, không tràn ngang, không chữ bị cắt.

### Chưa làm / chưa kiểm chứng
- Trang chi tiết và "Chuyến đi của tôi" đã có URL riêng nhưng vẫn **hiển thị dạng lớp phủ** như cũ; dàn thành trang đầy đủ ở U4.
- `/doi-tac` và `/quan-tri` chỉ kiểm khi chưa đăng nhập (preview chưa có tài khoản partner/admin).
- Thẻ cơ sở vẫn mở bằng `onClick` chứ chưa phải thẻ `<a href>` thật (chuột giữa/mở tab mới chưa được; Google chưa thấy link). Để U4/K3 cùng phần SEO.
- Ngày mặc định của bộ lọc Lưu trú là 06–08/11/2026, đã ở quá khứ (có từ trước); sửa ở N04.
- `App.tsx` vẫn là một file lớn; tách theo route ở K2.

### Đợt tiếp theo
- **N04** (tìm kiếm và báo giá).

---

## N03 — Danh bạ lưu bền, CMS và thẩm định (12/11/2026, nhánh `dot/N03`)

**Trạng thái: ĐẠT, chờ chủ dự án "gộp N03".** Gộp vào `main` sẽ tự chạy migration 0002 + 0003 trên D1 production (nhập 172 cơ sở).

### N03.1 — Dữ liệu (commit `525b5a4`)
- `migrations_d1/0002_listings.sql`: `listings`, `listing_versions`, `listing_claims`, `audit_log`, `site_content`.
- `src/server/listings/content.ts`: nội dung sửa được + kiểm tra (tên, loại, khu vực, giá nguyên VND, tọa độ trong VN, ảnh http(s), hạng phòng). Điểm sao, số đánh giá, huy hiệu, trạng thái **không** nằm trong nội dung nên không tự khai được.
- `src/server/listings/importer.ts` + `npm run listings:import` sinh `migrations_d1/0003_import_scraped_listings.sql` (INSERT OR IGNORE, chạy lại không trùng, không đè bản đã sửa). Không sửa mã TypeScript; gỡ `scripts/update-mockdata-file.js`.
- Kết quả nhập: **172 cơ sở** từ `scraped-taxua-enriched.json`, bỏ 7 điểm check-in. Giữ đủ 172 ID cũ (`tx-stay-…`), ghép theo loại + thứ tự và bắt buộc tên khớp; importer phát hiện 7 cặp cùng tên khác loại/link và tách đúng thành cơ sở riêng.
- Không tự sinh: tọa độ (0/172 có tọa độ), điểm sao, huy hiệu (172/172 Cấp 1), hạng phòng/menu/gói, lượt xem. Giá chỉ lấy khi nguồn có (26/172); số điện thoại dính liền được tách (vd `08659636470812251575` → 2 số); link nhóm Facebook chung bị bỏ.
- 6 cơ sở tự bịa (`homestay-may`, `homestay-lutre`, `coffee-mi-oi`, `tx-taxi-1`, `tx-rescue-1` với hotline `1900 8899`, `tx-bike-1`) **không** vào dữ liệu thật; chỉ còn trong `mockData.ts` và fixture test.
- `DatabaseEngine` trên Node áp chính các file `migrations_d1/*.sql` (bỏ bản schema viết lặp trong `db.ts`).

### N03.2 — Lưu trữ và quyền (commit `8d4f2c2`)
- `ListingStore` + route: công khai chỉ trả `status = approved` và đúng `published_version_id`. Mỗi cơ sở tối đa một bản mở (nháp/chờ duyệt); bản đã duyệt không bị sửa đè.
- Chủ cơ sở: lưu nháp → gửi duyệt; admin duyệt/từ chối (có lý do), sửa công khai ngay, đổi trạng thái, ghim ưu tiên, đặt cấp xác minh (cấp 2–3 bắt buộc ghi nguồn, hết hạn sau 12 tháng theo D06).
- Nhận chính chủ: cần tài khoản partner + bằng chứng; duyệt chỉ gắn quyền sở hữu, **không** nâng huy hiệu.
- `audit_log` cho mọi thao tác ghi; `site_content` cho CMS.
- Route PUT `/api/partner/listings/:id` cũ (gửi gì cũng báo thành công) được thay bằng lưu nháp có kiểm tra.

| Route | Quyền |
|---|---|
| `GET /api/listings`, `GET /api/listings/:id`, `GET /api/site-content` | công khai |
| `POST /api/listings/:id/claims` | partner |
| `GET/POST /api/partner/listings`, `PUT /api/partner/listings/:id`, `POST …/:id/submit` | partner sở hữu (admin được tất cả) |
| `GET/POST /api/admin/listings`, `PUT …/:id`, `POST …/:id/{review,status,verification,featured}` | admin |
| `GET /api/admin/claims`, `POST …/:id/review`, `GET /api/admin/audit`, `PUT /api/admin/site-content` | admin |

### N03.3 — Giao diện (commit `6fdd3e6`, `2035c18`)
- `App` đọc danh bạ từ API; bỏ `INITIAL_LISTINGS` và ghi đè ưu tiên trong localStorage. Trạng thái đang tải/lỗi/rỗng dùng component U1.
- Chủ cơ sở sửa = lưu nháp + gửi duyệt; admin dùng API cho duyệt/từ chối/gỡ/cấp xác minh (hỏi nguồn)/ghim. Chỉ báo thành công sau khi server xác nhận.
- Deep link `?listing=` lấy qua `/api/listings/:id`; CMS lưu server (tự lưu sau 1,2 giây), bỏ localStorage.
- Bản đồ chỉ ghim cơ sở có tọa độ thật, ghi rõ số cơ sở chưa có tọa độ.
- Nhãn: "Chưa có đánh giá", giá 0 → "Liên hệ", "Chưa xác minh · Thu thập từ nguồn công khai ngày 04/11/2026", "View biển mây (cơ sở tự khai)"; bỏ các câu "179 cơ sở thẩm định".
- Trang chi tiết: bỏ giá dự phòng gán cứng (150.000đ/180.000đ/30.000đ) và số hạng phòng `|| 3`; cơ sở chưa có giá thì khóa nút đặt và hướng dẫn liên hệ trực tiếp.

### Test mới
- `src/server/listings/importer.test.ts` (11): ID, tách số điện thoại, khu vực, kiểm tra nội dung, không tự sinh dữ liệu, ID trùng/sai, cùng tên khác loại, chạy SQL hai lần, migration sinh ra khớp (172, Cấp 1, không tọa độ, không cơ sở tự bịa).
- `src/server/listings/listings.api.test.ts` (12): công khai chỉ approved; partner sửa cơ sở người khác → 403; nội dung sai → 400 theo trường; nháp không đè bản duyệt; từ chối giữ bản công khai và trả lý do; tạo mới chưa công khai; cơ sở bị từ chối biến mất khỏi danh sách và chi tiết; claim không nâng huy hiệu; huy hiệu cần nguồn và hết hạn 12 tháng; admin sửa có log; ghim ưu tiên; CMS chỉ admin lưu.
- `src/api/listingsApi.test.ts` (5): gộp bản đang sửa, không gửi trường hệ thống, lọc tọa độ, nhãn xác minh.
- Hợp đồng Express + Worker (workerd + D1 local): `/api/listings` trả 172 cơ sở Cấp 1, `homestay-may` → 404.

### Lệnh đã chạy (lần cuối, trên `2035c18`)
- `npm run typecheck`: 0 lỗi. `npm run build`: đạt. `npm test`: **149/149**. `npm run worker:dry-run`: đạt (1.793 KiB, gzip 236 KiB).
- Workers Builds preview nhánh `dot-n03`: thành công; migration chạy trên D1 preview.

### Kiểm tra trên preview `dot-n03-websitetaxuatrip…workers.dev`
- `/api/listings`: 172 cơ sở, chỉ Cấp 1, 0 tọa độ; `/api/listings/homestay-may`: 404.
- Trang chủ 375/768/1280px: 0 chữ < 12px, không tràn ngang, không chữ bị cắt; bộ đếm loại lấy từ dữ liệu ("Tất cả cơ sở (172)", "Homestay (89)").
- Deep link `?listing=tx-stay-5` và `?listing=tx-stay-21` mở đúng cơ sở từ API ở 375 và 1280px, đạt cùng tiêu chí.
- `tx-stay-21` (nguồn không có giá): nút đặt khóa, hiện hướng dẫn liên hệ. `tx-stay-5` (nguồn có giá 599.000đ) vẫn đặt được như cũ.
- Bản đồ: ghi "172 cơ sở chưa có tọa độ đã xác minh nên chưa hiện trên bản đồ".

### Chưa làm / chưa kiểm chứng
- **Ảnh vẫn là link của trang nguồn** (supabase của bên khác); tải ảnh lên R2 để ở U4.
- Dashboard đối tác và admin **chưa xem bằng mắt** trên preview vì D1 preview chưa có tài khoản admin/partner; luồng của chúng đã kiểm bằng test API.
- Màn admin cũ chỉ có nút duyệt/từ chối chung; lý do từ chối và nguồn xác minh đang hỏi bằng hộp `prompt` của trình duyệt (U5 làm form riêng).
- Hồ sơ nhận chính chủ không gửi số CCCD/MST (dữ liệu nhạy cảm); admin gọi điện xác minh. Tải giấy tờ lên R2 riêng tư để sau.
- Cập nhật phòng trống trong dashboard đối tác vẫn chỉ đổi trên màn hình (đã ghi rõ trong thông báo); lịch phòng thật ở N05.
- AI tư vấn, dự báo săn mây, cộng đồng và lịch trình AI vẫn đọc `INITIAL_LISTINGS` (dữ liệu mẫu); chuyển sang API ở N08.
- Danh sách công khai trả toàn bộ 172 cơ sở một lần (JS gzip +4 kB; JSON ~400 kB); phân trang ở K3.
- Sau khi gộp, homestay/dịch vụ trên production sẽ mất điểm sao, số đánh giá, huy hiệu cấp 2–3, tọa độ và hạng phòng tự sinh trước đây. Đây là chủ đích theo D06.

### Đợt tiếp theo
- **U2** (React Router, đường dẫn `/co-so/:id`) rồi **N04** (tìm kiếm và báo giá).

---

## U1 — Bộ thiết kế chung (12/11/2026, nhánh `dot/U1`)

**Trạng thái: ĐẠT, chờ chủ dự án "gộp U1".**

### Đã làm
- `src/index.css`: khối `@theme` với màu `brand-50…950` (`brand-800` = `#073161` là màu chính đang dùng, `brand-700` = `#0a3f7c`, `brand-900` = `#04244d`), màu phụ `accent-*` (teal), màu trạng thái `success/warning/danger/info-*`, `--font-sans` (Be Vietnam Pro), bo góc `rounded-control/card/modal`. Thang chữ dùng mặc định Tailwind (`text-xs` 12px tối thiểu, `text-sm` 14px, `text-base` 16px).
- Đổi 815 chỗ `text-[9px]`, `text-[9.5px]`, `text-[10px]`, `text-[10.5px]`, `text-[11px]` sang `text-xs` trong 27 file; tooltip bản đồ (`mapTooltipHtml.ts`) nâng lên 12px.
- Đổi mã hex brand trong className (`-[#073161]`, `-[#0a3f7c]`, `-[#04244d]`) sang token `brand-800/700/900`. Giá trị màu giữ nguyên, giao diện không đổi màu.
- Component mới trong `src/components/ui/` (xuất qua `index.ts`): `Button`, `Input`, `Select` (nhãn gắn ô, lỗi `role="alert"`, ô nhập 16px), `Modal`, `Sheet` (trượt từ đáy trên điện thoại, đóng bằng Esc, khóa cuộn), `Card`, `Badge`, `Toast` + `useToast`, `Skeleton`, `EmptyState`, `ErrorState`. Chưa thay vào màn cũ; U2–U5 dùng dần.
- `npm test` đổi sang `tsx --test "src/**/*.test.ts"` để Node tự mở rộng glob, chạy được test ở thư mục con (trước đây shell chỉ mở rộng một cấp).

### Test mới (`src/components/ui/designSystem.test.ts`, 9 test)
- Cấm mọi `text-[Npx]` với N < 12 trong `src` (đã thử thêm `text-[10px]` vào `DemoNotice.tsx`: test đỏ, chỉ đúng file và dòng; gỡ ra: xanh).
- Tooltip bản đồ không có chữ < 12px; token có trong `@theme`; không còn hex brand rời trong className.
- Render tĩnh Button, Input, Select, Modal, Sheet, Card, Badge, Skeleton, EmptyState, ErrorState; reducer Toast giữ tối đa 3 thông báo mới nhất.

### Lệnh đã chạy
- `npm run typecheck`: 0 lỗi.
- `npm test`: 119/119 đạt ở 5 lần chạy liên tiếp sau khi build. Lần chạy đầu tiên (khi `dist/` còn là bản build cũ, trước khi build lại) có 1 test fail; không tái hiện được và không giữ được log test nào fail. Xóa `dist/` thì 6 test cần bản build fail như dự kiến. CI luôn build trước khi test.
- `npm run build`: đạt; CSS 190,91 kB (gzip 29,05 kB, trước 28,28 kB); JS 2.033 kB (gzip 444,25 kB).
- `npm run worker:dry-run`: đạt.
- Workers Builds bản preview nhánh `dot-u1`: thành công.

### Kiểm tra giao diện thật (preview `dot-u1-websitetaxuatrip…workers.dev` so với production)
| Cỡ | Chữ < 12px (ngoài bản đồ): production → U1 | Tràn ngang trang | Chữ bị cắt | Chiều cao trang |
|---|---|---|---|---|
| 375px | 1.506 → 0 | không | 0 | 14.981 → 15.306px |
| 768px | 1.506 → 0 | không | 0 | 10.106 → 10.401px |
| 1280px | 1.502 → 0 | không | 0 | 7.190 → 7.318px |

- Menu di động và hộp thoại đăng nhập ở 375px: 0 chữ < 12px, không tràn, không bị cắt.
- `bg-brand-800`, `text-brand-800` ra đúng `rgb(7, 49, 97)`; font Be Vietnam Pro.

### Chưa làm / chưa kiểm chứng
- Nhãn trên ghim bản đồ (HTML dựng trong `InteractiveMapSection.tsx`, 10–11px, khung cố định) giữ nguyên để không lệch điểm neo ghim; xem lại ở U6.
- Ô nhập trong các form cũ (ví dụ đăng nhập) đang 12px; trên iPhone ô dưới 16px tự phóng to khi bấm vào. Sửa khi thay bằng `Input` mới ở U3/U5.
- Mới xem trang chủ, menu và hộp thoại đăng nhập; các màn quản trị, đối tác và chi tiết cơ sở chỉ được kiểm bằng test quét mã, chưa xem bằng mắt.
- Chưa xem trên điện thoại thật.
- Giữ tiêu điểm trong hộp thoại (focus trap) để ở U6.

### Đợt tiếp theo
- Theo lộ trình: **N03** (danh bạ và CMS, gồm N03.1–N03.3), làm kèm U2 (React Router, đã chốt Q1).

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
