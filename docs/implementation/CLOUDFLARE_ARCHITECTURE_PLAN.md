# Plan hạ tầng Cloudflare và điều chỉnh N02

Ngày cập nhật: **12/11/2026**, theo yêu cầu chủ dự án dùng Cloudflare cho database, lưu trữ và chống bot/spam. **Trạng thái: thiết kế đích; chưa triển khai hoặc xác minh tài khoản Cloudflare.**

Tài liệu này thay định hướng PostgreSQL/Supabase mặc định trong plan cũ. Báo cáo review N02 cũ được giữ làm lịch sử lỗi; các tiêu chí phụ thuộc PostgreSQL/RLS được chuyển sang D1 và kiểm tra quyền tại backend, không bỏ yêu cầu bảo vệ tương ứng.

## 1. Kiến trúc được chọn để triển khai

| Thành phần | Lựa chọn mặc định | Trách nhiệm và giới hạn |
|---|---|---|
| Frontend | React/Vite → Workers Static Assets | Giữ UI hiện có; build frontend tách khỏi backend; frontend và API cùng origin |
| Backend | Cloudflare Workers | Giữ Express qua adapter Node HTTP được hỗ trợ nếu kiểm thử runtime đạt; tách entry Node/Vite; không viết lại UI hoặc thêm framework vì đổi hosting |
| Dữ liệu quan hệ | Cloudflare D1 | Profiles, providers, ownership, sessions và booking thuộc N02; các bảng danh bạ/giao dịch/chat thêm đúng nhóm sau |
| Tệp | Cloudflare R2 | Bucket media công khai chỉ chứa nội dung đã duyệt; bucket riêng chứa biên lai/hồ sơ/bằng chứng; metadata và quyền ở D1 |
| Chống bot ở form | Cloudflare Turnstile | Widget frontend + kiểm tra Siteverify tại backend; có trải nghiệm lỗi/hết hạn/thử lại |
| Chống lạm dụng đầu vào | WAF, bot protection và rate limiting | Cấu hình theo sản phẩm/gói/domain có thật; ứng dụng vẫn kiểm auth, quota và nội dung |
| Secrets | Worker secrets, secrets CI; local .dev.vars không commit | API key, Turnstile secret và token quản trị chỉ ở server; sitekey Turnstile là thông tin công khai |
| Cache | CDN/Static Assets; KV chỉ khi có nhu cầu cache công khai cụ thể | Không làm nguồn chuẩn cho session, ownership, tiền, tồn phòng hoặc thu hồi quyền |
| Tác vụ nền/đồng bộ chặt | Queues / Durable Objects khi nhóm nghiệp vụ chứng minh cần | Chưa dựng sẵn ở N02; cân nhắc ở N05/N07/N08 theo yêu cầu đồng thời/quota thực tế |

