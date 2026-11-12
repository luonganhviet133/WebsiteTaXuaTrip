# Đối chiếu báo cáo sửa N01.1 và triển khai N02

Ngày kiểm tra: **12/11/2026**. Nguồn đối chiếu: báo cáo Antigravity được người dùng cung cấp, mã hiện tại và `ANTIGRAVITY_IMPLEMENTATION_PLAN.md`.

**Kết luận:** ba lỗi F1–F3 cũ đã được sửa và kiểm chứng lại ở runtime. **Chưa thể nghiệm thu N02.1/N02.2/N02.3 như báo cáo.** Hệ thống hiện có API xác thực và kiểm tra quyền trên dữ liệu lưu trong bộ nhớ; chưa có adapter PostgreSQL, lưu trữ bền hay kiểm chứng RLS trên CSDL. Ngoài ra có tài khoản admin mặc định trong production và lỗi CI khi chạy từ source sạch.

## 1. Bảng đối chiếu nhanh

| Khẳng định / hạng mục | Hiện trạng thực tế | Kết luận |
|---|---|---|
| F1: start mặc định production | Entry point bundle chạy production khi không có NODE_ENV; HTML không có Vite client/source entry | Đạt ca đã kiểm tra |
| F2: cách ly static frontend/backend | Build nằm ở `dist/client`; `/`, `/taxua-trip/`, MIME asset đúng; tải trực tiếp server.ts/server.js bị 404 | Đạt ca đã kiểm tra |
| F3: bare API trả JSON | `/api`, `/api/` và API không tồn tại có phản hồi JSON 404 | Đạt ca đã kiểm tra |
| Typecheck | `npm run typecheck` exit 0 | Đạt |
| Build | `npm run build` exit 0; có frontend và server bundle | Đạt, còn cảnh báo chunk frontend lớn thuộc tối ưu sau |
| 60/60 tests | Sau build, bộ test đạt 60/60; gateway trong lần kiểm tra được trỏ mock HTTP cục bộ | Đạt các ca hiện có, không chứng minh PostgreSQL/RLS |
| Test trong clean checkout / CI | Bản source tạm không có dist: 56 pass, 4 fail; workflow chạy test trước build | Chưa đạt tính tái lập của CI |
| Data layer kết nối qua DATABASE_URL | Không có code đọc DATABASE_URL hay client PostgreSQL; db.ts chỉ dùng 5 Map | Không đúng với hiện trạng |
| Local Secure Relational Engine | Là kho trong RAM, không có ghi đĩa, transaction hoặc cơ chế ràng buộc CSDL được thực thi | Không thể coi tương đương PostgreSQL |
| Đăng ký/đăng nhập/logout | Có hash mật khẩu, token ngẫu nhiên, kiểm tra phiên và thu hồi; API chặn đăng ký admin và partner mới sở hữu 0 listing | Có triển khai, chỉ đạt một phần vì không lưu bền và còn seed production |
| Bootstrap admin đầu tiên | CLI báo thành công nhưng chỉ sửa Map trong tiến trình CLI; server khác không thấy tài khoản; nhánh user tồn tại bỏ qua password mới | Chưa đạt |
| Cách ly khách A/B, partner A/B | Các endpoint thử bằng token chặn truy cập chéo trên fixture RAM | Đạt các route thử; chưa nối đầy đủ UI hoặc chứng minh quyền ở CSDL |
| Gateway chỉ dùng URL/key server | Test-connection đã đổi; playground vẫn truyền nguyên request body vào hàm nhận baseUrl/apiKey của client | Chưa đạt |
| Schema/RLS tương thích PostgreSQL 14–16 và Supabase | Có các tệp SQL; không có runner/test PostgreSQL; policy dựa trên auth.uid()/auth.jwt() nhưng auth hiện dùng opaque token trong RAM | Chưa được chứng minh, có vấn đề trong thiết kế policy |

Không dùng tỷ lệ phần trăm tự ước lượng cho mức hoàn thành. PROGRESS hiện ghi “ĐẠT NGHIỆM THU” cho cả N02 là vượt quá bằng chứng.

## 2. Những gì đã thực sự làm tốt

