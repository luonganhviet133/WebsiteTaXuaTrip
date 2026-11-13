-- Migration 0009 (N06.1 bổ sung): đối soát cọc — khách đã chuyển cọc nhưng đơn hết hạn/bị từ chối trước khi cơ sở xác nhận.
-- Cơ sở hoàn trong 3 ngày (kèm chứng từ) hoặc giữ tiền khi khách đồng ý; tranh chấp do admin phân xử. Hệ thống không chuyển tiền.

CREATE TABLE IF NOT EXISTS payment_reconciliations (
  booking_id TEXT PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('open', 'refund_reported', 'hold_proposed', 'disputed', 'closed')),
  outcome TEXT CHECK(outcome IS NULL OR outcome IN ('refunded', 'held')),
  reason TEXT NOT NULL,                 -- vì sao mở: hết hạn giữ chỗ / cơ sở từ chối
  opened_at TEXT NOT NULL,
  due_at TEXT NOT NULL,                 -- hạn cơ sở hoàn (3 ngày)
  refund_amount INTEGER CHECK(refund_amount IS NULL OR refund_amount > 0),
  owner_note TEXT,                      -- ghi chú khi báo đã hoàn / nội dung đề nghị giữ tiền
  guest_note TEXT,                      -- khách trả lời / nội dung khiếu nại
  admin_note TEXT,                      -- kết luận của admin
  closed_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_status ON payment_reconciliations(status, due_at);

-- Bằng chứng ảnh của hai bên (chứng từ hoàn của cơ sở, ảnh khách đính kèm khi khiếu nại). R2 riêng tư.
CREATE TABLE IF NOT EXISTS reconciliation_files (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('owner', 'guest')),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_files_booking ON reconciliation_files(booking_id, role);
