/**
 * Cloudflare D1 Database Engine for Tà Xùa Trip
 *
 * Implements persistent relational database storage with SQLite/D1 prepared statements,
 * foreign keys, indexing, atomic batch operations, and test isolation.
 *
 * Replaces old in-memory Maps and dead pg.Pool code (S2, S4, S5).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createD1Database, type NodeSQLiteD1Database } from './d1.ts';
import type { D1Database } from './d1.ts';

// Chỉ gọi khi chạy trên Node (dev, CLI, test). Không tính ở cấp module vì trên Cloudflare Worker
// import.meta.url là undefined và không có file system, Worker sẽ sập ngay lúc khởi động.
export function resolveProjectRoot(): string {
  let curr = path.dirname(fileURLToPath(import.meta.url));
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return process.cwd();
}


export interface ProfileRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: 'traveler' | 'partner' | 'admin';
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRecord {
  id: string;
  userId: string;
  businessName: string;
  phone: string;
  taxOrCccd?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderListingRecord {
  id: string;
  providerId: string;
  listingId: string;
  isPrimaryOwner: boolean;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  role: 'traveler' | 'partner' | 'admin';
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

export interface BookingDTO {
  id: string;
  bookingCode: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  providerId?: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  depositAmount: number;
  status: 'draft' | 'pending' | 'pending_deposit' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired';
  /** N05.2: hạn giữ chỗ của đơn pending_deposit */
  holdExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingRecord = BookingDTO;

// Cryptographic Password Hashing (PBKDF2 with Salt 16 bytes, 10,000 rounds SHA-512)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface DatabaseEngineOptions {
  d1?: D1Database;
  sqlitePath?: string;
  isTest?: boolean;
  inMemoryOnly?: boolean;
}

function applyMigrationsSync(local: NodeSQLiteD1Database): void {
  const dir = path.resolve(resolveProjectRoot(), 'migrations_d1');
  const files = fs.readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  try {
    local.execSync('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');
    const applied = new Set(local.allSync<{ version: string }>('SELECT version FROM schema_migrations').map((r) => r.version));
    for (const file of files) {
      if (applied.has(file)) continue;
      local.execSync(fs.readFileSync(path.join(dir, file), 'utf8'));
      local.execSync(`INSERT INTO schema_migrations (version, applied_at) VALUES ('${file}', '${new Date().toISOString()}')`);
    }
  } catch (err: any) {
    throw new Error(`Database Initialization Error: ${err.message}`);
  }
}

export class DatabaseEngine {
  public readonly d1: D1Database;
  public readonly isTestInstance: boolean;

  constructor(options: DatabaseEngineOptions = {}) {
    this.isTestInstance = Boolean(options.isTest || options.inMemoryOnly);

    if (options.d1) {
      // D1 của Cloudflare: schema do `wrangler d1 migrations apply` tạo lúc deploy (npm run deploy).
      // Không tự tạo bảng ở đây: exec của D1 là bất đồng bộ, coi mỗi dòng là một lệnh, và Worker
      // tạo DatabaseEngine ở mỗi request.
      this.d1 = options.d1;
      return;
    }

    const local = options.inMemoryOnly
      ? createD1Database(':memory:')
      : createD1Database(options.sqlitePath || process.env.DATABASE_SQLITE_PATH || path.resolve(resolveProjectRoot(), '.data', 'taxua_trip.sqlite'));
    this.d1 = local;

    // SQLite trên Node (dev, CLI, test): áp đúng các file migrations_d1 mà Cloudflare dùng,
    // file nào đã áp thì ghi vào schema_migrations để không chạy lại.
    applyMigrationsSync(local);
  }

  // --- Health Check (S4: Surfaces Real DB Status, No Masking) ---
  public async checkHealth(): Promise<{ database: string; databaseOk: boolean; error?: string }> {
    try {
      const res = await this.d1.prepare('SELECT 1 as alive').first<{ alive: number }>();
      if (!res || res.alive !== 1) {
        return { database: 'cloudflare_d1', databaseOk: false, error: 'Database check query failed' };
      }
      return { database: 'cloudflare_d1', databaseOk: true };
    } catch (err: any) {
      return { database: 'cloudflare_d1', databaseOk: false, error: err.message };
    }
  }

