/**
 * Business and Domain Rules for Tà Xùa Trip
 */
import type { BusType, MotorbikeFleet, RoomType, Booking } from '../types';

export interface CloudProbabilityParams {
  humidity: number; // in percent (e.g. 88)
  windSpeed: number; // in km/h (e.g. 8)
  tempDiff: number; // temperature difference between day and night in Celsius (e.g. 10)
}

/**
 * Tính xác suất xuất hiện biển mây Tà Xùa dựa trên công thức khí tượng:
 * - Độ ẩm cao (>80%) làm tăng xác suất mây
 * - Gió êm (<15km/h) giữ mây đọng lại trong thung lũng
 * - Chênh lệch nhiệt độ ngày & đêm lớn (>8°C) ngưng tụ hơi nước
 */
export function calculateCloudProbability(params: CloudProbabilityParams): { score: number; verdict: string } {
  const { humidity, windSpeed, tempDiff } = params;
  let score = 20; // base score

  // Humidity score
  if (humidity >= 90) score += 35;
  else if (humidity >= 80) score += 25;
  else if (humidity >= 70) score += 15;
  else score += 5;

  // Wind speed score
  if (windSpeed <= 10) score += 30;
  else if (windSpeed <= 18) score += 20;
  else if (windSpeed <= 25) score += 10;
  else score -= 10; // high wind blows clouds away

  // Temperature inversion / difference
  if (tempDiff >= 9) score += 20;
  else if (tempDiff >= 6) score += 12;
  else score += 5;

  // Clamp 5 - 98
  score = Math.max(5, Math.min(98, score));

  let verdict = 'Mây thưa - Nắng sớm';
  if (score >= 85) verdict = 'Biển mây dày đặc ngập thung lũng';
  else if (score >= 70) verdict = 'Mây luồn bồng bềnh cuộn sóng';
  else if (score >= 50) verdict = 'Mây rải rác - Đón hoàng hôn đẹp';

  return { score, verdict };
}

/**
 * Tính giờ đón dự kiến dựa trên giờ xuất bến và độ lệch phút tại điểm đón
 */
export function estimatePickupTime(departureTime: string, minuteOffset: number): string {
  const [hourStr, minStr] = departureTime.split(':');
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  if (isNaN(h) || isNaN(m)) return departureTime;

  const totalMin = (h * 60 + m + minuteOffset) % (24 * 60);
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;

  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Quyết định tính phí 50.000đ từ nhà cung cấp:
 * Theo mục 2 & 11 trong kế hoạch: Chỉ thu khi booking 'completed', kiểm soát bằng cờ billing_enabled
 */
export function calculatePlatformFee(bookingStatus: string, billingEnabled: boolean): number {
  if (bookingStatus !== 'completed') return 0;
  if (!billingEnabled) return 0;
  return 50000;
}

/**
 * Tính điểm "Mây" cho thành viên:
 * Mỗi booking hoàn tất được thưởng điểm, viết review xác thực được thưởng thêm
 */
export function calculateMemberPoints(bookingAmount: number, isVerifiedReview = false): number {
  if (bookingAmount <= 0) return 0;
  // 100.000đ = 10 điểm Mây, tối thiểu 30 điểm cho 1 booking
  const basePoints = Math.max(30, Math.floor(bookingAmount / 100000) * 10);
  const reviewBonus = isVerifiedReview ? 50 : 0;
  return basePoints + reviewBonus;
}

/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Tính khoảng cách đường đèo ước tính (km) giữa 2 tọa độ GPS (nhân hệ số quanh co đèo núi 1.35x)
 */
export function calculateDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightKm = R * c;
  // Nhân hệ số đường đèo uốn lượn Tà Xùa (1.35)
  return Math.round(straightKm * 1.35 * 10) / 10;
}

/**
 * Ước tính thời gian di chuyển bằng xe máy trên đường đèo Tà Xùa (tốc độ TB 22km/h)
 */
export function estimateMountainTravelMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.max(2, Math.round((distanceKm / 22) * 60));
}

/**
 * Kiểm tra xem một đơn đặt phòng có đủ điều kiện để lại đánh giá hay không:
 * Chỉ cho phép khi trạng thái là 'completed' và chưa đánh giá
 */
export function canBookingLeaveReview(status: string, alreadyReviewed = false): boolean {
  return status === 'completed' && !alreadyReviewed;
}

/**
 * Tính toán điểm trung bình mới và tổng số lượt đánh giá sau khi thêm 1 đánh giá mới
 */
export function calculateUpdatedRating(
  currentRating: number,
  currentReviewCount: number,
  newStarRating: number
): { rating: number; reviewCount: number } {
  const clampedStars = Math.max(1, Math.min(5, Math.round(newStarRating)));
  const safeCount = Math.max(0, currentReviewCount);
  const nextCount = safeCount + 1;
  const totalScore = currentRating * safeCount + clampedStars;
  const nextRating = Math.round((totalScore / nextCount) * 100) / 100;
  return {
    rating: Math.max(1, Math.min(5, nextRating)),
    reviewCount: nextCount
  };
}

export type QuickSuggestionId =
  | 'cloud_bedroom'
  | 'car_parking'
  | 'quiet_retreat'
  | 'large_group';

export interface QuickSuggestionItem {
  id: QuickSuggestionId;
  label: string;
  subtitle: string;
}

export const QUICK_SUGGESTIONS: QuickSuggestionItem[] = [
  {
    id: 'cloud_bedroom',
    label: 'View mây phòng ngủ',
    subtitle: 'Ngắm mây từ giường'
  },
  {
    id: 'car_parking',
    label: 'Có chỗ đậu ô tô',
    subtitle: 'Đường rộng, bãi an toàn'
  },
  {
    id: 'quiet_retreat',
    label: 'Yên tĩnh tuyệt đối',
    subtitle: 'Tách ồn ào, nghỉ dưỡng'
  },
  {
    id: 'large_group',
    label: 'Phù hợp nhóm đông',
    subtitle: 'Phòng đoàn ≥ 4 người'
  }
];

