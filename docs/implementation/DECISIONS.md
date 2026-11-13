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

### D-N06-04: Thu phí, voucher dịch vụ, quà Điểm Mây (chủ dự án chốt 13/11/2026, áp dụng ở N06.3)

- **Thu phí nền tảng:**
  - Cuối tháng, hệ thống chốt kỳ phí của mỗi cơ sở từ `fee_ledger`.
  - Chủ cơ sở chuyển khoản vào **tài khoản của admin**, rồi tải ảnh chuyển khoản lên.
  - Admin xác nhận đã nhận đủ thì kỳ phí chuyển sang "đã kết toán".
  - Xác nhận là thủ công, có log; không có cổng thanh toán. Thiếu tiền hoặc ảnh không hợp lệ thì admin ghi lý do và trả lại cho cơ sở.
- **Voucher dịch vụ:**
  - Tà Xùa Trip deal với từng bên dịch vụ (quán, xe, chụp ảnh...). Bên nào đồng ý cấp voucher thì bên đó chịu phần giảm.
  - Tại nơi dùng dịch vụ, khách đọc **mã booking** đã đặt thực tế trên website. Bên dịch vụ tra mã, xác nhận rồi khấu trừ % theo voucher.
  - Hệ thống ghi lần dùng (một lần mỗi voucher mỗi booking) để hai bên đối chiếu.
  - Tà Xùa Trip không bù tiền voucher.
- **Điểm Mây:**
  - Giá trị quy đổi điểm triển khai sau; đổi điểm tiếp tục khóa.
  - Quà trao cho top 3 người đóng góp nhiều nhất theo **tháng / quý / năm**, mức quà theo bậc điểm.
  - Bảng xếp hạng và phần admin chốt quà mở rộng thêm kỳ quý và năm.

### D-N08-01: Kế hoạch chuyến đi trong hồ sơ khách (chốt hướng 13/11/2026, làm sau N06.3)

- **Tham khảo:** trang lịch trình của Cravel.
  - Phần đầu tóm tắt chuyến: số ngày, số người, số điểm dừng, chỗ ở, chi phí dự kiến mỗi người.
  - Khối "Nhà xe, thuê xe & chỗ ở".
  - Lịch theo ngày, mỗi điểm có giờ, loại, thời lượng ở lại, ghi chú và chi phí/người.
  - Bản đồ và link Google Maps theo ngày.
  - Bảng chi phí theo nhóm, tổng/người và tổng nhóm; danh sách đồ cần mang.
- **Hai phần gợi ý:**
  1. Lộ trình trải nghiệm theo gói 2N1Đ / 3N2Đ / 4N3Đ.
  2. Phòng, xe và dịch vụ lấy từ CSDL (homestay, nhà xe, quán, cà phê, chụp ảnh, trang phục, tour). Các gợi ý này **gắn ngay vào từng mốc của lộ trình**, ví dụ: ngày 1 lúc 14:00 nhận phòng ở X, xe Y đi lúc 07:00.
- **Cách tạo:**
  - Server dựng lộ trình bằng bộ luật từ CSDL: mẫu ngày, giờ đẹp săn mây, chọn cơ sở đã duyệt.
  - Giá phòng và xe lấy từ quote/tồn phòng thật và **tính bằng code**.
  - Khi có khóa AI, AI chỉ viết lời mô tả và cá nhân hóa. AI không tạo giá, phòng trống hay cơ sở không có trong CSDL. Phần nào chưa có AI thì không gắn nhãn "AI trực tiếp".
- **Điểm tham quan:** bảng mới do admin quản lý. Tôi nạp sẵn khoảng 12–15 điểm quen thuộc (giờ đẹp, thời lượng). Giá vé để "chưa xác minh" đến khi admin nhập.
- **Lưu và chia sẻ:**
  - Kế hoạch lưu theo tài khoản, nằm ở mục "Kế hoạch của tôi" trong hồ sơ.
  - Mặc định riêng tư. Chủ kế hoạch bật được link chia sẻ chỉ đọc cho người cùng nhóm, và tắt link được.
  - Chưa làm trang khám phá công khai.
- Từ kế hoạch có thể bấm đặt phòng hoặc xe, đi qua luồng giữ chỗ/đặt cọc sẵn có (N05/N06).

