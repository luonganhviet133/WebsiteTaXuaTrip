import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TAB_PATHS, pathForTab, listingPath, parseLocation, buildQuery, normalizeTab } from './routes.ts';

test('Mỗi màn có đường dẫn riêng, không trùng nhau', () => {
  const paths = Object.values(TAB_PATHS);
  assert.equal(new Set(paths).size, paths.length);
  assert.equal(pathForTab('explore'), '/');
  assert.equal(pathForTab('stay'), '/luu-tru');
  assert.equal(pathForTab('partner'), '/doi-tac');
  assert.equal(pathForTab('admin'), '/quan-tri');
});

test('Tên tab cũ/biệt danh quy về một tab', () => {
  assert.equal(normalizeTab('stays'), 'stay');
  assert.equal(normalizeTab('bus'), 'transport');
  assert.equal(normalizeTab('khong-co'), 'explore');
});

test('Đọc lại đúng tab từ đường dẫn, chịu được dấu / cuối', () => {
  for (const [tab, path] of Object.entries(TAB_PATHS)) {
    assert.equal(parseLocation(path, '').tab, tab, path);
  }
  assert.equal(parseLocation('/luu-tru/', '').tab, 'stay');
});

test('Trang chi tiết cơ sở /co-so/:id', () => {
  assert.equal(listingPath('tx-stay-5'), '/co-so/tx-stay-5');
  const r = parseLocation('/co-so/tx-stay-5', '');
  assert.equal(r.listingId, 'tx-stay-5');
  assert.equal(r.tab, undefined, 'giữ nguyên màn nền đang xem');
  assert.equal(parseLocation('/co-so/', '').notFound, true);
});

test('Chuyến đi của tôi có đường dẫn riêng', () => {
  assert.equal(parseLocation('/chuyen-di-cua-toi', '').myTrips, true);
});

test('Đường dẫn lạ → trang chủ, đánh dấu không tìm thấy', () => {
  const r = parseLocation('/abc/xyz', '');
  assert.equal(r.tab, 'explore');
  assert.equal(r.notFound, true);
});

test('Link cũ dạng ?tab=&listing= được chuyển sang đường dẫn mới, giữ bộ lọc', () => {
  assert.equal(parseLocation('/', '?tab=stay&checkin=2026-11-20&checkout=2026-11-22').redirectTo, '/luu-tru?checkin=2026-11-20&checkout=2026-11-22');
  assert.equal(parseLocation('/', '?listing=tx-stay-5&tab=stay').redirectTo, '/co-so/tx-stay-5');
  assert.equal(parseLocation('/', '?tab=explore').redirectTo, '/');
  assert.equal(parseLocation('/luu-tru', '?checkin=2026-11-20').redirectTo, undefined);
});

test('Bộ lọc trong query: đọc và ghi khớp nhau', () => {
  const q = buildQuery({ checkIn: '2026-11-20', checkOut: '2026-11-22', adults: 4, children: 1, rooms: 2, area: 'Đỉnh Gió', wishlistIds: ['a', 'b'] });
  const r = parseLocation('/luu-tru', q);
  assert.equal(r.query.checkIn, '2026-11-20');
  assert.equal(r.query.checkOut, '2026-11-22');
  assert.equal(r.query.area, 'Đỉnh Gió');
  assert.deepEqual(r.query.wishlistIds, ['a', 'b']);
  assert.equal(r.query.adults, 4);
  assert.equal(r.query.children, 1);
  assert.equal(r.query.rooms, 2);
  assert.equal(buildQuery({}), '');
  assert.equal(buildQuery({ area: 'all' }), '');
});

test('N05.3: đường dẫn QR nhận phòng mở màn đối tác kèm mã', () => {
  const r = parseLocation('/doi-tac/nhan-phong', '?ma=abc_DEF-123');
  assert.equal(r.tab, 'partner');
  assert.equal(r.checkinToken, 'abc_DEF-123');
  assert.equal(r.notFound, undefined);
  assert.equal(parseLocation('/doi-tac/nhan-phong', '').checkinToken, '');
  assert.equal(parseLocation('/doi-tac', '').checkinToken, undefined);
});