- Đã tách frontend build khỏi server bundle và xử lý được ba ca lỗi runtime của lần review trước.
- API auth không còn tin role trong localStorage; có kiểm tra mật khẩu, session token, hết hạn và trạng thái thu hồi tại server trong cùng tiến trình.
- Đăng ký role admin bị từ chối; partner mới trả về unverified và không có listing sở hữu ở API.
- Các middleware requireAuth/requireRole và route đọc booking có kiểm tra người đặt/nhà cung cấp/admin, thể hiện qua test truy cập chéo đã chạy.
- AuthModal đồng bộ lại vai trò/chế độ khi mở; App gọi `/api/auth/me` để khôi phục phiên thay vì tự đăng nhập demo khi không có token.

## 3. Các lỗi phải sửa trước khi nghiệm thu

### R1 — [P0] Production tự tạo admin có mật khẩu demo

- **Vai trò:** `src/server/db.ts:86` luôn gọi `seedDefaultAccounts()` khi module được nạp; `:293` tạo admin với credential cố định.
- **Vấn đề:** không có điều kiện môi trường hay thao tác seed tường minh. Trên server bundle production mới khởi động, đăng nhập bằng tài khoản admin demo trả 200 và token đó gọi `/api/admin/overview` được 200. Không cần chạy bootstrap.
- **Sửa:** bỏ seed khỏi constructor/runtime production. Seed chỉ chạy bằng lệnh riêng trong môi trường demo/test đã được xác định; khi chưa bootstrap thì production không có admin mặc định. Tách dữ liệu test khỏi dữ liệu vận hành và bỏ nút đăng nhập admin demo khỏi giao diện production.
- **Nếu bỏ qua:** người biết credential mẫu có thể thành admin và dùng các route được bảo vệ bằng role, dù cơ chế chặn tự đăng ký admin đã có.

**Nghiệm thu:** khởi động production mới, tài khoản demo không đăng nhập được; test vẫn tạo fixture riêng; admin thật chỉ được tạo bằng công cụ quản trị ghi vào kho lưu bền.

### R2 — [P1] Chưa có PostgreSQL và tài khoản mất sau restart

- **Vai trò:** `src/server/db.ts:79–87` chỉ khai báo Map cho profiles, providers, ownership, sessions và bookings; cuối tệp export một instance của lớp này.
- **Vấn đề:** không có nhánh DATABASE_URL, driver hoặc truy vấn PostgreSQL. Đã thử đặt DATABASE_URL trỏ địa chỉ loopback không có CSDL: server vẫn hoạt động như cũ. Đăng ký user trả 201, xác thực phiên trả 200; sau khi dừng và khởi động lại server, tài khoản đó đăng nhập trả 401 và token cũ cũng 401.
- **Sửa:** nối một backend PostgreSQL thực sự, có migration runner và truy vấn ghi/đọc, ràng buộc/transaction cần thiết. Nếu chưa có cloud thì dùng PostgreSQL local và ghi rõ bước cloud chưa kiểm chứng. Production thiếu kết nối bắt buộc phải báo cấu hình lỗi, không âm thầm đổi sang RAM rồi báo vận hành đầy đủ.
- **Nếu bỏ qua:** restart/deploy mất tài khoản và session; nhiều tiến trình không chia sẻ danh tính; N03 sẽ tiếp tục xây lên một nguồn dữ liệu không tồn tại lâu dài.

README và DECISIONS hiện mô tả khả năng kết nối PostgreSQL qua biến môi trường chưa có trong code. JWT_SECRET cũng được hướng dẫn cấu hình nhưng không được dùng; opaque session không bắt buộc phải đổi thành JWT, chỉ cần tài liệu mô tả đúng cơ chế thực tế.

### R3 — [P1] Bootstrap admin báo thành công nhưng không có hiệu lực cho server

- **Vai trò:** `scripts/bootstrap-admin.js:6,20` import auth/db và sửa dữ liệu trong tiến trình CLI. `src/server/auth.ts:140–147` nâng role của user tồn tại mà không áp dụng password mới.
- **Vấn đề:** CLI tạo email admin mới exit 0, in thành công, nhưng server đang chạy đăng nhập email đó trả 401; restart cũng không có tài khoản. Kiểm tra trực tiếp nhánh bootstrap email admin có sẵn cho thấy password mới không được chấp nhận và password seed cũ vẫn được chấp nhận.
- **Sửa:** CLI kết nối cùng kho PostgreSQL với server, dùng transaction và cấu hình môi trường nhất quán; phải yêu cầu tham số bảo mật tường minh, không có mật khẩu mặc định. Quy định rõ tạo mới/nâng quyền/đổi mật khẩu; nếu nhận password mới thì phải áp dụng hoặc từ chối thao tác rõ ràng.
- **Nếu bỏ qua:** người vận hành tưởng đã tạo/đổi mật khẩu admin nhưng thực tế server không thay đổi hoặc vẫn giữ credential cũ.

