/** R2 — Admin: thành viên & đối tác. */
import type { Outcome } from './accountApi.ts';

const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

async function call<T>(method: string, path: string, body?: unknown): Promise<Outcome<T>> {
  try {
    const headers: Record<string, string> = {};
    if (token()) headers.Authorization = `Bearer ${token()}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, data: data.data as T, already: data.already };
    return { ok: false, status: res.status, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không thực hiện được.' };
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
  }
}

export type MemberRole = 'traveler' | 'partner' | 'admin';
export type PartnerVerification = 'pending' | 'verified' | 'rejected' | 'unverified';

export interface Member {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  role: MemberRole;
  status: 'active' | 'locked';
  statusReason: string | null;
  emailVerified: boolean;
  loginLocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  businessName: string | null;
  partnerVerification: PartnerVerification | null;
}
export interface MemberDetail extends Member {
  activeSessions: number;
  bookings: number;
  ownedListings: number;
  history: { action: string; at: string; actorName: string; reason: string | null; detail: Record<string, any> }[];
}
export interface MemberPage {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
}
export interface AdminOverview {
  members: { traveler: number; partner: number; admin: number; locked: number };
  partnersPending: number;
  newMembers7d: number;
  totalBookings: number;
  listings: number;
  openComplaints: number;
}
export interface BackupStatus {
  latest: { runId: string; reason: string; startedAt: string; finishedAt: string; totalRows: number; files: number; tables: Record<string, number> } | null;
  running: { runId: string; startedAt: string; tablesDone: number; tablesTotal: number } | null;
}

export interface MemberFilter {
  q?: string;
  role?: string;
  status?: string;
  verification?: string;
  page?: number;
}

export function memberQuery(f: MemberFilter): string {
  const p = new URLSearchParams();
  if (f.q?.trim()) p.set('q', f.q.trim());
  if (f.role) p.set('role', f.role);
  if (f.status) p.set('status', f.status);
  if (f.verification) p.set('verification', f.verification);
  if (f.page && f.page > 1) p.set('page', String(f.page));
  const s = p.toString();
  return s ? `?${s}` : '';
}

const path = (id: string, action = '') => `/api/admin/members/${encodeURIComponent(id)}${action ? `/${action}` : ''}`;

export const adminMembersApi = {
  overview: () => call<AdminOverview>('GET', '/api/admin/overview'),
  backupStatus: () => call<BackupStatus>('GET', '/api/admin/backups'),
  runBackup: () => call<BackupStatus & { runId: string; state: string }>('POST', '/api/admin/backups/run'),
  list: (f: MemberFilter) => call<MemberPage>('GET', `/api/admin/members${memberQuery(f)}`),
  detail: (id: string) => call<MemberDetail>('GET', path(id)),
  lock: (id: string, reason: string) => call<Member>('POST', path(id, 'lock'), { reason }),
  unlock: (id: string, reason: string) => call<Member>('POST', path(id, 'unlock'), { reason }),
  setRole: (id: string, role: MemberRole, reason: string) => call<Member>('POST', path(id, 'role'), { role, reason }),
  verifyPartner: (id: string, status: 'pending' | 'verified' | 'rejected', note: string) => call<Member>('POST', path(id, 'partner-verification'), { status, note }),
  resetCode: (id: string, reason: string) => call<{ code: string; expiresAt: string; loginWith: string }>('POST', path(id, 'reset-code'), { reason }),
};

export const ROLE_LABEL: Record<MemberRole, string> = { traveler: 'Khách', partner: 'Đối tác', admin: 'Quản trị' };
export const VERIFY_LABEL: Record<string, string> = { pending: 'Chờ xác minh', verified: 'Đã xác minh', rejected: 'Từ chối', unverified: 'Chưa gửi' };
export const ACTION_LABEL: Record<string, string> = {
  'member.lock': 'Khóa tài khoản',
  'member.unlock': 'Mở khóa',
  'member.role': 'Đổi vai trò',
  'member.reset_code': 'Cấp mã đặt lại mật khẩu',
  'partner.verify': 'Xác minh đối tác',
};
