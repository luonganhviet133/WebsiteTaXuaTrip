/**
 * Authentication & Authorization Module for Tà Xùa Trip
 * Backed by Cloudflare D1 Relational Engine
 */
import type { Request, Response, NextFunction } from 'express';
import { db, verifyPassword, hashPassword } from './db.ts';
import type { DatabaseEngine, ProfileRecord, ProviderRecord } from './db.ts';

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
}

export interface LoginInput {
  email?: string;
  phone?: string;
  identifier?: string;
  emailOrPhone?: string;
  password: string;
  turnstileToken?: string;
}

// Convert internal profile & provider to clean public representation
export async function sanitizeUser(profile: ProfileRecord, provider?: ProviderRecord, customDb: DatabaseEngine = db): Promise<AuthenticatedUser> {
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
export async function registerUser(input: RegisterInput, customDb: DatabaseEngine = db): Promise<{ token: string; user: AuthenticatedUser }> {
  // STRICT RULE: Users CANNOT self-register as admin!
  if (input.role === 'admin') {
    throw new Error('FORBIDDEN_ADMIN_REGISTRATION: Không được phép tự đăng ký tài khoản quản trị viên.');
  }

  const rawContact = (input.email || input.emailOrPhone || input.identifier || input.phone || '').trim();
  if (!rawContact) {
    throw new Error('INVALID_CONTACT: Vui lòng nhập email hoặc số điện thoại.');
  }

  if (!input.password || input.password.length < 6) {
    throw new Error('WEAK_PASSWORD: Mật khẩu phải có tối thiểu 6 ký tự.');
  }

  if (!input.fullName || !input.fullName.trim()) {
    throw new Error('INVALID_NAME: Vui lòng nhập họ và tên.');
  }

  const isEmail = rawContact.includes('@');
  const email = isEmail ? rawContact.toLowerCase() : `${rawContact.replace(/\s+/g, '')}@taxuatrip.user`;
  const phone = isEmail ? (input.phone?.trim() || '') : rawContact.replace(/\s+/g, '');

  // Check existing user
  const existing = await customDb.findProfileByEmail(email);
  if (existing) {
    throw new Error('EMAIL_EXISTS: Email hoặc số điện thoại này đã được đăng ký.');
  }

  const role: 'traveler' | 'partner' = input.role === 'partner' ? 'partner' : 'traveler';

  // Create user profile
  const profile = await customDb.createProfile({
    email,
    password: input.password,
    fullName: input.fullName.trim(),
    phone,
    role,
    isVerified: false // Regular registration is NEVER automatically verified
  });

  let provider: ProviderRecord | undefined;
  if (role === 'partner') {
    // STRICT RULE: Partner registration creates an unverified provider with ZERO listings owned!
    provider = await customDb.createProvider({
      userId: profile.id,
      businessName: input.facilityName?.trim() || `Cơ sở của ${profile.fullName}`,
      phone: profile.phone,
      verificationStatus: 'unverified'
    });
  }

  // Create active session
  const { token } = await customDb.createSession(profile.id, profile.role);
  const user = await sanitizeUser(profile, provider, customDb);

  return {
    token,
    user
  };
}

// 2. User Login (Unified Email & Phone Support - R9)
export async function loginUser(credentials: LoginInput, customDb: DatabaseEngine = db): Promise<{ token: string; user: AuthenticatedUser }> {
  const rawIdentifier = (credentials.identifier || credentials.emailOrPhone || credentials.email || credentials.phone || '').trim();
  if (!rawIdentifier || !credentials.password) {
    throw new Error('INVALID_CREDENTIALS: Vui lòng nhập đầy đủ email/số điện thoại và mật khẩu.');
  }

  const profile = await customDb.findProfileByIdentifier(rawIdentifier);
  if (!profile) {
    throw new Error('INVALID_CREDENTIALS: Email/Số điện thoại hoặc mật khẩu không chính xác.');
  }

  const isValid = verifyPassword(credentials.password, profile.passwordHash);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS: Email/Số điện thoại hoặc mật khẩu không chính xác.');
  }

  const provider = await customDb.findProviderByUserId(profile.id);
  const { token } = await customDb.createSession(profile.id, profile.role);
  const user = await sanitizeUser(profile, provider || undefined, customDb);

  return {
    token,
    user
  };
}

// 3. User Logout
export async function logoutUser(token: string, customDb: DatabaseEngine = db): Promise<boolean> {
  if (!token) return false;
  return customDb.revokeSession(token);
}

// 4. Session Verification
export async function getUserByToken(token: string, customDb: DatabaseEngine = db): Promise<AuthenticatedUser | undefined> {
  const active = await customDb.findActiveSession(token);
  if (!active) return undefined;
  return sanitizeUser(active.profile, active.provider, customDb);
}

// 4b. Change User Password & Revoke Old Sessions (N02.2)
export async function changeUserPassword(
  userId: string,
  currentPass: string,
  newPass: string,
  customDb: DatabaseEngine = db
): Promise<boolean> {
  const profile = await customDb.findProfileById(userId);
  if (!profile) {
    throw new Error('Người dùng không tồn tại');
  }
  if (!verifyPassword(currentPass, profile.passwordHash)) {
    throw new Error('Mật khẩu hiện tại không chính xác');
  }
  if (!newPass || newPass.length < 8) {
    throw new Error('Mật khẩu mới phải có tối thiểu 8 ký tự');
  }
  const newHash = hashPassword(newPass);
  await customDb.updateAdminPasswordAndRevokeSessions(userId, newHash);
  return true;
}

// 5. Bootstrap Initial Admin (R3: Explicit Parameters, No Hardcoded Defaults, Atomic Password Updates & Revocation)
export async function bootstrapFirstAdmin(
  data: { email: string; password: string; fullName?: string; phone?: string },
  customDb: DatabaseEngine = db
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

// Express Request Extension
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  token?: string;
}

// Auth Middleware Factory
export function createAuthMiddleware(customDb: DatabaseEngine = db) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization || '';
    let token = '';

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.headers['x-session-token']) {
      token = String(req.headers['x-session-token']).trim();
    }

    if (token) {
      try {
        const user = await getUserByToken(token, customDb);
        if (user) {
          req.user = user;
          req.token = token;
        }
      } catch {
        // Token error ignored, remains unauthenticated
      }
    }
    next();
  };
}

export const authenticate = createAuthMiddleware(db);

// Require authenticated user
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'UNAUTHORIZED: Yêu cầu đăng nhập hoặc phiên làm việc đã hết hạn.',
      timestamp: new Date().toISOString()
    });
    return;
  }
  next();
}

// Require specific role (RBAC)
export function requireRole(...allowedRoles: Array<'traveler' | 'partner' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'UNAUTHORIZED: Yêu cầu đăng nhập.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `FORBIDDEN: Vai trò '${req.user.role}' không có quyền thực hiện hành động này.`,
        requiredRoles: allowedRoles,
        timestamp: new Date().toISOString()
      });
      return;
    }
    next();
  };
}
