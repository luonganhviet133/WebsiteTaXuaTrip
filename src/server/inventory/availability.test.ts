import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRoomAvailability, isAllocationActive, closedRoomsForTarget } from './availability.ts';

const NOW = new Date('2026-11-13T00:00:00Z');
const nights = ['2026-11-20', '2026-11-21'];

test('Ca plan N05.1: 2 phòng, một đơn đêm đầu và một đơn đêm sau → cả khoảng vẫn còn 1 phòng', () => {
  const r = computeRoomAvailability({
    totalRooms: 2,
    nights,
    closures: {},
    allocations: [
      { date: '2026-11-20', quantity: 1 },
      { date: '2026-11-21', quantity: 1 },
    ],
  });
  assert.deepEqual(r.perNight.map((n) => n.available), [1, 1]);
  assert.equal(r.available, 1);
});

test('Ngày trả phòng không tính: đơn 19→20 không chiếm đêm 20', () => {
  // allocation chỉ có cho các đêm đã ở (19), nên khoảng 20–21 vẫn đủ 2 phòng
  const r = computeRoomAvailability({ totalRooms: 2, nights, closures: {}, allocations: [{ date: '2026-11-19', quantity: 2 }] });
  assert.equal(r.available, 2);
});

test('Số lượng phòng trong một đơn được tính đủ; khoảng lấy đêm ít phòng nhất', () => {
  const r = computeRoomAvailability({
    totalRooms: 3,
    nights,
    closures: { '2026-11-21': 1 },
    allocations: [{ date: '2026-11-20', quantity: 2 }],
  });
  assert.deepEqual(r.perNight.map((n) => [n.booked, n.closed, n.available]), [[2, 0, 1], [0, 1, 2]]);
  assert.equal(r.available, 1);
});

test('Hết phòng là 0, không bao giờ âm hay bị đếm thành 1', () => {
  const r = computeRoomAvailability({ totalRooms: 1, nights: ['2026-11-20'], closures: { '2026-11-20': 1 }, allocations: [{ date: '2026-11-20', quantity: 1 }] });
  assert.equal(r.available, 0);
  assert.equal(r.perNight[0].available, 0);
  const none = computeRoomAvailability({ totalRooms: 0, nights: ['2026-11-20'], closures: {}, allocations: [] });
  assert.equal(none.available, 0);
});

test('Trạng thái giữ tồn: held còn hạn, confirmed, checked_in; held hết hạn và released thì không', () => {
  assert.equal(isAllocationActive({ status: 'held', expires_at: '2026-11-13T00:10:00Z' }, NOW), true);
  assert.equal(isAllocationActive({ status: 'held', expires_at: '2026-11-12T23:59:00Z' }, NOW), false);
  assert.equal(isAllocationActive({ status: 'confirmed', expires_at: null }, NOW), true);
  assert.equal(isAllocationActive({ status: 'checked_in', expires_at: null }, NOW), true);
  assert.equal(isAllocationActive({ status: 'released', expires_at: null }, NOW), false);
});

test('Chủ đặt "còn N phòng" → số phòng khóa; không mở quá số đã có người đặt', () => {
  assert.deepEqual(closedRoomsForTarget({ totalRooms: 4, booked: 1, targetAvailable: 2 }), { ok: true, closed: 1 });
  assert.deepEqual(closedRoomsForTarget({ totalRooms: 4, booked: 1, targetAvailable: 3 }), { ok: true, closed: 0 });
  assert.deepEqual(closedRoomsForTarget({ totalRooms: 4, booked: 1, targetAvailable: 0 }), { ok: true, closed: 3 });
  const over = closedRoomsForTarget({ totalRooms: 4, booked: 2, targetAvailable: 3 });
  assert.equal(over.ok, false);
});
