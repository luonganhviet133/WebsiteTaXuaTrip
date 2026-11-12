# Tà Xùa Trip — Báo cáo rà soát và bảng kế hoạch tối ưu

Ngày rà soát: **12/11/2026**, múi giờ UTC+7. Trạng thái tất cả công việc trong plan: **Chưa triển khai**.

**Cập nhật định hướng sau audit — 12/11/2026:** chủ dự án chọn Cloudflare cho database/storage/chống bot-spam. Kiến trúc đích hiện là **Workers + Static Assets, D1, R2, Turnstile và WAF/rate limiting theo gói thực tế**, thay PostgreSQL/Supabase mặc định của bản audit đầu. Xem [Cloudflare plan](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/CLOUDFLARE_ARCHITECTURE_PLAN.md) và [kiểm tra lại N02](C:/Users/ADMIN/Downloads/taxua-trip-main/taxua-trip-main/docs/implementation/N02_RECHECK_REVIEW.md). Các nhận xét kiểm kê bên dưới phản ánh thời điểm audit; nhãn trạng thái cũ không thay kết quả review mới. Chưa triển khai tích hợp Cloudflare trong lượt cập nhật tài liệu này.

**Dự án làm gì:** Tà Xùa Trip hướng tới một nền tảng du lịch địa phương: tìm homestay và dịch vụ, đặt phòng/xe, liên hệ chính chủ, lập lịch trình, xem bản đồ săn mây, tham gia cộng đồng và xử lý khiếu nại. Điểm khác biệt dự kiến là dữ liệu đã thẩm định, lịch trống đáng tin, hội thoại có thể đối chiếu và review gắn với booking.

**Đánh giá hiện tại:** Đây là bản mẫu sản phẩm có phạm vi giao diện rộng và nhiều luồng tương tác. Chưa đủ nền tảng để nhận giao dịch thật giữa nhiều khách hàng và nhà cung cấp: tài khoản, dữ liệu chung, giữ chỗ, thanh toán và bằng chứng vẫn còn mô phỏng hoặc xử lý ở trình duyệt.

Giả định lập kế hoạch: beta có **30–50 nhà cung cấp** và nhiều khách truy cập đồng thời. Mốc **10.000 thành viên đã xác minh** để bật thu phí và mục tiêu **100.000 thành viên** là định hướng trong tài liệu dự án, chưa phải quy mô đã kiểm chứng. Báo cáo không phải kết quả kiểm thử tải ở các mốc này.

## 1. Phạm vi đã đọc và cấu trúc thực tế

Thư mục ứng dụng thực tế nằm ở `taxua-trip-main/taxua-trip-main` tính từ thư mục Downloads; thư mục workspace bên ngoài chỉ chứa thư mục này.

| Phạm vi | Kết quả kiểm kê và cách kiểm tra |
|---|---|
| Mã nguồn `src/` | 35 tệp, 51.170 dòng vật lý; trong đó có 26 tệp component TSX. Đọc và truy vết logic chính của các phân hệ bên dưới. |
| Dữ liệu | 185 listing thuộc 11 nhóm dịch vụ; 91 homestay, 181 hạng phòng; 6 mẫu chuyến xe; 4 booking và 4 review mẫu. Kiểm tra cấu trúc, ID, liên kết và logic sinh dữ liệu. |
| Backend | Đọc toàn bộ `server.ts` và `src/server/aiAdvisor.ts`; kiểm tra API bằng yêu cầu HTTP cục bộ. |
| Quy tắc nghiệp vụ | Đọc `rules.ts`, `rules.test.ts`, types và các handler gọi chúng; chạy 31 kiểm thử có sẵn. |
| Build và triển khai | Đọc package scripts, hai lockfile, Vite, TypeScript, GitHub Actions, Vercel, biến môi trường, HTML, manifest và service worker. |
| Tài liệu sản phẩm | Trích xuất văn bản của 4 PDF, tổng 47 trang. Đối chiếu kế hoạch nền tảng, cộng đồng và bản master plan hợp nhất. Hai bản kế hoạch gốc có nhiều nội dung trùng. |
| Tệp phát hành | Kiểm kê `public/`, build `dist/`, xem danh mục tệp trong 3 ZIP và so checksum; không coi các bản đóng gói cũ là mã nguồn đang chạy. |
| Tài liệu vận hành | Không có README hay AGENTS.md được tìm thấy trong ứng dụng và các thư mục tổ tiên đã kiểm tra. Không thấy cấu hình migration/CSDL hay tích hợp lưu trữ nghiệp vụ. |

Đây là rà soát toàn bộ cấu trúc và các luồng nghiệp vụ, đi sâu vào quyền truy cập, tiền, lịch trống, chat và AI. Không đọc lặp từng dòng JSX trình bày, từng bản ghi dữ liệu tương tự, thư viện `node_modules`, mã build nén hoặc nội dung nhị phân của mọi ảnh/ZIP. Chưa kiểm tra giao diện bằng trình duyệt hay kiểm tra bố cục PDF bằng hình ảnh.

### Bản đồ phân hệ

