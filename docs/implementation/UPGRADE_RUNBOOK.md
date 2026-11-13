# Hướng dẫn nâng cấp: Workers Paid + tên miền taxuatrip.vn + gửi email

Soạn ngày 13/11/2026 (đợt R1). Làm theo đúng thứ tự. Mỗi phần có bước **sao lưu trước** và **cách quay lại**.
Phần đánh dấu **[Chủ dự án]** làm trên dashboard Cloudflare/nhà đăng ký; phần **[Code]** là một đợt nhỏ trong repo (gõ "Làm đợt [C1]").

Hiện trạng code (sau R1): website đã sẵn sàng gửi email. Khi Worker có binding `EMAIL`, các tính năng sau tự bật, không cần sửa code:
quên mật khẩu qua email, mã xác minh email khi đăng ký, nút "Gửi mã xác minh" trong Tài khoản của tôi.
Chưa có binding thì các tính năng này báo "sắp ra mắt" (không giả là đã gửi).

---

## 0. Sao lưu trước mọi bước (bắt buộc)

Chạy trên máy có `wrangler` đã đăng nhập đúng tài khoản Cloudflare, trong thư mục dự án:

```bash
# Mốc khôi phục Time Travel hiện tại (lưu chuỗi bookmark vào ghi chú)
npx wrangler d1 time-travel info taxua-trip-db

# Bản xuất đầy đủ cơ sở dữ liệu production ra file (giữ file này ở nơi an toàn, không đưa lên Git)
npx wrangler d1 export taxua-trip-db --remote --output backup-$(date +%Y%m%d-%H%M).sql
```

Khôi phục nếu cần:

```bash
# Về đúng mốc đã ghi (thay <bookmark>)
npx wrangler d1 time-travel restore taxua-trip-db --bookmark=<bookmark>
```

Gói Free giữ Time Travel 7 ngày; sau khi nâng Workers Paid là 30 ngày. File `.sql` xuất ra là bản giữ lâu dài.
Ảnh trên R2 (biên lai, bằng chứng, ảnh đánh giá) không bị ảnh hưởng bởi các bước dưới đây.

---

## 1. Nâng Workers Paid ($5/tháng) — [Chủ dự án]

1. Dashboard Cloudflare → Workers & Pages → Plans → chọn **Workers Paid**.
2. Không cần đổi gì trong code. Ngay sau khi nâng: Time Travel D1 lên 30 ngày, giới hạn D1/Worker cao hơn, mở được Email Sending.
3. Kiểm: mở `https://websitetaxuatrip.vanhuy171099.workers.dev/api/health` → `"databaseOk": true`.

Quay lại: hạ gói ở cùng trang; dữ liệu không mất (chỉ giới hạn trở về gói Free).

---

## 2. Đưa tên miền taxuatrip.vn vào Cloudflare — [Chủ dự án]

1. Mua `taxuatrip.vn` tại một nhà đăng ký tên miền .vn ở Việt Nam (Cloudflare không bán đuôi .vn). Khai thông tin chủ thể đúng theo quy định .vn.
2. Cloudflare → Add a domain → nhập `taxuatrip.vn` → chọn gói **Free** (đủ cho lúc ra mắt).
3. Cloudflare cho 2 nameserver; vào trang quản lý tên miền ở nhà đăng ký, đổi nameserver sang 2 địa chỉ đó. Chờ trạng thái "Active" (vài phút đến 24 giờ).
4. Trong zone `taxuatrip.vn`, bật ngay (miễn phí):
   - SSL/TLS → **Full (strict)**; Edge Certificates → **Always Use HTTPS** bật, **Minimum TLS 1.2**, **HSTS** (bật sau khi chạy ổn 1 tuần).
   - DNS → **DNSSEC** bật (rồi khai bản ghi DS ở nhà đăng ký nếu họ hỗ trợ).
   - Security → **Bot Fight Mode** bật.
   - Security → WAF → Free Managed Ruleset: để mặc định (bật sẵn).

Quay lại: website vẫn chạy ở địa chỉ workers.dev trong suốt bước này.

---

## 3. Gắn Worker vào tên miền — [Code] + [Chủ dự án]

