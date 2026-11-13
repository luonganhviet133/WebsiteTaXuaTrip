/**
 * R1 — Tài khoản của tôi: thông tin cá nhân, xác minh email (mã 6 số), đổi mật khẩu, thiết bị đang đăng nhập.
 * Mọi thay đổi lưu ở server; email chưa bật (gói Free) thì nút gửi mã báo "sắp ra mắt".
 */
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { accountApi, type MyProfile, type SessionItem } from '../api/accountApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';

type Tab = 'info' | 'password' | 'devices';
const input = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900';
const btn = 'px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50';
const PARTNER_STATUS: Record<string, string> = {
  pending: 'Chờ Tà Xùa Trip liên hệ xác minh',
  unverified: 'Chưa xác minh',
  verified: 'Đã xác minh',
  rejected: 'Chưa đạt xác minh — liên hệ Tà Xùa Trip',
};

const Notice: React.FC<{ n: { ok: boolean; text: string } | null }> = ({ n }) =>
  n ? <p role="status" className={`text-xs font-bold ${n.ok ? 'text-emerald-800' : 'text-rose-700'}`}>{n.text}</p> : null;

const InfoTab: React.FC<{ onSaved: (p: MyProfile) => void }> = ({ onSaved }) => {
  const [p, setP] = useState<MyProfile | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', businessName: '' });
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [mailNotice, setMailNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const r = await accountApi.profile();
    if (!r.ok) return setNotice({ ok: false, text: r.message });
    setP(r.data);
    setForm({ fullName: r.data.fullName, phone: r.data.phone, businessName: r.data.businessName || '' });
  };
  useEffect(() => {
    void load();
  }, []);
  if (!p) return <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" aria-label="Đang tải" />;

  return (
    <div className="space-y-5">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await accountApi.updateProfile({ fullName: form.fullName, phone: form.phone, ...(p.role === 'partner' ? { businessName: form.businessName } : {}) });
          setBusy(false);
          if (!r.ok) return setNotice({ ok: false, text: r.message });
          setP(r.data);
          onSaved(r.data);
          setNotice({ ok: true, text: 'Đã lưu thông tin.' });
        }}
      >
        <label className="block text-xs font-bold text-slate-700">
          Họ và tên
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={`${input} mt-1`} autoComplete="name" required />
        </label>
        <label className="block text-xs font-bold text-slate-700">
          Số điện thoại{p.role === 'partner' ? '' : ' (không bắt buộc)'}
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${input} mt-1`} inputMode="tel" autoComplete="tel" placeholder="0912345678" />
        </label>
        {p.role === 'partner' && (
          <label className="block text-xs font-bold text-slate-700">
            Tên cơ sở / doanh nghiệp
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={`${input} mt-1`} />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={`${btn} bg-brand-800 text-white`}>Lưu thông tin</button>
          <Notice n={notice} />
        </div>
      </form>

      {p.role === 'partner' && p.partnerVerification && (
        <p className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-slate-800">
          Xác minh đối tác: <strong>{PARTNER_STATUS[p.partnerVerification] || p.partnerVerification}</strong>. Tà Xùa Trip gọi theo số điện thoại trên để xác minh; chưa cần gửi giấy tờ.
        </p>
      )}

      <section aria-label="Email" className="border-t border-slate-200 pt-4 space-y-2">
        <p className="text-sm font-extrabold text-slate-900">Email</p>
        {p.email ? (
          <p className="text-sm text-slate-800 break-all">
            {p.email}{' '}
            <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${p.emailVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}>
              {p.emailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
            </span>
          </p>
        ) : (
          <p className="text-xs text-slate-700">Tài khoản chưa có email. Liên hệ Tà Xùa Trip để thêm email (cần để lấy lại mật khẩu).</p>
        )}
        {p.email && !p.emailVerified && (
          p.emailEnabled ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={busy}
                className={`${btn} bg-white border border-slate-300 text-slate-800`}
                onClick={async () => {
                  setBusy(true);
                  const r = await accountApi.sendEmailCode();
                  setBusy(false);
                  setMailNotice(r.ok ? { ok: true, text: `Đã gửi mã đến ${r.data.sentTo}. Mã có hiệu lực 15 phút.` } : { ok: false, text: r.message });
                }}
              >
                Gửi mã xác minh
              </button>
              <form
                className="flex flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await accountApi.verifyEmail(code);
                  if (!r.ok) return setMailNotice({ ok: false, text: r.message });
                  setCode('');
                  setMailNotice({ ok: true, text: 'Đã xác minh email.' });
                  void load();
                }}
              >
                <label htmlFor="verify-code" className="sr-only">Mã 6 số</label>
                <input id="verify-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} maxLength={6} inputMode="numeric" autoComplete="one-time-code" placeholder="Mã 6 số" className={`${input} w-36 tracking-[0.3em] font-bold`} />
                <button type="submit" disabled={code.length !== 6} className={`${btn} bg-brand-800 text-white`}>Xác minh</button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">Xác minh email bằng mã gửi qua email: sắp ra mắt.</p>
          )
        )}
        <Notice n={mailNotice} />
      </section>
    </div>
  );
};

const PasswordTab: React.FC<{ onLoggedOut: () => void }> = ({ onLoggedOut }) => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (form.next !== form.confirm) return setNotice({ ok: false, text: 'Mật khẩu xác nhận không khớp.' });
        const r = await accountApi.changePassword(form.current, form.next);
        if (!r.ok) return setNotice({ ok: false, text: r.message });
        setNotice({ ok: true, text: 'Đã đổi mật khẩu. Mọi thiết bị đã được đăng xuất, vui lòng đăng nhập lại.' });
        setTimeout(onLoggedOut, 1500);
      }}
    >
      <label className="block text-xs font-bold text-slate-700">
        Mật khẩu hiện tại
        <input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} className={`${input} mt-1`} required />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        Mật khẩu mới (tối thiểu 8 ký tự)
        <input type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} className={`${input} mt-1`} required />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        Nhập lại mật khẩu mới
        <input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={`${input} mt-1`} required />
      </label>
      <p className="text-xs text-slate-600">Đổi mật khẩu sẽ đăng xuất tài khoản trên mọi thiết bị.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${btn} bg-brand-800 text-white`}>Đổi mật khẩu</button>
        <Notice n={notice} />
      </div>
    </form>
  );
};

