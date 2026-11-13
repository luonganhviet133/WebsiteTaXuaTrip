/**
 * N06.2 — Admin: phí nền tảng (mức từng cơ sở, sổ phí, đảo phí), Điểm Mây (cộng cho đóng góp được duyệt, thu hồi),
 * top 3 người đóng góp mỗi tháng (chốt và ghi quà). Mọi thao tác có lý do và được lưu ở server.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { pointsApi, rateLabel, newKey, SOURCE_LABEL, type FeeEntry, type MyPoints } from '../api/pointsApi.ts';
import { formatCreatedAt } from '../api/bookingsApi.ts';
import { POINT_RULES, previousVnMonth, vnMonth } from '../config/community.ts';
import { formatVND } from '../utils/rules.ts';

type Tab = 'fees' | 'points' | 'monthly';
const field = 'w-full bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500';
const btn = 'px-3 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50';
const Notice: React.FC<{ n: { ok: boolean; text: string } | null }> = ({ n }) =>
  n ? <p role="status" className={`text-xs font-bold ${n.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{n.text}</p> : null;

const FeesTab: React.FC<{ listings: { id: string; title: string }[] }> = ({ listings }) => {
  const [rates, setRates] = useState<Awaited<ReturnType<typeof pointsApi.adminRates>> | null>(null);
  const [form, setForm] = useState({ listingId: '', mode: 'fixed', value: '', note: '' });
  const [month, setMonth] = useState(vnMonth(new Date()));
  const [ledger, setLedger] = useState<{ entries: FeeEntry[]; total: number } | null>(null);
  const [reversing, setReversing] = useState<{ id: string; reason: string } | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const loadRates = () => pointsApi.adminRates().then(setRates);
  const loadLedger = () => pointsApi.adminFees(month).then((r) => r.ok && setLedger(r.data));
  useEffect(() => {
    void loadRates();
  }, []);
  useEffect(() => {
    void loadLedger();
  }, [month]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = Number(form.value.replace(',', '.'));
    const value = form.mode === 'fixed' ? Math.round(raw) : Math.round(raw * 100); // % → điểm cơ bản
    const r = await pointsApi.setRate(form.listingId, { mode: form.mode === 'fixed' ? 'fixed' : 'percent_bp', value, note: form.note || undefined });
    setNotice(r.ok ? { ok: true, text: 'Đã lưu mức phí. Áp dụng cho đơn hoàn tất từ bây giờ; dòng phí đã ghi giữ nguyên.' } : { ok: false, text: r.message });
    if (r.ok) void loadRates();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={(e) => void save(e)} className="grid gap-3 sm:grid-cols-2 bg-slate-900 border border-slate-700 rounded-2xl p-4">
        <p className="sm:col-span-2 text-sm font-bold">Cài mức phí cho một cơ sở (sau khi đã thỏa thuận)</p>
        <label className="sm:col-span-2 text-xs font-bold text-slate-300">
          Cơ sở
          <select value={form.listingId} onChange={(e) => setForm({ ...form, listingId: e.target.value })} className={`${field} mt-1`} required>
            <option value="">Chọn cơ sở</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-300">
          Dạng phí
          <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className={`${field} mt-1`}>
            <option value="fixed">Số tiền cố định mỗi đơn (đ)</option>
            <option value="percent">% tổng tiền đơn</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-300">
          {form.mode === 'fixed' ? 'Số tiền (đ)' : 'Phần trăm (%)'}
          <input inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={`${field} mt-1`} placeholder={form.mode === 'fixed' ? '50000' : '5'} required />
        </label>
        <label className="sm:col-span-2 text-xs font-bold text-slate-300">
          Ghi chú thỏa thuận
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${field} mt-1`} placeholder="vd: Hợp đồng ký 13/11/2026" />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className={`${btn} bg-teal-500 text-slate-950`}>Lưu mức phí</button>
          <Notice n={notice} />
        </div>
      </form>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-bold">Mức phí đang áp dụng</p>
        {!rates || !rates.ok || rates.data.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa cơ sở nào được cài mức phí (đơn hoàn tất của các cơ sở này không ghi phí).</p>
        ) : (
          <ul className="divide-y divide-slate-700 text-sm">
            {rates.data.map((r) => (
              <li key={r.listingId} className="py-1.5 flex flex-wrap justify-between gap-2">
                <span className="min-w-0 break-words">{r.title}{r.note ? <span className="text-xs text-slate-400"> · {r.note}</span> : null}</span>
                <span className="font-black text-teal-300">{rateLabel(r.mode, r.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">Sổ phí (chưa thu — hóa đơn cuối tháng sẽ làm ở bước sau)</p>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Tháng" className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-white" />
        </div>
        {ledger && (
          <>
            <p className="text-sm">Tổng tháng: <strong className="text-teal-300">{formatVND(ledger.total)}</strong></p>
            {ledger.entries.length === 0 ? (
              <p className="text-xs text-slate-400">Không có dòng phí.</p>
            ) : (
              <ul className="divide-y divide-slate-700 text-sm">
                {ledger.entries.map((e) => (
                  <li key={e.id} className="py-2 space-y-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="min-w-0 break-words">
                        <span className="font-mono text-sky-300">{e.bookingCode || '—'}</span> · {e.listingTitle || e.listingId} ·{' '}
                        {e.kind === 'reversal' ? `Đảo: ${e.reason}` : rateLabel(e.rateMode, e.rateValue)}
                        {e.reversed && <span className="text-amber-300"> · đã đảo</span>}
                      </span>
                      <span className="font-black">{formatVND(e.amount)}</span>
                    </div>
                    {e.kind === 'platform_fee' && !e.reversed && (
                      reversing?.id === e.id ? (
                        <form
                          className="flex flex-wrap gap-2"
                          onSubmit={async (ev) => {
                            ev.preventDefault();
                            const r = await pointsApi.reverseFee(e.id, reversing.reason);
                            setNotice(r.ok ? { ok: true, text: 'Đã đảo dòng phí.' } : { ok: false, text: r.message });
                            setReversing(null);
                            void loadLedger();
                          }}
                        >
                          <label className="sr-only" htmlFor={`rev-${e.id}`}>Lý do đảo phí</label>
                          <input id={`rev-${e.id}`} value={reversing.reason} onChange={(ev) => setReversing({ id: e.id, reason: ev.target.value })} className={`${field} flex-1 min-w-0`} placeholder="Lý do (bắt buộc)" />
                          <button type="submit" className={`${btn} bg-rose-600 text-white`} disabled={reversing.reason.trim().length < 3}>Đảo phí</button>
                          <button type="button" onClick={() => setReversing(null)} className={`${btn} bg-slate-700 text-white`}>Thôi</button>
                        </form>
                      ) : (
                        <button type="button" onClick={() => setReversing({ id: e.id, reason: '' })} className={`${btn} bg-slate-700 text-white`}>Đảo dòng phí</button>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const PointsTab: React.FC = () => {
  const [form, setForm] = useState({ userEmail: '', points: '', reason: '' });
  const [key, setKey] = useState(newKey());
  const [lookup, setLookup] = useState('');
  const [user, setUser] = useState<(MyPoints & { fullName: string; email: string }) | null>(null);
  const [revoking, setRevoking] = useState<{ id: string; reason: string } | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const find = async (email: string) => {
    const r = await pointsApi.adminUserPoints(email);
    if (r.ok) setUser(r.data);
    else setNotice({ ok: false, text: r.message });
  };
  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 sm:grid-cols-3 bg-slate-900 border border-slate-700 rounded-2xl p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await pointsApi.award({ userEmail: form.userEmail.trim(), points: Number(form.points), reason: form.reason.trim(), idempotencyKey: key });
          setNotice(r.ok ? { ok: true, text: `Đã cộng ${form.points} Điểm Mây.` } : { ok: false, text: r.message });
          if (r.ok) {
            setKey(newKey());
            setForm({ userEmail: '', points: '', reason: '' });
          }
        }}
      >
        <p className="sm:col-span-3 text-sm font-bold">Cộng Điểm Mây cho đóng góp được duyệt (tối đa {POINT_RULES.admin_award_max} điểm/lần)</p>
        <label className="text-xs font-bold text-slate-300">Email thành viên<input type="email" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} className={`${field} mt-1`} required /></label>
        <label className="text-xs font-bold text-slate-300">Số điểm<input inputMode="numeric" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value.replace(/\D/g, '') })} className={`${field} mt-1`} required /></label>
        <label className="text-xs font-bold text-slate-300">Đóng góp gì<input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={`${field} mt-1`} placeholder="vd: Báo sạt lở đèo chính xác" required /></label>
        <div className="sm:col-span-3"><button type="submit" className={`${btn} bg-teal-500 text-slate-950`}>Cộng điểm</button></div>
      </form>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void find(lookup.trim()); }}>
          <label className="sr-only" htmlFor="points-lookup">Email thành viên</label>
          <input id="points-lookup" type="email" value={lookup} onChange={(e) => setLookup(e.target.value)} className={`${field} flex-1 min-w-0`} placeholder="Tra điểm theo email" />
          <button type="submit" className={`${btn} bg-slate-700 text-white`}>Tra</button>
        </form>
        {user && (
          <div className="space-y-2 text-sm">
            <p><strong>{user.fullName}</strong> · {user.email} · {user.points12m} điểm 12 tháng · {user.title}</p>
            <ul className="divide-y divide-slate-700">
              {user.history.map((h) => (
                <li key={h.id} className="py-1.5 space-y-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="min-w-0 break-words">{SOURCE_LABEL[h.sourceType] || h.sourceType}{h.reason && h.reason !== SOURCE_LABEL[h.sourceType] ? ` · ${h.reason}` : ''} <span className="text-xs text-slate-400">{formatCreatedAt(h.createdAt)}</span></span>
                    <span className={`font-black ${h.points > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{h.points > 0 ? `+${h.points}` : h.points}</span>
                  </div>
                  {h.points > 0 && h.sourceType !== 'redemption' && (revoking?.id === h.id ? (
                    <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await pointsApi.revoke(h.id, revoking.reason);
                      setNotice(r.ok ? { ok: true, text: 'Đã thu hồi (ghi dòng trừ bù).' } : { ok: false, text: r.message });
                      setRevoking(null);
                      void find(user.email);
                    }}>
                      <label className="sr-only" htmlFor={`rv-${h.id}`}>Lý do thu hồi</label>
                      <input id={`rv-${h.id}`} value={revoking.reason} onChange={(e) => setRevoking({ id: h.id, reason: e.target.value })} className={`${field} flex-1 min-w-0`} placeholder="Lý do (bắt buộc)" />
                      <button type="submit" disabled={revoking.reason.trim().length < 3} className={`${btn} bg-rose-600 text-white`}>Thu hồi</button>
                      <button type="button" onClick={() => setRevoking(null)} className={`${btn} bg-slate-700 text-white`}>Thôi</button>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setRevoking({ id: h.id, reason: '' })} className={`${btn} bg-slate-700 text-white`}>Thu hồi</button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Notice n={notice} />
    </div>
  );
};

const MonthlyTab: React.FC = () => {
  const [month, setMonth] = useState(previousVnMonth(new Date()));
  const [data, setData] = useState<Awaited<ReturnType<typeof pointsApi.adminMonthly>> | null>(null);
  const [gift, setGift] = useState<Record<number, { userId: string; note: string }>>({});
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => pointsApi.adminMonthly(month).then(setData);
  useEffect(() => {
    void load();
  }, [month]);
  const d = data && data.ok ? data.data : null;
  const awarded = useMemo(() => new Map((d?.awards || []).map((a) => [a.rank, a])), [d]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">Tháng</span>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Tháng" className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-white" />
        {d && !d.finished && <span className="text-xs text-amber-300">Tháng chưa kết thúc — chỉ xem, chưa chốt được.</span>}
      </div>
      {d && (
        <>
          <ol className="bg-slate-900 border border-slate-700 rounded-2xl p-4 divide-y divide-slate-700 text-sm">
            {d.ranking.length === 0 ? <li className="text-xs text-slate-400">Chưa có điểm trong tháng.</li> : d.ranking.map((r) => (
              <li key={r.userId} className="py-1.5 flex justify-between gap-2"><span>{r.rank}. {r.fullName} <span className="text-xs text-slate-400">· {r.title}</span></span><strong>{r.points}</strong></li>
            ))}
          </ol>
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((rank) => {
              const a = awarded.get(rank);
              const g = gift[rank] || { userId: d.ranking[rank - 1]?.userId || '', note: '' };
              return (
                <div key={rank} className="bg-slate-900 border border-slate-700 rounded-2xl p-3 space-y-2 text-sm">
                  <p className="font-black">Hạng {rank}</p>
                  {a ? (
                    <p className="text-emerald-300">✓ {a.fullName} · {a.points} điểm<br /><span className="text-xs text-slate-300">Quà: {a.giftNote}</span></p>
                  ) : d.finished && d.ranking.length >= rank ? (
                    <form className="space-y-2" onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await pointsApi.awardMonthly(month, { rank, userId: g.userId, giftNote: g.note.trim() });
                      setNotice(r.ok ? { ok: true, text: `Đã ghi quà hạng ${rank}.` } : { ok: false, text: r.message });
                      void load();
                    }}>
                      <label className="sr-only" htmlFor={`mw-u-${rank}`}>Người nhận hạng {rank}</label>
                      <select id={`mw-u-${rank}`} value={g.userId} onChange={(e) => setGift({ ...gift, [rank]: { ...g, userId: e.target.value } })} className={field}>
                        {d.ranking.map((r) => <option key={r.userId} value={r.userId}>{r.rank}. {r.fullName} ({r.points})</option>)}
                      </select>
                      <label className="sr-only" htmlFor={`mw-g-${rank}`}>Quà đã trao</label>
                      <input id={`mw-g-${rank}`} value={g.note} onChange={(e) => setGift({ ...gift, [rank]: { ...g, note: e.target.value } })} className={field} placeholder="Quà đã trao" />
                      <button type="submit" disabled={g.note.trim().length < 3} className={`${btn} bg-teal-500 text-slate-950`}>Chốt & ghi quà</button>
                    </form>
                  ) : (
                    <p className="text-xs text-slate-400">{d.finished ? `Chưa có người đủ điểm cho hạng ${rank}.` : 'Chưa chốt.'}</p>
                  )}
                </div>
              );
            })}
          </div>
          <Notice n={notice} />
        </>
      )}
    </div>
  );
};

export const AdminCommunityPanel: React.FC<{ listings: { id: string; title: string }[] }> = ({ listings }) => {
  const [tab, setTab] = useState<Tab>('fees');
  return (
    <div className="bg-slate-900 px-4 pt-6">
      <section aria-labelledby="admin-community-title" className="max-w-6xl mx-auto bg-slate-850 border border-teal-500/30 rounded-3xl p-4 sm:p-6 space-y-4 text-white">
        <h2 id="admin-community-title" className="text-lg font-black">Phí nền tảng & Điểm Mây</h2>
        <div role="tablist" className="flex flex-wrap gap-2">
          {([['fees', 'Phí nền tảng'], ['points', 'Điểm Mây'], ['monthly', 'Top 3 tháng']] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`${btn} ${tab === k ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-white'}`}>{label}</button>
          ))}
        </div>
        {tab === 'fees' ? <FeesTab listings={listings} /> : tab === 'points' ? <PointsTab /> : <MonthlyTab />}
      </section>
    </div>
  );
};
