/**
 * Admin: danh sách đối soát cọc (tranh chấp lên đầu). Mở từng vụ để xem bằng chứng hai bên và ghi kết luận.
 * Kết luận chỉ là ghi nhận — hệ thống không chuyển tiền.
 */
import React, { useEffect, useState } from 'react';
import { bookingsApi, formatCreatedAt } from '../api/bookingsApi.ts';
import { formatVND } from '../utils/rules.ts';
import { ReconciliationPanel } from './ReconciliationPanel.tsx';

const LABEL: Record<string, string> = {
  disputed: 'Chờ phân xử',
  open: 'Chờ cơ sở hoàn',
  refund_reported: 'Cơ sở báo đã hoàn',
  hold_proposed: 'Đề nghị giữ tiền',
  closed: 'Đã kết thúc',
};

export const AdminReconciliationPanel: React.FC = () => {
  const [items, setItems] = useState<Awaited<ReturnType<typeof bookingsApi.adminRecons>> | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = () => bookingsApi.adminRecons().then(setItems);
  useEffect(() => {
    void load();
  }, []);
  if (!items || !items.ok || items.data.length === 0) return null;
  const pending = items.data.filter((x) => x.status !== 'closed').length;
  return (
    <div className="bg-slate-900 px-4 pt-6">
      <section aria-labelledby="admin-recon-title" className="max-w-6xl mx-auto bg-slate-850 border border-amber-500/40 rounded-3xl p-4 sm:p-6 space-y-3 text-white">
        <h2 id="admin-recon-title" className="text-lg font-black">Đối soát tiền cọc ({pending} chưa xong)</h2>
        <p className="text-xs text-slate-400">Khách đã chuyển cọc nhưng đơn hết hạn/bị từ chối. Cơ sở hoàn trong 3 ngày hoặc giữ khi khách đồng ý; vụ tranh chấp chờ bạn kết luận.</p>
        <ul className="space-y-2">
          {items.data.map((x) => (
            <li key={x.bookingId} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-mono font-black text-sky-300">{x.bookingCode}</span> · {x.listingTitle} · {x.guestName} ({x.guestPhone}) · cọc {formatVND(x.depositAmount)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${x.status === 'disputed' ? 'bg-rose-600' : 'bg-slate-700'}`}>{LABEL[x.status] || x.status}</span>
                  {x.status === 'open' && <span className="text-xs text-slate-400">hạn {formatCreatedAt(x.dueAt)}</span>}
                  <button type="button" onClick={() => setOpenId(openId === x.bookingId ? null : x.bookingId)} aria-expanded={openId === x.bookingId} className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold cursor-pointer">
                    {openId === x.bookingId ? 'Thu gọn' : 'Xem bằng chứng'}
                  </button>
                </div>
              </div>
              {openId === x.bookingId && <ReconciliationPanel bookingId={x.bookingId} mode="admin" onChanged={() => void load()} />}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