[Code] thêm vào `wrangler.toml` (đợt C1):

```toml
routes = [
  { pattern = "taxuatrip.vn", custom_domain = true },
  { pattern = "www.taxuatrip.vn", custom_domain = true }
]
```

và chuyển hướng `www` → không `www`, workers.dev → `taxuatrip.vn` trong Worker.

[Chủ dự án] sau khi gộp: kiểm `https://taxuatrip.vn/api/health`.

Turnstile: Cloudflare → Turnstile → widget đang dùng → Hostname management → thêm `taxuatrip.vn` và `www.taxuatrip.vn`
(**giữ** hostname workers.dev cho đến khi chuyển hẳn, nếu không đăng nhập ở địa chỉ cũ sẽ lỗi).

Quay lại: xóa `routes` và gộp lại; workers.dev vẫn chạy.

---

## 4. Bật gửi email từ taxuatrip.vn — [Chủ dự án] + [Code]

Cần đã xong bước 1 và 2.

[Chủ dự án]:

```bash
npx wrangler email sending enable taxuatrip.vn
```

Làm theo hướng dẫn để Cloudflare thêm bản ghi DNS (SPF, DKIM) vào zone. Chờ trạng thái tên miền gửi email là "verified".

[Code] thêm vào `wrangler.toml` (đợt C1):

```toml
[[send_email]]
name = "EMAIL"

[vars]
MAIL_FROM = "Tà Xùa Trip <no-reply@taxuatrip.vn>"
```

Kiểm sau khi gộp:
1. `GET https://taxuatrip.vn/api/auth/config` → `"emailEnabled": true`.
2. Đăng ký một tài khoản thử bằng email của bạn → nhận email "Mã xác minh email Tà Xùa Trip".
3. Thử "Quên mật khẩu?" → nhận mã, đặt mật khẩu mới, đăng nhập lại.
4. Dashboard D1: bảng `email_log` có dòng `sent`; nếu có dòng `failed`, cột `error` ghi lý do.

Quay lại: xóa khối `[[send_email]]` và gộp lại → các tính năng email trở về "sắp ra mắt", không ảnh hưởng đăng nhập.

Đã kiểm trước (13/11/2026, bản chạy local với binding giả lập của Wrangler): email đi đúng địa chỉ người gửi
`"Tà Xùa Trip" <no-reply@taxuatrip.vn>`, mã đặt lại mật khẩu và mã xác minh email dùng được.

---

## 5. Cloudflare Access cho trang quản trị — [Chủ dự án] + [Biến môi trường]

1. Cloudflare Zero Trust (gói Free, tối đa 50 người) → Access → Applications → Add → Self-hosted.
2. Domain: `taxuatrip.vn`, path `quan-tri` và một ứng dụng nữa cho path `api/admin`.
3. Policy Allow → Emails: `vanhuy171099@gmail.com`, `vtmedia0910@gmail.com`, `luonganhvietbds@gmail.com`. Đăng nhập bằng mã một lần gửi qua email.
4. Đây là lớp thứ hai; trong website vẫn cần tài khoản có vai trò admin.
5. Bật kiểm tra phía Worker (R3, `src/server/security/access.ts`): Workers → websitetaxuatrip → Settings → Variables:
   - `ACCESS_TEAM_DOMAIN` = tên nhóm Zero Trust, ví dụ `taxuatrip.cloudflareaccess.com`
   - `ACCESS_AUD` = Application Audience (AUD) Tag của ứng dụng ở bước 2 (Access → Applications → chọn ứng dụng → Overview)
   Khi đủ hai biến, Worker tự kiểm chữ ký Access cho `/quan-tri` và `/api/admin/*`; thiếu hoặc sai trả 403.
   **Quay lại:** xóa một trong hai biến là tắt. Chưa có tên miền thì KHÔNG đặt hai biến này (workers.dev không chạy Access theo đường dẫn → admin bị chặn).

---

## 6. Sau khi chuyển xong

- Ghi bookmark Time Travel trước mỗi lần gộp có migration.
- Xuất D1 hằng tuần: tự động từ R3 (mục 7).
- Ghi kết quả từng bước vào `docs/implementation/PROGRESS.md`.

