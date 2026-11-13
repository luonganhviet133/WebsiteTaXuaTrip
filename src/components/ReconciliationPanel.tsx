/**
 * Đối soát cọc (chủ dự án chốt 13/11/2026): khách đã chuyển cọc nhưng đơn hết hạn/bị từ chối trước khi cơ sở xác nhận.
 * Cơ sở hoàn trong 3 ngày (kèm ảnh chứng từ) hoặc đề nghị giữ tiền — chỉ giữ khi khách đồng ý; tranh chấp do admin phân xử.
 * Mọi bước, ghi chú và ảnh của hai bên được lưu làm bằng chứng. Hệ thống không chuyển tiền.
 * Một component cho ba bên (khách: nền sáng; chủ cơ sở/admin: nền tối).
 */
import React, { useEffect, useState } from 'react';
import { bookingsApi, formatCreatedAt, reconButtons, type ReconActionName, type ReconMode, type ReconView } from '../api/bookingsApi.ts';
import { formatVND } from '../utils/rules.ts';

const STATUS_TEXT: Record<string, string> = {
  open: 'Chờ cơ sở hoàn tiền hoặc đề nghị giữ tiền',
  refund_reported: 'Cơ sở báo đã hoàn — chờ khách xác nhận',
  hold_proposed: 'Cơ sở đề nghị giữ tiền — chờ khách đồng ý',
  disputed: 'Đang chờ Tà Xùa Trip phân xử',
  closed: 'Đã kết thúc',
};
const OUTCOME_TEXT: Record<string, string> = { refunded: 'Đã hoàn tiền cho khách', held: 'Cơ sở giữ tiền (khách đã đồng ý)' };
const ACTION_TEXT: Record<ReconActionName, string> = {
  refund: 'Đã hoàn tiền',
  propose_hold: 'Đề nghị giữ tiền',
  accept_hold: 'Đồng ý để cơ sở giữ tiền',
  reject_hold: 'Không đồng ý, muốn hoàn tiền',
  confirm_received: 'Đã nhận lại tiền',
  dispute: 'Báo Tà Xùa Trip',
  resolve_refunded: 'Kết luận: đã hoàn',
  resolve_held: 'Kết luận: cơ sở được giữ',
  resolve_refund_required: 'Kết luận: cơ sở phải hoàn (hạn mới 3 ngày)',
};
const EVENT_TEXT: Record<string, string> = {
  recon_open: 'Mở đối soát',
  recon_refund: 'Cơ sở báo đã hoàn',
  recon_propose_hold: 'Cơ sở đề nghị giữ tiền',
  recon_accept_hold: 'Khách đồng ý giữ tiền',
  recon_reject_hold: 'Khách không đồng ý giữ tiền',
  recon_confirm_received: 'Khách xác nhận đã nhận lại tiền',
  recon_dispute: 'Khách báo Tà Xùa Trip',
  recon_resolve_refunded: 'Admin kết luận: đã hoàn',
  recon_resolve_held: 'Admin kết luận: cơ sở được giữ',
  recon_resolve_refund_required: 'Admin kết luận: cơ sở phải hoàn',
};
const ROLE_TEXT: Record<string, string> = { traveler: 'khách', partner: 'cơ sở', admin: 'admin', system: 'hệ thống' };
// Bước cần ghi chú (server bắt buộc ≥ 3 ký tự)
const NOTE_REQUIRED: ReconActionName[] = ['propose_hold', 'dispute', 'resolve_refunded', 'resolve_held', 'resolve_refund_required'];

