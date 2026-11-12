export type UserRole = 'traveler' | 'partner' | 'admin';

export type ServiceCategory = 
  | 'homestay'
  | 'coffee'
  | 'restaurant'
  | 'bus'
  | 'taxi'
  | 'motorbike'
  | 'tour'
  | 'photo'
  | 'costume'
  | 'camera'
  | 'rescue';

export type LocationArea = 
  | 'Đỉnh Gió'
  | 'Sống Lưng Khủng Long'
  | 'Khe Cải'
  | 'Trung Tâm Tà Xùa'
  | 'Mống Vàng'
  | 'Thảo Nguyên'
  | 'Háng Đồng'
  | 'Bắc Yên';

export type VerificationTier = 1 | 2 | 3; // 1: Cơ bản, 2: Xác thực giấy phép, 3: Đối tác sáng lập/Thẩm định thực tế

export interface RoomType {
  id: string;
  name: string;
  capacity: number; // số người
  priceWeekend: number;
  priceWeekday: number;
  price?: number; // fallback alias
  totalRooms: number;
  availableRooms: number;
  viewType: 'Biển mây tràn' | 'Thung lũng' | 'Đỉnh núi' | 'Sân vườn' | 'cloud_view' | 'valley_view';
  amenities: string[];
  imageUrl?: string;
  // Trang bị tường minh do chủ homestay khai báo; nếu thiếu sẽ suy ra từ amenities (getRoomFeatures)
  hasWaterHeater?: boolean;
  hasAirConditioner?: boolean;
  hasHeaterMattress?: boolean;
  hasPrivateBathroom?: boolean;
  viewDescription?: string;
  bookedDateRanges?: Array<{
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
  }>;
}

export interface DirectChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'traveler' | 'partner' | 'admin';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface PartnerClaimRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  ownerName: string;
  ownerPhone: string;
  zalo: string;
  cccdOrTax: string;
  proofDocumentNote: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface BookingDispute {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestPhone: string;
  issueType: 'false_photo' | 'pricing_scam' | 'room_mismatch' | 'service_attitude' | 'cancellation_refund';
  description: string;
  status: 'opening' | 'investigating' | 'resolved' | 'refunded';
  resolutionNote?: string;
  adminAssigned?: string;
  createdAt: string;
}

export interface ServiceRewardSetting {
  listingId: string;
  pointEarnRatePercent: number; // e.g., 5% or 10%
  pointRedemptionAllowed: boolean;
}

export interface PromoVoucher {
  id: string;
  code: string;
  title: string;
  discountType: 'percent' | 'fixed';
  discountValue: number; // e.g. 10% or 100,000 VND
  minBookingAmount: number;
  applicableCategory: ServiceCategory | 'all';
  applicableListingId?: string; // Optional specific listing
  isActive: boolean;
  validUntil: string;
  description: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string; // "Đồ uống", "Món chính"...
  price: number;
  unit: string; // "ly", "nồi", "suất"
  isBestSeller?: boolean;
  isAvailable: boolean;
  description?: string;
}

export interface OpeningHours {
  openTime: string; // "06:00"
  closeTime: string; // "21:00"
  is24Hours?: boolean;
  note?: string;
  temporarilyClosed?: boolean;
  closedDaysNote?: string;
  serviceNote?: string;
}

export interface PartnerBankAccount {
  bankCode: string; // "MB", "VCB"...
  accountNumber: string;
  accountName: string;
  bankName?: string;
  accountHolder?: string;
  qrPromptMessage?: string;
}

