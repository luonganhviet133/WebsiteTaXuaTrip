-- Migration 0012 (R1): tài khoản — trạng thái, khóa tạm khi sai mật khẩu, xác minh email, đồng ý điều khoản,
-- phiên có thiết bị, mã gửi qua email (xác minh/đặt lại mật khẩu), nhật ký gửi email.
-- Chỉ THÊM cột/bảng; dữ liệu cũ giữ nguyên (tài khoản cũ mặc định 'active').

ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'locked'));
ALTER TABLE profiles ADD COLUMN status_reason TEXT;
ALTER TABLE profiles ADD COLUMN status_changed_at TEXT;
ALTER TABLE profiles ADD COLUMN status_changed_by TEXT;
ALTER TABLE profiles ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN login_locked_until TEXT;
ALTER TABLE profiles ADD COLUMN email_verified_at TEXT;
ALTER TABLE profiles ADD COLUMN terms_version TEXT;
ALTER TABLE profiles ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE profiles ADD COLUMN password_changed_at TEXT;
ALTER TABLE profiles ADD COLUMN last_login_at TEXT;

ALTER TABLE user_sessions ADD COLUMN user_agent TEXT;
ALTER TABLE user_sessions ADD COLUMN last_seen_at TEXT;

-- Mã 6 số gửi qua email; chỉ lưu băm. Dùng một lần, có hạn, giới hạn số lần nhập.
CREATE TABLE IF NOT EXISTS auth_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK(purpose IN ('verify_email', 'reset_password')),
  code_hash TEXT NOT NULL,
  sent_to TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_codes_user ON auth_codes(user_id, purpose, created_at);

-- Nhật ký gửi email (không lưu nội dung mã). status: sent | failed | skipped (chưa bật dịch vụ email).
CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('sent', 'failed', 'skipped')),
  provider_message_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at);
