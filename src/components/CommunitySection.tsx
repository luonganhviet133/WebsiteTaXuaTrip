import React, { useState } from 'react';
import {
  Users,
  Car,
  Bed,
  AlertTriangle,
  MessageCircle,
  ThumbsUp,
  Phone,
  Plus,
  CheckCircle2,
  Send,
  Calendar,
  MapPin,
  ShieldCheck,
  Lock,
  FileText,
  Hash,
  Sparkles,
  QrCode,
  Copy,
  Check,
  Eye,
  Flag,
  Camera,
  Compass,
  Share2,
  Award,
  ExternalLink,
  Search,
  Video
} from 'lucide-react';
import { CommunityPost, SiteContentConfig, Listing, SocialChannelConfig } from '../types/index.ts';
import { INITIAL_SITE_CONTENT, INITIAL_LISTINGS } from '../data/mockData.ts';
import {
  computeMessageHash,
  verifyEvidenceHashChain,
  classifyChatMessageAI,
  checkChatPermission,
  maskSensitivePII,
  buildCommunityUtmUrl,
  ChatActorRole,
  formatVND
} from '../utils/rules.ts';

interface CommunitySectionProps {
  posts: CommunityPost[];
  onAddPost: (post: CommunityPost) => void;
  isPopupModal?: boolean;
  onClosePopup?: () => void;
  initialSpaceId?: string;
  siteContent?: SiteContentConfig;
  listings?: Listing[];
  onEarnCloudPoints?: (points: number, reason: string) => void;
}

interface ChatMessageItem {
  id: string;
  seq: number;
  senderId: string;
  senderName: string;
  senderRole: 'member' | 'moderator' | 'partner' | 'admin' | 'ai';
  senderBadge: string;
  body: string;
  createdAt: string;
  minutesAgo: number;
  prevHash: string;
  hash: string;
  pinned?: boolean;
  quoteCard?: {
    roomName: string;
    dates: string;
    price: string;
    holdMinutes: number;
    bookingRef: string;
  };
  versions?: Array<{ version: number; oldBody: string; editedAt: string }>;
  aiModeration?: {
    flagged: boolean;
    labels: string[];
    reason: string;
  };
}

interface ChatRoomSpace {
  id: string;
  name: string;
  typeLabel: string;
  spaceType:
    | 'announcement'
    | 'topic'
    | 'partner_group'
    | 'trip_room'
    | 'share_room'
    | 'listing_dm'
    | 'multi_party_booking'
    | 'support_ticket'
    | 'dispute_room';
  tier: 'social' | 'evidence';
  retentionLabel: string;
  lifecycleLabel: string;
  participantsLabel: string;
  onlineCount: number;
  unreadCount: number;
  quickPrompts: string[];
  isReadOnlyForMember?: boolean;
  legalHoldActive?: boolean;
}

interface OnlineMemberPresence {
  id: string;
  name: string;
  roleLabel: string;
  area: string;
  avatar: string;
  statusText: string;
}

export const ONLINE_MEMBERS_LIVE: OnlineMemberPresence[] = [
  {
    id: 'onl-1',
    name: 'Giàng A Páo',
    roleLabel: 'Moderator Thổ Địa',
    area: 'Đỉnh Gió',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    statusText: 'Đang trực săn mây Đỉnh Gió'
  },
  {
    id: 'onl-2',
    name: 'Mẩy Homestay',
    roleLabel: 'Chủ Homestay Cấp 3',
    area: 'Đỉnh Gió',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    statusText: 'Còn 3 phòng trống tối nay'
  },
  {
    id: 'onl-3',
    name: 'A Lư Porter',
    roleLabel: 'Porter & Photographer',
    area: 'Sống Lưng',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    statusText: 'Đang dẫn đoàn Sống Lưng'
  },
  {
    id: 'onl-4',
    name: 'Khánh Thịnh Limo',
    roleLabel: 'Nhà Xe Chuyên Tuyến',
    area: 'Hà Nội - Tà Xùa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    statusText: 'Chuyến 22h tối nay còn 4 ghế'
  },
  {
    id: 'onl-5',
    name: 'Lê Thu Trang',
    roleLabel: 'Member Đã Xác Minh',
    area: 'Đỉnh Gió',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    statusText: 'Tìm 2 bạn nữ ghép Villa'
  },
  {
    id: 'onl-6',
    name: 'Cứu Hộ Đèo Chẹn',
    roleLabel: 'Đội Cứu Hộ 24/7',
    area: 'Ngã 3 Tà Xùa',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    statusText: 'Đường đèo thông thoáng'
  }
];

interface ShareTripDeal {
  id: string;
  category: 'transport' | 'room' | 'tour' | 'photo';
  categoryLabel: string;
  title: string;
  dateRange: string;
  routeOrArea: string;
  targetListingTitle?: string;
  slotsLeft: number;
  totalSlots: number;
  totalEstimatedVnd?: number;
  costPerPersonVnd?: number;
  costSplitRule: string;
  ownerName: string;
  ownerTrustScore: number;
  ownerVerifiedTrips: number;
  ownerPhone: string;
  description: string;
  applicants: Array<{
    id: string;
    name: string;
    phoneVerified: boolean;
    completedTrips: number;
    verifiedReviews: number;
    trustScore: number;
    badge: string;
    status: 'pending' | 'approved';
    privatePhone: string;
  }>;
}

interface LiveCloudReport {
  id: string;
  spotName: string;
  areaKey: 'Đỉnh Gió' | 'Sống Lưng Khủng Long' | 'Thảo Nguyên' | 'Cây Cô Đơn' | 'Mỏm Cá Heo';
  reporterName: string;
  reporterRole: 'Moderator địa phương' | 'Khách tại chỗ (GPS xác thực)';
  reportedAt: string;
  expiresIn: string;
  cloudDensity: string;
  tempCelsius?: number;
  visibilityNote: string;
  imageUrl: string;
  videoUrl?: string;
  helpfulCount: number;
  gpsVerified: boolean;
}

interface ForumReplyItem {
  id: string;
  postId: string;
  authorName: string;
  authorRole: 'Thổ Địa / Porter' | 'Chủ Cơ Sở Cấp 3' | 'Admin Tà Xùa Trip' | 'Thành Viên Đã Đi';
  isOfficialVerified: boolean;
  body: string;
  createdAt: string;
}

export const CHAT_SPACES: ChatRoomSpace[] = [
  {
    id: 'space-san-may-24h',
    name: '☁️ 1. #san-may-24h',
    typeLabel: 'Báo mây trực tiếp 24/7 tại Đỉnh Gió, Sống Lưng, Thảo Nguyên',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Cập nhật ảnh thực địa · Moderator trực 24/7',
    participantsLabel: 'Du khách & Thổ địa săn mây tại chỗ',
    onlineCount: 46,
    unreadCount: 5,
    quickPrompts: [
      'Sáng mai 5h30 tại Đỉnh Gió và Sống Lưng xác suất biển mây cao không anh em?',
      'Hiện tại ở Tiệm Cà Phê Mị Ơi mây đang dày hay tan rồi ạ?',
      'Mình vừa chụp biển mây tại Sống Lưng Khủng Long lúc 6h15 sáng nay!'
    ]
  },
  {
    id: 'space-ghep-xe-di-chung',
    name: '🚐 2. #ghep-xe-di-chung',
    typeLabel: 'Ghép xe Limousine, share Taxi Bắc Yên ↔ Tà Xùa & tìm Xế-Ôm',
    spaceType: 'trip_room',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Chia sẻ ghế trống · Tiết kiệm chi phí di chuyển',
    participantsLabel: 'Du khách, Nhà xe & Đội Taxi bản địa',
    onlineCount: 31,
    unreadCount: 3,
    quickPrompts: [
      'Mình có 2 người ở Bắc Yên lúc 10h00 sáng nay, tìm thêm 2 bạn share Taxi lên Đỉnh Gió!',
      'Tối thứ 6 tuần này có nhà xe Cabin đôi nào còn 2 giường tầng 1 từ Mỹ Đình không ạ?',
      'Nhóm mình cần thuê 3 xe số Wave/Blade giao tận Mẩy Homestay sáng mai!'
    ]
  },
  {
    id: 'space-ghep-phong-homestay',
    name: '🏡 3. #ghep-phong-homestay',
    typeLabel: 'Tìm bạn ghép phòng Bungalow & Nhượng phòng có bảo lãnh',
    spaceType: 'share_room',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Pass phòng xác thực · Chống lừa đảo cọc ảo',
    participantsLabel: 'Du khách & Chủ Homestay Cấp 3',
    onlineCount: 24,
    unreadCount: 2,
    quickPrompts: [
      'Tìm 2 bạn nữ ghép căn Bungalow Kính view mây tại Đỉnh Gió đêm 14/11 - 16/11!',
      'Đoàn mình 6 người cần tìm nguyên căn gỗ có sân nướng BBQ tối thứ 7 này ạ!',
      'Mình bận đột xuất cần nhượng lại phòng Pơ Mu Cloud Villa đã cọc trên web (#TX-8891).'
    ]
  },
  {
    id: 'space-am-thuc-cafe',
    name: '🍲 4. #am-thuc-cafe-hunting',
    typeLabel: 'Hỏi quán ăn ngon, đặt lẩu gà đen & góc Cafe ngắm hoàng hôn',
    spaceType: 'partner_group',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Niêm yết thực đơn · Đặt bàn trước không lo hết chỗ',
    participantsLabel: 'Du khách & Chủ Quán Ăn / Tiệm Cafe',
    onlineCount: 19,
    unreadCount: 4,
    quickPrompts: [
      'Tối nay ở khu Đỉnh Gió quán nào còn bàn Lẩu gà đen H’Mông cho 4 người không ạ?',
      'Ngắm hoàng hôn lúc 17h chiều nay thì ngồi Mị Ơi hay Hiên Coffee đẹp hơn mọi người?',
      'Mình đi 2 người muốn tìm thêm 2 bạn ghép mâm lẩu cá tầm Suối Sập tối nay!'
    ]
  },
  {
    id: 'space-tho-anh-tour-thue-do',
    name: '📸 5. #tho-anh-tour-thue-do',
    typeLabel: 'Tìm Photographer săn mây, Porter dẫn trekking & Thuê váy Mông',
    spaceType: 'partner_group',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Đặt lịch thợ ảnh, Porter & giữ mẫu trang phục/máy ảnh',
    participantsLabel: 'Du khách, Photographer, Porter & Tiệm thuê đồ',
    onlineCount: 15,
    unreadCount: 1,
    quickPrompts: [
      'Sáng mai 5h30 có bạn Photographer nào còn trống lịch chụp cặp đôi ở Sống Lưng không ạ?',
      'Mình muốn thuê 1 bộ Fujifilm X-T30 II kèm lens chân dung từ tối nay tại trung tâm xã!',
      'Nhóm 4 người cần tìm 1 Porter người Mông dẫn leo đỉnh Sa Mu - U Bò cuối tuần này.'
    ]
  },
  {
    id: 'space-canh-bao-duong-deo',
    name: '⚠️ 6. #canh-bao-deo-cuu-ho',
    typeLabel: 'Cảnh báo Đèo Chẹn, sương mù, đường trơn & Cứu hộ 24/7',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Cập nhật an toàn giao thông đèo núi tức thì',
    participantsLabel: 'Đội cứu hộ 24/7, Bác tài bản địa & Phượt thủ',
    onlineCount: 18,
    unreadCount: 2,
    quickPrompts: [
      'Đường từ Bắc Yên lên Tà Xùa hiện tại có sương mù dày hay sạt lở đoạn nào không các bác tài?',
      'Đoạn dốc xuống Sống Lưng Khủng Long sáng nay khô ráo không hay nên đi xe ôm bản địa ạ?',
      'Xe mình bị thủng săm gần ngã 3 đi Thảo Nguyên, đội cứu hộ hỗ trợ giúp mình với!'
    ]
  },
  {
    id: 'space-review-thuc-te',
    name: '⭐ 7. #review-anh-goc',
    typeLabel: 'Đánh giá khách quan, ảnh gốc không filter & kinh nghiệm đi thật',
    spaceType: 'topic',
    tier: 'social',
    retentionLabel: 'Xã hội · Lưu 12 tháng',
    lifecycleLabel: 'Chia sẻ trải nghiệm thực tế sau chuyến đi',
    participantsLabel: 'Tất cả thành viên đã hoàn tất chuyến đi Tà Xùa',
    onlineCount: 22,
    unreadCount: 0,
    quickPrompts: [
      'Review chân thực chuyến đi Tà Xùa 2N1Đ tự túc chỉ hết 1.450k/người vừa về chiều qua!',
      'Chia sẻ ảnh cam thường không chỉnh màu tại Đỉnh Gió và Thảo Nguyên lúc 6h sáng.',
      'Kinh nghiệm chọn phòng có đệm sưởi và bình nóng lạnh khỏe khi đi Tà Xùa tháng 11.'
    ]
  },
  {
    id: 'space-evidence-dm',
    name: '🔒 8. Chat 1-1 Bảo Chứng: Chủ Cơ Sở (#TX-8891)',
    typeLabel: 'Kênh chat 1-1 gắn mã Booking & Thẻ báo giá giữ chỗ 30 phút',
    spaceType: 'listing_dm',
    tier: 'evidence',
    retentionLabel: 'Bằng chứng · Lưu 3 năm (INSERT-ONLY)',
    lifecycleLabel: 'Chuỗi Hash SHA-256 · Không thể sửa/xóa',
    participantsLabel: 'Khách hàng & Chủ cơ sở dịch vụ',
    onlineCount: 4,
    unreadCount: 1,
    quickPrompts: [
      'Mình đã chuyển khoản cọc 30% và đính kèm ảnh UNC trên đơn #TX-2026-8891, shop xác nhận giúp nhé!',
      'Cho mình xin vị trí định vị chính xác đường rẽ vào cơ sở để gửi bác tài Limousine ạ.',
      'Mình xác nhận chốt hạng phòng và mức giá trong Thẻ Báo Giá trên hệ thống.'
    ]
  },
  {
    id: 'space-dispute',
    name: '⚖️ 9. Phòng Hỗ Trợ & Bảo Vệ Du Khách 3 Bên',
    typeLabel: 'Đối soát biên lai UNC, điều phối đổi phòng & giải quyết khiếu nại',
    spaceType: 'dispute_room',
    tier: 'evidence',
    retentionLabel: 'Bằng chứng · Khóa pháp lý (Legal Hold)',
    lifecycleLabel: 'Admin trung gian · Bảo vệ quyền lợi khách hàng 24/7',
    participantsLabel: 'Khách hàng + Chủ cơ sở + Admin Thẩm Định',
    onlineCount: 6,
    unreadCount: 0,
    quickPrompts: [
      'Nhờ Admin đối chiếu biên lai chuyển khoản cọc đơn #TX-2026-8891 giúp mình ạ.',
      'Đoàn mình muốn nhờ Admin hỗ trợ đổi giờ xe Limousine kết hợp nhận xe máy sớm hơn 2 tiếng.',
      'Cảm ơn Admin và chủ cơ sở đã hỗ trợ xử lý rất nhanh và minh bạch!'
    ],
    legalHoldActive: true
  }
];

