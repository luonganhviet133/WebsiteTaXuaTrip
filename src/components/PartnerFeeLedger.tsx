/**
 * N06.2 — Sổ phí nền tảng của cơ sở (đọc server): mỗi đơn hoàn tất một dòng theo mức phí đã thỏa thuận.
 * Chưa thu tiền: Tà Xùa Trip gửi hóa đơn cuối tháng (N06.3). Không có ví trả trước, không tự trừ tiền.
 */
import React, { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { pointsApi, rateLabel, type FeeEntry } from '../api/pointsApi.ts';
import { vnMonth } from '../config/community.ts';
import { formatVND } from '../utils/rules.ts';

const lastMonths = (n: number) => {
  const out: string[] = [];
  const d = new Date();
  let [y, m] = vnMonth(d).split('-').map(Number);
  for (let i = 0; i < n; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
};

export const PartnerFeeLedger: React.FC = () => {
  const months = lastMonths(6);
  const [month, setMonth] = useState(months[0]);
  const [data, setData] = useState<{ entries: FeeEntry[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setData(null);
    pointsApi.partnerFees(month).then((r) => {
      if (!alive) return;
      if (r.ok) setData(r.data);
      else setError(r.message);
    });
    return () => {
      alive = false;
    };
  }, [month]);

  return (
    <section aria-labelledby="fee-ledger-title" className="bg-slate-850 border border-slate-700 rounded-3xl p-4 sm:p-6 space-y-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="fee-ledger-title" className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-400" /> Sổ phí nền tảng
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Mỗi đơn hoàn tất ghi một dòng phí theo mức đã thỏa thuận với Tà Xùa Trip. Chưa thu tiền: phí được tổng hợp và gửi hóa đơn cuối tháng. Không có ví trả trước, hệ thống không tự trừ tiền.
          </p>
        </div>
        <label className="text-xs font-bold text-slate-300">
          <span className="sr-only">Chọn tháng</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white">
            {months.map((m) => (
              <option key={m} value={m}>
                Tháng {m.split('-').reverse().join('/')}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="text-xs font-bold text-rose-300">{error}</p>}
      {!data ? (
        <div className="h-20 rounded-2xl bg-slate-800 animate-pulse" aria-label="Đang tải" />
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-slate-300">Tổng phí tháng {month.split('-').reverse().join('/')} (chưa thu)</span>
            <span className="text-2xl font-black text-teal-300">{formatVND(data.total)}</span>
          </div>
          {data.entries.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có đơn hoàn tất trong tháng này.</p>
          ) : (
            <ul className="divide-y divide-slate-700">
              {data.entries.map((e) => (
                <li key={e.id} className="py-2 flex flex-wrap items-start justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-mono font-bold text-sky-300">{e.bookingCode || '—'}</span>{' '}
                    <span className="text-slate-300">{e.kind === 'reversal' ? `Đảo phí: ${e.reason || ''}` : `${rateLabel(e.rateMode, e.rateValue)} · đơn ${formatVND(e.basisAmount || 0)}`}</span>
                    {e.reversed && <span className="text-xs text-amber-300"> · đã đảo</span>}
                  </span>
                  <span className={`font-black ${e.amount < 0 ? 'text-emerald-300' : 'text-white'}`}>{formatVND(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};