D1 dùng ngữ nghĩa SQLite, không phải PostgreSQL. Hyperdrive hỗ trợ truy cập database PostgreSQL/MySQL có sẵn ở nhà cung cấp khác, không thay cho một database được Cloudflare lưu trong lựa chọn này. Vì chủ dự án muốn lưu database trên Cloudflare và dự án chưa có CRUD PostgreSQL thật, **D1 là lựa chọn triển khai mặc định**, chưa làm thêm nhánh Hyperdrive/PostgreSQL. [D1](https://developers.cloudflare.com/d1/), [Hyperdrive](https://developers.cloudflare.com/hyperdrive/).

Cloudflare có hướng dẫn Express trên Workers và API nối Node HTTP với Worker. Việc có adapter không chứng minh mọi dependency hiện tại tương thích: phải kiểm import graph, crypto, SDK AI, xử lý stream và CPU trên workerd. Pin compatibility_date và giải thích flag theo phiên bản thực tế; không lấy `node dist/server.js` làm bằng chứng Worker chạy đúng. [Express trên Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/), [Node HTTP](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/).

## 2. Quy tắc dữ liệu và phân quyền

1. **D1 là nguồn chuẩn.** Tất cả thao tác N02 đọc/ghi D1 qua binding `DB` và prepared statements; caller chuyển async đầy đủ. Không trả success dựa trên Map; không fallback sang JSON/RAM khi thiếu binding, schema hoặc DB lỗi.
2. **Migration D1 riêng.** Chuyển UUID/default/function/type sang SQL tương thích D1; tách thư mục migration PostgreSQL cũ khỏi cấu hình chạy. Dùng lịch sử migration Wrangler, chạy lặp chỉ áp dụng phần chưa chạy; seed demo là lệnh test/demo riêng. Không gửi nguyên SQL PostgreSQL vào D1. [SQL D1](https://developers.cloudflare.com/d1/sql-api/sql-statements/), [migrations](https://developers.cloudflare.com/d1/reference/migrations/).
3. **Quyền ở backend và truy vấn.** D1 không cung cấp cơ chế RLS PostgreSQL của plan cũ: bỏ phụ thuộc `auth.uid()/auth.jwt()/CREATE POLICY`. Mọi truy vấn private nhận danh tính từ session server và có điều kiện owner/membership; role/verified/ownership không nhận quyền quyết định từ client. Không có endpoint SQL tổng quát cho trình duyệt.
4. **Phiên lưu bền.** Tiếp tục opaque session, kiểm hạn và trạng thái thu hồi tại D1; khuyến nghị chỉ lưu hash token ở DB, không log token. Không cache phiên ở KV/Map làm chậm logout/thu hồi quyền; nếu bật read replica sau này, kiểm auth/revocation phải bảo đảm đọc nhất quán. Không bắt buộc đổi toàn bộ sang JWT hoặc đổi UX đăng nhập.
5. **Ghi nhiều bước đúng cơ chế D1.** Dùng `DB.batch()` khi cần một nhóm câu lệnh nguyên tử, constraint và SQL có điều kiện; kiểm kết quả ghi. Không giả định có transaction callback/BEGIN hoặc row lock như pg. Đổi mật khẩu và revoke phiên phải cùng một thao tác nguyên tử; đăng ký partner không để profile/provider dở dang. [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
6. **Tiền và tồn phòng ở các nhóm sau.** Lưu tiền bằng số nguyên; ID/ngày/múi giờ nhất quán. N05 phải thiết kế cập nhật tồn có điều kiện, idempotency và kiểm thử tranh phòng; không dựa vào SELECT rồi UPDATE rời nhau hoặc khóa trong RAM. N02 không triển khai trước toàn bộ booking/payment engine.
7. **Giữ dữ liệu hiện hữu.** Không xóa `.data` để chuyển kiến trúc. Chỉ chuẩn bị quy trình export/backup/import tường minh nếu cần chuyển dữ liệu thật; không nhập credential demo hoặc raw session cũ mặc định. Không tự chạy migration/reset/seed trên remote production.

## 3. Runtime, lưu tệp và môi trường

| Nội dung | Yêu cầu triển khai |
|---|---|
| Worker entry | Nhận binding rõ ràng, tạo app/service từ dependency được truyền vào; không dùng singleton DB phụ thuộc filesystem/import side effect |
| Node/dev entry | Có thể giữ lệnh Node hiện có để phát triển nếu dùng cùng logic và backend D1 local được hỗ trợ; ghi rõ lệnh nào là production target. Không duy trì hai data layer có hành vi khác nhau |
| API/SPA | `/api`, `/api/`, `/api/*` chạy API trước SPA fallback; API sai trả JSON 404. Asset không tồn tại không trả index.html giả làm JS; kiểm root và `/taxua-trip/` hoặc cung cấp chuyển tiếp tương thích |
| Static routing | Cấu hình Worker-first cho cả bare `/api` và `/api/*`; không chỉ dựa vào Express guard khi asset router đã xử lý trước Worker. Chỉ xuất bản `dist/client`, không server bundle/source/secret |
| Local | Wrangler/workerd + D1 local, có vị trí state dev cố định để restart không mất dữ liệu. Không cần PostgreSQL/Docker để nghiệm thu D1 local |
| Test | D1 local tạm riêng cho từng run/suite; không remote binding; reset chỉ được dùng kho test được tạo tường minh. Xác nhận sentinel ở kho dev không bị đổi |
| Staging/production | DB và bucket khác nhau; ID/binding không tự kế thừa nhầm môi trường. Thiếu cấu hình bắt buộc phải lỗi rõ. Không đưa remote thật vào npm test |
| Bootstrap | CLI/offline quản trị có target env/database rõ ràng, mặc định local; server và CLI cùng target/persist state. Remote yêu cầu chỉ định tường minh và quyền phù hợp; không tạo route bootstrap công khai |
| Health | Readiness kiểm DB/schema cần thiết; lỗi trả trạng thái không sẵn sàng, không chỉ báo loại engine. Public health không lộ URL, schema chi tiết, secrets hoặc trạng thái có/không có key nhà cung cấp |

Local D1 chạy qua Wrangler; Static Assets có thể fallback SPA nên cần cấu hình ưu tiên API tường minh. [D1 local](https://developers.cloudflare.com/d1/best-practices/local-development/), [Static Assets routing](https://developers.cloudflare.com/workers/static-assets/).

**R2:** tách public/private theo bucket hoặc ranh giới có thể kiểm chứng. Bucket private không bật public domain/r2.dev; download qua Worker có auth/ownership hoặc URL ngắn hạn sau khi cấp quyền. Không cache biên lai/hồ sơ riêng tại CDN/SW. Kiểm MIME, kích thước, tên/object key do server cấp; quyền không dựa vào đường dẫn client tự chọn. N02 chuẩn bị cấu hình và chính sách; endpoint upload/CMS đầy đủ triển khai ở nhóm cần dùng. R2 mặc định không public; public access phải được cấu hình riêng. [R2 public/private](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## 4. Chống bot, spam và lạm dụng

### Lớp 1: đầu vào Cloudflare

- Dùng domain được Cloudflare bảo vệ; ghi checklist DNS/HTTPS/WAF theo gói thực tế. Chưa có tài khoản/domain thì bàn giao cấu hình mẫu và ghi chưa kích hoạt.
- Không giả định đã có bot score Enterprise, advanced rate limiting hoặc khả năng skip rule ở mọi gói. Bot Fight Mode có thể ảnh hưởng API/monitoring; phải kiểm ngoại lệ được sản phẩm hỗ trợ trước khi bật. Không blanket challenge webhook có chữ ký hoặc client API hợp lệ. [Bot protection](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/).
- Tránh đường vào bỏ qua rule: rà workers.dev, preview URL, origin Node cũ và public storage URL; tắt hoặc bảo vệ theo mục đích triển khai. App-level auth/Turnstile/limiter vẫn bắt buộc trên mọi entry được mở.
- Có thể thêm Cloudflare Access cho vùng admin khi triển khai, nhưng Access không thay RBAC trong app; nếu tin Access JWT phải xác minh đúng issuer/audience/chữ ký.

### Lớp 2: Turnstile tại form và API

- N02 tích hợp đăng ký/đăng nhập; các form gửi công khai/tốn tài nguyên khác áp dụng theo nhóm tính năng. Không gắn thử thách vào mọi GET, logout hoặc webhook; giữ khả năng dùng app trên mobile và khi mạng yếu.
- Frontend gửi token cho backend; backend gọi Siteverify với secret, kiểm `success`, hostname/action được cấu hình. Thiếu/sai/hết hạn/replay bị từ chối; timeout hoặc cấu hình thiếu không cho tạo user/session. Cho phép người dùng tạo token mới và thử lại, không lộ lý do nội bộ nhạy cảm.
- Token Turnstile có hạn ngắn và chỉ dùng một lần; không coi token này là xác thực danh tính hoặc bằng chứng đã xác minh SĐT/email. Test dùng mock Siteverify hoặc test keys có chế độ rõ ràng, không có bypass production qua biến client. [Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

### Lớp 3: ứng dụng

| Đường đi | Kiểm soát bắt buộc | Giai đoạn |
|---|---|---|
| Login/register | Giới hạn theo IP đáng tin + identifier đã chuẩn hóa; giới hạn burst và cửa sổ dài; lỗi đăng nhập không tiết lộ account; tránh khóa account vĩnh viễn theo IP chung | N02 |
| AI công khai | Giới hạn IP/session; giới hạn độ dài, payload, timeout; ngân sách/quota server; không gọi provider khi đã bị chặn | N02 nền, N08 quota/chi phí đầy đủ |
| Admin/gateway | RBAC + quota; không nhận URL/key client; ghi log thao tác tối thiểu, không ghi secrets | N02, N08 |
| Đăng ký partner/claim/upload | Trạng thái pending, quyền cấp ownership từ admin; hạn số lượng/kích thước, kiểm gửi trùng | N02 nền, N03 đầy đủ |
| Review/chat/cộng đồng | Membership/booking eligibility; cooldown, giới hạn link/tần suất, chặn nội dung trùng, report/moderation; không chỉ dựa captcha | N06–N07 |
| Booking/payment | Idempotency và giới hạn nghiệp vụ; không lấy CAPTCHA/rate limiter làm cơ chế chống đặt trùng hoặc chống ghi tiền hai lần | N05–N06 |

Ngưỡng rate limit là cấu hình có tên cho từng route, điều chỉnh bằng log/test; không coi số ngưỡng tự đặt là chính sách vận hành đã được chủ dự án duyệt. Vượt giới hạn trả JSON 429 và Retry-After khi xác định được; không trả trang challenge HTML vào API app.

Workers rate limiting binding có tính xấp xỉ và cục bộ theo Cloudflare location, phù hợp giảm burst. **Quota bắt buộc chính xác** cho account/provider budget dùng cập nhật nguyên tử D1 hoặc Durable Object khi cần; không tuyên bố edge limiter là bộ đếm toàn cầu chính xác. Không dùng Map làm limiter production. [Giới hạn rate limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

Chỉ tin IP từ metadata/header do Cloudflare ghi trong đường đi đã bảo vệ; không bật trust proxy tùy ý hoặc tin X-Forwarded-For từ mọi client. Log request ID, route, kết quả block và định danh đã giảm thông tin; không log password/token/captcha secret/toàn bộ nội dung riêng.

## 5. Phân việc N02 và đối chiếu lỗi S1–S6

| Đợt | Phạm vi và lỗi xử lý | Bằng chứng nghiệm thu |
|---|---|---|
| **N02.0 — Cô lập test** | S1: truyền DB test riêng, chặn reset nhầm, tách fixture; loại `.data/.wrangler/.dev.vars` và dữ liệu nhạy cảm khỏi source/artifact bằng cấu hình phù hợp | Test không đổi user/file/state có sẵn; không chạm DB remote; production sạch không có admin demo |
| **N02.1 — D1 thực sự** | S2/S4/S5: CRUD async, migration version, constraint, lỗi fail rõ; không triển khai tiếp pg.Pool; seed tách riêng | Dữ liệu có hàng SQL; instance khác/restart đọc được; migration lần hai an toàn; lỗi DB không success |
| **N02.2 — Auth/bootstrap** | S3: cùng database/env/state; đổi mật khẩu + revoke nguyên tử; giữ login SĐT | CLI riêng → artifact Worker login thành công; password/session cũ bị từ chối; restart còn tài khoản |
| **N02.3 — Quyền và UI** | S5/S6: truy vấn owner/membership, DTO booking, MyTrips không fallback chung; gateway URL/key whitelist | A/B bị cách ly; không tự xác minh/gán listing; tìm kiếm không crash; logout/đổi user/request cũ không hiện dữ liệu sai |
| **N02.4 — Runtime đích** | Worker entry, Static Assets, bindings, cấu hình local/test/staging/prod; giữ hành vi F1–F3 tương ứng entry được hỗ trợ | Artifact workerd xử lý auth/API/static đúng; không lộ bundle/source; Node entry giữ lại phải có regression test |
| **N02.5 — Anti-abuse** | Turnstile register/login, limiter auth/AI, giới hạn payload; cấu hình/runbook WAF theo gói | Token invalid/timeout/sai hostname-action bị chặn; rate limit trả 429 trước DB/provider; UI thử lại đúng |
| **N02.6 — CI và bàn giao** | Kiểm source sạch với DB test riêng, migration, bootstrap, restart, gateway mock, UI; cập nhật tài liệu | Lệnh tái lập được; mỗi tiêu chí có bằng chứng; tách local đạt / cloud chưa kiểm chứng; không tự tuyên bố N03 sẵn sàng khi còn blocker |

Thứ tự thực hiện: N02.0 → N02.1; N02.2–N02.4 nối đầy đủ theo dependency; sau đó N02.5–N02.6. Không dừng ở việc thêm file cấu hình hoặc đổi tên lớp Map thành D1 adapter.

## 6. Điều chỉnh các nhóm còn lại

| Nhóm | Yêu cầu thêm do Cloudflare |
|---|---|
| N01 | Giữ validation, API JSON 404, khóa gateway và kiểm secrets; chuyển các kiểm tra đó sang Worker, không mất guard khi đổi entry |
| N03 | Listings/CMS/importer ghi D1; media approved R2 public, giấy tờ xác minh R2 private; upload/claim có quota, không public dữ liệu nhạy cảm |
| N04 | Query/index/pagination D1; cache danh mục approved với invalidation; báo giá cá nhân không cache chung |
| N05 | Chống tranh tồn bằng SQL có điều kiện/atomic batch và test song song; nếu cần Durable Objects thì ghi rõ ranh giới, không tạo hai nguồn tồn kho |
| N06 | Ledger/idempotency D1; biên lai R2 private; webhook xác minh chữ ký, retry an toàn, không yêu cầu Turnstile |
| N07 | Message/membership D1, attachment R2 private; cân nhắc Durable Objects cho realtime khi cần; anti-spam/quyền đọc và audit export độc lập với captcha |
| N08 | AI key trong Worker secrets; timeout/cost/quota dùng chung; Queues cho tác vụ dài khi cần, không dựa timer trong request để giả hoàn thành |
| N09 | Cùng quy tắc tồn/idempotency của N05; không khóa ghế bằng Map trong từng Worker |
| N10 | Deploy staging Cloudflare khi có môi trường; kiểm custom domain/WAF/Turnstile/R2 thật, limits/chi phí theo gói, no-store riêng tư; backup/export/restore thử trên DB khác |

## 7. Điều kiện nghiệm thu và phần còn chờ

**N02 local đạt** chỉ khi test dùng D1 local + artifact Worker chứng minh CRUD, restart, bootstrap riêng, thu hồi phiên, quyền A/B, DTO UI, fail khi DB lỗi và chống abuse. Unit test Map, build Node hoặc tổng test pass không thay các bằng chứng này.

**Cloud đạt** cần D1/R2 staging thật, domain/secret Turnstile thật, cấu hình bảo vệ đúng gói và kiểm đường vào/cache. Khi chưa được cấp account/key/domain, vẫn hoàn thiện local; ghi cloud **chờ kiểm chứng**, không tự deploy hoặc tạo tài nguyên trả phí.

Chưa biết gói Cloudflare, account ID, domain, database/bucket ID và ngân sách được chọn. Plan không cam kết miễn phí, hạn mức, vị trí dữ liệu hay bảo vệ toàn bộ spam; các thông số này phải xác minh trước khi mở beta. Tài liệu nền tảng được kiểm tra từ nguồn chính thức tại thời điểm cập nhật; chưa có thao tác lên tài khoản Cloudflare.