| Phân hệ | Tệp chính | Mức hoạt động hiện tại |
|---|---|---|
| Khám phá và tìm dịch vụ | `App`, `Navbar`, `HeroSection`, `ListingCard` | Lọc, sắp xếp, phân trang hiển thị và điều hướng chạy phía client. Một số giá trị form chưa truyền sang kết quả/booking. |
| Danh bạ và chi tiết | `mockData`, `ListingDetailModal`, `CompareAndWishlistModals` | Có 11 loại dịch vụ, ảnh, giá, tiện nghi, so sánh tối đa 3 cơ sở, lưu yêu thích và chia sẻ liên kết. |
| Đặt phòng/dịch vụ | `ListingDetailModal`, `BookingSuccessModal`, `MyTripsModal` | Tạo đối tượng booking trong React state; chưa có API lưu đơn, giữ chỗ hay thông báo tới chủ cơ sở. |
| Nhà xe và xe máy | `BusBookingModal`, `PartnerDashboard`, `rules` | Có điểm đón/trả, sơ đồ ghế, combo và công thức thuê xe; dữ liệu chuyến, ghế và kho chưa thống nhất. |
| Bản đồ, săn mây, SOS | `InteractiveMapSection`, `CloudForecastWidget`, `SosModal` | Leaflet và GPS có tích hợp thật; dự báo, hotline và nhiều khẳng định vận hành lấy từ cấu hình/dữ liệu mẫu. |
| Lịch trình và AI khách hàng | `AIItineraryGenerator`, `AITravelAdvisorModal`, `aiAdvisor` | Một bộ dựng lịch trình bằng mẫu; một API tư vấn Gemini có fallback theo quy tắc. Chưa nối nguồn giá/lịch đang cập nhật. |
| Tài khoản | `AuthModal`, `types/auth`, `App` | Đăng nhập demo và tạo user tại client; lưu user/role trong localStorage. Chưa có dịch vụ xác thực. |
| Cộng đồng và chat | `CommunitySection`, `DirectChatModal` | Có diễn đàn, kèo ghép, báo mây, phân loại nội dung và minh họa hash; tin nhắn nằm trong state, phản hồi chủ cơ sở được mô phỏng. |
| Đối tác và xác minh | `PartnerDashboard`, `PartnerClaimModal`, `VerificationMethodologySection` | Có màn cập nhật ngành dịch vụ, hồ sơ và yêu cầu chính chủ; chưa có ràng buộc quyền sở hữu ở server. |
| Quản trị và AI điều hành | `AdminDashboard`, `JarvisAdminAssistant` | Có CMS, duyệt hồ sơ, khiếu nại, voucher, gateway và lệnh điều hành. Nhiều thao tác chỉ đổi state hoặc mô phỏng kết quả. |
| Điểm, review, khiếu nại | `PointsModal`, `ReviewModal`, `DisputeModal` | Có giao diện và callback; chưa có sổ giao dịch, xác minh hoàn tất, kiểm soát trùng và vòng đời xử lý ở server. |
| PWA và phát hành | `PwaAndNetworkBar`, `HostingModal`, `public/sw.js` | Có nút cài PWA, trạng thái mạng, xuất HTML offline và công cụ deploy; đường dẫn còn xung đột giữa root và `/taxua-trip/`. |

### Luồng dữ liệu cần nắm

Hiện tại: `mockData.ts → React state trong App → props xuống component → callback thay đổi state`. Chỉ một số cấu hình, user và lịch trình được ghi localStorage. Việc đăng nhập đổi `currentUser` không tạo ra kho booking/điểm riêng cho từng người.

Luồng AI: `AITravelAdvisorModal → /api/ai/consult → Gemini hoặc rule engine → JSON trả về`. Cả hai nhánh dùng dữ liệu import từ `INITIAL_LISTINGS`, không dùng các thay đổi mới của đối tác trên giao diện.

Backend hiện có 6 route: tư vấn, báo giá nhanh, health, kiểm tra gateway, playground chat và phân loại độ phức tạp. Chưa có route nghiệp vụ cho auth, listing, booking, lịch trống, payment, review hay chat.

Kiến trúc đích được cập nhật cho beta: giữ React/Vite và UI đang có; backend chạy Cloudflare Workers, ưu tiên tái sử dụng Express bằng adapter phù hợp; **D1** là nguồn SQL chung, **R2** giữ tệp. Mọi thay đổi về quyền, giá, tồn kho, tiền và điểm được quyết định ở server và truy vấn có kiểm quyền. Không chuyển nguyên SQL/RLS PostgreSQL sang D1; dùng migration SQLite/D1. Chưa cần kho phân tích riêng, microservice hoặc viết lại toàn bộ bằng framework khác. Các giới hạn runtime, chống bot/spam và tiêu chí D1 được quy định trong Cloudflare plan.

## 2. Các điểm tốt nên giữ

| # | Điểm tốt | Giá trị cho dự án | Cách phát huy |
|---|---|---|---|
| G1 | Bài toán địa phương cụ thể: view mây, đường ô tô, nước nóng, đệm sưởi, điểm đón dọc tuyến | Giúp sản phẩm giải quyết nhu cầu thực tế của khách đi Tà Xùa | Giữ các tiêu chí này nhưng chuyển từ suy luận bằng chuỗi sang thuộc tính có nguồn xác minh. |
| G2 | Có mô hình `Listing` chung và các kiểu phòng, gói dịch vụ, thực đơn, chuyến xe | Có thể tái sử dụng lõi tìm kiếm/chi tiết/đặt dịch vụ | Chuẩn hóa ID và enum; giảm các trường alias; tách thông tin chuyến xe khỏi listing. |
| G3 | Đã có hành trình cho khách, đối tác và admin | Dễ demo và thu thập phản hồi trước khi đầu tư backend | Tận dụng UI hiện có để nối dần từng luồng thật, đánh dấu rõ phần demo. |
| G4 | Quy tắc nghiệp vụ đã được tách một phần vào `rules.ts` | Có nền để kiểm thử tính tiền, ngày, điểm và quyền | Dùng chung quy tắc cho UI/API; tránh viết lại công thức khác trong modal. |
| G5 | Có 31 kiểm thử tự động và tất cả vượt qua trong lần rà soát | Tốt hơn việc chỉ kiểm tra build; có thể dùng làm nền chống lỗi lặp | Bổ sung kiểm thử nối các module, nhất là dữ liệu thật đưa vào sơ đồ ghế và vòng đời booking. |
| G6 | Liên hệ nhà cung cấp công khai, có so sánh và danh sách yêu thích | Phù hợp định hướng minh bạch và giúp khách ra quyết định | Giữ liên hệ công khai theo lựa chọn của cơ sở; tạo giá trị đặt trên web bằng lịch sử và hỗ trợ có thật. |
| G7 | Có chú ý tới mạng yếu, xuất lịch trình HTML và GPS | Rất phù hợp bối cảnh đường đèo, vùng thiếu sóng | Hoàn thiện phạm vi cache, khôi phục lịch trình và dữ liệu SOS đã xác minh. |
| G8 | Có cấu trúc trạng thái booking, thanh toán, khiếu nại và feature flag thu phí | Đã thể hiện được phần lớn khái niệm nghiệp vụ cần có | Chuyển thành quy tắc chuyển trạng thái, ràng buộc và sổ giao dịch ở CSDL. |
| G9 | Gemini key được đọc từ môi trường server; có fallback để tránh phụ thuộc hoàn toàn vào AI | Có điểm bắt đầu hợp lý cho tích hợp AI | Giữ ranh giới server, đóng gateway tùy ý và trả rõ nguồn dữ liệu/chế độ fallback. |
| G10 | Tài liệu có mô hình kinh doanh, vai trò vận hành và tiêu chí nghiệm thu khá rõ | Có cơ sở để cắt phạm vi và ưu tiên | Dùng master plan hợp nhất làm tài liệu định hướng; chuyển các yêu cầu beta thành spec Markdown trong repo. |