export const ReconciliationPanel: React.FC<{ bookingId: string; mode: ReconMode; onChanged?: () => void }> = ({ bookingId, mode, onChanged }) => {
  const dark = mode !== 'guest';
  const [view, setView] = useState<ReconView | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await bookingsApi.recon(bookingId);
    if (r.ok) setView(r.data);
  };
  useEffect(() => {
    void load();
  }, [bookingId]);
  useEffect(() => {
    if (view && !amount) setAmount(String(view.depositAmount));
  }, [view?.depositAmount]);

  const fileKey = view ? `${view.files.length}-${view.depositReceipts.length}` : '';
  useEffect(() => {
    if (!view) return;
    let alive = true;
    const urls: string[] = [];
    Promise.all([
      ...view.depositReceipts.map(async (f) => [`d:${f.id}`, await bookingsApi.receiptObjectUrl(bookingId, f.id)] as const),
      ...view.files.map(async (f) => [`f:${f.id}`, await bookingsApi.reconFileUrl(bookingId, f.id)] as const),
    ]).then((pairs) => {
      const next: Record<string, string> = {};
      for (const [k, u] of pairs) {
        if (!u) continue;
        next[k] = u;
        urls.push(u);
      }
      if (alive) setThumbs(next);
    });
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fileKey, bookingId]);

  if (!view || !view.reconciliation) return null;
  const r = view.reconciliation;
  const buttons = reconButtons(mode, r.status, view.overdue);
  const canUpload = r.status !== 'closed' && mode !== 'admin';
  const c = dark
    ? { box: 'bg-slate-900 border-amber-500/40 text-slate-100', sub: 'text-slate-400', input: 'bg-slate-950 border-slate-600 text-white placeholder:text-slate-500', btn: 'bg-slate-700 hover:bg-slate-600 text-white' }
    : { box: 'bg-amber-50 border-amber-300 text-slate-900', sub: 'text-slate-600', input: 'bg-white border-slate-300 text-slate-900', btn: 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-800' };

  const run = async (action: ReconActionName) => {
    setNotice(null);
    if (NOTE_REQUIRED.includes(action) && note.trim().length < 3) return setNotice({ ok: false, text: 'Vui lòng ghi rõ nội dung (lưu làm bằng chứng cho hai bên).' });
    setBusy(true);
    const res = await bookingsApi.reconAct(bookingId, action, action === 'refund' ? { amount: Number(amount), note: note.trim() || undefined } : { note: note.trim() || undefined });
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setView(res.data);
    setNote('');
    setNotice({ ok: true, text: res.already ? 'Bước này đã được ghi trước đó.' : 'Đã ghi nhận.' });
    onChanged?.();
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setNotice({ ok: false, text: 'Ảnh tối đa 5 MB.' });
    setBusy(true);
    const res = await bookingsApi.reconUpload(bookingId, file);
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setNotice({ ok: true, text: 'Đã lưu ảnh bằng chứng.' });
    await load();
  };

  const Thumbs: React.FC<{ title: string; keys: string[] }> = ({ title, keys }) =>
    keys.length === 0 ? null : (
      <div>
        <p className={`text-xs font-bold mb-1 ${c.sub}`}>{title}</p>
        <div className="flex flex-wrap gap-2">
          {keys.map((k) => (
            <a key={k} href={thumbs[k]} target="_blank" rel="noopener noreferrer">
              {thumbs[k] ? <img src={thumbs[k]} alt={title} className="w-16 h-16 rounded-xl object-cover border border-slate-400/40" /> : <span className="block w-16 h-16 rounded-xl bg-slate-400/20" />}
            </a>
          ))}
        </div>
      </div>
    );

  return (
    <section aria-label="Đối soát tiền cọc" className={`border rounded-2xl p-4 space-y-3 ${c.box}`}>
      <div>
        <p className="text-sm font-extrabold">Đối soát tiền cọc · đơn {view.bookingCode}</p>
        <p className={`text-xs ${c.sub}`}>Khách đã gửi biên lai cọc nhưng {r.reason}. Cọc của đơn: {formatVND(view.depositAmount)}.</p>
      </div>
      <p className="text-sm font-bold">
        {r.status === 'closed' && r.outcome ? `✓ ${OUTCOME_TEXT[r.outcome]}` : STATUS_TEXT[r.status]}
        {r.status === 'open' && (
          <span className={view.overdue ? ' text-rose-500' : ''}> · {view.overdue ? 'đã quá hạn' : 'hạn'} {formatCreatedAt(r.dueAt)}</span>
        )}
      </p>
      <ul className="text-xs space-y-1">
        {r.refundAmount && <li>Cơ sở báo đã hoàn: <strong>{formatVND(r.refundAmount)}</strong>{r.ownerNote && r.status !== 'hold_proposed' ? ` — ${r.ownerNote}` : ''}</li>}
        {(r.status === 'hold_proposed' || r.outcome === 'held') && r.ownerNote && <li>Đề nghị giữ tiền của cơ sở: <strong>{r.ownerNote}</strong></li>}
        {r.guestNote && <li>Khách: {r.guestNote}</li>}
        {r.adminNote && <li>Kết luận của Tà Xùa Trip: {r.adminNote}</li>}
      </ul>

      <Thumbs title="Biên lai cọc của khách" keys={view.depositReceipts.map((f) => `d:${f.id}`)} />
      <Thumbs title="Chứng từ hoàn của cơ sở" keys={view.files.filter((f) => f.role === 'owner').map((f) => `f:${f.id}`)} />
      <Thumbs title="Ảnh khách gửi thêm" keys={view.files.filter((f) => f.role === 'guest').map((f) => `f:${f.id}`)} />

      {(buttons.length > 0 || canUpload) && (
        <div className="space-y-2">
          {buttons.includes('refund') && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`recon-amount-${bookingId}`} className={`text-xs font-bold ${c.sub}`}>Số tiền đã hoàn (đ)</label>
              <input id={`recon-amount-${bookingId}`} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} className={`w-36 rounded-xl border px-3 py-2 text-sm ${c.input}`} />
            </div>
          )}
          {buttons.length > 0 && (
            <>
              <label htmlFor={`recon-note-${bookingId}`} className="sr-only">Ghi chú</label>
              <textarea
                id={`recon-note-${bookingId}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={
                  mode === 'owner'
                    ? 'Ghi chú: ngân hàng, giờ chuyển hoàn; hoặc nội dung đề nghị giữ tiền (vd chuyển sang ngày…)'
                    : mode === 'admin'
                      ? 'Căn cứ kết luận (bắt buộc)'
                      : 'Ghi chú cho cơ sở / Tà Xùa Trip (bắt buộc khi báo)'
                }
                className={`w-full rounded-xl border px-3 py-2 text-sm ${c.input}`}
              />
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {canUpload && (
              <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${c.btn}`}>
                {mode === 'owner' ? '+ Ảnh chứng từ hoàn' : '+ Ảnh bằng chứng (sao kê…)'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            )}
            {buttons.map((a) => (
              <button
                key={a}
                type="button"
                disabled={busy}
                onClick={() => void run(a)}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 ${
                  a === 'dispute' || a === 'reject_hold' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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

      <details>
        <summary className={`text-xs font-bold cursor-pointer ${c.sub}`}>Lịch sử đối soát ({view.events.length})</summary>
        <ol className="mt-1 space-y-0.5 text-xs">
          {view.events.map((e, i) => (
            <li key={i}>
              {formatCreatedAt(e.createdAt)} · {EVENT_TEXT[e.action] || e.action} ({ROLE_TEXT[e.actorRole] || e.actorRole}){e.note ? `: ${e.note}` : ''}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
};
