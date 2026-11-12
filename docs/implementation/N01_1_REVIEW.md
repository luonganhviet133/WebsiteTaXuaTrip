# Đối chiếu báo cáo và hiện trạng N01.1

Ngày kiểm tra: **12/11/2026**. Phạm vi: mã và tài liệu của N01.1, đối chiếu với `ANTIGRAVITY_IMPLEMENTATION_PLAN.md` và báo cáo thực hiện được cung cấp.

**Kết luận: chưa đủ điều kiện xác nhận N01.1 đạt 100%.** Các thay đổi chính đã có thật; clean install, typecheck, 36 lượt kiểm thử và build đều kiểm chứng lại được. Tuy nhiên, lệnh start mặc định chạy chế độ development và việc chọn thư mục tĩnh khi chạy production từ mã nguồn bị sai. Bộ test hiện tại chưa kiểm tra các hành vi này.

Không đánh giá việc thiếu validation đầy đủ, auth gateway hoặc CSDL là lỗi hoàn thành N01.1: đây là phần đã phân cho N01.2/N02 trong plan.

## 1. Kết quả chạy lại

| Hạng mục trong báo cáo | Hiện trạng kiểm chứng | Đánh giá |
|---|---|---|
| Type-only imports | Có thay đổi tại mockData, aiAdvisor và server; import server bằng Node 24 không còn lỗi named export của Booking | Đạt |
| Factory/listener riêng | Có `createExpressApp`, `startServer`, guard main module. Import để chạy thử không tự mở listener ứng dụng | Đạt |
| Clean install theo lockfile | `npm ci --legacy-peer-deps --offline --no-audit --no-fund` trong thư mục tạm độc lập cài được 184 package; exit 0 | Đạt với cache offline; không thay node_modules của ứng dụng |
| Typecheck | `npm run typecheck` exit 0 | Đạt |
| Bộ test | `npm test` exit 0, 36 pass, 0 fail, 0 skip | Đạt; gồm 31 unit test, 4 test con API và 1 test cha, không phải 5 tình huống API độc lập |
| Build frontend/server | `npm run build` exit 0; có `dist/server.js` khoảng 681,5 KiB; frontend có cảnh báo chunk JS lớn | Đạt; cảnh báo dung lượng là phần tối ưu sau |
| Vite config | Cảnh báo dùng `__dirname` không còn xuất hiện trong lần build này | Đạt |
| API health và endpoint thiếu | `/api/health` trả 200 JSON; `/api/missing` trả 404 JSON | Đạt với các route đã thử |
| Mọi URL thuộc tiền tố API đều JSON | `GET /api` trả 200 HTML; `POST /api` trả 404 HTML | Chưa đạt phạm vi tiền tố API đầy đủ |
| `npm start` chạy production theo README | Entry point đúng script là `node dist/server.js`; khi không có `NODE_ENV`, nó khởi tạo Vite development | Chưa đạt |
| Smoke test có đặt `NODE_ENV=production` | Bản bundle trả HTML build ở `/` và `/taxua-trip/`; assets JS đúng Content-Type; health và API 404 đúng | Đạt với điều kiện đã đặt biến môi trường |
| Production từ `server.ts` | `createExpressApp({isProd:true})` chọn thư mục source làm static root, trả index source và asset bị fallback HTML | Chưa đạt tuyên bố hỗ trợ cả chạy source và bundle |
| CI, README, decisions, progress | Các tệp và bước typecheck/test/build đều tồn tại | Đã làm; cần sửa các kết luận/hướng dẫn chưa chính xác bên dưới |

Trong sandbox hạn chế quyền, `tsx` lỗi `uv_os_get_passwd ENOMEM` và esbuild lỗi đọc thư mục bị từ chối. Hai lệnh được chạy lại ngoài sandbox và đều thành công. Đây là trở ngại môi trường kiểm tra, không được tính là lỗi mã hay dùng để bác kết quả 36 test/build của báo cáo.

## 2. Các lỗi cần sửa trong N01.1

### F1 — [P1] `npm start` mặc định chạy development