### D-N06-03: Điểm Mây theo đóng góp, phí nền tảng theo từng cơ sở (chủ dự án chốt 13/11/2026)

- **Điểm Mây tính theo đóng góp thật, không theo tiền chi tiêu.** Nguồn duy nhất là sổ `points_ledger` ở server; trình duyệt không tự cộng điểm.
  - Hoàn tất chuyến ở (cơ sở xác nhận): +20, ghi cùng batch với bước "hoàn tất"; một đơn chỉ được cộng một lần.
  - Đánh giá xác thực: +30, có ảnh thật thêm +20. Hằng số đã có, nhưng nối vào luồng đánh giá ở N06.3.
  - Admin cộng điểm cho đóng góp được duyệt: 1–500 điểm mỗi lần, phải ghi lý do, có khóa chống bấm lặp.
  - Admin thu hồi bằng một dòng trừ bù, không xóa dòng gốc.
- **Danh hiệu** tính theo điểm 12 tháng gần nhất: Lữ khách mới (0), Người săn mây (100), Thổ địa Tà Xùa (300), Đại sứ Tà Xùa (800).
- **Bảng xếp hạng** công khai chỉ hiện khách du lịch, dùng tên rút gọn (ví dụ "Nguyễn V. K.").
- **Top 3 mỗi tháng:** sau khi tháng kết thúc, admin chốt và ghi quà đã trao. Mỗi hạng và mỗi người chỉ được ghi một lần.
- **Đổi điểm lấy quà: khóa** (`REDEMPTION_ENABLED=false`). Giá trị quy đổi và người chịu chi phí voucher chưa chốt. Server đã có API đổi điểm nhưng trả 403 cho tới khi chủ dự án chốt.
- **Phí nền tảng:**
  - Admin cài mức phí cho từng cơ sở sau khi đã thỏa thuận. Có hai dạng: số tiền cố định mỗi đơn (0–10.000.000đ), hoặc phần trăm (0–50%, làm tròn tới đồng theo quy tắc thường).
  - Khi đơn hoàn tất, hệ thống ghi một dòng vào `fee_ledger` theo mức phí lúc đó. Cơ sở chưa được cài mức phí thì không ghi dòng nào.
  - Đảo phí phải có lý do và giữ nguyên kỳ (tháng) của dòng gốc.
  - **Chưa thu tiền.** Không còn ví trả trước và không tự trừ 50.000đ. Hóa đơn cuối tháng làm ở N06.3.
- **Bỏ** các lời hứa điểm cũ trong giao diện: điểm theo % tiền đặt, +50 khi đánh giá, điểm cộng tại trình duyệt. Có test quét mã nguồn để chặn chúng quay lại.

### D-N06-02: Đối soát cọc (chủ dự án chốt 13/11/2026)

- **Khi nào mở:** khách đã gửi biên lai cọc nhưng đơn **hết hạn giữ chỗ** hoặc **bị cơ sở từ chối** trước khi cơ sở xác nhận nhận cọc. Không mở khi khách tự hủy hoặc cơ sở nhả phòng vì quá hạn 70% (D03: cọc không hoàn).
- **Cơ sở** trong **3 ngày**:
  - **hoàn đủ** — bắt buộc tải ảnh chứng từ chuyển hoàn và ghi số tiền đã hoàn; hoặc
  - **đề nghị giữ tiền** (vd chuyển sang ngày/phòng khác) — **chỉ giữ được khi khách bấm đồng ý**; khách từ chối thì quay về chờ hoàn.
- **Khách:**
  - xác nhận "Đã nhận lại tiền" thì kết thúc;
  - báo "Chưa nhận được", hoặc cơ sở quá hạn 3 ngày chưa hoàn, thì khách **báo Tà Xùa Trip**, kèm ảnh (sao kê…).
- **Admin** xem bằng chứng hai bên rồi ghi kết luận (bắt buộc ghi căn cứ):
  - đã hoàn → kết thúc;
  - cơ sở được giữ → kết thúc;
  - cơ sở phải hoàn → mở lại, hạn mới 3 ngày.
