# Kiểm tra lại nghiệm thu N02 và các bản sửa R1–R9

Ngày: **12/11/2026**. Đối chiếu báo cáo người dùng cung cấp với source hiện tại, kế hoạch triển khai và các phép thử độc lập.

**Thay đổi hiện tại:** dự án đã bỏ seed khỏi constructor, thêm lưu tệp JSON, khai báo pool PostgreSQL và sửa một số luồng xác thực/ownership/CI. Lưu tệp đã qua kiểm tra restart tiến trình thật; tuy nhiên CRUD PostgreSQL chưa được triển khai và còn lỗi bootstrap production, test xóa dữ liệu, báo thành công khi ghi đĩa thất bại và hợp đồng dữ liệu UI.

**Phán quyết: chưa đủ điều kiện nghiệm thu toàn bộ N02.** Kết luận “khắc phục triệt để 9/9” và “nền tảng CSDL quan hệ lưu bền đã được kiểm chứng” vượt quá hiện trạng. Công nhận các phần tiến bộ bên dưới; cần sửa các mục S1–S6 trước khi dựa vào N02 để nối dữ liệu thật ở N03.

## 1. Kết quả kiểm tra độc lập

| Kiểm tra | Kết quả thực tế | Ý nghĩa |
|---|---|---|
| `npm run typecheck` trên bản sao source | Exit 0 | Đạt kiểm tra kiểu hiện có |
| `npm run build` trên bản sao ban đầu không có dist | Exit 0; frontend và server bundle được tạo mới | Đạt build; backend khoảng 708,2 kB, frontend còn cảnh báo chunk lớn |
| `npm test` sau build, gateway dùng mock HTTP cục bộ | **65/65 pass**, 0 fail, 0 skip | Tổng số đúng; không chứng minh PostgreSQL/RLS hoặc UI trong trình duyệt |
| Bundle production mới, đăng nhập admin demo trước khi chạy test/seed | **401** | Seed ngầm trong constructor đã được bỏ |
| Đăng ký trên bundle production, gọi `/api/auth/me` | **201 / 200** | Luồng auth cơ bản hoạt động |
| Dừng rồi chạy lại tiến trình bundle, login user vừa đăng ký và dùng token cũ | **200 / 200** | Lưu tệp cùng chế độ chạy giữ được user và session qua restart thật |
| CLI bootstrap chạy ở tiến trình riêng, sau đó login qua bundle production | CLI exit **0**, báo thành công; login **401** | CLI và bundle dùng hai đường dẫn kho dữ liệu khác nhau |
| Khởi tạo DatabaseEngine với PostgreSQL ở `127.0.0.1:1`, gọi createProfile trực tiếp | Trả profile thành công dù không kết nối được DB; instance mới không thấy profile | Nhánh mang tên PostgreSQL thực tế vẫn CRUD trên Map |
| Tạo profile khi đường dẫn ghi nằm dưới một tệp thường, không thể tạo thư mục | Hàm trả thành công; không có dữ liệu lưu; health vẫn `ok:true` | Lỗi ghi đĩa bị nuốt |
| Mở tệp dữ liệu JSON hỏng | Ghi cảnh báo, health vẫn `ok:true` | Không phát hiện kho dữ liệu hỏng qua health |
| Thêm user đánh dấu vào bản sao rồi chạy riêng auth test | Test exit 0; user đánh dấu bị xóa; admin demo xuất hiện | Test dùng và reset kho dữ liệu mặc định |
| Dùng BookingRecord thực tế với biểu thức tìm kiếm hiện có của MyTripsModal | `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` | Backend và UI chưa thống nhất cấu trúc booking |

**Cách cô lập:** build/test/probe chạy trên bản sao dưới `tmp`, không sao chép `.env` hoặc `.data` thật. Dependency đã cài của workspace được dùng lại; vòng này **không chạy lại `npm ci`**, không chạy GitHub Actions thực tế và không gọi dịch vụ AI thật. Không chạy `npm test` tại thư mục ứng dụng gốc vì phát hiện S1. Hash kho dữ liệu gốc được đối chiếu trước/sau kiểm tra.

