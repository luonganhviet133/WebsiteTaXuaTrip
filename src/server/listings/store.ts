/**
 * N03.2 — Truy vấn danh bạ trên D1 (Cloudflare) hoặc SQLite (Node dev/test) qua cùng giao diện D1.
 * Quy tắc chính:
 *  - Công khai chỉ đọc cơ sở status = 'approved' và đúng phiên bản published_version_id.
 *  - Mỗi cơ sở có tối đa một phiên bản đang mở (draft hoặc pending). Bản đã duyệt không bao giờ bị sửa đè.
 *  - Cấp xác minh 2–3 hết hạn sau 12 tháng kể từ verified_at (D06).
 */
import type { D1Database } from '../d1.ts';
import { slugifyVi, isValidListingId, type ListingContent } from './content.ts';

export type ListingStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type VersionStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type DataOrigin = 'scraped' | 'partner' | 'admin' | 'demo';

export interface Actor {
  id: string;
  role: 'traveler' | 'partner' | 'admin';
}

interface ListingRow {
  id: string;
  category: string;
  status: ListingStatus;
  data_origin: DataOrigin;
  source_name: string | null;
  source_ref: string | null;
  collected_at: string | null;
  verification_tier: 1 | 2 | 3;
  verification_source: string | null;
  verified_at: string | null;
  published_version_id: string | null;
  is_admin_featured: number;
  admin_priority_rank: number;
  admin_featured_label: string | null;
  created_at: string;
  updated_at: string;
  published_json?: string | null;
  published_at?: string | null;
  owner_provider_id?: string | null;
}

interface VersionRow {
  id: string;
  listing_id: string;
  version_no: number;
  status: VersionStatus;
  content_json: string;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
}

export interface VerificationInfo {
  tier: 1 | 2 | 3;
  /** Cấp đã ghi trong hồ sơ, trước khi tính hết hạn. */
  recordedTier: 1 | 2 | 3;
  source: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
}

export interface PublicListing extends ListingContent {
  id: string;
  status: 'approved';
  verificationTier: 1 | 2 | 3;
  verification: VerificationInfo;
  dataOrigin: DataOrigin;
  sourceName: string | null;
  collectedAt: string | null;
  updatedCalendarDate: string;
  rating: number;
  reviewCount: number;
  partnerId: string;
  claimedByOwner: boolean;
  ownerVerificationStatus: 'unclaimed' | 'verified_owner';
  isAdminFeatured: boolean;
  adminPriorityRank: number;
  adminFeaturedLabel?: string;
  stats: { views: number; callClicks: number; bookingsCount: number };
}

export interface VersionSummary {
  id: string;
  versionNo: number;
  status: VersionStatus;
  content: ListingContent;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  note: string | null;
}

export interface ManagedListing {
  id: string;
  status: ListingStatus;
  dataOrigin: DataOrigin;
  sourceName: string | null;
  collectedAt: string | null;
  verification: VerificationInfo;
  published: PublicListing | null;
  /** Bản đang soạn hoặc chờ duyệt. */
  openVersion: VersionSummary | null;
  /** Kết quả duyệt gần nhất (để chủ cơ sở thấy lý do bị từ chối). */
  latestReview: { status: VersionStatus; note: string | null; reviewedAt: string | null } | null;
  ownerProviderId: string | null;
}

export class StoreError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const VERIFICATION_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const nowIso = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

export function computeVerification(row: Pick<ListingRow, 'verification_tier' | 'verification_source' | 'verified_at'>, now = Date.now()): VerificationInfo {
  const recordedTier = row.verification_tier;
  if (recordedTier === 1 || !row.verified_at) {
    return { tier: 1, recordedTier, source: row.verification_source, verifiedAt: row.verified_at, expiresAt: null, expired: false };
  }
  const expiresAt = new Date(new Date(row.verified_at).getTime() + VERIFICATION_TTL_MS).toISOString();
  const expired = now > new Date(expiresAt).getTime();
  return { tier: expired ? 1 : recordedTier, recordedTier, source: row.verification_source, verifiedAt: row.verified_at, expiresAt, expired };
}

