/**
 * N06.2 — Điểm Mây của tôi (đóng góp): điểm 12 tháng, danh hiệu, cách nhận điểm, lịch sử; bảng xếp hạng.
 * Đổi điểm lấy quà đang khóa tới khi Tà Xùa Trip chốt giá trị điểm.
 */
import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { pointsApi, SOURCE_LABEL, type MyPoints } from '../api/pointsApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';
import { POINT_RULES, TITLES } from '../config/community.ts';
import { LeaderboardCard } from './LeaderboardCard.tsx';

export const PointsModal: React.FC<{ isLoggedIn: boolean; onClose: () => void; onLogin: () => void; onLoaded?: (points: number) => void }> = ({
  isLoggedIn,
  onClose,
  onLogin,
  onLoaded,
}) => {
  const [tab, setTab] = useState<'mine' | 'board'>(isLoggedIn ? 'mine' : 'board');
  const [me, setMe] = useState<MyPoints | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    pointsApi.me().then((r) => {
      if (r.ok) {
        setMe(r.data);
        onLoaded?.(r.data.points12m);
      } else setError(r.message);
    });
  }, [isLoggedIn]);

  const progress = me && me.next ? Math.min(100, Math.max(0, Math.round((me.points12m / me.next.min) * 100))) : 100;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="points-title">
      <div className="bg-[#f8fafc] w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="points-title" className="text-xl font-black text-brand-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Điểm Mây
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-2 rounded-xl hover:bg-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div role="tablist" className="inline-flex rounded-xl border border-slate-200 p-1 bg-white">
          {(['mine', 'board'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer ${tab === t ? 'bg-brand-800 text-white' : 'text-slate-700'}`}>
              {t === 'mine' ? 'Của tôi' : 'Xếp hạng'}
            </button>
          ))}
        </div>

        {tab === 'board' ? (
          <LeaderboardCard compact />
        ) : !isLoggedIn ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm space-y-3">
            <p>Đăng nhập để xem Điểm Mây và danh hiệu của bạn.</p>
            <button type="button" onClick={onLogin} className="px-4 py-2.5 rounded-xl bg-brand-800 text-white font-bold cursor-pointer">Đăng nhập</button>
          </div>
        ) : error ? (
          <p className="text-sm font-bold text-rose-700">{error}</p>
        ) : !me ? (
          <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" aria-label="Đang tải" />
        ) : (
          <>
            <div className="bg-gradient-to-br from-brand-800 to-teal-700 text-white rounded-2xl p-4 space-y-2">
              <p className="text-xs opacity-90">Danh hiệu (theo điểm 12 tháng gần nhất)</p>
              <p className="text-2xl font-black">{me.title}</p>
              <p className="text-sm">
                <strong className="text-3xl font-black">{me.points12m}</strong> điểm · tháng này {me.monthPoints} điểm
              </p>
              {me.next ? (
                <>
                  <div className="h-2 rounded-full bg-white/25" aria-hidden="true">
                    <div className="h-2 rounded-full bg-amber-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs">Còn {me.next.min - me.points12m} điểm nữa lên "{me.next.name}".</p>
                </>
              ) : (
                <p className="text-xs">Danh hiệu cao nhất. Cảm ơn bạn!</p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-extrabold text-brand-800">Cách nhận Điểm Mây</p>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Hoàn tất một chuyến ở (cơ sở xác nhận): <strong>+{POINT_RULES.stay_completed}</strong></li>
                <li>• Đánh giá xác thực sau chuyến: <strong>+{POINT_RULES.review}</strong>, có ảnh thật thêm <strong>+{POINT_RULES.review_photo}</strong> (sắp mở)</li>
                <li>• Góp ý, báo tin đường/mây chính xác… được Tà Xùa Trip duyệt: điểm theo mức đóng góp</li>
              </ul>
              <p className="text-xs text-slate-600">
                Danh hiệu: {TITLES.map((t) => `${t.name} (${t.min})`).join(' → ')}. Điểm hết hạn sau 12 tháng. Mỗi tháng Tà Xùa Trip trao quà cho top 3.
              </p>
              <p className="text-xs font-bold text-amber-800">Đổi Điểm Mây lấy quà: sắp mở.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-sm font-extrabold text-brand-800 mb-2">Lịch sử điểm</p>
              {me.history.length === 0 ? (
                <p className="text-sm text-slate-600">Chưa có điểm. Hoàn tất chuyến đi đầu tiên hoặc gửi góp ý cho cộng đồng nhé!</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {me.history.map((h) => (
                    <li key={h.id} className="py-2 flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="block font-bold">{SOURCE_LABEL[h.sourceType] || h.sourceType}</span>
                        {h.reason && h.reason !== SOURCE_LABEL[h.sourceType] && <span className="block text-xs text-slate-600 break-words">{h.reason}</span>}
                        <span className="block text-xs text-slate-600">
                          {formatCreatedAt(h.createdAt)}
                          {h.expired ? ' · đã hết hạn' : ''}
                        </span>
                      </span>
                      <span className={`font-black shrink-0 ${h.points > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {h.points > 0 ? `+${h.points}` : h.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
