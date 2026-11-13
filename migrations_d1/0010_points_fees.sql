-- Migration 0010 (N06.2): sổ Điểm Mây (đóng góp) và sổ phí nền tảng — chỉ ghi thêm, mỗi nguồn sự kiện một lần.

-- Điểm Mây. Không sửa/xóa dòng: thu hồi = một dòng âm trỏ về dòng gốc (reverses_id, mỗi dòng gốc thu hồi một lần).
-- effective_at: mốc tính hạn 12 tháng / tháng xếp hạng (dòng thu hồi lấy mốc của dòng gốc).
CREATE TABLE IF NOT EXISTS points_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,           -- stay_completed | review | review_photo | admin_award | admin_revoke | redemption
  source_id TEXT NOT NULL,             -- mã đơn / mã đánh giá / khóa chống bấm lặp của admin / mã dòng gốc
  points INTEGER NOT NULL CHECK(points <> 0),
  reason TEXT,
  reverses_id TEXT UNIQUE REFERENCES points_ledger(id),
  created_by TEXT,
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id, effective_at);
CREATE INDEX IF NOT EXISTS idx_points_ledger_effective ON points_ledger(effective_at);

-- Mức phí từng cơ sở do admin cài (sau khi thỏa thuận). mode fixed: value = đồng/đơn; percent_bp: value = điểm cơ bản (500 = 5%).
CREATE TABLE IF NOT EXISTS listing_fee_rates (
  listing_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK(mode IN ('fixed', 'percent_bp')),
  value INTEGER NOT NULL CHECK(value >= 0),
  note TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

-- Sổ phí: nghĩa vụ phí khi đơn hoàn tất (chưa thu; hóa đơn cuối tháng ở N06.3). Đảo = dòng âm trỏ dòng gốc.
CREATE TABLE IF NOT EXISTS fee_ledger (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  booking_id TEXT REFERENCES bookings(id),
  kind TEXT NOT NULL CHECK(kind IN ('platform_fee', 'reversal')),
  amount INTEGER NOT NULL,
  basis_amount INTEGER,                -- tổng đơn lúc tính
  rate_mode TEXT,
  rate_value INTEGER,
  period TEXT NOT NULL,                -- YYYY-MM giờ VN
  reason TEXT,
  reverses_id TEXT UNIQUE REFERENCES fee_ledger(id),
  created_by TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_ledger_booking_fee ON fee_ledger(booking_id) WHERE kind = 'platform_fee';
CREATE INDEX IF NOT EXISTS idx_fee_ledger_period ON fee_ledger(period, listing_id);

-- Quà đổi điểm (cơ chế có sẵn, đang khóa): danh mục do admin cài sau; mã quà duy nhất.
CREATE TABLE IF NOT EXISTS point_rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  points_cost INTEGER NOT NULL CHECK(points_cost > 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS point_redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL REFERENCES point_rewards(id),
  points INTEGER NOT NULL,
  gift_code TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
);

-- Top 3 mỗi tháng: admin chốt và ghi quà đã trao (quà chọn ngoài hệ thống).
CREATE TABLE IF NOT EXISTS monthly_awards (
  month TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK(rank BETWEEN 1 AND 3),
  user_id TEXT NOT NULL REFERENCES profiles(id),
  points INTEGER NOT NULL,
  gift_note TEXT NOT NULL,
  awarded_by TEXT NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (month, rank),
  UNIQUE (month, user_id)
);
