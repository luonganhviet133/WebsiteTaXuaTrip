import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStayQuote, nightKind, applyVoucher, type VoucherRecord } from './quote.ts';
import type { ListingContent } from '../listings/content.ts';

const NOW = new Date('2026-11-12T18:30:00Z'); // 13/11/2026 01:30 giờ VN (thứ Sáu)

const listing: ListingContent = {
  title: 'Nhà Thử', category: 'homestay', area: 'Đỉnh Gió', address: '', phone: '', zalo: '', description: '',
  coverImage: '', images: [], tags: [], minPrice: 0, coordinates: null, hasCloudView: false, isInstantBooking: false,
  roomTypes: [
    { id: 'r1', name: 'Phòng đôi', capacity: 2, priceWeekday: 500000, priceWeekend: 800000, totalRooms: 3, availableRooms: 3, amenities: [], image: '' } as any,
    { id: 'r2', name: 'Phòng 4', capacity: 4, priceWeekday: 900000, priceWeekend: 1200000, totalRooms: 1, availableRooms: 1, amenities: [], image: '' } as any,
  ],
};

const req = (over: Record<string, unknown> = {}) => ({
  roomTypeId: 'r1', checkIn: '2026-11-16', checkOut: '2026-11-17', adults: 2, children: 0, rooms: 1, ...over,
});

test('Loại đêm: thứ Sáu, thứ Bảy và ngày lễ là cuối tuần', () => {
  assert.equal(nightKind('2026-11-20', []), 'weekend'); // T6
  assert.equal(nightKind('2026-11-21', []), 'weekend'); // T7
  assert.equal(nightKind('2026-11-22', []), 'weekday'); // CN
  assert.equal(nightKind('2026-11-16', []), 'weekday'); // T2
  assert.equal(nightKind('2026-12-31', ['2026-12-31']), 'holiday');
});

test('Giá ngày thường: 1 đêm thứ Hai', () => {
  const q = buildStayQuote(listing, req(), { holidays: [], now: NOW });
  assert.ok(q.ok);
  if (!q.ok) return;
  assert.equal(q.quote.subtotal, 500000);
  assert.equal(q.quote.total, 500000);
  assert.deepEqual(q.quote.nights.map((n) => [n.date, n.kind, n.pricePerRoom]), [['2026-11-16', 'weekday', 500000]]);
  assert.equal(q.quote.currency, 'VND');
});

test('Giá cuối tuần và khoảng hỗn hợp T5→CN (T5 thường, T6 + T7 cuối tuần)', () => {
  const q = buildStayQuote(listing, req({ checkIn: '2026-11-19', checkOut: '2026-11-22' }), { holidays: [], now: NOW });
  assert.ok(q.ok);
  if (!q.ok) return;
  assert.deepEqual(q.quote.nights.map((n) => n.kind), ['weekday', 'weekend', 'weekend']);
  assert.equal(q.quote.subtotal, 500000 + 800000 + 800000);
});

test('Ngày lễ do admin nhập tính giá cuối tuần', () => {
  const q = buildStayQuote(listing, req({ checkIn: '2026-12-31', checkOut: '2027-01-01' }), { holidays: ['2026-12-31'], now: NOW });
  assert.ok(q.ok && q.quote.subtotal === 800000 && q.quote.nights[0].kind === 'holiday');
});

test('Số phòng nhân đúng tổng; số khách vượt sức chứa bị chặn', () => {
  const two = buildStayQuote(listing, req({ rooms: 2, adults: 4 }), { holidays: [], now: NOW });
  assert.ok(two.ok && two.quote.subtotal === 1000000 && two.quote.rooms === 2);
  const over = buildStayQuote(listing, req({ rooms: 1, adults: 2, children: 1 }), { holidays: [], now: NOW });
  assert.equal(over.ok, false);
  if (!over.ok) assert.equal(over.code, 'OVER_CAPACITY');
  const tooMany = buildStayQuote(listing, req({ roomTypeId: 'r2', rooms: 2, adults: 4 }), { holidays: [], now: NOW });
  assert.equal(tooMany.ok, false);
  if (!tooMany.ok) assert.equal(tooMany.code, 'NOT_ENOUGH_ROOMS');
});