export interface ServicePackageItem {
  id: string;
  name: string;
  price: number;
  unit: string; // "ngày", "chuyến", "người", "gói", "bộ/ngày"
  halfDayPrice?: number; // áp dụng cho xe máy trả trước 12h trưa hôm sau
  totalQuantity?: number;
  availableQuantity?: number;
  availableCount?: number; // alias
  durationNote?: string;
  includedFeatures?: string[];
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  category: ServiceCategory;
  area: LocationArea;
  address: string;
  phone: string;
  zalo: string;
  facebook?: string;
  rating: number;
  reviewCount: number;
  hasCloudView: boolean;
  minPrice: number;
  priceNote?: string;
  description: string;
  coverImage: string;
  images: string[];
  verificationTier: VerificationTier;
  updatedCalendarDate: string; // YYYY-MM-DD
  isInstantBooking: boolean;
  roomTypes?: RoomType[];
  tags: string[];
  status: 'approved' | 'pending' | 'draft' | 'rejected';
  partnerId: string;
  claimedByOwner?: boolean;
  ownerVerificationStatus?: 'unclaimed' | 'pending_verification' | 'verified_owner';
  menuItems?: MenuItem[];
  openingHours?: OpeningHours;
  servicePackages?: ServicePackageItem[];
  motorbikeFleet?: MotorbikeFleet;
  bankAccount?: PartnerBankAccount; // VietQR nhận tiền trực tiếp của cơ sở
  certifications?: string[]; // nhãn chứng nhận chuyên ngành do Admin cấp
  // Cơ chế Admin Ghim Ưu Tiên (Admin Featured & Priority Ranking)
  isAdminFeatured?: boolean;
  adminPriorityRank?: number; // Số càng lớn càng được ưu tiên lên đầu (VD: 100, 95, 90...)
  adminFeaturedLabel?: string; // VD: "👑 Admin Đề Xuất", "🔥 Top 1 Săn Mây", "💎 Đối Tác Chiến Lược"
  /** null = chưa có tọa độ thật (N03: không suy tọa độ từ khu vực). */
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  stats: {
    views: number;
    callClicks: number;
    bookingsCount: number;
  };
  // N03: nguồn gốc và xác minh do server trả về
  dataOrigin?: 'scraped' | 'partner' | 'admin' | 'demo';
  sourceName?: string | null;
  collectedAt?: string | null;
  verification?: {
    tier: VerificationTier;
    recordedTier: VerificationTier;
    source: string | null;
    verifiedAt: string | null;
    expiresAt: string | null;
    expired: boolean;
  };
}

/** Cơ sở có tọa độ thật, dùng cho bản đồ. */
export type MappableListing = Listing & { coordinates: { lat: number; lng: number } };

export interface CloudLandmark {
  id: string;
  name: string;
  area: LocationArea;
  altitude: string; // e.g., "1.650m"
  cloudProbability: number; // %
  bestTime: string;
  description: string;
  roadCondition: string;
  distanceFromCenter: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
}

export interface RouteStop {
  id: string;
  name: string;
  type: 'pickup' | 'dropoff' | 'both';
  minuteOffset: number; // minutes from departure
  fareModifier: number; // VND difference from base
  pickupNote?: string;
}

export type BusType =
  | 'Limousine 9 chỗ VIP'
  | 'Limousine 11 chỗ'
  | 'Giường nằm Cabin Đôi'
  | 'Giường nằm Cabin Đơn'
  | 'Giường nằm 2 tầng'
  | 'sleeper_double_deck'
  | 'cabin_double_deck'
  | 'limousine_9'
  | 'limousine_11'
  | 'standard_seater';

export interface MotorbikeFleet {
  totalBikes: number; // số xe máy ban đầu nhà xe khai báo
  rentedOfflineCount: number; // xe nhà xe xác nhận đã cho thuê ngoài website
  rentedOffline?: number; // alias
  bookedOnWeb?: number; // số xe đã đặt trên web
  pricePerDay?: number;
  dailyPrice?: number; // alias
  dailyRate?: number; // alias
  halfDayRate?: number;
  halfDayRateBeforeNoon?: number;
  comboDiscountPerBike?: number; // giảm/xe khi khách đặt combo xe khách + xe máy
  comboDiscountAmount?: number; // alias
  models?: string[];
  enabled?: boolean;
  notes?: string;
}

export interface BusOperator {
  id: string;
  name: string;
  phone: string;
  zalo: string;
  motorbikeFleet?: MotorbikeFleet;
}

