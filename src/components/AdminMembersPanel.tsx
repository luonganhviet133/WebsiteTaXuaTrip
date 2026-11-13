/**
 * R2 — Admin: Thành viên & Đối tác.
 * Số liệu tổng quan lấy thật từ D1. Mọi thao tác cần lý do và được ghi nhật ký; không thao tác trên chính mình.
 * Mã đặt lại mật khẩu chỉ hiện một lần để admin đọc cho khách qua điện thoại.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  adminMembersApi,
  ACTION_LABEL,
  ROLE_LABEL,
  VERIFY_LABEL,
  type AdminOverview,
  type BackupStatus,
  type Member,
  type MemberDetail,
  type MemberFilter,
  type MemberPage,
  type MemberRole,
} from '../api/adminMembersApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';

const ROLE_STYLE: Record<MemberRole, string> = { traveler: 'bg-slate-700', partner: 'bg-amber-700', admin: 'bg-rose-700' };
const VERIFY_STYLE: Record<string, string> = { pending: 'bg-sky-700', verified: 'bg-emerald-700', rejected: 'bg-slate-600', unverified: 'bg-slate-600' };

const Stat: React.FC<{ label: string; value: number | string; tone?: string; onClick?: () => void }> = ({ label, value, tone = 'text-white', onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="bg-slate-900 border border-slate-700 rounded-2xl p-3 text-left enabled:hover:border-teal-500 enabled:cursor-pointer disabled:cursor-default"
  >
    <div className={`text-xl font-black ${tone}`}>{value}</div>
    <div className="text-xs text-slate-400 font-semibold">{label}</div>
  </button>
);

const Badges: React.FC<{ m: Member }> = ({ m }) => (
  <div className="flex flex-wrap gap-1.5">
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_STYLE[m.role]}`}>{ROLE_LABEL[m.role]}</span>
    {m.status === 'locked' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600">Đã khóa</span>}
    {m.loginLocked && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-600">Khóa tạm (sai mật khẩu)</span>}
    {m.partnerVerification && m.role === 'partner' && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${VERIFY_STYLE[m.partnerVerification]}`}>{VERIFY_LABEL[m.partnerVerification]}</span>
    )}
    {m.email && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.emailVerified ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-800 text-slate-300'}`}>{m.emailVerified ? 'Email đã xác minh' : 'Email chưa xác minh'}</span>}
  </div>
);

const MemberActions: React.FC<{ member: MemberDetail; onChanged: (message: string) => void }> = ({ member, onChanged }) => {
  const [reason, setReason] = useState('');
  const [role, setRole] = useState<MemberRole>(member.role);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [code, setCode] = useState<{ code: string; expiresAt: string; loginWith: string } | null>(null);
  useEffect(() => setRole(member.role), [member.role]);

  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(true);
    setNotice(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) return setNotice({ ok: false, text: r.message });
    setReason('');
    if (r.data && 'code' in r.data) {
      setCode(r.data);
      setNotice({ ok: true, text: label });
      return;
    }
    const text = r.already ? 'Không có gì thay đổi (đã ở trạng thái này).' : label;
    setNotice({ ok: true, text });
    if (!r.already) onChanged(text);
  };

  const btn = 'px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`reason-${member.id}`} className="block text-xs font-bold text-slate-300 mb-1">
          Lý do / ghi chú (bắt buộc, lưu vào nhật ký):
        </label>
        <textarea
          id={`reason-${member.id}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ví dụ: Đã gọi 09xx xác nhận chủ cơ sở / Khách gọi điện quên mật khẩu"
          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {member.status === 'active' ? (
          <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã khóa tài khoản. Mọi phiên đăng nhập đã mất hiệu lực.', () => adminMembersApi.lock(member.id, reason))} className={`${btn} bg-rose-700 hover:bg-rose-600 text-white`}>
            Khóa tài khoản
          </button>
        ) : null}
        {(member.status === 'locked' || member.loginLocked) && (
          <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã mở khóa.', () => adminMembersApi.unlock(member.id, reason))} className={`${btn} bg-emerald-700 hover:bg-emerald-600 text-white`}>
            Mở khóa
          </button>
        )}
        {member.status === 'active' && (
          <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã cấp mã. Đọc mã này cho chủ tài khoản qua điện thoại.', () => adminMembersApi.resetCode(member.id, reason))} className={`${btn} bg-slate-700 hover:bg-slate-600 text-white`}>
            Cấp mã đặt lại mật khẩu
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`role-${member.id}`} className="block text-xs font-bold text-slate-300 mb-1">Vai trò:</label>
          <select id={`role-${member.id}`} value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className="px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white">
            {(Object.keys(ROLE_LABEL) as MemberRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={busy || role === member.role || !reason.trim()}
          onClick={() => run(`Đã đổi vai trò thành ${ROLE_LABEL[role]}. Người này cần đăng nhập lại.`, () => adminMembersApi.setRole(member.id, role, reason))}
          className={`${btn} bg-indigo-700 hover:bg-indigo-600 text-white`}
        >
          Đổi vai trò
        </button>
      </div>

      {member.role === 'partner' && member.partnerVerification && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Xác minh đối tác:</span>
          {member.partnerVerification !== 'verified' && (
            <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã xác minh đối tác.', () => adminMembersApi.verifyPartner(member.id, 'verified', reason))} className={`${btn} bg-emerald-700 hover:bg-emerald-600 text-white`}>
              Đã xác minh
            </button>
          )}
          {member.partnerVerification !== 'rejected' && (
            <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã từ chối xác minh.', () => adminMembersApi.verifyPartner(member.id, 'rejected', reason))} className={`${btn} bg-slate-700 hover:bg-slate-600 text-white`}>
              Từ chối
            </button>
          )}
          {member.partnerVerification !== 'pending' && (
            <button type="button" disabled={busy || !reason.trim()} onClick={() => run('Đã chuyển về chờ xác minh.', () => adminMembersApi.verifyPartner(member.id, 'pending', reason))} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-200`}>
              Chuyển về chờ
            </button>
          )}
        </div>
      )}

      {notice && (
        <p role="status" className={`text-xs font-bold ${notice.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {notice.text}
        </p>
      )}
      {code && (
        <div className="bg-slate-950 border border-amber-500/60 rounded-2xl p-3 space-y-1">
          <div className="text-xs text-amber-200 font-bold">Mã đặt lại mật khẩu (chỉ hiện một lần, không lưu lại):</div>
          <div className="text-2xl font-black tracking-[0.35em] text-amber-300 font-mono" data-testid="reset-code">{code.code}</div>
          <p className="text-xs text-slate-300 break-words">
            Hết hạn {formatCreatedAt(code.expiresAt)}. Khách mở Đăng nhập → Quên mật khẩu → "Tôi đã có mã từ Tà Xùa Trip", nhập <b>{code.loginWith}</b>, mã này và mật khẩu mới.
          </p>
          <button type="button" onClick={() => setCode(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Ẩn mã</button>
        </div>
      )}
    </div>
  );
};

const MemberRow: React.FC<{ m: Member; currentUserId?: string; onChanged: (message: string) => void }> = ({ m, currentUserId, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadDetail = useCallback(async () => {
    const r = await adminMembersApi.detail(m.id);
    if (r.ok) setDetail(r.data);
    else setError(r.message);
  }, [m.id]);
  useEffect(() => {
    if (open) void loadDetail();
  }, [open, loadDetail]);
  const isSelf = m.id === currentUserId;
  return (
    <li className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-bold text-white break-words">
            {m.fullName} {isSelf && <span className="text-xs text-teal-300">(bạn)</span>}
            {m.businessName && <span className="text-slate-300 font-semibold"> · {m.businessName}</span>}
          </div>
          <div className="text-xs text-slate-300 break-all">
            {m.email || 'Chưa có email'} · {m.phone || 'Chưa có SĐT'}
          </div>
          <Badges m={m} />
          {m.status === 'locked' && m.statusReason && <div className="text-xs text-rose-300 break-words">Lý do khóa: {m.statusReason}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Tham gia {formatCreatedAt(m.createdAt)}</span>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold cursor-pointer">
            {open ? 'Thu gọn' : 'Chi tiết'}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-700 pt-3 space-y-3">
          {error && <p className="text-xs text-rose-300">{error}</p>}
          {detail && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                <div>Phiên đang mở: <b className="text-white">{detail.activeSessions}</b></div>
                <div>Đơn đặt: <b className="text-white">{detail.bookings}</b></div>
                <div>Cơ sở sở hữu: <b className="text-white">{detail.ownedListings}</b></div>
                <div>Đăng nhập gần nhất: <b className="text-white">{detail.lastLoginAt ? formatCreatedAt(detail.lastLoginAt) : 'chưa có'}</b></div>
              </div>
              {isSelf ? (
                <p className="text-xs text-slate-400">Không tự thao tác trên tài khoản của chính mình. Nhờ quản trị viên khác nếu cần.</p>
              ) : (
                <MemberActions
                  member={detail}
                  onChanged={(message) => {
                    void loadDetail();
                    onChanged(`${m.fullName}: ${message}`);
                  }}
                />
              )}
              <div>
                <div className="text-xs font-bold text-slate-300 mb-1">Nhật ký quản trị</div>
                {detail.history.length === 0 ? (
                  <p className="text-xs text-slate-500">Chưa có thao tác nào.</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.history.map((h, i) => (
                      <li key={i} className="text-xs text-slate-300 break-words">
                        <span className="text-slate-500">{formatCreatedAt(h.at)}</span> · <b>{ACTION_LABEL[h.action] || h.action}</b>
                        {h.action === 'member.role' && ` ${ROLE_LABEL[h.detail.from as MemberRole] ?? h.detail.from} → ${ROLE_LABEL[h.detail.to as MemberRole] ?? h.detail.to}`}
                        {h.action === 'partner.verify' && `: ${VERIFY_LABEL[h.detail.status] ?? h.detail.status}`} · {h.actorName}
                        {h.reason && <span className="text-slate-400"> — {h.reason}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
};

/** R3: tình trạng sao lưu D1 (chạy trong Cloudflare, không cần token). */
const BackupCard: React.FC = () => {
  const [st, setSt] = useState<BackupStatus | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await adminMembersApi.backupStatus();
    if (r.ok) setSt(r.data);
    else if (r.code === 'BACKUP_NOT_CONFIGURED') setMsg({ ok: false, text: r.message });
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const run = async () => {
    setBusy(true);
    const r = await adminMembersApi.runBackup();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.message });
    setSt(r.data);
    setMsg({
      ok: true,
      text: r.data.running ? 'Đã bắt đầu sao lưu. Hệ thống chạy tiếp mỗi 5 phút đến khi xong.' : 'Đã sao lưu xong.',
    });
  };
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2" data-testid="backup-card">
      <div className="text-xs text-slate-300 min-w-0 break-words">
        <b className="text-white">Sao lưu dữ liệu:</b>{' '}
        {st?.running
          ? `đang chạy (${st.running.tablesDone}/${st.running.tablesTotal} bảng, bắt đầu ${formatCreatedAt(st.running.startedAt)})`
          : st?.latest
            ? `bản gần nhất ${formatCreatedAt(st.latest.finishedAt)} · ${st.latest.totalRows.toLocaleString('vi-VN')} dòng · ${Object.keys(st.latest.tables).length} bảng`
            : 'chưa có bản nào'}
        <span className="text-slate-500"> · tự động 03:17 sáng Chủ nhật, giữ 12 bản</span>
        {msg && <span role="status" className={`block font-bold ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</span>}
      </div>
      <button type="button" onClick={run} disabled={busy || !!st?.running} className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        {busy ? 'Đang sao lưu…' : 'Sao lưu ngay'}
      </button>
    </div>
  );
};

export const AdminMembersPanel: React.FC<{ currentUserId?: string }> = ({ currentUserId }) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [filter, setFilter] = useState<MemberFilter>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<MemberPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Sau thao tác, thành viên có thể rời khỏi bộ lọc hiện tại (ví dụ vừa xác minh xong) → báo ở cấp trang.
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(async (f: MemberFilter) => {
    const [o, l] = await Promise.all([adminMembersApi.overview(), adminMembersApi.list(f)]);
    if (o.ok) setOverview(o.data);
    if (l.ok) {
      setPage(l.data);
      setError(null);
    } else setError(l.message);
  }, []);
  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const apply = (patch: MemberFilter) => setFilter((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const pages = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1;
  const select = 'px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white';

  return (
    <div className="bg-slate-850 border border-slate-750 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
      <h3 className="text-base font-extrabold text-white">Thành viên & Đối tác</h3>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Stat label="Khách" value={overview.members.traveler} onClick={() => { setSearch(''); setFilter({ role: 'traveler' }); }} />
          <Stat label="Đối tác" value={overview.members.partner} onClick={() => { setSearch(''); setFilter({ role: 'partner' }); }} />
          <Stat label="Đối tác chờ xác minh" value={overview.partnersPending} tone={overview.partnersPending ? 'text-sky-300' : 'text-white'} onClick={() => { setSearch(''); setFilter({ role: 'partner', verification: 'pending' }); }} />
          <Stat label="Quản trị" value={overview.members.admin} onClick={() => { setSearch(''); setFilter({ role: 'admin' }); }} />
          <Stat label="Đang bị khóa" value={overview.members.locked} tone={overview.members.locked ? 'text-rose-300' : 'text-white'} onClick={() => { setSearch(''); setFilter({ status: 'locked' }); }} />
          <Stat label="Thành viên mới 7 ngày" value={overview.newMembers7d} />
        </div>
      )}
      {overview && (
        <p className="text-xs text-slate-400">
          Đơn đặt: <b className="text-slate-200">{overview.totalBookings}</b> · Cơ sở trên web: <b className="text-slate-200">{overview.listings}</b> · Khiếu nại chưa đóng:{' '}
          <b className="text-slate-200">{overview.openComplaints}</b>
        </p>
      )}

      <BackupCard />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="member-search" className="block text-xs font-bold text-slate-300 mb-1">Tìm theo tên, email, SĐT, tên cơ sở:</label>
          <input id="member-search" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white" />
        </div>
        <select aria-label="Lọc vai trò" value={filter.role || ''} onChange={(e) => apply({ role: e.target.value || undefined })} className={select}>
          <option value="">Mọi vai trò</option>
          <option value="traveler">Khách</option>
          <option value="partner">Đối tác</option>
          <option value="admin">Quản trị</option>
        </select>
        <select aria-label="Lọc trạng thái" value={filter.status || ''} onChange={(e) => apply({ status: e.target.value || undefined })} className={select}>
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <select aria-label="Lọc xác minh đối tác" value={filter.verification || ''} onChange={(e) => apply({ verification: e.target.value || undefined })} className={select}>
          <option value="">Mọi xác minh</option>
          <option value="pending">Chờ xác minh</option>
          <option value="verified">Đã xác minh</option>
          <option value="rejected">Từ chối</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-black cursor-pointer">Tìm</button>
        {(filter.q || filter.role || filter.status || filter.verification) && (
          <button type="button" onClick={() => { setSearch(''); setFilter({}); }} className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer">
            Bỏ lọc
          </button>
        )}
      </form>

      {error && <p className="text-xs text-rose-300">{error}</p>}
      {lastAction && (
        <p role="status" data-testid="members-last-action" className="text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-xl px-3 py-2 break-words">
          {lastAction}
        </p>
      )}
      {page && (
        <>
          <p className="text-xs text-slate-400">{page.total} thành viên</p>
          {page.items.length === 0 ? (
            <p className="text-xs text-slate-400">Không có thành viên nào khớp.</p>
          ) : (
            <ul className="space-y-2">
              {page.items.map((m) => (
                <MemberRow
                  key={m.id}
                  m={m}
                  currentUserId={currentUserId}
                  onChanged={(message) => {
                    setLastAction(message);
                    void load(filter);
                  }}
                />
              ))}
            </ul>
          )}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-xs text-slate-300">
              <button type="button" disabled={page.page <= 1} onClick={() => apply({ page: page.page - 1 })} className="px-3 py-1.5 rounded-xl bg-slate-800 disabled:opacity-40 cursor-pointer">← Trước</button>
              <span>Trang {page.page}/{pages}</span>
              <button type="button" disabled={page.page >= pages} onClick={() => apply({ page: page.page + 1 })} className="px-3 py-1.5 rounded-xl bg-slate-800 disabled:opacity-40 cursor-pointer">Sau →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