Tổng 65 là số Node test runner báo cáo, có tính cả test cha: auth 17 ca con + 1 ca cha, server 14 ca con + 1 ca cha + 1 ca subprocess riêng, rules 31 ca. Cách chia 17/14/34 trong báo cáo không khớp cấu trúc test hiện tại.

## 2. Đối chiếu R1–R9

| Mã cũ | Phần đã cải thiện | Trạng thái còn lại |
|---|---|---|
| R1 | Constructor không seed; production sạch từ chối admin demo; UI ẩn nút admin demo khi build production | Đạt ca khởi động sạch. Chưa tách fixture an toàn: test ghi admin demo vào kho mặc định; runner migration vẫn bao gồm seed demo. Xem S1/S5 |
| R2 | Lưu tệp JSON thực sự giữ được user/session qua restart; có driver/pool và kiểm tra kết nối DB | **Chưa đạt PostgreSQL**: chỉ có `SELECT 1`, CRUD vẫn Map; ghi tệp lỗi vẫn trả thành công. Xem S2/S4 |
| R3 | Trong source mode, CLI có thể ghi cùng tệp, đổi hash và thu hồi session; test hiện tại đạt | **Chưa đạt production bundle**: CLI và bundle dùng hai tệp. Xem S3 |
| R4 | SQL đã thêm điều kiện giữ role/is_verified và giới hạn quyền ghi mapping ownership cho admin | **Chưa nghiệm thu**: thiếu kết nối danh tính Express với SQL/RLS, thiếu auth helpers cho PostgreSQL thuần, chưa chạy SQL thật. Xem S5 |
| R5 | Handler playground chỉ chọn trường tác vụ và đặt URL/key từ env server | Đã sửa đường truyền body phát hiện lần trước theo source. Test hiện tại chỉ kiểm tra success/reply, chưa quan sát đích/key outbound nên chưa đủ bằng chứng chặt cho gateway |
| R6 | Các caller admin/Jarvis đã gửi Bearer token và kiểm tra lỗi HTTP | Đã sửa theo source; chưa kiểm tra toàn bộ hành trình UI trong trình duyệt |
| R7 | App lọc partnerOwnedListings; partner 0 cơ sở có trạng thái chờ; bỏ lựa chọn cơ sở toàn sàn | Đạt phần lọc partner theo source. **MyTrips chưa đạt** vì sai Booking DTO và fallback về dữ liệu chung. Xem S6 |
| R8 | CI đổi thành typecheck → build → test; test dùng cổng động | Đạt trình tự local đã chạy trên source không có dist. Chưa xác nhận clean install hoặc GitHub Actions trong vòng này |
| R9 | Frontend gửi identifier thật; backend tìm theo phone/email; ca đăng ký rồi login SĐT đạt | Đạt ca kiểm thử hiện có |

Ba bản sửa runtime F1–F3 tiếp tục có ca kiểm thử trong bộ test đã chạy. Không có cơ sở phủ nhận những phần đã sửa đúng chỉ vì các blocker khác còn tồn tại.

## 3. Phải sửa trước nghiệm thu

### S1 — [P1] Chạy test xóa dữ liệu đang lưu và nạp lại admin demo

- **Vai trò:** [auth.test.ts:18](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/auth.test.ts:18) gọi reset trên instance `db` mặc định; [db.ts:585](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:585) xóa Map, unlink tệp rồi seed fixture. Instance mặc định ở dòng 614 không được tiêm kho test riêng.
- **Vấn đề:** khi không có DATABASE_URL, chạy test trong ứng dụng sẽ xóa `.data/taxua_db.json` hiện hữu, thay bằng dữ liệu test và admin có mật khẩu demo. Đã tái hiện trên bản sao: user đánh dấu tồn tại trước test, mất sau test exit 0; admin demo được ghi vào tệp.
- **Sửa:** mọi test phải dùng instance in-memory hoặc đường dẫn tạm riêng được tiêm vào app/auth; không reset singleton vận hành. Chặn hàm reset khi instance không được tạo rõ ràng cho test và thêm ca chứng minh test không đổi kho sẵn có.
- **Nếu bỏ qua:** lệnh kiểm tra được README khuyên chạy có thể làm mất tài khoản, session và booking local; server source dùng cùng kho sau đó nhận lại credential demo.

