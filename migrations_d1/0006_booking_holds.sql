-- Migration 0006 (N05.2): giữ chỗ có hạn, chống đặt trùng, chống tạo đơn lặp.
-- SQLite không sửa được CHECK của cột nên dựng lại bảng bookings (giữ nguyên dữ liệu cũ).

CREATE TABLE bookings_v2 (
  id TEXT PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  listing_title TEXT NOT NULL,
  provider_id TEXT REFERENCES providers(id),
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0 CHECK(total_amount >= 0),
  deposit_amount INTEGER NOT NULL DEFAULT 0 CHECK(deposit_amount >= 0),
  -- pending_deposit: đang giữ chỗ chờ cọc (hết hạn tại hold_expires_at); expired: giữ chỗ đã hết hạn.
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'pending_deposit', 'confirmed', 'checked_in', 'completed', 'cancelled', 'expired')) DEFAULT 'pending',
  room_type_id TEXT,
  room_name TEXT,
  rooms INTEGER,
  adults INTEGER,
  children INTEGER,
  subtotal INTEGER,
  discount INTEGER,
  voucher_code TEXT,
  quote_id TEXT,
  listing_version_id TEXT,
  hold_expires_at TEXT,
  -- Chống tạo đơn lặp khi gửi lại: cùng người dùng + cùng khóa → cùng một đơn.
  idempotency_key TEXT,
  request_hash TEXT,
  attribution_json TEXT,
  guest_note TEXT,
  cancelled_at TEXT,
  cancel_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
);

INSERT INTO bookings_v2 (id, booking_code, user_id, listing_id, listing_title, provider_id, guest_name, guest_phone,
  check_in_date, check_out_date, total_amount, deposit_amount, status, created_at, updated_at)
SELECT id, booking_code, user_id, listing_id, listing_title, provider_id, guest_name, guest_phone,
  check_in_date, check_out_date, total_amount, deposit_amount, status, created_at, updated_at
FROM bookings;

DROP TABLE bookings;
ALTER TABLE bookings_v2 RENAME TO bookings;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_hold_expiry ON bookings(status, hold_expires_at);

-- Lượt dùng voucher gắn với đơn. Chỉ tính khi đơn còn hiệu lực (giữ chỗ còn hạn, đã xác nhận, đã nhận phòng, hoàn tất).
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_code ON voucher_redemptions(code);

-- Dòng kiểm tra trong batch: ok khác 1 thì CHECK lỗi → cả batch bị hủy (D1 không có transaction tương tác).
CREATE TABLE IF NOT EXISTS batch_assertions (
  id TEXT PRIMARY KEY,
  ok INTEGER NOT NULL CHECK(ok = 1)
);
