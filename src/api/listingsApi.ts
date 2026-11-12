/**
 * N03.3 — Gọi API danh bạ từ trình duyệt. Mọi thao tác ghi chỉ báo thành công khi server trả 2xx.
 */
import type { Listing, PartnerClaimRequest, PromoVoucher, VerificationTier } from '../types/index.ts';

export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors: ApiFieldError[] = []) {
    super(message);
  }
}

/** Hồ sơ quản lý (partner/admin): bản công khai + bản đang soạn/chờ duyệt. */
export interface ManagedListing {
  id: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  dataOrigin: Listing['dataOrigin'];
  published: Listing | null;
  openVersion: { id: string; status: 'draft' | 'pending'; content: Partial<Listing>; submittedAt: string | null } | null;
  latestReview: { status: string; note: string | null; reviewedAt: string | null } | null;
  verification: NonNullable<Listing['verification']>;
  ownerProviderId: string | null;
}

const token = () => (typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '');

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data || data.success === false) {
    throw new ApiError(res.status, data?.error || `Lỗi máy chủ (${res.status}).`, data?.errors || []);
  }
  return data.data as T;
}

/** Trường nội dung sửa được, gửi lên server (server tự bỏ trường không cho phép). */
export function toContent(l: Listing) {
  return {
    title: l.title,
    category: l.category,
    area: l.area,
    address: l.address,
    phone: l.phone,
    zalo: l.zalo,
    facebook: l.facebook || undefined,
    description: l.description,
    coverImage: l.coverImage,
    images: l.images,
    tags: l.tags,
    minPrice: l.minPrice,
    priceNote: l.priceNote,
    coordinates: l.coordinates,
    hasCloudView: l.hasCloudView,
    isInstantBooking: l.isInstantBooking,
    roomTypes: l.roomTypes,
    menuItems: l.menuItems,
    servicePackages: l.servicePackages,
    openingHours: l.openingHours,
    motorbikeFleet: l.motorbikeFleet,
    bankAccount: l.bankAccount,
  };
}

/** Hiển thị hồ sơ quản lý như một Listing: ưu tiên bản đang soạn/chờ duyệt để người sửa thấy đúng thứ mình vừa gửi. */
export function managedToListing(m: ManagedListing): Listing | null {
  const base = m.published;
  const content = m.openVersion?.content;
  if (!base && !content) return null;
  const status: Listing['status'] = m.openVersion?.status === 'pending' ? 'pending' : m.status;
  return {
    ...(base || ({} as Listing)),
    ...(content || {}),
    id: m.id,
    status,
    rating: base?.rating ?? 0,
    reviewCount: base?.reviewCount ?? 0,
    verificationTier: m.verification.tier,
    verification: m.verification,
    dataOrigin: m.dataOrigin,
    partnerId: m.ownerProviderId || '',
    coordinates: (content?.coordinates ?? base?.coordinates) || null,
    images: content?.images ?? base?.images ?? [],
    tags: content?.tags ?? base?.tags ?? [],
    updatedCalendarDate: base?.updatedCalendarDate || new Date().toISOString().slice(0, 10),
    isInstantBooking: Boolean(content?.isInstantBooking ?? base?.isInstantBooking),
    hasCloudView: Boolean(content?.hasCloudView ?? base?.hasCloudView),
    stats: base?.stats || { views: 0, callClicks: 0, bookingsCount: 0 },
  } as Listing;
}