`.gitignore` hiện cũng chưa loại `.data/`, trong khi tệp chứa passwordHash và token session sử dụng được. Cần loại dữ liệu vận hành và fixture sinh ra khỏi source/artifact; không đưa nội dung tệp vào báo cáo hoặc commit.

### S2 — [P1] Nhánh PostgreSQL chưa đọc/ghi PostgreSQL

- **Vai trò:** [db.ts:113](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:113) tạo pool, [db.ts:184](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:184) chạy `SELECT 1`; [db.ts:245](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:245) và các CRUD khác vẫn thao tác Map. Khi chọn pool, `persistentFilePath` không được thiết lập.
- **Vấn đề:** kết nối thành công chỉ chứng minh DB sống, không lưu profile/session/ownership/booking. Probe trực tiếp với DB không tồn tại vẫn tạo profile thành công; engine mới không thấy profile đó. Đây là probe data layer, không phải khẳng định server production bỏ qua health: startup production hiện có chặn lỗi kết nối, là cải thiện đúng.
- **Sửa:** thực hiện truy vấn PostgreSQL thật cho các thao tác thuộc N02, cập nhật caller async, dùng transaction và constraint cho đăng ký/bootstrap/session/ownership. Không coi tạo pool là đã có adapter lưu bền.
- **Nếu bỏ qua:** ngay cả khi health PostgreSQL báo xanh, auth vẫn mất dữ liệu sau restart và mỗi tiến trình có một tập tài khoản riêng; N03 không có CSDL dùng chung để dựa vào.

**Nghiệm thu:** migration trên PostgreSQL thật; đăng ký ở server A, truy vấn được hàng SQL và đăng nhập ở server B; restart giữ tài khoản/session; logout hoặc đổi mật khẩu được mọi tiến trình nhận biết. Test phải thất bại nếu thay CRUD SQL bằng Map.

### S3 — [P1] CLI bootstrap và server production dùng hai tệp khác nhau

- **Vai trò:** [db.ts:9](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:9) lấy projectRoot bằng `../..` từ vị trí module; [bootstrap-admin.js:6](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/scripts/bootstrap-admin.js:6) import auth từ source. Sau bundle, cùng code nằm trong `dist/server.js`.
- **Vấn đề:** source ghi `<app>/.data/taxua_db.json`; bundle ghi `<thư mục cha của app>/.data/taxua_db.json`. Đã chạy bundle thật và CLI riêng: CLI exit 0/báo thành công nhưng login admin mới trên bundle trả 401; hai tệp tồn tại ở hai vị trí. Test hiện tại chỉ so CLI với app factory import từ source nên bỏ sót lỗi này.
- **Sửa:** dùng một vị trí dữ liệu được cấu hình/chuẩn hóa thống nhất cho CLI, dev và bundle; không suy ra app root từ độ sâu module đã bị bundler thay đổi. Nếu chuyển sang PostgreSQL, cả hai phải dùng cùng cấu hình DB và schema.
- **Nếu bỏ qua:** quản trị viên không đăng nhập được sau bootstrap; lệnh đổi mật khẩu/thu hồi session có thể sửa kho khác với server đang phục vụ.

**Nghiệm thu:** test chạy `node dist/server.js` và CLI bằng hai tiến trình riêng, rồi xác nhận tạo admin, đổi mật khẩu, từ chối mật khẩu/session cũ và vẫn hoạt động sau restart.

### S4 — [P1] Kho tệp hỏng hoặc không ghi được vẫn báo thành công

