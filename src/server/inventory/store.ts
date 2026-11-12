/**
 * N05.1 — Đọc/ghi tồn phòng theo đêm trên D1/SQLite.
 */
import type { D1Database } from '../d1.ts';
import type { RoomType } from '../../types/index.ts';
import { addDays, nightsBetween } from '../../search/searchIntent.ts';
import { ACTIVE_ALLOCATION_SQL, computeRoomAvailability, closedRoomsForTarget, type NightAvailability } from './availability.ts';

export interface RoomAvailability {
  roomTypeId: string;
  roomName: string;
  totalRooms: number;
  available: number;
  nights: NightAvailability[];
}

export const nightsOf = (checkIn: string, checkOut: string) =>
  Array.from({ length: Math.max(0, nightsBetween(checkIn, checkOut)) }, (_, i) => addDays(checkIn, i));

export class InventoryStore {
  constructor(private d1: D1Database) {}

  private async closures(listingId: string, from: string, to: string) {
    const res = await this.d1
      .prepare('SELECT room_type_id, date, closed_rooms FROM room_night_closures WHERE listing_id = ? AND date >= ? AND date < ?')
      .bind(listingId, from, to)
      .all<{ room_type_id: string; date: string; closed_rooms: number }>();
    return res.results || [];
  }

  private async allocations(listingId: string | null, from: string, to: string, now: Date) {
    const res = await this.d1
      .prepare(
        `SELECT listing_id, room_type_id, date, SUM(quantity) AS quantity FROM room_night_allocations
         WHERE ${listingId ? 'listing_id = ? AND ' : ''}date >= ? AND date < ? AND ${ACTIVE_ALLOCATION_SQL}
         GROUP BY listing_id, room_type_id, date`
      )
      .bind(...(listingId ? [listingId] : []), from, to, now.toISOString())
      .all<{ listing_id: string; room_type_id: string; date: string; quantity: number }>();
    return res.results || [];
  }

  /** Phòng trống theo từng hạng phòng cho khoảng [checkIn, checkOut). */
  async forListing(listingId: string, roomTypes: RoomType[], checkIn: string, checkOut: string, now = new Date()): Promise<RoomAvailability[]> {
    const nights = nightsOf(checkIn, checkOut);
    const [closures, allocs] = await Promise.all([this.closures(listingId, checkIn, checkOut), this.allocations(listingId, checkIn, checkOut, now)]);
    return roomTypes.map((room) => {
      const r = computeRoomAvailability({
        totalRooms: room.totalRooms,
        nights,
        closures: Object.fromEntries(closures.filter((c) => c.room_type_id === room.id).map((c) => [c.date, c.closed_rooms])),
        allocations: allocs.filter((a) => a.room_type_id === room.id).map((a) => ({ date: a.date, quantity: Number(a.quantity) })),
      });
      return { roomTypeId: room.id, roomName: room.name, totalRooms: room.totalRooms, available: r.available, nights: r.perNight };
    });
  }

  /** Tồn của mọi cơ sở đã duyệt có hạng phòng: { listingId: { roomTypeId: phòng trống cả khoảng } }. */
  async forAllListings(checkIn: string, checkOut: string, now = new Date()): Promise<Record<string, Record<string, number>>> {
    const nights = nightsOf(checkIn, checkOut);
    const listingsRes = await this.d1
      .prepare(
        `SELECT l.id, json_extract(v.content_json, '$.roomTypes') AS rooms FROM listings l
         JOIN listing_versions v ON v.id = l.published_version_id
         WHERE l.status = 'approved' AND json_array_length(json_extract(v.content_json, '$.roomTypes')) > 0`
      )
      .all<{ id: string; rooms: string }>();
    const closuresRes = await this.d1
      .prepare('SELECT listing_id, room_type_id, date, closed_rooms FROM room_night_closures WHERE date >= ? AND date < ?')
      .bind(checkIn, checkOut)
      .all<{ listing_id: string; room_type_id: string; date: string; closed_rooms: number }>();
    const allocs = await this.allocations(null, checkIn, checkOut, now);
    const out: Record<string, Record<string, number>> = {};
    for (const l of listingsRes.results || []) {
      const rooms = JSON.parse(l.rooms) as RoomType[];
      out[l.id] = {};
      for (const room of rooms) {
        out[l.id][room.id] = computeRoomAvailability({
          totalRooms: room.totalRooms,
          nights,
          closures: Object.fromEntries((closuresRes.results || []).filter((c) => c.listing_id === l.id && c.room_type_id === room.id).map((c) => [c.date, c.closed_rooms])),
          allocations: allocs.filter((a) => a.listing_id === l.id && a.room_type_id === room.id).map((a) => ({ date: a.date, quantity: Number(a.quantity) })),
        }).available;
      }
    }
    return out;
  }

  /**
   * Chủ cơ sở đặt "còn N phòng" cho các đêm. Trả lỗi theo đêm nếu N vượt số phòng chưa có người giữ/đặt.
   * Ghi tất cả trong một batch (hoặc không ghi gì).
   */
  async setAvailable(
    listingId: string,
    room: RoomType,
    dates: string[],
    targetAvailable: number,
    actorId: string,
    now = new Date()
  ): Promise<{ ok: true } | { ok: false; conflicts: Array<{ date: string; maxAvailable: number }> }> {
    const sorted = [...new Set(dates)].sort();
    const allocs = await this.allocations(listingId, sorted[0], addDays(sorted[sorted.length - 1], 1), now);
    const conflicts: Array<{ date: string; maxAvailable: number }> = [];
    const writes = [];
    for (const date of sorted) {
      const booked = allocs.filter((a) => a.room_type_id === room.id && a.date === date).reduce((s, a) => s + Number(a.quantity), 0);
      const r = closedRoomsForTarget({ totalRooms: room.totalRooms, booked, targetAvailable });
      if (!r.ok) {
        conflicts.push({ date, maxAvailable: r.maxAvailable });
        continue;
      }
      writes.push(
        this.d1
          .prepare(
            `INSERT INTO room_night_closures (listing_id, room_type_id, date, closed_rooms, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(listing_id, room_type_id, date) DO UPDATE SET closed_rooms = excluded.closed_rooms, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
          )
          .bind(listingId, room.id, date, r.closed, actorId, now.toISOString())
      );
    }
    if (conflicts.length) return { ok: false, conflicts };
    writes.push(
      this.d1
        .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)')
        .bind(`au_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, actorId, 'inventory.set_available', 'listing', listingId, JSON.stringify({ roomTypeId: room.id, dates: sorted, availableRooms: targetAvailable }), now.toISOString())
    );
    await this.d1.batch(writes);
    return { ok: true };
  }
}
