/**
 * N03.2 — Route danh bạ. Trả undefined nếu không khớp route nào để api.ts xử lý tiếp.
 *
 * Công khai:  GET  /api/listings, GET /api/listings/:id, GET /api/site-content
 * Đã đăng nhập (partner): POST /api/listings/:id/claims
 * Partner:    GET  /api/partner/listings, POST /api/partner/listings,
 *             PUT  /api/partner/listings/:id (lưu nháp), POST /api/partner/listings/:id/submit
 * Admin:      GET  /api/admin/listings[?pending=1], POST /api/admin/listings, PUT /api/admin/listings/:id,
 *             POST /api/admin/listings/:id/{review|status|verification|featured},
 *             GET  /api/admin/claims, POST /api/admin/claims/:id/review,
 *             GET  /api/admin/audit[?entityId=], PUT /api/admin/site-content
 */
import { validateListingContent } from './content.ts';
import { ListingStore, StoreError, type Actor } from './store.ts';
import type { AuthenticatedUser } from '../auth.ts';

type Role = AuthenticatedUser['role'];

export interface ListingRouteDeps {
  store: ListingStore;
  json: (data: unknown, status?: number, headers?: Record<string, string>) => Response;
  readJson: (request: Request) => Promise<any>;
  requireRole: (allowed?: Role[]) => Promise<AuthenticatedUser | Response>;
}

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function handleListingRoutes(request: Request, pathname: string, deps: ListingRouteDeps): Promise<Response | undefined> {
  const { store, json, readJson, requireRole } = deps;
  const method = request.method;
  const url = new URL(request.url);
  const seg = pathname.split('/').filter(Boolean).map(decodeURIComponent); // ['api', ...]

  const wrap = async (fn: () => Promise<Response>): Promise<Response> => {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof StoreError) return json({ success: false, error: err.message }, err.status);
      throw err;
    }
  };
  const actorOf = (u: AuthenticatedUser): Actor => ({ id: u.id, role: u.role });
  const readContent = async (): Promise<{ content: any } | Response> => {
    const body = await readJson(request);
    if (body === null) return json({ success: false, error: 'INVALID_JSON: Dữ liệu gửi lên không hợp lệ.' }, 400);
    const result = validateListingContent(body.content);
    if (!result.ok) return json({ success: false, error: 'Thông tin cơ sở chưa hợp lệ.', errors: result.errors }, 400);
    return { content: result.content };
  };

  // ---------- Công khai ----------
  if (method === 'GET' && pathname === '/api/listings') {
    return json({ success: true, data: await store.listPublic() }, 200, NO_STORE);
  }
  if (method === 'GET' && seg.length === 3 && seg[1] === 'listings') {
    const item = await store.getPublic(seg[2]);
    if (!item) return json({ success: false, error: 'Không tìm thấy cơ sở hoặc cơ sở chưa được duyệt.' }, 404);
    return json({ success: true, data: item }, 200, NO_STORE);
  }
  if (method === 'GET' && pathname === '/api/site-content') {
    return json({ success: true, data: await store.getSiteContent() }, 200, NO_STORE);
  }

  // ---------- Nhận chính chủ ----------
  if (method === 'POST' && seg.length === 4 && seg[1] === 'listings' && seg[3] === 'claims') {
    const user = await requireRole(['partner']);
    if (user instanceof Response) return user;
    return wrap(async () => {
      const body = (await readJson(request)) || {};
      const ownerName = String(body.ownerName || '').trim().slice(0, 100);
      const ownerPhone = String(body.ownerPhone || '').trim().slice(0, 20);
      const evidenceNote = String(body.evidenceNote || '').trim().slice(0, 2000);
      if (!ownerName || !/^0\d{9}$/.test(ownerPhone.replace(/\s/g, '')) || evidenceNote.length < 5) {
        return json({ success: false, error: 'Cần tên chủ, số điện thoại 10 số và mô tả bằng chứng (giấy phép, ảnh biển hiệu…).' }, 400);
      }
      const claim = await store.createClaim(seg[2], actorOf(user), {
        ownerName,
        ownerPhone: ownerPhone.replace(/\s/g, ''),
        zalo: body.zalo ? String(body.zalo).slice(0, 20) : undefined,
        evidenceNote,
      });
      return json({ success: true, data: claim }, 201);
    });
  }

  // ---------- Partner ----------
  if (seg[1] === 'partner' && seg[2] === 'listings') {
    const user = await requireRole(['partner', 'admin']);
    if (user instanceof Response) return user;
    const actor = actorOf(user);

    if (method === 'GET' && seg.length === 3) {
      if (user.role === 'admin') return json({ success: true, data: await store.listForAdmin() }, 200, NO_STORE);
      return json({ success: true, data: user.providerId ? await store.listForProvider(user.providerId) : [] }, 200, NO_STORE);
    }

    if (method === 'POST' && seg.length === 3) {
      if (!user.providerId) return json({ success: false, error: 'Tài khoản chưa có hồ sơ nhà cung cấp.' }, 403);
      const parsed = await readContent();
      if (parsed instanceof Response) return parsed;
      return wrap(async () => json({ success: true, data: await store.create(parsed.content, actor, { origin: 'partner', providerId: user.providerId, publish: false }) }, 201));
    }

    if (seg.length >= 4) {
      const listingId = seg[3];
      const allowed = user.role === 'admin' || (await store.isOwnedBy(listingId, user.providerId));
      if (!allowed) return json({ success: false, error: 'FORBIDDEN: Bạn không có quyền chỉnh sửa cơ sở lưu trú này.' }, 403);

      if (method === 'PUT' && seg.length === 4) {
        const parsed = await readContent();
        if (parsed instanceof Response) return parsed;
        return wrap(async () => json({ success: true, data: await store.saveDraft(listingId, parsed.content, actor) }));
      }
      if (method === 'POST' && seg.length === 5 && seg[4] === 'submit') {
        return wrap(async () => json({ success: true, data: await store.submit(listingId, actor) }));
      }
    }
    return undefined;
  }

  // ---------- Admin ----------
  const adminListing = seg[1] === 'admin' && seg[2] === 'listings';
  const adminClaims = seg[1] === 'admin' && seg[2] === 'claims';
  const adminOther = seg[1] === 'admin' && (pathname === '/api/admin/audit' || pathname === '/api/admin/site-content');
  if (!adminListing && !adminClaims && !adminOther) return undefined;

  const admin = await requireRole(['admin']);
  if (admin instanceof Response) return admin;
  const actor = actorOf(admin);

  return wrap(async () => {
    if (adminListing) {
      if (method === 'GET' && seg.length === 3) {
        return json({ success: true, data: await store.listForAdmin({ pendingOnly: url.searchParams.get('pending') === '1' }) }, 200, NO_STORE);
      }
      if (method === 'POST' && seg.length === 3) {
        const parsed = await readContent();
        if (parsed instanceof Response) return parsed;
        return json({ success: true, data: await store.create(parsed.content, actor, { origin: 'admin', publish: true }) }, 201);
      }
      const listingId = seg[3];
      if (method === 'PUT' && seg.length === 4) {
        const parsed = await readContent();
        if (parsed instanceof Response) return parsed;
        return json({ success: true, data: await store.adminPublish(listingId, parsed.content, actor) });
      }
      if (method === 'POST' && seg.length === 5) {
        const body = (await readJson(request)) || {};
        const note = body.note ? String(body.note).slice(0, 500) : undefined;
        switch (seg[4]) {
          case 'review':
            if (body.decision !== 'approve' && body.decision !== 'reject') return json({ success: false, error: 'decision phải là approve hoặc reject.' }, 400);
            return json({ success: true, data: await store.review(listingId, body.decision, actor, note) });
          case 'status':
            if (!['draft', 'pending', 'approved', 'rejected'].includes(body.status)) return json({ success: false, error: 'Trạng thái không hợp lệ.' }, 400);
            return json({ success: true, data: await store.setStatus(listingId, body.status, actor, note) });
          case 'verification': {
            const tier = body.tier;
            const source = String(body.source || '').trim().slice(0, 300);
            if (![1, 2, 3].includes(tier)) return json({ success: false, error: 'Cấp xác minh phải là 1, 2 hoặc 3.' }, 400);
            if (tier > 1 && source.length < 5) return json({ success: false, error: 'Cấp 2–3 cần ghi nguồn xác minh (giấy tờ, người thẩm định, ngày).' }, 400);
            return json({ success: true, data: await store.setVerification(listingId, tier, source, actor) });
          }
          case 'featured': {
            const rank = Number(body.adminPriorityRank) || 0;
            return json({
              success: true,
              data: await store.setFeatured(
                listingId,
                { isAdminFeatured: Boolean(body.isAdminFeatured), adminPriorityRank: Math.max(0, Math.min(1000, Math.round(rank))), adminFeaturedLabel: body.adminFeaturedLabel ? String(body.adminFeaturedLabel).slice(0, 60) : undefined },
                actor
              ),
            });
          }
        }
      }
      return json({ success: false, error: 'API endpoint not found', path: pathname }, 404);
    }

    if (adminClaims) {
      if (method === 'GET' && seg.length === 3) return json({ success: true, data: await store.listClaims(url.searchParams.get('status') || undefined) }, 200, NO_STORE);
      if (method === 'POST' && seg.length === 5 && seg[4] === 'review') {
        const body = (await readJson(request)) || {};
        if (body.decision !== 'approve' && body.decision !== 'reject') return json({ success: false, error: 'decision phải là approve hoặc reject.' }, 400);
        return json({ success: true, data: await store.reviewClaim(seg[3], body.decision, actor, body.note ? String(body.note).slice(0, 500) : undefined) });
      }
      return json({ success: false, error: 'API endpoint not found', path: pathname }, 404);
    }

    if (method === 'GET' && pathname === '/api/admin/audit') {
      return json({ success: true, data: await store.listAudit(url.searchParams.get('entityId') || undefined) }, 200, NO_STORE);
    }
    if (method === 'PUT' && pathname === '/api/admin/site-content') {
      const body = await readJson(request);
      if (!body || typeof body.content !== 'object' || body.content === null) return json({ success: false, error: 'Thiếu nội dung trang.' }, 400);
      if (JSON.stringify(body.content).length > 200_000) return json({ success: false, error: 'Nội dung trang quá lớn.' }, 413);
      await store.putSiteContent(body.content, actor);
      return json({ success: true });
    }
    return json({ success: false, error: 'API endpoint not found', path: pathname }, 404);
  });
}
