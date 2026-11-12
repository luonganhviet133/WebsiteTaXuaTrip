-- Migration 0004 (N04): báo giá server (snapshot để N05 kiểm lại khi giữ chỗ) và voucher.
-- Mọi lệnh chạy lại được (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  -- Phiên bản hồ sơ công khai dùng để tính giá; N05 so với bản hiện tại trước khi giữ chỗ.
  listing_version_id TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  request_json TEXT NOT NULL,
  quote_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
  discount INTEGER NOT NULL CHECK(discount >= 0),
  total INTEGER NOT NULL CHECK(total >= 0),
  voucher_code TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_listing ON quotes(listing_id, created_at);

CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK(discount_value > 0),
  max_discount INTEGER,
  min_booking_amount INTEGER NOT NULL DEFAULT 0 CHECK(min_booking_amount >= 0),
  applicable_category TEXT NOT NULL DEFAULT 'all',
  applicable_listing_id TEXT,
  valid_from TEXT,
  valid_until TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0 CHECK(used_count >= 0),
  description TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK(discount_type != 'percent' OR discount_value <= 100),
  CHECK(usage_limit IS NULL OR used_count <= usage_limit)
);