**Nghiệm thu:** chạy CLI ở tiến trình riêng rồi đăng nhập qua server bằng tài khoản vừa tạo; restart vẫn đăng nhập được; password cũ bị từ chối khi thực sự đổi password.

### R4 — [P1] RLS chưa được tích hợp và policy chưa bảo vệ đúng quyền xác minh/sở hữu

- **Vai trò:** `migrations/002_security_rls.sql` được báo cáo như bằng chứng phân quyền ở CSDL.
- **Vấn đề:** runtime chưa chạy SQL/RLS. Khi đọc tĩnh các policy dự kiến, UPDATE profile chỉ cố giữ role mà không cấm đổi `is_verified` (`:18–21`); UPDATE provider không giới hạn `verification_status/verified_by` (`:29–31`); `provider_listings_modify FOR ALL` chỉ kiểm tra provider_id thuộc người đang đăng nhập (`:42–47`), không ngăn partner thêm mapping tới listing bất kỳ. Nếu cấp quyền bảng tương ứng, các điều kiện này không loại được các thay đổi tự xác minh/tự nhận sở hữu đó.
- **Sửa:** chọn và nối mô hình auth/CSDL cụ thể; quyền xác minh và cấp ownership chỉ qua thao tác admin được bảo vệ; giới hạn trường có thể cập nhật, đặt constraint cần thiết. Test SQL bằng role người dùng thường, không bằng owner/service role có khả năng bỏ qua RLS.
- **Nếu bỏ qua:** lúc bật quyền truy cập SQL theo thiết kế, partner có thể tự đánh dấu đã xác minh hoặc tự gắn listing của bên khác, dù test Express trên Map đang xanh.

**Giới hạn bằng chứng:** các nhận xét policy là review tĩnh, chưa phải khai thác trên PostgreSQL đang chạy. Máy kiểm tra không có psql/postgres/docker và dự án không có integration test SQL. Hai hàm auth.uid()/auth.jwt() không được các migration này định nghĩa cho PostgreSQL thuần; opaque token của Express hiện cũng không tạo danh tính cho chúng. Vì vậy không thể gọi migration/RLS là đã nghiệm thu cho cả PostgreSQL thuần và Supabase.

### R5 — [P1] Playground vẫn nhận URL và key tùy ý từ client

- **Vai trò:** `server.ts:252–254` đã thêm requireRole(admin), nhưng vẫn gọi `executeRevidPlaygroundChat(req.body || {})`. Hàm `src/server/aiAdvisor.ts:700–701` ưu tiên params.baseUrl và params.apiKey.
- **Vấn đề:** đã thử với token admin, URL loopback của mock server và key giả chỉ phục vụ audit. Backend gọi được `/chat/completions` ở đích do request chọn, chuyển tiếp key giả và trả `liveApiCalled:true`. Báo cáo “server chỉ dùng cấu hình nội bộ” mới đúng với test-connection, chưa đúng với playground.
- **Sửa:** handler chỉ nhận các trường tác vụ được phép; endpoint/key lấy từ cấu hình server đã duyệt. Giới hạn đích/redirect, timeout và quyền sử dụng; không chỉ ẩn ô nhập trên frontend. Test sửa baseUrl/apiKey không làm thay đổi đích hoặc credential server.
- **Nếu bỏ qua:** endpoint vẫn có thể điều khiển kết nối ra ngoài; kết hợp admin demo ở R1 khiến việc thêm middleware không tạo ra ranh giới như báo cáo.

### R6 — [P1] Giao diện admin/Jarvis không gửi token tới API đã khóa

- **Vai trò:** `AdminDashboard.tsx:300,331` và `JarvisAdminAssistant.tsx:673` gọi gateway bằng fetch; headers chỉ có Content-Type. Auth mới lưu bearer token trong localStorage, không thiết lập cookie session.
- **Vấn đề:** các caller không gửi Authorization nên server không biết user, kể cả admin đã đăng nhập. Yêu cầu đúng kiểu frontend gửi nhận 401. Màn ping còn có thông báo thành công mặc định khi JSON lỗi không có trường message.
- **Sửa:** cập nhật tất cả caller của endpoint đã đổi hợp đồng auth để gửi bearer token; kiểm tra res.ok và hiển thị lỗi xác thực/thu hồi phiên đúng. Không biến 401/403 thành fallback thành công.
- **Nếu bỏ qua:** backend test bằng header viết tay đạt, nhưng chức năng admin trên giao diện không dùng được và có thể báo kết quả sai.

