/**
 * N06.3 — Khiếu nại (chủ dự án chốt 13/11/2026): khách mở từ khi cơ sở xác nhận cọc đến 7 ngày sau trả phòng;
 * cơ sở trả lời và gửi ảnh; admin nhận xử lý rồi kết luận. Kết luận và hoàn tiền tách riêng: cơ sở hoàn (có chứng từ),
 * khách xác nhận đã nhận mới đóng. Website không chuyển tiền. Một component cho ba bên (khách: nền sáng).
 */
import React, { useEffect, useState } from 'react';
import { feedbackApi, complaintButtons, type ComplaintActionName, type ComplaintMode, type ComplaintView } from '../api/feedbackApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';
import { formatVND } from '../utils/rules.ts';

const STATUS_TEXT: Record<string, string> = {
  open: 'Đã gửi — chờ Tà Xùa Trip nhận xử lý',
  in_review: 'Tà Xùa Trip đang xem bằng chứng hai bên',
  refund_pending: 'Đã kết luận — chờ cơ sở hoàn tiền',
  refund_reported: 'Cơ sở báo đã hoàn — chờ khách xác nhận',
  refund_disputed: 'Khách báo chưa nhận tiền hoàn — chờ Tà Xùa Trip',
  closed: 'Đã đóng',
};
const OUTCOME_TEXT: Record<string, string> = {
  withdrawn: 'Khách đã rút khiếu nại',
  rejected: 'Kết luận: không chấp nhận khiếu nại',
  upheld: 'Kết luận: khách đúng (không cần hoàn tiền)',
  refunded: 'Đã hoàn tiền, khách đã xác nhận',
};
const ACTION_TEXT: Record<ComplaintActionName, string> = {
  assign: 'Nhận xử lý',
  respond: 'Gửi trả lời',
  withdraw: 'Rút khiếu nại',
  conclude: 'Ghi kết luận',
  report_refund: 'Đã hoàn tiền',
  confirm_refund: 'Đã nhận tiền hoàn',
  refund_not_received: 'Chưa nhận được tiền',
  admin_confirm_refund: 'Xác nhận cơ sở đã hoàn',
  require_refund: 'Yêu cầu hoàn lại (hạn mới 3 ngày)',
};
const EVENT_TEXT: Record<string, string> = {
  open: 'Khách mở khiếu nại',
  respond: 'Cơ sở trả lời',
  assign: 'Admin nhận xử lý',
  withdraw: 'Khách rút khiếu nại',
  conclude: 'Admin kết luận',
  report_refund: 'Cơ sở báo đã hoàn',
  confirm_refund: 'Khách xác nhận đã nhận tiền',
  refund_not_received: 'Khách báo chưa nhận tiền',
  admin_confirm_refund: 'Admin xác nhận đã hoàn',
  require_refund: 'Admin yêu cầu hoàn lại',
};
const ROLE_TEXT: Record<string, string> = { traveler: 'khách', partner: 'cơ sở', admin: 'admin' };
const NOTE_REQUIRED: ComplaintActionName[] = ['respond', 'conclude', 'refund_not_received', 'admin_confirm_refund', 'require_refund'];