  // --- Profile Queries (Async Prepared Statements) ---
  public async findProfileByEmail(email: string): Promise<ProfileRecord | null> {
    const row = await this.d1.prepare(`
      SELECT id, email, phone, password_hash as passwordHash, full_name as fullName,
             role, avatar_url as avatarUrl, is_verified as isVerified,
             created_at as createdAt, updated_at as updatedAt
      FROM profiles
      WHERE LOWER(email) = LOWER(?)
    `).bind(email.trim()).first<ProfileRecord>();
    if (!row) return null;
    return { ...row, isVerified: Boolean(row.isVerified) };
  }

  public async findProfileByPhone(phone: string): Promise<ProfileRecord | null> {
    const cleanPhone = phone.replace(/\s+/g, '');
    const row = await this.d1.prepare(`
      SELECT id, email, phone, password_hash as passwordHash, full_name as fullName,
             role, avatar_url as avatarUrl, is_verified as isVerified,
             created_at as createdAt, updated_at as updatedAt
      FROM profiles
      WHERE REPLACE(phone, ' ', '') = ?
    `).bind(cleanPhone).first<ProfileRecord>();
    if (!row) return null;
    return { ...row, isVerified: Boolean(row.isVerified) };
  }

  public async findProfileByIdentifier(identifier: string): Promise<ProfileRecord | null> {
    const raw = identifier.trim();
    if (raw.includes('@')) {
      return this.findProfileByEmail(raw);
    }
    const byPhone = await this.findProfileByPhone(raw);
    if (byPhone) return byPhone;
    return this.findProfileByEmail(`${raw}@taxuatrip.user`);
  }

  public async findProfileById(id: string): Promise<ProfileRecord | null> {
    const row = await this.d1.prepare(`
      SELECT id, email, phone, password_hash as passwordHash, full_name as fullName,
             role, avatar_url as avatarUrl, is_verified as isVerified,
             created_at as createdAt, updated_at as updatedAt
      FROM profiles
      WHERE id = ?
    `).bind(id).first<ProfileRecord>();
    if (!row) return null;
    return { ...row, isVerified: Boolean(row.isVerified) };
  }

  public async createProfile(data: {
    email: string;
    password?: string;
    passwordHash?: string;
    fullName: string;
    phone?: string;
    role?: 'traveler' | 'partner' | 'admin';
    isVerified?: boolean;
    avatarUrl?: string;
  }): Promise<ProfileRecord> {
    const id = `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const finalHash = data.passwordHash || (data.password ? hashPassword(data.password) : '');
    if (!finalHash) {
      throw new Error('MISSING_PASSWORD: Password or passwordHash is required');
    }

    const email = data.email.trim().toLowerCase();
    const phone = data.phone?.trim() || '';
    const fullName = data.fullName.trim();
    const role = data.role || 'traveler';
    const isVerified = data.isVerified ? 1 : 0;
    const avatarUrl = data.avatarUrl || '';

    await this.d1.prepare(`
      INSERT INTO profiles (id, email, phone, password_hash, full_name, role, avatar_url, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, email, phone, finalHash, fullName, role, avatarUrl, isVerified, now, now).run();

    return {
      id,
      email,
      phone,
      passwordHash: finalHash,
      fullName,
      role,
      avatarUrl,
      isVerified: Boolean(isVerified),
      createdAt: now,
      updatedAt: now
    };
  }

  public async updateProfile(id: string, updates: Partial<ProfileRecord>): Promise<ProfileRecord> {
    const existing = await this.findProfileById(id);
    if (!existing) {
      throw new Error(`Profile not found: ${id}`);
    }

    const email = updates.email?.trim().toLowerCase() || existing.email;
    const phone = updates.phone !== undefined ? updates.phone.trim() : existing.phone;
    const fullName = updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName;
    const role = updates.role || existing.role;
    const passwordHash = updates.passwordHash || existing.passwordHash;
    const isVerified = updates.isVerified !== undefined ? (updates.isVerified ? 1 : 0) : (existing.isVerified ? 1 : 0);
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : (existing.avatarUrl || '');
    const now = new Date().toISOString();

    await this.d1.prepare(`
      UPDATE profiles
      SET email = ?, phone = ?, full_name = ?, role = ?, password_hash = ?, avatar_url = ?, is_verified = ?, updated_at = ?
      WHERE id = ?
    `).bind(email, phone, fullName, role, passwordHash, avatarUrl, isVerified, now, id).run();

    return {
      id,
      email,
      phone,
      fullName,
      role,
      passwordHash,
      avatarUrl,
      isVerified: Boolean(isVerified),
      createdAt: existing.createdAt,
      updatedAt: now
    };
  }