## 3. Bảng plan ưu tiên

**P0:** phải xử lý trước khi mở tính năng tương ứng cho dữ liệu hoặc giao dịch thật. **P1:** cần hoàn thiện để beta vận hành ổn định. **P2:** tối ưu sau khi lõi đã đúng. Mức ưu tiên đánh giá rủi ro khi đưa ra vận hành, không đồng nghĩa bản demo đang gây ra giao dịch thật.

Quy mô công việc: **S = 1–2 ngày**, **M = 3–5 ngày**, **L = 1–2 tuần**, **XL = 2–4 tuần công**. Đây là ước lượng sơ bộ cho người quen stack, chưa gồm thời gian chờ tài khoản dịch vụ, xác minh dữ liệu hoặc quyết định sản phẩm. Các mục có phần giao nhau, không cộng cơ học để ra lịch giao hàng.

Vai trò: **BE** = backend/CSDL; **FE** = giao diện; **QA** = kiểm thử; **VH** = vận hành; **SP** = phụ trách sản phẩm. Với đội nhỏ, một người có thể kiêm nhiều vai trò.

| ID | Ưu tiên | Hạng mục và tình huống hiện tại | Công việc cụ thể | Tiêu chí hoàn thành | Phụ thuộc | Phụ trách / Công |
|---|---|---|---|---|---|---|
| 01 | P0 | **Xác thực và quyền sở hữu.** Chọn admin, nhập email bất kỳ và mật khẩu đủ dài có thể được tạo user admin; partner có thể chọn cơ sở khác để quản lý. | Tách chế độ demo; tích hợp đăng nhập thật; server quyết định role; chỉ admin được cấp quyền admin; mọi truy vấn/ghi dữ liệu giới hạn theo chủ sở hữu. | Khách không tự nâng quyền; partner A không đọc/sửa đơn, biên lai hay listing của B; logout không tự đăng nhập lại thành user demo. Có kiểm thử truy cập chéo. | Chọn phương án auth; 02 triển khai cùng | BE + FE / L |
| 02 | P0 | **Lưu trữ dữ liệu chung.** Tạo đơn, sửa giá hoặc gửi khiếu nại rồi tải lại sẽ mất phần lớn thay đổi; trình duyệt khác không thấy. | Tạo schema/migration cho user, listing, phòng, giá, booking, payment, review, dispute; chuyển đọc/ghi sang API; lưu ảnh trong kho tệp có quyền; sao lưu và thử khôi phục. | Đơn và thay đổi còn sau reload/restart; hai thiết bị thấy cùng trạng thái; dữ liệu mỗi người được tách đúng; có bản khôi phục thử thành công. | 01 | BE / XL |
| 03 | P0 | **Đầu vào API có thể làm server dừng.** `/api/ai/consult` thiếu `pickupLocation` làm fallback ném lỗi lần nữa ngoài phần bắt lỗi. Ngày đảo chiều vẫn được báo giá thành công. | Kiểm tra kiểu/độ dài/ngày/số khách/ngân sách trước xử lý; giới hạn khoảng thời gian; xử lý lỗi async tập trung và fallback có bảo vệ; trả lỗi 4xx phù hợp. | Gửi thiếu trường, sai kiểu, ngày đảo hoặc khoảng quá dài đều bị từ chối; sau các yêu cầu này `/api/health` vẫn trả lời. | Không | BE + QA / M |
| 04 | P0 | **Gateway có thể bị dùng gọi mạng tùy ý và tiêu tốn key.** Client được chọn `baseUrl`; playground có thể dùng key môi trường. Key nhập ở admin được lưu nguyên trong localStorage. | Chỉ admin đã xác thực được dùng; cấu hình đích/key ở server; chỉ cho provider đã cấu hình; chặn đích nội bộ/redirect ngoài danh sách; đặt timeout, giới hạn tần suất và ngân sách phía server. | API không gọi được endpoint loopback/nội bộ/đích lạ; client không đọc key thật; không thể bỏ qua hạn mức bằng cách sửa localStorage. | 01; phối hợp 03 | BE / M |
| 05 | P0 | **Chèn HTML vào bản đồ và tệp tải về.** Tên listing/địa danh được nội suy trực tiếp vào HTML của Leaflet và lịch trình HTML. | Dùng DOM với `textContent` cho nội dung văn bản; escape theo ngữ cảnh khi xuất HTML; kiểm tra URL ảnh/liên kết. | Tên chứa thẻ HTML hoặc thuộc tính sự kiện được hiển thị như văn bản; không chạy script trong tooltip và bản HTML xuất. | Không; kiểm tra lại sau 02 | FE + QA / S–M |
| 06 | P0 | **Lịch trống và giữ chỗ.** Form xác nhận không kiểm tra lại tồn phòng/sức chứa; hai booking nối tiếp có thể làm bộ lọc báo hết sai; chưa có giữ chỗ hết hạn. | Chuẩn hóa tồn kho theo ngày/hạng phòng hoặc phòng cụ thể; kiểm tra từng đêm; transaction chống tranh chấp; giữ chỗ có thời hạn; tính số phòng theo số khách; dùng `roomTypeId`. | 20 yêu cầu cùng tranh phòng cuối chỉ tối đa một đơn giữ được; giữ chỗ hết hạn trả tồn; hai đơn ở hai đêm khác nhau không bị trừ đồng thời; không nhận nhóm vượt sức chứa. | 01, 02, 08 | BE + FE + QA / XL |
| 07 | P0 | **Sai mã ghế và mô hình chuyến xe.** Cả 6 chuyến mẫu có ghế đã đặt nhưng sơ đồ hiện 0 ghế bận; chọn ghế khác vẫn lưu thành `[1, 2, ...]`. | Chuẩn hóa `busType` bằng mã enum; lưu đúng `seatCode`; tách listing/nhà xe/tuyến/chuyến theo ngày; nối màn quản lý xe với màn bán vé; giữ ghế bằng ràng buộc CSDL. | Chuyến mẫu khóa đúng ghế; xe hai tầng có đúng hai tầng; ghế chọn khớp đơn/vé/đối tác; mỗi chuyến/ngày có tồn riêng; không bán trùng. | 02, 06 | BE + FE + QA / L |
| 08 | P0 | **Giá và voucher không có một nguồn tính thống nhất.** Homestay luôn dùng `priceWeekend`; voucher chỉ kiểm tra mã/active/mức tối thiểu lúc áp dụng. | Tạo hàm báo giá dùng chung và endpoint báo giá chuẩn; tính từng đêm, số phòng/người và gói dịch vụ; kiểm tra hạn, ngành, listing và điều kiện voucher khi chốt; lưu bản chụp báo giá vào đơn. | Giá ngày thường/cuối tuần/hỗn hợp đúng; đổi ngày, gói, số lượng làm báo giá cập nhật; voucher hết hạn/sai cơ sở bị từ chối; giá xác nhận khớp giá hiển thị. | 02, 03 | BE + FE + QA / L |
| 09 | P0 | **Thanh toán chưa nhất quán.** Lúc đặt tính cọc 30%, màn chuyến đi đòi 50%; QR dùng tài khoản chung cố định; xác nhận tiền của partner không truyền về state App. | Chốt nhận tiền trực tiếp hay qua đơn vị trung gian, tỷ lệ cọc và trách nhiệm xác nhận; sinh QR từ payment/order chuẩn; nối callback xác nhận; lưu biên lai thật; nếu có cổng thanh toán thì xác minh và chống xử lý webhook lặp. | Một đơn có cùng người nhận, số tiền và nội dung ở mọi màn; xác nhận của partner hiện cho khách và còn sau reload; ảnh biên lai không tự được coi là tiền đã về; webhook lặp không ghi nhận thêm. | 01, 02, 08; quyết định SP | BE + FE + VH / XL |
| 10 | P0 | **Vòng đời đơn, phí, điểm và review.** Điểm cộng ngay lúc tạo đơn; gọi hoàn tất hai lần trừ 100.000đ; review thưởng 20/50 điểm tùy màn; khách tự bấm hoàn tất được. | Quy định ai được chuyển từng trạng thái; khóa giao dịch theo booking; ghi sổ phí/điểm một lần; chặn review trùng và kiểm tra người đặt/thời hạn; phát hành voucher thật khi đổi điểm; lấy mốc bật phí từ thành viên đã xác minh. | Gọi lại hoàn tất không đổi ví/điểm; hủy/đơn chưa ở không tạo thưởng; một booking một review hợp lệ; đổi điểm có mã quà sử dụng được; phí và điều kiện bật phí khớp chính sách. | 01, 02, 09 | BE + FE + QA / L |
| 11 | P0 | **Trạng thái duyệt không chặn công khai đồng bộ.** Các bộ lọc chính ở App và bản đồ không loại `pending/rejected`; deep link cũng tìm từ danh sách ban đầu. | Tập trung truy vấn listing công khai chỉ lấy bản `approved`; áp dụng cho danh sách, bản đồ, chi tiết, deep link và AI; sửa hồ sơ theo phiên bản/hàng chờ duyệt. | Từ chối một listing thì khách không thấy qua bất kỳ kênh nào; partner sửa dữ liệu nhạy cảm không tự thay bản đang công khai. | 01, 02 | BE + FE + QA / M |
| 12 | P0 | **Độ tin cậy của dữ liệu và thông tin an toàn.** Script tự sinh tọa độ, review, tiện nghi và huy hiệu; dự báo có số cố định; scanner có thể gắn cờ chỉ từ một chữ số khớp; hotline/ETA chưa có bằng chứng xác minh trong repo. | Tách demo/dữ liệu thu thập/dữ liệu đã xác minh; ghi nguồn, thời điểm và người duyệt; không tự tạo review/huy hiệu; xác minh hotline và dữ liệu vị trí; lấy thời tiết có thời gian cập nhật; scanner khớp định danh đủ dài/chính xác. | Mỗi khẳng định đã thẩm định có hồ sơ; giá/ảnh/GPS chưa xác nhận hiện đúng tình trạng; số liệu cũ hết hiệu lực; nhập một ký tự không trả kết luận lừa đảo; nội dung SOS có đầu mối chịu trách nhiệm. | SP + VH; 02 để lưu hồ sơ | VH + dữ liệu + FE / L, duy trì liên tục |
| 13 | P0 | **Chat và bằng chứng chưa được bảo vệ.** Phòng cùng mức dùng chung mảng tin; role được chọn tại UI; hash là hàm tự viết tại client; nút xuất PDF chỉ tạo mã. | Lưu conversation/membership/message riêng; kiểm quyền mọi lần đọc/ghi; timestamp và hash chuẩn ở server; lưu tin theo cơ chế chỉ ghi thêm; log truy cập; xuất và xác minh PDF thật; thông báo rõ bot hay người trả lời. | User ngoài phòng không đọc được; không trộn hội thoại; sửa dữ liệu bị phát hiện; admin đọc có ticket/log; xuất có tệp và đối chiếu được nguồn; tải lại không mất chat. | 01, 02 | BE + FE + QA / XL |
| 14 | P0 | **J.A.R.V.I.S. có thao tác kết luận hàng loạt thiếu kiểm chứng.** Hành động xử lý khiếu nại đóng tất cả vụ và ghi rằng đã đối chiếu biên lai/hash, dù handler không thực hiện đối chiếu. | Cho trợ lý soạn đề xuất và tóm tắt có dẫn chứng; quyết định tranh chấp/tiền/xác minh phải đi qua quy trình nghiệp vụ và người phụ trách; hiển thị phạm vi tác động, kiểm quyền và ghi log. | Không đóng tranh chấp hay nâng huy hiệu chỉ nhờ câu lệnh chung; không tạo lời xác nhận kiểm tra chưa diễn ra; các hành động có đối tượng, căn cứ và người quyết định rõ ràng. | 01, 10, 12, 13 | BE + FE + SP / M–L |
| 15 | P1 | **AI chưa bám dữ liệu vận hành và báo lỗi chưa trung thực.** Rule engine trả tối đa 3 ngày dù khách đi 5 ngày; ngày 2 vẫn có chuyến về; gateway 503 vẫn báo sẵn sàng; tác vụ sinh media chỉ đợi rồi chọn ảnh mẫu. | Dùng dữ liệu approved/giá/lịch từ server; số học do code quyết định; kiểm tra schema JSON trả về; phân biệt live/demo/fallback/error; nối cấu hình chatbot với runtime; log chi phí thực, không giả cache/token hay thành công. | Lịch trình đúng số ngày, về vào ngày cuối; giá và phòng khớp nguồn; JSON sai bị từ chối an toàn; provider lỗi hiển thị lỗi/fallback; media chỉ báo hoàn tất khi có kết quả từ provider. | 02, 03, 04, 06, 08, 11 | BE + FE + QA / L |
| 16 | P0 | **Triển khai và khởi động không khớp.** `npm start` lỗi import type; build chỉ tạo frontend; GitHub Pages/Vercel cấu hình hiện tại không dựng Express API; base `/taxua-trip/` lệch nhiều URL root. | Chốt một đường triển khai chính cho beta có backend thật; biên dịch server hoặc dùng runtime TS được hỗ trợ; tách API khỏi fallback HTML; thống nhất base URL theo môi trường; health check sau deploy. | Từ clean install chạy được build/start; trang danh sách và `/api/health` hoạt động trên staging; POST AI trả JSON; đường dẫn trực tiếp, ảnh, manifest và download đúng; API không bị trả nhầm HTML. | Quyết định hosting; phối hợp 19 | BE/triển khai + FE / M |
| 17 | P1 | **PWA chưa đúng phạm vi và chiến lược cache.** Manifest/SW dùng root dù build ở subpath; SW bắt mọi GET và có thể cache dữ liệu riêng; mất mạng tài nguyên nào cũng fallback HTML. | Dùng base/scope thống nhất; cache app shell và tài nguyên công khai theo phiên bản; loại auth/payment/chat/API nhạy cảm; chỉ fallback HTML cho navigation; giới hạn cache; khôi phục dữ liệu lịch trình đã lưu. | Cài PWA ở root/subpath phù hợp môi trường; khởi động offline sau lần tải đầu; API không trả HTML offline; không lưu hoặc lộ dữ liệu tài khoản trước; cập nhật phiên bản không giữ giao diện cũ vô hạn. | 16; kiểm tra lại sau 02, 13 | FE + QA / M |
| 18 | P1 | **Gói tải đầu lớn và module ôm nhiều việc.** Build có một tệp JS 2,04 MB, gzip 444,56 KB; App 4.558 dòng, Admin 6.762 dòng; khách tải cả mã quản trị. | Tải theo nhu cầu cho admin/partner/map/AI; tải dữ liệu danh sách theo trang; tách logic đặt chỗ, giá, phiên người dùng khỏi JSX; chỉ tách module theo trách nhiệm. Giữ React/Vite nếu chưa có nhu cầu đổi. | Đặt và đo ngân sách JS ban đầu, đề xuất ≤250 KB gzip; khách chưa mở admin/map không tải phần đó; thay đổi bộ lọc không phải sửa logic tiền; đo hiệu năng trên thiết bị/mạng beta. | Sau khi chốt các hợp đồng dữ liệu 02, 08; có thể tối ưu tải sớm | FE / L |
| 19 | P1 | **Kiểm thử, nhập dữ liệu và tài liệu chưa thành quy trình.** Không có script test; CI chỉ build; script cập nhật mockData ghi đè phần chuẩn hóa và có thể làm hỏng import type; dữ liệu có ID lệch. | Thêm test command và CI typecheck/test/build; kiểm thử tích hợp auth/đồng thời/tiền; dùng một package manager và cài theo lockfile; xuất dữ liệu riêng thay vì ghi đè code; kiểm tra khóa ngoại/schema; viết README và quy tắc nghiệp vụ Markdown. | Pipeline bắt được ghế sai, giao dịch lặp và truy cập chéo; chạy nhập dữ liệu không mất logic hay làm lỗi compile; clean install tái lập được; người mới chạy dự án theo README. | Bắt đầu ngay; thêm kiểm thử theo từng mục 01–17 | QA + BE + FE / M nền tảng, bổ sung cùng từng luồng |
| 20 | P1/P2 | **Trạng thái form và liên kết chưa xuyên suốt.** Hero giữ ngày/số khách riêng nhưng không chuyển sang tìm kiếm; modal đặt lại ngày cố định; AuthModal không đồng bộ `initialRole/mode`; cập nhật URL làm rơi UTM. | Tạo hợp đồng Search/BookingIntent dùng chung; ngày mặc định theo ngày địa phương; truyền lựa chọn sang chi tiết/AI/booking; đồng bộ modal lúc mở; lưu nguồn chiến dịch trước khi sửa URL. Sau đó hoàn thiện URL trang dịch vụ và metadata chia sẻ. | Tìm ngày X cho 4 khách thì kết quả, chi tiết và đơn đều giữ X/4; không mặc định ngày quá khứ; mở đăng nhập partner đúng tab; UTM còn gắn với lượt đăng ký/booking; link chia sẻ mở đúng đối tượng. | 08, 16; đo attribution sau 02 | FE + SP / M; phần SEO/đo lường P2 |

