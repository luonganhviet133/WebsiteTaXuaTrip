/** R1 — Tài khoản: cấu hình, quên/đặt lại mật khẩu, hồ sơ, xác minh email, phiên đăng nhập. */
const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

export type Outcome<T> = { ok: true; data: T; already?: boolean } | { ok: false; status: number; code: string; message: string };

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

export interface AuthConfig {
  emailEnabled: boolean;
  passwordMin: number;
  termsVersion: string;
}
export interface MyProfile {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  role: 'traveler' | 'partner' | 'admin';
  emailVerified: boolean;
  termsAccepted: boolean;
  businessName: string | null;
  partnerVerification: 'unverified' | 'pending' | 'verified' | 'rejected' | null;
  createdAt: string;
  emailEnabled: boolean;
}
export interface SessionItem {
  id: string;
  device: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

export const accountApi = {
  config: () => call<AuthConfig>('GET', '/api/auth/config'),
  forgot: (email: string, turnstileToken?: string) => call<{ message: string }>('POST', '/api/auth/forgot-password', { email, turnstileToken }),
  reset: (email: string, code: string, newPassword: string) => call<{ message: string }>('POST', '/api/auth/reset-password', { email, code, newPassword }),
  profile: () => call<MyProfile>('GET', '/api/me/profile'),
  updateProfile: (body: { fullName: string; phone: string; businessName?: string }) => call<MyProfile>('PUT', '/api/me/profile', body),
  sendEmailCode: () => call<{ sentTo: string }>('POST', '/api/me/email/send-code'),
  verifyEmail: (code: string) => call<{ emailVerified: boolean }>('POST', '/api/me/email/verify', { code }),
  sessions: () => call<SessionItem[]>('GET', '/api/me/sessions'),
  revokeSession: (id: string) => call<{ revoked: number }>('DELETE', `/api/me/sessions/${encodeURIComponent(id)}`),
  revokeOthers: () => call<{ revoked: number }>('POST', '/api/me/sessions/revoke-others'),
  changePassword: async (currentPassword: string, newPassword: string): Promise<Outcome<null>> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: any = await res.json().catch(() => null);
      if (res.ok && data?.success) return { ok: true, data: null };
      return { ok: false, status: res.status, code: `HTTP_${res.status}`, message: data?.error || 'Không đổi được mật khẩu.' };
    } catch {
      return { ok: false, status: 0, code: 'NETWORK', message: 'Mất kết nối máy chủ. Vui lòng thử lại.' };
    }
  },
};
