/**
 * Authentication & Authorization Module for Tà Xùa Trip
 * Backed by Cloudflare D1 Relational Engine
 */
import { getDefaultDb, verifyPassword, hashPassword } from './db.ts';
import type { DatabaseEngine, ProfileRecord, ProviderRecord } from './db.ts';
import { LOCKOUT, TERMS_VERSION, checkPassword, isLockedOut, normalizeEmail, normalizeVnPhone } from './accounts/rules.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'traveler' | 'partner' | 'admin';
  isVerified: boolean;
  avatarUrl?: string;
  providerId?: string;
  businessName?: string;
  ownedListingIds: string[];
}

export interface RegisterInput {
  email?: string;
  phone?: string;
  emailOrPhone?: string;
  identifier?: string;
  password: string;
  fullName: string;
  role: 'traveler' | 'partner' | 'admin';
  facilityName?: string;
  turnstileToken?: string;
  termsAccepted?: boolean;
  termsVersion?: string;
  userAgent?: string | null;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  identifier?: string;
  emailOrPhone?: string;
  password: string;
  turnstileToken?: string;
  userAgent?: string | null;
}

// Convert internal profile & provider to clean public representation
export async function sanitizeUser(profile: ProfileRecord, provider?: ProviderRecord, customDb: DatabaseEngine = getDefaultDb()): Promise<AuthenticatedUser> {
  const ownedListingIds: string[] = [];
  if (provider) {
    const pl = await customDb.getProviderListings(provider.id);
    for (const item of pl) {
      ownedListingIds.push(item.listingId);
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    role: profile.role,
    isVerified: profile.isVerified,
    avatarUrl: profile.avatarUrl,
    providerId: provider?.id,
    businessName: provider?.businessName,
    ownedListingIds
  };
}

// 1. User Registration (Guards against self-appointed admin & auto-ownership)
export async function registerUser(input: RegisterInput, customDb: DatabaseEngine = getDefaultDb()): Promise<{ token: string; user: AuthenticatedUser }> {
  // STRICT RULE: Users CANNOT self-register as admin!
  if (input.role === 'admin') {
    throw new Error('FORBIDDEN_ADMIN_REGISTRATION: Không được phép tự đăng ký tài khoản quản trị viên.');
  }

  // R1 (chủ dự án chốt 13/11/2026): bắt buộc email thật (đặt lại mật khẩu, mã xác minh gửi qua email).
  const email = normalizeEmail(input.email ?? (String(input.emailOrPhone || input.identifier || '').includes('@') ? input.emailOrPhone || input.identifier : ''));
  if (!email) {
    throw new Error('INVALID_EMAIL: Vui lòng nhập email hợp lệ (dùng để đăng nhập và lấy lại mật khẩu).');
  }
  const fullName = (input.fullName || '').trim().replace(/\s+/g, ' ');
  if (fullName.length < 2 || fullName.length > 80) {
    throw new Error('INVALID_NAME: Họ tên từ 2 đến 80 ký tự.');
  }
  const weak = checkPassword(input.password ?? '', email);
  if (weak) throw new Error(`WEAK_PASSWORD: ${weak}`);
  if (input.termsAccepted !== true || input.termsVersion !== TERMS_VERSION) {
    throw new Error('TERMS_REQUIRED: Vui lòng đọc và đồng ý Điều khoản sử dụng và Chính sách dữ liệu cá nhân.');
  }
  let phone = '';
  if (input.phone) {
    const p = normalizeVnPhone(input.phone);
    if (!p) throw new Error('INVALID_PHONE: Số điện thoại Việt Nam gồm 10 số, ví dụ 0912345678.');
    phone = p;
  }
  if (input.role === 'partner') {
    if (!phone) throw new Error('PHONE_REQUIRED: Đối tác cần số điện thoại để Tà Xùa Trip liên hệ xác minh.');
    const fn = (input.facilityName || '').trim();
    if (fn.length < 2 || fn.length > 120) throw new Error('INVALID_BUSINESS: Vui lòng nhập tên cơ sở/doanh nghiệp (2–120 ký tự).');
  }

  if (await customDb.findProfileByEmail(email)) {
    throw new Error('EMAIL_EXISTS: Email này đã được đăng ký. Bạn có thể đăng nhập hoặc lấy lại mật khẩu.');
  }
  if (phone && (await customDb.findProfileByPhone(phone))) {
    throw new Error('PHONE_EXISTS: Số điện thoại này đã gắn với tài khoản khác.');
  }

  const role: 'traveler' | 'partner' = input.role === 'partner' ? 'partner' : 'traveler';

  // Create user profile
  const profile = await customDb.createProfile({
    email,
    password: input.password,
    fullName,
    phone,
    role,
    isVerified: false // Regular registration is NEVER automatically verified
  });
  const nowIso = new Date().toISOString();
  await customDb.d1
    .prepare('UPDATE profiles SET terms_version = ?, terms_accepted_at = ?, last_login_at = ? WHERE id = ?')
    .bind(TERMS_VERSION, nowIso, nowIso, profile.id)
    .run();

  let provider: ProviderRecord | undefined;
  if (role === 'partner') {
    // STRICT RULE: Partner registration creates an unverified provider with ZERO listings owned!
    provider = await customDb.createProvider({
      userId: profile.id,
      businessName: input.facilityName!.trim(),
      phone: profile.phone,
      // R1: chưa thu giấy tờ; admin liên hệ và bấm xác nhận thủ công (R2).
      verificationStatus: 'pending'
    });
  }

  // Create active session
  const { token } = await customDb.createSession(profile.id, profile.role, 7, input.userAgent);
  const user = await sanitizeUser(profile, provider, customDb);

  return {
    token,
    user
  };
}

// 2. User Login (Unified Email & Phone Support - R9)
export async function loginUser(credentials: LoginInput, customDb: DatabaseEngine = getDefaultDb()): Promise<{ token: string; user: AuthenticatedUser }> {
  const rawIdentifier = (credentials.identifier || credentials.emailOrPhone || credentials.email || credentials.phone || '').trim();
  if (!rawIdentifier || !credentials.password) {
    throw new Error('INVALID_CREDENTIALS: Vui lòng nhập đầy đủ email/số điện thoại và mật khẩu.');
  }

  const profile = await customDb.findProfileByIdentifier(rawIdentifier);
  if (!profile) {
    throw new Error('INVALID_CREDENTIALS: Email/Số điện thoại hoặc mật khẩu không chính xác.');
  }
  const state = await customDb.d1
    .prepare('SELECT status, login_locked_until FROM profiles WHERE id = ?')
    .bind(profile.id)
    .first<{ status: string; login_locked_until: string | null }>();
  const now = Date.now();
  // R1: sai 5 lần liên tiếp thì khóa tạm 15 phút; trong thời gian khóa không kiểm mật khẩu (chặn dò).
  if (isLockedOut(state?.login_locked_until, now)) {
    const mins = Math.ceil((Date.parse(state!.login_locked_until!) - now) / 60_000);
    throw new Error(`TOO_MANY_ATTEMPTS: Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau ${mins} phút hoặc lấy lại mật khẩu.`);
  }

  if (!verifyPassword(credentials.password, profile.passwordHash)) {
    const lockUntil = new Date(now + LOCKOUT.minutes * 60_000).toISOString();
    const after = await customDb.d1
      .prepare(
        `UPDATE profiles SET
           login_locked_until = CASE WHEN failed_login_count + 1 >= ? THEN ? ELSE login_locked_until END,
           failed_login_count = CASE WHEN failed_login_count + 1 >= ? THEN 0 ELSE failed_login_count + 1 END
         WHERE id = ? RETURNING login_locked_until`
      )
      .bind(LOCKOUT.maxFailures, lockUntil, LOCKOUT.maxFailures, profile.id)
      .first<{ login_locked_until: string | null }>();
    if (isLockedOut(after?.login_locked_until, now)) {
      throw new Error(`TOO_MANY_ATTEMPTS: Bạn đã nhập sai ${LOCKOUT.maxFailures} lần. Tài khoản tạm khóa ${LOCKOUT.minutes} phút; bạn có thể lấy lại mật khẩu.`);
    }
    throw new Error('INVALID_CREDENTIALS: Email/Số điện thoại hoặc mật khẩu không chính xác.');
  }
  if (state?.status === 'locked') {
    throw new Error('ACCOUNT_LOCKED: Tài khoản đang bị khóa. Vui lòng liên hệ Tà Xùa Trip để được hỗ trợ.');
  }

  await customDb.d1
    .prepare('UPDATE profiles SET failed_login_count = 0, login_locked_until = NULL, last_login_at = ? WHERE id = ?')
    .bind(new Date(now).toISOString(), profile.id)
    .run();
  const provider = await customDb.findProviderByUserId(profile.id);
  const { token } = await customDb.createSession(profile.id, profile.role, 7, credentials.userAgent);
  const user = await sanitizeUser(profile, provider || undefined, customDb);

  return {
    token,
    user
  };
}

// 3. User Logout
export async function logoutUser(token: string, customDb: DatabaseEngine = getDefaultDb()): Promise<boolean> {
  if (!token) return false;
  return customDb.revokeSession(token);
}

// 4. Session Verification
export async function getUserByToken(token: string, customDb: DatabaseEngine = getDefaultDb()): Promise<AuthenticatedUser | undefined> {
  const active = await customDb.findActiveSession(token);
  if (!active) return undefined;
  return sanitizeUser(active.profile, active.provider, customDb);
}

// 4b. Change User Password & Revoke Old Sessions (N02.2)
export async function changeUserPassword(
  userId: string,
  currentPass: string,
  newPass: string,
  customDb: DatabaseEngine = getDefaultDb()
): Promise<boolean> {
  const profile = await customDb.findProfileById(userId);
  if (!profile) {
    throw new Error('Người dùng không tồn tại');
  }
  if (!verifyPassword(currentPass, profile.passwordHash)) {
    throw new Error('Mật khẩu hiện tại không chính xác');
  }
  const weak = checkPassword(newPass ?? '', profile.email);
  if (weak) throw new Error(weak);
  const newHash = hashPassword(newPass);
  // Không dùng hàm của bootstrap admin: hàm đó đặt role = 'admin'.
  await customDb.updatePasswordAndRevokeSessions(userId, newHash);
  return true;
}

// 5. Bootstrap Initial Admin (R3: Explicit Parameters, No Hardcoded Defaults, Atomic Password Updates & Revocation)
export async function bootstrapFirstAdmin(
  data: { email: string; password: string; fullName?: string; phone?: string },
  customDb: DatabaseEngine = getDefaultDb()
): Promise<AuthenticatedUser> {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('INVALID_EMAIL: Vui lòng cung cấp địa chỉ email hợp lệ.');
  }
  if (!data.password || data.password.length < 8) {
    throw new Error('WEAK_PASSWORD: Mật khẩu quản trị viên phải có tối thiểu 8 ký tự.');
  }

  const email = data.email.trim().toLowerCase();
  let profile = await customDb.findProfileByEmail(email);

  if (profile) {
    // Atomic update of password and revocation of all existing sessions (S3)
    const newHash = hashPassword(data.password);
    await customDb.updateAdminPasswordAndRevokeSessions(profile.id, newHash);
    const updated = await customDb.findProfileById(profile.id);
    return sanitizeUser(updated!, undefined, customDb);
  } else {
    // Creating fresh admin account
    profile = await customDb.createProfile({
      email,
      password: data.password,
      fullName: data.fullName?.trim() || 'Super Admin',
      phone: data.phone?.trim() || '',
      role: 'admin',
      isVerified: true
    });
    return sanitizeUser(profile, undefined, customDb);
  }
}