const SELECT_LISTING = `
  SELECT l.*, v.content_json AS published_json, v.reviewed_at AS published_at,
         (SELECT provider_id FROM provider_listings pl WHERE pl.listing_id = l.id ORDER BY pl.is_primary_owner DESC, pl.created_at LIMIT 1) AS owner_provider_id
  FROM listings l
  LEFT JOIN listing_versions v ON v.id = l.published_version_id`;

function toPublic(row: ListingRow): PublicListing | null {
  if (!row.published_json) return null;
  const content = JSON.parse(row.published_json) as ListingContent;
  const verification = computeVerification(row);
  return {
    ...content,
    id: row.id,
    status: 'approved',
    verificationTier: verification.tier,
    verification,
    dataOrigin: row.data_origin,
    sourceName: row.source_name,
    collectedAt: row.collected_at,
    updatedCalendarDate: (row.published_at || row.updated_at).slice(0, 10),
    // Đánh giá thật gắn với đơn đã hoàn tất (N06). Chưa có thì 0, không tự sinh.
    rating: 0,
    reviewCount: 0,
    partnerId: row.owner_provider_id || '',
    claimedByOwner: Boolean(row.owner_provider_id),
    ownerVerificationStatus: row.owner_provider_id ? 'verified_owner' : 'unclaimed',
    isAdminFeatured: Boolean(row.is_admin_featured),
    adminPriorityRank: row.admin_priority_rank || 0,
    ...(row.admin_featured_label ? { adminFeaturedLabel: row.admin_featured_label } : {}),
    stats: { views: 0, callClicks: 0, bookingsCount: 0 },
  };
}

const toVersion = (v: VersionRow): VersionSummary => ({
  id: v.id,
  versionNo: v.version_no,
  status: v.status,
  content: JSON.parse(v.content_json),
  createdAt: v.created_at,
  submittedAt: v.submitted_at,
  reviewedAt: v.reviewed_at,
  note: v.review_note,
});

export class ListingStore {
  constructor(private d1: D1Database) {}

  // ---------- Công khai ----------
  async listPublic(): Promise<PublicListing[]> {
    const res = await this.d1
      .prepare(`${SELECT_LISTING} WHERE l.status = 'approved' AND l.published_version_id IS NOT NULL ORDER BY l.is_admin_featured DESC, l.admin_priority_rank DESC, l.id`)
      .all<ListingRow>();
    return (res.results || []).map(toPublic).filter((x): x is PublicListing => x !== null);
  }

  async getPublic(id: string): Promise<PublicListing | null> {
    const row = await this.d1.prepare(`${SELECT_LISTING} WHERE l.id = ? AND l.status = 'approved'`).bind(id).first<ListingRow>();
    return row ? toPublic(row) : null;
  }

  /** Nội dung công khai + mã phiên bản, dùng cho báo giá (N04). Chỉ cơ sở đã duyệt. */
  async getPublishedForQuote(id: string): Promise<{ content: ListingContent; versionId: string } | null> {
    const row = await this.d1
      .prepare(
        `SELECT v.id AS version_id, v.content_json FROM listings l JOIN listing_versions v ON v.id = l.published_version_id WHERE l.id = ? AND l.status = 'approved'`
      )
      .bind(id)
      .first<{ version_id: string; content_json: string }>();
    return row ? { content: JSON.parse(row.content_json), versionId: row.version_id } : null;
  }

  // ---------- Quản lý ----------
  private async getRow(id: string): Promise<ListingRow | null> {
    return this.d1.prepare(`${SELECT_LISTING} WHERE l.id = ?`).bind(id).first<ListingRow>();
  }

  private async requireRow(id: string): Promise<ListingRow> {
    const row = await this.getRow(id);
    if (!row) throw new StoreError(404, 'Không tìm thấy cơ sở.');
    return row;
  }

  private async openVersion(listingId: string): Promise<VersionRow | null> {
    return this.d1
      .prepare(`SELECT * FROM listing_versions WHERE listing_id = ? AND status IN ('draft','pending') ORDER BY version_no DESC LIMIT 1`)
      .bind(listingId)
      .first<VersionRow>();
  }

