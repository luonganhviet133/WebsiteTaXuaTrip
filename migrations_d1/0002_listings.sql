-- Migration 0002 (N03): danh bạ cơ sở lưu bền, phiên bản hồ sơ, nhận chính chủ, nhật ký thao tác, nội dung trang.
-- Mọi lệnh đều chạy lại được (IF NOT EXISTS) vì bản Node dev/test áp lại các file migration khi khởi động.

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'approved', 'rejected')) DEFAULT 'draft',
  -- Nguồn gốc dữ liệu: thu thập công khai / chủ cơ sở tự tạo / admin tạo / dữ liệu mẫu
  data_origin TEXT NOT NULL CHECK(data_origin IN ('scraped', 'partner', 'admin', 'demo')),
  source_name TEXT,
  source_ref TEXT,
  collected_at TEXT,
  -- Huy hiệu D06: 1 tự khai, 2 giấy tờ, 3 thẩm định thực địa. Cấp 2–3 hết hạn sau 12 tháng kể từ verified_at.
  verification_tier INTEGER NOT NULL CHECK(verification_tier IN (1, 2, 3)) DEFAULT 1,
  verification_source TEXT,
  verified_at TEXT,
  verified_by TEXT REFERENCES profiles(id),
  published_version_id TEXT,
  is_admin_featured INTEGER NOT NULL DEFAULT 0,
  admin_priority_rank INTEGER NOT NULL DEFAULT 0,
  admin_featured_label TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);

CREATE TABLE IF NOT EXISTS listing_versions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  -- draft: đang soạn; pending: chờ admin duyệt; approved: đã duyệt (bản công khai là listings.published_version_id);
  -- rejected: bị từ chối. Bản đã duyệt không bao giờ bị sửa đè.
  status TEXT NOT NULL CHECK(status IN ('draft', 'pending', 'approved', 'rejected')),
  content_json TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  submitted_at TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  UNIQUE(listing_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_listing_versions_listing ON listing_versions(listing_id, status);

CREATE TABLE IF NOT EXISTS listing_claims (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  zalo TEXT,
  evidence_note TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listing_claims_status ON listing_claims(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_claims_open ON listing_claims(listing_id, user_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content_json TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);
