# Tà Xùa Trip — Plan giao việc code cho Antigravity

Ngày lập: **12/11/2026**. Nguồn: `PROJECT_AUDIT_PLAN.md` trong cùng thư mục.

**Cập nhật hạ tầng 12/11/2026 theo yêu cầu chủ dự án:** chọn Cloudflare làm nền tảng đích. Mặc định thiết kế **Workers + Static Assets, D1, R2, Turnstile và WAF/rate limiting theo gói thực tế**. Chi tiết và tiêu chí nghiệm thu tại [CLOUDFLARE_ARCHITECTURE_PLAN.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/CLOUDFLARE_ARCHITECTURE_PLAN.md). Các chỉ dẫn PostgreSQL/Supabase/RLS cũ được thay bằng D1 và phân quyền tại backend/truy vấn; không yêu cầu làm thêm adapter PostgreSQL song song. Đây là thiết kế được cập nhật, **chưa phải code/tích hợp Cloudflare đã hoàn thành**.

**Lượt triển khai hiện tại:** N02 chưa đạt nghiệm thu theo [N02_RECHECK_REVIEW.md](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_RECHECK_REVIEW.md). Dùng [prompt sửa N02 trên Cloudflare](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/ANTIGRAVITY_N02_CLOUDFLARE_PROMPT.md); hoàn thiện N02 trước khi nối dữ liệu thật của N03.

**Mục tiêu:** chuyển bản mẫu hiện tại thành một bản beta có tài khoản thật, dữ liệu chung, giao dịch homestay đúng và các chức năng hỗ trợ có thể kiểm chứng. Giữ giao diện và những phần mã đang có giá trị; hoàn thiện từng luồng từ giao diện tới CSDL.

**Cách sử dụng:** gửi “Prompt nền” một lần khi bắt đầu phiên Antigravity; sau đó gửi prompt của nhóm cần thực hiện. Mỗi lần giao một nhóm, hoặc một đợt nhỏ như `N06.1`. Các prompt nhóm đều yêu cầu thực hiện code và kiểm thử, không chỉ lập thêm kế hoạch.

Các tên bảng, API và tệp mới trong tài liệu là **thiết kế đề xuất**, chưa tồn tại trong dự án. Antigravity phải kiểm tra lại mã hiện tại trước khi sửa vì số dòng và trạng thái có thể đã thay đổi sau lần audit.

## 1. Bảng tổng hợp 10 nhóm công việc

Mỗi nhóm bắt đầu ở trạng thái **Chưa làm**. Quy mô chỉ để chia việc, không phải cam kết thời gian: S = 1–2 ngày, M = 3–5 ngày, L = 1–2 tuần, XL = 2–4 tuần công. Một nhóm lớn phải triển khai theo các đợt nhỏ ở phần chi tiết.

| Nhóm | Kết quả cần bàn giao | Đợt thực hiện | Phụ thuộc | Audit liên quan | Quy mô |
|---|---|---|---|---|---|
| **N01** | Dự án khởi động được; API không làm sập server; đóng các lỗ hổng đang có; CI nền | N01.1 môi trường; N01.2 API/gateway; N01.3 HTML/demo | Không | 03, 04, 05, 14, 16, 19 | M–L |
| **N02** | D1 lưu bền, tài khoản/quyền thật, Workers chạy được, chống abuse nền | N02.1 D1; N02.2 auth/bootstrap; N02.3 ownership; N02.4 runtime; N02.5 chống bot/spam; N02.6 nghiệm thu | N01 | 01, 02, 04; S1–S6 | XL |
| **N03** | Danh bạ/CMS dùng dữ liệu lưu bền; hồ sơ có nguồn và quy trình duyệt | N03.1 dữ liệu; N03.2 CRUD/duyệt; N03.3 nối UI | N02 | 02, 11, 12, 19 | L–XL |
| **N04** | Tìm kiếm xuyên suốt và một nguồn báo giá/voucher thống nhất | N04.1 ý định tìm kiếm; N04.2 báo giá; N04.3 voucher | N03 | 08, 20 | L |
| **N05** | Tồn phòng theo ngày; giữ chỗ hết hạn; vòng đời booking chống đặt trùng | N05.1 lịch; N05.2 giữ chỗ; N05.3 quản lý đơn | N04 | 06, 10 | XL |
| **N06** | Thanh toán/cọc, phí, điểm, review và khiếu nại có sổ giao dịch | N06.1 cọc; N06.2 phí/điểm; N06.3 review/khiếu nại | N05 | 09, 10, 14 | XL |
| **N07** | Chat riêng lưu bền, bằng chứng kiểm chứng được; cộng đồng có phân quyền | N07.1 chat; N07.2 bằng chứng; N07.3 cộng đồng | N03; phần booking cần N05–N06 | 13, 14 | XL |
| **N08** | AI đọc nguồn đúng; trạng thái thật; thời tiết/SOS có nguồn và tuổi dữ liệu | N08.1 tư vấn; N08.2 gateway/Jarvis; N08.3 thời tiết/SOS | N04–N06; trích dẫn chat cần N07 | 04, 12, 14, 15 | XL |
| **N09** | Nhà xe, chuyến theo ngày, ghế và xe máy dùng cùng dữ liệu và lõi giao dịch | N09.1 chuẩn hóa ghế; N09.2 tồn chỗ; N09.3 xe máy/combo | N05–N06 | 07, 08, 09 | XL |
| **N10** | PWA, tốc độ tải, URL/SEO, triển khai và kiểm thử beta hoàn chỉnh | N10.1 offline; N10.2 hiệu năng; N10.3 phát hành | Theo các tính năng được mở | 16, 17, 18, 19, 20 | L–XL |

**Đường đi MVP homestay:** N01 → N02 → N03 → N04 → N05 → N06 → chat riêng tối thiểu N07.1/N07.2 → N10. AI tư vấn N08 và vận tải N09 có thể mở sau bằng công tắc tính năng; khi chưa hoàn thiện phải hiển thị đúng trạng thái hoặc đóng chức năng giao dịch tương ứng.

N07.3 là phần cộng đồng nâng cao, không bắt buộc cho giao dịch homestay đầu tiên. Các nhóm khác nhau có thể được lên lịch xen kẽ khi đủ phụ thuộc, nhưng không giao hai phiên cùng sửa App/schema/kiểu dữ liệu chung nếu chưa thống nhất ranh giới thay đổi.

## 2. Các quyết định sản phẩm và hạ tầng

Ghi quyết định vào `docs/implementation/DECISIONS.md` khi bắt đầu triển khai. Bảng này giúp Antigravity tiếp tục phần có thể code mà không tự suy đoán các quy tắc về tiền hoặc xác minh.

