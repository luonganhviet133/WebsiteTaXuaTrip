/**
 * N06.2 — Bảng xếp hạng người đóng góp (công khai, tên rút gọn) + top 3 tháng trước đã được trao quà.
 * Dùng ở trang Cộng đồng và trong hộp Điểm Mây.
 */
import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { pointsApi, type LeaderRow } from '../api/pointsApi.ts';
import { previousVnMonth } from '../config/community.ts';

const MEDAL = ['🥇', '🥈', '🥉'];

export const LeaderboardCard: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [scope, setScope] = useState<'month' | '12m'>('month');
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [winners, setWinners] = useState<{ rank: number; name: string; points: number }[]>([]);
  const prev = previousVnMonth(new Date());

  useEffect(() => {
    let alive = true;
    setRows(null);
    pointsApi.leaderboard(scope).then((r) => alive && setRows(r.ok ? r.data.items : []));
    return () => {
      alive = false;
    };
  }, [scope]);
  useEffect(() => {
    pointsApi.winners(prev).then((r) => r.ok && setWinners(r.data.winners));
  }, [prev]);

  const list = compact ? (rows || []).slice(0, 10) : rows || [];
  return (
    <section aria-labelledby="leaderboard-title" className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 space-y-4 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="leaderboard-title" className="text-lg font-black flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Bảng xếp hạng đóng góp
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">Điểm Mây tính theo đóng góp thật cho cộng đồng Tà Xùa, không theo số tiền chi tiêu.</p>
        </div>
        <div role="tablist" aria-label="Khoảng thời gian" className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
          {(['month', '12m'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${scope === s ? 'bg-brand-800 text-white' : 'text-slate-700 hover:bg-white'}`}
            >
              {s === 'month' ? 'Tháng này' : '12 tháng'}
            </button>
          ))}
        </div>
      </div>

      {winners.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-xs font-extrabold text-amber-900 mb-1">Top 3 tháng {prev.split('-').reverse().join('/')} — đã nhận quà</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {winners.map((w) => (
              <li key={w.rank}>
                {MEDAL[w.rank - 1]} <strong>{w.name}</strong> <span className="text-slate-600">· {w.points} điểm</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows === null ? (
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" aria-label="Đang tải bảng xếp hạng" />
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-600">Chưa có ai được cộng điểm trong {scope === 'month' ? 'tháng này' : '12 tháng qua'}. Hãy là người đầu tiên!</p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {list.map((r) => (
            <li key={r.rank} className="flex items-center gap-3 py-2">
              <span className="w-8 text-center font-black text-slate-700">{MEDAL[r.rank - 1] || r.rank}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">{r.name}</span>
                <span className="block text-xs text-slate-600">{r.title}</span>
              </span>
              <span className="text-sm font-black text-brand-800">{r.points}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-slate-600">Mỗi tháng Tà Xùa Trip trao quà cho 3 người đóng góp nhiều nhất.</p>
    </section>
  );
};
