/**
 * N05.1 — Route tồn phòng.
 *   GET /api/listings/:id/availability?checkIn&checkOut   công khai
 *   GET /api/availability?checkIn&checkOut                 công khai (cho danh sách tìm kiếm)
 *   PUT /api/partner/listings/:id/inventory                chủ sở hữu hoặc admin
 *       { roomTypeId, dates: [YYYY-MM-DD…] (≤ 90), availableRooms: số nguyên ≥ 0 }
 */
import { ListingStore } from '../listings/store.ts';
import { InventoryStore } from './store.ts';
import { isValidIsoDate, nightsBetween, todayInVietnam, MAX_NIGHTS } from '../../search/searchIntent.ts';
import type { PricingRouteDeps } from '../pricing/routes.ts';

const MAX_DATES = 90;

function parseRange(url: URL): { checkIn: string; checkOut: string } | string {
  const checkIn = url.searchParams.get('checkIn') || '';
  const checkOut = url.searchParams.get('checkOut') || '';
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) return 'checkIn/checkOut phải là ngày YYYY-MM-DD.';
  const n = nightsBetween(checkIn, checkOut);
  if (n < 1 || n > MAX_NIGHTS) return `Khoảng ngày phải từ 1 đến ${MAX_NIGHTS} đêm.`;
  return { checkIn, checkOut };
}

export async function handleInventoryRoutes(request: Request, pathname: string, deps: PricingRouteDeps): Promise<Response | undefined> {
  const { json, readJson, requireRole, d1 } = deps;
  const url = new URL(request.url);
  const seg = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const inventory = new InventoryStore(d1);
  const listings = new ListingStore(d1);

  if (request.method === 'GET' && pathname === '/api/availability') {
    const range = parseRange(url);
    if (typeof range === 'string') return json({ success: false, error: range }, 400);
    return json({ success: true, data: await inventory.forAllListings(range.checkIn, range.checkOut) }, 200, { 'Cache-Control': 'no-store' });
  }

  if (request.method === 'GET' && seg.length === 4 && seg[1] === 'listings' && seg[3] === 'availability') {
    const range = parseRange(url);
    if (typeof range === 'string') return json({ success: false, error: range }, 400);
    const published = await listings.getPublishedForQuote(seg[2]);
    if (!published) return json({ success: false, error: 'Không tìm thấy cơ sở hoặc cơ sở chưa được duyệt.' }, 404);
    const rooms = await inventory.forListing(seg[2], published.content.roomTypes || [], range.checkIn, range.checkOut);
    return json({ success: true, data: { listingId: seg[2], ...range, rooms } }, 200, { 'Cache-Control': 'no-store' });
  }

  if (request.method === 'PUT' && seg.length === 5 && seg[1] === 'partner' && seg[2] === 'listings' && seg[4] === 'inventory') {
    const user = await requireRole(['partner', 'admin']);
    if (user instanceof Response) return user;
    const listingId = seg[3];
    if (user.role !== 'admin' && !(await listings.isOwnedBy(listingId, user.providerId))) {
      return json({ success: false, error: 'FORBIDDEN: Bạn không có quyền cập nhật phòng trống của cơ sở này.' }, 403);
    }
    const published = await listings.getPublishedForQuote(listingId);
    if (!published) return json({ success: false, error: 'Cơ sở chưa được duyệt nên chưa mở lịch phòng.' }, 404);
    const body = await readJson(request);
    const room = (published.content.roomTypes || []).find((r) => r.id === body?.roomTypeId);
    if (!room) return json({ success: false, error: 'Không tìm thấy hạng phòng (hạng phòng phải có trong hồ sơ đã duyệt).' }, 400);
    const dates = body?.dates;
    const today = todayInVietnam();
    if (!Array.isArray(dates) || dates.length === 0 || dates.length > MAX_DATES || !dates.every((d: unknown) => isValidIsoDate(d) && (d as string) >= today)) {
      return json({ success: false, error: `Danh sách đêm phải gồm 1–${MAX_DATES} ngày YYYY-MM-DD, không ở quá khứ.` }, 400);
    }
    const n = body?.availableRooms;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > room.totalRooms) {
      return json({ success: false, error: `Số phòng trống phải là số nguyên từ 0 đến ${room.totalRooms}.` }, 400);
    }
    const result = await inventory.setAvailable(listingId, room, dates, n, user.id);
    if (!result.ok) {
      const c = result.conflicts[0];
      return json(
        { success: false, code: 'BOOKED_ROOMS_CONFLICT', conflicts: result.conflicts, error: `Đêm ${c.date} đã có khách giữ/đặt, chỉ còn tối đa ${c.maxAvailable} phòng để mở.` },
        409
      );
    }
    const first = [...dates].sort()[0];
    const last = [...dates].sort().slice(-1)[0];
    const rooms = await inventory.forListing(listingId, [room], first, new Date(Date.parse(`${last}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10));
    return json({ success: true, data: rooms[0] });
  }
  return undefined;
}
