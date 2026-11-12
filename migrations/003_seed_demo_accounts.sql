-- Migration 003: Idempotent Seed for Testing & Demo Accounts
-- Provides Admin, Partner A (May), Partner B (Lu Tre), Traveler A, Traveler B

-- 1. Profiles
INSERT INTO profiles (id, email, password_hash, full_name, phone, role, is_verified)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@taxuatrip.vn', 'seed_admin_hash', 'Nguyễn Văn Hùng (Admin)', '0988888999', 'admin', true),
  ('a0000000-0000-0000-0000-000000000002', 'partner.a@taxuatrip.vn', 'seed_partner_hash', 'Vàng A Mẩy (Partner A)', '0981234567', 'partner', true),
  ('a0000000-0000-0000-0000-000000000003', 'partner.b@taxuatrip.vn', 'seed_partner_hash', 'Mùa A Lu (Partner B)', '0982345678', 'partner', true),
  ('a0000000-0000-0000-0000-000000000004', 'traveler.a@gmail.com', 'seed_traveler_hash', 'Lê Thành Đạt (Khách A)', '0912345678', 'traveler', false),
  ('a0000000-0000-0000-0000-000000000005', 'traveler.b@gmail.com', 'seed_traveler_hash', 'Trần Thu Trang (Khách B)', '0913456789', 'traveler', false)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;

-- 2. Providers
INSERT INTO providers (id, user_id, business_name, phone, verification_status, verified_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Mẩy Tà Xùa Homestay & Cloud Lounge', '0981234567', 'verified', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'Lu Trẻ Homestay & Camping', '0982345678', 'verified', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  verification_status = EXCLUDED.verification_status;

-- 3. Provider Listings Ownership
INSERT INTO provider_listings (provider_id, listing_id, is_primary_owner)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'homestay-may', true),
  ('b0000000-0000-0000-0000-000000000002', 'homestay-lutre', true)
ON CONFLICT (provider_id, listing_id) DO NOTHING;

-- 4. Test Bookings (For multi-tenant isolation verification)
INSERT INTO bookings (id, booking_code, user_id, listing_id, provider_id, total_amount, deposit_amount, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'BK-TRAV-A-01', 'a0000000-0000-0000-0000-000000000004', 'homestay-may', 'b0000000-0000-0000-0000-000000000001', 2500000, 750000, 'confirmed'),
  ('c0000000-0000-0000-0000-000000000002', 'BK-TRAV-B-01', 'a0000000-0000-0000-0000-000000000005', 'homestay-lutre', 'b0000000-0000-0000-0000-000000000002', 1800000, 540000, 'pending')
ON CONFLICT (booking_code) DO NOTHING;
