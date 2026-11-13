/**
 * N06.3 — Đánh giá xác thực công khai của một cơ sở (chỉ đánh giá gắn đơn đã hoàn tất, đang hiện).
 * Điểm sao và số đánh giá do server tính. Chủ cơ sở trả lời công khai ngay dưới đánh giá.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { feedbackApi, type ReviewItem } from '../api/feedbackApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';
import { Stars } from './ReviewPanel.tsx';

const ReplyForm: React.FC<{ reviewId: string; onSaved: () => void }> = ({ reviewId, onSaved }) => {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await feedbackApi.reply(reviewId, text.trim());
        if (!r.ok) return setMsg(r.message);
        setText('');
        onSaved();
      }}
    >
      <label htmlFor={`reply-${reviewId}`} className="sr-only">Trả lời công khai</label>
      <input id={`reply-${reviewId}`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Trả lời công khai của cơ sở" className="flex-1 min-w-0 rounded-xl border border-slate-500 px-3 py-2 text-sm" />
      <button type="submit" disabled={text.trim().length < 5} className="px-3 py-2 rounded-full text-xs font-bold bg-brand-800 text-white cursor-pointer disabled:opacity-50">Trả lời</button>
      {msg && <p role="status" className="w-full text-xs text-rose-700">{msg}</p>}
    </form>
  );
};

export const ListingReviews: React.FC<{ listingId: string; canReply?: boolean }> = ({ listingId, canReply = false }) => {
  const [data, setData] = useState<{ count: number; average: number; items: ReviewItem[] } | null>(null);
  const load = () => feedbackApi.listingReviews(listingId).then((r) => r.ok && setData(r.data));
  useEffect(() => {
    void load();
  }, [listingId]);
  if (!data) return null;
  if (data.items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-600">
        Chưa có đánh giá xác thực. Đánh giá chỉ mở cho khách đã đặt qua Tà Xùa Trip và được cơ sở xác nhận hoàn tất chuyến ở.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {data.items.map((rev) => (
        <article key={rev.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs text-brand-800">{rev.authorName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Đã ở thật
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Stars value={rev.rating} size="w-3.5 h-3.5" />
              <span className="text-xs text-slate-500">{formatCreatedAt(rev.createdAt)}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words">{rev.comment}</p>
          {rev.photoIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rev.photoIds.map((id) => (
                <a key={id} href={feedbackApi.photoUrl(id)} target="_blank" rel="noopener noreferrer">
                  <img src={feedbackApi.photoUrl(id)} alt={`Ảnh của ${rev.authorName}`} loading="lazy" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                </a>
              ))}
            </div>
          )}
          {rev.ownerReply ? (
            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2 break-words">
              <strong>Cơ sở trả lời:</strong> {rev.ownerReply}
            </p>
          ) : (
            canReply && <ReplyForm reviewId={rev.id} onSaved={() => void load()} />
          )}
        </article>
      ))}
    </div>
  );
};