  private async toManaged(row: ListingRow): Promise<ManagedListing> {
    const open = await this.openVersion(row.id);
    const last = await this.d1
      .prepare(`SELECT status, review_note, reviewed_at FROM listing_versions WHERE listing_id = ? AND reviewed_at IS NOT NULL AND created_by != 'importer' ORDER BY reviewed_at DESC, version_no DESC LIMIT 1`)
      .bind(row.id)
      .first<{ status: VersionStatus; review_note: string | null; reviewed_at: string | null }>();
    return {
      id: row.id,
      status: row.status,
      dataOrigin: row.data_origin,
      sourceName: row.source_name,
      collectedAt: row.collected_at,
      verification: computeVerification(row),
      published: toPublic(row),
      openVersion: open ? toVersion(open) : null,
      latestReview: last ? { status: last.status, note: last.review_note, reviewedAt: last.reviewed_at } : null,
      ownerProviderId: row.owner_provider_id || null,
    };
  }

  async getManaged(id: string): Promise<ManagedListing> {
    return this.toManaged(await this.requireRow(id));
  }

  async listForProvider(providerId: string): Promise<ManagedListing[]> {
    const res = await this.d1
      .prepare(`${SELECT_LISTING} WHERE l.id IN (SELECT listing_id FROM provider_listings WHERE provider_id = ?) ORDER BY l.id`)
      .bind(providerId)
      .all<ListingRow>();
    return Promise.all((res.results || []).map((r) => this.toManaged(r)));
  }

  async listForAdmin(opts: { pendingOnly?: boolean } = {}): Promise<ManagedListing[]> {
    const where = opts.pendingOnly
      ? `WHERE l.status = 'pending' OR EXISTS (SELECT 1 FROM listing_versions x WHERE x.listing_id = l.id AND x.status = 'pending')`
      : '';
    const res = await this.d1.prepare(`${SELECT_LISTING} ${where} ORDER BY l.updated_at DESC`).all<ListingRow>();
    return Promise.all((res.results || []).map((r) => this.toManaged(r)));
  }

  async isOwnedBy(listingId: string, providerId: string | undefined): Promise<boolean> {
    if (!providerId) return false;
    const r = await this.d1
      .prepare('SELECT 1 AS ok FROM provider_listings WHERE listing_id = ? AND provider_id = ?')
      .bind(listingId, providerId)
      .first<{ ok: number }>();
    return Boolean(r);
  }