/**
 * Kiểm tra xem một cơ sở lưu trú (homestay) có khớp với tiêu chí 'Gợi ý nhanh' hay không
 */
export function matchesQuickSuggestion(
  listing: {
    category: string;
    tags: string[];
    description?: string;
    roomTypes?: Array<{ capacity: number; viewType: string; amenities: string[] }>;
  },
  suggestionId: QuickSuggestionId
): boolean {
  if (listing.category !== 'homestay') return false;

  const lowerTags = listing.tags.map((t) => t.toLowerCase());
  const lowerDesc = (listing.description || '').toLowerCase();

  switch (suggestionId) {
    case 'cloud_bedroom':
      return (
        lowerTags.some(
          (t) =>
            t.includes('view mây phòng ngủ') ||
            t.includes('view biển mây') ||
            t.includes('săn mây 360')
        ) ||
        lowerDesc.includes('chân giường') ||
        Boolean(
          listing.roomTypes?.some(
            (r) =>
              r.viewType.toLowerCase().includes('biển mây') &&
              r.amenities.some((a) => a.toLowerCase().includes('kính'))
          )
        )
      );

    case 'car_parking':
      return (
        lowerTags.some(
          (t) => t.includes('có chỗ đậu ô tô') || t.includes('đậu ô tô') || t.includes('bãi đỗ xe')
        ) || lowerDesc.includes('đậu ô tô')
      );

    case 'quiet_retreat':
      return (
        lowerTags.some(
          (t) => t.includes('yên tĩnh tuyệt đối') || t.includes('yên tĩnh') || t.includes('bình yên')
        ) || lowerDesc.includes('yên tĩnh tuyệt đối')
      );

    case 'large_group':
      return (
        lowerTags.some(
          (t) => t.includes('phù hợp nhóm đông') || t.includes('nhóm đông') || t.includes('gia đình')
        ) || Boolean(listing.roomTypes?.some((r) => r.capacity >= 4))
      );

    default:
      return false;
  }
}

/**
 * Kiểm tra hai khoảng ngày lưu trú [startA, endA) và [startB, endB) có trùng đêm nghỉ hay không
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const effectiveEndA = endA === startA ? `${startA}T23:59:59` : endA;
  const effectiveEndB = endB === startB ? `${startB}T23:59:59` : endB;
  return startA < effectiveEndB && startB < effectiveEndA;
}

/**
 * Kiểm tra xem homestay có còn phòng trống trong khoảng ngày [checkIn, checkOut) hay không
 */
/**
 * Bộ lọc "còn phòng trong ngày đã chọn": chỉ ẩn cơ sở khi có dữ liệu hạng phòng và chứng minh được là hết.
 * Cơ sở chưa nhập hạng phòng (N03: dữ liệu thu thập chưa có) là "chưa biết", vẫn hiện để khách liên hệ.
 */
export function hiddenByDateFilter(
  listing: Parameters<typeof isHomestayAvailableInDateRange>[0],
  checkIn: string,
  checkOut: string,
  bookings: Parameters<typeof isHomestayAvailableInDateRange>[3] = []
): boolean {
  if (!listing.roomTypes || listing.roomTypes.length === 0) return false;
  return !isHomestayAvailableInDateRange(listing, checkIn, checkOut, bookings).available;
}

export function isHomestayAvailableInDateRange(
  listing: {
    id: string;
    category: string;
    roomTypes?: Array<{
      name: string;
      availableRooms: number;
      capacity: number;
      bookedDateRanges?: Array<{ checkIn: string; checkOut: string }>;
    }>;
  },
  checkIn: string,
  checkOut: string,
  bookings: Array<{
    listingId: string;
    roomName?: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
  }> = []
): {
  available: boolean;
  availableRoomsCount: number;
  matchingRoomNames: string[];
} {
  if (listing.category !== 'homestay' || !listing.roomTypes || listing.roomTypes.length === 0) {
    return { available: false, availableRoomsCount: 0, matchingRoomNames: [] };
  }
  if (!checkIn || !checkOut || checkIn > checkOut) {
    return { available: false, availableRoomsCount: 0, matchingRoomNames: [] };
  }

  let totalAvailableInRange = 0;
  const matchingRoomNames: string[] = [];

  for (const room of listing.roomTypes) {
    if (room.availableRooms <= 0) continue;

    // Kiểm tra lịch khóa phòng (bookedDateRanges) của hạng phòng
    const isBlockedBySchedule = Boolean(
      room.bookedDateRanges?.some((range) =>
        doDateRangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut)
      )
    );
    if (isBlockedBySchedule) continue;

    // Đếm các đơn đặt phòng đang giữ chỗ (confirmed / checked_in) trùng khoảng ngày
    const overlappingBookingsCount = bookings.filter(
      (b) =>
        b.listingId === listing.id &&
        b.roomName === room.name &&
        (b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'pending') &&
        doDateRangesOverlap(checkIn, checkOut, b.checkInDate, b.checkOutDate)
    ).length;

    const remainingForRoom = Math.max(0, room.availableRooms - overlappingBookingsCount);
    if (remainingForRoom > 0) {
      totalAvailableInRange += remainingForRoom;
      matchingRoomNames.push(room.name);
    }
  }

  return {
    available: totalAvailableInRange > 0,
    availableRoomsCount: totalAvailableInRange,
    matchingRoomNames
  };
}

/**
 * Che thông tin cá nhân nhạy cảm (SĐT, CCCD 12 số, Số tài khoản) trước khi tạo embedding AI
 * (Theo PDF 2 - Mục 4.4 & Sprint 12)
 */
