-- Migration 0007 (N05.3): vòng đời đơn — lịch sử trạng thái, mã QR nhận phòng, thông báo cho chủ cơ sở.

-- Mã nhận phòng: 256 bit ngẫu nhiên, tạo khi đơn được xác nhận; chỉ khách chủ đơn xem được.
ALTER TABLE bookings ADD COLUMN checkin_token TEXT;
ALTER TABLE bookings ADD COLUMN confirmed_at TEXT;
ALTER TABLE bookings ADD COLUMN checked_in_at TEXT;
ALTER TABLE bookings ADD COLUMN completed_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_checkin_token ON bookings(checkin_token) WHERE checkin_token IS NOT NULL;

-- Mỗi lần đổi trạng thái một dòng: ai, vai trò, từ đâu sang đâu, lý do, lúc nào.
CREATE TABLE IF NOT EXISTS booking_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON booking_events(booking_id, created_at);

-- Chuông thông báo trong dashboard (Q3). Web Push/email gửi từ cùng bảng này ở đợt sau.
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
