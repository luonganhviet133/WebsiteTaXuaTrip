/**
 * R5 — Dữ liệu cho lịch trình.
 *  - loadCatalog(): chỉ cơ sở đã duyệt + dữ kiện tham khảo đã duyệt + điểm tham quan đã duyệt.
 *  - ItineraryDataAdmin: admin xem/sửa/duyệt dữ liệu tra từ nguồn công khai; mọi thay đổi ghi audit_log trong cùng batch.
 */
import crypto from 'node:crypto';
import type { D1Database } from '../d1.ts';
import type { Catalog, CatalogListing, CatalogPlace, SourceRef } from '../../itinerary/engine.ts';

const CATEGORIES = ['homestay', 'restaurant', 'coffee', 'bus', 'tour', 'photo'] as const;
const VERIFIED_TTL_MS = 365 * 24 * 3600 * 1000; // D06: cấp 2–3 hết hạn sau 12 tháng
const rid = (p: string) => `${p}_${crypto.randomBytes(10).toString('hex')}`;
const parse = <T>(s: unknown, fallback: T): T => {
  try {
    return typeof s === 'string' ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

function toPlace(r: any): CatalogPlace {
  return {
    id: r.id, name: r.name, kind: r.kind, area: r.area, summary: r.summary,
    bestTimes: parse(r.best_times, []), styles: parse(r.styles, []), visitMinutes: r.visit_minutes, travelMinutes: r.travel_minutes ?? null,
    distanceKm: r.distance_km ?? null, entryFeeVnd: r.entry_fee_vnd ?? null, parkingFeeVnd: r.parking_fee_vnd ?? null, difficulty: r.difficulty ?? null,
    bestMonths: parse(r.best_months, []), notes: r.notes ?? null, coverImage: r.cover_image ?? null, sources: parse<SourceRef[]>(r.sources_json, []),
  };
}

export async function loadCatalog(d1: D1Database, now = new Date()): Promise<Catalog> {
  const [rows, facts, places] = await Promise.all([
    d1.prepare(
      `SELECT l.id, l.category, l.verification_tier, l.verified_at, l.is_admin_featured, v.content_json
       FROM listings l JOIN listing_versions v ON v.id = l.published_version_id
       WHERE l.status = 'approved' AND l.category IN (${CATEGORIES.map(() => '?').join(', ')})`
    ).bind(...CATEGORIES).all<any>(),
    d1.prepare(`SELECT listing_id, kind, value_json, sources_json FROM reference_facts WHERE status = 'approved'`).all<any>(),
    d1.prepare(`SELECT * FROM places WHERE status = 'approved' ORDER BY id`).all<any>(),
  ]);
  const factMap = new Map<string, any>();
  for (const f of facts.results ?? []) factMap.set(`${f.listing_id}:${f.kind}`, f);

  const listings: CatalogListing[] = (rows.results ?? []).map((r: any) => {
    const c = parse<any>(r.content_json, {});
    let tier = Number(r.verification_tier) as 1 | 2 | 3;
    if (tier >= 2 && (!r.verified_at || now.getTime() - Date.parse(r.verified_at) > VERIFIED_TTL_MS)) tier = 1;
    const price = factMap.get(`${r.id}:price_from`);
    const bus = factMap.get(`${r.id}:bus_route`);
    const pv = price ? parse<any>(price.value_json, null) : null;
    const bv = bus ? parse<any>(bus.value_json, null) : null;
    return {
      id: r.id, category: r.category, title: String(c.title || ''), area: String(c.area || ''), phone: String(c.phone || ''), zalo: String(c.zalo || ''),
      coverImage: String(c.coverImage || ''), tags: Array.isArray(c.tags) ? c.tags.map(String) : [], hasCloudView: !!c.hasCloudView,
      verificationTier: tier, featured: !!r.is_admin_featured,
      price: pv && Number(pv.amountVnd) > 0 ? { amountVnd: Number(pv.amountVnd), unit: String(pv.unit || ''), notes: pv.notes, sources: parse(price.sources_json, []) } : null,
      bus: bv ? { ...bv, sources: parse(bus.sources_json, []) } : null,
    };
  }).filter((l) => l.title);

  return { listings, places: (places.results ?? []).map(toPlace) };
}

type Fail = { ok: false; status: number; code: string; message: string };
const fail = (status: number, code: string, message: string): Fail => ({ ok: false, status, code, message });
const STATUSES = ['pending', 'approved', 'rejected', 'superseded', 'all'] as const;

export class ItineraryDataAdmin {
  constructor(private d1: D1Database) {}

  private audit(actorId: string, action: string, entityType: string, entityId: string, detail: Record<string, unknown>, nowIso: string) {
    return this.d1
      .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(rid('au'), actorId, 'admin', action, entityType, entityId, JSON.stringify(detail), nowIso);
  }

  async list(status: string | null) {
    const st = (status || 'pending') as (typeof STATUSES)[number];
    if (!STATUSES.includes(st)) return fail(400, 'INVALID_FILTER', 'Trạng thái lọc không hợp lệ.');
    const where = st === 'all' ? '' : 'WHERE status = ?';
    const bind = st === 'all' ? [] : [st];
    const [places, facts, counts] = await Promise.all([
      this.d1.prepare(`SELECT * FROM places ${where} ORDER BY travel_minutes IS NULL, travel_minutes, name`).bind(...bind).all<any>(),
      this.d1.prepare(
        `SELECT f.*, json_extract(v.content_json, '$.title') AS listing_title, l.category AS listing_category
         FROM reference_facts f JOIN listings l ON l.id = f.listing_id LEFT JOIN listing_versions v ON v.id = l.published_version_id
         ${where.replace('status', 'f.status')} ORDER BY f.kind, listing_title`
      ).bind(...bind).all<any>(),
      this.d1.prepare(
        `SELECT 'place' AS t, status, COUNT(*) AS n FROM places GROUP BY status UNION ALL SELECT 'fact', status, COUNT(*) FROM reference_facts GROUP BY status`
      ).all<any>(),
    ]);
    const summary: Record<string, Record<string, number>> = { place: {}, fact: {} };
    for (const c of counts.results ?? []) summary[c.t][c.status] = c.n;
    return {
      ok: true as const,
      data: {
        status: st,
        summary,
        places: (places.results ?? []).map((r: any) => ({ ...toPlace(r), status: r.status, reviewedAt: r.reviewed_at, reviewNote: r.review_note })),
        facts: (facts.results ?? []).map((r: any) => ({
          id: r.id, listingId: r.listing_id, listingTitle: r.listing_title, listingCategory: r.listing_category, kind: r.kind,
          value: parse(r.value_json, {}), sources: parse(r.sources_json, []), status: r.status, reviewedAt: r.reviewed_at, reviewNote: r.review_note,
        })),
      },
    };
  }

  /** Duyệt/từ chối hàng loạt. Duyệt dữ kiện mới thì bản đã duyệt trước (cùng cơ sở, cùng loại) chuyển 'superseded'. */
  async review(actorId: string, body: any) {
    const type = body?.type;
    const decision = body?.decision;
    const ids: string[] = Array.isArray(body?.ids) ? [...new Set(body.ids.filter((x: any) => typeof x === 'string' && x.length <= 80))] as string[] : [];
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 300) : '';
    if (type !== 'place' && type !== 'fact') return fail(400, 'INVALID_TYPE', 'Loại dữ liệu không hợp lệ.');
    if (decision !== 'approve' && decision !== 'reject') return fail(400, 'INVALID_DECISION', 'Chọn duyệt hoặc từ chối.');
    if (!ids.length || ids.length > 100) return fail(400, 'INVALID_IDS', 'Chọn từ 1 đến 100 mục.');
    if (decision === 'reject' && note.length < 3) return fail(400, 'REASON_REQUIRED', 'Ghi lý do từ chối (ít nhất 3 ký tự).');

    const table = type === 'place' ? 'places' : 'reference_facts';
    const existing = await this.d1.prepare(`SELECT id, status FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`).bind(...ids).all<any>();
    const found = new Map((existing.results ?? []).map((r: any) => [r.id, r.status]));
    const missing = ids.filter((id) => !found.has(id));
    if (missing.length) return fail(404, 'NOT_FOUND', `Không tìm thấy: ${missing.slice(0, 5).join(', ')}`);

    const nowIso = new Date().toISOString();
    const next = decision === 'approve' ? 'approved' : 'rejected';
    const stmts: any[] = [];
    let changed = 0;
    for (const id of ids) {
      if (found.get(id) === next) continue;
      changed++;
      if (type === 'fact' && next === 'approved') {
        stmts.push(
          this.d1.prepare(
            `UPDATE reference_facts SET status = 'superseded', reviewed_by = ?, reviewed_at = ?
             WHERE status = 'approved' AND id <> ? AND (listing_id, kind) = (SELECT listing_id, kind FROM reference_facts WHERE id = ?)`
          ).bind(actorId, nowIso, id, id)
        );
      }
      const extra = type === 'place' ? ', updated_at = ?' : '';
      const bind = type === 'place' ? [next, actorId, nowIso, note || null, nowIso, id] : [next, actorId, nowIso, note || null, id];
      stmts.push(this.d1.prepare(`UPDATE ${table} SET status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ?${extra} WHERE id = ?`).bind(...bind));
      stmts.push(this.audit(actorId, `itinerary_${type}_${decision}`, type === 'place' ? 'place' : 'reference_fact', id, { from: found.get(id), to: next, note: note || null }, nowIso));
    }
    if (stmts.length) await this.d1.batch(stmts);
    return { ok: true as const, data: { changed, unchanged: ids.length - changed } };
  }

  /** Sửa số liệu trước khi duyệt (chỉ các trường số/ghi chú). Sửa bản đã duyệt → chuyển lại 'pending' để duyệt lại. */
  async update(actorId: string, type: string, id: string, body: any) {
    const nowIso = new Date().toISOString();
    const int = (v: unknown, lo: number, hi: number) => (v === null ? null : Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi ? (v as number) : undefined);
    if (type === 'place') {
      const row = await this.d1.prepare('SELECT * FROM places WHERE id = ?').bind(id).first<any>();
      if (!row) return fail(404, 'NOT_FOUND', 'Không tìm thấy điểm tham quan.');
      const patch: Record<string, unknown> = {};
      const fields: Array<[string, string, number, number]> = [
        ['travelMinutes', 'travel_minutes', 0, 240], ['visitMinutes', 'visit_minutes', 15, 600], ['entryFeeVnd', 'entry_fee_vnd', 0, 5_000_000], ['parkingFeeVnd', 'parking_fee_vnd', 0, 1_000_000],
      ];
      for (const [k, col, lo, hi] of fields) {
        if (!(k in (body || {}))) continue;
        const v = int(body[k], lo, hi);
        if (v === undefined || (k === 'visitMinutes' && v === null)) return fail(400, 'INVALID_VALUE', `Giá trị ${k} không hợp lệ.`);
        patch[col] = v;
      }
      if (typeof body?.notes === 'string') patch.notes = body.notes.trim().slice(0, 1000) || null;
      if (!Object.keys(patch).length) return fail(400, 'NOTHING_TO_UPDATE', 'Không có trường nào để sửa.');
      const cols = Object.keys(patch);
      await this.d1.batch([
        this.d1.prepare(`UPDATE places SET ${cols.map((c) => `${c} = ?`).join(', ')}, status = 'pending', updated_at = ? WHERE id = ?`).bind(...cols.map((c) => patch[c]), nowIso, id),
        this.audit(actorId, 'itinerary_place_update', 'place', id, { before: Object.fromEntries(cols.map((c) => [c, row[c]])), after: patch }, nowIso),
      ]);
      return { ok: true as const, data: { id, status: 'pending' } };
    }
    if (type === 'fact') {
      const row = await this.d1.prepare('SELECT * FROM reference_facts WHERE id = ?').bind(id).first<any>();
      if (!row) return fail(404, 'NOT_FOUND', 'Không tìm thấy dữ kiện.');
      if (row.kind !== 'price_from') return fail(400, 'NOT_EDITABLE', 'Chỉ sửa được giá. Tuyến xe sai thì từ chối và ghi lý do.');
      const value = parse<any>(row.value_json, {});
      const amount = int(body?.amountVnd, 1000, 100_000_000);
      const unit = typeof body?.unit === 'string' && ['phòng/đêm', 'người/đêm', 'người'].includes(body.unit) ? body.unit : undefined;
      if (amount === undefined && unit === undefined) return fail(400, 'INVALID_VALUE', 'Giá (1.000–100.000.000đ) hoặc đơn vị không hợp lệ.');
      const after = { ...value, ...(amount ? { amountVnd: amount } : {}), ...(unit ? { unit } : {}), notes: 'Đã được admin chỉnh sửa/xác nhận.' };
      await this.d1.batch([
        this.d1.prepare(`UPDATE reference_facts SET value_json = ?, status = 'pending', reviewed_by = NULL, reviewed_at = NULL WHERE id = ?`).bind(JSON.stringify(after), id),
        this.audit(actorId, 'itinerary_fact_update', 'reference_fact', id, { before: value, after }, nowIso),
      ]);
      return { ok: true as const, data: { id, status: 'pending' } };
    }
    return fail(400, 'INVALID_TYPE', 'Loại dữ liệu không hợp lệ.');
  }
}