- **Vai trò:** lệnh start được README mô tả là cách chạy server production sau build.
- **Vấn đề:** `package.json:11` chỉ chạy `node dist/server.js`; `server.ts:195` chỉ bật production khi `NODE_ENV === 'production'`. Repo hiện không có `.env` đặt giá trị này; `.env.example` cũng không thiết lập nó. Khởi chạy entry point với `NODE_ENV` không được đặt cho kết quả `Env: development`, HTML có `/@vite/client` và `/src/main.tsx`; `/sw.js` là script hủy service worker.
- **Sửa tối thiểu:** bảo đảm entry point production mặc định chạy production theo cách dùng được trên cả Windows/Linux; giữ `npm run dev` chạy development. Bổ sung test khởi chạy entry point thật với `NODE_ENV` chưa đặt, không chỉ gọi factory với tùy chọn `isProd:true`.
- **Nếu bỏ qua:** người dùng làm đúng README vẫn chạy Vite development thay vì ứng dụng build; smoke test đã ép biến production không chứng minh được lệnh start mặc định đạt yêu cầu.

**Kiểm tra lại cần đạt:** sau build, chạy `npm start` trong môi trường không đặt `NODE_ENV`; HTML dùng assets build, không có Vite client/source entry, SW không phải script development unregister. Health/API thiếu vẫn trả JSON đúng.

### F2 — [P1] Chọn nhầm thư mục source làm thư mục tĩnh ở chế độ production

- **Vai trò:** `server.ts:176–180` cố phân biệt chạy mã nguồn với chạy bundle để tìm frontend build.
- **Vấn đề:** điều kiện `existsSync(__dirname/index.html)` cũng đúng ở gốc source vì Vite có `index.html` tại đó. Khi import source và tạo app production, `/` trả index chứa `/src/main.tsx`; `/taxua-trip/assets/index-DwEZCC3a.js` trả 200 **HTML**, không phải JavaScript. `GET /server.ts` còn tải được mã server, chứng minh static root đang trỏ vào cả thư mục dự án.
- **Sửa tối thiểu:** chọn đường dẫn frontend build một cách tường minh theo vị trí entry point hoặc truyền đường dẫn qua tùy chọn factory; không dùng việc có index.html để suy ra root. Chỉ mount thư mục frontend đã build. Viết kiểm thử cả source factory và bundle production, đối chiếu nội dung HTML/Content-Type asset, không chỉ status 200.
- **Nếu bỏ qua:** production chạy từ source không nạp đúng giao diện; test server vẫn xanh vì chỉ gọi API và không thử frontend/asset.

**Kiểm tra lại cần đạt:** cùng bộ route frontend/API hoạt động đúng khi chạy từ source ở production và khi chạy bundle, hoặc tài liệu phải giới hạn rõ chỉ hỗ trợ bundle. Chế độ production không phục vụ tệp source từ gốc dự án.

### F3 — [P2] Bộ chặn `/api/*` bỏ sót chính đường dẫn `/api`

- **Vai trò:** `server.ts:135` ngăn API không tồn tại rơi xuống SPA HTML.
- **Vấn đề:** `app.all('/api/*', ...)` không khớp `/api` không có dấu `/` cuối. Với bundle production, `GET /api` trả 200 HTML còn `POST /api` trả 404 HTML. `/api/` và `/api/missing` thì trả JSON đúng.
- **Sửa tối thiểu:** đặt fallback cho toàn bộ mount prefix `/api` sau các route hợp lệ, hoặc bao gồm cả `/api` và `/api/*`. Thêm test GET/POST cho bare prefix và route con không tồn tại.
- **Nếu bỏ qua:** khẳng định mọi URL API đều trả JSON vẫn có ngoại lệ; client có thể tiếp tục nhận HTML khi cấu hình thiếu phần route.

Lỗi JSON parser hoặc body malformed thuộc N01.2; không mở rộng F3 sang toàn bộ xử lý lỗi đầu vào của đợt sau.

## 3. Bằng chứng runtime

| Cách chạy / yêu cầu | HTTP và nội dung thực tế |
|---|---|
| `node dist/server.js`, bỏ `NODE_ENV` khỏi môi trường con | Log `Env: development`; `/` có Vite client/source entry, không có đường dẫn assets build |
| Cách chạy trên, `GET /sw.js` | Có `registration.unregister()` của middleware development |
| `NODE_ENV=production node dist/server.js`, `GET /` | 200 HTML build, không có Vite client |
| Bundle production, `GET /taxua-trip/` | 200 HTML build |
| Bundle production, `GET /taxua-trip/assets/index-DwEZCC3a.js` | 200 `application/javascript` |
| Factory import từ source, `{isProd:true,skipVite:true}`, `GET /` | 200 HTML source, chứa `/src/main.tsx` |
| Factory source như trên, `GET /taxua-trip/assets/index-DwEZCC3a.js` | 200 `text/html`, bị SPA fallback |
| Factory source như trên, `GET /server.ts` | 200, nội dung mã nguồn server |
| Bundle production, `GET /api` | 200 `text/html` |
| Bundle production, `POST /api` | 404 `text/html` |
| Bundle production, `GET /api/` hoặc `/api/missing` | 404 `application/json` |

