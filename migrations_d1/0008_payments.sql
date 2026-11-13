-- Migration 0008 (N06.1): cọc chuyển thẳng cơ sở (D03) — tài khoản nhận, snapshot thanh toán, biên lai, xác nhận 70%.

-- Tài khoản nhận cọc của từng cơ sở (chủ cơ sở nhập). Đổi tài khoản không ảnh hưởng đơn đã chụp snapshot.
CREATE TABLE IF NOT EXISTS listing_payout_accounts (
  listing_id TEXT PRIMARY KEY,
  bank_bin TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

-- Snapshot lúc khách tick điều khoản: người nhận, số tiền, nội dung chuyển khoản. Mọi màn đọc từ đây.
CREATE TABLE IF NOT EXISTS booking_payments (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  terms_accepted_at TEXT NOT NULL,
  accepted_by TEXT NOT NULL,
  payee_bank_bin TEXT NOT NULL,
  payee_account_number TEXT NOT NULL,
  payee_account_name TEXT NOT NULL,
  total_amount INTEGER NOT NULL CHECK(total_amount >= 0),
  deposit_amount INTEGER NOT NULL CHECK(deposit_amount >= 0),
  balance_amount INTEGER NOT NULL CHECK(balance_amount >= 0),
  deposit_memo TEXT NOT NULL,
  balance_memo TEXT NOT NULL,
  balance_due_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Ảnh biên lai (R2 riêng tư). Tải lên KHÔNG làm đơn thành đã trả: chỉ chủ cơ sở xác nhận.
CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('deposit', 'balance')),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_booking ON payment_receipts(booking_id, kind);

-- Cọc đã nhận = bookings.confirmed_at (N05.3). 70% đã nhận: chủ cơ sở bấm, lưu ở đây.
ALTER TABLE bookings ADD COLUMN balance_confirmed_at TEXT;
ALTER TABLE bookings ADD COLUMN balance_confirmed_by TEXT;

-- Thông báo theo mốc (nhắc 70%) chỉ gửi một lần.
ALTER TABLE notifications ADD COLUMN dedupe_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(dedupe_key) WHERE dedupe_key IS NOT NULL;