- **Hệ thống không chuyển tiền**; kết luận chỉ là ghi nhận.
- **Bằng chứng lưu cho hai bên:**
  - biên lai cọc của khách;
  - chứng từ hoàn của cơ sở;
  - ảnh khách gửi thêm (R2 riêng tư, mỗi bên ≤ 5 ảnh);
  - số tiền, ghi chú từng bên;
  - lịch sử từng bước (ai, lúc nào).
- Nhắc: mở đối soát báo cả hai bên; quá hạn 3 ngày báo cả hai bên một lần mỗi hạn.

### D-N06-01: Thanh toán theo D03 (13/11/2026)

- **Không có cổng thanh toán, không webhook.** Khách chuyển thẳng vào tài khoản của cơ sở; cơ sở tự kiểm tài khoản rồi bấm xác nhận (thủ công, ghi `booking_events`). Ảnh biên lai chỉ là bằng chứng, **không** làm đơn thành đã trả.
- Một cấu hình duy nhất `src/config/payment.ts`: cọc 30% (làm tròn lên tới đồng), 70% còn lại; mọi màn và server đọc từ đây.
- Tài khoản nhận cọc theo từng cơ sở, chủ cơ sở/admin nhập; ngân hàng chọn trong danh sách mã BIN của NHNN (cấp đến 31/12/2023); tên chủ tài khoản lưu không dấu, in hoa.
- Khách phải tick điều khoản D03 (phiên bản `D03-2026-11-13`) mới thấy tài khoản/mã QR. Lúc tick, server chụp **snapshot**: người nhận, tổng, cọc, 70%, nội dung chuyển khoản (`<mã đơn> COC` / `<mã đơn> CON LAI`), hạn 70%. Cơ sở đổi tài khoản sau đó không ảnh hưởng đơn đã chụp.
- Mã VietQR (chuẩn NAPAS/EMVCo) tạo trong mã nguồn, không gửi dữ liệu ra dịch vụ ngoài.
- Biên lai: chỉ khách chủ đơn gửi; ảnh JPEG/PNG/WebP nhận theo byte đầu file; ≤ 5 MB; ≤ 3 ảnh mỗi khoản; lưu R2 riêng tư; chỉ khách, chủ cơ sở của đơn và admin xem.
- **Hạn 70% = 24 giờ trước 14:00 ngày nhận phòng (giờ VN)** — chủ dự án chốt 13/11/2026; cấu hình `CHECKIN_HOUR_VN`.
- Nhắc khách trả 70% ở mốc 48 giờ và 30 giờ trước giờ nhận phòng, mỗi mốc một lần (cron 5 phút), hiện trong "Chuyến đi của tôi".
- Quá hạn 70% mà cơ sở chưa xác nhận nhận đủ: chủ cơ sở/admin được **nhả phòng** (đơn hủy, phòng mở lại, cọc không hoàn). Đã xác nhận đủ thì không nhả được.
- Biên lai cọc gửi khi giữ chỗ còn hạn nhưng đơn hết hạn/bị từ chối trước khi cơ sở xác nhận: mở **đối soát cọc** (D-N06-02); hệ thống **không** tự xác nhận lại hay giữ lại phòng.

### D-N05-03: Vòng đời đơn (13/11/2026)

- Chỉ server đổi trạng thái, theo bảng `src/server/bookings/lifecycle.ts`:
  - Chờ cọc → Đã xác nhận: chủ cơ sở/admin bấm "Đã nhận cọc" (D03), chỉ khi giữ chỗ còn hạn.
  - Chờ cọc → Đã hủy: chủ cơ sở/admin từ chối, **bắt buộc lý do** (khách thấy lý do).
  - Đã xác nhận → Đã nhận phòng: chủ cơ sở/admin, **chỉ qua mã QR**, từ ngày nhận phòng tới trước ngày trả phòng (giờ VN).
  - Đã nhận phòng → Hoàn tất: chủ cơ sở/admin. Chưa cộng điểm/thu phí (N06).
  - Hủy: khách hủy được giữ chỗ còn hạn, hoặc đơn đã xác nhận trước ngày nhận phòng (cọc không hoàn, D03); admin hủy được trước khi nhận phòng.