export function maskSensitivePII(text: string): { maskedText: string; piiFound: string[] } {
  const piiFound: string[] = [];
  let maskedText = text;

  // 1. Mask CCCD 12 chữ số
  const cccdRegex = /\b\d{12}\b/g;
  const cccdMatches = maskedText.match(cccdRegex);
  if (cccdMatches) {
    piiFound.push(...cccdMatches.map(() => 'CCCD_12_SO'));
    maskedText = maskedText.replace(cccdRegex, '[ĐÃ_CHE_CCCD]');
  }

  // 2. Mask Số điện thoại Việt Nam (03, 05, 07, 08, 09 hoặc +84, có thể có dấu cách/chấm)
  const phoneRegex = /(?:\+84|0)(?:3|5|7|8|9)(?:[\s.-]*\d){8}\b/g;
  const phoneMatches = maskedText.match(phoneRegex);
  if (phoneMatches) {
    piiFound.push(...phoneMatches.map(() => 'SDT_CA_NHAN'));
    maskedText = maskedText.replace(phoneRegex, '[ĐÃ_CHE_SĐT]');
  }

  // 3. Mask Số tài khoản ngân hàng (9 - 14 chữ số đi kèm từ khóa stk/tài khoản)
  const bankRegex = /(?:stk|tài khoản|tai khoan|chuyển khoản)[:\s-]*(\d{8,14})\b/gi;
  if (bankRegex.test(maskedText)) {
    piiFound.push('SO_TAI_KHOAN');
    maskedText = maskedText.replace(bankRegex, 'STK: [ĐÃ_CHE_STK]');
  }

  return { maskedText, piiFound };
}

/**
 * Tạo mã băm nối chuỗi (chained hash) cho tin nhắn mức Bằng chứng (Evidence Tier)
 * (Theo PDF 2 - Mục 3.2, 4.2 & Sprint 6)
 */
export function computeMessageHash(
  prevHash: string,
  seq: number,
  senderId: string,
  body: string,
  createdAt: string
): string {
  const payload = `${prevHash}|${seq}|${senderId}|${body}|${createdAt}`;
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `ev_${seq}_${hex1}${hex2}`;
}

/**
 * Kiểm tra tính toàn vẹn của chuỗi băm tin nhắn mức Bằng chứng (phát hiện sửa tay trong DB)
 * (Theo PDF 2 - Mục 9 Tiêu chí nghiệm thu)
 */
export function verifyEvidenceHashChain(
  messages: Array<{
    seq: number;
    senderId: string;
    body: string;
    createdAt: string;
    prevHash: string;
    hash: string;
  }>
): { valid: boolean; brokenAtSeq: number | null } {
  let expectedPrev = 'GENESIS_EVIDENCE_00000000';
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.seq !== i + 1) {
      return { valid: false, brokenAtSeq: msg.seq };
    }
    if (msg.prevHash !== expectedPrev) {
      return { valid: false, brokenAtSeq: msg.seq };
    }
    const recomputed = computeMessageHash(
      msg.prevHash,
      msg.seq,
      msg.senderId,
      msg.body,
      msg.createdAt
    );
    if (msg.hash !== recomputed) {
      return { valid: false, brokenAtSeq: msg.seq };
    }
    expectedPrev = msg.hash;
  }
  return { valid: true, brokenAtSeq: null };
}

/**
 * Lớp 1 - AI Kiểm duyệt tức thì & Chống Prompt Injection
 * (Theo PDF 2 - Mục 3.6, 4.4, 5 & Sprint 14)
 */
export function classifyChatMessageAI(body: string): {
  flagged: boolean;
  labels: string[];
  riskScore: number;
  reason: string;
} {
  const lower = body.toLowerCase();
  const labels: string[] = [];
  let riskScore = 0;
  const reasons: string[] = [];

  // 1. Phát hiện rủ chuyển khoản ngoài / đòi cọc riêng (lách bảo vệ sàn / lừa đảo)
  if (
    lower.includes('chuyển khoản ngoài') ||
    lower.includes('cọc riêng') ||
    lower.includes('ck trực tiếp') ||
    lower.includes('không qua web') ||
    lower.includes('cọc trước vào stk')
  ) {
    labels.push('OFF_PLATFORM_DEPOSIT_RISK');
    riskScore += 75;
    reasons.push('Dấu hiệu yêu cầu đặt cọc / chuyển khoản ngoài nền tảng');
  }

  // 2. Phát hiện tấn công Prompt Injection vào trợ lý AI
  if (
    lower.includes('bỏ qua hướng dẫn') ||
    lower.includes('ignore previous') ||
    lower.includes('system prompt') ||
    lower.includes('đọc tin nhắn của người khác') ||
    lower.includes('hoàn tiền ngay') ||
    lower.includes('đổi giá phòng thành 0')
  ) {
    labels.push('PROMPT_INJECTION_ATTEMPT');
    riskScore += 90;
    reasons.push('Phát hiện chỉ dẫn độc hại (Prompt Injection) cố vượt quyền truy cập hoặc ép hoàn tiền/đổi giá');
  }

  // 3. Phát hiện lộ thông tin nhạy cảm (CCCD / SĐT) trong phòng chưa duyệt
  const pii = maskSensitivePII(body);
  if (pii.piiFound.length > 0) {
    labels.push('PII_EXPOSED');
    riskScore += 40;
    reasons.push(`Chứa thông tin định danh cá nhân (${pii.piiFound.join(', ')})`);
  }

  riskScore = Math.min(100, riskScore);
  return {
    flagged: labels.length > 0,
    labels,
    riskScore,
    reason: reasons.join('; ') || 'An toàn'
  };
}

/**
 * Ma trận phân quyền trong Hệ thống Chat theo vai trò và mức lưu trữ
 * (Theo PDF 2 - Bảng Mục 3.4 & Sprint 8)
 */
