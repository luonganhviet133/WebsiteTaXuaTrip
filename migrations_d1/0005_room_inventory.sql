-- Migration 0005 (N05.1): tồn phòng theo đêm, theo hạng phòng.
-- phòng trống(đêm) = tổng phòng (hạng phòng trong hồ sơ đã duyệt) − phòng chủ khóa − phòng đang giữ/đã đặt.
-- Mọi lệnh chạy lại được (IF NOT EXISTS).

-- Số phòng chủ cơ sở khóa (không bán) cho từng đêm.
CREATE TABLE IF NOT EXISTS room_night_closures (
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL,
  date TEXT NOT NULL,
  closed_rooms INTEGER NOT NULL CHECK(closed_rooms >= 0),
  updated_by TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (listing_id, room_type_id, date)
);

-- Phòng bị chiếm theo từng đêm (giữ chỗ chờ cọc hoặc đơn). Mỗi đơn/giữ chỗ có một dòng cho mỗi đêm.
-- Giữ tồn: held còn hạn (expires_at > now), confirmed, checked_in. Không giữ: held hết hạn, released.
CREATE TABLE IF NOT EXISTS room_night_allocations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL,
  date TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  status TEXT NOT NULL CHECK(status IN ('held', 'confirmed', 'checked_in', 'released')),
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_id, room_type_id, date)
);

CREATE INDEX IF NOT EXISTS idx_room_alloc_lookup ON room_night_allocations(listing_id, room_type_id, date, status);
CREATE INDEX IF NOT EXISTS idx_room_alloc_source ON room_night_allocations(source_id);