export const listingsApi = {
  listPublic: () => request<Listing[]>('GET', '/api/listings'),
  getPublic: (id: string) => request<Listing>('GET', `/api/listings/${encodeURIComponent(id)}`),
  getSiteContent: () => request<unknown | null>('GET', '/api/site-content'),

  // Chủ cơ sở
  listMine: () => request<ManagedListing[]>('GET', '/api/partner/listings'),
  createMine: (l: Listing) => request<ManagedListing>('POST', '/api/partner/listings', { content: toContent(l) }),
  saveDraft: (l: Listing) => request<ManagedListing>('PUT', `/api/partner/listings/${encodeURIComponent(l.id)}`, { content: toContent(l) }),
  submit: (id: string) => request<ManagedListing>('POST', `/api/partner/listings/${encodeURIComponent(id)}/submit`),
  claim: (listingId: string, data: { ownerName: string; ownerPhone: string; zalo?: string; evidenceNote: string }) =>
    request<{ id: string }>('POST', `/api/listings/${encodeURIComponent(listingId)}/claims`, data),

  // Admin
  listAll: () => request<ManagedListing[]>('GET', '/api/admin/listings'),
  adminCreate: (l: Listing) => request<ManagedListing>('POST', '/api/admin/listings', { content: toContent(l) }),
  adminPublish: (l: Listing) => request<ManagedListing>('PUT', `/api/admin/listings/${encodeURIComponent(l.id)}`, { content: toContent(l) }),
  review: (id: string, decision: 'approve' | 'reject', note?: string) =>
    request<ManagedListing>('POST', `/api/admin/listings/${encodeURIComponent(id)}/review`, { decision, note }),
  setStatus: (id: string, status: Listing['status'], note?: string) =>
    request<ManagedListing>('POST', `/api/admin/listings/${encodeURIComponent(id)}/status`, { status, note }),
  setVerification: (id: string, tier: VerificationTier, source: string) =>
    request<ManagedListing>('POST', `/api/admin/listings/${encodeURIComponent(id)}/verification`, { tier, source }),
  setFeatured: (id: string, f: { isAdminFeatured: boolean; adminPriorityRank: number; adminFeaturedLabel?: string }) =>
    request<ManagedListing>('POST', `/api/admin/listings/${encodeURIComponent(id)}/featured`, f),
  listClaims: () => request<any[]>('GET', '/api/admin/claims'),
  reviewClaim: (id: string, decision: 'approve' | 'reject') => request<unknown>('POST', `/api/admin/claims/${encodeURIComponent(id)}/review`, { decision }),
  putSiteContent: (content: unknown) => request<void>('PUT', '/api/admin/site-content', { content }),

  // Voucher (N04.3) — chỉ admin
  listVouchers: () => request<any[]>('GET', '/api/admin/vouchers'),
  upsertVoucher: (v: PromoVoucher & { usageLimit?: number | null; maxDiscount?: number | null }) =>
    request<any>('POST', '/api/admin/vouchers', {
      code: v.code,
      title: v.title,
      discountType: v.discountType,
      discountValue: Math.round(v.discountValue),
      maxDiscount: v.maxDiscount ?? null,
      minBookingAmount: Math.round(v.minBookingAmount || 0),
      applicableCategory: v.applicableCategory,
      applicableListingId: v.applicableListingId || null,
      validUntil: v.validUntil || null,
      isActive: v.isActive,
      usageLimit: v.usageLimit ?? null,
      description: v.description,
    }),
};

/** Voucher từ server → kiểu hiển thị cũ của AdminDashboard (id = mã). */
export function voucherFromServer(v: any): PromoVoucher {
  return {
    id: v.code,
    code: v.code,
    title: v.title,
    discountType: v.discountType,
    discountValue: v.discountValue,
    minBookingAmount: v.minBookingAmount,
    applicableCategory: v.applicableCategory,
    applicableListingId: v.applicableListingId || undefined,
    isActive: v.isActive,
    validUntil: v.validUntil || '',
    description: v.description || '',
  };
}

/** Hồ sơ nhận chính chủ từ server → kiểu hiển thị cũ của AdminDashboard. */
export function claimToRequest(c: any): PartnerClaimRequest {
  return {
    id: c.id,
    listingId: c.listingId,
    listingTitle: c.listingTitle || c.listingId,
    ownerName: c.ownerName,
    ownerPhone: c.ownerPhone,
    zalo: c.zalo || '',
    cccdOrTax: '',
    proofDocumentNote: c.evidenceNote,
    status: c.status === 'approved' ? 'verified' : c.status,
    createdAt: String(c.createdAt || '').replace('T', ' ').slice(0, 16),
  };
}