---

## 7. Sao lưu D1 hằng tuần và khôi phục (R3)

**Hai lớp, đều không cần API token hay secret:**
- **Time Travel** (có sẵn, gói Free giữ 7 ngày, Paid 30 ngày): quay cả cơ sở dữ liệu về đúng một thời điểm. Dùng khi phát hiện lỗi sớm.
- **Bản sao lưu hằng tuần do chính Worker làm** (`src/server/backup/d1Backup.ts`):
  - Cron 03:17 sáng Chủ nhật giờ VN bắt đầu; mỗi lần cron 5 phút chạy tiếp một bước nhỏ (hợp giới hạn 10 ms CPU của gói Free).
  - Ghi vào bucket R2 riêng tư `taxua-trip-private`, thư mục `backups/d1/<thời điểm>/`: `schema.sql`, `data/<bảng>.<phần>.jsonl`, `manifest.json`; `backups/d1/LATEST.json` là bản mới nhất.
  - Giữ 12 bản gần nhất.
  - Trang quản trị → Thành viên & Đối tác → ô **Sao lưu dữ liệu** cho xem bản gần nhất và có nút **Sao lưu ngay**.
  - Không lưu trên GitHub vì kho công khai.
  - Bản sao lưu đọc qua vài phút nên không phải ảnh chụp đúng một thời điểm; cần đúng thời điểm thì dùng Time Travel.

**Khôi phục từ bản sao lưu (luôn vào cơ sở dữ liệu MỚI trước, không ghi đè production):**
1. Cloudflare → R2 → `taxua-trip-private` → `backups/d1/` → mở thư mục bản cần dùng → tải `manifest.json`, `schema.sql` và cả thư mục `data/` về một thư mục trên máy (giữ nguyên cấu trúc `data/`).
   Hoặc dùng dòng lệnh sau `npx wrangler login`: `npx wrangler r2 object get "taxua-trip-private/backups/d1/<bản>/<tệp>" --remote --file "<bản>/<tệp>"` cho từng tệp trong `manifest.json` → `fileList`.
2. Ghép thành tệp SQL và nạp vào cơ sở dữ liệu thử:
```bash
npx tsx scripts/d1-backup-to-sql.ts <thư-mục-bản> > restore.sql
npx wrangler d1 create taxua-trip-restore-test
npx wrangler d1 execute taxua-trip-restore-test --remote --file restore.sql
npx wrangler d1 execute taxua-trip-restore-test --remote --command "SELECT COUNT(*) FROM profiles"
```
3. Đối chiếu xong mới quyết định: dùng Time Travel về mốc trước sự cố, hoặc đổi `database_id` trong `wrangler.toml` sang cơ sở dữ liệu đã khôi phục rồi deploy. Xóa `restore.sql` và thư mục tải về (có dữ liệu cá nhân).

**Đã diễn tập (13/11/2026, Worker + D1 + R2 chạy local):**
- Bấm "Sao lưu ngay" trên trang quản trị → 386 dòng, 38 bảng.
- Kích cron hằng tuần → bản mới.
- Tải 8 tệp dữ liệu từ R2 → `d1-backup-to-sql.ts` → nạp vào cơ sở dữ liệu trống (466 lệnh) → tài khoản, cơ sở, nhật ký, phiên, migration khớp hoàn toàn.

## 8. Theo dõi (R3)

- **Workers Logs** (bật trong `wrangler.toml` `[observability]`): Workers → websitetaxuatrip → Logs, giữ 7 ngày. Tìm `[edge-limit] blocked` (bị chặn vì gửi dồn), `[access] denied`, lỗi API.
- **`/api/health`**: `status` `ok` khi D1 chạy và đã có đủ migration (`schema.applied` ≥ `schema.expected`); thiếu migration thì `degraded` (503).
- **CSP báo cáo**: trang có `Content-Security-Policy-Report-Only`. Mở trang, F12 → Console, lỗi dạng "[Report Only] Refused to…" là nguồn cần thêm vào chính sách trước khi bật bắt buộc.