- **Vai trò:** [db.ts:149](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:149) bắt lỗi đọc và tiếp tục; [db.ts:169](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/server/db.ts:169) ghi thẳng JSON vào tệp đích, bắt lỗi mà không ném lại; health file mode ở dòng 193 luôn trả ok.
- **Vấn đề:** khi không thể ghi đĩa, createProfile vẫn trả đối tượng thành công nhưng instance mới không thấy dữ liệu; health vẫn xanh. JSON sai cú pháp cũng chỉ cảnh báo và được coi là kho khỏe. `writeFileSync` trực tiếp không phải ghi nguyên tử như comment mô tả; chưa có cơ chế phối hợp khi nhiều tiến trình cùng sửa toàn tệp.
- **Sửa:** lỗi đọc/ghi phải được truyền thành lỗi thao tác/khởi động phù hợp, không âm thầm bắt đầu kho mới từ tệp hỏng. Nếu giữ file mode cho local, ghi tệp tạm rồi thay thế an toàn, giới hạn rõ chế độ một tiến trình hoặc có cơ chế phối hợp; production dùng PostgreSQL đã kiểm chứng.
- **Nếu bỏ qua:** người dùng thấy đăng ký/đổi mật khẩu thành công trong khi không được lưu, hoặc mất dữ liệu do lần ghi tiếp theo đè kho bị lỗi; health không cảnh báo được sự cố.

### S5 — [P1] Migration chưa chạy được theo hướng dẫn PostgreSQL thuần; chưa chứng minh RLS

- **Vai trò:** [002_security_rls.sql:15](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/migrations/002_security_rls.sql:15) gọi `auth.uid()`/`auth.jwt()`; [migrate.js:39](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/scripts/migrate.js:39) chạy lại toàn bộ SQL; [003_seed_demo_accounts.sql:5](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/migrations/003_seed_demo_accounts.sql:5) tạo hồ sơ/ownership/booking mẫu.
- **Vấn đề:** PostgreSQL 16 thuần theo lệnh Docker trong báo cáo không tự có schema/hàm auth của Supabase và migration không tạo chúng; opaque session Express cũng chưa được chuyển thành danh tính SQL. Runner không có lịch sử migration, nên chạy lại policy đã tồn tại sẽ lỗi. Nếu áp dụng thành công đến 003, runner production còn tự seed tài khoản admin/partner mẫu và có ON CONFLICT cập nhật role/is_verified, trái với mục tiêu seed tường minh.
- **Sửa:** chọn mô hình PostgreSQL hoặc Supabase cụ thể, triển khai danh tính/role SQL và migration theo mô hình đó; lưu lịch sử migration và tách seed demo ra lệnh riêng chỉ dùng test/demo. Kiểm thử SQL bằng role hạn chế, gồm đọc chéo tenant, tự đổi role/is_verified, tự xác minh provider và tự gán listing.
- **Nếu bỏ qua:** hướng dẫn dựng DB mới không tái lập được, deploy migration lặp thất bại hoặc đưa fixture demo vào dữ liệu thật; test Express trên Map không bảo đảm quyền ở DB.

**Giới hạn bằng chứng:** đây là đối chiếu source SQL/runner với cách dựng PostgreSQL thuần trong chính báo cáo; chưa chạy migration hay khai thác RLS trên DB thật. Không gọi R4 là đã nghiệm thu. Các subquery tự đọc bảng trong policy cũng cần kiểm thử thực tế, thay vì suy ra an toàn từ việc thêm WITH CHECK.

Hash `seed_admin_hash` trong migration là placeholder không hợp lệ với verifyPassword hiện tại. Không có bằng chứng rằng riêng migration này cho phép đăng nhập bằng mật khẩu demo; credential demo hoạt động được tạo bởi test fixture ở S1.

### S6 — [P1] MyTrips nhận sai cấu trúc booking và trở về dữ liệu chung khi lỗi auth