### R7 — [P1] Ownership chưa được nối vào màn partner và dữ liệu cá nhân

- **Vai trò:** auth trả `ownedListingIds`, App chuyển thành `currentUser.partnerListingId`, nhưng màn partner vẫn đọc `selectedPartnerListingId` độc lập khởi tạo từ listing đầu tiên.
- **Vấn đề:** `src/App.tsx:262,1042,3809–3812` truyền toàn bộ listings/bookings và callback sửa React state; `PartnerDashboard.tsx:831–846` vẫn cho chuyển cơ sở. Partner đăng ký mới có 0 quyền sở hữu ở API vẫn được mở dashboard demo của cơ sở đầu tiên. Màn “của tôi” cũng nhận bookings mẫu chung; chưa gọi API bookings theo tài khoản.
- **Sửa:** dựa vào ownership do server trả để tải/hiển thị cơ sở; partner chưa có cơ sở phải thấy trạng thái chưa được cấp quyền. Phần nghiệp vụ chưa làm ở N03 phải được tách/gắn nhãn/đóng rõ, không trình bày như dữ liệu quản trị thật. Nối API người dùng theo phạm vi N02 và chặn thao tác giả lập có thể bị hiểu là đã lưu thật.
- **Nếu bỏ qua:** trạng thái quyền trong API và hành trình người dùng không thống nhất; không thể dùng test fixture RAM để kết luận toàn ứng dụng đã cách ly đa người dùng.

Đây là giới hạn tích hợp UI được xác định từ mã, **không phải kết luận đã rò rỉ dữ liệu khách thật**: dữ liệu listing/booking hiện vẫn là demo như chính báo cáo đã ghi. Route PUT listing hiện chỉ trả success mà không lưu nội dung, nên test 200 của nó cũng chỉ chứng minh guard, chưa chứng minh cập nhật cơ sở.

### R8 — [P1] Pipeline sạch chạy test trước build sẽ thất bại

- **Vai trò:** `.github/workflows/deploy.yml:41–45` chạy npm test rồi mới npm run build. Test server mới cần dist/client và dist/server.js.
- **Vấn đề:** `server.test.ts:99,109,193` kiểm tra frontend và đòi bundle tồn tại. dist bị .gitignore loại khỏi source. Đã sao source sang thư mục tạm không có dist và chạy test với mock gateway local: **56 pass, 4 fail**; hai ca frontend trả 404 và test subprocess không thấy dist/server.js. Tổng 4 fail có tính cả test cha.
- **Sửa:** tách unit/API tests không phụ thuộc artifact và smoke tests sau build, hoặc đổi pipeline build trước các test yêu cầu artifact. Kiểm tra bundle được tạo từ mã hiện tại, tránh test nhầm artifact cũ. Dùng port ngẫu nhiên thay fixed 3198 để giảm xung đột.
- **Nếu bỏ qua:** local test xanh nhờ dist còn sẵn nhưng CI từ checkout mới không qua; không thể nghiệm thu chuỗi clean install → test → build như hướng dẫn hiện tại.

### R9 — [P2] Đăng ký bằng SĐT rồi đăng nhập bị chuyển sang email demo

- **Vai trò:** `AuthModal.tsx:188` đổi SĐT khi đăng ký thành `${phone}@taxuatrip.user`; `:125` lại đổi mọi identifier không có @ lúc đăng nhập thành email DEMO_ACCOUNTS của role.
- **Vấn đề:** tài khoản mới đăng ký bằng SĐT không được tìm theo định danh đã lưu. Tái hiện đúng dữ liệu gửi: register 201, login bằng email nội bộ vừa tạo 200, login theo mapping hiện tại của frontend 401. Các nút demo partner/traveler cũng dùng email không trùng tài khoản seed mới.
- **Sửa:** chọn hợp đồng đăng nhập email/SĐT rõ ràng, chuẩn hóa ở server và tìm đúng trường; không thay số người dùng nhập bằng email demo. Chỉ giữ demo trong chế độ demo và dùng fixture khớp.
- **Nếu bỏ qua:** người dùng có thể đăng ký thành công nhưng không đăng nhập lại bằng số đã dùng, ngay cả trước khi xét mất dữ liệu do restart.

## 4. Các phép thử bổ sung và kết quả

