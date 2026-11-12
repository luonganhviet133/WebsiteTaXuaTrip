/**
 * N05.1 — Tính phòng trống theo từng đêm, từng hạng phòng.
 *   phòng trống(đêm) = tổng phòng − phòng chủ khóa(đêm) − phòng đang giữ/đã đặt(đêm)
 *   phòng trống(khoảng) = đêm ít phòng nhất. Đêm của ngày trả phòng không tính.
 * Giữ tồn: held còn hạn, confirmed, checked_in. Không giữ: held hết hạn, released.
 * Held hết hạn tự hết tác dụng theo thời gian, không phụ thuộc tác vụ dọn dẹp hay tab trình duyệt.
 * File thuần để test; truy vấn DB ở store.ts.
 */
export type AllocationStatus = 'held' | 'confirmed' | 'checked_in' | 'released';
export const ACTIVE_ALLOCATION_SQL = `(status IN ('confirmed','checked_in') OR (status = 'held' AND expires_at > ?))`;

export interface NightAvailability {
  date: string;
  total: number;
  closed: number;
  booked: number;
  available: number;
}

export function isAllocationActive(a: { status: string; expires_at: string | null }, now: Date): boolean {
  if (a.status === 'confirmed' || a.status === 'checked_in') return true;
  return a.status === 'held' && Boolean(a.expires_at) && Date.parse(a.expires_at!) > now.getTime();
}

export function computeRoomAvailability(input: {
  totalRooms: number;
  nights: string[];
  closures: Record<string, number>;
  /** Chỉ các phân bổ đang giữ tồn. */
  allocations: Array<{ date: string; quantity: number }>;
}): { perNight: NightAvailability[]; available: number } {
  const total = Math.max(0, Math.floor(input.totalRooms || 0));
  const bookedByNight = new Map<string, number>();
  for (const a of input.allocations) bookedByNight.set(a.date, (bookedByNight.get(a.date) || 0) + Math.max(0, a.quantity));
  const perNight = input.nights.map((date) => {
    const closed = Math.max(0, input.closures[date] || 0);
    const booked = bookedByNight.get(date) || 0;
    return { date, total, closed, booked, available: Math.max(0, total - closed - booked) };
  });
  return { perNight, available: perNight.length ? Math.min(...perNight.map((n) => n.available)) : 0 };
}

/** Chủ cơ sở muốn "còn N phòng" một đêm → số phòng cần khóa. Không mở quá số phòng đã có người giữ/đặt. */
export function closedRoomsForTarget(x: { totalRooms: number; booked: number; targetAvailable: number }): { ok: true; closed: number } | { ok: false; maxAvailable: number } {
  const maxAvailable = Math.max(0, x.totalRooms - x.booked);
  if (x.targetAvailable > maxAvailable) return { ok: false, maxAvailable };
  return { ok: true, closed: maxAvailable - x.targetAvailable };
}