function buildInitialEvidenceMessages(): ChatMessageItem[] {
  const m1Time = '2026-11-05 08:15:00';
  const m1Body =
    'Chào Mẩy Homestay, mình muốn đặt 1 căn Bungalow Kính Mặt Trời đêm 06/11 - 08/11 cho 2 người. Phòng có nhìn thẳng ra biển mây từ giường không ạ?';
  const h1 = computeMessageHash('GENESIS_EVIDENCE_00000000', 1, 'guest-minh-anh', m1Body, m1Time);

  const m2Time = '2026-11-05 08:17:20';
  const m2Body =
    'Dạ chào bạn Minh Anh! Căn Bungalow Kính #01 nhìn thẳng 180 độ ra thung lũng mây Đỉnh Gió ngay từ chân giường. Mình gửi Thẻ Báo Giá & Giữ Chỗ 30 phút trên hệ thống nhé:';
  const h2 = computeMessageHash(h1, 2, 'host-may-homestay', m2Body, m2Time);

  const m3Time = '2026-11-05 08:20:05';
  const m3Body =
    'Mình đã bấm xác nhận đặt trên web với mã #TX-2026-8891. Giá chốt 550.000đ/đêm trong thẻ báo giá này được lưu làm bằng chứng bảo vệ hai bên.';
  const h3 = computeMessageHash(h2, 3, 'guest-minh-anh', m3Body, m3Time);

  return [
    {
      id: 'ev-msg-1',
      seq: 1,
      senderId: 'guest-minh-anh',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'member',
      senderBadge: 'Member Đã Xác Minh SĐT',
      body: m1Body,
      createdAt: m1Time,
      minutesAgo: 25,
      prevHash: 'GENESIS_EVIDENCE_00000000',
      hash: h1
    },
    {
      id: 'ev-msg-2',
      seq: 2,
      senderId: 'host-may-homestay',
      senderName: 'Mẩy Homestay (Chủ cơ sở)',
      senderRole: 'partner',
      senderBadge: 'Đối tác sáng lập · Cấp 3',
      body: m2Body,
      createdAt: m2Time,
      minutesAgo: 22,
      prevHash: h1,
      hash: h2,
      quoteCard: {
        roomName: 'Bungalow Kính Mặt Trời #01 (View Biển Mây)',
        dates: '06/11/2026 → 08/11/2026 (2 đêm)',
        price: '1.100.000 ₫ (550.000 ₫/đêm)',
        holdMinutes: 30,
        bookingRef: 'TX-2026-8891'
      }
    },
    {
      id: 'ev-msg-3',
      seq: 3,
      senderId: 'guest-minh-anh',
      senderName: 'Nguyễn Minh Anh',
      senderRole: 'member',
      senderBadge: 'Member Đã Xác Minh SĐT',
      body: m3Body,
      createdAt: m3Time,
      minutesAgo: 18,
      prevHash: h2,
      hash: h3,
      pinned: true
    }
  ];
}

const INITIAL_SOCIAL_MESSAGES: ChatMessageItem[] = [
  {
    id: 'soc-msg-1',
    seq: 1,
    senderId: 'mod-giang-pao',
    senderName: 'Giàng A Páo (Moderator Địa Phương)',
    senderRole: 'moderator',
    senderBadge: 'Moderator Thường Trực Tà Xùa',
    body: '🌤️ Bản tin 06:00 sáng nay tại Đỉnh Gió & Sống Lưng Khủng Long: Độ ẩm 92%, gió nhẹ 7km/h, biển mây đang tràn dày đặc qua thung lũng Mị Ơi! Đường đèo Bắc Yên - Tà Xùa khô ráo, ô tô 16 chỗ và xe máy đi tốt.',
    createdAt: '2026-11-05 06:02:00',
    minutesAgo: 45,
    prevHash: 'SOCIAL_STREAM',
    hash: 'soc_1_a92f',
    pinned: true
  },
  {
    id: 'soc-msg-2',
    seq: 2,
    senderId: 'member-hoang-nam',
    senderName: 'Hoàng Nam',
    senderRole: 'member',
    senderBadge: 'Thợ Săn Mây Cấp 2',
    body: 'Cảm ơn anh Páo! Đoàn mình 4 người đang từ Thanh Sơn lên, khoảng 10h tới Đỉnh Gió. Quán Bếp H\'Mông trưa nay còn nhận đặt lẩu gà đen không ạ?',
    createdAt: '2026-11-05 07:40:00',
    minutesAgo: 8,
    prevHash: 'soc_1_a92f',
    hash: 'soc_2_b81c',
    versions: [
      {
        version: 1,
        oldBody: 'Đoàn mình 3 người đang từ Thanh Sơn lên, khoảng 10h tới Đỉnh Gió.',
        editedAt: '07:42 (Lưu ẩn cho Moderator kiểm tra)'
      }
    ]
  },
  {
    id: 'soc-msg-3',
    seq: 3,
    senderId: 'partner-khanh-thinh',
    senderName: 'Nhà Xe Khánh Thịnh Limousine',
    senderRole: 'partner',
    senderBadge: 'Nhà Xe Chuyên Tuyến · Cấp 3',
    body: '🚐 Chuyến 22:00 đêm nay từ Mỹ Đình - Cầu Giấy lên thẳng Đỉnh Gió Tà Xùa hiện còn trống 3 ghế tầng 1 êm ái và 5 xe máy Wave/Blade nhận ngay tại bản (giảm 30k khi đặt Combo trên web nhé anh em)!',
    createdAt: '2026-11-05 07:55:00',
    minutesAgo: 3,
    prevHash: 'soc_2_b81c',
    hash: 'soc_3_c74d'
  }
];

const INITIAL_SHARE_DEALS: ShareTripDeal[] = [
  {
    id: 'KP-101',
    category: 'transport',
    categoryLabel: 'Ghép Xe Di Chuyển',
    title: 'Share xe 7 chỗ / Taxi Bản Địa từ Bến xe Bắc Yên lên thẳng Đỉnh Gió (10h00 sáng)',
    dateRange: '14/11/2026 (Đón lúc 10:00 sáng tại Ngã 3 Bắc Yên)',
    routeOrArea: 'Hà Nội / Bắc Yên ↔ Đỉnh Gió Tà Xùa',
    targetListingTitle: 'Hợp Tác Xã Taxi Bản Địa Tà Xùa 24/7',
    slotsLeft: 2,
    totalSlots: 4,
    totalEstimatedVnd: 600000,
    costPerPersonVnd: 150000,
    costSplitRule: 'Chia đều chuyến xe 600.000đ = 150.000đ/người (Trả trực tiếp cho bác tài khi lên Đỉnh Gió)',
    ownerName: 'Nguyễn Hoàng Long',
    ownerTrustScore: 96,
    ownerVerifiedTrips: 5,
    ownerPhone: '0912 889 345',
    description:
      'Vợ chồng mình đi xe khách lên tới thị trấn Bắc Yên lúc 09h45 sáng thứ 7, đã đặt xe 7 chỗ của HTX Taxi Tà Xùa lên thẳng Đỉnh Gió. Tìm thêm 2 bạn đi cùng chuyến để chia tiền xe nhẹ nhàng và không phải tự lái đèo sương mù.',
    applicants: [
      {
        id: 'app-0',
        name: 'Đặng Tuấn Kiệt',
        phoneVerified: true,
        completedTrips: 2,
        verifiedReviews: 2,
        trustScore: 94,
        badge: 'Member Đã Xác Minh SĐT',
        status: 'pending',
        privatePhone: '0983 441 209'
      }
    ]
  },
  {
    id: 'KP-102',
    category: 'room',
    categoryLabel: 'Ghép Phòng Homestay',
    title: 'Tìm 2 bạn nữ ghép căn Villa Kính 2 Phòng Ngủ tại Pơ Mu Cloud Villa',
    dateRange: '14/11/2026 – 16/11/2026 (Cuối tuần)',
    routeOrArea: 'Khu Đỉnh Gió Tà Xùa',
    targetListingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    slotsLeft: 2,
    totalSlots: 4,
    totalEstimatedVnd: 1360000,
    costPerPersonVnd: 340000,
    costSplitRule: 'Chia đều hóa đơn thực tế trên web (340.000đ/người/đêm · Không thu cọc ngoài)',
    ownerName: 'Lê Thu Trang',
    ownerTrustScore: 98,
    ownerVerifiedTrips: 4,
    ownerPhone: '0988 712 345',
    description:
      'Nhóm mình đã có 2 nữ làm văn phòng ở Hà Nội, đã giữ chỗ căn Villa Kính tại Pơ Mu Cloud Villa trên Tà Xùa Trip. Tìm thêm 2 bạn nữ lịch sự ghép chung để chia sẻ chi phí phòng và chụp ảnh săn mây.',
    applicants: [
      {
        id: 'app-1',
        name: 'Trần Ngọc Mai',
        phoneVerified: true,
        completedTrips: 3,
        verifiedReviews: 3,
        trustScore: 96,
        badge: 'Thợ săn mây Cấp 2 · Đã xác minh SĐT',
        status: 'pending',
        privatePhone: '0915 668 234'
      },
      {
        id: 'app-2',
        name: 'Phạm Khánh Linh',
        phoneVerified: true,
        completedTrips: 5,
        verifiedReviews: 4,
        trustScore: 99,
        badge: 'Thành viên Kim Cương · Đã xác minh SĐT',
        status: 'approved',
        privatePhone: '0972 331 890'
      }
    ]
  },
  {
    id: 'KP-105',
    category: 'tour',
    categoryLabel: 'Ghép Đoàn Trekking',
    title: 'Ghép đoàn Trekking Sống Lưng Khủng Long & Đỉnh U Bò (Có Porter H\'Mông dẫn đường)',
    dateRange: '15/11/2026 (05:00 sáng – 15:00 chiều)',
    routeOrArea: 'Háng Đồng ➔ Sống Lưng ➔ Đỉnh U Bò',
    targetListingTitle: 'Tour Trekking Sống Lưng & Thảo Nguyên Tà Xùa',
    slotsLeft: 3,
    totalSlots: 6,
    totalEstimatedVnd: 2100000,
    costPerPersonVnd: 350000,
    costSplitRule: 'Chia đều phí Porter & ăn trưa bản địa (350.000đ/người · Thanh toán khi gặp tại Tà Xùa)',
    ownerName: 'Đỗ Quang Minh',
    ownerTrustScore: 95,
    ownerVerifiedTrips: 6,
    ownerPhone: '0904 556 789',
    description:
      'Đoàn đã có 3 anh em có kinh nghiệm leo núi, thuê Porter Giàng A Lử dẫn đường. Cần tìm thêm 2-3 bạn thể lực tốt đi cùng cho vui và giảm chi phí Porter.',
    applicants: []
  },
  {
    id: 'KP-108',
    category: 'photo',
    categoryLabel: 'Ghép Gói Chụp Ảnh Săn Mây',
    title: 'Share gói Photographer chụp bình minh Đỉnh Gió + Flycam (05:30 – 08:00)',
    dateRange: '15/11/2026 (Khung giờ vàng bình minh)',
    routeOrArea: 'Đỉnh Gió & Tiệm Cà Phê Mị Ơi',
    targetListingTitle: 'A Lử Cloud Studio – Chụp Ảnh & Flycam Săn Mây',
    slotsLeft: 1,
    totalSlots: 3,
    totalEstimatedVnd: 1200000,
    costPerPersonVnd: 400000,
    costSplitRule: 'Chia 3 gói chụp 1.200.000đ = 400.000đ/người (Nhận toàn bộ file gốc + 15 ảnh chỉnh màu)',
    ownerName: 'Vũ Hà Vy',
    ownerTrustScore: 97,
    ownerVerifiedTrips: 2,
    ownerPhone: '0936 112 998',
    description:
      'Mình đã đặt lịch thợ ảnh bản địa có cả máy cơ và Flycam quay biển mây. Cần thêm 1 bạn ghép cùng khung giờ 5h30 sáng để chia tiền thợ.',
    applicants: []
  }
];