export interface BusTrip {
  id: string;
  operatorId?: string;
  operatorName: string;
  busType: BusType;
  departureTime: string; // e.g., "06:30" or "22:00"
  route: string; // "Hà Nội - Tà Xùa"
  originCity: string;
  destinationCity: string;
  baseFare: number;
  totalSeats: number;
  bookedSeats: number[];
  stops: RouteStop[];
  phone: string;
  zalo: string;
  rating: number;
  amenities: string[];
  motorbikeFleet?: MotorbikeFleet;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  category: ServiceCategory;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  roomName?: string;
  totalAmount: number;
  discountApplied?: number;
  voucherCodeApplied?: string;
  pointsEarned?: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  qrCodeUrl: string;
  platformFee: number; // 50,000 VND when completed
  feeCharged: boolean;
  notes?: string;
  createdAt: string;
  seatNumbers?: number[];
  pickupStop?: string;
  dropoffStop?: string;
  reviewed?: boolean;
  hasDispute?: boolean;
  disputeId?: string;
  paymentStatus?: PaymentStatus; // thiếu = 'unpaid'
  paymentProof?: PaymentProof;
  partnerConfirmedPaymentAt?: string;
  paymentConfirmedBy?: 'partner' | 'admin';
  pricingMode?: PricingMode | string;
  pricingDetails?: PricingDetails;
  motorbikeRentalDetails?: {
    pickupDate: string;
    pickupHour?: string;
    returnDate: string;
    returnBeforeNoon: boolean;
    calculatedDays: number;
    vehicleModel?: string;
    bikeModel?: string;
    bikeQuantity?: number;
    quantity?: number;
  };
  comboMotorbikeIncluded?: boolean;
  busComboMotorbike?: {
    included: boolean;
    bikeCount: number;
    vehicleModel: string;
    discountApplied: number;
  };
  diningOrderItems?: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export type PaymentStatus = 'unpaid' | 'proof_uploaded' | 'partner_confirmed' | 'disputed' | 'admin_resolved' | 'no_proof';

export interface PaymentProof {
  imageUrl: string; // data URL ảnh biên lai khách tải lên
  amountPaid: number;
  amountTransferred?: number; // alias
  transactionRef?: string;
  uploadedAt: string;
  partnerConfirmedAt?: string;
  note?: string;
}

export type PricingMode =
  | 'per_night'
  | 'motorbike_day'
  | 'per_person'
  | 'per_package'
  | 'dining_preorder'
  | 'bus_seat';

export interface PricingDetails {
  mode: PricingMode;
  unitLabel: string; // "đêm", "ngày", "người", "gói"...
  units: number; // số đêm / số ngày tính tiền (có thể 1.5) / số người...
  quantity: number; // số phòng / số xe / số bộ
  pickupTime?: string;
  returnTime?: string;
  hasHalfDay?: boolean;
  motorbikeCount?: number; // combo xe máy kèm vé xe khách
  motorbikeDays?: number;
  menuSelections?: Array<{ name: string; qty: number; price: number }>;
}

export interface Review {
  id: string;
  listingId: string;
  bookingId?: string;
  reviewerName: string;
  rating: number; // 1 - 5
  comment: string;
  roomName?: string;
  createdAt: string;
  isVerifiedStay: boolean;
}


export interface CloudHuntingForecast {
  location: LocationArea;
  cloudProbability: number; // 0 - 100%
  condition: 'Biển mây dày đặc' | 'Mây luồn bồng bềnh' | 'Mây thưa - Nắng sớm' | 'Sương mù dày' | 'Mưa lạnh';
  humidity: number; // %
  windSpeedKmH: number; // km/h
  tempMin: number;
  tempMax: number;
  goldenHours: string; // "05:30 - 07:30"
  ratingStar: number;
  advice: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  isVerifiedMember: boolean;
  type: 'carpool' | 'share_room' | 'road_alert' | 'review';
  title: string;
  content: string;
  imageUrl?: string;
  departureDate?: string;
  route?: string;
  contactPhone: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  isPinned?: boolean;
}

// ===== Quản trị nội dung & AI Chatbot (Admin) =====

export interface HeroBannerSlide {
  id: string;
  badgeText: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  targetTab: string; // 'weather' | 'map' | 'combo_section' | 'bus_combo_modal' | 'dining' | 'stay' | 'transport' | 'motorbike_section'
  sortOrder?: number;
  isActive: boolean;
}

export type CuratedComboCategory =
  | 'combo_2n1d'
  | 'trekking_tour'
  | 'couple_retreat'
  | 'group_family'
  | 'biker_pack';

export interface CuratedComboPackage {
  id: string;
  title: string;
  badgeText: string; // VD: "👑 Admin Đề Xuất #1", "🔥 Tiết kiệm 280k", "🥾 Trekking Thẩm Định"
  category: CuratedComboCategory;
  duration: string; // VD: "2 Ngày 1 Đêm", "1 Ngày Săn Mây", "3 Ngày 2 Đêm"
  area: LocationArea;
  comboPrice: number; // Giá ưu đãi gói
  originalPrice: number; // Giá gốc khi đặt lẻ
  unit: string; // "người", "cặp đôi (2 khách)", "nhóm 4 khách"
  imageUrl: string;
  summary: string;
  includedItems: string[]; // Danh sách quyền lợi: Xe Cabin Đôi, Phòng Kính Đỉnh Gió, Xe máy Wave/Blade...
  linkedListingId?: string; // ID cơ sở chính liên kết để mở chi tiết
  actionType: 'open_listing' | 'open_bus_combo' | 'open_ai_advisor';
  priorityOrder: number; // 1, 2, 3... (Nhỏ hơn đứng trước hoặc theo thứ tự ưu tiên)
  isPinnedFeatured: boolean;
  isActive: boolean;
}

export interface SectionBannerConfig {
  id: string;
  sectionKey: 'explore' | 'stay' | 'transport' | 'services' | 'dining' | 'verified' | 'map' | 'weather' | 'community';
  sectionName: string;
  badgeText: string;
  title: string;
  subtitle: string;
  bannerImageUrl: string;
  ctaText?: string;
  isActive: boolean;
}

export type SocialChannelPlatform =
  | 'tiktok'
  | 'facebook_page'
  | 'facebook_group'
  | 'zalo_oa'
  | 'zalo_group'
  | 'phone_hotline'
  | 'phone_sos'
  | 'youtube'
  | 'instagram';

export type SocialPlacement =
  | 'header'
  | 'footer'
  | 'community_hub'
  | 'floating_dock'
  | 'sos_modal';

export interface SocialChannelConfig {
  id: string;
  platform: SocialChannelPlatform;
  title: string;
  handleOrNumber: string; // e.g., "@taxuatrip.vn" or "0981 234 567"
  url: string;            // e.g., "https://tiktok.com/@taxuatrip.vn", "https://zalo.me/0981234567", "tel:0981234567"
  description: string;
  memberOrFollowerCount?: string; // e.g., "48.5K Followers", "22.4K Thành viên"
  badgeText?: string;             // e.g., "Chính thức", "Live 05:30", "Trực 24/7"
  placements: SocialPlacement[];
  isVerifiedOfficial: boolean;
  isActive: boolean;
  sortOrder?: number;
}

export interface SiteContentConfig {
  heroBadge?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription?: string;
  heroBackgroundImage?: string;
  heroOverlayOpacity?: number;
  heroBanners?: HeroBannerSlide[];
  curatedCombos?: CuratedComboPackage[];
  sectionBanners?: SectionBannerConfig[];
  socialChannels?: SocialChannelConfig[];
  alertEnabled: boolean;
  alertLevel: 'info' | 'warning' | 'danger';
  alertText: string;
  emergencyBanner: {
    enabled: boolean;
    severity: 'info' | 'warning' | 'danger';
    title: string;
    message: string;
    actionUrl?: string;
  };
  heroHeading?: string;
  heroSubheading?: string;
  featuredCloudSpotsCount?: number;
  communityNotice?: string;
  footerConfig?: {
    brandTagline: string;
    description: string;
    rescueHotline: string;
    supportZalo: string;
    address: string;
    copyrightText: string;
  };
}

export interface KnowledgeFile {
  id: string;
  fileName: string;
  content: string; // nội dung văn bản đưa vào ngữ cảnh chatbot
  isActive: boolean;
  updatedAt: string;
  title?: string;
  summary?: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface AIChatbotConfig {
  id: string;
  name: string;
  roleTitle: string;
  personaTone: string;
  systemPrompt: string;
  welcomeMessage: string;
  temperature: number; // 0 - 1
  enabled: boolean;
  themeColor: string; // hex
  quickPrompts: string[];
  features?: {
    autoQuote: boolean;
    hold30Min: boolean;
    piiMasking: boolean;
    promptGuard: boolean;
    floatingButton: boolean;
  };
  knowledgeFiles?: KnowledgeFile[];
  knowledgeFileIds?: string[];
  maxTokens?: number;
  autoQuoteEnabled?: boolean;
  hold30MinEnabled?: boolean;
  maskPiiEnabled?: boolean;
  blockInjectionEnabled?: boolean;
}

export type InteractionChannel = 'member_ai' | 'member_partner' | 'member_member' | 'direct_chat' | 'community' | 'ai_concierge';

export interface InteractionLog {
  id: string;
  channel: InteractionChannel;
  botId?: string;
  actorName?: string;
  targetName?: string;
  message?: string;
  reply?: string;
  createdAt?: string;
  flagged?: boolean;
  flagLabels?: string[];
  reviewStatus?: 'new' | 'reviewed' | 'warned';
  senderName?: string;
  recipientName?: string;
  messagePreview?: string;
  timestamp?: string;
  isFlaggedScam?: boolean;
  flagReason?: string;
  hashDigest?: string;
  status?: string;
}

export interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  cloudPoints: number; // Điểm "Mây"
  membershipTier: 'Tân Binh Săn Mây' | 'Thợ Săn Mây Bạc' | 'Chuyên Gia Săn Mây Vàng';
  savedListings: string[];
  bookingHistory: Booking[];
}

export interface PartnerWallet {
  partnerId: string;
  partnerName: string;
  balance: number; // Số dư ví trả trước
  pendingFeeTotal: number;
  completedBookingsCount: number;
  billingEnabled: boolean; // cờ tính phí
}

// ===== Quản trị & Điều phối RevidAPI Gateway (https://revidapi.com/dashboard/docs) =====

export type RevidComplexityLevel =
  | 'L1_micro'      // L1: Kiểm duyệt nhanh, che PII, phân loại tag (< 600ms, 0 - 38 cr/1M)
  | 'L2_fast'       // L2: Hỏi đáp thời tiết, giờ xe, FAQ cơ sở (54 - 86 cr/1M)
  | 'L3_reasoning'  // L3: Thiết kế lịch trình Tà Xùa, báo giá combo đa ràng buộc (97 - 258 cr/1M)
  | 'L4_expert'     // L4: Trọng tài phân tích tranh chấp cọc VietQR & chiến lược CMS (215 - 430 cr/1M)
  | 'L5_media';     // L5: Tạo ảnh/video AI (/v1/generate), TTS thuyết minh & TikTok Scraper

export type RevidModelCategory = 'llm' | 'image' | 'video' | 'tts' | 'social_scraper';

export type RevidPresetId =
  | 'ultra_saver'       // Tiết kiệm tối đa (0 - 38 cr)
  | 'balanced_ota'      // Cân bằng tối ưu cho OTA (Khuyên dùng)
  | 'premium_concierge' // Trải nghiệm AI cao cấp nhất
  | 'high_availability';// Tốc độ cao & Cache mùa cao điểm săn mây

export interface RevidModelSpec {
  id: string; // e.g., "claude-sonnet-5", "gpt-5.6-sol", "google/gemini-flash-lite", "nano-banana-pro"
  name: string;
  provider: string; // "Anthropic", "OpenAI", "Google", "DeepSeek", "xAI", "Moonshot", "Revid Studio"
  category: RevidModelCategory;
  recommendedLevel: RevidComplexityLevel;
  inputCreditsPer1M?: number;
  outputCreditsPer1M?: number;
  cacheReadCreditsPer1M?: number;
  creditsPerJobRange?: string; // e.g., "25 - 125 credits / job"
  avgLatencyMs: number;
  supportsStreaming: boolean;
  supportsJson: boolean;
  isFree?: boolean;
  isEnabled: boolean;
  description: string;
}

export interface RevidApiKeyEntry {
  id: string;
  label: string; // "Primary Production Key", "Backup Failover Key", "Media Studio Key"
  maskedKey: string; // "sk_live_98a7...4f21"
  rawKey: string;
  role: 'primary' | 'backup' | 'media_studio';
  status: 'active' | 'rate_limited' | 'disabled';
  requestsToday: number;
  creditsUsedToday: number;
  lastUsedAt: string;
}

export interface RevidFeatureRoutingRule {
  featureId: string;
  featureName: string;
  featureDescription: string;
  complexityLevel: RevidComplexityLevel;
  endpointPath: string; // "/v1/chat/completions" | "/v1/generate" | "/v1/text-to-speech" | "/v1/tiktok/download"
  primaryModelId: string;
  fallbackModelId: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
  cacheReadEnabled: boolean;
  mediaAspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  mediaResolution?: '720p' | '1080p' | '2k';
  isEnabled: boolean;
  avgCreditsPerCall: number;
}

export interface RevidPresetProfile {
  id: RevidPresetId;
  name: string;
  badge: string;
  description: string;
  estimatedCreditSavingPercent: number;
  levelMapping: Record<
    RevidComplexityLevel,
    {
      primaryModelId: string;
      fallbackModelId: string;
      temperature: number;
      maxTokens: number;
      cacheReadEnabled: boolean;
    }
  >;
}

export interface RevidAsyncJobRecord {
  jobId: string;
  modelId: string;
  category: 'image' | 'video' | 'tts' | 'social_scraper';
  promptOrInput: string;
  params: {
    aspect_ratio?: string;
    resolution?: string;
    duration?: string;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  creditsCost: number;
  refunded?: boolean;
  resultUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RevidApiCallLog {
  id: string;
  timestamp: string;
  featureName: string;
  endpoint: string;
  complexityLevel: RevidComplexityLevel;
  modelUsed: string;
  status: '200_ok' | '429_rate_limit' | 'fallback_used' | 'job_refunded';
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  creditsCharged: number;
  keyLabel: string;
}

export interface RevidApiGatewayConfig {
  enabled: boolean;
  baseUrl: string; // "https://ai.revidapi.com/v1" | "https://revidapi.com/v1"
  authHeaderMode: 'bearer' | 'x_api_key';
  setupMode: 'preset' | 'manual';
  activePresetId: RevidPresetId;
  autoComplexityRouting: boolean; // Tự động chấm điểm câu hỏi để nâng/hạ model L1-L4
  autoKeyRotation: boolean;       // Tự động đổi sang Backup Key khi gặp HTTP 429
  promptCachingEnabled: boolean;  // Tận dụng Cache Read giảm 50-90% credit
  semanticCacheMinutes: number;   // Lưu cache câu hỏi trùng lặp (phút)
  timeoutMs: number;
  maxRetries: number;
  creditWallet: {
    balanceCredits: number;
    vndPer1500Credits: number; // 99.000 VNĐ = 1.500 Credits
    dailyCreditLimit: number;
    usedCreditsToday: number;
    lowBalanceAlertThreshold: number;
    autoFallbackOnBudgetPercent: number; // e.g., 85%
    rateLimitPerMinutePerUser: number;
  };
  apiKeys: RevidApiKeyEntry[];
  modelsCatalog: RevidModelSpec[];
  featureRoutes: RevidFeatureRoutingRule[];
  asyncJobs: RevidAsyncJobRecord[];
  callLogs: RevidApiCallLog[];
}

// ===== Siêu Trợ Lý Điều Hành J.A.R.V.I.S. Độc Quyền Cho Admin =====

export type JarvisActionType =
  | 'FULL_DIAGNOSTIC_SCAN'
  | 'APPROVE_ALL_PENDING_CLAIMS'
  | 'RESOLVE_PENDING_DISPUTES'
  | 'UPGRADE_LISTING_TIER'
  | 'TRIGGER_EMERGENCY_ALERT'
  | 'CLEAR_EMERGENCY_ALERT'
  | 'UPDATE_CLOUD_FORECAST'
  | 'CREATE_PROMO_VOUCHER'
  | 'SWITCH_REVID_PRESET'
  | 'GENERATE_AND_APPLY_HERO_BANNER'
  | 'TOGGLE_PLATFORM_BILLING'
  | 'EXECUTE_CUSTOM_SKILL';

export interface JarvisProposedAction {
  id: string;
  actionType: JarvisActionType;
  title: string;
  description: string;
  impactScope: string; // e.g., "CMS Toàn Trang", "3 Hồ sơ Chính chủ", "RevidAPI Gateway"
  riskLevel: 'safe' | 'moderate' | 'critical';
  payload?: Record<string, any>;
  executed?: boolean;
  executedAt?: string;
}

export interface JarvisMessage {
  id: string;
  sender: 'admin' | 'jarvis';
  text: string;
  timestamp: string;
  modelUsed?: string;
  complexityLevel?: RevidComplexityLevel;
  telemetryHighlights?: string[];
  proposedActions?: JarvisProposedAction[];
}

export interface JarvisPlaybookRule {
  id: string;
  name: string;
  triggerCondition: string; // IF ...
  automatedAction: string;  // THEN ...
  category: 'api_cost' | 'anti_scam' | 'weather_growth' | 'inventory';
  isActive: boolean;
  triggeredCountToday: number;
  lastTriggeredAt: string;
}

export interface JarvisCustomSkill {
  id: string;
  name: string;
  category: 'operations' | 'cms_media' | 'security' | 'external_webhook';
  triggerKeywords: string[];
  description: string;
  endpointOrHandler: string;
  isEnabled: boolean;
  createdAt: string;
}
