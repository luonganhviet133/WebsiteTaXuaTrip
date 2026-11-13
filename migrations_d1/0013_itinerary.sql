-- R5 — Lập lịch trình Tà Xùa từ dữ liệu thật.
-- places: điểm tham quan công cộng (không phải cơ sở kinh doanh), có nguồn công khai, admin duyệt mới dùng.
-- reference_facts: dữ liệu tham khảo bổ sung cho cơ sở (giá từ, tuyến/giờ xe), có nguồn, admin duyệt mới dùng.
-- ai_usage: đếm lượt gọi AI theo ngày để giữ hạn mức (không lưu nội dung người dùng).

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('viewpoint', 'trek', 'village', 'nature')),
  area TEXT NOT NULL,
  summary TEXT NOT NULL,
  -- JSON: ["sunrise","morning","afternoon","sunset"]
  best_times TEXT NOT NULL DEFAULT '[]',
  -- JSON: ["san-may","chill","kham-pha","chup-anh"]
  styles TEXT NOT NULL DEFAULT '[]',
  visit_minutes INTEGER NOT NULL CHECK(visit_minutes BETWEEN 15 AND 600),
  -- Thời gian đi từ trung tâm xã Tà Xùa (phút, xe máy). NULL = chưa có nguồn → không tự xếp giờ.
  travel_minutes INTEGER CHECK(travel_minutes IS NULL OR travel_minutes BETWEEN 0 AND 240),
  distance_km REAL,
  entry_fee_vnd INTEGER CHECK(entry_fee_vnd IS NULL OR entry_fee_vnd >= 0),
  parking_fee_vnd INTEGER CHECK(parking_fee_vnd IS NULL OR parking_fee_vnd >= 0),
  difficulty TEXT CHECK(difficulty IS NULL OR difficulty IN ('de', 'trung-binh', 'kho')),
  -- Tháng đẹp nhất (JSON mảng số tháng), rỗng = quanh năm/không rõ
  best_months TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  cover_image TEXT,
  -- JSON: [{"name":"...","url":"...","accessed":"YYYY-MM-DD"}]
  sources_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);

CREATE TABLE IF NOT EXISTS reference_facts (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('price_from', 'bus_route')),
  value_json TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected', 'superseded')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reference_facts_status ON reference_facts(status, kind);
-- Mỗi cơ sở chỉ có một dữ kiện đã duyệt cho mỗi loại; duyệt bản mới thì bản cũ chuyển 'superseded' trong cùng batch.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reference_facts_approved ON reference_facts(listing_id, kind) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS ai_usage (
  day TEXT NOT NULL,
  purpose TEXT NOT NULL,
  provider TEXT NOT NULL,
  calls INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, purpose, provider)
);