export type ChatActorRole = 'member' | 'moderator' | 'room_owner' | 'admin' | 'ai';
export type ChatActionType =
  | 'send_message'
  | 'edit_or_delete_own'
  | 'pin_message'
  | 'hide_violation'
  | 'read_evidence_room'
  | 'export_conversation';

export function checkChatPermission(
  role: ChatActorRole,
  action: ChatActionType,
  context: {
    tier?: 'social' | 'evidence';
    isReadOnlyRoom?: boolean;
    minutesSinceSent?: number;
    isOwnRoom?: boolean;
    isMemberOfEvidenceRoom?: boolean;
    hasTicketAndAuditLog?: boolean;
    hasDualAdminApproval?: boolean;
  } = {}
): boolean {
  const {
    tier = 'social',
    isReadOnlyRoom = false,
    minutesSinceSent = 0,
    isOwnRoom = false,
    isMemberOfEvidenceRoom = false,
    hasTicketAndAuditLog = false,
    hasDualAdminApproval = false
  } = context;

  switch (action) {
    case 'send_message':
      if (role === 'member') return !isReadOnlyRoom;
      return true;

    case 'edit_or_delete_own':
      // Mức bằng chứng (evidence): KHÔNG UPDATE hoặc DELETE được tin (kể cả từ code ứng dụng)
      if (tier === 'evidence') return false;
      if (role === 'ai') return false;
      if (role === 'member') return minutesSinceSent <= 15;
      return true; // moderator, room_owner, admin trong mức social

    case 'pin_message':
      return role === 'moderator' || role === 'room_owner' || role === 'admin';

    case 'hide_violation':
      if (role === 'moderator' || role === 'admin') return true;
      if (role === 'room_owner') return isOwnRoom;
      return false; // member chỉ báo cáo, AI chỉ gắn cờ

    case 'read_evidence_room':
      if (role === 'member') return isMemberOfEvidenceRoom;
      if (role === 'admin') return hasTicketAndAuditLog;
      if (role === 'ai') return hasTicketAndAuditLog; // chỉ phần được cấp để tóm tắt khi có ticket
      return false; // moderator và chủ phòng kèo không đọc được phòng bằng chứng của người khác

    case 'export_conversation':
      if (role === 'member') return isMemberOfEvidenceRoom;
      if (role === 'admin') return hasDualAdminApproval;
      return false;

    default:
      return false;
  }
}

/**
 * Phân tích tin nhắn Zalo nhanh của Chủ cơ sở để cập nhật lịch trống tự động
 * Ví dụ: "Cuối tuần còn 2 phòng đôi" hoặc "Hôm nay hết phòng"
 * (Theo PDF 1 Mục 3 & PDF 3 Mục 5 Nhóm A)
 */
export function parseZaloAvailabilityCommand(message: string): {
  matched: boolean;
  availableCount: number | null;
  roomKeyword: string | null;
} {
  const clean = message.trim().toLowerCase();
  if (!clean) return { matched: false, availableCount: null, roomKeyword: null };

  if (clean.includes('hết phòng') || clean.includes('đóng phòng') || clean.includes('còn 0 phòng')) {
    return {
      matched: true,
      availableCount: 0,
      roomKeyword: clean.includes('bungalow')
        ? 'bungalow'
        : clean.includes('đôi')
        ? 'đôi'
        : clean.includes('kính')
        ? 'kính'
        : 'tất cả'
    };
  }

  const match = clean.match(/còn\s+(\d+)\s*phòng\s*([a-zA-ZÀ-ỹ0-9\s]*)/i);
  if (match) {
    const count = parseInt(match[1], 10);
    const keyword = (match[2] || '').trim() || 'tiêu chuẩn';
    return {
      matched: true,
      availableCount: isNaN(count) ? null : count,
      roomKeyword: keyword
    };
  }

  return { matched: false, availableCount: null, roomKeyword: null };
}

/**
 * Tạo liên kết theo dõi nguồn (UTM) từ các kênh cộng đồng ngoài (Zalo OA, FB Group, TikTok, QR Offline) về Website
 * (Theo PDF 1 - Mục 2, 7 & 13)
 */
export function buildCommunityUtmUrl(
  baseUrl: string,
  channel: 'zalo_oa' | 'zalo_group' | 'fb_page' | 'fb_group' | 'tiktok' | 'qr_offline',
  campaign: string
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanCampaign =
    campaign
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_')
      .replace(/_+/g, '_') || 'ta_xua_community';

  const mediumMap: Record<typeof channel, string> = {
    zalo_oa: 'oa_broadcast',
    zalo_group: 'trip_chat_group',
    fb_page: 'social_page',
    fb_group: 'community_group',
    tiktok: 'short_video',
    qr_offline: 'homestay_standee_qr'
  };

  return `${cleanBase}/?utm_source=${channel}&utm_medium=${mediumMap[channel]}&utm_campaign=${cleanCampaign}`;
}

/**
 * So sánh song song tối đa 3 Homestay theo các tiêu chí cốt lõi tại Tà Xùa
 */