const INITIAL_LIVE_CLOUD_REPORTS: LiveCloudReport[] = [
  {
    id: 'cloud-rep-1',
    spotName: 'Đỉnh Gió (Trước hiên Mị Ơi & Mẩy Homestay)',
    areaKey: 'Đỉnh Gió',
    reporterName: 'Giàng A Páo',
    reporterRole: 'Moderator địa phương',
    reportedAt: '06:10 sáng nay',
    expiresIn: 'Còn hiệu lực 21 giờ (Tự lưu lịch sử sau 24h)',
    cloudDensity: 'Biển mây đặc 95% · Đứng gió',
    tempCelsius: 13.5,
    visibilityNote: 'Mây tràn sát lan can gỗ, nắng sớm đã lên rực rỡ, nhiệt độ ngoài trời 13.5°C.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.tiktok.com/@taxuatrip.official',
    helpfulCount: 34,
    gpsVerified: true
  },
  {
    id: 'cloud-rep-2',
    spotName: 'Sống Lưng Khủng Long (Háng Đồng)',
    areaKey: 'Sống Lưng Khủng Long',
    reporterName: 'Trần Hoàng Tuấn',
    reporterRole: 'Khách tại chỗ (GPS xác thực)',
    reportedAt: '06:35 sáng nay',
    expiresIn: 'Còn hiệu lực 22 giờ (Tự lưu lịch sử sau 24h)',
    cloudDensity: 'Thác mây 2 bên sườn núi (90%)',
    tempCelsius: 12.0,
    visibilityNote: 'Đường xuống dốc đầu tiên hơi ẩm sương, nên đi giày bám gai hoặc thuê xe ôm bản địa.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://www.facebook.com/taxuatrip.vn',
    helpfulCount: 28,
    gpsVerified: true
  },
  {
    id: 'cloud-rep-3',
    spotName: 'Đồi Thảo Nguyên & Cây Cô Đơn',
    areaKey: 'Thảo Nguyên',
    reporterName: 'A Lử Porter',
    reporterRole: 'Moderator địa phương',
    reportedAt: '07:15 sáng nay',
    expiresIn: 'Còn hiệu lực 23 giờ (Tự lưu lịch sử sau 24h)',
    cloudDensity: 'Mây luồn thung lũng Thủy điện (85%)',
    tempCelsius: 15.0,
    visibilityNote: 'Nắng ấm rất đẹp để chụp ảnh đồi cỏ và thuê váy Mông. Đường bê tông khô ráo 100%.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    helpfulCount: 19,
    gpsVerified: true
  }
];

const INITIAL_FORUM_REPLIES: Record<string, ForumReplyItem[]> = {
  'post-1': [
    {
      id: 'rep-101',
      postId: 'post-1',
      authorName: 'Giàng A Páo (Moderator Đỉnh Gió)',
      authorRole: 'Thổ Địa / Porter',
      isOfficialVerified: true,
      body: 'Xác nhận sáng nay đèo Bắc Yên - Tà Xùa đã tan sương từ 07:30, mặt đường khô ráo. Anh em đi xe tay ga lưu ý không rà phanh liên tục khi đổ dốc về Bắc Yên nhé!',
      createdAt: '15 phút trước'
    }
  ],
  'post-2': [
    {
      id: 'rep-102',
      postId: 'post-2',
      authorName: 'Mẩy Tà Xùa Homestay',
      authorRole: 'Chủ Cơ Sở Cấp 3',
      isOfficialVerified: true,
      body: 'Bạn nhớ giữ mã đặt phòng trên Tà Xùa Trip nhé, khi ghép phòng tại cơ sở bên mình sẽ hỗ trợ tách hóa đơn minh bạch tại quầy lễ tân.',
      createdAt: '30 phút trước'
    }
  ]
};