- **Chủ cơ sở chưa tự hủy đơn đã xác nhận** cho tới khi N06.1 làm quy tắc quá hạn 70% (D03); trường hợp cần nhả phòng thì nhờ admin.
- Làm lại thao tác đã xong trả "đã làm" (200, `already: true`), không ghi lịch sử thêm.
- Mỗi lần đổi trạng thái ghi `booking_events` (ai, vai trò, từ → đến, lý do, lúc nào), cả lúc giữ chỗ và hết hạn.
- Mã QR nhận phòng: đường dẫn `/doi-tac/nhan-phong?ma=<256 bit ngẫu nhiên>`, tạo khi xác nhận, chỉ khách chủ đơn đọc được. Ảnh QR tạo trong trình duyệt. Mã sai/trái cơ sở/chưa tới ngày/quá ngày trả phòng bị chặn.
- Báo chủ cơ sở (Q3) đợt này: chuông trong dashboard (bảng `notifications`, khi có giữ chỗ mới hoặc khách hủy) + nút mở Zalo/gọi khách. Web Push (cần khóa VAPID) và email (cần dịch vụ gửi mail) chờ chủ dự án chọn.

### D-N05-02: Giữ chỗ homestay (13/11/2026)

- Giữ phòng cần đăng nhập (đơn gắn với tài khoản, khóa chống gửi trùng tính theo tài khoản).
- Giữ chỗ 30 phút. Quá hạn chưa cọc: phòng tự không còn bị tính ngay theo `hold_expires_at`; cron 5 phút chuyển đơn sang `expired` và nhả phòng.
- Một yêu cầu giữ chỗ ghi đơn + mọi đêm + lượt voucher trong **một batch D1**; thiếu đêm nào thì cả batch hủy (không giữ lẻ đêm).
- Gửi lại cùng khóa trả lại đúng đơn cũ; cùng khóa nhưng khác nội dung → 422.
- Voucher có giới hạn lượt: tính lượt đã dùng + lượt của đơn còn hiệu lực (giữ chỗ còn hạn, đã xác nhận, đã nhận phòng, hoàn tất). Giữ chỗ hết hạn/hủy trả lượt.
- **Cọc (chủ dự án chốt 13/11/2026):** 30% tổng tiền, làm tròn tới đồng; mã làm tròn **lên** (`Math.ceil`) để cơ sở không nhận thiếu. Chưa thu tiền qua website (D03: chuyển thẳng cơ sở); `DEPOSIT_PERCENT` trong `src/server/bookings/holds.ts`.

### D-N05-01: Quy tắc tồn phòng (13/11/2026)

- Tồn tính theo từng đêm, từng hạng phòng. Phòng trống của một khoảng ngày là đêm ít phòng nhất; đêm của ngày trả phòng không tính.
- Giữ tồn: `held` còn hạn, `confirmed`, `checked_in`. Không giữ: `held` hết hạn (tự hết tác dụng theo `expires_at`), `released` (hủy, hết hạn đã dọn, không đến).
- Chủ cơ sở đặt "còn N phòng" cho từng đêm; hệ thống lưu số phòng khóa = (tổng − đã giữ/đặt) − N và không cho mở quá số phòng đã có khách.
- Tổng phòng của hạng phòng lấy từ hồ sơ đã duyệt; sửa tổng phòng phải qua duyệt như các thông tin khác.

### D-N04-01: Cách tính báo giá và lựa chọn tìm kiếm (13/11/2026)

- Ngày tính theo giờ Việt Nam (UTC+7). Ngày mặc định: nhận phòng ngày mai, 1 đêm. Tối đa 30 đêm mỗi lần đặt.
- Đêm cuối tuần là đêm bắt đầu vào thứ Sáu hoặc thứ Bảy; ngày lễ do admin nhập (`site_content` khóa `pricing_holidays`) cũng tính giá cuối tuần (D04).
- Trẻ em tính vào sức chứa phòng như người lớn và không có giá riêng (D04 không có quy định riêng cho trẻ em). Muốn đổi (vd miễn tính trẻ dưới 6 tuổi) thì ghi quyết định mới.
- Báo giá có hạn 30 phút, lưu snapshot kèm phiên bản hồ sơ; chỉ báo giá cho hạng phòng có giá ngày thường và cuối tuần > 0.
- Không nhập voucher mẫu; voucher do admin tạo. Phần trăm giảm làm tròn xuống tới đồng.
- Nguồn khách: ghi `utm_*`/`ref` lần chạm đầu, lưu ở trình duyệt khách và gắn vào đơn.