export function compareHomestaysMatrix(
  homestays: Array<{
    id: string;
    title: string;
    area: string;
    minPrice: number;
    rating: number;
    reviewCount: number;
    verificationTier: number;
    hasCloudView: boolean;
    tags: string[];
    coordinates: { lat: number; lng: number } | null;
    roomTypes?: Array<{ capacity: number; availableRooms: number; totalRooms: number }>;
  }>
): {
  bestPriceId: string | null;
  bestRatingId: string | null;
  rows: Array<{
    id: string;
    title: string;
    area: string;
    minPrice: number;
    rating: number;
    verificationTier: number;
    cloudViewFromBed: boolean;
    carParking: boolean;
    quietRetreat: boolean;
    maxRoomCapacity: number;
    totalAvailableRooms: number;
    distanceToDinhGioKm: number | null; // null khi cơ sở chưa có tọa độ thật
  }>;
} {
  const dinhGioCoord = { lat: 21.3278, lng: 104.4775 };
  const slice = homestays.slice(0, 3);
  if (slice.length === 0) {
    return { bestPriceId: null, bestRatingId: null, rows: [] };
  }

  let bestPriceId = slice[0].id;
  let minPriceVal = slice[0].minPrice;
  let bestRatingId = slice[0].id;
  let maxRatingVal = slice[0].rating;

  const rows = slice.map((h) => {
    if (h.minPrice > 0 && h.minPrice < minPriceVal) {
      minPriceVal = h.minPrice;
      bestPriceId = h.id;
    }
    if (h.rating > maxRatingVal) {
      maxRatingVal = h.rating;
      bestRatingId = h.id;
    }

    const maxRoomCapacity =
      h.roomTypes && h.roomTypes.length > 0
        ? Math.max(...h.roomTypes.map((r) => r.capacity))
        : 2;
    const totalAvailableRooms =
      h.roomTypes && h.roomTypes.length > 0
        ? h.roomTypes.reduce((sum, r) => sum + r.availableRooms, 0)
        : 0;

    return {
      id: h.id,
      title: h.title,
      area: h.area,
      minPrice: h.minPrice,
      rating: h.rating,
      verificationTier: h.verificationTier,
      cloudViewFromBed: matchesQuickSuggestion({ category: 'homestay', tags: h.tags }, 'cloud_bedroom'),
      carParking: matchesQuickSuggestion({ category: 'homestay', tags: h.tags }, 'car_parking'),
      quietRetreat: matchesQuickSuggestion({ category: 'homestay', tags: h.tags }, 'quiet_retreat'),
      maxRoomCapacity,
      totalAvailableRooms,
      distanceToDinhGioKm: h.coordinates ? calculateDistanceKm(h.coordinates, dinhGioCoord) : null
    };
  });

  return { bestPriceId, bestRatingId, rows };
}

/**
 * Tạo và phân tích chuỗi query URL (Deep Linking) cho trạng thái lọc, chi tiết cơ sở và Wishlist nhóm
 */
