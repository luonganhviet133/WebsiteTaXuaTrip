/**
 * R5 — Lên lịch trình Tà Xùa.
 * Lịch dựng bằng quy tắc từ cơ sở và điểm tham quan đã duyệt (server). AI (nếu bật) chỉ đọc ghi chú và viết lời dẫn.
 * Đổi/bỏ một điểm gửi lại cùng hạt giống + overrides nên các khung khác giữ nguyên.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Bed, Bus, Camera, Coffee, ExternalLink, Info, MapPin, Minus, Moon, Mountain, Phone, Plus, Printer, RefreshCw, Shuffle, Sparkles, Sun, Trash2, Utensils, Wallet,
} from 'lucide-react';
import { Badge, Button, Card, Sheet } from './ui/index.ts';
import { cx } from './ui/cx.ts';
import { itineraryApi, type ItineraryMeta, type PlanInput, type PlanResponse } from '../api/itineraryApi.ts';
import { BUDGETS, DURATIONS, STYLES, TRANSPORTS, formatVnd, type CatalogListing, type CatalogPlace, type PlanItem, type Style } from '../itinerary/engine.ts';
import type { Listing } from '../types/index.ts';

const KIND_ICON: Record<PlanItem['kind'], React.FC<{ className?: string }>> = {
  transport: Bus, stay: Bed, place: Mountain, meal: Utensils, coffee: Coffee, rest: Moon, free: Sun,
};
const TIER_LABEL: Record<number, string> = { 1: 'Tự khai', 2: 'Đã kiểm giấy tờ', 3: 'Thẩm định thực địa' };
const DIFFICULTY: Record<string, string> = { de: 'Dễ đi', 'trung-binh': 'Độ khó vừa', kho: 'Đường khó' };

function defaultStart() {
  const d = new Date(Date.now() + 14 * 86400_000);
  // ưu tiên thứ Bảy gần nhất sau 2 tuần
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
const dayLabel = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; role?: string }> = ({ active, onClick, children, role = 'radio' }) => (
  <button
    type="button"
    role={role}
    aria-checked={active}
    onClick={onClick}
    className={cx(
      'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
      active ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-300 bg-white text-slate-800 hover:border-brand-400'
    )}
  >
    {children}
  </button>
);

const Group: React.FC<{ label: string; hint?: string; children: React.ReactNode; multi?: boolean }> = ({ label, hint, children, multi }) => (
  <fieldset className="space-y-2">
    <legend className="text-sm font-bold text-slate-900">{label}</legend>
    {hint && <p className="text-xs text-slate-600">{hint}</p>}
    <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  </fieldset>
);

function ContactLinks({ l }: { l: CatalogListing }) {
  if (!l.phone && !l.zalo) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {l.phone && (
        <a href={`tel:${l.phone}`} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50">
          <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Gọi {l.phone}
        </a>
      )}
      {l.zalo && (
        <a href={`https://zalo.me/${l.zalo}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50">
          Zalo
        </a>
      )}
    </div>
  );
}

export const ItineraryPlanner: React.FC<{ listings: Listing[]; onSelectListing: (l: Listing) => void }> = ({ listings, onSelectListing }) => {
  const [meta, setMeta] = useState<ItineraryMeta | null>(null);
  const [form, setForm] = useState<PlanInput>({
    duration: '2N1D', styles: ['san-may'], groupSize: 2, budget: 'vua', startDate: defaultStart(), transport: 'xe-khach', seed: 1, overrides: {}, avoidIds: [], preferIds: [],
  });
  const [note, setNote] = useState('');
  const [narrate, setNarrate] = useState(true);
  const [result, setResult] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [day, setDay] = useState(0);
  const [swap, setSwap] = useState<PlanItem | null>(null);

  useEffect(() => {
    itineraryApi.meta().then((r) => r.ok && setMeta(r.data));
  }, []);

  const listingById = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const refListing = (id?: string | null) => (id && result ? result.refs.listings[id] : undefined);
  const refPlace = (id?: string | null) => (id && result ? result.refs.places[id] : undefined);

  const run = async (input: PlanInput, opts: { withAi: boolean; keepDay?: boolean }) => {
    setBusy(true);
    setError(null);
    const r = await itineraryApi.plan({ ...input, ...(opts.withAi ? { note: note.trim() || undefined, narrate } : {}) });
    setBusy(false);
    if (!r.ok) {
      setError({ message: r.message, field: (r as any).field });
      return;
    }
    // Lần sau (đổi điểm) dùng lại request đã gộp gợi ý AI, không gọi AI nữa.
    const merged = r.data.plan.request;
    setForm((f) => ({ ...f, styles: merged.styles, avoidIds: merged.avoidIds, preferIds: merged.preferIds, overrides: merged.overrides, seed: merged.seed }));
    setResult(r.data);
    if (!opts.keepDay) setDay(0);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run({ ...form, overrides: {}, avoidIds: [], preferIds: [] }, { withAi: true });
  };
  const reshuffle = () => run({ ...form, seed: (form.seed % 100000) + 1, overrides: {} }, { withAi: false });
  const applyOverride = (slotKey: string, id: string | null) => {
    setSwap(null);
    run({ ...form, overrides: { ...form.overrides, [slotKey]: id } }, { withAi: false, keepDay: true });
  };

  const toggleStyle = (s: Style) =>
    setForm((f) => {
      const has = f.styles.includes(s);
      const next = has ? f.styles.filter((x) => x !== s) : [...f.styles, s];
      return { ...f, styles: next.length ? next : f.styles };
    });

  const plan = result?.plan;
  const current = plan?.days[day];
  const endDate = plan ? plan.days[plan.days.length - 1].date : null;

  const altFor = (it: PlanItem) =>
    it.alternatives
      .map((id) => (it.kind === 'place' ? refPlace(id) : refListing(id)))
      .filter(Boolean) as Array<CatalogListing | CatalogPlace>;

  const usedSources = useMemo(() => {
    if (!result || !plan) return [];
    const map = new Map<string, { name: string; url: string | null; accessed: string }>();
    for (const d of plan.days)
      for (const it of d.items) {
        const s = it.ref?.type === 'place' ? refPlace(it.ref.id)?.sources : [...(refListing(it.ref?.id)?.price?.sources ?? []), ...(refListing(it.ref?.id)?.bus?.sources ?? [])];
        for (const x of s ?? []) map.set(x.name, x);
      }
    return [...map.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 print:p-0">
      <header className="mb-6 space-y-2 print:hidden">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Lên lịch trình Tà Xùa</h1>
        <p className="max-w-3xl text-base text-slate-700">
          Chọn số ngày và kiểu chuyến đi — lịch được xếp theo giờ từ homestay, quán, nhà xe và điểm tham quan có trong danh bạ, kèm số điện thoại để bạn gọi đặt.
        </p>
        {meta && (
          <p className="text-sm text-slate-600">
            Dữ liệu hiện có: {meta.counts.homestays} homestay · {meta.counts.restaurants} quán ăn · {meta.counts.coffees} quán cà phê · {meta.counts.buses} nhà xe ({meta.counts.busesWithTimes} có giờ chạy) · {meta.counts.places} điểm tham quan đã kiểm.
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* ---------- FORM ---------- */}
        <Card className="h-fit space-y-5 lg:sticky lg:top-24 print:hidden">
          <form onSubmit={submit} className="space-y-5" noValidate>
            <Group label="Thời gian">
              {(Object.keys(DURATIONS) as Array<keyof typeof DURATIONS>).map((k) => (
                <Chip key={k} active={form.duration === k} onClick={() => setForm((f) => ({ ...f, duration: k }))}>
                  {DURATIONS[k].label}
                </Chip>
              ))}
            </Group>
            <Group label="Kiểu chuyến đi" hint="Chọn một hoặc nhiều." multi>
              {(Object.keys(STYLES) as Style[]).map((s) => (
                <Chip key={s} role="checkbox" active={form.styles.includes(s)} onClick={() => toggleStyle(s)}>
                  {STYLES[s]}
                </Chip>
              ))}
            </Group>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="itin-date" className="text-sm font-bold text-slate-900">Ngày đi</label>
                <input
                  id="itin-date"
                  type="date"
                  value={form.startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  aria-invalid={error?.field === 'startDate' || undefined}
                  className="min-h-11 w-full rounded-control border border-slate-500 bg-white px-3 text-base text-slate-900"
                />
              </div>
              <div className="space-y-1.5">
                <span id="itin-people" className="text-sm font-bold text-slate-900">Số người</span>
                <div className="flex min-h-11 items-center justify-between rounded-control border border-slate-500 bg-white" aria-labelledby="itin-people" role="group">
                  <button type="button" aria-label="Bớt một người" className="inline-flex h-11 w-11 items-center justify-center text-slate-700 disabled:opacity-40" disabled={form.groupSize <= 1} onClick={() => setForm((f) => ({ ...f, groupSize: f.groupSize - 1 }))}>
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="text-base font-bold text-slate-900" aria-live="polite">{form.groupSize}</span>
                  <button type="button" aria-label="Thêm một người" className="inline-flex h-11 w-11 items-center justify-center text-slate-700 disabled:opacity-40" disabled={form.groupSize >= 30} onClick={() => setForm((f) => ({ ...f, groupSize: f.groupSize + 1 }))}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <Group label="Ngân sách chỗ ở" hint="Áp dụng cho homestay đã có giá tham khảo.">
              {(Object.keys(BUDGETS) as Array<keyof typeof BUDGETS>).map((b) => (
                <Chip key={b} active={form.budget === b} onClick={() => setForm((f) => ({ ...f, budget: b }))}>
                  {BUDGETS[b]}
                </Chip>
              ))}
            </Group>
            <Group label="Di chuyển từ Hà Nội">
              {(Object.keys(TRANSPORTS) as Array<keyof typeof TRANSPORTS>).map((t) => (
                <Chip key={t} active={form.transport === t} onClick={() => setForm((f) => ({ ...f, transport: t }))}>
                  {TRANSPORTS[t]}
                </Chip>
              ))}
            </Group>
            {meta?.aiAvailable && (
              <div className="space-y-2 rounded-card border border-brand-100 bg-brand-50 p-3">
                <label htmlFor="itin-note" className="flex items-center gap-1.5 text-sm font-bold text-brand-900">
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> Ghi chú thêm (không bắt buộc)
                </label>
                <textarea
                  id="itin-note"
                  value={note}
                  maxLength={300}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: đi cùng bố mẹ, không leo dốc; muốn xem ruộng bậc thang"
                  className="w-full rounded-control border border-slate-500 bg-white px-3 py-2 text-base text-slate-900"
                />
                <label className="flex min-h-11 items-center gap-2 text-sm text-slate-800">
                  <input type="checkbox" checked={narrate} onChange={(e) => setNarrate(e.target.checked)} className="h-5 w-5 accent-brand-800" />
                  AI viết lời dẫn ngắn cho từng ngày
                </label>
                <p className="text-xs text-slate-600">AI chỉ đọc ghi chú và viết lời dẫn; điểm đến, giờ và giá luôn lấy từ dữ liệu đã kiểm.</p>
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-sm font-semibold text-danger-700">
                {error.message}
              </p>
            )}
            <Button type="submit" size="lg" fullWidth loading={busy} className="rounded-full font-bold">
              {result ? 'Tạo lại lịch trình' : 'Tạo lịch trình'}
            </Button>
          </form>
        </Card>

        {/* ---------- KẾT QUẢ ---------- */}
        <section aria-live="polite" aria-busy={busy} className="min-w-0 space-y-5">
          {!plan && (
            <Card className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <Mountain className="h-10 w-10 text-brand-700" aria-hidden="true" />
              <p className="max-w-md text-base text-slate-700">
                Chọn thông tin bên cạnh rồi bấm <strong>Tạo lịch trình</strong>. Bạn có thể đổi hoặc bỏ từng điểm sau khi có lịch.
              </p>
            </Card>
          )}

          {plan && current && (
            <>
              <Card className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">{plan.title}</h2>
                    <p className="text-sm text-slate-700">
                      {dayLabel(plan.days[0].date)} – {dayLabel(endDate!)} · {plan.request.groupSize} người · {plan.request.styles.map((s) => STYLES[s]).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button variant="secondary" size="sm" onClick={reshuffle} loading={busy} className="rounded-full">
                      <Shuffle className="h-4 w-4" aria-hidden="true" /> Phương án khác
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => window.print()} className="rounded-full">
                      <Printer className="h-4 w-4" aria-hidden="true" /> In
                    </Button>
                  </div>
                </div>
                {result!.ai.hints && (
                  <p className="flex gap-2 rounded-control bg-brand-50 px-3 py-2 text-sm text-brand-900">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      AI đã đọc ghi chú:
                      {result!.ai.hints.styles.length > 0 && ` thêm kiểu "${result!.ai.hints.styles.map((s) => STYLES[s]).join(', ')}";`}
                      {result!.ai.hints.avoidPlaceIds.length > 0 && ` tránh ${result!.ai.hints.avoidPlaceIds.map((id) => refPlace(id)?.name ?? 'một điểm').join(', ')};`}
                      {result!.ai.hints.preferPlaceIds.length > 0 && ` ưu tiên ${result!.ai.hints.preferPlaceIds.map((id) => refPlace(id)?.name ?? 'một điểm').join(', ')};`}
                      {!result!.ai.hints.styles.length && !result!.ai.hints.avoidPlaceIds.length && !result!.ai.hints.preferPlaceIds.length && ' không thấy yêu cầu nào cần đổi lịch.'}
                    </span>
                  </p>
                )}
                {result!.ai.skipped && (note.trim() || narrate) && meta?.aiAvailable && (
                  <p className="text-xs text-slate-600">AI đang tạm nghỉ (hết lượt hoặc lỗi kết nối) — lịch vẫn dựng đầy đủ từ dữ liệu.</p>
                )}
                {plan.dataGaps.map((g) => (
                  <p key={g} className="flex gap-2 rounded-control border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {g}
                  </p>
                ))}
              </Card>

              {/* Tabs ngày */}
              <div role="tablist" aria-label="Các ngày" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden">
                {plan.days.map((d, i) => (
                  <button
                    key={d.date}
                    role="tab"
                    type="button"
                    aria-selected={i === day}
                    aria-controls={`itin-day-${i}`}
                    onClick={() => setDay(i)}
                    className={cx(
                      'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold',
                      i === day ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-300 bg-white text-slate-800 hover:border-brand-400'
                    )}
                  >
                    Ngày {d.index} · {d.weekday} {dayLabel(d.date)}
                  </button>
                ))}
              </div>

              {plan.days.map((d, i) => (
                <Card key={d.date} id={`itin-day-${i}`} role="tabpanel" className={cx('space-y-4', i !== day && 'hidden print:block')}>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Ngày {d.index}: {d.title}
                    </h3>
                    {d.intro && (
                      <p className="mt-1 flex gap-1.5 text-base italic text-slate-700">
                        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                        {d.intro}
                      </p>
                    )}
                  </div>
                  <ol className="relative space-y-3 border-l-2 border-brand-100 pl-5">
                    {d.items.map((it, idx) => {
                      const Icon = KIND_ICON[it.kind];
                      const l = it.ref?.type === 'listing' ? refListing(it.ref.id) : undefined;
                      const p = it.ref?.type === 'place' ? refPlace(it.ref.id) : undefined;
                      const appListing = l ? listingById.get(l.id) : undefined;
                      const canSwap = !!it.slotKey && it.alternatives.length > 0;
                      return (
                        <li key={`${it.slotKey ?? 'x'}-${idx}`} className="relative">
                          <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-800 text-white" aria-hidden="true">
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                            <div className="w-28 shrink-0 text-sm font-bold text-brand-800">
                              {it.previousNight ? <span className="block text-xs font-semibold text-slate-600">Tối hôm trước</span> : null}
                              {it.approx && !it.previousNight ? 'khoảng ' : ''}
                              {it.start}
                              {it.end ? `–${it.end}` : ''}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-base font-semibold text-slate-900">{it.title}</p>
                              {it.detail && <p className="text-sm text-slate-700">{it.detail}</p>}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {it.travelMinutes !== null && it.travelMinutes > 0 && (
                                  <Badge tone="neutral" icon={<MapPin className="h-3 w-3" aria-hidden="true" />}>đi khoảng {it.travelMinutes} phút</Badge>
                                )}
                                {p?.difficulty && <Badge tone={p.difficulty === 'kho' ? 'warning' : 'neutral'}>{DIFFICULTY[p.difficulty]}</Badge>}
                                {l && l.verificationTier >= 2 && <Badge tone="success">{TIER_LABEL[l.verificationTier]}</Badge>}
                                {l?.price && <Badge tone="info">giá tham khảo từ {formatVnd(l.price.amountVnd)}/{l.price.unit}</Badge>}
                              </div>
                              {l && <ContactLinks l={l} />}
                              <div className="flex flex-wrap gap-2 pt-1 print:hidden">
                                {canSwap && (
                                  <Button variant="ghost" size="sm" onClick={() => setSwap(it)} className="rounded-full px-2">
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" /> Đổi
                                  </Button>
                                )}
                                {it.slotKey && it.kind !== 'stay' && it.kind !== 'transport' && (
                                  <Button variant="ghost" size="sm" onClick={() => applyOverride(it.slotKey!, null)} className="rounded-full px-2 text-slate-700">
                                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Bỏ
                                  </Button>
                                )}
                                {appListing && (
                                  <Button variant="ghost" size="sm" onClick={() => onSelectListing(appListing)} className="rounded-full px-2">
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Xem cơ sở
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              ))}

              {/* Chi phí */}
              <Card className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Wallet className="h-5 w-5 text-brand-700" aria-hidden="true" /> Chi phí đã tính được
                </h3>
                {plan.cost.lines.length ? (
                  <>
                    <ul className="divide-y divide-slate-100">
                      {plan.cost.lines.map((c) => (
                        <li key={c.label} className="flex flex-wrap justify-between gap-x-4 py-2 text-sm">
                          <span className="min-w-0">
                            <span className="font-semibold text-slate-900">{c.label}</span>
                            <span className="block text-xs text-slate-600">{c.basis}</span>
                          </span>
                          <span className="font-bold text-slate-900">{c.minVnd === c.maxVnd ? formatVnd(c.minVnd) : `${formatVnd(c.minVnd)} – ${formatVnd(c.maxVnd)}`}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="flex flex-wrap justify-between gap-2 rounded-control bg-slate-50 px-3 py-2 text-base">
                      <span className="font-bold text-slate-900">Tổng phần đã tính</span>
                      <span className="font-extrabold text-brand-800">
                        {plan.cost.totalMinVnd === plan.cost.totalMaxVnd ? formatVnd(plan.cost.totalMinVnd) : `${formatVnd(plan.cost.totalMinVnd)} – ${formatVnd(plan.cost.totalMaxVnd)}`}
                        <span className="block text-right text-xs font-semibold text-slate-600">
                          ≈ {formatVnd(plan.cost.perPersonMinVnd)}
                          {plan.cost.perPersonMaxVnd !== plan.cost.perPersonMinVnd ? ` – ${formatVnd(plan.cost.perPersonMaxVnd)}` : ''}/người
                        </span>
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-700">Chưa có giá đã kiểm cho các mục trong lịch này.</p>
                )}
                {plan.cost.unknown.length > 0 && (
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Chưa tính (hỏi trực tiếp khi đặt):</p>
                    <ul className="ml-5 list-disc">
                      {plan.cost.unknown.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-slate-600">Giá là giá "từ" tham khảo theo nguồn ghi bên dưới, có thể đổi theo mùa — xác nhận với cơ sở trước khi chuyển cọc.</p>
              </Card>

              {plan.extras.length > 0 && (
                <Card className="space-y-2">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Camera className="h-5 w-5 text-brand-700" aria-hidden="true" /> Gợi ý thêm
                  </h3>
                  <p className="text-sm text-slate-600">Những điểm này chưa đủ dữ liệu đường đi để xếp giờ — hỏi homestay trước khi đi.</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {plan.extras.map((id) => {
                      const p = refPlace(id);
                      if (!p) return null;
                      return (
                        <li key={id} className="rounded-control border border-slate-200 p-3">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-sm text-slate-700">{p.summary}</p>
                          <p className="text-xs text-slate-600">{p.area}{p.distanceKm ? ` · khoảng ${p.distanceKm} km từ trung tâm` : ''}</p>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}

              <Card className="space-y-2 text-sm text-slate-700">
                <h3 className="text-base font-bold text-slate-900">Lưu ý</h3>
                <ul className="ml-5 list-disc space-y-1">
                  {plan.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                {usedSources.length > 0 && (
                  <>
                    <h4 className="pt-2 font-bold text-slate-900">Nguồn dữ liệu tham khảo</h4>
                    <ul className="ml-5 list-disc">
                      {usedSources.map((s) => (
                        <li key={s.name}>
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-800 underline">
                              {s.name}
                            </a>
                          ) : (
                            s.name
                          )}{' '}
                          (tra ngày {s.accessed.split('-').reverse().join('/')})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            </>
          )}
        </section>
      </div>

      <Sheet open={!!swap} onClose={() => setSwap(null)} title="Chọn phương án khác">
        {swap && (
          <ul className="space-y-2">
            {altFor(swap).map((x) => {
              const isPlace = 'summary' in x;
              const l = !isPlace ? (x as CatalogListing) : null;
              const p = isPlace ? (x as CatalogPlace) : null;
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => applyOverride(swap.slotKey!, x.id)}
                    className="w-full rounded-control border border-slate-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="block font-semibold text-slate-900">{p ? p.name : l!.title}</span>
                    <span className="block text-sm text-slate-700">
                      {p ? `${p.summary}${p.travelMinutes !== null ? ` · khoảng ${p.travelMinutes} phút từ trung tâm` : ''}` : [l!.area, l!.price ? `giá từ ${formatVnd(l!.price.amountVnd)}/${l!.price.unit}` : null, l!.verificationTier >= 2 ? TIER_LABEL[l!.verificationTier] : null].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
};

export default ItineraryPlanner;