- **Vai trò:** [server.ts:113](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/server.ts:113) trả BookingRecord; [MyTripsModal.tsx:68](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/components/MyTripsModal.tsx:68) nhận thẳng JSON thành Booking[]; dòng 89 fallback về `bookings` prop, dòng 97 tìm trên listingTitle/guestPhone/guestName. [App.tsx:4213](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/src/App.tsx:4213) truyền mảng booking chung.
- **Vấn đề:** BookingRecord không có listingTitle, guestName, guestPhone, checkInDate/checkOutDate mà UI dùng. Dùng record thực tế chạy đúng biểu thức tìm kiếm hiện có với chuỗi không khớp id gây TypeError; các thông tin hiển thị cũng thiếu. Khi API lỗi/401, modal bỏ dữ liệu theo tài khoản và dùng lại dữ liệu demo chung; effect chỉ phụ thuộc isOpen, không xử lý đầy đủ thay đổi tài khoản hoặc phản hồi cũ đến trễ.
- **Sửa:** định nghĩa response DTO dùng chung và ánh xạ đầy đủ các trường mà màn hình cần, hoặc sửa màn hình theo dữ liệu thực sự có. Khi chưa đăng nhập/lỗi/hết phiên, hiển thị trạng thái tương ứng; không fallback về đơn chung trong luồng “của tôi”. Reset dữ liệu theo user/token và bỏ phản hồi của phiên cũ.
- **Nếu bỏ qua:** người có booking nhận màn thiếu thông tin hoặc lỗi tìm kiếm; trạng thái auth lỗi có thể hiển thị dữ liệu không thuộc tài khoản hiện tại.

Probe xác nhận lỗi hợp đồng/filter, chưa phải E2E trình duyệt. Mảng chung hiện là dữ liệu demo; không kết luận đã rò rỉ booking khách thật trên hệ thống triển khai.

## 4. Bổ sung kiểm thử nên làm

1. Tiêm kho test riêng trước mọi kiểm thử. Thêm ca giữ nguyên dữ liệu có sẵn để ngăn tái xuất S1.
2. Có PostgreSQL local/CI thực sự, chạy migration lần đầu và lần hai, CRUD/restart/nhiều tiến trình và RLS bằng role không bypass.
3. Đổi test bootstrap từ app factory source sang bundle production thực tế; giữ cả ca đổi mật khẩu và thu hồi session.
4. Mock hai đích gateway và kiểm tra request thật: đích cấu hình server nhận đúng dummy key server, đích/key client không được dùng. Test R5 hiện chỉ assert success/reply nên chưa chứng minh điều này.
5. Test giao diện với một booking từ API thật, tìm kiếm, 401 và đổi tài khoản khi request trước chưa xong; không chỉ kiểm tra status API.

## 5. Thứ tự thực hiện và điều kiện chuyển N03

| Ưu tiên | Nhóm việc | Bằng chứng cần có |
|---|---|---|
| 1 | S1: cô lập test, tách fixture và dữ liệu vận hành | Chạy toàn bộ test không đổi kho dữ liệu có sẵn; production sạch không có demo admin |
| 2 | S2 + S5: PostgreSQL CRUD, migration và quyền DB | SQL có dữ liệu thật; restart/nhiều server đồng bộ; migration lặp an toàn; role hạn chế không vượt quyền |
| 3 | S3 + S4: bootstrap và tính đúng đắn khi lưu dữ liệu | CLI tác động bundle thật; đổi mật khẩu/thu hồi phiên đúng; lỗi lưu không báo thành công |
| 4 | S6: thống nhất hợp đồng booking, trạng thái auth và UI | Hiển thị/tìm kiếm đơn đúng tài khoản; hết phiên/đổi user không hiển thị đơn chung hoặc phản hồi cũ |
| 5 | Chạy lại build/test và cập nhật báo cáo | Ghi rõ ca đã chạy, môi trường DB, phần chưa chạy; không dùng tổng test pass thay bằng chứng SQL/UI |

N03 có thể chuẩn bị yêu cầu dữ liệu/CMS song song, nhưng chưa nên nối nghiệp vụ thật trên giả định N02 đã có PostgreSQL lưu bền và đã nghiệm thu toàn diện.

**Chưa kiểm tra:** PostgreSQL/Supabase thật, migration/RLS runtime, cloud DB, GitHub Actions/deploy thực tế và E2E trình duyệt/mobile. Thư mục hiện tại không có Git repository để so diff/commit. Review không sửa mã ứng dụng hoặc ghi đè PROGRESS/DECISIONS; chỉ thêm báo cáo này. Bản sao, tiến trình và dữ liệu thử được cô lập để giữ kho dữ liệu gốc nguyên vẹn.