| Mã | Quyết định | Hướng xử lý trong lúc triển khai |
|---|---|---|
| D01 | Hạ tầng CSDL, auth và storage | Chọn Cloudflare D1 làm CSDL SQL đích, R2 lưu tệp. Giữ React/Vite; auth/session do backend kiểm tra trên D1. Migration dùng SQLite/D1 và lịch sử Wrangler; không dùng pg.Pool/auth.uid()/RLS PostgreSQL. Chỉ cân nhắc Hyperdrive + PostgreSQL ngoài Cloudflare nếu sau này có yêu cầu được xác nhận; không làm hai backend DB ở N02. |
| D02 | Nơi triển khai frontend/backend | Cloudflare Workers + Static Assets cùng origin. Ưu tiên giữ Express bằng adapter Node HTTP được Workers hỗ trợ và kiểm thử workerd; tách Vite/fs/listener Node khỏi entry Worker. GitHub Pages chỉ còn demo tĩnh nếu giữ; không dùng làm bản beta auth/giao dịch. N02 làm runtime local và cấu hình; N10 nghiệm thu staging/production. |
| D03 | Tiền cọc và người nhận | Chưa thống nhất 30% hay 50%; chưa chốt cơ sở nhận trực tiếp hay qua đơn vị trung gian. N06 đưa thành cấu hình và lưu bản chụp điều kiện vào payment/booking; môi trường thật không cho thanh toán nếu cấu hình chưa đầy đủ. Test cả hai tỷ lệ, không tự chọn chính sách thu tiền thật. |
| D04 | Giá cuối tuần, trẻ em, phòng/khách và hủy đơn | N04/N05 phải mô tả rõ cách tính một đêm, múi giờ, ngày cuối tuần, giới hạn khách/phòng và hạn giữ chỗ. Mẫu test được dùng giả định có ghi nhãn; chính sách công khai phải là cấu hình đã được người vận hành xác nhận. |
| D05 | Phí và Điểm Mây | Giữ định hướng 50.000đ/booking hoàn tất, mặc định tắt thu phí; mốc 10.000 thành viên đã xác minh lấy từ dữ liệu thật. Tỷ lệ tích/đổi điểm, thời hạn và quy tắc thu hồi cần cấu hình thống nhất; không lấy công thức khác nhau ở từng màn làm chuẩn. |
| D06 | Thông tin đã xác minh, SOS và blacklist | Code chỉ quản lý bằng chứng/nguồn/người duyệt. Không tự xác nhận hotline, tạo cáo buộc, đánh dấu đã đi thực địa hoặc cam kết thời gian cứu hộ. Khi chưa có dữ liệu thật, dùng trạng thái chưa xác minh và tắt nội dung khẳng định tương ứng. |
| D07 | Quyền đọc/xuất chat và thời gian lưu | Mặc định chỉ thành viên hội thoại được đọc; admin cần ticket/lý do/log; yêu cầu xuất của admin theo quy trình hai người duyệt trong master plan. Thời gian lưu, đồng ý sử dụng và xử lý yêu cầu xóa cần được ghi chính sách trước khi mở dữ liệu thật. |
| D08 | Nhà cung cấp AI và thời tiết | Không lấy tên model/danh mục trong mock làm bằng chứng provider đang hỗ trợ. Chỉ cấu hình provider/model thực sự dùng; xác nhận bằng tài liệu chính thức và kiểm tra tích hợp ở thời điểm triển khai. Chưa có key thì dùng test giả lập có nhãn, không báo live thành công. |
| D09 | Chống bot, spam và lạm dụng | Turnstile phải được xác minh tại server, kết hợp rate limiting theo route/IP/account, kiểm tra đầu vào và chống gửi trùng. WAF/bot rules phụ thuộc gói Cloudflare và custom domain; không giả định Enterprise/Bot Management đã được mua. Quota nghiêm ngặt phải có trạng thái dùng chung, không dựa vào Map hoặc bộ đếm edge xấp xỉ. |
| D10 | Dữ liệu nhạy cảm và cache | D1 giữ metadata/quyền; R2 tách media công khai và hồ sơ/biên lai/bằng chứng riêng. Không cache session, auth, chat, biên lai hoặc API cá nhân tại CDN/SW; không dùng KV để quyết định thu hồi phiên hay tồn kho. Secrets ở Worker/CI, không có trong VITE_* hoặc bundle. |

Nếu thiếu một quyết định, Antigravity phải nêu chính xác phần bị ảnh hưởng và tiếp tục các việc độc lập. Không đánh dấu tích hợp bên ngoài hoàn tất chỉ vì đã viết adapter hoặc mock.

## 3. Prompt nền — gửi một lần đầu phiên

```text
Bạn đang triển khai dự án Tà Xùa Trip từ bản mẫu thành bản beta.

1. Tìm đúng thư mục có package.json, server.ts và src/App.tsx. Trong workspace gốc hiện tại, ứng dụng nằm ở thư mục con taxua-trip-main.
2. Đọc ANTIGRAVITY_IMPLEMENTATION_PLAN.md và PROJECT_AUDIT_PLAN.md tại thư mục ứng dụng; đọc AGENTS.md nếu có. Kiểm tra trạng thái mã hiện tại và thay đổi đang có của người dùng.
3. Chỉ triển khai nhóm/đợt tôi chỉ định. Đây là yêu cầu sửa code và kiểm thử: sau phần mô tả ngắn về cách làm, tiến hành thực hiện; không dừng ở việc viết thêm plan.
4. Giữ React/Vite, Express và giao diện hiện tại trong phạm vi tương thích Workers; tách entry Node/dev khỏi Worker và dùng adapter được hỗ trợ trước khi cân nhắc thay router. Đọc CLOUDFLARE_ARCHITECTURE_PLAN.md; D1 là nguồn SQL đích. Không thêm framework, microservice hoặc tầng abstraction chỉ để dùng trong tương lai.
5. Dữ liệu nghiệp vụ dùng CSDL và API có phân quyền. Giá, tồn kho, tiền, điểm và quyền không được quyết định bằng localStorage hay dữ liệu client gửi lên. Không đưa service key/API key vào frontend, log hoặc file commit.
6. Xem yêu cầu đầu vào và kết quả provider là dữ liệu chưa đáng tin; kiểm tra ở server. Không trả success giả khi provider lỗi hoặc chức năng chưa được tích hợp.
7. Ghi quyết định kỹ thuật/chính sách vào docs/implementation/DECISIONS.md. Nếu thiếu tài khoản dịch vụ hoặc quyết định về tiền, hoàn thành phần local/test độc lập và chỉ rõ phần chưa thể kiểm chứng; không tự chốt chính sách vận hành thật.
8. Viết test cho logic mới liên quan đến quyền, ghi dữ liệu, ngày, tiền, giữ chỗ hoặc xử lý lặp. Chạy typecheck, test và build. Với API/CSDL phải có kiểm thử tích hợp tương ứng; với UI thay đổi phải kiểm tra hành trình người dùng, trạng thái loading/error và mobile.
9. Cập nhật docs/implementation/PROGRESS.md: mã đợt, trạng thái, file/migration đã đổi, lệnh kiểm tra và kết quả thực tế, việc còn thiếu. Không xóa hay thay đổi dữ liệu thật để làm test.
10. Kết thúc bằng: đã sửa gì; cách chạy/kiểm tra; kết quả test; hạn chế còn lại; nhóm tiếp theo đủ điều kiện thực hiện. Chỉ đánh dấu hoàn thành khi tiêu chí của đợt được giao đã đạt.

Không tự deploy production, gửi tin cho khách/đối tác, thu tiền hoặc gọi dịch vụ trả phí trong quá trình code nếu chưa có chỉ định riêng. Chuẩn bị mã, cấu hình mẫu và môi trường kiểm tra để kết quả có thể được xem xét.
```