  // --- Provider Queries ---
  public async findProviderByUserId(userId: string): Promise<ProviderRecord | null> {
    const row = await this.d1.prepare(`
      SELECT id, user_id as userId, business_name as businessName, phone, tax_or_cccd as taxOrCccd,
             verification_status as verificationStatus, verified_at as verifiedAt,
             verified_by as verifiedBy, created_at as createdAt, updated_at as updatedAt
      FROM providers
      WHERE user_id = ?
    `).bind(userId).first<ProviderRecord>();
    return row || null;
  }

  public async createProvider(data: {
    userId: string;
    businessName: string;
    phone: string;
    taxOrCccd?: string;
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  }): Promise<ProviderRecord> {
    const id = `prv_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const status = data.verificationStatus || 'unverified';

    await this.d1.prepare(`
      INSERT INTO providers (id, user_id, business_name, phone, tax_or_cccd, verification_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.userId, data.businessName, data.phone, data.taxOrCccd || '', status, now, now).run();

    return {
      id,
      userId: data.userId,
      businessName: data.businessName,
      phone: data.phone,
      taxOrCccd: data.taxOrCccd || '',
      verificationStatus: status,
      createdAt: now,
      updatedAt: now
    };
  }

  // --- Provider Listings Mapping ---
  public async getProviderListings(providerId: string): Promise<ProviderListingRecord[]> {
    const res = await this.d1.prepare(`
      SELECT id, provider_id as providerId, listing_id as listingId,
             is_primary_owner as isPrimaryOwner, created_at as createdAt
      FROM provider_listings
      WHERE provider_id = ?
    `).bind(providerId).all<ProviderListingRecord>();
    return (res.results || []).map((r) => ({ ...r, isPrimaryOwner: Boolean(r.isPrimaryOwner) }));
  }

