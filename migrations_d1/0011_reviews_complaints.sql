-- Migration 0011 (N06.3): đánh giá xác thực gắn đơn đã hoàn tất, khiếu nại có người xử lý và lịch sử.
-- Mọi lệnh chạy lại được (IF NOT EXISTS).

-- Mỗi đơn một đánh giá. Admin ẩn (có lý do) thay vì xóa; ẩn thì thu hồi điểm bằng dòng bù trong points_ledger.
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id),
  listing_id TEXT NOT NULL REFERENCES listings(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('published', 'hidden')) DEFAULT 'published',
  hidden_reason TEXT,
  hidden_by TEXT,
  hidden_at TEXT,
  owner_reply TEXT,
  owner_reply_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id, status, created_at);

-- Ảnh thật của khách (đã kiểm định dạng ảnh), lưu kho riêng, chỉ phát qua API khi đánh giá đang hiện.
CREATE TABLE IF NOT EXISTS review_photos (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id),
  object_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos(review_id);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  listing_id TEXT NOT NULL REFERENCES listings(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('open', 'in_review', 'refund_pending', 'refund_reported', 'refund_disputed', 'closed')),
  outcome TEXT CHECK(outcome IS NULL OR outcome IN ('withdrawn', 'rejected', 'upheld', 'refunded')),
  owner_response TEXT,
  owner_response_at TEXT,
  assigned_to TEXT REFERENCES profiles(id),
  assigned_at TEXT,
  conclusion TEXT CHECK(conclusion IS NULL OR conclusion IN ('upheld', 'rejected')),
  conclusion_note TEXT,
  concluded_by TEXT,
  concluded_at TEXT,
  refund_amount INTEGER CHECK(refund_amount IS NULL OR refund_amount >= 0),
  refund_due_at TEXT,
  refund_reported_amount INTEGER,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Mỗi đơn chỉ một khiếu nại đang mở.
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_one_active ON complaints(booking_id) WHERE status <> 'closed';
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, created_at);

-- Lịch sử từng bước (chỉ ghi thêm).
CREATE TABLE IF NOT EXISTS complaint_events (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaints(id),
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_complaint_events ON complaint_events(complaint_id, created_at);

CREATE TABLE IF NOT EXISTS complaint_files (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaints(id),
  role TEXT NOT NULL CHECK(role IN ('guest', 'owner', 'admin')),
  object_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_complaint_files ON complaint_files(complaint_id, role);