## 4. Căn cứ cho từng mục

Các đường dẫn dưới đây tính từ thư mục ứng dụng. Số dòng tham chiếu là điểm bắt đầu của đoạn liên quan trong mã lúc rà soát.

| ID | Căn cứ trong mã và bằng chứng |
|---|---|
| 01 | `src/components/AuthModal.tsx:73,97,125` tạo user với `role: selectedRole`; `src/App.tsx:114,129` tin user/role từ localStorage; `PartnerDashboard.tsx:433,795` nhận toàn bộ booking và cho chuyển cơ sở. `App.tsx:4129` cũng truyền toàn bộ booking vào màn “của tôi”. Đây là quyền phía giao diện, chưa phải phân quyền dữ liệu. |
| 02 | `src/App.tsx:273` khởi tạo bookings/reviews/wallet/disputes bằng `useState`; `server.ts:27` trở đi chỉ có API AI/gateway/health. `src/App.tsx:210,265` chỉ lưu một số cấu hình vào localStorage. Không thấy thư viện hoặc mã truy cập CSDL trong luồng nghiệp vụ. |
| 03 | `server.ts:27–40`; `src/server/aiAdvisor.ts:136,209`. Yêu cầu `{checkIn, checkOut}` làm kết nối bị `ECONNRESET` và health sau đó không kết nối được trên tiến trình kiểm tra. Quick quote thiếu điểm đón trả 500; ngày 20/11 → 14/11 trả 200 với 6 đêm. |
| 04 | `server.ts:65–107` lấy `baseUrl` từ body; `src/server/aiAdvisor.ts:702,722` dùng URL client cùng key nhập hoặc key môi trường; `AdminDashboard.tsx:202,253` lưu cấu hình chứa `rawKey`. Đã thử với mock server loopback do phiên audit tạo: backend gọi được `/models` ở đích này, không cần đăng nhập. Chưa thử đọc hệ thống nội bộ nào khác. |
| 05 | `src/components/InteractiveMapSection.tsx:557,567,649,663` dùng chuỗi HTML; tên listing được nội suy tại dòng 665. `AIItineraryGenerator.tsx:420` xuất HTML chứa tên, khu vực, số liên hệ chưa escape. Xác định bằng đọc nguồn; chưa thực thi payload trong trình duyệt. |
| 06 | `src/components/ListingDetailModal.tsx:348` chỉ yêu cầu tên/SĐT trước xác nhận; `src/utils/rules.ts:271` đếm tổng mọi booking giao với khoảng tìm thay vì tồn theo đêm. Đã tái hiện: 2 phòng, một booking đêm 14 và một booking đêm 15, tìm 14–16 bị trả 0 trong khi mỗi đêm vẫn còn 1 phòng. `App.tsx:791` còn dùng `availableRooms || 1` khi tính sức chứa. |
| 07 | `BusBookingModal.tsx:54,104,169`; `rules.ts:1214`; `mockData.ts:12346`. Cả 6 `busType` dạng nhãn tiếng Việt không khớp enum máy của hàm dựng ghế; dữ liệu bận đổi sang `A01` nhưng sơ đồ dựng `G-01`. Kết quả: số ghế bận dự kiến `[3,6,2,5,2,6]`, thực tế `[0,0,0,0,0,0]`. Booking còn lưu thứ tự phần tử thay vì ghế đã chọn. |
| 08 | `ListingDetailModal.tsx:171–175` luôn đưa `priceWeekend` vào tính tiền; `:317` áp voucher không kiểm tra `validUntil/applicableCategory/applicableListingId`; `rules.ts:826` dùng một mô hình voucher khác với `PromoVoucher` và chỉ được test, chưa nối vào modal. |
| 09 | `ListingDetailModal.tsx:358` và `BusBookingModal.tsx:149` cọc 30%; `MyTripsModal.tsx:175` gọi QR 50%; `rules.ts:642` cố định tài khoản nhận. `PartnerDashboard.tsx:583` chỉ cập nhật bản sao state nếu thiếu `onConfirmPaymentProof`; `App.tsx:3772` không truyền callback này. `MyTripsModal.tsx:245` sửa trực tiếp props và chèn ảnh mẫu thay cho upload. |
| 10 | `App.tsx:833` cộng điểm khi tạo đơn; `:895` hoàn tất không kiểm tra trạng thái cũ/đã tính phí. Thực thi handler trích từ nguồn hai lần với cùng booking làm số đơn hoàn tất thành 2 và ví giảm 100.000đ. `:479` thưởng review 20, `:920` thưởng 50; `MyTripsModal.tsx:340` cho khách đánh dấu hoàn tất với mọi đơn chưa completed, kể cả cancelled. `:1001` đổi điểm chỉ giảm số dư và thông báo, chưa tạo mã quà. |
| 11 | `App.tsx:583,646` và `InteractiveMapSection.tsx:299` không lọc `status === 'approved'`; `App.tsx:526` mở deep link từ `INITIAL_LISTINGS`. Trong khi đó `AIItineraryGenerator.tsx:91` và `CloudForecastWidget.tsx:129` có lọc approved: cùng quy tắc đang được áp dụng khác nhau. |
| 12 | `scripts/build-mockdata.js:192–239` tự tạo tọa độ lệch, rating, reviewCount, huy hiệu và tag; `mockData.ts:12209` bổ sung menu/kho mặc định. `CloudForecastWidget.tsx:64` cố định dự báo 3 ngày; `SosModal.tsx:80` có số và cam kết thời gian mẫu. `VerificationMethodologySection.tsx:55,113` có blacklist mẫu, so khớp bằng `includes`, không yêu cầu độ dài định danh. Không kết luận số hotline hay cáo buộc mẫu là đúng ngoài đời. |
| 13 | `CommunitySection.tsx:724–728,803` chỉ có một mảng evidence và một mảng social; `:945` xuất PDF chỉ tạo mã; `rules.ts:378` là hash tự viết 16 ký tự hex, không phải SHA-256 như một số lời hiển thị. `DirectChatModal.tsx:88` sinh phản hồi chủ cơ sở bằng timer, không gửi đến host. |
| 14 | `JarvisAdminAssistant.tsx:316` duyệt tất cả claim; `:332` đóng tất cả dispute mà không đối chiếu tài liệu; `:402` thay dự báo bằng số trong payload/mặc định; `:478` dùng ảnh cố định nhưng thông báo đã sinh qua API. Việc bấm action có thể đổi state thật trong phiên, dù phần giải thích là mô phỏng. |
| 15 | `aiAdvisor.ts:91,162` dùng dữ liệu import cố định; `:244,293,341` lịch trình chỉ thêm ngày 1,2,3; `:569` ép JSON sang type mà không kiểm tra schema; `:747` ước lượng cache token theo tỷ lệ cố định. Thử 14–18/11 cho 4 khách: cần 5 ngày nhưng có 3 ngày, ngày 2 đã về; tổng tiền một mục homestay và phần tổng đoàn khác đơn vị tính mà chưa mô tả rõ. Mock upstream trả 503 nhưng `server.ts:65` vẫn trả `success: true` và lời “sẵn sàng”. `AdminDashboard.tsx:382` job media chỉ dùng timer/ảnh có sẵn. |
| 16 | `package.json:9` chạy `node server.ts`; trên Node 24.13.0 đã thất bại với lỗi `Booking` không phải runtime export từ types. `npm run build` chỉ chạy Vite. `.github/workflows/deploy.yml` chỉ upload `dist`; `vercel.json` chỉ cấu hình build/static rewrite, không ánh xạ `server.ts` thành API. `vite.config.ts:7` dùng subpath trong khi fetch API/SW/manifest/download dùng root. |
| 17 | `public/sw.js:1,29`; `public/manifest.json:2`; `index.html:17,127`. Cache root paths và mọi GET cùng origin thành công, không loại API riêng; lỗi mạng của tài nguyên bất kỳ đều có thể fallback `index.html`. `AIItineraryGenerator.tsx:70–87` đọc cờ/thời gian đã lưu nhưng không khôi phục toàn bộ lựa chọn đã lưu. |
| 18 | Build ngày rà soát: JS 2.038.622 byte, gzip theo Vite 444,56 KB; CSS 184,73 KB/gzip 28,28 KB; có cảnh báo chunk lớn. Tất cả màn lớn được import tĩnh trong `App.tsx`. Có hai ZIP source/project cùng SHA-256, mỗi tệp 1.683.952 byte, được copy vào dist. Chưa đo LCP/INP trên thiết bị thật nên không gán điểm Lighthouse giả định. |
| 19 | `package.json` không có `test`; workflow không chạy typecheck/test. `scripts/update-mockdata-file.js:9,37` ghi lại toàn bộ phần trước `CLOUD_LANDMARKS`, làm mất helper/chuẩn hóa hiện tại và dựng lại import thiếu type được dùng ở phần sau. Dữ liệu mẫu `homestay-lu-tre` không khớp ID listing `homestay-lutre`; `bus-01` là ID chuyến, không phải ID listing; cả 4 review mẫu dẫn đến booking không có trong `INITIAL_BOOKINGS`. |
| 20 | `HeroSection.tsx:85,127` giữ ngày/số khách nội bộ nhưng handler tìm không gửi chúng; `App.tsx:340`, `ListingDetailModal.tsx:88` có bộ ngày riêng. `AuthModal.tsx:38–39` chỉ lấy `initialRole/initialMode` ở lần mount, trong khi App luôn giữ component này. `App.tsx:541–551` dựng lại query chỉ từ vài trường và bỏ tham số UTM hiện có. |

