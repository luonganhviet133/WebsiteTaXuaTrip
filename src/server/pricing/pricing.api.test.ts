import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { VoucherStore } from './store.ts';
import { addDays, todayInVietnam } from '../../search/searchIntent.ts';

// Ngày thứ Hai sắp tới (giá ngày thường), không phụ thuộc hôm chạy test
const today = todayInVietnam();
const monday = (() => {
  let d = addDays(today, 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
})();

const roomContent = {
  title: 'Nhà Có Phòng', category: 'homestay', area: 'Đỉnh Gió', minPrice: 500000, coordinates: null,
  roomTypes: [{ id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 3, availableRooms: 3, amenities: [], viewType: 'Sân vườn' }],
};

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: '10.0.0.1', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const admin = await tokenOf('admin@taxuatrip.vn');
  const partner = await tokenOf('partner.a@taxuatrip.vn');
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  // Admin nhập hạng phòng cho một cơ sở đã nhập
  const put = await call('PUT', '/api/admin/listings/tx-stay-7', admin, { content: roomContent });
  assert.equal(put.status, 200);
  return { db, call, admin, partner };
}

const quoteBody = (over: Record<string, unknown> = {}) => ({
  listingId: 'tx-stay-7', roomTypeId: 'r1', checkIn: monday, checkOut: addDays(monday, 1), adults: 2, children: 0, rooms: 1, ...over,
});

test('N04 báo giá và voucher qua API', async (t) => {
  const { db, call, admin, partner } = await setup();

  await t.test('Báo giá do server tính, bỏ qua giá/tổng client tự gửi; lưu snapshot', async () => {
    const res = await call('POST', '/api/quotes', undefined, quoteBody({ total: 1, subtotal: 1, discount: 999999, priceWeekday: 1 }));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.subtotal, 500000);
    assert.equal(res.body.data.total, 500000);
    assert.equal(res.body.data.discount, 0);
    assert.match(res.body.data.id, /^q_/);
    const row = await db.d1.prepare('SELECT listing_id, total, listing_version_id, expires_at FROM quotes WHERE id = ?').bind(res.body.data.id).first<any>();
    assert.equal(row.listing_id, 'tx-stay-7');
    assert.equal(row.total, 500000);
    assert.ok(row.listing_version_id, 'ghi phiên bản hồ sơ đã dùng để tính giá');
    const got = await call('GET', `/api/quotes/${res.body.data.id}`);
    assert.equal(got.body.data.total, 500000);
  });

  await t.test('Cơ sở chưa có hạng phòng → 409; chưa duyệt/không có → 404; đầu vào sai → 400', async () => {
    assert.equal((await call('POST', '/api/quotes', undefined, quoteBody({ listingId: 'tx-stay-5' }))).body.code, 'NOT_QUOTABLE');
    assert.equal((await call('POST', '/api/quotes', undefined, quoteBody({ listingId: 'tx-stay-5' }))).status, 409);
    assert.equal((await call('POST', '/api/quotes', undefined, quoteBody({ listingId: 'khong-co' }))).status, 404);
    const bad = await call('POST', '/api/quotes', undefined, quoteBody({ adults: 'hai' }));
    assert.equal(bad.status, 400);
    assert.equal(bad.body.code, 'INVALID_GUESTS');
  });

  await t.test('Ngày lễ: chỉ admin nhập; báo giá dùng giá cuối tuần cho ngày lễ', async () => {
    assert.equal((await call('PUT', '/api/admin/pricing/holidays', partner, { dates: [monday] })).status, 403);
    assert.equal((await call('PUT', '/api/admin/pricing/holidays', admin, { dates: ['31/12/2026'] })).status, 400);
    assert.equal((await call('PUT', '/api/admin/pricing/holidays', admin, { dates: [monday] })).status, 200);
    assert.deepEqual((await call('GET', '/api/pricing/holidays')).body.data, [monday]);
    const q = await call('POST', '/api/quotes', undefined, quoteBody());
    assert.equal(q.body.data.nights[0].kind, 'holiday');
    assert.equal(q.body.data.total, 800000);
    await call('PUT', '/api/admin/pricing/holidays', admin, { dates: [] });
  });

  await t.test('Voucher: chỉ admin tạo; áp qua báo giá; mã lạ/sai cơ sở trả lý do, không giảm', async () => {
    const v = { code: 'may10', title: 'Giảm 10%', discountType: 'percent', discountValue: 10, minBookingAmount: 0, applicableCategory: 'homestay', validUntil: addDays(today, 30), isActive: true };
    assert.equal((await call('POST', '/api/admin/vouchers', partner, v)).status, 403);
    const created = await call('POST', '/api/admin/vouchers', admin, v);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.code, 'MAY10');
    assert.equal((await call('POST', '/api/admin/vouchers', admin, { ...v, discountValue: 150 })).status, 400, 'phần trăm > 100 bị chặn');

    const q = await call('POST', '/api/quotes', undefined, quoteBody({ voucherCode: ' May10 ' }));
    assert.equal(q.body.data.discount, 50000);
    assert.equal(q.body.data.total, 450000);

    const unknown = await call('POST', '/api/quotes', undefined, quoteBody({ voucherCode: 'KHONGCO' }));
    assert.equal(unknown.body.data.discount, 0);
    assert.equal(unknown.body.data.voucherError.code, 'VOUCHER_NOT_FOUND');

    await call('POST', '/api/admin/vouchers', admin, { ...v, code: 'CHONHAKHAC', applicableListingId: 'tx-stay-8' });
    const wrong = await call('POST', '/api/quotes', undefined, quoteBody({ voucherCode: 'CHONHAKHAC' }));
    assert.equal(wrong.body.data.voucherError.code, 'VOUCHER_WRONG_LISTING');
    assert.equal(wrong.body.data.total, 500000);

    const list = await call('GET', '/api/admin/vouchers', admin);
    assert.ok(list.body.data.some((x: any) => x.code === 'MAY10'));
  });

  await t.test('Voucher có giới hạn lượt: hai yêu cầu cùng lúc chỉ một yêu cầu dùng được lượt cuối', async () => {
    await call('POST', '/api/admin/vouchers', admin, {
      code: 'MOTLUOT', title: '1 lượt', discountType: 'fixed', discountValue: 50000, minBookingAmount: 0, applicableCategory: 'all', isActive: true, usageLimit: 1,
    });
    const store = new VoucherStore(db.d1);
    const results = await Promise.all([store.redeem('MOTLUOT'), store.redeem('MOTLUOT')]);
    assert.deepEqual(results.sort(), [false, true]);
    const v = await store.get('MOTLUOT');
    assert.equal(v!.usedCount, 1);
    const q = await call('POST', '/api/quotes', undefined, quoteBody({ voucherCode: 'MOTLUOT' }));
    assert.equal(q.body.data.voucherError.code, 'VOUCHER_USED_UP');
  });
});