### D-U2-01: Bảng đường dẫn (13/11/2026)

Đường dẫn tiếng Việt không dấu (Q2 không làm tiếng Anh). Đổi đường dẫn đã công khai phải giữ chuyển hướng từ đường dẫn cũ.

| Màn | Đường dẫn |
|---|---|
| Trang chủ | `/` |
| Lưu trú | `/luu-tru` |
| Di chuyển | `/di-chuyen` |
| Dịch vụ | `/dich-vu` |
| Ăn uống | `/an-uong` |
| Bản đồ | `/ban-do` |
| Dự báo săn mây | `/san-may` |
| Lịch trình | `/lich-trinh` |
| Cộng đồng | `/cong-dong` |
| Hồ sơ thẩm định | `/tham-dinh` |
| Kênh đối tác | `/doi-tac` |
| Quản trị | `/quan-tri` |
| Chi tiết cơ sở | `/co-so/:id` |
| Chuyến đi của tôi | `/chuyen-di-cua-toi` |

Bộ lọc giữ trong query: `checkin`, `checkout`, `area`, `wishlist`. Link kiểu cũ `?tab=`/`?listing=` tự chuyển sang đường dẫn mới.

### D-N03-01: Dữ liệu danh bạ thật chỉ gồm thông tin có nguồn (12/11/2026)

- Nhập 172 cơ sở từ `scraped-taxua-enriched.json`, đều Cấp 1, giữ ID cũ. Ngày thu thập ghi `2026-11-04` theo `updatedCalendarDate` mà `build-mockdata.js` gán khi sinh bộ dữ liệu (ngày thu thập gốc không lưu lại).
- Không nhập 6 cơ sở do script tự viết (`homestay-may`, `homestay-lutre`, `coffee-mi-oi`, `tx-taxi-1`, `tx-rescue-1`, `tx-bike-1`).
- Không nhập điểm sao, số đánh giá, tọa độ suy theo khu vực, huy hiệu cấp 2–3, hạng phòng/menu/gói và giá do script tự gán. Giá 0 hiển thị "Liên hệ"; cơ sở không có giá không đặt online được.
- `hasCloudView` lấy theo thẻ do nguồn ghi ("View săn mây"…), hiển thị là "cơ sở tự khai" cho tới khi xác minh.
- Sửa của chủ cơ sở luôn qua duyệt; admin sửa công khai ngay và ghi `audit_log`. Gỡ cơ sở = chuyển `rejected`, không xóa dữ liệu.

### D-SP-2026-11-12: Chính sách sản phẩm do chủ dự án chốt (12/11/2026)

Các quyết định dưới đây thay phần "chưa chốt" của D03, D04, D05, D06, D07, D08, Q1–Q4 trong plan. Mọi đợt code về sau làm theo bảng này; muốn đổi phải ghi quyết định mới.