## 5. Kết quả kiểm chứng

| Kiểm tra | Kết quả | Ý nghĩa và giới hạn |
|---|---|---|
| `npm run lint` | **Đạt** | Script thực tế là `tsc --noEmit`, chưa phải bộ kiểm tra style hay lint đầy đủ. TypeScript config chưa bật strict. |
| `npm run build` | **Đạt, có cảnh báo** | Frontend build được; một chunk JS lớn và cảnh báo `__dirname` cho cơ chế nạp config tương lai. Không chứng minh backend chạy được. |
| `npm start` trên Node 24.13.0 | **Không đạt** | Dừng ở named import của kiểu `Booking`. Không có server production được khởi động từ lệnh chuẩn. |
| 31 kiểm thử trong `rules.test.ts` | **31/31 đạt** | Môi trường này chạy `tsx` trực tiếp vướng `uv_os_get_passwd ENOMEM`; đã dùng esbuild chỉ loại TypeScript vào thư mục tạm và chạy cùng bộ test bằng `node --test`. Không sửa test hay mã nguồn để làm test qua. |
| Ghế của cả 6 chuyến mẫu qua hàm thật | **Phát hiện lỗi** | Mọi chuyến hiển thị 0 ghế bận dù dữ liệu đã có 2–6 ghế đặt. |
| Tồn phòng qua hai đêm có đơn nối tiếp | **Phát hiện lỗi** | Trả hết phòng sai dù từng đêm vẫn còn phòng. |
| Handler hoàn tất gọi lặp | **Phát hiện lỗi** | Một booking bị tính hai lần phí và số lần hoàn tất. |
| HTTP quick quote hợp lệ / ngày đảo / thiếu điểm đón | **200 / 200 sai / 500** | Chưa có lớp kiểm tra đầu vào nghiệp vụ đầy đủ. |
| HTTP consult thiếu điểm đón | **Tiến trình kiểm tra dừng** | Fallback ném lại lỗi không được xử lý. Chỉ tác động tiến trình cục bộ do phiên rà soát tạo. |
| Gateway tới mock loopback trả 503 | **Vẫn báo success và sẵn sàng** | Xác nhận backend gọi đích do client chọn và tình trạng lỗi bị diễn giải thành thành công. |
| Kiểm tra dữ liệu và gói phát hành | **Có sai liên kết và trùng gói** | Listing hiện là 185, không phải con số 179 cố định ở nhiều lời hiển thị; hai ZIP source/project giống hệt. |