const DevicesTab: React.FC = () => {
  const [list, setList] = useState<SessionItem[] | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => accountApi.sessions().then((r) => (r.ok ? setList(r.data) : setNotice({ ok: false, text: r.message })));
  useEffect(() => {
    void load();
  }, []);
  if (!list) return <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" aria-label="Đang tải" />;
  const others = list.filter((s) => !s.current).length;
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-slate-200 border border-slate-200 rounded-2xl">
        {list.map((s) => (
          <li key={s.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="min-w-0">
              <span className="block font-bold text-slate-900">
                {s.device} {s.current && <span className="ml-1 text-xs font-bold text-emerald-800">(thiết bị này)</span>}
              </span>
              <span className="block text-xs text-slate-600">Đăng nhập {formatCreatedAt(s.createdAt)} · dùng gần nhất {formatCreatedAt(s.lastSeenAt)}</span>
            </span>
            {!s.current && (
              <button
                type="button"
                className={`${btn} bg-white border border-slate-300 text-rose-700`}
                onClick={async () => {
                  const r = await accountApi.revokeSession(s.id);
                  setNotice(r.ok ? { ok: true, text: 'Đã đăng xuất thiết bị.' } : { ok: false, text: r.message });
                  void load();
                }}
              >
                Đăng xuất
              </button>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <button
          type="button"
          className={`${btn} bg-rose-600 text-white`}
          onClick={async () => {
            const r = await accountApi.revokeOthers();
            setNotice(r.ok ? { ok: true, text: `Đã đăng xuất ${r.data.revoked} thiết bị khác.` } : { ok: false, text: r.message });
            void load();
          }}
        >
          Đăng xuất tất cả thiết bị khác ({others})
        </button>
      )}
      <Notice n={notice} />
    </div>
  );
};

export const AccountModal: React.FC<{ onClose: () => void; onProfileSaved: (p: MyProfile) => void; onLoggedOut: () => void }> = ({ onClose, onProfileSaved, onLoggedOut }) => {
  const [tab, setTab] = useState<Tab>('info');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 text-slate-900">
        <div className="flex items-center justify-between gap-3">
          <h2 id="account-title" className="text-lg font-black">Tài khoản của tôi</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div role="tablist" className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          {([['info', 'Thông tin'], ['password', 'Mật khẩu'], ['devices', 'Thiết bị']] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${tab === k ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'info' ? <InfoTab onSaved={onProfileSaved} /> : tab === 'password' ? <PasswordTab onLoggedOut={onLoggedOut} /> : <DevicesTab />}
        <p className="text-xs text-slate-600">
          <a href="/dieu-khoan" target="_blank" rel="noopener noreferrer" className="underline">Điều khoản sử dụng</a> ·{' '}
          <a href="/chinh-sach-du-lieu" target="_blank" rel="noopener noreferrer" className="underline">Chính sách dữ liệu cá nhân</a>
        </p>
      </div>
    </div>
  );
};