| Mã | Quyết định |
|---|---|
| **D03 – Tiền cọc** | Cọc **30%**, khách chuyển **thẳng vào tài khoản ngân hàng của từng cơ sở** (VietQR theo tài khoản cơ sở đã xác minh). **70% còn lại phải trả trước giờ nhận phòng 24 giờ** để chốt phòng. Website **không giữ tiền**; cơ sở bấm xác nhận "đã nhận cọc" / "đã nhận 70%". |
| **Quá hạn 70%** | Hệ thống nhắc khách ở mốc trước 48 giờ và trước 30 giờ. Quá mốc trước 24 giờ mà cơ sở chưa xác nhận nhận đủ 70% thì cơ sở được quyền nhả phòng, khoản cọc 30% không hoàn. |
| **Hủy** | **Không hoàn tiền.** Điều khoản phải hiển thị rõ và khách tick đồng ý **trước khi** thấy mã chuyển cọc. |
| **Đổi ngày do thời tiết/sạt lở** | Website **không tự áp ngoại lệ**; chỉ hiển thị ghi chú "khách thỏa thuận trực tiếp với cơ sở". |
| **Pass phòng/tour (đợt N06.4)** | Chỉ thành viên đã xác minh SĐT được pass và nhận pass. Giá pass **không cao hơn tổng số khách đã trả cho cơ sở** (30% hoặc 100%). Pass trước giờ nhận phòng ít nhất 24 giờ. Cơ sở được báo và xác nhận đổi tên khách. Người nhận trả tiền trực tiếp cho người pass (website không giữ tiền); đơn khóa riêng cho người nhận 2 giờ, người pass bấm "đã nhận tiền" thì đơn chuyển tên; trao đổi qua chat có lưu bằng chứng. Miễn phí giai đoạn đầu. |
| **D04 – Giá** | Giá theo từng đêm; đêm cuối tuần = đêm thứ Sáu, thứ Bảy và ngày lễ (danh sách lễ do admin nhập). Sức chứa theo số cơ sở khai cho từng phòng. **Không có giá trẻ em riêng.** Giữ chỗ chờ cọc 30 phút, hết hạn tự nhả phòng. |
| **D05 – Điểm Mây** | Chỉ cộng khi đơn **hoàn tất**; có thể cộng thêm khi review có ảnh, pass thành công, giới thiệu thành viên. Đổi thành voucher tại cơ sở tham gia, không đổi ra tiền. Hết hạn sau 12 tháng. |
| **Phí nền tảng** | **Không cố định 50.000đ/đơn**: mỗi cơ sở một mức phí riêng do admin cài sau khi thỏa thuận; thu bằng **hóa đơn cuối tháng** gửi đối tác. |
| **D06 – Xác minh** | Ba cấp: Cấp 1 tự khai; Cấp 2 đã xác minh giấy tờ (GPKD hoặc CCCD chủ + gọi điện + ảnh mới có thời gian chụp); Cấp 3 thẩm định thực địa (người đi, ngày, ảnh tại chỗ). Huy hiệu hết hạn sau 12 tháng; mỗi thông tin "đã xác minh" hiển thị nguồn và ngày. Giấy tờ lưu R2 riêng tư. 179 cơ sở hiện có bắt đầu ở Cấp 1. **Người xác minh: chủ dự án.** |
| **SOS** | Chỉ hiển thị số đã gọi thử (ghi người gọi, ngày gọi). Chưa có thì chỉ hiển thị 113, 114, 115. Bỏ mọi cam kết thời gian cứu hộ. |
| **D07 – Chat** | Chỉ người trong cuộc đọc; admin đọc khi có phiếu khiếu nại và mỗi lần đọc được ghi log; lưu 12 tháng sau ngày trả phòng hoặc tới khi khiếu nại đóng; khách xóa tài khoản thì ẩn danh. Đối chiếu Nghị định 13/2023 về bảo vệ dữ liệu cá nhân trước khi mở thật. |
| **D08 – AI, thời tiết** | AI dùng Gemini (đã có khóa) với trần ngân sách theo tháng. Thời tiết dùng Open-Meteo; kiểm tra điều khoản sử dụng thương mại trước khi mở beta. |
| **Q1** | React Router cho trang có đường dẫn riêng (U2). |
| **Q2** | Không làm tiếng Anh; chữ giao diện để trực tiếp trong code. |
| **Q3 – Báo cho chủ cơ sở** | Chuông thông báo trong dashboard + Web Push + email + nút "Mở Zalo". Zalo OA/ZNS khi có pháp nhân. Không dùng Telegram cho chủ cơ sở. |
| **Q3b – Telegram cho admin** | Admin nhận báo đơn mới, khiếu nại, lỗi hệ thống và trao đổi hai chiều với J.A.R.V.I.S. qua **bot Telegram**. Chỉ chat ID admin trong danh sách cho phép được dùng; webhook có secret; token bot là secret của Worker. Lệnh từ Telegram chỉ tra cứu/tóm tắt hoặc thao tác **từng việc có xác nhận**, ghi log; không duyệt/đóng hàng loạt (giữ nguyên nguyên tắc G0.5). Website vẫn là kênh chính, Telegram là kênh phụ. Làm ở đợt **A1** (thông báo + tra cứu) sau N05.3 và **A2** (J.A.R.V.I.S. hai chiều) cùng N08.2. |
| **Q4 – Tên miền** | Chưa có; chủ dự án mua sau. Khi có, thêm hostname vào Turnstile và gắn vào Worker. |

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
