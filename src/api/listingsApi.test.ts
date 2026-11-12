import { test } from 'node:test';
import assert from 'node:assert/strict';
import { managedToListing, toContent, claimToRequest, type ManagedListing } from './listingsApi.ts';
import { onlyMappable, verificationLabel, formatMinPrice, applyAvailability } from '../utils/listingDisplay.ts';
import type { Listing } from '../types/index.ts';

const published = {
  id: 'tx-stay-5', title: 'Bản công khai', category: 'homestay', area: 'Khe Cải', address: '', phone: '', zalo: '',
  description: '', coverImage: '', images: [], tags: [], minPrice: 0, coordinates: null, hasCloudView: false,
  isInstantBooking: false, rating: 0, reviewCount: 0, verificationTier: 1, status: 'approved', partnerId: '',
  updatedCalendarDate: '2026-11-04', stats: { views: 0, callClicks: 0, bookingsCount: 0 },
} as unknown as Listing;

const managed = (over: Partial<ManagedListing> = {}): ManagedListing => ({
  id: 'tx-stay-5', status: 'approved', dataOrigin: 'scraped', published, openVersion: null, latestReview: null,
  verification: { tier: 1, recordedTier: 1, source: null, verifiedAt: null, expiresAt: null, expired: false },
  ownerProviderId: 'prov_1', ...over,
});

test('managedToListing: người sửa thấy bản đang chờ duyệt, trạng thái pending', () => {
  const l = managedToListing(managed({ openVersion: { id: 'v2', status: 'pending', content: { title: 'Bản mới' }, submittedAt: 'x' } }))!;
  assert.equal(l.title, 'Bản mới');
  assert.equal(l.status, 'pending');
  assert.equal(l.partnerId, 'prov_1');
  assert.equal(managedToListing(managed())!.title, 'Bản công khai');
  assert.equal(managedToListing(managed({ published: null })), null);
});

test('toContent không gửi điểm sao, huy hiệu, trạng thái lên server', () => {
  const c = toContent({ ...published, rating: 5, verificationTier: 3 } as Listing) as Record<string, unknown>;
  for (const k of ['rating', 'reviewCount', 'verificationTier', 'status', 'stats', 'partnerId']) assert.equal(k in c, false, k);
});

test('onlyMappable bỏ cơ sở chưa có tọa độ; giá 0 hiện "Liên hệ"', () => {
  const withGps = { ...published, id: 'a', coordinates: { lat: 21.3, lng: 104.4 } } as Listing;
  assert.deepEqual(onlyMappable([published, withGps]).map((l) => l.id), ['a']);
  assert.equal(formatMinPrice(0, String), 'Liên hệ');
  assert.equal(formatMinPrice(500000, (n) => `${n}đ`), '500000đ');
});

test('verificationLabel ghi nguồn và ngày', () => {
  assert.deepEqual(verificationLabel({ verificationTier: 1, dataOrigin: 'scraped', collectedAt: '2026-11-04' }), {
    title: 'Chưa xác minh', detail: 'Thu thập từ nguồn công khai ngày 04/11/2026',
  });
  const v = verificationLabel({
    verificationTier: 3, dataOrigin: 'scraped', collectedAt: null,
    verification: { tier: 3, recordedTier: 3, source: 'Thẩm định thực địa', verifiedAt: '2026-11-12T01:00:00Z', expiresAt: 'x', expired: false },
  });
  assert.equal(v.title, 'Đã thẩm định thực địa');
  assert.equal(v.detail, 'Thẩm định thực địa · 12/11/2026');
});

test('claimToRequest đổi trạng thái approved → verified cho màn admin cũ', () => {
  assert.equal(claimToRequest({ id: 'c', listingId: 'x', status: 'approved', createdAt: '2026-11-12T10:00:00Z' }).status, 'verified');
});

test('applyAvailability: ghi phòng trống từ server theo ngày đã chọn; cơ sở không có trong bảng tồn giữ nguyên', () => {
  const withRooms = {
    ...published,
    id: 'a',
    roomTypes: [
      { id: 'r1', name: 'A', capacity: 2, priceWeekday: 1, priceWeekend: 1, totalRooms: 3, availableRooms: 3 },
      { id: 'r2', name: 'B', capacity: 4, priceWeekday: 1, priceWeekend: 1, totalRooms: 1, availableRooms: 1 },
    ],
  } as unknown as Listing;
  const out = applyAvailability([withRooms, published], { a: { r1: 0, r2: 1 } });
  assert.deepEqual(out[0].roomTypes!.map((r) => r.availableRooms), [0, 1], 'hết phòng là 0, không thành 1');
  assert.equal(out[1], published, 'không có hạng phòng → giữ nguyên đối tượng');
  assert.equal(applyAvailability([withRooms], null)[0], withRooms, 'chưa tải tồn → giữ nguyên');
  const missingRoom = applyAvailability([withRooms], { a: { r1: 2 } });
  assert.equal(missingRoom[0].roomTypes![1].availableRooms, 0, 'hạng phòng không có trong bảng tồn (chưa duyệt) → 0');
});
