# Prompt giao Antigravity sửa và hoàn thiện N02 trên Cloudflare

Sao chép toàn bộ khối bên dưới vào Antigravity. Đây là yêu cầu triển khai code local, không phải yêu cầu deploy production.

```text
Bạn tiếp tục triển khai dự án Tà Xùa Trip. Chủ dự án đã chọn Cloudflare làm nền tảng database, lưu tệp và chống bot/spam. Hãy sửa code và kiểm thử đến hết phạm vi N02 bên dưới; không dừng ở việc lập thêm plan hoặc chỉ thêm cấu hình.

THƯ MỤC ỨNG DỤNG
C:\Users\ADMIN\Downloads\taxua-trip-main\taxua-trip-main

ĐỌC TRƯỚC KHI SỬA
- AGENTS.md nếu có và trạng thái source hiện tại.
- ANTIGRAVITY_IMPLEMENTATION_PLAN.md (bản đã cập nhật Cloudflare).
- docs/implementation/CLOUDFLARE_ARCHITECTURE_PLAN.md.
- docs/implementation/N02_RECHECK_REVIEW.md: các lỗi S1–S6 là đầu vào phải xử lý.
- docs/implementation/DECISIONS.md, PROGRESS.md; coi các báo cáo cũ là lịch sử, không lấy nhãn “đạt nghiệm thu” cũ làm bằng chứng.

QUYẾT ĐỊNH HẠ TẦNG
1. React/Vite giữ nguyên; production target là Cloudflare Workers + Static Assets, API cùng origin.
2. Database chính là Cloudflare D1 qua binding DB. D1 dùng SQL theo SQLite; không tiếp tục hoàn thiện PostgreSQL/pg.Pool hoặc dựng Supabase song song. Không dùng auth.uid()/auth.jwt()/CREATE POLICY/RLS PostgreSQL trong migration D1.
3. R2 dành cho tệp: media công khai đã duyệt và tệp riêng phải tách ranh giới. N02 chuẩn bị binding mẫu/chính sách quyền; upload/CMS/biên lai/chat đầy đủ thuộc N03/N06/N07.
4. Chống bot/spam gồm Turnstile xác minh tại server, rate limiting và kiểm soát nghiệp vụ. WAF/bot rules phụ thuộc gói Cloudflare thật; không giả định có Bot Management Enterprise hoặc mọi tính năng trả phí.
5. Chưa có account/key/domain vẫn hoàn thiện D1 local, workerd, test, cấu hình mẫu và runbook; ghi cloud chờ kiểm chứng. Không tự deploy production, tạo tài nguyên trả phí hoặc gọi AI trả phí.

THỰC HIỆN THEO THỨ TỰ

A. N02.0 — Cô lập test trước mọi lần chạy suite (S1)
- auth.test.ts đang reset singleton db, xóa kho dữ liệu mặc định rồi nạp admin demo. Sửa tận gốc bằng truyền DB test riêng vào app/auth; test có state/DB tạm riêng, không dùng remote binding hoặc kho dev.
- Reset/seed chỉ hoạt động trên kho test/demo được tạo tường minh. Constructor, startup và migration production không seed admin hoặc credential mẫu.
- Có ca test chứng minh dữ liệu sentinel trong kho dev/vận hành không bị đổi sau suite.
- Loại .data, .wrangler, .dev.vars và secrets/dump test khỏi source/artifact theo cấu hình phù hợp. Không xóa dữ liệu hiện có hoặc in token/hash/password để chứng minh.

B. N02.1 — D1 CRUD và migration thật (S2, S4, S5)
- Thực hiện async prepared statements cho profiles, providers, provider_listings, sessions và các thao tác booking đã thuộc N02; sửa mọi caller. Không đổi tên Map thành adapter rồi giữ CRUD trong RAM.
- Tạo migration D1 có version, constraint/index phù hợp; tách migration PostgreSQL cũ khỏi đường chạy. Dùng lịch sử migration Wrangler; áp dụng lần hai không lỗi hoặc seed lại.
- Thiếu DB/binding/schema hoặc ghi lỗi phải báo lỗi đúng, không fallback Map/JSON hay trả success rồi chỉ log lỗi. Readiness kiểm DB/schema, public response không lộ secrets/cấu hình nội bộ.
- Giữ dữ liệu .data cũ nguyên vẹn; nếu cần chuyển dữ liệu thì viết hướng dẫn/công cụ có dry-run/backup và chỉ chạy khi có yêu cầu. Không tự import demo admin hoặc raw session cũ.
- Dùng batch/constraint/SQL có điều kiện cho ghi nguyên tử cần thiết; không giả định có transaction API hoặc row lock của PostgreSQL.

C. N02.2 — Auth và bootstrap cùng một D1 (S3)
- Giữ đăng nhập bằng email/SĐT đã sửa đúng; nối toàn bộ register/login/me/logout vào D1 và session server.
- Không nhận role admin/isVerified/ownership từ client; partner mới chưa xác minh, sở hữu 0 cơ sở. Token phiên có hạn và bị thu hồi ở DB; không dùng KV/Map làm nguồn quyết định hiệu lực phiên.
- CLI bootstrap có database/environment/persist-state đích rõ ràng; mặc định local, remote phải chỉ định tường minh. Không có endpoint bootstrap công khai hoặc password mặc định.
- Hash mật khẩu/kiểm mật khẩu phải chạy được trên runtime Worker. Đổi mật khẩu + thu hồi phiên cũ phải nguyên tử; không log mật khẩu/token.
- Test CLI ở tiến trình riêng với artifact Worker chạy thật cùng D1 local: tạo admin đăng nhập được, đổi mật khẩu làm password/token cũ trả 401, password mới dùng được và restart vẫn còn dữ liệu.

D. N02.3 — Quyền truy vấn và hợp đồng UI (S5, S6)
- Mọi truy vấn dữ liệu riêng lấy danh tính từ session, lọc owner/membership tại backend. Không coi D1 là có RLS PostgreSQL; không cho frontend truy vấn SQL tổng quát.
- Test khách A/B, partner A/B, thiếu/sai/hết hạn/thu hồi session; tự gán admin, tự xác minh provider, tự nhận listing và truy cập chéo đều bị chặn.
- Giữ phần lọc partnerOwnedListings đã sửa; partner 0 cơ sở có trạng thái chờ, không tự chọn cơ sở demo.
- Thống nhất Booking DTO giữa API và MyTrips. Không ép BookingRecord thiếu listingTitle/guestName/guestPhone/ngày thành Booking[]; không bịa trường khách hoặc ngày để che thiếu dữ liệu.
- MyTrips tìm kiếm không crash; loading/error/empty rõ ràng; 401/logout/đổi tài khoản không fallback về đơn demo chung, không giữ dữ liệu user cũ, bỏ response đến trễ của phiên cũ.
- Giữ Bearer header và xử lý lỗi đúng của admin/Jarvis. Gateway chỉ dùng URL/key server; test bằng mock quan sát đích và credential outbound, không chỉ assert reply success.

E. N02.4 — Runtime Cloudflare và hồi quy F1–F3
- Tách entry Worker khỏi Vite dev server, Node listener, fs persistence và scripts CLI. Ưu tiên giữ Express bằng adapter Node HTTP chính thức; chỉ thay router nếu đã chứng minh incompatibility cụ thể và ghi lý do. Không viết lại frontend.
- Chuẩn bị Wrangler config, compatibility_date có giải thích, binding DB/R2 và tách local/test/staging/production. Không để test kế thừa remote production.
- Build và chạy artifact bằng workerd/Wrangler local; test API và auth trên chính artifact này. Node build pass không thay Worker runtime test.
- Cấu hình /api và /api/* ưu tiên Worker trước SPA; API không tồn tại luôn JSON 404, kể cả bare /api. Asset đúng MIME, asset thiếu 404; không lộ server source/bundle/secret. Giữ root/subpath hiện có hoặc chuyển tiếp tương thích có test.
- Node entry nào giữ hỗ trợ phải còn kiểm tra hồi quy phù hợp; ghi rõ production target mới, không âm thầm giữ hai kho dữ liệu khác hành vi.

F. N02.5 — Chống bot/spam nền
- Tích hợp Turnstile vào register/login với loading/error/expired/retry. Backend gọi Siteverify, kiểm success và hostname/action theo allowlist; thiếu/sai token hoặc verify timeout không được tạo account/session.
- Secret ở Worker secrets; frontend chỉ có sitekey. Mock/test keys có chế độ rõ ràng; không có bypass production do client hoặc thiếu cấu hình.
- Có rate limit auth theo IP đáng tin + identifier, AI theo IP/session; limit payload/độ dài/timeout. Không dùng Map làm bộ đếm production. Không tin X-Forwarded-For tùy ý từ client.
- Workers rate-limit binding là bảo vệ burst xấp xỉ theo location; nếu làm quota chính xác phải dùng cập nhật nguyên tử D1/Durable Object phù hợp, không tuyên bố bộ đếm edge là quota toàn cầu chính xác. Không dựng thêm hệ thống quota lớn ngoài phạm vi N02.
- Vượt giới hạn trả JSON 429, Retry-After khi xác định được; bị chặn thì không gọi provider/ghi dữ liệu. Lỗi limiter hoặc Siteverify không âm thầm bỏ bảo vệ.
- Soạn checklist WAF/bot theo gói và domain thật, tránh blanket challenge API/webhook; kiểm đường workers.dev/preview/origin cũ có thể bỏ qua bảo vệ. Không tuyên bố WAF/Turnstile cloud đã bật nếu chưa thao tác/xác minh.

G. N02.6 — Kiểm thử và bàn giao
- Cài theo lockfile khi cần; typecheck, build rồi smoke test cần artifact. Unit tests có thể chạy sớm; toàn bộ tests dùng dữ liệu cô lập.
- Tối thiểu phải có bằng chứng D1 SQL thật ở local, migration lần đầu/lần hai, restart tiến trình, CLI riêng, password/session revocation, A/B ownership, lỗi DB, MyTrips search/401/account switch, Turnstile invalid/timeout/hostname-action và rate limit 429.
- Mock Siteverify/provider để test không cần key thật hoặc gọi dịch vụ trả phí. Kiểm tra UI thay đổi bằng trình duyệt nếu môi trường hỗ trợ; thiếu môi trường thì ghi đúng phần chưa chạy.
- Cập nhật README, scripts/config mẫu, DECISIONS, PROGRESS theo từng đợt; tạo docs/implementation/N02_CLOUDFLARE_ACCEPTANCE.md với bảng S1–S6, cách sửa, test cụ thể, kết quả và giới hạn.
- Tách rõ “đạt local D1/workerd” và “cloud/staging chờ kiểm chứng”. Không tự ghi “100% N02/production-ready/sẵn sàng N03” chỉ vì tổng test xanh hoặc có file cấu hình.

NGUYÊN TẮC PHẠM VI
Không tự triển khai N03–N09, không thay UI ngoài phần cần để sửa hợp đồng/auth/Turnstile. Giữ logic có giá trị và các bản sửa đã đúng; xóa nhánh giả lập/adapter không dùng khi đã chuyển caller và test đầy đủ. Không thêm nhiều data backend hoặc framework để dự phòng.

BẮT ĐẦU NGAY
Tóm tắt ngắn các bước, sau đó sửa N02.0 trước rồi tiến hành các phần còn lại. Không hỏi lại những quyết định đã nêu ở trên. Nếu thiếu cloud credentials, tiếp tục phần local độc lập và báo chính xác bước cloud còn chờ.

KẾT THÚC BẰNG
1. Các tệp/migration/caller đã sửa và đối chiếu S1–S6.
2. Lệnh chạy local, migrate, bootstrap và kiểm thử thực sự tồn tại.
3. Kết quả từng kiểm tra quan trọng, có phân biệt D1/workerd với mock và cloud.
4. Việc còn thiếu, trạng thái từng đợt N02 và điều kiện chuyển N03.
```