  private async uniqueId(title: string): Promise<string> {
    const base = slugifyVi(title) || 'co-so';
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      if (!isValidListingId(candidate)) continue;
      const exists = await this.d1.prepare('SELECT 1 AS ok FROM listings WHERE id = ?').bind(candidate).first();
      if (!exists) return candidate;
    }
    return `${base.slice(0, 60)}-${crypto.randomUUID().slice(0, 8)}`;
  }

  /** Tạo cơ sở mới. Chủ cơ sở: nháp chưa công khai. Admin/dữ liệu mẫu: công khai ngay. */
  async create(
    content: ListingContent,
    actor: Actor,
    opts: { origin: DataOrigin; providerId?: string; publish: boolean; id?: string }
  ): Promise<ManagedListing> {
    const id = opts.id || (await this.uniqueId(content.title));
    const versionId = newId('lv');
    const now = nowIso();
    const stmts = [
      this.d1
        .prepare(
          `INSERT INTO listings (id, category, status, data_origin, published_version_id, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, content.category, opts.publish ? 'approved' : 'draft', opts.origin, opts.publish ? versionId : null, actor.id, now, now),
      this.d1
        .prepare(
          `INSERT INTO listing_versions (id, listing_id, version_no, status, content_json, created_by, created_at, reviewed_by, reviewed_at) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`
        )
        .bind(versionId, id, opts.publish ? 'approved' : 'draft', JSON.stringify(content), actor.id, now, opts.publish ? actor.id : null, opts.publish ? now : null),
    ];
    if (opts.providerId) {
      stmts.push(
        this.d1
          .prepare(`INSERT INTO provider_listings (id, provider_id, listing_id, is_primary_owner, created_at) VALUES (?, ?, ?, 1, ?)`)
          .bind(newId('pl'), opts.providerId, id, now)
      );
    }
    stmts.push(this.auditStmt(actor, 'listing.create', 'listing', id, { origin: opts.origin, publish: opts.publish }));
    await this.d1.batch(stmts);
    return this.getManaged(id);
  }

  /** Lưu bản nháp của chủ cơ sở. Bản đang chờ duyệt bị sửa thì quay về nháp, phải gửi lại. */
  async saveDraft(listingId: string, content: ListingContent, actor: Actor): Promise<ManagedListing> {
    await this.requireRow(listingId);
    const open = await this.openVersion(listingId);
    const now = nowIso();
    if (open) {
      await this.d1.batch([
        this.d1
          .prepare(`UPDATE listing_versions SET content_json = ?, status = 'draft', submitted_at = NULL, created_by = ?, created_at = ? WHERE id = ?`)
          .bind(JSON.stringify(content), actor.id, now, open.id),
        this.auditStmt(actor, 'listing.save_draft', 'listing', listingId, { versionId: open.id }),
      ]);
    } else {
      const next = await this.d1
        .prepare('SELECT COALESCE(MAX(version_no), 0) + 1 AS n FROM listing_versions WHERE listing_id = ?')
        .bind(listingId)
        .first<{ n: number }>();
      const versionId = newId('lv');
      await this.d1.batch([
        this.d1
          .prepare(`INSERT INTO listing_versions (id, listing_id, version_no, status, content_json, created_by, created_at) VALUES (?, ?, ?, 'draft', ?, ?, ?)`)
          .bind(versionId, listingId, next!.n, JSON.stringify(content), actor.id, now),
        this.auditStmt(actor, 'listing.save_draft', 'listing', listingId, { versionId }),
      ]);
    }
    return this.getManaged(listingId);
  }

  async submit(listingId: string, actor: Actor): Promise<ManagedListing> {
    const row = await this.requireRow(listingId);
    const open = await this.openVersion(listingId);
    if (!open || open.status !== 'draft') throw new StoreError(409, 'Không có bản nháp để gửi duyệt.');
    const now = nowIso();
    const stmts = [
      this.d1.prepare(`UPDATE listing_versions SET status = 'pending', submitted_at = ? WHERE id = ?`).bind(now, open.id),
      this.auditStmt(actor, 'listing.submit', 'listing', listingId, { versionId: open.id }),
    ];
    if (row.status === 'draft' || row.status === 'rejected') {
      stmts.push(this.d1.prepare(`UPDATE listings SET status = 'pending', updated_at = ? WHERE id = ?`).bind(now, listingId));
    }
    await this.d1.batch(stmts);
    return this.getManaged(listingId);
  }

  /** Admin duyệt hoặc từ chối bản đang chờ. Duyệt thì bản đó thành bản công khai. */
  async review(listingId: string, decision: 'approve' | 'reject', actor: Actor, note?: string): Promise<ManagedListing> {
    const row = await this.requireRow(listingId);
    const open = await this.openVersion(listingId);
    if (!open || open.status !== 'pending') throw new StoreError(409, 'Cơ sở không có bản chờ duyệt.');
    const now = nowIso();
    const stmts = [
      this.d1
        .prepare(`UPDATE listing_versions SET status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ?`)
        .bind(decision === 'approve' ? 'approved' : 'rejected', actor.id, now, note || null, open.id),
      this.auditStmt(actor, decision === 'approve' ? 'listing.approve_version' : 'listing.reject_version', 'listing', listingId, { versionId: open.id, note }),
    ];
    if (decision === 'approve') {
      const content = JSON.parse(open.content_json) as ListingContent;
      stmts.push(
        this.d1
          .prepare(`UPDATE listings SET published_version_id = ?, status = 'approved', category = ?, updated_at = ? WHERE id = ?`)
          .bind(open.id, content.category, now, listingId)
      );
    } else if (!row.published_version_id) {
      stmts.push(this.d1.prepare(`UPDATE listings SET status = 'rejected', updated_at = ? WHERE id = ?`).bind(now, listingId));
    }
    await this.d1.batch(stmts);
    return this.getManaged(listingId);
  }

  /** Admin sửa và công khai ngay (có log). Không đụng tới bản nháp đang mở của chủ cơ sở. */
  async adminPublish(listingId: string, content: ListingContent, actor: Actor): Promise<ManagedListing> {
    await this.requireRow(listingId);
    const next = await this.d1
      .prepare('SELECT COALESCE(MAX(version_no), 0) + 1 AS n FROM listing_versions WHERE listing_id = ?')
      .bind(listingId)
      .first<{ n: number }>();
    const versionId = newId('lv');
    const now = nowIso();
    await this.d1.batch([
      this.d1
        .prepare(
          `INSERT INTO listing_versions (id, listing_id, version_no, status, content_json, created_by, created_at, reviewed_by, reviewed_at, review_note) VALUES (?, ?, ?, 'approved', ?, ?, ?, ?, ?, 'Admin sửa trực tiếp')`
        )
        .bind(versionId, listingId, next!.n, JSON.stringify(content), actor.id, now, actor.id, now),
      this.d1
        .prepare(`UPDATE listings SET published_version_id = ?, status = 'approved', category = ?, updated_at = ? WHERE id = ?`)
        .bind(versionId, content.category, now, listingId),
      this.auditStmt(actor, 'listing.admin_publish', 'listing', listingId, { versionId }),
    ]);
    return this.getManaged(listingId);
  }

  async setStatus(listingId: string, status: ListingStatus, actor: Actor, note?: string): Promise<ManagedListing> {
    const row = await this.requireRow(listingId);
    if (status === 'approved' && !row.published_version_id) throw new StoreError(409, 'Cơ sở chưa có bản đã duyệt để công khai.');
    await this.d1.batch([
      this.d1.prepare('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?').bind(status, nowIso(), listingId),
      this.auditStmt(actor, 'listing.set_status', 'listing', listingId, { from: row.status, to: status, note }),
    ]);
    return this.getManaged(listingId);
  }

  async setVerification(listingId: string, tier: 1 | 2 | 3, source: string, actor: Actor): Promise<ManagedListing> {
    await this.requireRow(listingId);
    const now = nowIso();
    await this.d1.batch([
      this.d1
        .prepare('UPDATE listings SET verification_tier = ?, verification_source = ?, verified_at = ?, verified_by = ?, updated_at = ? WHERE id = ?')
        .bind(tier, tier === 1 ? null : source, tier === 1 ? null : now, tier === 1 ? null : actor.id, now, listingId),
      this.auditStmt(actor, 'listing.set_verification', 'listing', listingId, { tier, source }),
    ]);
    return this.getManaged(listingId);
  }

  async setFeatured(listingId: string, f: { isAdminFeatured: boolean; adminPriorityRank: number; adminFeaturedLabel?: string }, actor: Actor): Promise<ManagedListing> {
    await this.requireRow(listingId);
    await this.d1.batch([
      this.d1
        .prepare('UPDATE listings SET is_admin_featured = ?, admin_priority_rank = ?, admin_featured_label = ?, updated_at = ? WHERE id = ?')
        .bind(f.isAdminFeatured ? 1 : 0, f.adminPriorityRank, f.adminFeaturedLabel || null, nowIso(), listingId),
      this.auditStmt(actor, 'listing.set_featured', 'listing', listingId, f),
    ]);
    return this.getManaged(listingId);
  }

  // ---------- Nhận chính chủ ----------
  async createClaim(
    listingId: string,
    actor: Actor,
    data: { ownerName: string; ownerPhone: string; zalo?: string; evidenceNote: string }
  ): Promise<{ id: string; status: 'pending' }> {
    await this.requireRow(listingId);
    const id = newId('claim');
    try {
      await this.d1.batch([
        this.d1
          .prepare(
            `INSERT INTO listing_claims (id, listing_id, user_id, owner_name, owner_phone, zalo, evidence_note, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
          )
          .bind(id, listingId, actor.id, data.ownerName, data.ownerPhone, data.zalo || null, data.evidenceNote, nowIso()),
        this.auditStmt(actor, 'claim.create', 'listing', listingId, { claimId: id }),
      ]);
    } catch (err: any) {
      if (/UNIQUE/i.test(err.message)) throw new StoreError(409, 'Bạn đã có hồ sơ nhận cơ sở này đang chờ duyệt.');
      throw err;
    }
    return { id, status: 'pending' };
  }

  async listClaims(status?: string) {
    const res = await this.d1
      .prepare(
        `SELECT c.id, c.listing_id AS listingId, c.user_id AS userId, c.owner_name AS ownerName, c.owner_phone AS ownerPhone, c.zalo,
                c.evidence_note AS evidenceNote, c.status, c.review_note AS reviewNote, c.created_at AS createdAt,
                json_extract(v.content_json, '$.title') AS listingTitle
         FROM listing_claims c
         JOIN listings l ON l.id = c.listing_id
         LEFT JOIN listing_versions v ON v.id = l.published_version_id
         ${status ? 'WHERE c.status = ?' : ''}
         ORDER BY c.created_at DESC`
      )
      .bind(...(status ? [status] : []))
      .all();
    return res.results || [];
  }

  /** Duyệt claim chỉ gắn quyền sở hữu cho nhà cung cấp; không thay đổi cấp xác minh. */
  async reviewClaim(claimId: string, decision: 'approve' | 'reject', actor: Actor, note?: string) {
    const claim = await this.d1
      .prepare(`SELECT c.*, p.id AS provider_id FROM listing_claims c LEFT JOIN providers p ON p.user_id = c.user_id WHERE c.id = ?`)
      .bind(claimId)
      .first<{ id: string; listing_id: string; status: string; provider_id: string | null }>();
    if (!claim) throw new StoreError(404, 'Không tìm thấy hồ sơ nhận cơ sở.');
    if (claim.status !== 'pending') throw new StoreError(409, 'Hồ sơ đã được xử lý.');
    if (decision === 'approve' && !claim.provider_id) throw new StoreError(409, 'Người gửi chưa có hồ sơ nhà cung cấp.');
    const now = nowIso();
    const stmts = [
      this.d1
        .prepare('UPDATE listing_claims SET status = ?, reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ?')
        .bind(decision === 'approve' ? 'approved' : 'rejected', actor.id, now, note || null, claimId),
      this.auditStmt(actor, decision === 'approve' ? 'claim.approve' : 'claim.reject', 'listing', claim.listing_id, { claimId, note }),
    ];
    if (decision === 'approve') {
      stmts.push(
        this.d1
          .prepare(
            `INSERT INTO provider_listings (id, provider_id, listing_id, is_primary_owner, created_at) VALUES (?, ?, ?, 1, ?)
             ON CONFLICT(provider_id, listing_id) DO NOTHING`
          )
          .bind(newId('pl'), claim.provider_id, claim.listing_id, now)
      );
    }
    await this.d1.batch(stmts);
    return { id: claimId, status: decision === 'approve' ? 'approved' : 'rejected' };
  }

  // ---------- Nhật ký, nội dung trang ----------
  private auditStmt(actor: Actor, action: string, entityType: string, entityId: string, detail?: unknown) {
    return this.d1
      .prepare('INSERT INTO audit_log (id, actor_id, actor_role, action, entity_type, entity_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(newId('au'), actor.id, actor.role, action, entityType, entityId, detail === undefined ? null : JSON.stringify(detail), nowIso());
  }

  async listAudit(entityId?: string, limit = 200) {
    const res = await this.d1
      .prepare(
        `SELECT id, actor_id AS actorId, actor_role AS actorRole, action, entity_type AS entityType, entity_id AS entityId, detail_json AS detail, created_at AS createdAt
         FROM audit_log ${entityId ? 'WHERE entity_id = ?' : ''} ORDER BY created_at DESC LIMIT ?`
      )
      .bind(...(entityId ? [entityId, limit] : [limit]))
      .all<any>();
    return (res.results || []).map((r: any) => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null }));
  }

  async getSiteContent(key = 'site'): Promise<unknown | null> {
    const r = await this.d1.prepare('SELECT content_json AS c FROM site_content WHERE key = ?').bind(key).first<{ c: string }>();
    return r ? JSON.parse(r.c) : null;
  }

  async putSiteContent(content: unknown, actor: Actor, key = 'site'): Promise<void> {
    const now = nowIso();
    await this.d1.batch([
      this.d1
        .prepare(
          `INSERT INTO site_content (key, content_json, updated_by, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET content_json = excluded.content_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at`
        )
        .bind(key, JSON.stringify(content), actor.id, now),
      this.auditStmt(actor, 'site_content.update', 'site_content', key),
    ]);
  }
}