Các kiểm tra HTTP dùng bản chuyển TypeScript sang JavaScript trong thư mục tạm để chạy được logic server, vì lệnh start hiện lỗi. Không gọi provider AI, cổng thanh toán, deploy thật, hotline hay gửi thông báo cho người khác. Build tạo lại `dist`; không thay đổi mã ứng dụng để sửa các lỗi nêu trên.

## 6. Thứ tự triển khai đề xuất

| Chặng | Đầu việc từ plan | Kết quả cần đạt trước khi chuyển chặng |
|---|---|---|
| A — Làm rõ bản demo và môi trường chạy | Bắt đầu 03, 04, 05, 12, 14, 16, 19; gắn nhãn/tắt thao tác giao dịch mô phỏng ở môi trường công khai | Bản demo không khẳng định đã nhận tiền/gửi chủ cơ sở/xác minh/sinh AI khi chưa làm; start và API ổn định; endpoint không bị gọi tùy ý. |
| B — Nguồn dữ liệu và tài khoản | 01, 02, 11; chuẩn hóa ID/type ở 07, 19 | Có staging, tài khoản thật, quyền sở hữu, migration và dữ liệu được duyệt. Hai thiết bị dùng cùng dữ liệu. |
| C — Một luồng homestay hoàn chỉnh | 08 → 06 → 09 → 10; phần search của 20; kiểm thử 19 đi cùng | Tìm ngày → báo giá → giữ chỗ → xác nhận → nhận tiền → check-in → hoàn tất → phí/điểm → review chạy đúng và không mất dữ liệu. |
| D — Mở beta có kiểm soát | Dữ liệu thật 12; chat tối thiểu 13; AI chỉ đọc 15; PWA 17; tối ưu tải 18 | Có cơ sở đã xác minh, hỗ trợ có người chịu trách nhiệm, log và khôi phục; các lỗi P0 trong tính năng được mở đã đóng. |
| E — Mở rộng sau khi beta ổn định | Nhà xe đầy đủ 07; cộng đồng/ghép nhóm nâng cao 13; AI điều hành 14–15; SEO/attribution 20 | Mở từng tính năng theo dữ liệu và kiểm thử riêng, theo dõi phản hồi và tần suất lỗi trước khi tăng quy mô. |

