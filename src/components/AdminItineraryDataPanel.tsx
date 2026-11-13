/**
 * R5 — Admin: duyệt dữ liệu tham khảo cho lịch trình (điểm tham quan, tuyến xe, giá "từ").
 * Dữ liệu tra từ nguồn công khai nạp ở trạng thái chờ duyệt; chỉ bản đã duyệt được dùng để xếp lịch.
 * Sửa số liệu đưa mục về "chờ duyệt"; từ chối cần lý do. Mọi thao tác ghi nhật ký.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { itineraryApi, type AdminFact, type AdminItineraryData, type AdminPlace, type ReviewStatus } from '../api/itineraryApi.ts';
import { formatVnd } from '../itinerary/engine.ts';

const STATUS_LABEL: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', superseded: 'Đã thay', all: 'Tất cả' };
const STATUS_STYLE: Record<string, string> = { pending: 'bg-sky-700', approved: 'bg-emerald-700', rejected: 'bg-slate-600', superseded: 'bg-slate-700' };
const TIME_LABEL: Record<string, string> = { sunrise: 'bình minh', morning: 'sáng', afternoon: 'chiều', sunset: 'hoàng hôn' };

const Sources: React.FC<{ s: AdminPlace['sources'] }> = ({ s }) => (
  <ul className="text-xs text-slate-400 space-y-0.5">
    {s.map((x) => (
      <li key={x.name}>
        Nguồn:{' '}
        {x.url ? (
          <a href={x.url} target="_blank" rel="noopener noreferrer" className="text-teal-300 underline">
            {x.name}
          </a>
        ) : (
          x.name
        )}{' '}
        · tra {x.accessed}
      </li>
    ))}
  </ul>
);

function busSummary(v: any): string {
  const parts: string[] = [];
  if (v.outbound?.departures?.length) parts.push(`Hà Nội đi: ${v.outbound.departures.join(', ')}${v.outbound.pickup ? ` (đón ${v.outbound.pickup})` : ''}`);
  if (v.inbound?.departures?.length) parts.push(`Tà Xùa về: ${v.inbound.departures.join(', ')}`);
  if (v.durationMinutes) parts.push(`khoảng ${Math.round(v.durationMinutes / 60)} tiếng`);
  if (v.priceFromVnd) parts.push(`giá ${formatVnd(v.priceFromVnd)}${v.priceToVnd ? `–${formatVnd(v.priceToVnd)}` : ''}/${v.priceUnit}`);
  if (v.vehicles) parts.push(v.vehicles);
  return parts.join(' · ');
}

export const AdminItineraryDataPanel: React.FC = () => {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [data, setData] = useState<AdminItineraryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [selPlaces, setSelPlaces] = useState<Set<string>>(new Set());
  const [selFacts, setSelFacts] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});

  const load = useCallback(async () => {
    setError(null);
    const r = await itineraryApi.adminList(status);
    if (r.ok) {
      setData(r.data);
      setSelPlaces(new Set());
      setSelFacts(new Set());
    } else setError(r.message);
  }, [status]);
  useEffect(() => {
    load();
  }, [load]);

  const review = async (type: 'place' | 'fact', decision: 'approve' | 'reject') => {
    const ids = [...(type === 'place' ? selPlaces : selFacts)];
    if (!ids.length) return;
    setBusy(true);
    const r = await itineraryApi.adminReview(type, decision, ids, reason.trim() || undefined);
    setBusy(false);
    setNotice(r.ok ? { ok: true, text: `${decision === 'approve' ? 'Đã duyệt' : 'Đã từ chối'} ${r.data.changed} mục.` } : { ok: false, text: r.message });
    if (r.ok) {
      setReason('');
      load();
    }
  };

  const save = async (type: 'place' | 'fact', id: string) => {
    const e = edits[id] || {};
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(e)) {
      if (k === 'unit' || k === 'notes') patch[k] = v;
      else patch[k] = v.trim() === '' ? null : Number(v.replace(/[^\d]/g, ''));
    }
    setBusy(true);
    const r = await itineraryApi.adminUpdate(type, id, patch);
    setBusy(false);
    setNotice(r.ok ? { ok: true, text: 'Đã lưu. Mục chuyển về "Chờ duyệt" để duyệt lại.' } : { ok: false, text: r.message });
    if (r.ok) {
      setEdits((x) => ({ ...x, [id]: {} }));
      load();
    }
  };
  const setEdit = (id: string, k: string, v: string) => setEdits((x) => ({ ...x, [id]: { ...(x[id] || {}), [k]: v } }));
  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    setter(n);
  };

  const count = (t: 'place' | 'fact', s: string) => data?.summary[t][s] ?? 0;
  const facts = data?.facts ?? [];
  const busFacts = facts.filter((f) => f.kind === 'bus_route');
  const priceFacts = facts.filter((f) => f.kind === 'price_from');

  const Toolbar: React.FC<{ type: 'place' | 'fact'; selected: Set<string>; all: string[]; onAll: (s: Set<string>) => void }> = ({ type, selected, all, onAll }) => (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => onAll(selected.size === all.length ? new Set() : new Set(all))} className="min-h-10 px-3 rounded-xl bg-slate-800 border border-slate-600 text-xs font-bold text-slate-200">
        {selected.size === all.length && all.length ? 'Bỏ chọn' : `Chọn tất cả (${all.length})`}
      </button>
      <button type="button" disabled={!selected.size || busy} onClick={() => review(type, 'approve')} className="min-h-10 px-4 rounded-full bg-emerald-600 disabled:opacity-40 text-xs font-black text-white">
        Duyệt {selected.size || ''} mục
      </button>
      <button type="button" disabled={!selected.size || busy || reason.trim().length < 3} onClick={() => review(type, 'reject')} className="min-h-10 px-4 rounded-full bg-rose-700 disabled:opacity-40 text-xs font-black text-white" title="Ghi lý do ở ô phía trên trước khi từ chối">
        Từ chối
      </button>
    </div>
  );

  const numInput = (id: string, k: string, current: number | null, label: string, suffix: string) => (
    <label className="text-xs text-slate-300 flex items-center gap-1">
      {label}
      <input
        inputMode="numeric"
        value={edits[id]?.[k] ?? (current ?? '').toString()}
        onChange={(e) => setEdit(id, k, e.target.value)}
        className="w-24 min-h-9 rounded-lg bg-slate-950 border border-slate-500 px-2 text-sm text-white"
      />
      {suffix}
    </label>
  );

  return (
    <div className="space-y-5 text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <h2 className="text-lg font-black">Dữ liệu lịch trình</h2>
        <p className="text-sm text-slate-300">
          Điểm tham quan, giờ xe và giá "từ" được tra từ nguồn công khai. Chỉ mục <strong>đã duyệt</strong> mới dùng để xếp lịch cho khách. Kiểm nguồn, sửa số nếu cần, rồi duyệt. Gọi xác nhận với cơ sở là tốt nhất.
        </p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Trạng thái">
          {(['pending', 'approved', 'rejected', 'all'] as ReviewStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`min-h-10 px-4 rounded-xl text-xs font-bold border ${status === s ? 'bg-teal-500 text-slate-950 border-teal-500' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
            >
              {STATUS_LABEL[s]}
              {s !== 'all' && ` (${count('place', s) + count('fact', s)})`}
            </button>
          ))}
        </div>
        <label className="block text-xs text-slate-300">
          Lý do (bắt buộc khi từ chối)
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} className="mt-1 w-full min-h-10 rounded-lg bg-slate-950 border border-slate-500 px-3 text-sm text-white" />
        </label>
        {notice && <p className={`text-sm font-bold ${notice.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{notice.text}</p>}
        {error && <p className="text-sm font-bold text-rose-300">{error}</p>}
      </div>

      {/* ĐIỂM THAM QUAN */}
      <section className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black">Điểm tham quan ({data?.places.length ?? 0})</h3>
          <Toolbar type="place" selected={selPlaces} all={(data?.places ?? []).map((p) => p.id)} onAll={setSelPlaces} />
        </div>
        <ul className="space-y-3">
          {(data?.places ?? []).map((p) => (
            <li key={p.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3 space-y-2">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={selPlaces.has(p.id)} onChange={() => toggle(selPlaces, setSelPlaces, p.id)} className="mt-1 h-5 w-5 accent-teal-500" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    {p.travelMinutes === null && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-700">Chưa có thời gian đi → chỉ ở "Gợi ý thêm"</span>}
                  </span>
                  <span className="block text-sm text-slate-300">{p.summary}</span>
                  <span className="block text-xs text-slate-400">
                    {p.area} · {p.bestTimes.map((t) => TIME_LABEL[t]).join(', ')} · tham quan {p.visitMinutes} phút
                    {p.distanceKm ? ` · ~${p.distanceKm} km` : ''}
                    {p.entryFeeVnd ? ` · vé ${formatVnd(p.entryFeeVnd)}` : ''}
                    {p.parkingFeeVnd ? ` · gửi xe ${formatVnd(p.parkingFeeVnd)}` : ''}
                  </span>
                </span>
              </label>
              {p.notes && <p className="text-xs text-amber-200">Ghi chú nguồn: {p.notes}</p>}
              <Sources s={p.sources} />
              {p.reviewNote && <p className="text-xs text-slate-400">Lý do lần trước: {p.reviewNote}</p>}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {numInput(p.id, 'travelMinutes', p.travelMinutes, 'Đi từ trung tâm', 'phút')}
                {numInput(p.id, 'entryFeeVnd', p.entryFeeVnd, 'Vé', 'đ/người')}
                {edits[p.id] && Object.keys(edits[p.id]).length > 0 && (
                  <button type="button" disabled={busy} onClick={() => save('place', p.id)} className="min-h-9 px-3 rounded-full bg-sky-600 text-xs font-black">
                    Lưu số liệu
                  </button>
                )}
              </div>
            </li>
          ))}
          {data && !data.places.length && <li className="text-sm text-slate-400">Không có mục nào.</li>}
        </ul>
      </section>

      {/* TUYẾN XE + GIÁ */}
      <section className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black">Giờ xe & giá tham khảo ({facts.length})</h3>
          <Toolbar type="fact" selected={selFacts} all={facts.map((f) => f.id)} onAll={setSelFacts} />
        </div>
        {[['Tuyến xe', busFacts], ['Giá "từ" của cơ sở', priceFacts]].map(([title, list]) => (
          <div key={title as string} className="space-y-2">
            <h4 className="text-sm font-bold text-slate-300">{title as string}</h4>
            <ul className="space-y-2">
              {(list as AdminFact[]).map((f) => (
                <li key={f.id} className="rounded-xl border border-slate-700 bg-slate-950 p-3 space-y-1.5">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={selFacts.has(f.id)} onChange={() => toggle(selFacts, setSelFacts, f.id)} className="mt-1 h-5 w-5 accent-teal-500" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{f.listingTitle || f.listingId}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[f.status]}`}>{STATUS_LABEL[f.status]}</span>
                      </span>
                      <span className="block text-sm text-slate-300">
                        {f.kind === 'bus_route' ? busSummary(f.value) : `Giá từ ${formatVnd(f.value.amountVnd)}/${f.value.unit}`}
                      </span>
                    </span>
                  </label>
                  {f.value.notes && <p className="text-xs text-amber-200">{f.value.notes}</p>}
                  <Sources s={f.sources} />
                  {f.kind === 'price_from' && (
                    <div className="flex flex-wrap items-center gap-3">
                      {numInput(f.id, 'amountVnd', f.value.amountVnd, 'Giá', 'đ')}
                      <label className="text-xs text-slate-300 flex items-center gap-1">
                        Đơn vị
                        <select
                          value={edits[f.id]?.unit ?? f.value.unit}
                          onChange={(e) => setEdit(f.id, 'unit', e.target.value)}
                          className="min-h-9 rounded-lg bg-slate-950 border border-slate-500 px-2 text-sm text-white"
                        >
                          {['phòng/đêm', 'người/đêm', 'người'].map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </label>
                      {edits[f.id] && Object.keys(edits[f.id]).length > 0 && (
                        <button type="button" disabled={busy} onClick={() => save('fact', f.id)} className="min-h-9 px-3 rounded-full bg-sky-600 text-xs font-black">
                          Lưu
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {!(list as AdminFact[]).length && <li className="text-sm text-slate-400">Không có mục nào.</li>}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminItineraryDataPanel;