export function buildDeepLinkSearchParams(params: {
  tab?: string;
  checkIn?: string;
  checkOut?: string;
  area?: string;
  listingId?: string | null;
  wishlistIds?: string[];
}): string {
  const parts: string[] = [];
  if (params.tab && params.tab !== 'explore') {
    parts.push(`tab=${encodeURIComponent(params.tab)}`);
  }
  if (params.checkIn) {
    parts.push(`checkin=${encodeURIComponent(params.checkIn)}`);
  }
  if (params.checkOut) {
    parts.push(`checkout=${encodeURIComponent(params.checkOut)}`);
  }
  if (params.area && params.area !== 'all') {
    parts.push(`area=${encodeURIComponent(params.area)}`);
  }
  if (params.listingId) {
    parts.push(`listing=${encodeURIComponent(params.listingId)}`);
  }
  if (params.wishlistIds && params.wishlistIds.length > 0) {
    parts.push(`wishlist=${encodeURIComponent(params.wishlistIds.join(','))}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export function parseDeepLinkSearchParams(search: string): {
  tab?: string;
  checkIn?: string;
  checkOut?: string;
  area?: string;
  listingId?: string;
  wishlistIds?: string[];
} {
  const clean = search.startsWith('?') ? search.slice(1) : search;
  if (!clean) return {};
  const sp = new URLSearchParams(clean);
  const tab = sp.get('tab') || undefined;
  const checkIn = sp.get('checkin') || undefined;
  const checkOut = sp.get('checkout') || undefined;
  const area = sp.get('area') || undefined;
  const listingId = sp.get('listing') || undefined;
  const wishlistRaw = sp.get('wishlist');
  const wishlistIds = wishlistRaw
    ? wishlistRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  return { tab, checkIn, checkOut, area, listingId, wishlistIds };
}

/**
 * Tính số tiền giảm giá từ Promo Voucher của admin
 */
export function calculateVoucherDiscount(
  voucher: {
    isActive: boolean;
    discountPercent?: number;
    discountAmount?: number;
    minBookingAmount?: number;
    maxDiscountAmount?: number;
  },
  bookingAmount: number
): { isValid: boolean; discountAmount: number; error?: string } {
  if (!voucher.isActive) {
    return { isValid: false, discountAmount: 0, error: 'Mã ưu đãi hiện chưa được kích hoạt hoặc đã hết hạn.' };
  }

  if (voucher.minBookingAmount && bookingAmount < voucher.minBookingAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      error: `Đơn đặt cần tối thiểu ${formatVND(voucher.minBookingAmount)} để áp dụng mã này.`
    };
  }

  let discount = 0;
  if (voucher.discountPercent) {
    discount = Math.round((bookingAmount * voucher.discountPercent) / 100);
    if (voucher.maxDiscountAmount && discount > voucher.maxDiscountAmount) {
      discount = voucher.maxDiscountAmount;
    }
  } else if (voucher.discountAmount) {
    discount = Math.min(voucher.discountAmount, bookingAmount);
  }

  return {
    isValid: true,
    discountAmount: discount
  };
}

/**
 * Tính điểm tích lũy theo tỷ lệ % tùy chỉnh của Admin (mặc định 2-10% giá trị đặt phòng)
 */
export function calculateDynamicRewardPoints(
  bookingAmount: number,
  pointEarnRatePercent: number = 2
): number {
  if (bookingAmount <= 0) return 0;
  // Mỗi 1.000đ = 1 điểm cơ sở quy đổi, nhân với tỷ lệ %
  const basePoints = Math.floor(bookingAmount / 10000); // 1.000.000đ -> 100 điểm base
  const multiplier = Math.max(0.5, pointEarnRatePercent / 2);
  return Math.round(basePoints * multiplier);
}

/**
 * Xác thực thông tin biểu mẫu Đăng ký xác nhận chính chủ cơ sở
 */
export function validateOwnerClaimForm(data: {
  ownerName: string;
  ownerPhone: string;
  cccdOrTax: string;
  proofDocument: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.ownerName.trim()) {
    errors.ownerName = 'Vui lòng nhập họ và tên chủ cơ sở.';
  }

  const phoneRegex = /(?:\+84|0)(?:3|5|7|8|9)(?:[\s.-]*\d){8}\b/;
  if (!phoneRegex.test(data.ownerPhone.trim())) {
    errors.ownerPhone = 'Số điện thoại không hợp lệ (cần 10 số di động).';
  }

  if (!data.cccdOrTax.trim() || data.cccdOrTax.trim().length < 8) {
    errors.cccdOrTax = 'Vui lòng cung cấp CCCD (12 số) hoặc Mã số thuế hợp lệ.';
  }

  if (!data.proofDocument.trim() || data.proofDocument.trim().length < 15) {
    errors.proofDocument = 'Vui lòng mô tả tài liệu minh chứng (tối thiểu 15 ký tự).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Xác thực thông tin đăng nhập theo từng vai trò (Admin, Chủ cơ sở, Khách hàng)
 */
export function validateLoginCredentials(
  identifier: string,
  pass: string,
  role: 'traveler' | 'partner' | 'admin'
): { isValid: boolean; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanId) {
    return { isValid: false, error: 'Vui lòng nhập Email hoặc Số điện thoại.' };
  }
  if (!cleanPass) {
    return { isValid: false, error: 'Vui lòng nhập mật khẩu.' };
  }
  if (cleanPass.length < 6) {
    return { isValid: false, error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' };
  }

  // Admin validation requirement
  if (role === 'admin' && !cleanId.includes('@') && !cleanId.includes('admin')) {
    return { isValid: false, error: 'Tài khoản Quản trị viên cần sử dụng email quản trị (@taxuatrip.vn).' };
  }

  return { isValid: true };
}

/**
 * Xác thực form đăng ký người dùng mới
 */
export function validateRegisterForm(data: {
  fullName: string;
  emailOrPhone: string;
  password: string;
  confirmPassword?: string;
  role: 'traveler' | 'partner' | 'admin';
  facilityName?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.fullName.trim() || data.fullName.trim().length < 2) {
    errors.fullName = 'Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự).';
  }

  const cleanId = data.emailOrPhone.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId);
  const isPhone = /(?:\+84|0)(?:3|5|7|8|9)(?:[\s.-]*\d){8}\b/.test(cleanId);
  if (!cleanId || (!isEmail && !isPhone)) {
    errors.emailOrPhone = 'Vui lòng nhập email hợp lệ hoặc số điện thoại di động Việt Nam.';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Mật khẩu phải từ 6 ký tự trở lên.';
  }

  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  if (data.role === 'partner' && (!data.facilityName || !data.facilityName.trim())) {
    errors.facilityName = 'Chủ cơ sở cần nhập tên Homestay hoặc Dịch vụ phụ trách.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Trả về thông tin huy hiệu vai trò
 */
export function getRoleBadgeInfo(role: 'traveler' | 'partner' | 'admin'): {
  label: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  border: string;
} {
  switch (role) {
    case 'admin':
      return {
        label: 'Quản trị viên (Admin)',
        shortLabel: 'Admin',
        color: 'text-rose-700',
        bgLight: 'bg-rose-50',
        border: 'border-rose-200'
      };
    case 'partner':
      return {
        label: 'Chủ cơ sở Homestay',
        shortLabel: 'Chủ cơ sở',
        color: 'text-amber-700',
        bgLight: 'bg-amber-50',
        border: 'border-amber-200'
      };
    case 'traveler':
    default:
      return {
        label: 'Khách du lịch',
        shortLabel: 'Khách hàng',
        color: 'text-teal-700',
        bgLight: 'bg-teal-50',
        border: 'border-teal-200'
      };
  }
}

/**
 * 1. CÔNG THỨC TÍNH TIỀN THUÊ XE MÁY:
 * Tính theo ngày. Mốc trả xe TRƯỚC HOẶC ĐÚNG 12:00 trưa hôm sau được tính 0.5 ngày (nửa ngày).
 * Sau 12:00 trưa tính tròn 1 ngày.
 */
export interface MotorbikeRentalCalculation {
  billableDays: number;
  calculatedDays: number;
  daysLabel: string;
  dailyPrice: number;
  bikeCount: number;
  totalCost: number;
  isHalfDayReturn: boolean;
  breakdown: string;
}

export function calculateMotorbikeRentalCost(
  pickupDate: string,
  pickupTime: string,
  returnDate: string,
  returnTime: string,
  dailyPrice: number,
  bikeCount: number = 1
): MotorbikeRentalCalculation {
  if (bikeCount <= 0 || dailyPrice <= 0) {
    return {
      billableDays: 0,
      calculatedDays: 0,
      daysLabel: '0 ngày',
      dailyPrice,
      bikeCount: Math.max(0, bikeCount),
      totalCost: 0,
      isHalfDayReturn: false,
      breakdown: 'Thông tin thuê xe không hợp lệ'
    };
  }

  const d1 = new Date(pickupDate);
  const d2 = new Date(returnDate);
  const timeDiffMs = d2.getTime() - d1.getTime();
  const calendarDayDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

  // Phân tích giờ trả xe
  const [returnHStr = '12', returnMStr = '00'] = (returnTime || '12:00').split(':');
  const returnH = parseInt(returnHStr, 10);
  const returnM = parseInt(returnMStr, 10);
  const returnTotalMinutes = (isNaN(returnH) ? 12 : returnH) * 60 + (isNaN(returnM) ? 0 : returnM);

  // Mốc 12:00 trưa = 12 * 60 = 720 phút
  const isBeforeOrAtNoon = returnTotalMinutes <= 720;

  let billableDays = 1;
  let isHalfDayReturn = false;

  if (calendarDayDiff <= 0) {
    // Trả cùng ngày
    if (isBeforeOrAtNoon) {
      billableDays = 0.5;
      isHalfDayReturn = true;
    } else {
      billableDays = 1.0;
      isHalfDayReturn = false;
    }
  } else {
    // Thuê qua ngày: ngày đầu tính 1 ngày, các ngày giữa (nếu có) tính 1 ngày mỗi ngày.
    // Ngày trả xe: nếu trả trước/đúng 12h trưa tính 0.5 ngày; nếu sau 12h trưa tính 1.0 ngày.
    const intermediaryDays = Math.max(0, calendarDayDiff - 1);
    const returnDayPortion = isBeforeOrAtNoon ? 0.5 : 1.0;
    isHalfDayReturn = isBeforeOrAtNoon;
    billableDays = 1 + intermediaryDays + returnDayPortion;
  }

  const totalCost = billableDays * dailyPrice * bikeCount;
  const daysLabel = isHalfDayReturn
    ? `${billableDays} ngày (trả trước 12h tính nửa ngày)`
    : `${billableDays} ngày tròn`;
  const breakdown = `${bikeCount} xe x ${billableDays} ngày (${isHalfDayReturn ? 'ngày cuối trước 12h tính nửa ngày' : 'trọn ngày'}) x ${dailyPrice.toLocaleString('vi-VN')}đ`;

  return {
    billableDays,
    calculatedDays: billableDays,
    daysLabel,
    dailyPrice,
    bikeCount,
    totalCost,
    isHalfDayReturn,
    breakdown
  };
}

/**
 * 2. CÔNG THỨC COMBO XE KHÁCH + THUÊ XE MÁY:
 * Khách chọn combo cả 2 dịch vụ được hưởng chiết khấu ưu đãi (mặc định 10%)
 */
export function calculateBusAndMotorbikeCombo(
  busTicketPrice: number,
  seatCount: number,
  motorbikeTotalCost: number,
  discountPercent: number = 10
): {
  busTotal: number;
  motorbikeTotal: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  comboBadge: string;
} {
  const busTotal = Math.max(0, busTicketPrice) * Math.max(1, seatCount);
  const motorbikeTotal = Math.max(0, motorbikeTotalCost);
  const originalTotal = busTotal + motorbikeTotal;

  // Chiết khấu chỉ áp dụng khi có cả vé xe và thuê xe máy
  const discountAmount = motorbikeTotal > 0 && busTotal > 0
    ? Math.round((originalTotal * discountPercent) / 100)
    : 0;

  const finalTotal = Math.max(0, originalTotal - discountAmount);

  return {
    busTotal,
    motorbikeTotal,
    originalTotal,
    discountAmount,
    finalTotal,
    comboBadge: discountAmount > 0 ? `Combo Tiết Kiệm - Giảm ${discountPercent}%` : 'Giá tiêu chuẩn'
  };
}

/**
 * 3. QUẢN LÝ KHO XE MÁY ĐI KÈM CỦA NHÀ XE:
 * Tự động trừ khi có booking trên web, cập nhật khi nhà xe cho thuê thêm bên ngoài
 */
export function calculateRemainingMotorbikes(
  fleet: MotorbikeFleet | undefined,
  activeWebBookingsCount: number = 0
): {
  totalBikes: number;
  rentedOfflineCount: number;
  activeWebBookingsCount: number;
  availableBikes: number;
  isAvailable: boolean;
  statusText: string;
} {
  if (!fleet || !fleet.enabled) {
    return {
      totalBikes: 0,
      rentedOfflineCount: 0,
      activeWebBookingsCount: 0,
      availableBikes: 0,
      isAvailable: false,
      statusText: 'Không cung cấp dịch vụ thuê xe máy kèm theo'
    };
  }

  const total = Math.max(0, fleet.totalBikes || 0);
  const offline = Math.max(0, fleet.rentedOfflineCount || 0);
  const web = Math.max(0, activeWebBookingsCount);
  const availableBikes = Math.max(0, total - offline - web);

  return {
    totalBikes: total,
    rentedOfflineCount: offline,
    activeWebBookingsCount: web,
    availableBikes,
    isAvailable: availableBikes > 0,
    statusText: availableBikes > 0
      ? `Còn ${availableBikes}/${total} xe khả dụng (Thuê ngoài: ${offline}, Đặt qua web: ${web})`
      : `Đã hết xe (Tổng ${total} xe, Thuê ngoài: ${offline}, Đặt qua web: ${web})`
  };
}

/**
 * 4. TẠO SƠ ĐỒ VỊ TRÍ CHỖ NGỒI (XE 2 TẦNG, LIMOUSINE):
 */
export interface SeatInfo {
  code: string;
  label: string;
  floor?: 1 | 2;
  isBooked: boolean;
  isVip?: boolean;
}

export interface VehicleSeatLayout {
  busType: BusType;
  totalSeats: number;
  bookedSeatsCount: number;
  availableSeatsCount: number;
  isTwoFloors: boolean;
  floor1: SeatInfo[];
  floor2: SeatInfo[];
}

export function generateVehicleSeatLayout(
  busType: BusType = 'sleeper_double_deck',
  totalSeats: number = 34,
  bookedSeatCodes: string[] = []
): VehicleSeatLayout {
  const bookedSet = new Set(bookedSeatCodes.map((s) => s.trim().toUpperCase()));
  const isTwoFloors = busType === 'sleeper_double_deck' || busType === 'cabin_double_deck';

  const floor1: SeatInfo[] = [];
  const floor2: SeatInfo[] = [];

  if (isTwoFloors) {
    const halfSeats = Math.ceil(totalSeats / 2);

    // Tầng 1: Ký hiệu A01, A02... hoặc C1-01 cho cabin
    const prefix1 = busType === 'cabin_double_deck' ? 'C1-' : 'A';
    for (let i = 1; i <= halfSeats; i++) {
      const code = `${prefix1}${String(i).padStart(2, '0')}`;
      floor1.push({
        code,
        label: `${code}`,
        floor: 1,
        isBooked: bookedSet.has(code.toUpperCase()),
        isVip: i <= 4
      });
    }

    // Tầng 2: Ký hiệu B01, B02... hoặc C2-01
    const prefix2 = busType === 'cabin_double_deck' ? 'C2-' : 'B';
    const remainingSeats = totalSeats - halfSeats;
    for (let i = 1; i <= remainingSeats; i++) {
      const code = `${prefix2}${String(i).padStart(2, '0')}`;
      floor2.push({
        code,
        label: `${code}`,
        floor: 2,
        isBooked: bookedSet.has(code.toUpperCase()),
        isVip: false
      });
    }
  } else {
    // Limousine hoặc ghế ngồi 1 tầng
    const isVipLimo = busType === 'limousine_9' || busType === 'limousine_11';
    for (let i = 1; i <= totalSeats; i++) {
      const code = isVipLimo ? `VIP-${String(i).padStart(2, '0')}` : `G-${String(i).padStart(2, '0')}`;
      floor1.push({
        code,
        label: code,
        floor: 1,
        isBooked: bookedSet.has(code.toUpperCase()),
        isVip: isVipLimo && (i >= 3 && i <= 8)
      });
    }
  }

  const allSeats = [...floor1, ...floor2];
  const bookedSeatsCount = allSeats.filter((s) => s.isBooked).length;
  const availableSeatsCount = Math.max(0, allSeats.length - bookedSeatsCount);

  return {
    busType,
    totalSeats,
    bookedSeatsCount,
    availableSeatsCount,
    isTwoFloors,
    floor1,
    floor2
  };
}

/**
 * 5. TRÍCH XUẤT TRANG BỊ & TIỆN NGHI HOMESTAY
 */
export function getHomestayRoomSummary(room: Partial<RoomType>): {
  features: string[];
  viewText: string;
  capacityText: string;
} {
  const features: string[] = [];
  if (room.hasWaterHeater) features.push('Bình nóng lạnh 24/7');
  if (room.hasAirConditioner) features.push('Điều hòa hai chiều');
  if (room.hasHeaterMattress) features.push('Đệm điện sưởi ấm');
  if (room.hasPrivateBathroom) features.push('Vệ sinh khép kín');
  if (room.amenities && Array.isArray(room.amenities)) {
    room.amenities.forEach((a) => {
      if (!features.includes(a)) features.push(a);
    });
  }

  const viewText = room.viewDescription || 'View nhìn ra thung lũng mây Tà Xùa';
  const capacityText = `Tối đa ${room.capacity || 2} khách`;

  return {
    features,
    viewText,
    capacityText
  };
}

/**
 * 6. TÍNH CHI PHÍ HOMESTAY THEO NGÀY - ĐÊM
 */
export function calculateHomestayStayCost(
  checkInDate: string,
  checkOutDate: string,
  pricePerNight: number,
  roomCount: number = 1
): {
  nights: number;
  pricePerNight: number;
  roomCount: number;
  totalCost: number;
  breakdown: string;
} {
  const d1 = new Date(checkInDate);
  const d2 = new Date(checkOutDate);
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  const nights = Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  const totalCost = nights * Math.max(0, pricePerNight) * Math.max(1, roomCount);

  return {
    nights,
    pricePerNight,
    roomCount,
    totalCost,
    breakdown: `${roomCount} phòng x ${nights} đêm x ${pricePerNight.toLocaleString('vi-VN')}đ`
  };
}

/**
 * 7. KIỂM TRA TRẠNG THÁI BẰNG CHỨNG THANH TOÁN (PAYMENT PROOF)
 */
export function verifyPaymentProofStatus(booking: Partial<Booking>): {
  hasProof: boolean;
  proofImageUrl?: string;
  status: 'no_proof' | 'proof_uploaded' | 'partner_confirmed' | 'admin_resolved' | 'disputed';
  statusLabel: string;
  statusBadgeColor: string;
  canDispute: boolean;
} {
  const proof = booking.paymentProof;
  const status = booking.paymentStatus || (proof?.imageUrl ? 'proof_uploaded' : 'no_proof');

  switch (status) {
    case 'partner_confirmed':
      return {
        hasProof: true,
        proofImageUrl: proof?.imageUrl,
        status: 'partner_confirmed',
        statusLabel: 'Đối tác đã xác nhận nhận tiền cọc',
        statusBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        canDispute: false
      };
    case 'proof_uploaded':
      return {
        hasProof: true,
        proofImageUrl: proof?.imageUrl,
        status: 'proof_uploaded',
        statusLabel: 'Khách đã gửi ảnh chuyển khoản - Chờ đối tác xác nhận',
        statusBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        canDispute: true
      };
    case 'admin_resolved':
      return {
        hasProof: true,
        proofImageUrl: proof?.imageUrl,
        status: 'admin_resolved',
        statusLabel: 'Admin đã can thiệp xử lý khiếu nại',
        statusBadgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        canDispute: false
      };
    case 'disputed':
      return {
        hasProof: !!proof?.imageUrl,
        proofImageUrl: proof?.imageUrl,
        status: 'disputed',
        statusLabel: 'Đang khiếu nại bằng chứng thanh toán',
        statusBadgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        canDispute: true
      };
    case 'no_proof':
    default:
      return {
        hasProof: false,
        proofImageUrl: undefined,
        status: 'no_proof',
        statusLabel: 'Chưa tải ảnh biên lai chuyển khoản',
        statusBadgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        canDispute: false
      };
  }
}