## 4. N01 — Môi trường chạy, kiểm thử nền và sửa rủi ro tức thời

**Mục tiêu:** có điểm xuất phát chạy được, kiểm tra được; những chức năng chưa có nền tảng an toàn được đóng hoặc gắn nhãn đúng.

**Đọc/sửa trọng tâm:** `package.json`, `package-lock.json`, `server.ts`, `vite.config.ts`, `tsconfig.json`, `.github/workflows/deploy.yml`, `src/server/aiAdvisor.ts`, `InteractiveMapSection`, `AIItineraryGenerator`, `AdminDashboard`, `JarvisAdminAssistant`.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N01.1 | Sửa build/start để có frontend và server production chạy được; type-only import đúng; tách app Express khỏi thao tác listen khi cần test; thêm lệnh test/typecheck và CI; thống nhất cài theo npm lockfile; viết README chạy local | Clean install → typecheck → build → test → start thành công; health trả JSON; route API không rơi vào HTML fallback; unit/API test không phụ thuộc artifact có thể chạy sớm, smoke test cần artifact phải chạy sau build. N02 bổ sung kiểm tra artifact Worker. |
| N01.2 | Validate API tư vấn; lỗi async được xử lý; giới hạn kích thước, độ dài, số khách, ngân sách, số đêm; bỏ URL/key tùy ý từ client. Khi chưa có auth N02, đóng endpoint quản trị/gateway ở chế độ công khai | Thiếu điểm đón, sai kiểu, ngày đảo, khoảng quá dài trả 4xx và server còn sống; URL nội bộ/đích lạ không được fetch; timeout/upstream 503 không bị báo thành công. |
| N01.3 | Escape văn bản xuất HTML, dùng DOM an toàn cho tooltip; loại raw key khỏi frontend/localStorage và xóa cấu hình cũ chứa key khi nâng cấp; tắt hành động Jarvis kết luận/duyệt hàng loạt; phân biệt demo/live | Payload HTML không thực thi; key không còn trong bundle/storage/log; ảnh mẫu không được báo là media đã sinh; thao tác demo không sửa dữ liệu thật hay báo đã thông báo cho chủ. |

**Test bắt buộc:** các đầu vào sai đã làm server dừng; fallback lỗi; provider timeout/503; URL tùy ý bị từ chối; văn bản HTML độc hại trong tooltip và file xuất. Dùng server giả lập trong test, không cần gọi API trả phí.

**Prompt giao việc:**

```text
Triển khai nhóm N01 trong ANTIGRAVITY_IMPLEMENTATION_PLAN.md, theo thứ tự N01.1 → N01.2 → N01.3.
Đối chiếu các lỗi audit 03,04,05,14,16,19 trong mã hiện tại rồi sửa nguyên nhân và tất cả nơi gọi liên quan.
Ưu tiên làm npm start và bộ test chuẩn chạy được; xử lý đầu vào API để không làm tiến trình dừng; đóng gateway quản trị khi chưa có auth thật; loại key/URL tùy ý từ client; sửa chèn HTML và các kết quả demo báo thành công giả.
Chưa triển khai CSDL hoặc hệ thống đăng nhập trong nhóm này. Chuẩn bị ranh giới để N02 mở endpoint theo quyền thật.
Hoàn thành test hồi quy, typecheck/build và smoke test server production. Ghi lại kết quả từng đợt vào PROGRESS.md.
```

## 5. N02 — CSDL, tài khoản và phân quyền

**Mục tiêu:** user thật và quyền thật trên D1, Workers có thể chạy local bằng runtime đích; không còn dữ liệu riêng dùng chung giữa các tài khoản. Hoàn thiện theo Cloudflare plan và sửa S1–S6, không tiếp tục coi pool PostgreSQL hoặc tệp JSON là nền tảng DB production đã nghiệm thu.