Đối với MVP, nên lấy **homestay + lịch trống + booking + đối tác + admin duyệt** làm đường đi đầu tiên. Giữ bản đồ, liên hệ công khai và lịch trình tham khảo. Các tính năng ghép nhóm nhiều bên, media AI, trợ lý điều hành hàng loạt và kho phân tích có thể để sau khi một giao dịch homestay chạy hoàn chỉnh.

### Điều kiện mở giao dịch thật

- Các mục P0 liên quan đến tính năng được mở đã có kiểm thử đạt; không còn đăng nhập tùy ý hoặc truy cập chéo khách/đối tác.
- Giá, phòng và số tiền cọc có một nguồn thống nhất; kiểm thử đồng thời không tạo đặt trùng; thực hiện lại một sự kiện không ghi thêm tiền/điểm.
- Có dữ liệu và đầu mối hỗ trợ đã kiểm tra; bản demo tách khỏi dữ liệu thật; không dùng review, blacklist hay thông tin an toàn giả lập như dữ liệu xác thực.
- Staging chạy được từ clean install; log không lộ bí mật; thử khôi phục dữ liệu thành công; người vận hành có hướng dẫn xử lý đơn lỗi/khiếu nại.
- Chỉ bật thu phí khi điều kiện sản phẩm đã chốt được thực thi bằng dữ liệu thật. Những quyết định về người nhận tiền, tỷ lệ cọc, chính sách hủy và xử lý tranh chấp cần ghi thành spec trước khi triển khai mục 09–10.