  public async createProviderListing(providerId: string, listingId: string, isPrimaryOwner = true): Promise<ProviderListingRecord> {
    const id = `pl_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();

    await this.d1.prepare(`
      INSERT INTO provider_listings (id, provider_id, listing_id, is_primary_owner, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(provider_id, listing_id) DO UPDATE SET is_primary_owner = excluded.is_primary_owner
    `).bind(id, providerId, listingId, isPrimaryOwner ? 1 : 0, now).run();

    return {
      id,
      providerId,
      listingId,
      isPrimaryOwner,
      createdAt: now
    };
  }

  // --- Session Management (Hashed Token Storage - S3 / Security) ---
  public async createSession(userId: string, role: 'traveler' | 'partner' | 'admin', ttlDays = 7): Promise<{ token: string; session: SessionRecord }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const id = `sess_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    await this.d1.prepare(`
      INSERT INTO user_sessions (id, user_id, token_hash, role, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, userId, tokenHash, role, expiresAt, now).run();

    return {
      token: rawToken,
      session: {
        id,
        userId,
        tokenHash,
        role,
        expiresAt,
        createdAt: now
      }
    };
  }

  public async findActiveSession(rawToken: string): Promise<{ session: SessionRecord; profile: ProfileRecord; provider?: ProviderRecord } | null> {
    if (!rawToken) return null;
    const tokenHash = hashToken(rawToken);
    const now = new Date().toISOString();

    const row = await this.d1.prepare(`
      SELECT s.id as s_id, s.user_id as s_user_id, s.token_hash as s_token_hash, s.role as s_role,
             s.expires_at as s_expires_at, s.created_at as s_created_at, s.revoked_at as s_revoked_at,
             p.id as p_id, p.email as p_email, p.phone as p_phone, p.password_hash as p_password_hash,
             p.full_name as p_full_name, p.role as p_role, p.avatar_url as p_avatar_url,
             p.is_verified as p_is_verified, p.created_at as p_created_at, p.updated_at as p_updated_at
      FROM user_sessions s
      JOIN profiles p ON p.id = s.user_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
    `).bind(tokenHash, now).first<Record<string, any>>();

    if (!row) return null;

    const session: SessionRecord = {
      id: row.s_id,
      userId: row.s_user_id,
      tokenHash: row.s_token_hash,
      role: row.s_role,
      expiresAt: row.s_expires_at,
      createdAt: row.s_created_at,
      revokedAt: row.s_revoked_at
    };

    const profile: ProfileRecord = {
      id: row.p_id,
      email: row.p_email,
      phone: row.p_phone || '',
      passwordHash: row.p_password_hash,
      fullName: row.p_full_name,
      role: row.p_role,
      avatarUrl: row.p_avatar_url,
      isVerified: Boolean(row.p_is_verified),
      createdAt: row.p_created_at,
      updatedAt: row.p_updated_at
    };

    const provider = await this.findProviderByUserId(profile.id);
    return { session, profile, provider: provider || undefined };
  }

  public async revokeSession(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const tokenHash = hashToken(rawToken);
    const now = new Date().toISOString();

    const res = await this.d1.prepare(`
      UPDATE user_sessions
      SET revoked_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL
    `).bind(now, tokenHash).run();

    return (res.meta.changes ?? 0) > 0;
  }

  public async revokeAllUserSessions(userId: string): Promise<number> {
    const now = new Date().toISOString();
    const res = await this.d1.prepare(`
      UPDATE user_sessions
      SET revoked_at = ?
      WHERE user_id = ? AND revoked_at IS NULL
    `).bind(now, userId).run();

    return res.meta.changes ?? 0;
  }

  // --- Atomic Admin Password Update & Session Invalidation (S3) ---
  public async updateAdminPasswordAndRevokeSessions(userId: string, newPasswordHash: string): Promise<void> {
    const now = new Date().toISOString();
    await this.d1.batch([
      this.d1.prepare(`
        UPDATE profiles
        SET password_hash = ?, role = 'admin', is_verified = 1, updated_at = ?
        WHERE id = ?
      `).bind(newPasswordHash, now, userId),
      this.d1.prepare(`
        UPDATE user_sessions
        SET revoked_at = ?
        WHERE user_id = ? AND revoked_at IS NULL
      `).bind(now, userId)
    ]);
  }

  // --- Bookings Queries (S6: Consistent BookingDTO, No Missing Fields) ---
  public async getBookingsByUserId(userId: string): Promise<BookingDTO[]> {
    const res = await this.d1.prepare(`
      SELECT id, booking_code as bookingCode, user_id as userId, listing_id as listingId,
             listing_title as listingTitle, provider_id as providerId,
             guest_name as guestName, guest_phone as guestPhone,
             check_in_date as checkInDate, check_out_date as checkOutDate,
             total_amount as totalAmount, deposit_amount as depositAmount,
             status, hold_expires_at as holdExpiresAt, created_at as createdAt, updated_at as updatedAt
      FROM bookings
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all<BookingDTO>();

    return res.results || [];
  }

  public async getBookingById(id: string): Promise<BookingDTO | null> {
    const row = await this.d1.prepare(`
      SELECT id, booking_code as bookingCode, user_id as userId, listing_id as listingId,
             listing_title as listingTitle, provider_id as providerId,
             guest_name as guestName, guest_phone as guestPhone,
             check_in_date as checkInDate, check_out_date as checkOutDate,
             total_amount as totalAmount, deposit_amount as depositAmount,
             status, created_at as createdAt, updated_at as updatedAt
      FROM bookings
      WHERE id = ?
    `).bind(id).first<BookingDTO>();

    return row || null;
  }

  public async getAllBookingsAdmin(): Promise<BookingDTO[]> {
    const res = await this.d1.prepare(`
      SELECT id, booking_code as bookingCode, user_id as userId, listing_id as listingId,
             listing_title as listingTitle, provider_id as providerId,
             guest_name as guestName, guest_phone as guestPhone,
             check_in_date as checkInDate, check_out_date as checkOutDate,
             total_amount as totalAmount, deposit_amount as depositAmount,
             status, created_at as createdAt, updated_at as updatedAt
      FROM bookings
      ORDER BY created_at DESC
    `).all<BookingDTO>();

    return res.results || [];
  }

  public async getOwnedListingIdsByUserId(userId: string): Promise<string[]> {
    const provider = await this.findProviderByUserId(userId);
    if (!provider) return [];
    const listings = await this.getProviderListings(provider.id);
    return listings.map((l) => l.listingId);
  }

  public async getAdminOverview(): Promise<{ totalBookings: number; verifiedStatus: string; serverTimestamp: string }> {
    const bookings = await this.getAllBookingsAdmin();
    return {
      totalBookings: bookings.length,
      verifiedStatus: 'system_active',
      serverTimestamp: new Date().toISOString()
    };
  }

  public async createBooking(data: {
    userId: string;
    listingId: string;
    listingTitle: string;
    providerId?: string;
    guestName: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    depositAmount: number;
    status?: 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
  }): Promise<BookingDTO> {
    const id = `bk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const bookingCode = `TX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const now = new Date().toISOString();
    const status = data.status || 'pending';

    await this.d1.prepare(`
      INSERT INTO bookings (
        id, booking_code, user_id, listing_id, listing_title, provider_id,
        guest_name, guest_phone, check_in_date, check_out_date,
        total_amount, deposit_amount, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, bookingCode, data.userId, data.listingId, data.listingTitle, data.providerId || null,
      data.guestName, data.guestPhone, data.checkInDate, data.checkOutDate,
      data.totalAmount, data.depositAmount, status, now, now
    ).run();

    return {
      id,
      bookingCode,
      userId: data.userId,
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      providerId: data.providerId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate,
      totalAmount: data.totalAmount,
      depositAmount: data.depositAmount,
      status,
      createdAt: now,
      updatedAt: now
    };
  }

  // --- Strict Test Isolation Guard (S1) ---
  public async resetDatabaseForTest(): Promise<void> {
    if (!this.isTestInstance) {
      throw new Error('CRITICAL_SECURITY_VIOLATION: Cannot reset operational database store! resetDatabaseForTest() is only permitted on isolated test instances (isTest: true).');
    }

    await this.d1.exec(`
      DELETE FROM monthly_awards;
      DELETE FROM point_redemptions;
      DELETE FROM point_rewards;
      DELETE FROM fee_ledger;
      DELETE FROM listing_fee_rates;
      DELETE FROM points_ledger;
      DELETE FROM reconciliation_files;
      DELETE FROM payment_reconciliations;
      DELETE FROM payment_receipts;
      DELETE FROM booking_payments;
      DELETE FROM listing_payout_accounts;
      DELETE FROM notifications;
      DELETE FROM booking_events;
      DELETE FROM voucher_redemptions;
      DELETE FROM batch_assertions;
      DELETE FROM room_night_allocations;
      DELETE FROM room_night_closures;
      DELETE FROM quotes;
      DELETE FROM vouchers;
      DELETE FROM audit_log;
      DELETE FROM listing_claims;
      DELETE FROM listing_versions;
      DELETE FROM listings;
      DELETE FROM site_content;
      DELETE FROM bookings;
      DELETE FROM user_sessions;
      DELETE FROM provider_listings;
      DELETE FROM providers;
      DELETE FROM profiles;
    `);
  }

  // Explicit fixture seed only for test environments (R1, S1)
  public async seedTestFixtures(): Promise<void> {
    if (!this.isTestInstance) {
      throw new Error('CRITICAL_SECURITY_VIOLATION: Cannot seed demo fixtures into operational database store! seedTestFixtures() is only permitted on isolated test instances.');
    }

    // 1. Admin
    const admin = await this.createProfile({
      email: 'admin@taxuatrip.vn',
      passwordHash: hashPassword('admin123'),
      fullName: 'Super Admin Test',
      phone: '0988888888',
      role: 'admin',
      isVerified: true
    });

    // 2. Partner A
    const partA = await this.createProfile({
      email: 'partner.a@taxuatrip.vn',
      passwordHash: hashPassword('partner123'),
      fullName: 'Vàng A Mẩy (Test)',
      phone: '0981234567',
      role: 'partner',
      isVerified: true
    });
    const provA = await this.createProvider({
      userId: partA.id,
      businessName: 'Homestay Mây Tà Xùa',
      phone: partA.phone,
      verificationStatus: 'verified'
    });
    await this.createProviderListing(provA.id, 'homestay-may', true);

    // 3. Partner B
    const partB = await this.createProfile({
      email: 'partner.b@taxuatrip.vn',
      passwordHash: hashPassword('partner123'),
      fullName: 'Mùa A Lử (Test)',
      phone: '0987654321',
      role: 'partner',
      isVerified: true
    });
    const provB = await this.createProvider({
      userId: partB.id,
      businessName: 'Homestay Lu Tre',
      phone: partB.phone,
      verificationStatus: 'verified'
    });
    await this.createProviderListing(provB.id, 'homestay-lutre', true);

    // 4. Traveler A
    const travA = await this.createProfile({
      email: 'traveler.a@gmail.com',
      passwordHash: hashPassword('traveler123'),
      fullName: 'Trần Văn Du Khách A',
      phone: '0912345678',
      role: 'traveler',
      isVerified: true
    });

    // 5. Traveler B
    const travB = await this.createProfile({
      email: 'traveler.b@gmail.com',
      passwordHash: hashPassword('traveler123'),
      fullName: 'Lê Thị Du Khách B',
      phone: '0934567890',
      role: 'traveler',
      isVerified: true
    });

    // 6. Cơ sở mẫu (data_origin = 'demo') cho hai partner thử nghiệm; chỉ có trong DB test.
    const demoContent = (title: string, area: string) => JSON.stringify({
      title, category: 'homestay', area, address: `${area}, Tà Xùa`, phone: '', zalo: '', description: 'Dữ liệu mẫu cho test.',
      coverImage: '', images: [], tags: [], minPrice: 0, coordinates: null, isInstantBooking: false,
    });
    const now = new Date().toISOString();
    for (const [id, title, area] of [['homestay-may', 'Homestay Mây Tà Xùa (mẫu)', 'Đỉnh Gió'], ['homestay-lutre', 'Homestay Lu Tre (mẫu)', 'Khe Cải']]) {
      await this.d1.batch([
        this.d1.prepare(`INSERT INTO listings (id, category, status, data_origin, published_version_id, created_by, created_at, updated_at) VALUES (?, 'homestay', 'approved', 'demo', ?, 'fixture', ?, ?)`).bind(id, `${id}-v1`, now, now),
        this.d1.prepare(`INSERT INTO listing_versions (id, listing_id, version_no, status, content_json, created_by, created_at, reviewed_by, reviewed_at) VALUES (?, ?, 1, 'approved', ?, 'fixture', ?, 'fixture', ?)`).bind(`${id}-v1`, id, demoContent(title, area), now, now),
      ]);
    }

    // 7. Test Bookings with complete DTO fields (S6)
    await this.createBooking({
      userId: travA.id,
      listingId: 'homestay-may',
      listingTitle: 'Homestay Mây Tà Xùa - Bungalow Đỉnh Gió',
      providerId: provA.id,
      guestName: travA.fullName,
      guestPhone: travA.phone,
      checkInDate: '2026-11-20',
      checkOutDate: '2026-11-22',
      totalAmount: 1200000,
      depositAmount: 600000,
      status: 'confirmed'
    });

    await this.createBooking({
      userId: travB.id,
      listingId: 'homestay-lutre',
      listingTitle: 'Homestay Lu Tre - Phòng View Biển Mây',
      providerId: provB.id,
      guestName: travB.fullName,
      guestPhone: travB.phone,
      checkInDate: '2026-11-25',
      checkOutDate: '2026-11-27',
      totalAmount: 900000,
      depositAmount: 450000,
      status: 'pending'
    });
  }
}

// Default operational singleton pointing to .data/taxua_trip.sqlite
// Kho mặc định cho Express/CLI trên Node, tạo ở lần dùng đầu tiên.
// Không tạo ở cấp module: Worker import file này nhưng không có node:sqlite.
let defaultDb: DatabaseEngine | undefined;
export function getDefaultDb(): DatabaseEngine {
  if (!defaultDb) defaultDb = new DatabaseEngine();
  return defaultDb;
}