export const CommunitySection: React.FC<CommunitySectionProps> = ({
  posts,
  onAddPost,
  isPopupModal = false,
  onClosePopup,
  initialSpaceId,
  siteContent = INITIAL_SITE_CONTENT,
  listings = INITIAL_LISTINGS,
  onEarnCloudPoints
}) => {
  // Main 4-Module Navigation derived from PDF 1 & PDF 2
  const [activeMainTab, setActiveMainTab] = useState<
    'chat_spaces' | 'share_deals' | 'live_cloud_forum' | 'omnichannel_funnel'
  >('chat_spaces');

  // Module 1: Chat Spaces State
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    initialSpaceId || (isPopupModal ? 'space-san-may-24h' : 'space-evidence-dm')
  );
  React.useEffect(() => {
    if (initialSpaceId) {
      setSelectedSpaceId(initialSpaceId);
      setActiveMainTab('chat_spaces');
    }
  }, [initialSpaceId]);
  const [actorRole, setActorRole] = useState<ChatActorRole>('member');
  const [evidenceMessages, setEvidenceMessages] = useState<ChatMessageItem[]>(
    buildInitialEvidenceMessages
  );
  const [socialMessages, setSocialMessages] = useState<ChatMessageItem[]>(INITIAL_SOCIAL_MESSAGES);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [chatFeedback, setChatFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [hashVerificationResult, setHashVerificationResult] = useState<{
    checked: boolean;
    valid: boolean;
    message: string;
  } | null>(null);
  const [exportedPdfCode, setExportedPdfCode] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState<string>('');

  // Module 2: Safe Trip Sharing State (5-step workflow + Create Deal + Cost-Split Calculator)
  const [shareDeals, setShareDeals] = useState<ShareTripDeal[]>(INITIAL_SHARE_DEALS);
  const [shareFilter, setShareFilter] = useState<'all' | 'transport' | 'room' | 'tour' | 'photo'>('all');
  const [shareAreaFilter, setShareAreaFilter] = useState<string>('all');
  const [onlyAvailableDeals, setOnlyAvailableDeals] = useState<boolean>(false);
  const [joinedDealIds, setJoinedDealIds] = useState<string[]>([]);
  const [isCreatingDeal, setIsCreatingDeal] = useState<boolean>(false);
  const [newDealCategory, setNewDealCategory] = useState<'transport' | 'room' | 'tour' | 'photo'>('transport');
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealDateRange, setNewDealDateRange] = useState('15/11/2026 – 16/11/2026 (Cuối tuần)');
  const [newDealArea, setNewDealArea] = useState('Đỉnh Gió Tà Xùa');
  const [newDealListingTitle, setNewDealListingTitle] = useState('');
  const [newDealTotalSlots, setNewDealTotalSlots] = useState<number>(4);
  const [newDealSlotsLeft, setNewDealSlotsLeft] = useState<number>(2);
  const [newDealTotalCostVnd, setNewDealTotalCostVnd] = useState<number>(1200000);
  const [newDealOwnerName, setNewDealOwnerName] = useState('');
  const [newDealOwnerPhone, setNewDealOwnerPhone] = useState('');
  const [newDealDesc, setNewDealDesc] = useState('');

  // Module 3: Live Cloud 24h & Topic Forum State
  const [liveReports, setLiveReports] = useState<LiveCloudReport[]>(INITIAL_LIVE_CLOUD_REPORTS);
  const [cloudSpotFilter, setCloudSpotFilter] = useState<string>('all');
  const [votedReportIds, setVotedReportIds] = useState<string[]>([]);
  const [isCreatingCloudReport, setIsCreatingCloudReport] = useState<boolean>(false);
  const [newReportArea, setNewReportArea] = useState<LiveCloudReport['areaKey']>('Đỉnh Gió');
  const [newReportSpotDetail, setNewReportSpotDetail] = useState('Đỉnh Gió (Cạnh Tiệm Cà Phê Mị Ơi)');
  const [newReportDensity, setNewReportDensity] = useState('Biển mây dày 95% · Đứng gió');
  const [newReportTemp, setNewReportTemp] = useState<number>(14);
  const [newReportNote, setNewReportNote] = useState('');
  const [newReportImageUrl, setNewReportImageUrl] = useState(
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  );
  const [newReportVideoUrl, setNewReportVideoUrl] = useState('');

  const [filter, setFilter] = useState<'all' | 'carpool' | 'share_room' | 'road_alert' | 'review'>('all');
  const [forumSearchQuery, setForumSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'carpool' | 'share_room' | 'road_alert' | 'review'>('road_alert');
  const [route, setRoute] = useState('Đỉnh Gió ➔ Sống Lưng Khủng Long');
  const [departureDate, setDepartureDate] = useState('2026-11-15');
  const [contactPhone, setContactPhone] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [forumReplies, setForumReplies] = useState<Record<string, ForumReplyItem[]>>(INITIAL_FORUM_REPLIES);
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyDraftText, setReplyDraftText] = useState('');
  const [replyAuthorRole, setReplyAuthorRole] = useState<ForumReplyItem['authorRole']>('Thổ Địa / Porter');

  // Module 4: Official Social Ecosystem, QR Hub & Referral Link State
  const [socialPlatformFilter, setSocialPlatformFilter] = useState<
    'all' | 'video_social' | 'facebook' | 'zalo' | 'phone'
  >('all');
  const [qrPreviewChannel, setQrPreviewChannel] = useState<SocialChannelConfig | null>(null);
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);
  const [referralTargetTopic, setReferralTargetTopic] = useState<'san_may' | 'ghep_chuyen' | 'homestay_179'>('san_may');
  const [copiedReferral, setCopiedReferral] = useState(false);

  const currentSpace =
    CHAT_SPACES.find((s) => s.id === selectedSpaceId) || CHAT_SPACES[6];
  const activeMessages =
    currentSpace.tier === 'evidence' ? evidenceMessages : socialMessages;

  // Send message handler with Layer-1 AI Moderation & Chained Hash
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim()) return;

    const canSend = checkChatPermission(actorRole, 'send_message', {
      tier: currentSpace.tier,
      isReadOnlyRoom: currentSpace.isReadOnlyForMember
    });

    if (!canSend) {
      setChatFeedback({
        type: 'error',
        text: 'Phòng #thông-báo-chung chỉ cho phép Admin hoặc Moderator đăng tin chính thức.'
      });
      return;
    }

    const aiCheck = classifyChatMessageAI(newMessageBody);
    const piiMasked = maskSensitivePII(newMessageBody);

    const nextSeq = activeMessages.length + 1;
    const prevHash =
      activeMessages.length > 0
        ? activeMessages[activeMessages.length - 1].hash
        : currentSpace.tier === 'evidence'
        ? 'GENESIS_EVIDENCE_00000000'
        : 'SOCIAL_STREAM';
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const nextHash =
      currentSpace.tier === 'evidence'
        ? computeMessageHash(prevHash, nextSeq, `user-${actorRole}`, newMessageBody.trim(), nowStr)
        : `soc_${nextSeq}_${Math.random().toString(16).slice(2, 6)}`;

    const roleDisplayMap: Record<ChatActorRole, { name: string; badge: string }> = {
      member: { name: 'Bạn (Member Đã Xác Minh)', badge: 'Member Đã Xác Minh SĐT' },
      moderator: { name: 'Giàng A Páo (Moderator)', badge: 'Moderator Địa Phương' },
      room_owner: { name: 'Chủ Phòng Kèo', badge: 'Chủ Kèo Đã Xác Minh' },
      admin: { name: 'Admin Tà Xùa Trip', badge: 'Quản Trị Viên Hệ Thống' },
      ai: { name: 'Bot Kiểm Duyệt & Trợ Lý AI', badge: 'AI Hệ Thống' }
    };

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      seq: nextSeq,
      senderId: `user-${actorRole}`,
      senderName: roleDisplayMap[actorRole].name,
      senderRole: actorRole === 'room_owner' ? 'member' : actorRole,
      senderBadge: roleDisplayMap[actorRole].badge,
      body: newMessageBody.trim(),
      createdAt: nowStr,
      minutesAgo: 0,
      prevHash,
      hash: nextHash,
      aiModeration: aiCheck.flagged
        ? {
            flagged: true,
            labels: aiCheck.labels,
            reason: `${aiCheck.reason} · Bản lập chỉ mục AI đã tự động che PII: "${piiMasked.maskedText}"`
          }
        : undefined
    };

    if (currentSpace.tier === 'evidence') {
      setEvidenceMessages((prev) => [...prev, newMsg]);
    } else {
      setSocialMessages((prev) => [...prev, newMsg]);
    }

    setNewMessageBody('');
    if (aiCheck.flagged) {
      setChatFeedback({
        type: 'warning',
        text: `⚠️ Lớp 1 AI Kiểm Duyệt Tức Thì đã gắn cờ tin nhắn (${aiCheck.labels.join(
          ', '
        )}): ${aiCheck.reason}. Đã chuyển vào hàng chờ Moderator xử lý trong < 1 giờ.`
      });
    } else {
      setChatFeedback({
        type: 'success',
        text:
          currentSpace.tier === 'evidence'
            ? `Đã ghi tin nhắn #${nextSeq} vào chuỗi bằng chứng (Hash: ${nextHash}). Không ai có thể sửa hoặc xóa.`
            : `Đã gửi tin nhắn vào ${currentSpace.name}.`
      });
    }
  };

  const handleSaveEditMessage = (msgId: string) => {
    const canEdit = checkChatPermission(actorRole, 'edit_or_delete_own', {
      tier: currentSpace.tier,
      minutesSinceSent: 5
    });

    if (!canEdit) {
      setChatFeedback({
        type: 'error',
        text: '🔒 Vi phạm quy tắc lưu trữ: Tin nhắn ở mức Bằng Chứng (Evidence Tier) chỉ cho phép INSERT, nghiêm cấm UPDATE hoặc DELETE!'
      });
      setEditingMsgId(null);
      return;
    }

    setSocialMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const prevVersions = m.versions || [];
        return {
          ...m,
          body: editingBody,
          versions: [
            ...prevVersions,
            {
              version: prevVersions.length + 1,
              oldBody: m.body,
              editedAt: 'Vừa sửa (Bản gốc vẫn lưu ẩn trong message_versions cho Moderator)'
            }
          ]
        };
      })
    );
    setEditingMsgId(null);
    setChatFeedback({
      type: 'success',
      text: 'Đã cập nhật tin nhắn (Mức Xã hội < 15 phút). Bản gốc đã được lưu vào bảng message_versions.'
    });
  };

  const handleVerifyHashChain = () => {
    const check = verifyEvidenceHashChain(evidenceMessages);
    setHashVerificationResult({
      checked: true,
      valid: check.valid,
      message: check.valid
        ? `✅ Chuỗi băm hợp lệ 100% (${evidenceMessages.length} tin nhắn nối tiếp từ GENESIS_EVIDENCE_00000000). Không có dấu hiệu chỉnh sửa trái phép trong CSDL.`
        : `❌ Phát hiện sai lệch chuỗi băm tại tin nhắn seq #${check.brokenAtSeq}!`
    });
  };

  const handleExportEvidencePdf = () => {
    const code = `TX-VERIFY-${Date.now().toString(36).toUpperCase()}`;
    setExportedPdfCode(code);
  };

  const handleApproveApplicant = (dealId: string, applicantId: string) => {
    setShareDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        return {
          ...deal,
          slotsLeft: Math.max(0, deal.slotsLeft - 1),
          applicants: deal.applicants.map((a) =>
            a.id === applicantId ? { ...a, status: 'approved' } : a
          )
        };
      })
    );
  };

  const handleRequestJoinDeal = (dealId: string) => {
    if (joinedDealIds.includes(dealId)) return;
    setJoinedDealIds((prev) => [...prev, dealId]);
    setShareDeals((prev) =>
      prev.map((deal) => {
        if (deal.id !== dealId) return deal;
        return {
          ...deal,
          applicants: [
            ...deal.applicants,
            {
              id: `app-${Date.now()}`,
              name: 'Bạn (Member Đã Xác Minh SĐT)',
              phoneVerified: true,
              completedTrips: 2,
              verifiedReviews: 2,
              trustScore: 95,
              badge: 'Thợ săn mây · 180 Điểm Mây',
              status: 'pending',
              privatePhone: '0989 123 456'
            }
          ]
        };
      })
    );
  };

  const handleCreateShareDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) return;

    const categoryMap: Record<
      ShareTripDeal['category'],
      { label: string; roomSpaceId: string }
    > = {
      transport: { label: 'Ghép Xe Di Chuyển', roomSpaceId: 'space-ghep-xe-di-chung' },
      room: { label: 'Ghép Phòng Homestay', roomSpaceId: 'space-ghep-phong-homestay' },
      tour: { label: 'Ghép Đoàn Trekking', roomSpaceId: 'space-tho-anh-tour-thue-do' },
      photo: { label: 'Ghép Chụp Ảnh Săn Mây', roomSpaceId: 'space-tho-anh-tour-thue-do' }
    };

    const safeTotalSlots = Math.max(2, Number(newDealTotalSlots) || 4);
    const safeSlotsLeft = Math.min(safeTotalSlots - 1, Math.max(1, Number(newDealSlotsLeft) || 2));
    const perPerson = Math.round((Number(newDealTotalCostVnd) || 0) / safeTotalSlots);

    const createdDeal: ShareTripDeal = {
      id: `KP-${Math.floor(110 + Math.random() * 890)}`,
      category: newDealCategory,
      categoryLabel: categoryMap[newDealCategory].label,
      title: newDealTitle.trim(),
      dateRange: newDealDateRange.trim() || 'Cuối tuần này',
      routeOrArea: newDealArea,
      targetListingTitle: newDealListingTitle || undefined,
      slotsLeft: safeSlotsLeft,
      totalSlots: safeTotalSlots,
      totalEstimatedVnd: Number(newDealTotalCostVnd) || 0,
      costPerPersonVnd: perPerson,
      costSplitRule:
        perPerson > 0
          ? `Chia đều tổng ${formatVND(Number(newDealTotalCostVnd))} cho ${safeTotalSlots} người = ${formatVND(perPerson)}/người (Phi lợi nhuận · Minh bạch tại cơ sở)`
          : 'Chia đều hóa đơn thực tế trên Tà Xùa Trip (Không thu cọc ngoài)',
      ownerName: newDealOwnerName.trim() || 'Bạn (Member Đã Xác Minh OTP)',
      ownerTrustScore: 98,
      ownerVerifiedTrips: 3,
      ownerPhone: newDealOwnerPhone.trim() || '0989 668 899',
      description:
        newDealDesc.trim() ||
        'Tìm bạn đồng hành văn minh, lịch sự cùng chia sẻ chi phí thực tế qua hệ thống Tà Xùa Trip.',
      applicants: []
    };

    setShareDeals((prev) => [createdDeal, ...prev]);
    setIsCreatingDeal(false);
    setNewDealTitle('');
    setNewDealDesc('');

    // Đồng bộ thông báo kèo mới vào luồng chat xã hội
    const nextSeq = socialMessages.length + 1;
    const autoChatMsg: ChatMessageItem = {
      id: `msg-deal-${Date.now()}`,
      seq: nextSeq,
      senderId: 'member-deal-creator',
      senderName: createdDeal.ownerName,
      senderRole: 'member',
      senderBadge: `Chủ Kèo #${createdDeal.id}`,
      body: `📢 [KÈO GHÉP MỚI #${createdDeal.id} - ${createdDeal.categoryLabel}]: "${createdDeal.title}" (${createdDeal.dateRange}, khu vực ${createdDeal.routeOrArea}). Còn ${createdDeal.slotsLeft}/${createdDeal.totalSlots} chỗ trống · Chi phí: ${createdDeal.costSplitRule}. Anh em vào mục "2. Kèo Ghép Đi Chung" bấm Xin Ghép nhé!`,
      createdAt: 'Vừa xong',
      minutesAgo: 0,
      prevHash: socialMessages[socialMessages.length - 1]?.hash || 'SOCIAL_STREAM',
      hash: `soc_${nextSeq}_${Math.random().toString(16).slice(2, 6)}`,
      pinned: true
    };
    setSocialMessages((prev) => [...prev, autoChatMsg]);

    if (onEarnCloudPoints) {
      onEarnCloudPoints(15, 'Đăng kèo ghép đi chung minh bạch');
    }
  };

  const handleCreateCloudReport = (e: React.FormEvent) => {
    e.preventDefault();
    const created: LiveCloudReport = {
      id: `cloud-rep-${Date.now()}`,
      spotName: newReportSpotDetail.trim() || newReportArea,
      areaKey: newReportArea,
      reporterName: 'Bạn (Khách tại chỗ)',
      reporterRole: 'Khách tại chỗ (GPS xác thực)',
      reportedAt: 'Vừa xong',
      expiresIn: 'Còn hiệu lực 24 giờ',
      cloudDensity: newReportDensity,
      tempCelsius: Number(newReportTemp) || 14,
      visibilityNote:
        newReportNote.trim() ||
        `Thời tiết tại ${newReportArea} hiện thông thoáng, tầm nhìn tốt, anh em lên săn mây ngay nhé!`,
      imageUrl:
        newReportImageUrl.trim() ||
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      videoUrl: newReportVideoUrl.trim() || undefined,
      helpfulCount: 1,
      gpsVerified: true
    };

    setLiveReports((prev) => [created, ...prev]);
    setIsCreatingCloudReport(false);
    setNewReportNote('');
    setNewReportVideoUrl('');

    if (onEarnCloudPoints) {
      onEarnCloudPoints(20, 'Báo mây thực tế kèm tọa độ GPS');
    }
  };

  const handleVoteReportHelpful = (reportId: string) => {
    if (votedReportIds.includes(reportId)) return;
    setVotedReportIds((prev) => [...prev, reportId]);
    setLiveReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
    );
  };

  const handleSubmitForumReply = (postId: string) => {
    if (!replyDraftText.trim()) return;
    const isOfficial =
      replyAuthorRole === 'Thổ Địa / Porter' ||
      replyAuthorRole === 'Chủ Cơ Sở Cấp 3' ||
      replyAuthorRole === 'Admin Tà Xùa Trip';
    const newReply: ForumReplyItem = {
      id: `frep-${Date.now()}`,
      postId,
      authorName:
        replyAuthorRole === 'Thổ Địa / Porter'
          ? 'Giàng A Páo (Thổ Địa Đỉnh Gió)'
          : replyAuthorRole === 'Chủ Cơ Sở Cấp 3'
          ? 'Đại Diện Chủ Cơ Sở Đã Xác Minh'
          : replyAuthorRole === 'Admin Tà Xùa Trip'
          ? 'Admin Tà Xùa Trip'
          : 'Bạn (Thành Viên Tà Xùa Trip)',
      authorRole: replyAuthorRole,
      isOfficialVerified: isOfficial,
      body: replyDraftText.trim(),
      createdAt: 'Vừa xong'
    };

    setForumReplies((prev) => ({
      ...prev,
      [postId]: [newReply, ...(prev[postId] || [])]
    }));
    setReplyDraftText('');
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: authorName.trim() || 'Thành viên Tà Xùa Trip',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isVerifiedMember: true,
      type,
      title,
      content,
      departureDate,
      route,
      contactPhone: contactPhone.trim() || '0981 234 567',
      likes: 1,
      commentsCount: 0,
      createdAt: 'Vừa xong'
    };

    onAddPost(newPost);
    setTitle('');
    setContent('');
    setContactPhone('');
    setAuthorName('');
    setShowForm(false);
  };

  const filteredPosts = posts.filter((p) => {
    const matchType = filter === 'all' || p.type === filter;
    const matchQuery =
      !forumSearchQuery.trim() ||
      p.title.toLowerCase().includes(forumSearchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(forumSearchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  const activeSocialChannels: SocialChannelConfig[] = (
    siteContent?.socialChannels || INITIAL_SITE_CONTENT.socialChannels || []
  ).filter((ch) => ch.isActive && ch.placements.includes('community_hub'));

  const referralShareUrl = buildCommunityUtmUrl(
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://taxuatrip.vn',
    'zalo_group',
    `invite_${referralTargetTopic}_ref_member`
  );

  const totalOnlineInSpaces = CHAT_SPACES.reduce((sum, s) => sum + s.onlineCount, 0);

  const hubContent = (
    <div className={isPopupModal ? 'p-4 sm:p-6 text-slate-900 space-y-6' : 'bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 text-slate-900'}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Hero Banner + Live Online Members Bar */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-[#0a5c66] rounded-3xl p-5 sm:p-8 text-white shadow-xl relative">
          {isPopupModal && onClosePopup && (
            <button
              type="button"
              onClick={onClosePopup}
              className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>✕ Đóng Popup</span>
            </button>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 text-teal-200 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CỘNG ĐỒNG TÀ XÙA TRIP TRỰC TUYẾN • {totalOnlineInSpaces} THÀNH VIÊN ĐANG ONLINE</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                Kết nối trực tiếp 9 Không Gian Chat: Săn Mây · Ghép Chuyến · Đối Soát Bằng Chứng
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tương tác thời gian thực cùng du khách đang ở Tà Xùa, 12 Thổ địa/Porter trực tại Đỉnh Gió & Sống Lưng, các Chủ Homestay, Nhà xe và Admin bảo vệ quyền lợi.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 shrink-0 text-left">
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3">
                <div className="text-xs text-emerald-300 font-bold uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Đang Online</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">
                  {totalOnlineInSpaces}
                </div>
                <div className="text-xs text-slate-300">Trong 9 phòng chat</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3">
                <div className="text-xs text-amber-300 font-bold uppercase">Thổ Địa Trực</div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">
                  12 người
                </div>
                <div className="text-xs text-slate-300">Đỉnh Gió & Sống Lưng</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3">
                <div className="text-xs text-teal-200 font-bold uppercase">Kèo Đang Mở</div>
                <div className="text-lg sm:text-xl font-black text-white mt-0.5 tabular-nums">
                  {shareDeals.length} kèo
                </div>
                <div className="text-xs text-slate-300">Ghép xe, phòng & tour</div>
              </div>
            </div>
          </div>

          {/* Live Online Members Presence Strip */}
          <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-extrabold text-teal-200 whitespace-nowrap shrink-0">
              🟢 Đang trực tuyến:
            </span>
            {ONLINE_MEMBERS_LIVE.map((member) => (
              <div
                key={member.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 shrink-0 text-xs"
              >
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-800" />
                </div>
                <div className="leading-tight">
                  <div className="font-extrabold text-white text-xs">
                    {member.name}{' '}
                    <span className="text-teal-200 font-normal">({member.area})</span>
                  </div>
                  <div className="text-xs text-amber-200">{member.statusText}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 4 Main Architecture Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/15">
            <button
              type="button"
              onClick={() => setActiveMainTab('chat_spaces')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'chat_spaces'
                  ? 'bg-white text-brand-800 border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>1. Hệ Thống Chat (9 Không Gian)</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                  {totalOnlineInSpaces} online
                </span>
              </div>
              <p className={`text-xs ${activeMainTab === 'chat_spaces' ? 'text-slate-600' : 'text-slate-300'}`}>
                7 Nhóm Tương Tác & 2 Phòng Bằng Chứng
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('share_deals')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'share_deals'
                  ? 'bg-white text-brand-800 border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>2. Kèo Ghép Đi Chung An Toàn</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                  {shareDeals.length} kèo mở
                </span>
              </div>
              <p className={`text-xs ${activeMainTab === 'share_deals' ? 'text-slate-600' : 'text-slate-300'}`}>
                Ghép xe, phòng, tour, ảnh · Tự tính chia tiền
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('live_cloud_forum')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'live_cloud_forum'
                  ? 'bg-white text-brand-800 border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  <span>3. “Mây Hôm Nay” & Hỏi Đáp</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                  Live 24h
                </span>
              </div>
              <p className={`text-xs ${activeMainTab === 'live_cloud_forum' ? 'text-slate-600' : 'text-slate-300'}`}>
                Ảnh/Video GPS thực địa & Thổ địa giải đáp
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('omnichannel_funnel')}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                activeMainTab === 'omnichannel_funnel'
                  ? 'bg-white text-brand-800 border-white shadow-md font-extrabold'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/15 font-semibold'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  <span>4. Kênh Chính Thức & Quét QR</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-bold">
                  {activeSocialChannels.length} Kênh
                </span>
              </div>
              <p className={`text-xs ${activeMainTab === 'omnichannel_funnel' ? 'text-slate-600' : 'text-slate-300'}`}>
                TikTok · FB · Zalo OA · Hotline & Chia sẻ +30đ
              </p>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: 9 CHAT SPACES & 2 STORAGE TIERS (SOCIAL vs EVIDENCE)
           ===================================================================== */}
        {activeMainTab === 'chat_spaces' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: 9 Spaces with Live Online Counts */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800">
                    NHÓM CỘNG ĐỒNG TRẢI NGHIỆM (1 ➔ 7)
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Đang sôi nổi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2.5">
                  Chọn đúng nhóm theo nhu cầu: Săn mây, ghép xe, ghép phòng, ẩm thực, thợ ảnh, cứu hộ.
                </p>
                <div className="space-y-1.5">
                  {CHAT_SPACES.filter((s) => s.tier === 'social').map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpaceId(space.id);
                        setChatFeedback(null);
                      }}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedSpaceId === space.id
                          ? 'bg-brand-800 text-white border-brand-800 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                        <span className="truncate">{space.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {space.unreadCount > 0 && selectedSpaceId !== space.id && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black">
                              +{space.unreadCount}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              selectedSpaceId === space.id
                                ? 'bg-emerald-500/25 text-emerald-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{space.onlineCount}</span>
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-xs mt-0.5 line-clamp-1 ${
                          selectedSpaceId === space.id ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {space.typeLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                  PHÒNG BẰNG CHỨNG & BẢO VỆ (8 ➔ 9)
                </span>
                <p className="text-xs text-slate-500 mb-2.5">
                  Lưu trữ 3 năm (INSERT-ONLY), nối chuỗi Hash SHA-256, xuất PDF đối soát.
                </p>
                <div className="space-y-1.5">
                  {CHAT_SPACES.filter((s) => s.tier === 'evidence').map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpaceId(space.id);
                        setChatFeedback(null);
                      }}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedSpaceId === space.id
                          ? 'bg-brand-800 text-white border-brand-800 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                        <span className="truncate">{space.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              selectedSpaceId === space.id
                                ? 'bg-amber-400/20 text-amber-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{space.onlineCount}</span>
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-xs mt-0.5 line-clamp-1 ${
                          selectedSpaceId === space.id ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {space.typeLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Chat Window */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
              {/* Room Header & Role RBAC Simulator */}
              <div className="border-b border-slate-200 pb-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-brand-800">{currentSpace.name}</h2>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          currentSpace.tier === 'evidence'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {currentSpace.retentionLabel}
                      </span>
                      {currentSpace.legalHoldActive && (
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          ⚖️ Đang Khóa Pháp Lý (Legal Hold)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Vòng đời:</strong> {currentSpace.lifecycleLabel} ·{' '}
                      <strong>Thành viên:</strong> {currentSpace.participantsLabel}
                    </p>
                  </div>

                  {/* Evidence Actions: Hash Verification & PDF Export */}
                  {currentSpace.tier === 'evidence' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyHashChain}
                        className="bg-slate-100 hover:bg-slate-200 text-brand-800 font-extrabold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Hash className="w-3.5 h-3.5 text-teal-700" />
                        <span>Kiểm tra Chuỗi Hash</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportEvidencePdf}
                        className="bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xuất PDF Bằng Chứng</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Role Switcher to test Section 3.4 Permission Matrix */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700">
                    Đang đóng vai (Kiểm tra phân quyền Mục 3.4):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'member', label: 'Thành viên' },
                        { id: 'moderator', label: 'Moderator địa phương' },
                        { id: 'room_owner', label: 'Chủ phòng kèo' },
                        { id: 'admin', label: 'Admin' }
                      ] as Array<{ id: ChatActorRole; label: string }>
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActorRole(r.id)}
                        className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                          actorRole === r.id
                            ? 'bg-brand-800 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {hashVerificationResult && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-3 text-xs font-bold flex items-center justify-between">
                    <span>{hashVerificationResult.message}</span>
                    <button
                      type="button"
                      onClick={() => setHashVerificationResult(null)}
                      className="text-emerald-800 underline ml-2 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}

                {exportedPdfCode && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-3.5 text-xs space-y-1">
                    <div className="font-extrabold flex items-center justify-between">
                      <span>
                        📄 Đã tạo Bản Xuất Hội Thoại Bằng Chứng PDF (Mã xác thực: {exportedPdfCode})
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        In / Lưu PDF ngay
                      </button>
                    </div>
                    <p className="text-xs text-amber-900">
                      Bản xuất bao gồm đầy đủ chuỗi băm `prev_hash` ➔ `hash`, timestamp máy chủ và chữ ký xác thực đối chiếu với dữ liệu gốc trong PostgreSQL.
                    </p>
                  </div>
                )}
              </div>

              {/* Messages Stream */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 border ${
                      msg.aiModeration?.flagged
                        ? 'bg-rose-50/70 border-rose-300'
                        : msg.pinned
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-brand-800">
                          {msg.senderName}
                        </span>
                        {(() => {
                          const badge = msg.senderBadge || '';
                          if (badge.includes('Homestay') || badge.includes('Lưu Trú') || badge.includes('Mẩy') || badge.includes('Chủ')) {
                            return (
                              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                                [LƯU TRÚ] {badge}
                              </span>
                            );
                          }
                          if (badge.includes('Xe') || badge.includes('Taxi') || badge.includes('Di Chuyển') || badge.includes('Limousine') || badge.includes('Bác tài')) {
                            return (
                              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                                [DI CHUYỂN] {badge}
                              </span>
                            );
                          }
                          if (badge.includes('Tour') || badge.includes('Photo') || badge.includes('Trang Phục') || badge.includes('Máy Ảnh') || badge.includes('Cứu hộ') || badge.includes('Đối Tác')) {
                            return (
                              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                                [DỊCH VỤ KHÁC] {badge}
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                              {badge}
                            </span>
                          );
                        })()}
                        {msg.pinned && (
                          <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                            📌 Đã ghim
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span>seq #{msg.seq}</span>
                        <span>·</span>
                        <span>{msg.createdAt}</span>
                      </div>
                    </div>

                    {/* Message Body or Edit Input */}
                    {editingMsgId === msg.id ? (
                      <div className="space-y-2 my-2">
                        <input
                          type="text"
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEditMessage(msg.id)}
                            className="bg-brand-800 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                          >
                            Lưu bản sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="text-xs text-slate-500 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{msg.body}</p>
                    )}

                    {/* Binding Quote Card inside Evidence Chat (Section 3.5) */}
                    {msg.quoteCard && (
                      <div className="mt-3 bg-white border-2 border-teal-600 rounded-2xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-extrabold text-teal-800">
                          <span>📋 THẺ BÁO GIÁ & GIỮ CHỖ RÀNG BUỘC TRONG CHAT</span>
                          <span className="font-mono">#{msg.quoteCard.bookingRef}</span>
                        </div>
                        <div className="text-xs text-slate-800 font-bold">
                          {msg.quoteCard.roomName}
                        </div>
                        <div className="text-xs text-slate-600">
                          Ngày: {msg.quoteCard.dates} · Giá chốt:{' '}
                          <strong className="text-brand-800">{msg.quoteCard.price}</strong>
                        </div>
                        <div className="text-xs text-emerald-700 font-bold">
                          ✓ Giá chốt trong thẻ này có giá trị ràng buộc pháp lý và khớp 100% với đơn booking.
                        </div>
                      </div>
                    )}

                    {/* AI Layer-1 Moderation Alert */}
                    {msg.aiModeration?.flagged && (
                      <div className="mt-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl p-2.5 text-xs font-semibold">
                        🤖 <strong>AI Kiểm Duyệt Lớp 1:</strong> {msg.aiModeration.reason}
                      </div>
                    )}

                    {/* Hidden Version History (Visible to Moderator/Admin per Section 3.2 & 4.2) */}
                    {msg.versions &&
                      msg.versions.length > 0 &&
                      (actorRole === 'moderator' || actorRole === 'admin') && (
                        <div className="mt-2 bg-slate-200/70 rounded-xl p-2.5 text-xs text-slate-700">
                          <strong>🕵️ Lịch sử sửa tin (`message_versions` chỉ Moderator/Admin thấy):</strong>
                          {msg.versions.map((v) => (
                            <div key={v.version} className="mt-0.5">
                              v{v.version} ({v.editedAt}): <em>"{v.oldBody}"</em>
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Footer: Cryptographic Hash & Actions */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono truncate max-w-md" title={`prev: ${msg.prevHash} -> hash: ${msg.hash}`}>
                        Hash: {msg.hash} (prev: {msg.prevHash.slice(0, 14)}...)
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditingBody(msg.body);
                          }}
                          className="text-brand-800 font-bold hover:underline cursor-pointer"
                        >
                          {currentSpace.tier === 'evidence'
                            ? 'Thử sửa tin (Test chặn RLS)'
                            : 'Sửa tin (< 15p)'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Send Message Form & Quick Scam/PII Test Buttons */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                {chatFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-bold ${
                      chatFeedback.type === 'error'
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : chatFeedback.type === 'warning'
                        ? 'bg-amber-50 border border-amber-300 text-amber-900'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    }`}
                  >
                    {chatFeedback.text}
                  </div>
                )}

                {/* 1-Tap Context Quick Prompts for Current Space */}
                {currentSpace.quickPrompts && currentSpace.quickPrompts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 mr-1">💬 Hỏi nhanh 1 chạm:</span>
                    {currentSpace.quickPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewMessageBody(promptText)}
                        className="px-2.5 py-1 rounded-full bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-brand-800 transition-colors cursor-pointer"
                      >
                        + {promptText}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    placeholder={`Nhắn tin vào ${currentSpace.name} (AI tự động lọc lừa đảo & che PII)...`}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-800"
                  />
                  <button
                    type="submit"
                    className="bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi tin</span>
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold">Thử nhanh bộ lọc AI Lớp 1:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMessageBody(
                        'Bạn chuyển khoản ngoài cọc riêng 300k vào STK: 1903888999123 cho mình nhé!'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    + Mẫu tin gạ cọc ngoài & lộ STK
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMessageBody(
                        'Mình xác nhận đặt phòng qua web Tà Xùa Trip để nhận Điểm Mây và bảo vệ đặt chỗ.'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 cursor-pointer"
                  >
                    + Mẫu tin nhắn hợp lệ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: SAFE TRIP SHARING 5-STEP WORKFLOW + CREATE DEAL & COST SPLIT
           ===================================================================== */}
        {activeMainTab === 'share_deals' && (
          <div className="space-y-6">
            {/* Safety & Legal Guardrail Banner + Create New Deal CTA */}
            <div className="bg-amber-50 border border-amber-300 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 max-w-3xl">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>NGUYÊN TẮC AN TOÀN & CHIA SẺ CHI PHÍ KÈO GHÉP ĐI CHUNG (5 BƯỚC BẢO VỆ)</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    1. Chỉ Member <strong>đã xác minh SĐT OTP</strong> mới được đăng kèo hoặc xin ghép. 2. Hỗ trợ đủ 4 nhóm: <strong>🚗 Ghép xe di chuyển, 🏡 Ghép phòng Homestay, 🥾 Ghép tour Trekking, 📸 Ghép chụp ảnh</strong> (chia đều chi phí thực tế phi lợi nhuận). 3. <strong>Ẩn số điện thoại cá nhân</strong> cho đến khi Chủ kèo xem <em>Hồ sơ tin cậy (Trust Profile)</em> và bấm Duyệt!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingDeal((prev) => !prev)}
                  className="shrink-0 bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl inline-flex items-center gap-2 shadow-md cursor-pointer self-start lg:self-auto"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  <span>{isCreatingDeal ? 'Đóng Form Đăng Kèo' : '+ Đăng Kèo Ghép Mới (+15 Điểm Mây)'}</span>
                </button>
              </div>

              {/* Filter Bar: 4 Categories + Area Filter + Available Only */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'all', label: `Tất cả kèo (${shareDeals.length})` },
                      { id: 'transport', label: '🚗 Ghép xe di chuyển' },
                      { id: 'room', label: '🏡 Ghép phòng' },
                      { id: 'tour', label: '🥾 Ghép tour' },
                      { id: 'photo', label: '📸 Ghép chụp ảnh' }
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setShareFilter(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                        shareFilter === cat.id
                          ? 'bg-brand-800 text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100/60 border border-amber-300 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={shareAreaFilter}
                    onChange={(e) => setShareAreaFilter(e.target.value)}
                    className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="all">📍 Mọi khu vực / Lộ trình</option>
                    <option value="Đỉnh Gió">Khu Đỉnh Gió</option>
                    <option value="Sống Lưng">Sống Lưng Khủng Long</option>
                    <option value="Bắc Yên">Hà Nội / Bắc Yên ↔ Tà Xùa</option>
                  </select>

                  <label className="inline-flex items-center gap-1.5 bg-white border border-amber-300 px-3 py-2 rounded-xl font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyAvailableDeals}
                      onChange={(e) => setOnlyAvailableDeals(e.target.checked)}
                      className="accent-brand-800"
                    />
                    <span>Chỉ hiện kèo còn slot</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Interactive Create New Share Deal Modal / Card with Auto Cost-Split Calculator */}
            {isCreatingDeal && (
              <form
                onSubmit={handleCreateShareDeal}
                className="bg-white border-2 border-brand-800 rounded-3xl p-6 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                      TẠO KÈO GHÉP MỚI · TỰ ĐỘNG ĐỒNG BỘ VÀO PHÒNG CHAT TƯƠNG ỨNG
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-brand-800">
                      Đăng Kèo Ghép Đi Chung Minh Bạch & Tính Chi Phí Chia Đầu Người
                    </h3>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                    🎁 Thưởng +15 Điểm Mây
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      1. Chọn danh mục kèo ghép *
                    </label>
                    <select
                      value={newDealCategory}
                      onChange={(e) => setNewDealCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-brand-800"
                    >
                      <option value="transport">🚗 Ghép Xe Khách / Taxi Hà Nội ↔ Tà Xùa</option>
                      <option value="room">🏡 Ghép Phòng Homestay / Villa</option>
                      <option value="tour">🥾 Ghép Đoàn Tour Trekking / Porter</option>
                      <option value="photo">📸 Ghép Thợ Chụp Ảnh / Flycam</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      2. Chọn Cơ sở / Nhà xe trong danh bạ Tà Xùa Trip
                    </label>
                    <select
                      value={newDealListingTitle}
                      onChange={(e) => setNewDealListingTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn cơ sở đích để tăng độ tin cậy (Tùy chọn) --</option>
                      {listings
                        .filter((l) => {
                          if (newDealCategory === 'transport') {
                            return ['bus', 'taxi', 'motorbike', 'car_rental', 'pickup'].includes(l.category);
                          }
                          if (newDealCategory === 'room') return l.category === 'homestay';
                          if (newDealCategory === 'tour') return l.category === 'tour';
                          return ['photo', 'costume', 'camera'].includes(l.category);
                        })
                        .slice(0, 30)
                        .map((item) => (
                          <option key={item.id} value={item.title}>
                            {item.title} ({item.area} · {formatVND(item.minPrice)})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      3. Tiêu đề kèo ghép *
                    </label>
                    <input
                      type="text"
                      value={newDealTitle}
                      onChange={(e) => setNewDealTitle(e.target.value)}
                      placeholder="VD: Tìm 2 bạn ghép xe 7 chỗ từ Bắc Yên lên Đỉnh Gió sáng Thứ 7..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      4. Thời gian / Ngày đi *
                    </label>
                    <input
                      type="text"
                      value={newDealDateRange}
                      onChange={(e) => setNewDealDateRange(e.target.value)}
                      placeholder="VD: 15/11/2026 (09:30 sáng)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>

                {/* Auto Cost-Split Calculator Box */}
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="text-xs font-bold text-teal-900 block mb-1">
                      Tổng số người của kèo
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={16}
                      value={newDealTotalSlots}
                      onChange={(e) => setNewDealTotalSlots(Math.max(2, Number(e.target.value) || 2))}
                      className="w-full bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-brand-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-teal-900 block mb-1">
                      Số chỗ còn trống cần tìm
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={newDealSlotsLeft}
                      onChange={(e) => setNewDealSlotsLeft(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-teal-900 block mb-1">
                      Tổng chi phí chuyến/phòng (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={newDealTotalCostVnd}
                      onChange={(e) => setNewDealTotalCostVnd(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-brand-800"
                    />
                  </div>
                  <div className="bg-white border border-teal-300 rounded-xl p-2.5 text-xs">
                    <span className="text-xs text-slate-500 block font-bold uppercase">
                      Tự tính chia đầu người:
                    </span>
                    <span className="text-sm font-black text-emerald-700">
                      {formatVND(Math.round((Number(newDealTotalCostVnd) || 0) / Math.max(2, newDealTotalSlots)))} / người
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Khu vực / Lộ trình
                    </label>
                    <input
                      type="text"
                      value={newDealArea}
                      onChange={(e) => setNewDealArea(e.target.value)}
                      placeholder="VD: Bắc Yên ↔ Đỉnh Gió"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên chủ kèo (Đã xác minh)
                    </label>
                    <input
                      type="text"
                      value={newDealOwnerName}
                      onChange={(e) => setNewDealOwnerName(e.target.value)}
                      placeholder="Tên của bạn..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      SĐT (Tự động ẩn cho tới khi Duyệt)
                    </label>
                    <input
                      type="tel"
                      value={newDealOwnerPhone}
                      onChange={(e) => setNewDealOwnerPhone(e.target.value)}
                      placeholder="098x xxx xxx"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    value={newDealDesc}
                    onChange={(e) => setNewDealDesc(e.target.value)}
                    placeholder="Ghi chú thêm (VD: Ưu tiên các bạn nữ lịch sự, không hút thuốc, thanh toán trực tiếp tại quầy lễ tân)..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shrink-0 shadow-md"
                  >
                    ✓ Đăng Kèo & Đẩy Vào Phòng Chat
                  </button>
                </div>
              </form>
            )}

            {/* Active Share Deals List */}
            <div className="grid grid-cols-1 gap-6">
              {shareDeals
                .filter((d) => {
                  const matchCat = shareFilter === 'all' || d.category === shareFilter;
                  const matchArea =
                    shareAreaFilter === 'all' ||
                    d.routeOrArea.toLowerCase().includes(shareAreaFilter.toLowerCase()) ||
                    (d.targetListingTitle || '').toLowerCase().includes(shareAreaFilter.toLowerCase());
                  const matchSlot = !onlyAvailableDeals || d.slotsLeft > 0;
                  return matchCat && matchArea && matchSlot;
                })
                .map((deal) => {
                  const hasApprovedApplicant = deal.applicants.some((a) => a.status === 'approved');
                  const targetRoomSpaceId =
                    deal.category === 'transport'
                      ? 'space-ghep-xe-di-chung'
                      : deal.category === 'room'
                      ? 'space-ghep-phong-homestay'
                      : 'space-tho-anh-tour-thue-do';
                  return (
                    <div
                      key={deal.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                              {deal.category === 'transport'
                                ? '🚗 '
                                : deal.category === 'room'
                                ? '🏡 '
                                : deal.category === 'tour'
                                ? '🥾 '
                                : '📸 '}
                              {deal.categoryLabel} · #{deal.id}
                            </span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                              Còn {deal.slotsLeft}/{deal.totalSlots} chỗ trống
                            </span>
                            {deal.costPerPersonVnd && (
                              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                💰 {formatVND(deal.costPerPersonVnd)}/người
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-brand-800 mt-1">{deal.title}</h3>
                          {deal.targetListingTitle && (
                            <div className="text-xs font-bold text-teal-700 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Cơ sở đã thẩm định: {deal.targetListingTitle}</span>
                            </div>
                          )}
                          <p className="text-xs text-slate-600 leading-relaxed">{deal.description}</p>
                        </div>

                        {/* Owner Trust Profile Badge */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs shrink-0 space-y-1">
                          <div className="font-extrabold text-brand-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Chủ kèo: {deal.ownerName}</span>
                          </div>
                          <div className="text-slate-600">
                            Điểm tin cậy: <strong className="text-emerald-700">{deal.ownerTrustScore}/100</strong> ·{' '}
                            {deal.ownerVerifiedTrips} chuyến hoàn tất
                          </div>
                          <div className="text-xs font-bold text-slate-700">
                            SĐT liên hệ:{' '}
                            {hasApprovedApplicant ? (
                              <span className="text-emerald-700 font-mono">{deal.ownerPhone} (Đã mở sau khi duyệt)</span>
                            ) : (
                              <span className="text-amber-800">🔒 Ẩn đến khi 2 bên chấp nhận</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-slate-500 block">Thời gian:</span>
                          <strong className="text-slate-900">{deal.dateRange}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Khu vực / Lộ trình:</span>
                          <strong className="text-slate-900">{deal.routeOrArea}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Nguyên tắc chia chi phí:</span>
                          <strong className="text-teal-800">{deal.costSplitRule}</strong>
                        </div>
                      </div>

                      {/* Applicants & Trust Profile Approval Queue */}
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-brand-800">
                            Danh sách thành viên Xin Ghép & Hồ sơ tin cậy ({deal.applicants.length}):
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRequestJoinDeal(deal.id)}
                              disabled={joinedDealIds.includes(deal.id)}
                              className="bg-brand-800 hover:bg-brand-700 disabled:opacity-60 text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer"
                            >
                              {joinedDealIds.includes(deal.id)
                                ? '✓ Đã gửi yêu cầu Xin Ghép'
                                : '+ Bấm Xin Ghép Kèo Này'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSpaceId(targetRoomSpaceId);
                                setActiveMainTab('chat_spaces');
                              }}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer"
                            >
                              Chat trong phòng {deal.category === 'transport' ? '#2 Ghép Xe' : deal.category === 'room' ? '#3 Ghép Phòng' : '#5 Tour & Ảnh'} →
                            </button>
                          </div>
                        </div>

                        {deal.applicants.length === 0 ? (
                          <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">
                            Chưa có yêu cầu xin ghép mới. Hãy bấm "+ Bấm Xin Ghép Kèo Này" để kiểm thử luồng duyệt Hồ sơ tin cậy!
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {deal.applicants.map((app) => (
                              <div
                                key={app.id}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-brand-800 flex items-center gap-1.5">
                                    <span>{app.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                      Trust {app.trustScore}/100
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-600">{app.badge}</div>
                                  <div className="text-xs text-slate-600">
                                    Đã đi {app.completedTrips} chuyến · {app.verifiedReviews} review xác thực
                                  </div>
                                  <div className="text-xs font-bold">
                                    SĐT:{' '}
                                    {app.status === 'approved' ? (
                                      <span className="text-emerald-700 font-mono">{app.privatePhone}</span>
                                    ) : (
                                      <span className="text-slate-400">09xx xxx xxx (Ẩn trước khi duyệt)</span>
                                    )}
                                  </div>
                                </div>

                                {app.status === 'approved' ? (
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shrink-0">
                                    ✓ Đã duyệt vào phòng
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveApplicant(deal.id, app.id)}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shrink-0 cursor-pointer"
                                  >
                                    Duyệt & Mở SĐT
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: BẢNG TIN "MÂY HÔM NAY" (LIVE 24H) & DIỄN ĐÀN HỎI ĐÁP SEO
           ===================================================================== */}
        {activeMainTab === 'live_cloud_forum' && (
          <div className="space-y-8">
            {/* Live 24h Cloud Reports Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                    THÔNG TIN THỜI GIAN THỰC · TỰ HẾT HẠN SAU 24 GIỜ · XÁC THỰC TỌA ĐỘ GPS
                  </span>
                  <h2 className="text-xl font-extrabold text-brand-800">
                    Bảng Tin “Mây Hôm Nay” Do Khách Tại Chỗ & Thổ Địa Trực Chiến Báo Cáo
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingCloudReport((prev) => !prev)}
                  className="bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>
                    {isCreatingCloudReport
                      ? 'Đóng Form Báo Mây'
                      : '+ Báo Mây Thực Tế & Nhúng Video (+20 Điểm Mây)'}
                  </span>
                </button>
              </div>

              {/* Spot Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {(['all', 'Đỉnh Gió', 'Sống Lưng Khủng Long', 'Thảo Nguyên', 'Cây Cô Đơn', 'Mỏm Cá Heo'] as const).map(
                  (spot) => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => setCloudSpotFilter(spot)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                        cloudSpotFilter === spot
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {spot === 'all' ? '📍 Tất cả tọa độ săn mây' : `☁️ ${spot}`}
                    </button>
                  )
                )}
              </div>

              {/* Custom Form to Submit Real-Time Cloud & Weather Report */}
              {isCreatingCloudReport && (
                <form
                  onSubmit={handleCreateCloudReport}
                  className="bg-teal-50/60 border-2 border-teal-600 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-brand-800 uppercase">
                      📸 Gửi Báo Cáo Biển Mây & Tình Trạng Đường Đèo Thực Tế (Nhận +20 Điểm Mây)
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                      ✓ Tự động gắn nhãn GPS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Khu vực săn mây *
                      </label>
                      <select
                        value={newReportArea}
                        onChange={(e) => {
                          const val = e.target.value as LiveCloudReport['areaKey'];
                          setNewReportArea(val);
                          setNewReportSpotDetail(`${val} (Góc quan sát thực tế)`);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-brand-800"
                      >
                        <option value="Đỉnh Gió">Đỉnh Gió</option>
                        <option value="Sống Lưng Khủng Long">Sống Lưng Khủng Long</option>
                        <option value="Thảo Nguyên">Thảo Nguyên Tà Xùa</option>
                        <option value="Cây Cô Đơn">Cây Cô Đơn</option>
                        <option value="Mỏm Cá Heo">Mỏm Cá Heo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Vị trí cụ thể
                      </label>
                      <input
                        type="text"
                        value={newReportSpotDetail}
                        onChange={(e) => setNewReportSpotDetail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Mật độ mây hiện tại
                      </label>
                      <select
                        value={newReportDensity}
                        onChange={(e) => setNewReportDensity(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800"
                      >
                        <option value="Biển mây dày đặc 95% · Đứng gió">Biển mây dày đặc 95% · Đứng gió</option>
                        <option value="Mây luồn thung lũng 85% · Nắng sớm">Mây luồn thung lũng 85% · Nắng sớm</option>
                        <option value="Nắng quang mây · Hoàng hôn tím">Nắng quang mây · Hoàng hôn tím</option>
                        <option value="Sương mù dày · Tầm nhìn hạn chế">Sương mù dày · Tầm nhìn hạn chế</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Nhiệt độ ngoài trời (°C)
                      </label>
                      <input
                        type="number"
                        value={newReportTemp}
                        onChange={(e) => setNewReportTemp(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Link ảnh chụp thực tế (hoặc chọn ảnh mẫu săn mây)
                      </label>
                      <input
                        type="text"
                        value={newReportImageUrl}
                        onChange={(e) => setNewReportImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Link Video TikTok / Facebook Reels vừa quay (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={newReportVideoUrl}
                        onChange={(e) => setNewReportVideoUrl(e.target.value)}
                        placeholder="Dán link video TikTok hoặc Facebook thực tế..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <input
                      type="text"
                      value={newReportNote}
                      onChange={(e) => setNewReportNote(e.target.value)}
                      placeholder="Mô tả thêm về đường đi, gió, sương mù hoặc quán cafe đang ngồi..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shrink-0"
                    >
                      Đăng Báo Mây Ngay (+20đ)
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {liveReports
                  .filter((r) => cloudSpotFilter === 'all' || r.areaKey === cloudSpotFilter)
                  .map((rep) => (
                    <div
                      key={rep.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <div className="relative h-44">
                          <img
                            src={rep.imageUrl}
                            alt={rep.spotName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-slate-950/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                            📍 {rep.spotName}
                          </div>
                          {rep.tempCelsius !== undefined && (
                            <div className="absolute top-3 right-3 bg-sky-900/90 text-sky-100 text-xs font-black px-2.5 py-1 rounded-full">
                              🌡️ {rep.tempCelsius}°C
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
                            ✓ Xác Thực Tọa Độ GPS
                          </div>
                        </div>
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-brand-800">
                              {rep.reporterName}
                            </span>
                            <span className="text-teal-700 font-bold text-xs">{rep.reportedAt}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-semibold">
                            Vai trò: {rep.reporterRole}
                          </div>
                          <div className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            ☁️ {rep.cloudDensity}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{rep.visibilityNote}</p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleVoteReportHelpful(rep.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                            votedReportIds.includes(rep.id)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Hữu ích ({rep.helpfulCount || 1})</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {rep.videoUrl && (
                            <a
                              href={rep.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Xem Clip</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSpaceId('space-san-may-24h');
                              setActiveMainTab('chat_spaces');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold text-xs cursor-pointer"
                          >
                            <span>Phòng #1 →</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Community Q&A Forum with Verified Local & Host Answers */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                    DIỄN ĐÀN HỎI ĐÁP SEO · CÓ PHẢN HỒI XÁC THỰC TỪ THỔ ĐỊA & CHỦ CƠ SỞ
                  </span>
                  <h3 className="text-lg font-extrabold text-brand-800">
                    Hỏi Đáp Kinh Nghiệm Đường Đèo, Săn Mây & Review Thực Tế
                  </h3>
                  <p className="text-xs text-slate-600">
                    Mọi câu hỏi được Thổ địa, Chủ Homestay/Nhà xe Cấp 3 và Admin trả lời trực tiếp, lưu trữ lâu dài làm cẩm nang tra cứu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showForm ? 'Đóng form câu hỏi' : '+ Đặt Câu Hỏi / Báo Đường'}</span>
                </button>
              </div>

              {/* Search & Topic Tag Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Tất cả chủ đề' },
                      { id: 'road_alert', label: '⚠️ #đường-đèo & sương mù' },
                      { id: 'share_room', label: '🏡 #ghép-phòng & lưu trú' },
                      { id: 'carpool', label: '🚐 #di-chuyển & xe cộ' },
                      { id: 'review', label: '⭐ #review-thực-tế' }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        filter === tab.id
                          ? 'bg-brand-800 text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={forumSearchQuery}
                    onChange={(e) => setForumSearchQuery(e.target.value)}
                    placeholder="Tìm câu hỏi (VD: đèo Bắc Yên, săn mây)..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              {showForm && (
                <form
                  onSubmit={handleSubmitPost}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="road_alert">#đường-đi · Cảnh báo đường đèo</option>
                      <option value="share_room">#ghép-phòng · Tìm bạn ghép phòng</option>
                      <option value="carpool">#hỏi-đáp · Kinh nghiệm & Đi chung</option>
                      <option value="review">#review · Đánh giá dịch vụ thực tế</option>
                    </select>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Tên của bạn *"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="SĐT xác minh *"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tiêu đề câu hỏi hoặc cảnh báo đường đi *"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    required
                  />
                  <textarea
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nội dung chi tiết *"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-brand-800 text-white font-extrabold text-xs px-5 py-2 rounded-xl cursor-pointer"
                  >
                    Đăng lên diễn đàn
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {filteredPosts.map((post) => {
                  const postReplies = forumReplies[post.id] || [];
                  const isReplying = activeReplyPostId === post.id;
                  return (
                    <div
                      key={post.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-brand-800">{post.authorName}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-teal-800">
                            {post.type === 'road_alert'
                              ? '#đường-đèo'
                              : post.type === 'share_room'
                              ? '#ghép-phòng'
                              : post.type === 'review'
                              ? '#review-thật'
                              : '#hỏi-đáp'}
                          </span>
                        </div>
                        <span className="text-slate-500">{post.createdAt}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">{post.title}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">{post.content}</p>

                      {/* Verified Local / Host / Admin Replies */}
                      {postReplies.length > 0 && (
                        <div className="space-y-2 pt-2 pl-3 border-l-2 border-teal-500">
                          {postReplies.map((rep) => (
                            <div
                              key={rep.id}
                              className="bg-white border border-teal-200/80 rounded-xl p-3 text-xs space-y-1"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-brand-800">{rep.authorName}</span>
                                  <span
                                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                                      rep.isOfficialVerified
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {rep.isOfficialVerified ? `✅ ${rep.authorRole} Xác Thực` : rep.authorRole}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400">{rep.createdAt}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">{rep.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveReplyPostId(isReplying ? null : post.id)}
                          className="text-xs font-extrabold text-teal-800 hover:text-brand-800 cursor-pointer"
                        >
                          {isReplying
                            ? '✕ Đóng khung trả lời'
                            : `💬 Trả lời câu hỏi này (${postReplies.length} phản hồi)`}
                        </button>
                      </div>

                      {isReplying && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-slate-600">Trả lời với vai trò:</span>
                            {(
                              [
                                'Thổ Địa / Porter',
                                'Chủ Cơ Sở Cấp 3',
                                'Admin Tà Xùa Trip',
                                'Thành Viên Đã Đi'
                              ] as const
                            ).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setReplyAuthorRole(r)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                  replyAuthorRole === r
                                    ? 'bg-brand-800 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={replyDraftText}
                              onChange={(e) => setReplyDraftText(e.target.value)}
                              placeholder="Nhập câu trả lời hoặc kinh nghiệm thực địa..."
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitForumReply(post.id)}
                              className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer shrink-0"
                            >
                              Gửi phản hồi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: HỆ SINH THÁI KÊNH CHÍNH THỨC, MÃ QR QUÉT NHANH & CHIA SẺ +30Đ
            (Đồng bộ 100% từ cấu hình Social Channels của Admin)
           ===================================================================== */}
        {activeMainTab === 'omnichannel_funnel' && (
          <div className="space-y-6">
            {/* Block 1: Official Admin Social & Hotline Ecosystem */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block">
                    DANH BẠ KÊNH CHÍNH CHỦ ĐÃ XÁC THỰC · ĐỒNG BỘ TỪ HỆ THỐNG ADMIN
                  </span>
                  <h2 className="text-xl font-extrabold text-brand-800 mt-0.5">
                    Bản Đồ Kênh Chính Thức Tà Xùa Trip (TikTok · Facebook · Zalo OA · Hotline 24/7)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                    Chỉ liên hệ, theo dõi lịch săn mây và đối soát đặt cọc qua các kênh chính thức bên dưới để được bảo vệ 100% quyền lợi và tránh các trang giả mạo lừa tiền cọc.
                  </p>
                </div>

                {/* Filter by Social Platform Group */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(
                    [
                      { id: 'all', label: `Tất cả (${activeSocialChannels.length})` },
                      { id: 'video_social', label: '🎵 TikTok & YouTube' },
                      { id: 'facebook', label: '📘 Fanpage & Group FB' },
                      { id: 'zalo', label: '💬 Zalo OA & Nhóm Zalo' },
                      { id: 'phone', label: '📞 Hotline & Cứu Hộ' }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSocialPlatformFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                        socialPlatformFilter === f.id
                          ? 'bg-brand-800 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Official Social Channels from Admin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSocialChannels
                  .filter((ch) => {
                    if (socialPlatformFilter === 'all') return true;
                    if (socialPlatformFilter === 'video_social') {
                      return ['tiktok', 'youtube', 'instagram'].includes(ch.platform);
                    }
                    if (socialPlatformFilter === 'facebook') {
                      return ['facebook_page', 'facebook_group'].includes(ch.platform);
                    }
                    if (socialPlatformFilter === 'zalo') {
                      return ['zalo_oa', 'zalo_group'].includes(ch.platform);
                    }
                    return ['phone_hotline', 'phone_sos'].includes(ch.platform);
                  })
                  .map((channel) => {
                    const platformMeta: Record<
                      SocialChannelConfig['platform'],
                      { iconLabel: string; badgeClass: string; btnLabel: string }
                    > = {
                      tiktok: {
                        iconLabel: '🎵 TikTok Official',
                        badgeClass: 'bg-slate-900 text-white border-slate-800',
                        btnLabel: 'Mở Kênh TikTok'
                      },
                      facebook_page: {
                        iconLabel: '📘 Facebook Fanpage',
                        badgeClass: 'bg-blue-600 text-white border-blue-500',
                        btnLabel: 'Mở Fanpage'
                      },
                      facebook_group: {
                        iconLabel: '👥 Group Facebook',
                        badgeClass: 'bg-indigo-600 text-white border-indigo-500',
                        btnLabel: 'Tham Gia Group FB'
                      },
                      zalo_oa: {
                        iconLabel: '💬 Zalo Official Account',
                        badgeClass: 'bg-sky-600 text-white border-sky-500',
                        btnLabel: 'Nhắn Zalo OA'
                      },
                      zalo_group: {
                        iconLabel: '🟢 Nhóm Zalo Săn Mây',
                        badgeClass: 'bg-teal-600 text-white border-teal-500',
                        btnLabel: 'Vào Nhóm Zalo'
                      },
                      phone_hotline: {
                        iconLabel: '📞 Hotline Đặt Chỗ',
                        badgeClass: 'bg-emerald-600 text-white border-emerald-500',
                        btnLabel: 'Gọi Hotline Ngay'
                      },
                      phone_sos: {
                        iconLabel: '🚨 Cứu Hộ Đèo 24/7',
                        badgeClass: 'bg-rose-600 text-white border-rose-500',
                        btnLabel: 'Gọi Cứu Hộ Khẩn'
                      },
                      youtube: {
                        iconLabel: '▶️ YouTube 4K',
                        badgeClass: 'bg-red-600 text-white border-red-500',
                        btnLabel: 'Xem Kênh YouTube'
                      },
                      instagram: {
                        iconLabel: '📸 Instagram',
                        badgeClass: 'bg-pink-600 text-white border-pink-500',
                        btnLabel: 'Mở Instagram'
                      }
                    };
                    const meta = platformMeta[channel.platform] || platformMeta.zalo_oa;

                    return (
                      <div
                        key={channel.id}
                        className="bg-slate-50 border border-slate-200 hover:border-brand-800/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${meta.badgeClass}`}
                            >
                              {meta.iconLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {channel.memberOrFollowerCount && (
                                <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                                  {channel.memberOrFollowerCount}
                                </span>
                              )}
                              {channel.isVerifiedOfficial && (
                                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  ✓ Chính chủ
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-brand-800">
                            {channel.title}
                          </h3>
                          <div className="text-xs font-mono font-bold text-teal-800">
                            ID / SĐT: {channel.handleOrNumber}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{channel.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <a
                              href={channel.url}
                              target={channel.url.startsWith('tel:') ? undefined : '_blank'}
                              rel="noopener noreferrer"
                              className="bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5"
                            >
                              <span>{meta.btnLabel}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(channel.handleOrNumber);
                                setCopiedChannelId(channel.id);
                                setTimeout(() => setCopiedChannelId(null), 2000);
                              }}
                              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedChannelId === channel.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Chép ID/SĐT</span>
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setQrPreviewChannel(
                                qrPreviewChannel?.id === channel.id ? null : channel
                              )
                            }
                            className="bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-extrabold text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã QR</span>
                          </button>
                        </div>

                        {qrPreviewChannel?.id === channel.id && (
                          <div className="bg-white border border-teal-300 rounded-2xl p-4 flex items-center gap-4">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                channel.url
                              )}`}
                              alt={`QR ${channel.title}`}
                              className="w-24 h-24 rounded-xl border border-slate-200 shrink-0"
                            />
                            <div className="space-y-1 text-xs">
                              <div className="font-extrabold text-brand-800">
                                Quét Mã QR Mở Nhanh Trên Điện Thoại
                              </div>
                              <p className="text-slate-600">
                                Mở Camera điện thoại hoặc ứng dụng Zalo/TikTok quét mã để truy cập thẳng vào{' '}
                                <strong>{channel.title}</strong>.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Block 2: Anti-Impersonation & Safe Booking Shield + Referral Share Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-amber-50 border border-amber-300 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <span>CẢNH BÁO CHỐNG GIẢ MẠO FANPAGE & LỪA ĐẢO TIỀN CỌC</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  3 Nguyên Tắc Vàng Khi Tương Tác Qua TikTok / Facebook / Zalo
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <li>
                    <strong>1. Kiểm tra đúng ID/SĐT chính thức:</strong> Mọi kênh TikTok, Fanpage, Zalo OA của Tà Xùa Trip đều được Admin niêm yết công khai tại bảng trên.
                  </li>
                  <li>
                    <strong>2. Không chuyển khoản cho tài khoản cá nhân lạ:</strong> Khi bình luận trên TikTok/Facebook, tuyệt đối cảnh giác với các nick lạ chủ động nhắn tin riêng báo "còn phòng giá rẻ" bắt chuyển cọc gấp.
                  </li>
                  <li>
                    <strong>3. Đối soát mã đặt chỗ tại Phòng #8 & #9:</strong> Mọi giao dịch đặt phòng/xe trên Tà Xùa Trip đều có Mã giữ chỗ VietQR và được lưu chuỗi băm bảo vệ trong <strong>Phòng Bằng Chứng</strong>.
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 bg-gradient-to-br from-brand-800 to-teal-900 text-white rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>CHIA SẺ CỘNG ĐỒNG · NHẬN NGAY +30 ĐIỂM MÂY</span>
                  </span>
                  <span className="text-xs font-bold bg-white/15 px-2.5 py-0.5 rounded-full">
                    Đổi Voucher tại cơ sở
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold">
                  Rủ Bạn Bè Cùng Lên Tà Xùa Qua Liên Kết Giới Thiệu Cá Nhân
                </h3>
                <p className="text-xs text-teal-100 leading-relaxed">
                  Chọn chuyên mục bạn muốn gửi cho nhóm bạn trên Zalo/Facebook/TikTok. Hệ thống tự động gắn mã giới thiệu để cộng Điểm Mây vào ví của bạn:
                </p>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      { id: 'san_may', label: '☁️ Bản tin Săn Mây' },
                      { id: 'ghep_chuyen', label: '🚗 Kèo Ghép Chuyến' },
                      { id: 'homestay_179', label: '🏡 Cơ sở trên Tà Xùa Trip' }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReferralTargetTopic(item.id)}
                      className={`py-2 px-2.5 rounded-xl font-bold cursor-pointer border text-center ${
                        referralTargetTopic === item.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950/50 border border-white/15 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-mono text-xs text-teal-200 truncate">
                    {referralShareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(referralShareUrl);
                      setCopiedReferral(true);
                      if (onEarnCloudPoints) {
                        onEarnCloudPoints(30, 'Chia sẻ liên kết cộng đồng cho bạn bè');
                      }
                      setTimeout(() => setCopiedReferral(false), 2500);
                    }}
                    className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedReferral ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedReferral ? 'Đã chép & +30 Điểm Mây!' : 'Sao chép Link (+30đ)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isPopupModal) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#F8FAFC] border border-slate-200 shadow-2xl">
          {hubContent}
        </div>
      </div>
    );
  }

  return hubContent;
};
