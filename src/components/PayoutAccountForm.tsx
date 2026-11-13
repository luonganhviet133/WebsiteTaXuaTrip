/**
 * N06.1 — Tài khoản nhận cọc của cơ sở (D03: khách chuyển thẳng cho cơ sở). Lưu trên server.
 * Đơn đã chụp thông tin thanh toán không đổi theo khi sửa ở đây.
 */
import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { bookingsApi, type PayoutAccount } from '../api/bookingsApi.ts';
import { BANKS } from '../payment/vietqr.ts';

export const PayoutAccountForm: React.FC<{ listingId: string }> = ({ listingId }) => {
  const [current, setCurrent] = useState<PayoutAccount | null | undefined>(undefined);
  const [form, setForm] = useState({ bankBin: '', accountNumber: '', accountName: '' });
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setCurrent(undefined);
    bookingsApi.getPayout(listingId).then((r) => {
      if (!alive) return;
      if (!r.ok) return setNotice({ ok: false, text: r.message });
      setCurrent(r.data);
      if (r.data) setForm({ bankBin: r.data.bankBin, accountNumber: r.data.accountNumber, accountName: r.data.accountName });
    });
    return () => {
      alive = false;
    };
  }, [listingId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await bookingsApi.setPayout(listingId, form);
    setBusy(false);
    if (!r.ok) return setNotice({ ok: false, text: r.message });
    setCurrent(r.data);
    setForm({ bankBin: r.data.bankBin, accountNumber: r.data.accountNumber, accountName: r.data.accountName });
    setNotice({ ok: true, text: 'Đã lưu. Khách sẽ thấy tài khoản này sau khi đồng ý điều khoản; đơn đã có thông tin chuyển khoản trước đó giữ nguyên tài khoản cũ.' });
  };

  const field = 'w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500';
  return (
    <section aria-labelledby="payout-title" className="bg-slate-850 border border-slate-700 rounded-3xl p-4 sm:p-6 space-y-4">
      <div>
        <h3 id="payout-title" className="text-lg font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-teal-400" />
          <span>Tài khoản nhận cọc</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Khách chuyển cọc và phần còn lại thẳng vào tài khoản này (Tà Xùa Trip không giữ tiền). Bạn kiểm tra tài khoản rồi bấm xác nhận ở mục Đơn đặt phòng.
        </p>
      </div>
      {current === undefined && !notice ? (
        <div className="h-24 rounded-2xl bg-slate-800 animate-pulse" aria-label="Đang tải" />
      ) : (
        <form onSubmit={(e) => void save(e)} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="payout-bank" className="block text-xs font-bold text-slate-300 mb-1">Ngân hàng</label>
            <select id="payout-bank" value={form.bankBin} onChange={(e) => setForm({ ...form, bankBin: e.target.value })} className={field} required>
              <option value="">Chọn ngân hàng</option>
              {BANKS.map((b) => (
                <option key={b.bin} value={b.bin}>
                  {b.short} — {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="payout-number" className="block text-xs font-bold text-slate-300 mb-1">Số tài khoản</label>
            <input id="payout-number" inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className={field} placeholder="6–19 chữ số" required />
          </div>
          <div>
            <label htmlFor="payout-name" className="block text-xs font-bold text-slate-300 mb-1">Tên chủ tài khoản</label>
            <input id="payout-name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className={field} placeholder="Như trên app ngân hàng" required />
          </div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-black cursor-pointer disabled:opacity-50">
              {busy ? 'Đang lưu…' : 'Lưu tài khoản'}
            </button>
            {current === null && <span className="text-xs font-bold text-amber-300">Chưa có tài khoản: khách chưa xem được thông tin chuyển cọc.</span>}
          </div>
        </form>
      )}
      {notice && (
        <p role="status" className={`text-xs font-bold ${notice.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {notice.text}
        </p>
      )}
    </section>
  );
};