test('Đầu vào sai bị chặn: NaN, âm, ngày sai, quá khứ, trả trước nhận, hạng phòng lạ', () => {
  const bad: Array<[Record<string, unknown>, string]> = [
    [{ adults: Number('x') }, 'INVALID_GUESTS'],
    [{ adults: -1 }, 'INVALID_GUESTS'],
    [{ rooms: 0 }, 'INVALID_ROOMS'],
    [{ rooms: 1.5 }, 'INVALID_ROOMS'],
    [{ checkIn: '2026-02-30' }, 'INVALID_DATES'],
    [{ checkIn: '2026-11-10', checkOut: '2026-11-11' }, 'DATE_IN_PAST'],
    [{ checkIn: '2026-11-17', checkOut: '2026-11-16' }, 'INVALID_DATES'],
    [{ checkIn: '2026-11-16', checkOut: '2027-01-30' }, 'TOO_MANY_NIGHTS'],
    [{ roomTypeId: 'khong-co' }, 'ROOM_NOT_FOUND'],
  ];
  for (const [over, code] of bad) {
    const q = buildStayQuote(listing, req(over), { holidays: [], now: NOW });
    assert.equal(q.ok, false, JSON.stringify(over));
    if (!q.ok) assert.equal(q.code, code, JSON.stringify(over));
  }
});

test('Cơ sở chưa có hạng phòng/giá thì không báo giá được', () => {
  const q = buildStayQuote({ ...listing, roomTypes: undefined }, req(), { holidays: [], now: NOW });
  assert.equal(q.ok, false);
  if (!q.ok) assert.equal(q.code, 'NOT_QUOTABLE');
  const zero = buildStayQuote({ ...listing, roomTypes: [{ ...(listing.roomTypes![0] as any), priceWeekday: 0 }] }, req(), { holidays: [], now: NOW });
  assert.equal(zero.ok, false);
});

test('Báo giá có hạn 30 phút', () => {
  const q = buildStayQuote(listing, req(), { holidays: [], now: NOW });
  assert.ok(q.ok && q.quote.expiresAt === new Date(NOW.getTime() + 30 * 60_000).toISOString());
});

const voucher = (over: Partial<VoucherRecord> = {}): VoucherRecord => ({
  code: 'MAY10', title: 'Giảm 10%', discountType: 'percent', discountValue: 10, maxDiscount: null,
  minBookingAmount: 0, applicableCategory: 'all', applicableListingId: null, validFrom: null,
  validUntil: '2026-12-31', isActive: true, usageLimit: null, usedCount: 0, ...over,
});

test('Voucher: phần trăm làm tròn xuống đồng, có trần; cố định không vượt tổng', () => {
  const ctx = { listingId: 'x', category: 'homestay', subtotal: 999999, today: '2026-11-13' };
  assert.deepEqual(applyVoucher(voucher(), ctx), { ok: true, discount: 99999 });
  assert.deepEqual(applyVoucher(voucher({ maxDiscount: 50000 }), ctx), { ok: true, discount: 50000 });
  assert.deepEqual(applyVoucher(voucher({ discountType: 'fixed', discountValue: 2_000_000 }), ctx), { ok: true, discount: 999999 });
});

test('Voucher sai điều kiện bị chặn với lý do', () => {
  const ctx = { listingId: 'x', category: 'homestay', subtotal: 500000, today: '2026-11-13' };
  const cases: Array<[Partial<VoucherRecord>, string]> = [
    [{ isActive: false }, 'VOUCHER_INACTIVE'],
    [{ validUntil: '2026-11-12' }, 'VOUCHER_EXPIRED'],
    [{ validFrom: '2026-11-20' }, 'VOUCHER_NOT_STARTED'],
    [{ minBookingAmount: 600000 }, 'VOUCHER_MIN_AMOUNT'],
    [{ applicableCategory: 'tour' }, 'VOUCHER_WRONG_CATEGORY'],
    [{ applicableListingId: 'khac' }, 'VOUCHER_WRONG_LISTING'],
    [{ usageLimit: 5, usedCount: 5 }, 'VOUCHER_USED_UP'],
  ];
  for (const [over, code] of cases) {
    const r = applyVoucher(voucher(over), ctx);
    assert.equal(r.ok, false, code);
    if (!r.ok) assert.equal(r.code, code);
  }
});

test('Báo giá áp voucher: tổng = tạm tính − giảm', () => {
  const q = buildStayQuote(listing, req({ checkIn: '2026-11-20', checkOut: '2026-11-22' }), { holidays: [], now: NOW, voucher: voucher() });
  assert.ok(q.ok);
  if (!q.ok) return;
  assert.equal(q.quote.subtotal, 1600000);
  assert.equal(q.quote.discount, 160000);
  assert.equal(q.quote.total, 1440000);
  assert.equal(q.quote.voucherCode, 'MAY10');
  const bad = buildStayQuote(listing, req(), { holidays: [], now: NOW, voucher: voucher({ isActive: false }) });
  assert.ok(bad.ok, 'voucher sai không chặn cả báo giá');
  if (bad.ok) {
    assert.equal(bad.quote.discount, 0);
    assert.equal(bad.quote.voucherError?.code, 'VOUCHER_INACTIVE');
  }
});
