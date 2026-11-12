-- Migration 002: Hardened Row Level Security (RLS) Policies (R4)
-- Enforces strict immutable role/verification boundaries and prevents self-appointed ownership.

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Users can view their own profile; admins can view all profiles
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Users can update only their own contact info (full_name, phone, avatar_url)
-- STRICT R4: CANNOT update 'role' or 'is_verified'!
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND is_verified = (SELECT is_verified FROM profiles WHERE id = auth.uid())
  );

-- Admins can update any profile (including role and verification)
CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- 3. Providers Policies
-- Public can view verified providers; partners can view their own; admin has full view
CREATE POLICY providers_select ON providers
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin' OR verification_status = 'verified');

-- Partners can update only business contact info (business_name, phone, tax_or_cccd)
-- STRICT R4: CANNOT update 'verification_status', 'verified_at', or 'verified_by'!
CREATE POLICY providers_update_own ON providers
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND verification_status = (SELECT verification_status FROM providers WHERE id = providers.id)
    AND verified_by IS NOT DISTINCT FROM (SELECT verified_by FROM providers WHERE id = providers.id)
    AND verified_at IS NOT DISTINCT FROM (SELECT verified_at FROM providers WHERE id = providers.id)
  );

-- Admins can verify/reject providers
CREATE POLICY providers_admin_manage ON providers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Provider Listings Policies (Ownership Junction Table)
-- Partners and public can read listings mapping
CREATE POLICY provider_listings_select ON provider_listings
  FOR SELECT
  USING (true);

-- STRICT R4: Partners CANNOT self-assign listings!
-- ONLY Admin can insert, update or delete provider listing ownership!
CREATE POLICY provider_listings_admin_manage ON provider_listings
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- 5. Bookings Policies
-- Traveler A can only view their own bookings
-- Partner can only view bookings for listings they own
-- Admin can view all
CREATE POLICY bookings_select ON bookings
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY bookings_insert ON bookings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