export const ComplaintPanel: React.FC<{ bookingId: string; mode: ComplaintMode; onChanged?: () => void }> = ({ bookingId, mode, onChanged }) => {
  const dark = mode !== 'guest';
  const [view, setView] = useState<ComplaintView | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [conclusion, setConclusion] = useState<'upheld' | 'rejected'>('upheld');
  const [form, setForm] = useState({ category: '', description: '' });
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    const r = await feedbackApi.complaint(bookingId);
    if (r.ok) setView(r.data);
  };
  useEffect(() => {
    void load();
  }, [bookingId]);

  const fileKey = view ? view.files.map((f) => f.id).join(',') : '';
  useEffect(() => {
    if (!view) return;
    let alive = true;
    const urls: string[] = [];
    Promise.all(view.files.map(async (f) => [f.id, await feedbackApi.complaintFileUrl(bookingId, f.id)] as const)).then((pairs) => {
      const next: Record<string, string> = {};
      for (const [k, u] of pairs) if (u) (next[k] = u), urls.push(u);
      if (alive) setThumbs(next);
    });
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fileKey, bookingId]);

  if (!view) return null;
  const c = view.complaint;
  const showOpen = mode === 'guest' && view.canOpen;
  if (!c && !showOpen) return null;
  if (!c && !expanded) {
    return (
      <button type="button" onClick={() => setExpanded(true)} className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 cursor-pointer">
        Khiếu nại dịch vụ
      </button>
    );
  }

  const k = dark
    ? { box: 'bg-slate-900 border-rose-500/40 text-slate-100', sub: 'text-slate-400', input: 'bg-slate-950 border-slate-600 text-white placeholder:text-slate-500', btn: 'bg-slate-700 hover:bg-slate-600 text-white' }
    : { box: 'bg-rose-50 border-rose-200 text-slate-900', sub: 'text-slate-600', input: 'bg-white border-slate-300 text-slate-900', btn: 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800' };

  const done = (res: Awaited<ReturnType<typeof feedbackApi.complaintAct>>, okText: string) => {
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setView(res.data);
    setNote('');
    setNotice({ ok: true, text: res.already ? 'Bước này đã được ghi trước đó.' : okText });
    onChanged?.();
  };

  const submitOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!form.category) return setNotice({ ok: false, text: 'Chọn loại vấn đề.' });
    if (form.description.trim().length < 20) return setNotice({ ok: false, text: 'Mô tả ít nhất 20 ký tự: chuyện gì xảy ra, khi nào, bạn mong giải quyết thế nào.' });
    setBusy(true);
    done(await feedbackApi.openComplaint(bookingId, form.category, form.description.trim()), 'Đã gửi khiếu nại. Bạn có thể gửi thêm ảnh bằng chứng.');
  };

  const run = async (action: ComplaintActionName) => {
    setNotice(null);
    if (NOTE_REQUIRED.includes(action) && note.trim().length < 3) return setNotice({ ok: false, text: 'Vui lòng ghi rõ nội dung (lưu vào lịch sử khiếu nại).' });
    const body: Record<string, unknown> = { note: note.trim() || undefined };
    if (action === 'conclude') Object.assign(body, { conclusion, refundAmount: conclusion === 'upheld' ? Number(amount || 0) : 0 });
    if (action === 'report_refund') body.amount = Number(amount || c?.refundAmount || 0);
    setBusy(true);
    done(await feedbackApi.complaintAct(bookingId, action, body), 'Đã ghi nhận.');
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setNotice({ ok: false, text: 'Ảnh tối đa 5 MB.' });
    setBusy(true);
    const res = await feedbackApi.complaintUpload(bookingId, file);
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setNotice({ ok: true, text: 'Đã lưu ảnh bằng chứng.' });
    await load();
  };

  const buttons = c ? complaintButtons(mode, c.status, view.refundOverdue) : [];
  const Thumbs: React.FC<{ title: string; role: string }> = ({ title, role }) => {
    const files = view.files.filter((f) => f.role === role);
    return files.length === 0 ? null : (
      <div>
        <p className={`text-xs font-bold mb-1 ${k.sub}`}>{title}</p>
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <a key={f.id} href={thumbs[f.id]} target="_blank" rel="noopener noreferrer">
              {thumbs[f.id] ? <img src={thumbs[f.id]} alt={title} className="w-16 h-16 rounded-xl object-cover border border-slate-400/40" /> : <span className="block w-16 h-16 rounded-xl bg-slate-400/20" />}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section aria-label="Khiếu nại" className={`border rounded-2xl p-4 space-y-3 ${k.box}`}>
      {c && (
        <>
          <div>
            <p className="text-sm font-extrabold">Khiếu nại · đơn {view.bookingCode}</p>
            <p className={`text-xs ${k.sub}`}>{c.categoryLabel} · gửi lúc {formatCreatedAt(c.createdAt)}</p>
          </div>
          <p className="text-sm font-bold">
            {c.status === 'closed' && c.outcome ? `✓ ${OUTCOME_TEXT[c.outcome]}` : STATUS_TEXT[c.status]}
            {c.status === 'refund_pending' && c.refundDueAt && (
              <span className={view.refundOverdue ? ' text-rose-500' : ''}> · {view.refundOverdue ? 'đã quá hạn' : 'hạn'} {formatCreatedAt(c.refundDueAt)}</span>
            )}
          </p>
          <ul className="text-xs space-y-1 break-words">
            <li>Khách: {c.description}</li>
            {c.ownerResponse && <li>Cơ sở trả lời: {c.ownerResponse}</li>}
            {c.conclusionNote && (
              <li>
                Kết luận của Tà Xùa Trip ({c.conclusion === 'upheld' ? 'khách đúng' : 'không chấp nhận'}): {c.conclusionNote}
                {c.refundAmount ? ` · Cơ sở hoàn ${formatVND(c.refundAmount)}` : ''}
              </li>
            )}
            {c.refundReportedAmount && <li>Cơ sở báo đã hoàn: <strong>{formatVND(c.refundReportedAmount)}</strong></li>}
          </ul>
          <Thumbs title="Ảnh của khách" role="guest" />
          <Thumbs title="Ảnh của cơ sở (gồm chứng từ hoàn)" role="owner" />
          <Thumbs title="Ảnh của Tà Xùa Trip" role="admin" />
        </>
      )}

      {showOpen && !expanded && (
        <button type="button" onClick={() => setExpanded(true)} className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${k.btn}`}>
          Mở khiếu nại mới
        </button>
      )}
      {showOpen && expanded && (
        <form onSubmit={(e) => void submitOpen(e)} className="space-y-2">
          <p className="text-sm font-extrabold">{c ? 'Mở khiếu nại mới' : 'Khiếu nại với Tà Xùa Trip'}</p>
          <p className={`text-xs ${k.sub}`}>Mở được đến {formatCreatedAt(view.openDeadline)}. Tà Xùa Trip xem bằng chứng hai bên rồi kết luận; nếu cần hoàn tiền, cơ sở hoàn trực tiếp cho bạn.</p>
          <label htmlFor={`cp-cat-${bookingId}`} className="block text-xs font-bold">Vấn đề</label>
          <select id={`cp-cat-${bookingId}`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`w-full rounded-xl border px-3 py-2 text-sm ${k.input}`}>
              <option value="">Chọn loại vấn đề</option>
              {Object.entries(view.categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
          </select>
          <label htmlFor={`cp-desc-${bookingId}`} className="block text-xs font-bold">Mô tả</label>
          <textarea id={`cp-desc-${bookingId}`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Chuyện gì xảy ra, khi nào; bạn mong được giải quyết thế nào" className={`w-full rounded-xl border px-3 py-2 text-sm ${k.input}`} />
          <button type="submit" disabled={busy} className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50">Gửi khiếu nại</button>
        </form>
      )}

      {c && c.status !== 'closed' && (
        <div className="space-y-2">
          {buttons.includes('conclude') && (
            <div className="flex flex-wrap items-center gap-2">
              <label className={`text-xs font-bold ${k.sub}`} htmlFor={`cp-concl-${bookingId}`}>Kết luận</label>
              <select id={`cp-concl-${bookingId}`} value={conclusion} onChange={(e) => setConclusion(e.target.value as any)} className={`rounded-xl border px-3 py-2 text-sm ${k.input}`}>
                <option value="upheld">Khách đúng</option>
                <option value="rejected">Không chấp nhận</option>
              </select>
              {conclusion === 'upheld' && (
                <>
                  <label className={`text-xs font-bold ${k.sub}`} htmlFor={`cp-amount-${bookingId}`}>Cơ sở hoàn (đ, 0 nếu không)</label>
                  <input id={`cp-amount-${bookingId}`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className={`w-32 rounded-xl border px-3 py-2 text-sm ${k.input}`} placeholder="0" />
                </>
              )}
            </div>
          )}
          {buttons.includes('report_refund') && (
            <div className="flex flex-wrap items-center gap-2">
              <label className={`text-xs font-bold ${k.sub}`} htmlFor={`cp-refund-${bookingId}`}>Số tiền đã hoàn (đ)</label>
              <input id={`cp-refund-${bookingId}`} inputMode="numeric" value={amount || String(c.refundAmount ?? '')} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className={`w-32 rounded-xl border px-3 py-2 text-sm ${k.input}`} />
            </div>
          )}
          {buttons.length > 0 && (
            <>
              <label htmlFor={`cp-note-${bookingId}`} className="sr-only">Ghi chú</label>
              <textarea
                id={`cp-note-${bookingId}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={mode === 'owner' ? 'Trả lời của cơ sở / ghi chú chuyển hoàn' : mode === 'admin' ? 'Căn cứ kết luận (bắt buộc)' : 'Ghi chú cho Tà Xùa Trip'}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${k.input}`}
              />
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${k.btn}`}>
              {mode === 'owner' ? '+ Ảnh (chứng từ hoàn, bằng chứng)' : '+ Ảnh bằng chứng'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {buttons.map((a) => (
              <button
                key={a}
                type="button"
                disabled={busy}
                onClick={() => void run(a)}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 ${
                  a === 'withdraw' || a === 'refund_not_received' || a === 'require_refund' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {ACTION_TEXT[a]}
              </button>
            ))}
          </div>
        </div>
      )}
      {notice && (
        <p role="status" className={`text-xs font-bold ${notice.ok ? (dark ? 'text-emerald-300' : 'text-emerald-800') : dark ? 'text-rose-300' : 'text-rose-700'}`}>
          {notice.text}
        </p>
      )}
      {c && (
        <details>
          <summary className={`text-xs font-bold cursor-pointer ${k.sub}`}>Lịch sử khiếu nại ({view.events.length})</summary>
          <ol className="mt-1 space-y-0.5 text-xs break-words">
            {view.events.map((e, i) => (
              <li key={i}>
                {formatCreatedAt(e.createdAt)} · {EVENT_TEXT[e.action] || e.action} ({ROLE_TEXT[e.actorRole] || e.actorRole}){e.note && e.action !== 'open' ? `: ${e.note}` : ''}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
};
