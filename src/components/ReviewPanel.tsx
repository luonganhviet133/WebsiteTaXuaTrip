/**
 * N06.3 — Đánh giá xác thực của khách cho một đơn đã hoàn tất (mỗi đơn một lần, trong 30 ngày).
 * Server cộng Điểm Mây (+30, ảnh thật đầu tiên +20); trình duyệt chỉ hiển thị.
 */
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { feedbackApi, type ReviewState } from '../api/feedbackApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';

const Stars: React.FC<{ value: number; onPick?: (n: number) => void; size?: string }> = ({ value, onPick, size = 'w-5 h-5' }) => (
  <div className="flex items-center gap-1" role={onPick ? 'radiogroup' : undefined} aria-label={onPick ? 'Số sao' : `${value} sao`}>
    {[1, 2, 3, 4, 5].map((n) =>
      onPick ? (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} sao`} onClick={() => onPick(n)} className="p-1 cursor-pointer">
          <Star className={`${size} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      ) : (
        <Star key={n} className={`${size} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      )
    )}
  </div>
);
export { Stars };

export const ReviewPanel: React.FC<{ bookingId: string; onChanged?: () => void }> = ({ bookingId, onChanged }) => {
  const [state, setState] = useState<ReviewState | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const load = async () => {
    const r = await feedbackApi.reviewState(bookingId);
    if (r.ok) setState(r.data);
  };
  useEffect(() => {
    void load();
  }, [bookingId]);
  if (!state) return null;
  const r = state.review;

  if (!r && !state.canWrite) return state.reason ? <p className="text-xs text-slate-500">{state.reason}</p> : null;

  if (!r && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer">
        <Star className="w-3.5 h-3.5 fill-slate-950" />
        Viết đánh giá (+{state.points.review} Điểm Mây)
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (comment.trim().length < 20) return setNotice({ ok: false, text: 'Viết ít nhất 20 ký tự về trải nghiệm thật của bạn.' });
    setBusy(true);
    const res = await feedbackApi.createReview(bookingId, rating, comment.trim());
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setState(res.data);
    setNotice({ ok: true, text: `Đã đăng đánh giá. +${state.points.review} Điểm Mây.` });
    onChanged?.();
  };

  const addPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setNotice({ ok: false, text: 'Ảnh tối đa 5 MB.' });
    setBusy(true);
    const first = r && r.photoIds.length === 0;
    const res = await feedbackApi.addPhoto(bookingId, file);
    setBusy(false);
    if (!res.ok) return setNotice({ ok: false, text: res.message });
    setNotice({ ok: true, text: first ? `Đã thêm ảnh. +${state.points.photo} Điểm Mây.` : 'Đã thêm ảnh.' });
    await load();
    onChanged?.();
  };

  return (
    <section aria-label="Đánh giá của bạn" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 text-slate-900">
      {!r ? (
        <form onSubmit={(e) => void submit(e)} className="space-y-2">
          <p className="text-sm font-extrabold">Đánh giá chuyến ở</p>
          <p className="text-xs text-slate-600">
            Đánh giá gắn với đơn này, hiện công khai với tên rút gọn. +{state.points.review} Điểm Mây; thêm ảnh thật +{state.points.photo}.
            {state.windowEndsAt ? ` Viết được đến ${formatCreatedAt(state.windowEndsAt)}.` : ''}
          </p>
          <Stars value={rating} onPick={setRating} />
          <label htmlFor={`rv-comment-${bookingId}`} className="sr-only">Nội dung đánh giá</label>
          <textarea
            id={`rv-comment-${bookingId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Phòng, chủ nhà, đường lên, mây hôm bạn ở… (ít nhất 20 ký tự)"
            className="w-full rounded-xl border border-slate-500 bg-white px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer disabled:opacity-50">Đăng đánh giá</button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 cursor-pointer">Để sau</button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-extrabold">Đánh giá của bạn</p>
          {r.status === 'hidden' && <p className="text-xs font-bold text-rose-700">Đánh giá đã bị ẩn{r.hiddenReason ? `: ${r.hiddenReason}` : ''}.</p>}
          <Stars value={r.rating} size="w-4 h-4" />
          <p className="text-sm break-words">{r.comment}</p>
          {r.photoIds.length > 0 && r.status === 'published' && (
            <div className="flex flex-wrap gap-2">
              {r.photoIds.map((id) => (
                <a key={id} href={feedbackApi.photoUrl(id)} target="_blank" rel="noopener noreferrer">
                  <img src={feedbackApi.photoUrl(id)} alt="Ảnh trong đánh giá" className="w-16 h-16 rounded-xl object-cover border border-amber-200" />
                </a>
              ))}
            </div>
          )}
          {r.ownerReply && <p className="text-xs text-slate-700 bg-white rounded-xl p-2 break-words">Cơ sở trả lời: {r.ownerReply}</p>}
          {state.canAddPhotos && r.photoIds.length < 3 && (
            <label className="inline-block px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 cursor-pointer">
              + Ảnh thật{r.photoIds.length === 0 ? ` (+${state.points.photo} Điểm Mây)` : ''}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          )}
        </div>
      )}
      {notice && <p role="status" className={`text-xs font-bold ${notice.ok ? 'text-emerald-800' : 'text-rose-700'}`}>{notice.text}</p>}
    </section>
  );
};