## 7. Tối ưu gọn và phần chưa kiểm tra

**Có thể giảm dung lượng ngay sau khi xác nhận nhu cầu phân phối:** hai ZIP source/project trùng nhau; nếu chỉ giữ một bản sẽ giảm 1.683.952 byte trong mỗi gói deploy. Có thể đưa gói source/build và PDF kế hoạch nội bộ sang nơi phát hành riêng nếu khách du lịch không cần tải. Chưa xóa tệp nào và chưa kết luận chúng không được dùng: Navbar/HostingModal có luồng download thật.

**Có thể giảm mã trùng:** hợp nhất công thức giá/điểm/voucher và hai handler review; chia danh sách nghiệp vụ khỏi phần render của App/Admin/Partner/Community. Chưa đưa con số dòng hay số dependency tiết kiệm khi chưa thực hiện và đo diff; chưa đề xuất bỏ dependency nào chỉ vì có vẻ thừa.

**Chưa kiểm tra:** giao diện desktop/mobile bằng trình duyệt, bàn phím và trình đọc màn hình; hành vi PWA trên iOS/Android; mạng yếu thực tế tại Tà Xùa; môi trường deploy ngoài; khóa/provider/model AI thật; webhook/đối soát ngân hàng; tính đúng ngoài đời của ảnh, thông tin cơ sở, GPS, hotline, blacklist và thời tiết; kiểm thử tải; điều kiện pháp lý và quyền sử dụng dữ liệu thu thập. Những phần này cần bằng chứng vận hành riêng, không thể suy ra từ build thành công.

**Kết luận đánh giá:** Nên giữ giá trị sản phẩm và giao diện đã có, ưu tiên làm đúng nguồn dữ liệu, phân quyền và một vòng đời booking hoàn chỉnh. Đây là bước đem lại giá trị lớn hơn việc tiếp tục mở rộng số màn hoặc thêm model AI ở trạng thái hiện tại.