**Đọc/sửa trọng tâm:** `AuthModal`, `src/types/auth.ts`, `App`, `PartnerDashboard`, `AdminDashboard`, `MyTripsModal`, `server.ts`; thêm migration và mã truy cập dữ liệu theo phương án D01.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N02.0 | Cô lập app/auth test bằng DB/state test riêng, chặn reset nhầm và tách seed demo trước khi chạy suite | Chạy test không xóa hoặc đổi kho dev/vận hành; không nạp fixture vào production và không chạm remote DB |
| N02.1 | D1 CRUD async thật cho profiles/providers/ownership/sessions/booking đọc hiện có; migration SQLite có version; constraint/index; seed/reset test riêng. Cô lập test S1 trước khi chạy suite | Dựng D1 local từ rỗng; migration lần hai không chạy lại; restart giữ dữ liệu; lỗi DB không trả success; test không đổi kho dev/staging/production; không fallback Map/JSON |
| N02.2 | Giữ hợp đồng đăng nhập email/SĐT, nối session D1; bootstrap bằng CLI cùng database/env; đổi mật khẩu và thu hồi phiên nhất quán | Không có admin demo; CLI riêng tác động Worker build thật; password/token cũ bị từ chối, password mới dùng được sau restart; client không tự gán admin/verified |
| N02.3 | Mỗi truy vấn private kiểm role/owner từ session; đóng gateway; sửa DTO và vòng đời dữ liệu MyTrips | Khách/partner A không đọc/sửa B; không tự nhận listing/xác minh; tìm kiếm booking API không crash; lỗi auth/đổi user không hiện đơn chung hoặc phản hồi cũ; không tuyên bố có RLS trên D1 |
| N02.4 | Entry Worker + Static Assets; binding DB/R2 mẫu, env local/test/staging/production; API ưu tiên trước SPA; smoke build bằng workerd | Chạy artifact Worker local; /api và /api/* luôn JSON; root/subpath/assets đúng; không lộ source/server bundle; không ghi dữ liệu bền vào filesystem Worker |
| N02.5 | Turnstile frontend + Siteverify server cho register/login; rate limiting auth/AI; validate/payload limit; kế hoạch WAF/bot theo gói | Token thiếu/sai/hết hạn/sai action-hostname bị từ chối; lỗi verify không tạo account/session; lỗi limiter không vô hiệu hóa bảo vệ; vượt giới hạn trả JSON 429; UI thử lại được |
| N02.6 | Test tích hợp D1/runtime/bootstrap/gateway/UI; tài liệu secrets, R2 riêng tư và vận hành; CI không đụng remote DB | Typecheck/build/test đạt trên kho cô lập; thiếu binding/schema bị báo lỗi; local và cloud ghi trạng thái riêng. Thiếu account/key vẫn hoàn thiện local, cloud giữ chờ kiểm chứng |

**Bàn giao:** migration D1, test fixture khách A/B và partner A/B, API/session/booking DTO, cấu hình Wrangler và secrets mẫu, bảng quyền, CLI admin, test workerd và runbook chống bot/spam. N02 chỉ chuẩn bị binding/quy tắc R2; upload/CMS/biên lai/chat đầy đủ nằm ở N03/N06/N07. Các bảng nghiệp vụ còn lại bổ sung theo nhóm tương ứng.

**Test bắt buộc:** 401 khi thiếu/phiên sai; 403 hoặc 404 theo quy ước khi truy cập chéo; không tin `userId/role/providerId` client gửi; role admin không tự đăng ký được. Endpoint upload/download nào đã tồn tại phải chặn truy cập trái quyền; nếu chưa tích hợp R2 thì ghi chờ nhóm tương ứng, không tạo luồng upload mới ngoài phạm vi N02 chỉ để báo đã test storage.

**Prompt giao việc:**

```text
Triển khai N02 theo CLOUDFLARE_ARCHITECTURE_PLAN.md và ANTIGRAVITY_N02_CLOUDFLARE_PROMPT.md trong docs/implementation; đọc N02_RECHECK_REVIEW.md trước khi sửa.
Xây D1 CRUD/migration thật, entry Workers và đăng nhập theo D01; giữ AuthModal và logic nghiệp vụ đã kiểm chứng, sửa test xóa dữ liệu trước tiên.
Tách rõ người dùng và chủ sở hữu cơ sở. Mọi API/truy vấn dữ liệu riêng phải xác định danh tính từ session, không từ role/userId do client tự khai. Mở gateway N01 đã đóng chỉ cho admin thật.
Viết/chạy test bằng các tài khoản khác nhau trên D1 local và artifact Worker. Nối Turnstile server-side/rate limiting. Nếu thiếu dịch vụ cloud, hoàn thiện local workerd/Wrangler với mock Siteverify có nhãn, ghi cloud chưa kiểm chứng; không gọi mock là tích hợp hoàn tất.
Bàn giao hướng dẫn tạo admin đầu tiên, biến môi trường mẫu và bảng quyền.
```

## 6. N03 — Dữ liệu danh bạ, CMS và thẩm định

**Mục tiêu:** mỗi thông tin công khai có trạng thái, nguồn và quyền sửa; mọi thay đổi đã lưu được nhìn thấy giữa các thiết bị.

**Đọc/sửa trọng tâm:** `src/data/mockData.ts`, `scripts/build-mockdata.js`, `scripts/update-mockdata-file.js`, `src/types/index.ts`, `App`, `ListingCard`, `ListingDetailModal`, `PartnerDashboard`, `AdminDashboard`, `VerificationMethodologySection`.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N03.1 | Chuẩn hóa ID listing/nhà cung cấp/phòng/chuyến; lưu nguồn, thời gian thu thập, mức xác minh; importer xuất dữ liệu thay vì ghi đè code; kiểm tra schema/liên kết; tách fixture demo | Nhập hai lần không tạo trùng; lỗi ID được báo; không mất helper/import sau import; không tự sinh review, GPS, hotline, huy hiệu xác minh cho dữ liệu thật. |
| N03.2 | Lưu listings, phiên bản hồ sơ, loại phòng, media, menu/gói và CMS; CRUD đúng quyền; các trạng thái draft/pending/approved/rejected; audit log; claim chủ sở hữu có bằng chứng | Sửa/tạo/reload còn dữ liệu; bản sửa nhạy cảm chờ duyệt; claim không tự nâng huy hiệu cấp 3; cơ sở chưa duyệt không được trả trong API công khai. |
| N03.3 | Nối các màn hiện có vào API; dùng cùng truy vấn approved cho danh sách, bản đồ, deep link và AI về sau; thay số lượng hardcode bằng dữ liệu; trạng thái tải/lỗi/rỗng | Listing bị từ chối biến mất khỏi mọi điểm công khai; mở chi tiết trực tiếp không lấy lại dữ liệu mock; thiết bị khác thấy CMS đã lưu; dữ liệu chưa xác minh có nhãn đúng. |

**Test bắt buộc:** truy cập công khai các trạng thái duyệt; partner sửa cơ sở khác; phiên bản đã duyệt không bị ghi đè bởi bản nháp; import lặp và ID sai; dữ liệu chưa xác minh không tự trở thành đã xác minh.

**Prompt giao việc:**

```text
Triển khai N03 trong plan: thay nguồn danh bạ/CMS từ React state và mockData bằng dữ liệu lưu bền, có owner và trạng thái duyệt.
Giữ UI sẵn có, nối đầy đủ danh sách/chi tiết/map/deep link/partner/admin. Tạo một quy tắc đọc dữ liệu công khai chỉ approved.
Sửa pipeline nhập dữ liệu để không ghi đè mã TypeScript. Chuẩn hóa ID và phân biệt dữ liệu demo, dữ liệu thu thập, dữ liệu đã xác minh. Không tự sinh đánh giá/huy hiệu/tọa độ như dữ liệu thật.
Test import lặp, quyền sở hữu, vòng đời duyệt, reload và đồng bộ giữa hai phiên. Cập nhật schema/data contract và PROGRESS.md.
```

## 7. N04 — Tìm kiếm xuyên suốt, giá và voucher

**Mục tiêu:** lựa chọn của khách được giữ xuyên hành trình; giá ở UI và server dùng cùng một quy tắc.

**Đọc/sửa trọng tâm:** `HeroSection`, `App`, `ListingDetailModal`, `CompareAndWishlistModals`, `AITravelAdvisorModal`, `src/utils/rules.ts`, `src/types/index.ts`.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N04.1 | Chuẩn hóa SearchIntent/BookingIntent tối thiểu: ngày, khách, phòng, khu vực, loại phòng; ngày mặc định theo Asia/Ho_Chi_Minh; URL phục hồi trạng thái; lưu attribution ban đầu | Chọn ngày X/4 khách ở Hero thì danh sách/chi tiết/báo giá giữ X/4; không trở về ngày cố định 2026; reload/deep link đúng; UTM không bị xóa trước khi ghi nhận nguồn. |
| N04.2 | Báo giá server từ bảng giá từng đêm, phòng và khách; tiền VND dùng số nguyên có kiểm tra; trả breakdown và hạn báo giá; lưu quote snapshot/version; chính sách theo D04 | Giá ngày thường/cuối tuần và khoảng hỗn hợp đúng; số khách/đêm/phòng tác động đúng tổng; input NaN/âm/sai ngày bị chặn; UI hiển thị cùng đơn vị và tổng với API. |
| N04.3 | Chuẩn hóa mô hình voucher; kiểm tra active, hạn dùng, mức tối thiểu, loại dịch vụ/cơ sở và giới hạn sử dụng nếu được cấu hình; đánh giá lại lúc chốt | Voucher hết hạn/sai cơ sở/không đủ điều kiện bị chặn; đổi lựa chọn không giữ giảm giá sai; hai yêu cầu cuối cùng không vượt hạn mức dùng khi có giới hạn. |

**Hợp đồng API đề xuất:** endpoint nhận ID và lựa chọn để trả quote; client không được chốt `totalAmount/discountAmount` tùy ý. Giao dịch thật tại N05 phải xác minh quote và giá lại trong ranh giới transaction phù hợp.

**Prompt giao việc:**

```text
Triển khai N04: sửa luồng lựa chọn ngày/khách/phòng từ Hero đến chi tiết và tạo nguồn báo giá chuẩn ở server.
Hợp nhất công thức tiền và voucher đang trùng/khác nhau trong modal và rules. Đọc chính sách D04/D05; phần chưa chốt phải thành cấu hình có ghi trạng thái, không âm thầm lấy giá cuối tuần cho mọi ngày.
Server tính tổng từ dữ liệu listing/phòng/giá đã lưu; client chỉ hiển thị breakdown. Kiểm tra voucher đầy đủ và thiết kế quote để N05 xác minh lúc giữ chỗ.
Test ngày thường/cuối tuần/hỗn hợp, số lượng khách/phòng, voucher sai điều kiện và giá client bị sửa. Kiểm tra hành trình UI, deep link và UTM.
```

## 8. N05 — Tồn phòng, giữ chỗ và vòng đời booking

**Mục tiêu:** không bán trùng; không mất đơn; từng trạng thái có người chịu trách nhiệm và điều kiện chuyển rõ ràng.

**Đọc/sửa trọng tâm:** `src/utils/rules.ts`, `ListingDetailModal`, `MyTripsModal`, `PartnerDashboard`, `BookingSuccessModal`, `App`; bổ sung booking/availability API và migration.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N05.1 | Tồn theo đêm/hạng phòng, số phòng, sức chứa; ngày checkout loại trừ; chủ cập nhật/khóa phòng đúng quyền; query tìm kiếm dùng cùng nguồn tồn | Ca 2 phòng, booking đêm đầu và đêm sau vẫn còn 1 phòng cho cả khoảng; phòng có 0 không biến thành 1; không đếm một booking nhiều lần hoặc bỏ room quantity. |
| N05.2 | Tạo hold có thời hạn, transaction và khóa/ràng buộc phù hợp; thứ tự khóa nhất quán; kiểm lại quote; hủy/hết hạn hoàn tồn; cơ chế xử lý hold hết hạn không phụ thuộc tab trình duyệt | 20 yêu cầu tranh phòng cuối chỉ có một hold thành công; tất cả đêm được giữ cùng lúc; retry request không tạo thêm đơn; hold hết hạn không giữ tồn và không được xác nhận bằng request cũ. |
| N05.3 | Bảng chuyển trạng thái, ID đủ an toàn, lưu lịch sử; API xác nhận/từ chối/check-in/hoàn tất/hủy có quyền; QR chứa token có kiểm tra server; màn “của tôi” và đối tác đọc đúng đơn | Khách không tự check-in/hoàn tất hoặc chuyển cancelled thành completed; QR sai/hết hạn/trái cơ sở bị chặn; quét/retry không tạo tác động lặp; hai thiết bị thấy đúng đơn. |

**Quy tắc tồn cần ghi rõ:** pending hold chưa hết hạn, confirmed và checked_in giữ tồn; expired/cancelled không giữ tồn. Các trạng thái bổ sung phải có ý nghĩa nghiệp vụ và migration, không chỉ thêm chuỗi để UI chạy qua.

**Ranh giới N06:** N05 tạo nền trạng thái và transaction. Việc hoàn tất có tác động tiền/điểm phải được tích hợp ở N06 trước khi mở giao dịch thật; không để UI cộng/trừ tạm rồi quên thay.

Xác nhận hold và tác vụ hết hạn phải tranh cùng khóa/ràng buộc. N06 phải xử lý trường hợp thanh toán đến sau khi hold đã hết hạn bằng trạng thái cần đối soát hoặc quy trình đã chốt; không tự xác nhận lại phòng đã bán cho người khác.

**Prompt giao việc:**

```text
Triển khai N05 theo từng đợt: tồn phòng theo đêm → giữ chỗ transaction → vòng đời booking và UI.
Dùng dữ liệu và quote của N03/N04. Không xác nhận đơn chỉ bằng callback React. Giữ nhiều đêm phải nguyên tử; kiểm lại tồn/sức chứa/giá và idempotency ở server.
Sửa ca booking hai đêm nối tiếp bị đếm hết phòng, bỏ ID lấy 4 chữ số cuối timestamp, bỏ quyền khách tự hoàn tất. Làm QR check-in có token và kiểm quyền thực.
Viết test tích hợp với CSDL thật/test database cho 20 yêu cầu đồng thời, hold hết hạn, retry, hủy và chuyển trạng thái trái phép. Dùng đồng hồ kiểm soát trong test thay vì đợi hết thời gian thật.
Nối UI khách/đối tác và bàn giao hợp đồng hoàn tất để N06 ghi tiền/điểm trong transaction.
```

## 9. N06 — Thanh toán, phí, Điểm Mây, review và khiếu nại

**Mục tiêu:** số tiền và quyền lợi khớp giữa các màn; mỗi sự kiện nghiệp vụ chỉ ghi nhận một lần.

**Đọc/sửa trọng tâm:** `MyTripsModal`, `ListingDetailModal`, `PartnerDashboard`, `BookingSuccessModal`, `PointsModal`, `ReviewModal`, `DisputeModal`, `AdminDashboard`, `App`, `rules.ts`.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N06.1 | Áp dụng quyết định D03; payment snapshot gồm người nhận, cọc, tổng, nội dung và booking; upload biên lai thật có quyền/giới hạn; partner xác nhận lưu server; tích hợp webhook nếu chọn cổng thanh toán | Không còn 30% ở một màn và 50% ở màn khác; QR/biên lai/đơn thống nhất; upload không tự thành paid; partner xác nhận hiện với khách; webhook sai chữ ký, sai số tiền và lặp bị xử lý đúng. |
| N06.2 | Sổ phí và điểm chỉ ghi thêm, unique theo nguồn sự kiện; hoàn tất một lần; thu phí theo feature flag/mốc thật; hoàn/hủy có bút toán bù khi chính sách yêu cầu; đổi điểm phát hành mã quà có thể dùng | Hoàn tất hai lần chỉ tính 50.000đ một lần khi bật phí; tắt phí vẫn ghi nghĩa vụ đúng chính sách mà không trừ ví; điểm chưa hoàn tất không được cộng; đổi điểm đồng thời không âm hoặc tạo quà trùng. |
| N06.3 | Review gắn booking và chủ thể thật, một lần trong cửa sổ chính sách; thống nhất thưởng; cập nhật rating; khiếu nại có người xử lý/lý do/lịch sử; kết luận/hoàn tiền tách rõ | Người không đặt không review được; review lặp bị chặn; reward không tùy màn 20/50; đóng khiếu nại không tự chứng minh đã hoàn tiền; refund có chứng từ/trạng thái riêng. |

**Test bắt buộc:** upload giả/ảnh không hợp lệ; chéo quyền biên lai; tiền cọc cấu hình 30% và 50% hiển thị đồng bộ; người dùng tự nhận đã trả tiền; webhook lặp/sai đơn/sai tiền; thanh toán đến đồng thời với hold hết hạn và thanh toán đến muộn; hoàn tất lặp/đồng thời; đổi điểm đồng thời; review của người khác; hủy/hoàn tiền theo chính sách đã chốt.

Nếu dùng chuyển khoản trực tiếp và partner xác nhận thủ công, phải ghi rõ đây là xác nhận thủ công có log; không giả lập webhook ngân hàng. Các nút nhận tiền/hoàn tiền thật chỉ mở khi phần tích hợp tương ứng đã kiểm chứng.

**Prompt giao việc:**

```text
Triển khai N06 theo N06.1 → N06.2 → N06.3, tận dụng transaction và trạng thái booking của N05.
Trước phần cọc, đọc quyết định D03; không tự chọn người nhận tiền hay tỷ lệ cọc thật. Payment phải có snapshot thống nhất dùng cho tất cả màn. Thay ảnh biên lai mẫu bằng upload thật có phân quyền và nối xác nhận partner về server.
Ghi phí/điểm bằng ledger có ràng buộc chống lặp theo booking/sự kiện. Không cộng điểm khi mới tạo đơn. Đổi điểm phải phát hành được quà/voucher. Review phải gắn booking hợp lệ, đúng người và chỉ thưởng một lần.
Xây luồng khiếu nại có lịch sử và người quyết định; không cho Jarvis tự đóng vụ hoặc coi resolved là đã hoàn tiền.
Chạy test tiền/quyền/retry/đồng thời trên CSDL. Bàn giao kết quả đối soát test và nêu rõ xác nhận tiền là thủ công hay qua provider.
```

## 10. N07 — Chat, bằng chứng và cộng đồng

**Mục tiêu:** hội thoại được lưu đúng phòng, đúng quyền; những lời cam kết về bằng chứng có cơ chế kiểm tra thật.

**Đọc/sửa trọng tâm:** `DirectChatModal`, `CommunitySection`, `AdminDashboard`, `JarvisAdminAssistant`, `DisputeModal`, `rules.ts`.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N07.1 — Chat tối thiểu | Conversation/member/message gắn listing/booking; lưu tin/attachment, ID chống gửi trùng; realtime hoặc polling đủ cho beta; phân biệt bot/người; không dùng timer giả chủ trả lời | Hai người dùng được phép thấy cùng tin sau reload; ngoài phòng không truy cập; đổi phòng không trộn tin; gửi lại request không nhân đôi; chủ không online không bị báo đã trả lời. |
| N07.2 — Bằng chứng | Timestamp/sequence/hash SHA-256 ở server; canonical payload; chỉ ghi thêm tin bằng chứng; hash/file attachment; audit log và quyền đọc admin; export PDF thật có mã đối chiếu và mốc kiểm chứng lưu phía server | Không UPDATE/DELETE tin bằng chứng qua API/role ứng dụng; đồng thời không trùng seq; phát hiện sửa/thiếu tin so với mốc đã ghi; PDF đọc được tiếng Việt và khớp dữ liệu xuất; admin đọc/xuất có quy trình D07. |
| N07.3 — Cộng đồng sau MVP | Kênh/nhóm/chuyến/kèo có membership và vòng đời; quyền moderator/owner; edit theo thời gian từ server và lưu phiên bản; report/hàng chờ; chỉ công khai liên hệ ghép nhóm sau chấp nhận | Không chọn role bằng dropdown để nâng quyền; không sửa tin người khác; hết thời hạn bị chặn; phòng chuyến không mở cho người ngoài; contact không xuất hiện trước khi chấp nhận. |

Hash chỉ là một phần cơ chế bảo vệ; không tuyên bố “không ai có thể sửa” chỉ vì tính lại hash trong trình duyệt. Phải có ràng buộc quyền ghi và mốc kiểm chứng lưu phía server. Nhóm này chưa cần hệ thống vector hay kho phân tích riêng.

**Prompt giao việc:**

```text
Triển khai N07.1 và N07.2 trước; N07.3 chỉ thực hiện nếu được giao rõ trong lượt này.
Thay chat React state và phản hồi host bằng timer bằng conversation/message lưu bền, có membership và quyền ở server. Dùng identity thật từ N02, listing/booking từ N03/N05.
Tin bằng chứng chỉ ghi thêm; timestamp/seq/hash do server tạo. Thực hiện xuất PDF thật có tiếng Việt, mã đối chiếu và log truy cập; áp dụng D07 cho admin. Không chỉ đổi tên hàm hash hoặc tạo mã export rồi báo đã xong.
Test truy cập chéo phòng, gửi trùng/đồng thời, sửa/xóa trái phép, can thiệp dữ liệu và đối chiếu nội dung PDF. Không đưa AI hoặc hệ thống phân tích mới vào nhóm này.
```

## 11. N08 — AI tư vấn, gateway, J.A.R.V.I.S., thời tiết và SOS

**Mục tiêu:** AI mô tả và gợi ý từ dữ liệu đúng, không tạo ra sự thật về tiền, lịch, thời tiết hay thẩm định.

**Đọc/sửa trọng tâm:** `src/server/aiAdvisor.ts`, `AITravelAdvisorModal`, `AIItineraryGenerator`, `AdminDashboard`, `JarvisAdminAssistant`, `CloudForecastWidget`, `SosModal`, cấu hình provider tại server.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N08.1 | Đọc listing approved, quote và availability qua service có quyền; validate JSON đầu ra; code tính tiền/số đêm; tạo lịch đúng số ngày; dẫn nguồn; fallback có nhãn; lưu log đã che dữ liệu không cần thiết | Đi 5 ngày có 5 ngày và về vào ngày cuối; đủ/sai ngân sách được tính đúng; model không tự tạo giá/phòng trống; JSON sai và ID bịa bị chặn; fallback không bị gọi là live AI. |
| N08.2 | Chỉ provider/model đã cấu hình; key server; hạn mức phía server; usage thực hoặc ghi không có số đo; nối config chatbot với runtime; Jarvis đọc/tóm tắt/soạn đề xuất, hành động qua API phân quyền | Không giả cache/token/latency; upstream lỗi không báo success; sửa config có tác dụng thật; Jarvis không tự hoàn tiền, đóng toàn bộ tranh chấp, nâng huy hiệu hay tạo số thời tiết; mỗi đề xuất có phạm vi và căn cứ. |
| N08.3 | Thời tiết có provider/source, vị trí, observed/updated/expiry; điểm săn mây ghi là ước lượng và có phiên bản công thức; alert có subscription thật; SOS dùng đầu mối D06 và GPS có nhãn độ chính xác/thời gian | Dữ liệu cũ báo cũ/không có; không gán 90% cố định thành hôm nay; đăng ký cảnh báo chưa có kênh gửi không báo đã kích hoạt; GPS thất bại không trình bày tọa độ mốc như vị trí hiện tại; không tự tạo hotline. |

**Test bắt buộc:** model/provider giả lập trả JSON sai, ID không tồn tại, prompt yêu cầu đổi giá/hoàn tiền, câu hỏi đọc chat người khác, 1/2/5 ngày, provider 503/timeout, quota cạn, thời tiết hết hạn và GPS bị từ chối. Dùng bộ câu hỏi chuẩn tăng dần, mục tiêu cuối là 200 ca trong master plan; không lấy số lượng ca làm thay tiêu chí đúng dữ liệu.

**Prompt giao việc:**

```text
Triển khai nhóm N08, theo N08.1 → N08.2 → N08.3; đọc D06/D08 và các đầu ra N04–N07 liên quan.
Thay dữ liệu AI import cố định bằng các service listing/quote/availability có phân quyền. Model không được tự quyết giá, tồn kho, thu/hoàn tiền hoặc kết luận thẩm định. Validate output, đối chiếu ID và dẫn nguồn.
Sửa lịch trình số ngày/về ngày cuối và mọi trường hợp live/demo/fallback/error báo sai. Cấu hình provider/key/giới hạn ở server; không giả số token, cache hay kết quả job media. Media chưa tích hợp thì tắt tính năng tương ứng.
Jarvis chỉ tóm tắt/đề xuất có căn cứ, hành động ghi phải đi qua cùng API nghiệp vụ. Thời tiết/SOS phải có nguồn và tuổi dữ liệu; không tạo hotline hoặc thông báo giả.
Test các ca AI sai dữ liệu/quyền, provider lỗi, quota và dữ liệu cũ; chỉ gọi provider thật khi có cấu hình và phạm vi test được cho phép.
```

## 12. N09 — Nhà xe, ghế, xe máy và combo

**Mục tiêu:** dữ liệu người bán quản lý chính là dữ liệu khách đặt; tồn kho được tách theo chuyến/ngày và thời gian thuê.

**Đọc/sửa trọng tâm:** `BusBookingModal`, `PartnerDashboard`, `AdminDashboard`, `ListingCard`, `ListingDetailModal`, `rules.ts`, `src/types/index.ts`, dữ liệu chuyến.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N09.1 | Enum loại xe có mã máy/nhãn hiển thị riêng; ánh xạ dữ liệu cũ tường minh; nhà xe/tuyến/điểm/chuyến theo ngày; seatCode thống nhất; lựa chọn ban đầu là ghế thực sự còn | 6 fixture khóa đúng `[3,6,2,5,2,6]` ghế bận; xe hai tầng có đúng sơ đồ; chọn ghế nào lưu ghế đó; loại xe không biết bị báo lỗi thay vì âm thầm dựng sai. |
| N09.2 | API quản lý/chọn chuyến dùng chung; điểm đón trước điểm trả; giá tuyến/đoạn chuẩn; khóa ghế transaction, idempotency, hold expiry; tính ngày đến qua nửa đêm | Hai request tranh ghế cuối chỉ một thành công; ngày khác tồn riêng; pickup/dropoff đảo bị chặn; vé/QR/đơn/đối tác cùng seatCode và ngày đến chính xác. |
| N09.3 | Kho xe máy theo số xe và khoảng thuê; tính đủ số lượng đặt/offline; không đếm completed là xe đang thuê; quy tắc trả trước trưa theo D04; combo báo giá và giữ cả hai phần nguyên tử | Không âm kho; thuê 3 xe giữ 3 xe; hai thời đoạn không giao không giữ tồn lẫn nhau; hết một phần combo không tạo đơn/giữ tồn nửa vời; phí/cọc/điểm dùng lõi N06. |

**Prompt giao việc:**

```text
Triển khai N09 dựa trên lõi quote/hold/payment đã có, không tạo vòng đời giao dịch riêng cho vận tải.
Chuẩn hóa busType và seatCode từ migration/import đến sơ đồ và vé. Sửa lỗi 6 chuyến có ghế đặt nhưng UI hiện 0, lỗi chọn ghế khác vẫn lưu [1,2,...], và dữ liệu nhà xe trong partner không nối với danh sách bán vé.
Tách chuyến theo ngày; giữ ghế có transaction/idempotency/expiry; tính điểm đón/trả và ngày đến qua nửa đêm. Xe máy tính theo khoảng thuê và số lượng thực; combo phải giữ cả hai hoặc không giữ phần nào.
Test fixture hiện có, chỗ cuối đồng thời, ngày khác, tuyến đảo, thuê nhiều xe, trả trước/sau trưa và rollback combo. Nối đầy đủ màn khách/đối tác/admin.
```

## 13. N10 — PWA, hiệu năng, URL và phát hành beta

**Mục tiêu:** ứng dụng đã đúng nghiệp vụ có thể chạy trên môi trường thật, sử dụng hợp lý khi mạng yếu và được vận hành theo bằng chứng kiểm thử.

**Đọc/sửa trọng tâm:** `App`, imports màn lớn, `public/sw.js`, `public/manifest.json`, `index.html`, `PwaAndNetworkBar`, `AIItineraryGenerator`, `Navbar`, `HostingModal`, Vite/deploy config và CI.

| Đợt | Việc code | Tiêu chí nghiệm thu |
|---|---|---|
| N10.1 | Thống nhất base/scope; cache app shell/assets công khai theo phiên bản; loại auth/payment/chat/API riêng; navigation mới fallback HTML; giới hạn cache; khôi phục lịch trình đã lưu; dọn dữ liệu tài khoản theo logout | Cài PWA ở đường dẫn môi trường chọn; mở app/lịch trình đã lưu khi offline; API không trả HTML; không lộ cache của user trước; mất mạng không báo đã đặt/đã trả tiền; SW cập nhật được và không xóa cache ứng dụng khác trên cùng origin. |
| N10.2 | Lazy load admin/partner/map/AI; phân trang dữ liệu server; tách module theo trách nhiệm; đo bundle và mạng; xử lý gói ZIP trùng nhưng vẫn giữ link download đúng nếu còn dùng | Khách chưa mở admin không tải mã admin; đề xuất JS đầu ≤250 KB gzip hoặc có lý do/đo đạc rõ nếu khác; không làm hỏng tính năng; số đo trước/sau được ghi, không tự gán điểm Lighthouse. |
| N10.3 | URL từng cơ sở, metadata/canonical/schema từ dữ liệu approved có thật; metadata chia sẻ có trong HTML server trả về bằng cách render/prerender tối thiểu trang công khai nếu cần; attribution gắn đăng ký/đơn; staging deploy/health/smoke; migration/backup/restore; hướng dẫn vận hành và công tắc đóng tính năng | Link trực tiếp/chia sẻ đúng cả khi không chạy JavaScript; không hardcode review giả trong schema; staging chạy frontend + backend; clean deploy không mất đơn; restore thử thành công; có checklist quyết định tính năng nào đủ điều kiện mở. |

**Kiểm thử phát hành:** hành trình homestay bằng khách A/B, partner A/B và admin; booking đồng thời; cọc/hoàn tất lặp; quyền chat/biên lai; mobile/keyboard/loading/error; offline/PWA; route trực tiếp dưới base URL đã chọn; quan sát log không có secret. Cloudflare staging phải kiểm D1/R2 thật, Turnstile hostname/action, WAF/rate limit, cache riêng tư, không có đường workers.dev/origin cũ bỏ qua bảo vệ, backup/restore theo gói thực tế. Các tính năng N08/N09 chưa mở phải không xuất hiện như đã vận hành thật.

**Prompt giao việc:**

```text
Triển khai N10 cho các tính năng đã hoàn thành và được chọn mở beta. Kiểm tra PROGRESS.md trước, không mở tính năng còn mock hoặc chưa đạt kiểm thử P0.
Sửa SW/manifest/base URL và cache riêng tư; khôi phục lịch trình offline. Tách tải theo nhu cầu cho màn lớn và đo bundle trước/sau, giữ UI và hành vi đã kiểm chứng.
Hoàn thiện URL/metadata/attribution từ dữ liệu thật. Chuẩn bị cấu hình staging có backend, CI, smoke test, backup/restore và runbook; thực hiện kiểm tra staging khi có môi trường được cấp.
Chạy bộ nghiệm thu beta từ đầu đến cuối, ghi bằng chứng cho từng điều kiện. Chưa có môi trường/provider hoặc kiểm thử thiết bị thì ghi chưa kiểm tra, không tự báo production-ready và không tự deploy production.
```

## 14. Quy ước bàn giao để dễ tiếp tục ở phiên sau

Antigravity tạo `docs/implementation/PROGRESS.md` từ lần code đầu. Ghi theo đợt thay vì một nhãn hoàn thành chung cho cả nhóm lớn.

| Trường cần ghi | Nội dung |
|---|---|
| Mã đợt và audit | Ví dụ N05.2, xử lý audit 06 và phần 10 |
| Trạng thái | Chưa làm / Đang làm / Code xong, chờ kiểm chứng / Đạt nghiệm thu |
| Thay đổi | File, migration, API, điều kiện chuyển trạng thái, cấu hình mới |
| Quyết định | Liên kết D01–D10, Cloudflare plan và quyết định phát sinh đã ghi |
| Bằng chứng | Lệnh đã chạy, số test, kết quả thực tế, bước kiểm tra UI/API/CSDL |
| Hạn chế | Credential/dịch vụ/chính sách/thiết bị chưa có; phần nào vẫn tắt |
| Tiếp theo | Đợt kế tiếp đã đủ phụ thuộc và việc còn lại cụ thể |

Đợt chưa chạy test CSDL không được ghi là đã chứng minh transaction đúng. Tích hợp dùng provider giả lập không được ghi live. Build thành công không thay cho kiểm thử phân quyền, tiền hoặc giữ chỗ. Một phần chưa xong không được che bằng toast “thành công”.

### Mẫu yêu cầu ngắn cho các lượt tiếp theo

```text
Đọc ANTIGRAVITY_IMPLEMENTATION_PLAN.md, PROJECT_AUDIT_PLAN.md và docs/implementation/PROGRESS.md.
Thực hiện code đợt [Nxx.y]. Kiểm tra phụ thuộc và mã mới nhất, hoàn thành phạm vi, nối tất cả nơi gọi/UI liên quan và chạy tiêu chí nghiệm thu của đợt.
Tiếp tục phần độc lập nếu thiếu credential/chính sách; ghi rõ phần chưa kiểm chứng. Cập nhật PROGRESS.md và báo cáo bằng kết quả thực tế.
```

**Lượt đầu nên gửi:** “Áp dụng Prompt nền và thực hiện N01.1 trước.” Khi N01.1 đạt, tiếp tục N01.2/N01.3 rồi N02. Cách này giúp từng lượt có kết quả nhỏ, chạy được và dễ kiểm tra.

Tài liệu này là gói giao việc, chưa thực hiện các thay đổi ứng dụng. Các lựa chọn dịch vụ, chính sách tiền và kiểm chứng bên ngoài vẫn cần được ghi nhận theo bảng quyết định khi triển khai.
