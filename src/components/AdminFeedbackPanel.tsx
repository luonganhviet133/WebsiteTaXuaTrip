/**
 * N06.3 — Admin: khiếu nại (việc chờ lên đầu, mở từng vụ xem bằng chứng hai bên rồi nhận xử lý/kết luận)
 * và kiểm duyệt đánh giá (ẩn có lý do, điểm của đánh giá bị thu hồi). Kết luận không phải là đã hoàn tiền.
 */
import React, { useEffect, useState } from 'react';
import { feedbackApi } from '../api/feedbackApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';
import { formatVND } from '../utils/rules.ts';
import { ComplaintPanel } from './ComplaintPanel.tsx';
import { Stars } from './ReviewPanel.tsx';

const LABEL: Record<string, string> = {
  refund_disputed: 'Khách báo chưa nhận tiền',
  open: 'Chờ nhận xử lý',
  in_review: 'Đang xử lý',
  refund_pending: 'Chờ cơ sở hoàn',
  refund_reported: 'Chờ khách xác nhận',
  closed: 'Đã đóng',
};
const NEEDS_ADMIN = ['refund_disputed', 'open', 'in_review'];

const ComplaintsTab: React.FC = () => {
  const [items, setItems] = useState<Awaited<ReturnType<typeof feedbackApi.adminComplaints>> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = () => feedbackApi.adminComplaints().then(setItems);
  useEffect(() => {
    void load();
  }, []);
  if (!items) return null;
  if (!items.ok) return <p className="text-xs text-rose-300">{items.message}</p>;
  if (items.data.length === 0) return <p className="text-xs text-slate-400">Chưa có khiếu nại nào.</p>;
  return (
    <ul className="space-y-2">
      {items.data.map((x) => (
        <li key={x.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm min-w-0 break-words">
              <span className="font-mono font-black text-sky-300">{x.bookingCode}</span> · {x.listingTitle} · {x.guestName} ({x.guestPhone}) · {x.categoryLabel} · đơn{' '}
              {formatVND(x.totalAmount)}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${NEEDS_ADMIN.includes(x.status) ? 'bg-rose-600' : 'bg-slate-700'}`}>{LABEL[x.status] || x.status}</span>
              <span className="text-xs text-slate-400">{formatCreatedAt(x.createdAt)}</span>
              <button type="button" onClick={() => setOpenId(openId === x.bookingId ? null : x.bookingId)} aria-expanded={openId === x.bookingId} className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold cursor-pointer">
                {openId === x.bookingId ? 'Thu gọn' : 'Xem & xử lý'}
              </button>
            </div>
          </div>
          {openId === x.bookingId && <ComplaintPanel bookingId={x.bookingId} mode="admin" onChanged={() => void load()} />}
        </li>
      ))}
    </ul>
  );
};

const ReviewsTab: React.FC = () => {
  const [items, setItems] = useState<Awaited<ReturnType<typeof feedbackApi.adminReviews>> | null>(null);
  const [hiding, setHiding] = useState<{ id: string; reason: string } | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => feedbackApi.adminReviews().then(setItems);
  useEffect(() => {
    void load();
  }, []);
  if (!items) return null;
  if (!items.ok) return <p className="text-xs text-rose-300">{items.message}</p>;
  if (items.data.length === 0) return <p className="text-xs text-slate-400">Chưa có đánh giá nào.</p>;
  return (
    <div className="space-y-2">
      {notice && <p role="status" className={`text-xs font-bold ${notice.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{notice.text}</p>}
      <ul className="space-y-2">
        {items.data.map((r) => (
          <li key={r.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-1 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 break-words">
                <span className="font-mono text-sky-300">{r.bookingCode}</span> · {r.listingTitle} · {r.authorFullName}
              </span>
              <Stars value={r.rating} size="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-200 break-words">{r.comment}</p>
            <p className="text-xs text-slate-400">
              {formatCreatedAt(r.createdAt)} · {r.photoIds.length} ảnh
              {r.status === 'hidden' && <span className="text-amber-300"> · đã ẩn: {r.hiddenReason}</span>}
            </p>
            {r.status === 'published' &&
              (hiding?.id === r.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await feedbackApi.hide(r.id, hiding.reason.trim());
                    setNotice(res.ok ? { ok: true, text: 'Đã ẩn đánh giá và thu hồi Điểm Mây của nó.' } : { ok: false, text: res.message });
                    setHiding(null);
                    void load();
                  }}
                >
                  <label htmlFor={`hide-${r.id}`} className="sr-only">Lý do ẩn</label>
                  <input id={`hide-${r.id}`} value={hiding.reason} onChange={(e) => setHiding({ id: r.id, reason: e.target.value })} placeholder="Lý do ẩn (bắt buộc)" className="flex-1 min-w-0 bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                  <button type="submit" disabled={hiding.reason.trim().length < 3} className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white cursor-pointer disabled:opacity-50">Ẩn</button>
                  <button type="button" onClick={() => setHiding(null)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-700 text-white cursor-pointer">Thôi</button>
                </form>
              ) : (
                <button type="button" onClick={() => setHiding({ id: r.id, reason: '' })} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 text-white cursor-pointer">Ẩn đánh giá</button>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const AdminFeedbackPanel: React.FC = () => {
  const [tab, setTab] = useState<'complaints' | 'reviews'>('complaints');
  return (
    <section aria-labelledby="admin-feedback-title" className="bg-slate-850 border border-rose-500/30 rounded-3xl p-4 sm:p-6 space-y-4 text-white">
      <div>
        <h3 id="admin-feedback-title" className="text-base font-extrabold">Khiếu nại & đánh giá</h3>
        <p className="text-xs text-slate-400">Kết luận khiếu nại chưa phải là đã hoàn tiền: cơ sở hoàn trực tiếp, khách xác nhận đã nhận mới đóng.</p>
      </div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {([['complaints', 'Khiếu nại'], ['reviews', 'Đánh giá']] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${tab === k ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'complaints' ? <ComplaintsTab /> : <ReviewsTab />}
    </section>
  );
};