| Phép thử | Kết quả |
|---|---|
| Chạy typecheck | Exit 0 |
| Build client/server | Exit 0; `dist/server.js` khoảng 699,7 KiB |
| Chạy bộ test sau build, gateway trỏ mock loopback | 60/60 pass; không gọi provider thật |
| Chạy cùng test trên source tạm không có dist | 56/60 pass, 4 fail |
| Start bundle không có NODE_ENV | Production; root và subpath trả frontend build |
| Asset JS hiện tại ở subpath | 200 application/javascript |
| GET server.ts/server.js | 404 text/plain |
| GET /api | 404 application/json |
| Start với DATABASE_URL trỏ 127.0.0.1:1, không có CSDL tại đó | Server vẫn khởi động và xử lý auth vì biến này không được code sử dụng |
| Đăng nhập admin seed trên production mới | 200, role admin; gọi admin overview được 200 |
| Register tài khoản thử rồi gọi auth/me | 201 và 200 |
| Restart tiến trình, đăng nhập tài khoản thử/call token cũ | 401 / 401 |
| Bootstrap admin mới bằng CLI riêng | CLI exit 0, báo thành công; login server trả 401 |
| Bootstrap email admin có sẵn với password thay thế | Password mới không hợp lệ; password seed cũ vẫn hợp lệ |
| Đăng ký partner mới | 201, isVerified false, ownedListingIds rỗng |
| Playground với URL local và dummy key trong body | Mock nhận 1 yêu cầu, nhận dummy key, response liveApiCalled true |
| Gọi gateway như UI hiện tại, không có Authorization | 401 |

Các user, token và key trong phép thử là dữ liệu giả trong tiến trình review riêng; không in token hoặc dùng key dịch vụ thật. Tiến trình thử đã được dừng. Không gửi thông báo hoặc thu/hoàn tiền.

## 5. Trạng thái nên ghi lại trong PROGRESS

| Phần | Trạng thái đề xuất |
|---|---|
| F1/F2/F3 | Đã sửa, đạt các smoke test runtime đã kiểm tra |
| N01.1 tổng thể | Cần sửa thứ tự build/test ở môi trường sạch trước khi chốt CI |
| N02.1 | Chưa đạt: có bản nháp schema, chưa có PostgreSQL adapter/migration test/lưu bền |
| N02.2 | Đã có API xác thực trong RAM; chưa nghiệm thu production vì seed admin, persistence và bootstrap |
| N02.3 | Đã có guard Express ở một số route; chưa nghiệm thu RLS/ownership UI/gateway và các caller |
| N03 | Có thể chuẩn bị schema/spec; chưa nên lấy N02 “đã hoàn tất” làm nền để tiếp tục nối dữ liệu thật |

## 6. Thứ tự sửa đề xuất

1. **Đóng đường vào admin demo trên production**; tách seed/test fixture ngay. Khi chưa bootstrap/lưu bền xong, giữ chức năng quản trị nhạy cảm đóng.
2. **Làm PostgreSQL local thực sự**: driver, migration runner, schema/auth thống nhất, truy vấn và kiểm tra restart. Không cần chờ cloud để chứng minh local persistence.
3. **Bootstrap cùng kho dữ liệu và sửa RLS**; kiểm thử bằng role hạn chế, gồm tự xác minh và tự nhận ownership.
4. **Nối auth vào tất cả caller và quyền sở hữu UI**; đóng các luồng nghiệp vụ còn giả lập, sửa login SĐT.
5. **Khóa URL/key của toàn bộ gateway tại server**, kiểm thử không thể đổi bằng body.
6. **Sửa CI**, chạy từ môi trường sạch và cập nhật báo cáo đúng với bằng chứng trước khi chuyển N03.

**Phán quyết:** công nhận phần sửa F1–F3 và các guard/session API đã chạy đúng trong cùng tiến trình. Chưa công nhận “triển khai toàn diện N02”; cần xử lý R1–R8 và ca người dùng R9 trước khi kết luận đạt như báo cáo.

**Chưa kiểm tra:** SQL migration/RLS trên PostgreSQL hoặc Supabase đang chạy, cloud DB, CI thực tế trên GitHub, trình duyệt/mobile đầy đủ, Linux/macOS/Node khác. Không có diff Git để đối chiếu commit; review dựa trên các tệp và hành vi hiện tại. Phiên này không sửa mã ứng dụng hay ghi đè PROGRESS/DECISIONS; chỉ thêm báo cáo review và tạo lại artifact build phục vụ kiểm tra.