Ngoài ra, bundle server hiện nằm trong chính thư mục được mount static: `GET /server.js` và `/taxua-trip/server.js` tải được tệp backend khoảng 698 KB. Workflow cũng upload cả `dist` lên Pages. Đây là điểm cần phân định gói frontend/backend khi sửa đường dẫn phát hành; kiểm tra này **không phát hiện hay khẳng định có API key thật trong bundle**. GitHub Pages vẫn chỉ chạy phần tĩnh; không được hiểu upload server.js là đã chạy backend trên Pages.

## 4. Những chỗ cần hiệu chỉnh trong tài liệu/báo cáo

1. `PROGRESS.md` chưa nên giữ kết luận đạt toàn bộ N01.1 trước khi F1/F2 được sửa và kiểm tra lại. Có thể ghi “code chính đã xong, đang sửa lỗi nghiệm thu production”.
2. Bổ sung bằng chứng test entry point production, HTML build và asset. Bộ 4 API test con hiện có không kiểm tra frontend production, việc chọn static root hay môi trường của `npm start`.
3. Sửa mô tả “5 API integration tests” thành “4 ca API trong 1 test cha”; tổng counter của Node vẫn là 36. Quick quote test dùng 20–22/11 là **2 đêm**, không chứng minh khẳng định “2 ngày 2 đêm”.
4. README ghi Node `>=20.x` quá rộng so với engine của Vite đang cài: `^20.19.0 || >=22.12.0`. Cập nhật phiên bản tối thiểu và cách cấu hình môi trường thực sự dùng.
5. Quyết định D-N01.1-06 nói CI ngăn chặn hoàn toàn việc merge là quá mức bằng chứng. Workflow hiện chạy khi push main/master hoặc gọi thủ công, không có `pull_request`; chưa kiểm tra required checks/branch protection ở dịch vụ Git.
6. Hỗ trợ frontend root/subpath trên Express không chứng minh API hoạt động trên GitHub Pages. Hạ tầng backend thật vẫn là việc phải hoàn thiện theo D02/N10.

## 5. Prompt giao Antigravity sửa phần còn lại

```text
Đọc docs/implementation/N01_1_REVIEW.md và hiện trạng mã mới nhất.
Sửa các lỗi nghiệm thu F1, F2, F3 trong N01.1:
- npm start phải chạy production theo README ngay cả khi NODE_ENV chưa được đặt; npm run dev vẫn chạy development.
- Chọn đúng frontend build directory khi chạy source và bundle; không mount cả source root. Phân định tệp backend với thư mục public frontend.
- Fallback JSON 404 bao phủ cả /api và /api/* cho GET/POST.

Thêm test thật cho entry point sản phẩm, nội dung HTML build và Content-Type của assets ở root/subpath; bảo đảm các test này thất bại trên mã cũ.
Chạy lại clean install, typecheck, toàn bộ test, build và smoke production; phân biệt lỗi sandbox với lỗi mã.
Cập nhật README, DECISIONS và PROGRESS theo bằng chứng thực tế. Chưa làm thêm validation/auth/CSDL của N01.2/N02 trong lượt sửa này.
```

**Phán quyết:** sửa F1/F2 và hoàn thiện F3 trước khi chốt nghiệm thu N01.1. Có thể chuẩn bị N01.2, nhưng không dùng tiến độ đợt sau thay cho việc kiểm chứng production của N01.1.

**Chưa kiểm tra:** CI chạy thực tế trên GitHub, branch protection, Linux/macOS và các phiên bản Node khác, browser/mobile/PWA đầy đủ, hạ tầng deploy ngoài. Không gọi provider AI, cổng thanh toán hoặc gửi thông báo thật. Phiên review không sửa mã ứng dụng hay ghi đè báo cáo tiến độ của Antigravity; chỉ thêm tài liệu đối chiếu này và tạo lại artifact build khi kiểm tra.
