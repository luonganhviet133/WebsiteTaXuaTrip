import { DemoNotice } from './DemoNotice';
import React, { useState } from 'react';
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
  Building2,
  Lock,
  Bot,
  Database,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Gift,
  Tag,
  Award,
  Sparkles,
  Check,
  X,
  Search,
  Filter,
  Eye,
  Sliders,
  Layers,
  UploadCloud,
  Trash2,
  Edit3,
  MessageSquare,
  Globe,
  Compass,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Clock,
  MapPin,
  Utensils,
  Coffee,
  Bus,
  Bike,
  Plus,
  Image as ImageIcon,
  Save,
  QrCode,
  Copy,
  Phone,
  Share2
} from 'lucide-react';
import {
  Listing,
  VerificationTier,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting,
  PartnerClaimRequest,
  ServiceCategory,
  LocationArea,
  RoomType,
  MenuItem,
  ServicePackageItem,
  BusTrip,
  BusType,
  RouteStop,
  CloudLandmark,
  CloudHuntingForecast,
  CommunityPost,
  HeroBannerSlide,
  CuratedComboPackage,
  CuratedComboCategory,
  SectionBannerConfig,
  SocialChannelConfig,
  SocialChannelPlatform,
  SocialPlacement,
  AIChatbotConfig,
  KnowledgeFile,
  InteractionLog,
  SiteContentConfig,
  RevidApiGatewayConfig,
  RevidComplexityLevel,
  RevidPresetId,
  RevidModelCategory,
  RevidAsyncJobRecord,
  RevidApiCallLog
} from '../types/index.ts';
import {
  INITIAL_SITE_CONTENT,
  INITIAL_CURATED_COMBOS,
  CLOUD_LANDMARKS,
  CLOUD_FORECASTS,
  COMMUNITY_POSTS,
  BUS_TRIPS,
  INITIAL_REVID_GATEWAY_CONFIG,
  REVID_PRESET_PROFILES,
  REVID_MODELS_CATALOG
} from '../data/mockData.ts';
import { 
  formatVND, 
  maskSensitivePII, 
  computeMessageHash, 
  verifyEvidenceHashChain,
  getHomestayRoomSummary,
  verifyPaymentProofStatus,
  generateVehicleSeatLayout,
  buildCommunityUtmUrl
} from '../utils/rules.ts';
import { JarvisAdminAssistant } from './JarvisAdminAssistant.tsx';
import { AdminFeedbackPanel } from './AdminFeedbackPanel.tsx';
import { AdminMembersPanel } from './AdminMembersPanel.tsx';
import { AdminReconciliationPanel } from './AdminReconciliationPanel.tsx';
import { AdminCommunityPanel } from './AdminCommunityPanel.tsx';
import { isOpen as featureOpen } from '../config/features.ts';

interface AdminDashboardProps {
  listings: Listing[];
  onAddListing?: (newListing: Listing) => void | Promise<void>;
  /** Trả false khi server từ chối; khi đó không báo thành công. */
  onUpdateListing?: (updatedListing: Listing) => void | Promise<boolean>;
  onDeleteListing?: (listingId: string) => void;
  trips?: BusTrip[];
  onUpdateTrips?: React.Dispatch<React.SetStateAction<BusTrip[]>>;
  siteContent?: SiteContentConfig;
  onUpdateSiteContent?: (updated: SiteContentConfig) => void;
  landmarks?: CloudLandmark[];
  onUpdateLandmarks?: React.Dispatch<React.SetStateAction<CloudLandmark[]>>;
  forecasts?: CloudHuntingForecast[];
  onUpdateForecasts?: React.Dispatch<React.SetStateAction<CloudHuntingForecast[]>>;
  communityPosts?: CommunityPost[];
  onUpdateCommunityPosts?: React.Dispatch<React.SetStateAction<CommunityPost[]>>;
  billingEnabled: boolean;
  onToggleBilling: () => void;
  onUpdateTier: (listingId: string, newTier: VerificationTier) => void;
  onApproveListing: (listingId: string) => void;
  onRejectListing: (listingId: string) => void;
  disputes?: BookingDispute[];
  vouchers?: PromoVoucher[];
  onToggleVoucher?: (voucherId: string) => void;
  onAddVoucher?: (voucher: PromoVoucher) => void;
  rewardSettings?: ServiceRewardSetting[];
  onUpdateRewardPercent?: (listingId: string, percent: number) => void;
  claimRequests?: PartnerClaimRequest[];
  onApproveClaim?: (claimId: string) => void;
  onRejectClaim?: (claimId: string) => void;
  /** R2: không cho admin thao tác trên chính mình trong trang Thành viên. */
  currentUserId?: string;
}

const LOCATION_AREAS: LocationArea[] = [
  'Đỉnh Gió',
  'Sống Lưng Khủng Long',
  'Khe Cải',
  'Trung Tâm Tà Xùa',
  'Mống Vàng',
  'Thảo Nguyên',
  'Háng Đồng',
  'Bắc Yên'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  listings,
  onAddListing,
  onUpdateListing,
  onDeleteListing,
  trips: propTrips,
  onUpdateTrips,
  siteContent: propSiteContent,
  onUpdateSiteContent,
  landmarks: propLandmarks,
  onUpdateLandmarks,
  forecasts: propForecasts,
  onUpdateForecasts,
  communityPosts: propCommunityPosts,
  onUpdateCommunityPosts,
  billingEnabled,
  onToggleBilling,
  onUpdateTier,
  onApproveListing,
  onRejectListing,
  disputes = [],
  vouchers = [],
  onToggleVoucher,
  onAddVoucher,
  rewardSettings = [],
  onUpdateRewardPercent,
  claimRequests = [],
  onApproveClaim,
  onRejectClaim,
  currentUserId
}) => {

  // Admin Tab Switcher
  const [adminTab, setAdminTab] = useState<
    | 'members'
    | 'reconciliation'
    | 'fees_points'
    | 'jarvis_command'
    | 'smart_listings'
    | 'cms_content'
    | 'ai_studio'
    | 'revid_api_gateway'
    | 'disputes'
    | 'vouchers_rewards'
    | 'claims'
    | 'evidence_audit'
  >('members');

  // --- REVIDAPI GATEWAY MANAGEMENT STATE (https://revidapi.com/dashboard/docs) ---
  const [revidConfig, setRevidConfig] = useState<RevidApiGatewayConfig>(() => {
    try {
      const saved = localStorage.getItem('taxua_revid_gateway_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_REVID_GATEWAY_CONFIG;
  });

  const [revidSubSection, setRevidSubSection] = useState<
    'overview_keys' | 'presets_manual' | 'complexity_matrix' | 'models_catalog' | 'live_playground' | 'logs_limits'
  >('presets_manual');
  const [modelCategoryFilter, setModelCategoryFilter] = useState<'all' | RevidModelCategory>('all');
  const [newApiKeyLabel, setNewApiKeyLabel] = useState('');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');
  const [newApiKeyRole, setNewApiKeyRole] = useState<'primary' | 'backup' | 'media_studio'>('backup');
  const [pingStatus, setPingStatus] = useState<{
    loading: boolean;
    message: string | null;
    latencyMs?: number;
  }>({ loading: false, message: null });

  // Playground States
  const [playgroundPrompt, setPlaygroundPrompt] = useState(
    'Tư vấn lịch trình 2N1Đ cho 4 người đi từ Hà Nội lên Đỉnh Gió Tà Xùa cuối tuần này, ngân sách 1.800.000đ/người, muốn ở phòng view biển mây có đệm sưởi và thuê kèm 2 xe máy.'
  );
  const [playgroundSelectedModel, setPlaygroundSelectedModel] = useState('gpt-5.6-sol');
  const [playgroundUseAutoComplexity, setPlaygroundUseAutoComplexity] = useState(true);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<{
    endpoint: string;
    complexity: { level: RevidComplexityLevel; score: number; reason: string; recommendedModelId: string };
    modelUsed: string;
    provider: string;
    reply: string;
    latencyMs: number;
    usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; creditsCharged: number };
  } | null>(null);

  // Async Media Job Playground State (/v1/generate)
  const [mediaJobModel, setMediaJobModel] = useState('nano-banana-pro');
  const [mediaJobPrompt, setMediaJobPrompt] = useState(
    'Biển mây bình minh rực rỡ trên Đỉnh Gió Tà Xùa, homestay gỗ thông ấm áp, nắng sớm xuyên qua thung lũng mây, 2K cinematic'
  );
  const [mediaAspectRatio, setMediaAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [mediaResolution, setMediaResolution] = useState<'720p' | '1080p' | '2k'>('2k');
  const [isSubmittingMediaJob, setIsSubmittingMediaJob] = useState(false);

  const saveRevidConfig = (next: RevidApiGatewayConfig, toastMsg?: string) => {
    setRevidConfig(next);
    try {
      localStorage.setItem('taxua_revid_gateway_config', JSON.stringify(next));
    } catch {
      // ignore
    }
    if (toastMsg) {
      showAdminToast(toastMsg);
    }
  };

  const handleApplyRevidPreset = (presetId: RevidPresetId) => {
    const preset = REVID_PRESET_PROFILES.find((p) => p.id === presetId);
    if (!preset) return;

    const updatedRoutes = revidConfig.featureRoutes.map((route) => {
      const mapping = preset.levelMapping[route.complexityLevel];
      if (!mapping) return route;
      // Preserve specialized TTS / TikTok scraper models on L5 if applicable
      const isSpecialL5 =
        route.endpointPath === '/v1/text-to-speech' || route.endpointPath === '/v1/tiktok/download';
      return {
        ...route,
        primaryModelId: isSpecialL5 ? route.primaryModelId : mapping.primaryModelId,
        fallbackModelId: isSpecialL5 ? route.fallbackModelId : mapping.fallbackModelId,
        temperature: mapping.temperature,
        maxTokens: mapping.maxTokens,
        cacheReadEnabled: mapping.cacheReadEnabled
      };
    });

    saveRevidConfig(
      {
        ...revidConfig,
        setupMode: 'preset',
        activePresetId: presetId,
        featureRoutes: updatedRoutes
      },
      `✅ Đã kích hoạt "${preset.name}" và tự động gán model cho toàn bộ 5 cấp độ phức tạp (L1 → L5)!`
    );
  };

  const handlePingRevidGateway = async () => {
    setPingStatus({ loading: true, message: null });
    try {
      const token = localStorage.getItem('taxua_session_token') || '';
      const resp = await fetch('/api/revid/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({})
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        const errMsg = resp.status === 401
          ? 'Phiên đăng nhập quản trị đã hết hạn hoặc chưa đăng nhập (401).'
          : resp.status === 403
          ? 'Tài khoản không có quyền Quản trị viên (403).'
          : json.error || 'Kiểm tra kết nối thất bại.';
        setPingStatus({
          loading: false,
          message: errMsg,
          latencyMs: 0
        });
        showAdminToast(`❌ ${errMsg}`);
        return;
      }
      setPingStatus({
        loading: false,
        message: json.message || 'Đã kiểm tra kết nối thành công!',
        latencyMs: json.latencyMs || 115
      });
      showAdminToast(`⚡ Ping gateway thành công (${json.latencyMs || 115}ms)!`);
    } catch (err: any) {
      const errMsg = err?.message || 'Không thể kết nối tới server.';
      setPingStatus({
        loading: false,
        message: errMsg,
        latencyMs: 0
      });
      showAdminToast(`❌ ${errMsg}`);
    }
  };

  const handleRunPlaygroundChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundPrompt.trim()) return;
    setPlaygroundLoading(true);
    try {
      const token = localStorage.getItem('taxua_session_token') || '';
      const resp = await fetch('/api/revid/playground-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          modelId: playgroundSelectedModel,
          autoComplexity: playgroundUseAutoComplexity,
          prompt: playgroundPrompt
        })
      });
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        const errMsg = resp.status === 401
          ? 'Chưa đăng nhập hoặc phiên quản trị hết hạn (401).'
          : resp.status === 403
          ? 'Không có quyền Quản trị viên (403).'
          : json.error || 'Lỗi thực thi chat.';
        showAdminToast(`❌ ${errMsg}`);
        return;
      }
      if (json.success && json.data) {
        setPlaygroundResult(json.data);
        const newLog: RevidApiCallLog = {
          id: `call-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          featureName: 'Live Playground Test (/v1/chat/completions)',
          endpoint: 'POST /v1/chat/completions',
          complexityLevel: json.data.complexity.level,
          modelUsed: json.data.modelUsed,
          status: '200_ok',
          latencyMs: json.data.latencyMs,
          inputTokens: json.data.usage.inputTokens,
          outputTokens: json.data.usage.outputTokens,
          cacheReadTokens: json.data.usage.cacheReadTokens,
          creditsCharged: json.data.usage.creditsCharged,
          keyLabel: 'Primary Production Key'
        };
        saveRevidConfig({
          ...revidConfig,
          creditWallet: {
            ...revidConfig.creditWallet,
            balanceCredits: Number(
              Math.max(0, revidConfig.creditWallet.balanceCredits - json.data.usage.creditsCharged).toFixed(2)
            ),
            usedCreditsToday: Number(
              (revidConfig.creditWallet.usedCreditsToday + json.data.usage.creditsCharged).toFixed(2)
            )
          },
          callLogs: [newLog, ...revidConfig.callLogs]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const handleSubmitAsyncMediaJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaJobPrompt.trim()) return;
    setIsSubmittingMediaJob(true);
    const jobId = `job_revid_${Math.random().toString(36).slice(2, 8)}`;
    const isVideo = mediaJobModel === 'muse-video' || mediaJobModel === 'kling-3.0';
    const cost = isVideo ? 35 : 25;

    const initialJob: RevidAsyncJobRecord = {
      jobId,
      modelId: mediaJobModel,
      category: isVideo ? 'video' : 'image',
      promptOrInput: mediaJobPrompt,
      params: {
        aspect_ratio: mediaAspectRatio,
        resolution: mediaResolution,
        duration: isVideo ? '6s' : undefined
      },
      status: 'processing',
      progressPercent: 45,
      creditsCost: cost,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    const nextWithProcessing = {
      ...revidConfig,
      asyncJobs: [initialJob, ...revidConfig.asyncJobs]
    };
    saveRevidConfig(nextWithProcessing, `Bản demo: job ${jobId} chỉ được mô phỏng trên trình duyệt, chưa gửi tới RevidAPI.`);

    setTimeout(() => {
      const sampleImages = [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=80'
      ];
      const completedUrl = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      setRevidConfig((prev) => {
        const updated: RevidApiGatewayConfig = {
          ...prev,
          creditWallet: {
            ...prev.creditWallet,
            balanceCredits: Math.max(0, prev.creditWallet.balanceCredits - cost),
            usedCreditsToday: prev.creditWallet.usedCreditsToday + cost
          },
          asyncJobs: prev.asyncJobs.map((j) =>
            j.jobId === jobId
              ? {
                  ...j,
                  status: 'completed',
                  progressPercent: 100,
                  resultUrl: completedUrl,
                  completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
                }
              : j
          )
        };
        try {
          localStorage.setItem('taxua_revid_gateway_config', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setIsSubmittingMediaJob(false);
      showAdminToast(`Bản demo: job ${jobId} trả về một ảnh mẫu có sẵn, không phải ảnh do ${mediaJobModel} tạo.`);
    }, 1800);
  };

  // --- 1. SMART LISTINGS & DEEP SERVICE CONTROL STATE ---
  const [listingSearch, setListingSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedListingDetail, setSelectedListingDetail] = useState<Listing | null>(null);
  const [editingListingMode, setEditingListingMode] = useState<'profile' | 'service_features' | null>(null);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [adminActionFeedback, setAdminActionFeedback] = useState<string | null>(null);

  const showAdminToast = (msg: string) => {
    setAdminActionFeedback(msg);
    setTimeout(() => setAdminActionFeedback(null), 3500);
  };

  // Form tạo cơ sở mới của Admin
  const [newListingForm, setNewListingForm] = useState<{
    title: string;
    category: ServiceCategory;
    area: LocationArea;
    address: string;
    phone: string;
    minPrice: number;
    priceNote: string;
    coverImage: string;
    description: string;
    verificationTier: VerificationTier;
  }>({
    title: '',
    category: 'homestay',
    area: 'Đỉnh Gió',
    address: 'Khu Đỉnh Gió, Xã Tà Xùa, Bắc Yên, Sơn La',
    phone: '0981 234 567',
    minPrice: 550000,
    priceNote: 'Đã thẩm định thực địa bởi Admin Tà Xùa Trip',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: 'Cơ sở dịch vụ đạt chuẩn minh bạch giá và chất lượng tại Tà Xùa.',
    verificationTier: 2
  });

  // State tạm để thêm ảnh / phòng / món / gói dịch vụ trong Admin Deep Editor
  const [adminNewImageUrl, setAdminNewImageUrl] = useState('');
  const [adminNewCertText, setAdminNewCertText] = useState('');
  const [adminNewRoom, setAdminNewRoom] = useState<Partial<RoomType>>({
    name: '',
    capacity: 2,
    priceWeekday: 600000,
    priceWeekend: 800000,
    totalRooms: 4,
    availableRooms: 4,
    viewType: 'Biển mây tràn',
    viewDescription: 'View nhìn thẳng ra thung lũng mây Đỉnh Gió',
    hasWaterHeater: true,
    hasAirConditioner: true,
    hasHeaterMattress: true,
    hasPrivateBathroom: true
  });
  const [adminNewMenu, setAdminNewMenu] = useState<Partial<MenuItem>>({
    name: '',
    category: 'Món chính',
    price: 150000,
    unit: 'Phần',
    description: '',
    isBestSeller: false,
    isAvailable: true
  });
  const [adminNewPkg, setAdminNewPkg] = useState<Partial<ServicePackageItem>>({
    name: '',
    price: 150000,
    halfDayPrice: 75000,
    unit: 'ngày',
    totalQuantity: 10,
    availableQuantity: 10,
    description: '',
    isAvailable: true
  });

  // Đội xe khách cho Admin quản lý trực tiếp
  const [localTrips, setLocalTrips] = useState<BusTrip[]>(propTrips || BUS_TRIPS);
  React.useEffect(() => {
    if (propTrips) setLocalTrips(propTrips);
  }, [propTrips]);

  const updateTripsBoth = (updater: (prev: BusTrip[]) => BusTrip[]) => {
    setLocalTrips((prev) => {
      const next = updater(prev);
      if (onUpdateTrips) onUpdateTrips(next);
      return next;
    });
  };

  const [adminNewTrip, setAdminNewTrip] = useState({
    operatorName: '',
    busType: 'Giường nằm Cabin Đôi' as BusType,
    departureTime: '22:00',
    route: 'Hà Nội - Tà Xùa',
    baseFare: 400000,
    totalSeats: 24,
    phone: '0961 234 567'
  });
  const [adminNewStopName, setAdminNewStopName] = useState('');

  // --- 2. CMS CONTENT CONFIG STATE (Đồng bộ toàn bộ nội dung hiển thị trên website) ---
  const [cmsSubTab, setCmsSubTab] = useState<
    | 'hero_banners'
    | 'curated_combos'
    | 'emergency_alert'
    | 'section_banners'
    | 'cloud_landmarks'
    | 'weather_forecasts'
    | 'community_footer'
    | 'social_channels_utm'
  >('hero_banners');

  const [cmsConfig, setCmsConfig] = useState<SiteContentConfig>(propSiteContent || INITIAL_SITE_CONTENT);
  React.useEffect(() => {
    if (propSiteContent) setCmsConfig(propSiteContent);
  }, [propSiteContent]);

  // State cho Quản trị Kênh Social Đa Vị Trí & Chiến Dịch UTM trong Admin
  const [newSocialChannel, setNewSocialChannel] = useState<{
    platform: SocialChannelPlatform;
    title: string;
    handleOrNumber: string;
    url: string;
    description: string;
    memberOrFollowerCount: string;
    badgeText: string;
    placements: SocialPlacement[];
  }>({
    platform: 'tiktok',
    title: '',
    handleOrNumber: '',
    url: '',
    description: '',
    memberOrFollowerCount: '10.0K Thành viên',
    badgeText: 'Chính thức',
    placements: ['header', 'footer', 'community_hub']
  });

  const [adminUtmSource, setAdminUtmSource] = useState<
    'zalo_oa' | 'zalo_group' | 'fb_page' | 'fb_group' | 'tiktok' | 'qr_offline'
  >('tiktok');
  const [adminUtmCampaign, setAdminUtmCampaign] = useState('san_may_dinh_gio_t11');
  const [adminCopiedUtm, setAdminCopiedUtm] = useState(false);
  const [adminLaunchChecklist, setAdminLaunchChecklist] = useState([
    { id: 1, text: 'Đồng bộ tên thương hiệu cho TikTok, Fanpage, Group FB, Zalo OA & Hotline trên toàn Website', done: true },
    { id: 2, text: 'Niêm yết danh bạ Kênh Chính Chủ tại Popup Cộng Đồng (Phần 4) để chống giả mạo lừa cọc', done: true },
    { id: 3, text: 'Lập nhóm Zalo đối tác chung và các nhóm theo loại (homestay, nhà xe, xe ôm)', done: true },
    { id: 4, text: 'Gắn Link UTM lên Bio TikTok, bài ghim Fanpage & tin nhắn chào mừng Zalo OA', done: true },
    { id: 5, text: 'Tuyển 2–3 Moderator địa phương thường trực tại Tà Xùa (cam kết phản hồi < 1 giờ)', done: true },
    { id: 6, text: 'Dựng bản tin dự báo mây tự động lúc 06:00 sáng hằng ngày trên Zalo OA & Web', done: true },
    { id: 7, text: 'In tem QR dẫn về trang Cộng Đồng & tích Điểm Mây tại quầy 179 cơ sở homestay/nhà xe', done: false }
  ]);

  const [cmsLandmarks, setCmsLandmarks] = useState<CloudLandmark[]>(propLandmarks || CLOUD_LANDMARKS);
  React.useEffect(() => {
    if (propLandmarks) setCmsLandmarks(propLandmarks);
  }, [propLandmarks]);

  const [cmsForecasts, setCmsForecasts] = useState<CloudHuntingForecast[]>(propForecasts || CLOUD_FORECASTS);
  React.useEffect(() => {
    if (propForecasts) setCmsForecasts(propForecasts);
  }, [propForecasts]);

  const [cmsPosts, setCmsPosts] = useState<CommunityPost[]>(propCommunityPosts || COMMUNITY_POSTS);
  React.useEffect(() => {
    if (propCommunityPosts) setCmsPosts(propCommunityPosts);
  }, [propCommunityPosts]);

  const [cmsSaveFeedback, setCmsSaveFeedback] = useState<string | null>(null);

  // Form thêm mới trong CMS
  const [newHeroSlide, setNewHeroSlide] = useState<Partial<HeroBannerSlide>>({
    badgeText: '🔥 Điểm Nhấn Mới',
    title: '',
    subtitle: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ctaText: 'Khám phá ngay',
    targetTab: 'stay',
    isActive: true
  });

  const [newComboForm, setNewComboForm] = useState<Partial<CuratedComboPackage>>({
    title: '',
    badgeText: '👑 Admin Đề Xuất · Gói Đặc Biệt',
    category: 'combo_2n1d',
    duration: '2 Ngày 1 Đêm',
    area: 'Đỉnh Gió',
    comboPrice: 1250000,
    originalPrice: 1500000,
    unit: 'người',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    summary: '',
    linkedListingId: 'homestay-may',
    actionType: 'open_listing',
    priorityOrder: 1,
    isPinnedFeatured: true,
    isActive: true
  });
  const [newComboItemsText, setNewComboItemsText] = useState<string>(
    '🚌 Vé khứ hồi Xe Cabin Đôi / Limousine VIP\n🏡 01 đêm Bungalow Kính View Biển Mây\n🛵 Xe máy Wave/Blade mới giao tận Homestay'
  );

  const [newLandmarkForm, setNewLandmarkForm] = useState<Partial<CloudLandmark>>({
    name: '',
    area: 'Đỉnh Gió',
    altitude: '1.850m',
    cloudProbability: 85,
    bestTime: '05:30 - 07:30',
    roadCondition: 'Đường bê tông ô tô và xe máy đi tốt',
    distanceFromCenter: '3km từ trung tâm xã',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
  });

  const [newPostForm, setNewPostForm] = useState<Partial<CommunityPost>>({
    authorName: 'Ban Quản Trị Tà Xùa Trip',
    type: 'road_alert',
    title: '',
    content: '',
    imageUrl: '',
    contactPhone: '0981 119 115'
  });

  // --- 3. AI CHATBOT STUDIO STATE ---
  const [chatbots, setChatbots] = useState<AIChatbotConfig[]>([
    {
      id: 'bot-concierge',
      name: 'Concierge Khách Hàng (Tư vấn viên bản địa)',
      roleTitle: 'Chuyên gia săn mây & Trợ lý hành trình Tà Xùa',
      personaTone: 'friendly',
      systemPrompt: 'Bạn là hướng dẫn viên bản địa am hiểu sâu sắc thời tiết, điểm ngắm mây và homestay tại Tà Xùa. Luôn cung cấp thông tin trung thực, nhắc nhở an toàn đèo dốc và cảnh báo không chuyển cọc ngoài hệ thống.',
      temperature: 0.4,
      maxTokens: 1200,
      enabled: true,
      autoQuoteEnabled: true,
      hold30MinEnabled: true,
      maskPiiEnabled: true,
      blockInjectionEnabled: true,
      themeColor: '#0d9488',
      welcomeMessage: 'Chào bạn! Mình là Trợ lý Mây Tà Xùa. Bạn đang lên kế hoạch săn mây ngày nào để mình gợi ý homestay và xe khách tốt nhất nhé?',
      quickPrompts: [
        'Hôm nay xác suất săn mây ở Đỉnh Gió có cao không?',
        'Tư vấn homestay view mây có bình nóng lạnh và điều hòa 2 chiều',
        'Cách đặt combo xe khách kèm thuê xe máy tiết kiệm'
      ],
      knowledgeFileIds: ['kf-1', 'kf-2', 'kf-3']
    },
    {
      id: 'bot-partner',
      name: 'Trợ Lý Chủ Cơ Sở & Đối Tác',
      roleTitle: 'Trợ lý vận hành phòng ốc & Dịch thuật đa ngôn ngữ',
      personaTone: 'professional',
      systemPrompt: 'Hỗ trợ chủ homestay, nhà xe, quán cafe cập nhật số lượng phòng/chỗ, tính toán chi phí thuê xe theo mốc 12h trưa, và giải quyết khiếu nại cọc của khách hàng.',
      temperature: 0.3,
      maxTokens: 1000,
      enabled: true,
      autoQuoteEnabled: false,
      hold30MinEnabled: true,
      maskPiiEnabled: true,
      blockInjectionEnabled: true,
      themeColor: '#0284c7',
      welcomeMessage: 'Chào chủ cơ sở! Bạn muốn cập nhật phòng trống hôm nay hay kiểm tra bằng chứng chuyển khoản mới?',
      quickPrompts: [
        'Cập nhật phòng đôi hôm nay còn 2 phòng',
        'Cách tính tiền xe máy trả trước 12h trưa hôm sau',
        'Hướng dẫn đối soát biên lai chuyển khoản của khách'
      ],
      knowledgeFileIds: ['kf-1', 'kf-4']
    },
    {
      id: 'bot-mod',
      name: 'Bot Kiểm Duyệt An Toàn & Chống Lừa Đảo',
      roleTitle: 'Hệ thống radar bảo vệ giao dịch & Chặn lừa đảo cọc',
      personaTone: 'concise',
      systemPrompt: 'Tự động quét tin nhắn 24/7. Phát hiện các hành vi dụ dỗ khách chuyển khoản vào tài khoản cá nhân ngoài hệ thống, che PII và gắn cờ cảnh báo rủi ro.',
      temperature: 0.1,
      maxTokens: 500,
      enabled: true,
      autoQuoteEnabled: false,
      hold30MinEnabled: false,
      maskPiiEnabled: true,
      blockInjectionEnabled: true,
      themeColor: '#e11d48',
      welcomeMessage: 'Radar giám sát đang chạy ngầm trên toàn bộ 9 không gian chat.',
      quickPrompts: [],
      knowledgeFileIds: ['kf-4']
    }
  ]);

  const [selectedBotId, setSelectedBotId] = useState<string>('bot-concierge');
  const activeBot = chatbots.find((b) => b.id === selectedBotId) || chatbots[0];

  // Knowledge Files State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([
    {
      id: 'kf-1',
      title: 'Cẩm nang giao thông & lái xe đèo dốc Tà Xùa an toàn',
      fileName: 'huong-dan-lai-xe-deo-ta-xua.md',
      content: 'Cẩm nang an toàn đường đèo Bắc Yên lên Tà Xùa. Các khúc cua tay áo và số điện thoại cứu hộ.',
      fileType: 'md',
      fileSize: '45 KB',
      summary: 'Các đoạn cua tay áo nguy hiểm, kinh nghiệm đi xe ga/xe số, số cứu hộ giao thông Bắc Yên 24/7',
      uploadedAt: '2026-11-01',
      updatedAt: '2026-11-01',
      isActive: true
    },
    {
      id: 'kf-2',
      title: 'Khí tượng & Kinh nghiệm đón bình minh săn mây Đỉnh Gió',
      fileName: 'khi-tuong-san-may.txt',
      content: 'Dự báo khí tượng và thời điểm bình minh săn mây thung lũng Tà Xùa.',
      fileType: 'txt',
      fileSize: '28 KB',
      summary: 'Mối tương quan giữa độ ẩm >85%, gió nhẹ <15km/h và chênh lệch nhiệt ngày đêm để tạo biển mây',
      uploadedAt: '2026-11-03',
      updatedAt: '2026-11-03',
      isActive: true
    },
    {
      id: 'kf-3',
      title: 'Quy chuẩn phòng lưu trú Homestay vùng cao đạt chuẩn',
      fileName: 'quy-chuan-homestay-ta-xua.md',
      content: 'Tiêu chuẩn tiện nghi: bình nóng lạnh, đệm điện sưởi, điều hòa 2 chiều và vệ sinh khép kín.',
      fileType: 'md',
      fileSize: '62 KB',
      summary: 'Yêu cầu bình nóng lạnh 30L hoạt động mùa đông, đệm sưởi điện an toàn, điều hòa 2 chiều và vệ sinh khép kín',
      uploadedAt: '2026-11-05',
      updatedAt: '2026-11-05',
      isActive: true
    },
    {
      id: 'kf-4',
      title: 'Chính sách bảo vệ cọc 2 chiều & Quy trình xử lý khiếu nại',
      fileName: 'chinh-sach-bao-ve-coc.md',
      content: 'Chính sách bảo vệ cọc 2 chiều, giữ chỗ 30 phút và quy trình trọng tài đối soát.',
      fileType: 'md',
      fileSize: '34 KB',
      summary: 'Quy định giữ chỗ 30 phút, đối soát ảnh biên lai VietQR, hoàn tiền 100% nếu cơ sở gian lận hình ảnh',
      uploadedAt: '2026-11-08',
      updatedAt: '2026-11-08',
      isActive: true
    }
  ]);

  // Modal thêm Knowledge File
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileSummary, setNewFileSummary] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  // Interaction Monitoring Logs State
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([
    {
      id: 'log-1',
      channel: 'direct_chat',
      senderName: 'Lê Thuỳ Dung (Khách)',
      recipientName: 'Mây Mù Homestay (Chủ nhà)',
      messagePreview: 'Mình đã chuyển khoản cọc 450.000đ qua VietQR và nộp ảnh biên lai trên hệ thống rồi nhé!',
      timestamp: '2026-11-11 14:32',
      isFlaggedScam: false,
      hashDigest: 'sha256-8a9b2c3d...',
      status: 'safe'
    },
    {
      id: 'log-2',
      channel: 'community',
      senderName: 'Người dùng ẩn danh 88',
      recipientName: 'Kênh Hỏi Đáp Săn Mây',
      messagePreview: 'Phòng bên em còn rẻ lắm, nhắn Zalo riêng số 0912xxx để cọc gấp vào số tài khoản này...',
      timestamp: '2026-11-11 13:15',
      isFlaggedScam: true,
      flagReason: 'Phát hiện rủ rê giao dịch ngoài sàn, nguy cơ gian lận cọc!',
      hashDigest: 'sha256-f4e1d2c0...',
      status: 'flagged'
    },
    {
      id: 'log-3',
      channel: 'ai_concierge',
      senderName: 'Trần Văn Mạnh (Khách)',
      recipientName: 'AI Concierge',
      messagePreview: 'Cho mình xin lộ trình xe khách đêm đi Tà Xùa và đón ở Cầu Giấy được không?',
      timestamp: '2026-11-11 12:45',
      isFlaggedScam: false,
      hashDigest: 'sha256-1122aabb...',
      status: 'safe'
    }
  ]);

  // Section 4.6: Admin Evidence Chat Access Audit Log State
  const [ticketIdInput, setTicketIdInput] = useState('TK-409');
  const [accessReasonInput, setAccessReasonInput] = useState('');
  const [unlockedEvidence, setUnlockedEvidence] = useState(false);
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-101',
      actor: 'admin_cskh_01',
      ticketId: 'TK-409',
      object: 'conversation:space-evidence-dm (seq #1..#3)',
      reason: 'Kiểm tra biên lai chuyển khoản và thẻ báo giá theo yêu cầu đối soát của khách',
      timestamp: '2026-11-11 08:30:12'
    }
  ]);

  // Filter listings (hỗ trợ lọc riêng các cơ sở đang được Admin ghim ưu tiên Đề Xuất)
  const filteredListings = listings
    .filter((l) => {
      const matchesSearch =
        !listingSearch.trim() ||
        l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
        l.phone.includes(listingSearch) ||
        l.area.toLowerCase().includes(listingSearch.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter;
      const matchesTier = tierFilter === 'all' || String(l.verificationTier) === tierFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'featured' && Boolean(l.isAdminFeatured)) ||
        (statusFilter === 'claimed' && l.claimedByOwner) ||
        (statusFilter === 'approved' && l.status === 'approved') ||
        (statusFilter === 'pending' && l.status === 'pending');

      return matchesSearch && matchesCategory && matchesTier && matchesStatus;
    })
    .sort((a, b) => {
      const featA = a.isAdminFeatured ? 1 : 0;
      const featB = b.isAdminFeatured ? 1 : 0;
      if (featA !== featB) return featB - featA;
      if (featA && featB) {
        const rDiff = (b.adminPriorityRank || 0) - (a.adminPriorityRank || 0);
        if (rDiff !== 0) return rDiff;
      }
      return b.verificationTier - a.verificationTier;
    });

  const handleCreateKnowledgeFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle.trim()) return;

    const newKf: KnowledgeFile = {
      id: `kf-${Date.now()}`,
      title: newFileTitle.trim(),
      fileName: `${newFileTitle.toLowerCase().replace(/\s+/g, '-')}.md`,
      content: newFileContent || newFileSummary || 'Nội dung tài liệu',
      fileType: 'md',
      fileSize: '32 KB',
      summary: newFileSummary || 'Tài liệu kiến thức mới được tải lên hệ thống RAG',
      uploadedAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      isActive: true
    };

    setKnowledgeFiles((prev) => [newKf, ...prev]);
    setIsAddingKnowledge(false);
    setNewFileTitle('');
    setNewFileSummary('');
    setNewFileContent('');
  };

  const handleSaveBotConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSaveFeedback(`✅ Đã lưu cấu hình Chatbot "${activeBot.name}" thành công!`);
    setTimeout(() => setCmsSaveFeedback(null), 3000);
  };

  const handleSaveCmsConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateSiteContent) onUpdateSiteContent(cmsConfig);
    if (onUpdateLandmarks) onUpdateLandmarks(cmsLandmarks);
    if (onUpdateForecasts) onUpdateForecasts(cmsForecasts);
    if (onUpdateCommunityPosts) onUpdateCommunityPosts(cmsPosts);
    setCmsSaveFeedback('✅ Đã lưu và đồng bộ toàn bộ nội dung & hình ảnh CMS ra ngoài Website!');
    setTimeout(() => setCmsSaveFeedback(null), 3500);
  };

  const commitListingUpdate = async (updated: Listing, msg = '✅ Đã cập nhật cơ sở dịch vụ thành công!') => {
    setSelectedListingDetail(updated);
    if (onUpdateListing) {
      const ok = await onUpdateListing({
        ...updated,
        updatedCalendarDate: new Date().toISOString().slice(0, 10)
      });
      if (ok === false) return;
    }
    showAdminToast(msg);
  };

  const handleCreateNewListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingForm.title.trim()) return;
    const created: Listing = {
      id: `tx-${newListingForm.category}-${Date.now()}`,
      title: newListingForm.title.trim(),
      category: newListingForm.category,
      area: newListingForm.area,
      address: newListingForm.address,
      phone: newListingForm.phone,
      zalo: newListingForm.phone.replace(/\s+/g, ''),
      rating: 4.9,
      reviewCount: 1,
      hasCloudView: true,
      minPrice: Number(newListingForm.minPrice) || 350000,
      priceNote: newListingForm.priceNote,
      description: newListingForm.description,
      coverImage: newListingForm.coverImage,
      images: [newListingForm.coverImage],
      verificationTier: newListingForm.verificationTier,
      updatedCalendarDate: new Date().toISOString().slice(0, 10),
      isInstantBooking: true,
      tags: [newListingForm.area, 'Đã thẩm định'],
      status: 'approved',
      partnerId: `partner-${Date.now()}`,
      claimedByOwner: true,
      coordinates: { lat: 21.325, lng: 104.475 },
      stats: { views: 100, callClicks: 10, bookingsCount: 2 },
      roomTypes:
        newListingForm.category === 'homestay'
          ? [
              {
                id: `rm-${Date.now()}`,
                name: 'Phòng Tiêu Chuẩn View Mây',
                capacity: 2,
                priceWeekday: Number(newListingForm.minPrice) || 550000,
                priceWeekend: Math.round((Number(newListingForm.minPrice) || 550000) * 1.25),
                totalRooms: 4,
                availableRooms: 4,
                viewType: 'Biển mây tràn',
                viewDescription: 'View nhìn thẳng ra thung lũng mây',
                hasWaterHeater: true,
                hasAirConditioner: true,
                hasHeaterMattress: true,
                hasPrivateBathroom: true,
                amenities: ['Bình nóng lạnh', 'Điều hòa 2 chiều', 'Đệm sưởi', 'Vệ sinh khép kín']
              }
            ]
          : undefined,
      openingHours:
        newListingForm.category === 'restaurant' || newListingForm.category === 'coffee'
          ? {
              openTime: '06:00',
              closeTime: '22:00',
              closedDaysNote: 'Mở cửa tất cả các ngày trong tuần',
              serviceNote: 'Phục vụ đặc sản bản địa nóng hổi'
            }
          : undefined,
      menuItems:
        newListingForm.category === 'restaurant' || newListingForm.category === 'coffee'
          ? [
              {
                id: `mn-${Date.now()}`,
                name: newListingForm.category === 'coffee' ? 'Cà Phê Muối Săn Mây' : 'Lẩu Gà Đen H’Mông',
                category: newListingForm.category === 'coffee' ? 'Đồ uống' : 'Món chính',
                price: Number(newListingForm.minPrice) || 55000,
                unit: newListingForm.category === 'coffee' ? 'Ly' : 'Nồi',
                isBestSeller: true,
                isAvailable: true
              }
            ]
          : undefined,
      servicePackages:
        !['homestay', 'bus', 'restaurant', 'coffee'].includes(newListingForm.category)
          ? [
              {
                id: `pkg-${Date.now()}`,
                name: `Gói Dịch Vụ Tiêu Chuẩn - ${newListingForm.title.trim()}`,
                price: Number(newListingForm.minPrice) || 150000,
                halfDayPrice: newListingForm.category === 'motorbike' ? 75000 : undefined,
                unit: newListingForm.category === 'motorbike' ? 'ngày' : 'gói',
                totalQuantity: 10,
                availableQuantity: 10,
                description: newListingForm.priceNote,
                isAvailable: true
              }
            ]
          : undefined
    };

    if (onAddListing) {
      // Server cấp ID mới; không mở bản tạm phía trình duyệt để tránh sửa nhầm ID chưa tồn tại.
      void onAddListing(created);
    }
    setIsCreatingListing(false);
    setSelectedListingDetail(null);
    setEditingListingMode('service_features');
    setNewListingForm({
      ...newListingForm,
      title: ''
    });
    showAdminToast(`✅ Đã thêm cơ sở mới "${created.title}" vào hệ thống!`);
  };

  return (
    <div className="bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-white min-h-[850px]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* R4: tiêu đề gọn, không số liệu giả, không công tắc thu phí chỉ đổi trong trình duyệt */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quản trị Tà Xùa Trip</h1>
          <p className="text-sm text-slate-400 mt-1">Thành viên, cơ sở, đơn đặt, đối soát, khiếu nại và nội dung trang.</p>
        </div>

        {/* CỤM ĐIỀU HƯỚNG SUB-TABS ADMIN */}
        <div className="bg-slate-850 border border-slate-750 p-2 rounded-2xl flex flex-wrap gap-2">
          {[
            { id: 'members', label: 'Thành viên & Đối tác', icon: Users },
            { id: 'smart_listings', label: `Cơ sở & dịch vụ (${listings.length})`, icon: Building2 },
            { id: 'claims', label: `Duyệt chính chủ (${claimRequests.length})`, icon: ShieldCheck },
            { id: 'reconciliation', label: 'Đối soát cọc', icon: Scale },
            { id: 'fees_points', label: 'Phí nền tảng & Điểm Mây', icon: Gift },
            { id: 'disputes', label: `Khiếu nại & đánh giá (${disputes.filter((d) => d.status === 'opening' || d.status === 'investigating').length} mở)`, icon: Scale },
            { id: 'vouchers_rewards', label: `Voucher (${vouchers.length})`, icon: Gift },
            { id: 'cms_content', label: 'Nội dung trang & kênh liên hệ', icon: Globe },
            { id: 'evidence_audit', label: 'Kiểm toán bằng chứng', icon: Lock },
            ...(featureOpen('adminAssistant') ? [{ id: 'jarvis_command', label: 'Trợ lý J.A.R.V.I.S.', icon: Sparkles }] : []),
            ...(featureOpen('aiGateway')
              ? [
                  { id: 'ai_studio', label: 'AI Chatbot Studio', icon: Bot },
                  { id: 'revid_api_gateway', label: 'Cổng RevidAPI', icon: Layers },
                ]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 font-black'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {adminActionFeedback && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between">
            <span>{adminActionFeedback}</span>
            <button type="button" onClick={() => setAdminActionFeedback(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================
            TAB 0: SIÊU TRỢ LÝ ĐIỀU HÀNH J.A.R.V.I.S. (ĐỘC QUYỀN ADMIN)
           ======================================================== */}
        {adminTab === 'members' && <AdminMembersPanel currentUserId={currentUserId} />}
        {adminTab === 'reconciliation' && <AdminReconciliationPanel />}
        {adminTab === 'fees_points' && <AdminCommunityPanel listings={listings.map((l) => ({ id: l.id, title: l.title }))} />}

        {adminTab === 'jarvis_command' && featureOpen('adminAssistant') && (
          <JarvisAdminAssistant
            listings={listings}
            disputes={disputes}
            claimRequests={claimRequests}
            vouchers={vouchers}
            forecasts={cmsForecasts}
            siteContent={cmsConfig}
            billingEnabled={billingEnabled}
            revidConfig={revidConfig}
            onUpdateTier={onUpdateTier}
            onUpdateListing={onUpdateListing}
            onApproveClaim={onApproveClaim}
            onUpdateSiteContent={(updated) => {
              setCmsConfig(updated);
              if (onUpdateSiteContent) onUpdateSiteContent(updated);
            }}
            onUpdateForecasts={(updater) => {
              setCmsForecasts(updater);
              if (onUpdateForecasts) onUpdateForecasts(updater);
            }}
            onAddVoucher={onAddVoucher}
            onToggleBilling={onToggleBilling}
            onApplyRevidPreset={handleApplyRevidPreset}
            onJumpToAdminTab={(tabId) => setAdminTab(tabId as any)}
          />
        )}

        {/* ========================================================
            TAB 1: QUẢN TRỊ CƠ SỞ & KIỂM SOÁT SÂU TÍNH NĂNG CÁC BÊN DỊCH VỤ
           ======================================================== */}
        {adminTab === 'smart_listings' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <span>Quản Trị Toàn Quyền Cơ Sở & Tính Năng Chuyên Biệt Từng Ngành Dịch Vụ</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin có toàn quyền Thêm mới / Sửa thông tin & ảnh / Xóa cơ sở, đồng thời kiểm soát sâu phòng Homestay, đội xe & sơ đồ ghế, menu Quán ăn/Cafe và gói dịch vụ.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Hiển thị: <strong className="text-teal-300">{filteredListings.length}/{listings.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingListing(!isCreatingListing)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Cơ Sở Dịch Vụ Mới</span>
                </button>
              </div>
            </div>

            {/* FORM THÊM CƠ SỞ MỚI DO ADMIN TẠO */}
            {isCreatingListing && (
              <form onSubmit={handleCreateNewListing} className="bg-slate-900 border border-teal-500/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide">
                    Thêm Cơ Sở Dịch Vụ Mới Vào Hệ Thống
                  </span>
                  <button type="button" onClick={() => setIsCreatingListing(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-300 block mb-1">Tên cơ sở dịch vụ *</label>
                    <input
                      type="text"
                      value={newListingForm.title}
                      onChange={(e) => setNewListingForm({ ...newListingForm, title: e.target.value })}
                      placeholder="VD: Mây Đỉnh Gió Homestay / Nhà Xe Săn Mây VIP..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Ngành dịch vụ *</label>
                    <select
                      value={newListingForm.category}
                      onChange={(e) => setNewListingForm({ ...newListingForm, category: e.target.value as ServiceCategory })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="homestay">Homestay & Nghỉ dưỡng</option>
                      <option value="bus">Nhà xe khách & Xe máy kèm</option>
                      <option value="restaurant">Nhà hàng / Quán ăn</option>
                      <option value="coffee">Quán Cà phê săn mây</option>
                      <option value="motorbike">Cho thuê xe máy</option>
                      <option value="taxi">Taxi / Xe bản địa</option>
                      <option value="tour">Tour Trekking</option>
                      <option value="photo">Photographer</option>
                      <option value="costume">Thuê trang phục</option>
                      <option value="camera">Thuê máy ảnh / Flycam</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Khu vực *</label>
                    <select
                      value={newListingForm.area}
                      onChange={(e) => setNewListingForm({ ...newListingForm, area: e.target.value as LocationArea })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {LOCATION_AREAS.map((ar) => (
                        <option key={ar} value={ar}>
                          {ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Hotline / Zalo *</label>
                    <input
                      type="text"
                      value={newListingForm.phone}
                      onChange={(e) => setNewListingForm({ ...newListingForm, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Giá từ (VNĐ) *</label>
                    <input
                      type="number"
                      step="10000"
                      value={newListingForm.minPrice}
                      onChange={(e) => setNewListingForm({ ...newListingForm, minPrice: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Huy hiệu khởi tạo</label>
                    <select
                      value={newListingForm.verificationTier}
                      onChange={(e) =>
                        setNewListingForm({ ...newListingForm, verificationTier: Number(e.target.value) as VerificationTier })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value={1}>Cấp 1 - Cơ bản</option>
                      <option value={2}>Cấp 2 - Xác thực giấy phép</option>
                      <option value={3}>Cấp 3 - Thẩm định thực địa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Địa chỉ chi tiết</label>
                    <input
                      type="text"
                      value={newListingForm.address}
                      onChange={(e) => setNewListingForm({ ...newListingForm, address: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">URL Ảnh đại diện (Cover Image) *</label>
                    <input
                      type="text"
                      value={newListingForm.coverImage}
                      onChange={(e) => setNewListingForm({ ...newListingForm, coverImage: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Ghi chú giá / Ưu đãi</label>
                    <input
                      type="text"
                      value={newListingForm.priceNote}
                      onChange={(e) => setNewListingForm({ ...newListingForm, priceNote: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Mô tả chi tiết cơ sở</label>
                  <textarea
                    rows={2}
                    value={newListingForm.description}
                    onChange={(e) => setNewListingForm({ ...newListingForm, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingListing(false)}
                    className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
                  >
                    Tạo Cơ Sở Mới & Cấu Hình Dịch Vụ
                  </button>
                </div>
              </form>
            )}

            {/* Bộ Lọc Đa Chiều Thông Minh */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-750">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Tìm tên cơ sở, hotline, khu vực..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">Tất cả ngành dịch vụ</option>
                  <option value="homestay">Homestay & Nghỉ dưỡng</option>
                  <option value="bus">Xe khách Hà Nội - Tà Xùa</option>
                  <option value="taxi">Taxi & Xe ôm bản địa</option>
                  <option value="motorbike">Cho thuê xe máy</option>
                  <option value="restaurant">Quán ăn & Lẩu nướng</option>
                  <option value="coffee">Cà phê săn mây</option>
                  <option value="tour">Tour Trekking Sống Lưng</option>
                  <option value="photo">Photographer săn mây</option>
                  <option value="costume">Thuê trang phục Mông/Boho</option>
                  <option value="camera">Thuê máy ảnh & Flycam</option>
                </select>
              </div>

              <div>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">Tất cả cấp huy hiệu</option>
                  <option value="1">Cấp 1 - Cơ bản</option>
                  <option value="2">Cấp 2 - Xác thực giấy phép</option>
                  <option value="3">Cấp 3 - Đối tác sáng lập</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="featured">👑 Đang ghim ưu tiên Đề Xuất</option>
                  <option value="claimed">Đã có chủ chính thức</option>
                  <option value="approved">Đã duyệt hiển thị</option>
                  <option value="pending">Chờ kiểm duyệt</option>
                </select>
              </div>
            </div>

            {/* BẢNG ĐIỀU KHIỂN CHUYÊN SÂU KHI ADMIN CHỌN 1 CƠ SỞ ĐỂ SỬA HỒ SƠ HOẶC QUẢN TRỊ DỊCH VỤ */}
            {selectedListingDetail && editingListingMode && (
              <div className="bg-slate-900 border-2 border-teal-500/60 rounded-3xl p-6 space-y-5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedListingDetail.coverImage}
                      alt={selectedListingDetail.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-teal-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Admin Đang Kiểm Soát: {selectedListingDetail.category.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">ID: {selectedListingDetail.id}</span>
                      </div>
                      <h4 className="text-lg font-black text-white mt-0.5">{selectedListingDetail.title}</h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingListingMode('profile')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        editingListingMode === 'profile'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      ✏️ 1. Sửa Thông Tin & Thư Viện Ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingListingMode('service_features')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                        editingListingMode === 'service_features'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      ⚙️ 2. Quản Trị Tính Năng Dịch Vụ ({selectedListingDetail.category.toUpperCase()})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListingDetail(null);
                        setEditingListingMode(null);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>

                {/* MODE 1: ADMIN SỬA THÔNG TIN HỒ SƠ, ẢNH ĐẠI DIỆN, THƯ VIỆN ẢNH & CHỨNG NHẬN */}
                {editingListingMode === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300 block mb-1">Tên cơ sở dịch vụ</label>
                        <input
                          type="text"
                          value={selectedListingDetail.title}
                          onChange={(e) => setSelectedListingDetail({ ...selectedListingDetail, title: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Ngành dịch vụ</label>
                        <select
                          value={selectedListingDetail.category}
                          onChange={(e) =>
                            setSelectedListingDetail({
                              ...selectedListingDetail,
                              category: e.target.value as ServiceCategory
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          <option value="homestay">Homestay & Nghỉ dưỡng</option>
                          <option value="bus">Nhà xe khách & Xe máy kèm</option>
                          <option value="restaurant">Nhà hàng / Quán ăn</option>
                          <option value="coffee">Quán Cà phê săn mây</option>
                          <option value="motorbike">Cho thuê xe máy</option>
                          <option value="taxi">Taxi / Xe bản địa</option>
                          <option value="tour">Tour Trekking</option>
                          <option value="photo">Photographer</option>
                          <option value="costume">Thuê trang phục</option>
                          <option value="camera">Thuê máy ảnh / Flycam</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Khu vực</label>
                        <select
                          value={selectedListingDetail.area}
                          onChange={(e) =>
                            setSelectedListingDetail({ ...selectedListingDetail, area: e.target.value as LocationArea })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        >
                          {LOCATION_AREAS.map((ar) => (
                            <option key={ar} value={ar}>
                              {ar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Hotline</label>
                        <input
                          type="text"
                          value={selectedListingDetail.phone}
                          onChange={(e) =>
                            setSelectedListingDetail({
                              ...selectedListingDetail,
                              phone: e.target.value,
                              zalo: e.target.value
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Giá từ (VNĐ)</label>
                        <input
                          type="number"
                          step="10000"
                          value={selectedListingDetail.minPrice}
                          onChange={(e) =>
                            setSelectedListingDetail({ ...selectedListingDetail, minPrice: Number(e.target.value) })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Địa chỉ</label>
                        <input
                          type="text"
                          value={selectedListingDetail.address}
                          onChange={(e) =>
                            setSelectedListingDetail({ ...selectedListingDetail, address: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Mô tả chi tiết cơ sở</label>
                      <textarea
                        rows={3}
                        value={selectedListingDetail.description}
                        onChange={(e) =>
                          setSelectedListingDetail({ ...selectedListingDetail, description: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Ảnh đại diện (Cover Image URL)</label>
                        <input
                          type="text"
                          value={selectedListingDetail.coverImage}
                          onChange={(e) =>
                            setSelectedListingDetail({ ...selectedListingDetail, coverImage: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Ghi chú giá (`priceNote`)</label>
                        <input
                          type="text"
                          value={selectedListingDetail.priceNote || ''}
                          onChange={(e) =>
                            setSelectedListingDetail({ ...selectedListingDetail, priceNote: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Quản lý Thư viện Ảnh của cơ sở */}
                    <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-teal-300">
                          Thư Viện Ảnh Cơ Sở ({(selectedListingDetail.images || []).length} ảnh)
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={adminNewImageUrl}
                            onChange={(e) => setAdminNewImageUrl(e.target.value)}
                            placeholder="Dán link ảnh mới..."
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-64"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!adminNewImageUrl.trim()) return;
                              setSelectedListingDetail({
                                ...selectedListingDetail,
                                images: [...(selectedListingDetail.images || []), adminNewImageUrl.trim()]
                              });
                              setAdminNewImageUrl('');
                            }}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            + Thêm Ảnh
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {(selectedListingDetail.images || []).map((img, idx) => (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700">
                            <img src={img} alt="" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedListingDetail({
                                  ...selectedListingDetail,
                                  images: (selectedListingDetail.images || []).filter((_, i) => i !== idx)
                                })
                              }
                              className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-lg text-xs cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CƠ CHẾ ADMIN GHIM ƯU TIÊN ĐỀ XUẤT ĐẦU TRANG (ADMIN PRIORITY BOOST) */}
                    <div className="bg-amber-950/25 p-4 rounded-2xl border border-amber-500/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                            <span>👑 Cơ Chế Ghim Ưu Tiên Đề Xuất Đầu Trang (Admin Priority Boost)</span>
                          </span>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Cơ sở được ghim sẽ luôn hiển thị đầu tiên trên trang Khám Phá, Lưu Trú, Di Chuyển kèm huy hiệu nổi bật.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedListingDetail({
                              ...selectedListingDetail,
                              isAdminFeatured: !selectedListingDetail.isAdminFeatured,
                              adminPriorityRank: selectedListingDetail.adminPriorityRank || 10,
                              adminFeaturedLabel:
                                selectedListingDetail.adminFeaturedLabel || '👑 Admin Đề Xuất #1'
                            })
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                            selectedListingDetail.isAdminFeatured
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-amber-400/50'
                          }`}
                        >
                          {selectedListingDetail.isAdminFeatured ? '✓ Đang Ghim Ưu Tiên Đầu Trang' : '+ Bật Ghim Ưu Tiên Cơ Sở Này'}
                        </button>
                      </div>

                      {selectedListingDetail.isAdminFeatured && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
                          <div>
                            <label className="text-xs text-amber-200 font-bold block mb-1">
                              Thứ tự ưu tiên (Số càng nhỏ càng đứng đầu: 1 = Top 1)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={selectedListingDetail.adminPriorityRank ?? 10}
                              onChange={(e) =>
                                setSelectedListingDetail({
                                  ...selectedListingDetail,
                                  adminPriorityRank: Math.max(1, Number(e.target.value) || 1)
                                })
                              }
                              className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-extrabold text-amber-300"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-amber-200 font-bold block mb-1">
                              Nhãn Huy Hiệu Đề Xuất Hiển Thị Trên Thẻ Cơ Sở
                            </label>
                            <input
                              type="text"
                              value={selectedListingDetail.adminFeaturedLabel || ''}
                              onChange={(e) =>
                                setSelectedListingDetail({
                                  ...selectedListingDetail,
                                  adminFeaturedLabel: e.target.value
                                })
                              }
                              placeholder="VD: 👑 Top 1 View Săn Mây Đỉnh Gió..."
                              className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nhãn chứng nhận chuyên ngành do Admin cấp */}
                    <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          Nhãn Chứng Nhận Thẩm Định Của Admin
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={adminNewCertText}
                            onChange={(e) => setAdminNewCertText(e.target.value)}
                            placeholder="VD: Đã kiểm tra bình nóng lạnh & PCCC..."
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-64"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!adminNewCertText.trim()) return;
                              setSelectedListingDetail({
                                ...selectedListingDetail,
                                certifications: [...(selectedListingDetail.certifications || []), adminNewCertText.trim()]
                              });
                              setAdminNewCertText('');
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                          >
                            + Cấp Nhãn
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedListingDetail.certifications || selectedListingDetail.tags || []).map((c, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                          >
                            <span>✓ {c}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedListingDetail({
                                  ...selectedListingDetail,
                                  certifications: (
                                    selectedListingDetail.certifications ||
                                    selectedListingDetail.tags ||
                                    []
                                  ).filter((_, i) => i !== idx)
                                })
                              }
                              className="text-rose-400 hover:text-rose-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          commitListingUpdate(
                            selectedListingDetail,
                            `✅ Admin đã lưu toàn bộ hồ sơ & hình ảnh của "${selectedListingDetail.title}"!`
                          )
                        }
                        className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu Thay Đổi Hồ Sơ Cơ Sở</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 2: ADMIN KIỂM SOÁT SÂU TÍNH NĂNG CỦA TỪNG BÊN DỊCH VỤ */}
                {editingListingMode === 'service_features' && (
                  <div className="space-y-5">
                    {/* A. NẾU CƠ SỞ LÀ HOMESTAY -> ADMIN THÊM/SỬA/XÓA HẠNG PHÒNG, TIỆN NGHI, LỊCH TRỐNG */}
                    {selectedListingDetail.category === 'homestay' && (
                      <div className="space-y-4">
                        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3">
                          <span className="text-xs font-extrabold text-teal-300 uppercase block">
                            + Thêm Hạng Phòng Mới Cho Homestay Này (Quyền Admin)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={adminNewRoom.name || ''}
                                onChange={(e) => setAdminNewRoom({ ...adminNewRoom, name: e.target.value })}
                                placeholder="Tên hạng phòng (VD: Bungalow Kính Săn Mây)"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={adminNewRoom.priceWeekday || 600000}
                                onChange={(e) => setAdminNewRoom({ ...adminNewRoom, priceWeekday: Number(e.target.value) })}
                                placeholder="Giá ngày thường"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={adminNewRoom.priceWeekend || 800000}
                                onChange={(e) => setAdminNewRoom({ ...adminNewRoom, priceWeekend: Number(e.target.value) })}
                                placeholder="Giá cuối tuần"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <input
                                type="number"
                                value={adminNewRoom.capacity || 2}
                                onChange={(e) => setAdminNewRoom({ ...adminNewRoom, capacity: Number(e.target.value) })}
                                placeholder="Số người ở"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                value={adminNewRoom.totalRooms || 4}
                                onChange={(e) =>
                                  setAdminNewRoom({
                                    ...adminNewRoom,
                                    totalRooms: Number(e.target.value),
                                    availableRooms: Number(e.target.value)
                                  })
                                }
                                placeholder="Tổng số phòng"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={adminNewRoom.viewDescription || ''}
                                onChange={(e) => setAdminNewRoom({ ...adminNewRoom, viewDescription: e.target.value })}
                                placeholder="Mô tả view nhìn (VD: View trực diện biển mây Đỉnh Gió)"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(adminNewRoom.hasWaterHeater)}
                                  onChange={(e) => setAdminNewRoom({ ...adminNewRoom, hasWaterHeater: e.target.checked })}
                                />
                                <span>Nóng lạnh</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(adminNewRoom.hasAirConditioner)}
                                  onChange={(e) =>
                                    setAdminNewRoom({ ...adminNewRoom, hasAirConditioner: e.target.checked })
                                  }
                                />
                                <span>Điều hòa</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(adminNewRoom.hasHeaterMattress)}
                                  onChange={(e) =>
                                    setAdminNewRoom({ ...adminNewRoom, hasHeaterMattress: e.target.checked })
                                  }
                                />
                                <span>Đệm sưởi</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(adminNewRoom.hasPrivateBathroom)}
                                  onChange={(e) =>
                                    setAdminNewRoom({ ...adminNewRoom, hasPrivateBathroom: e.target.checked })
                                  }
                                />
                                <span>WC khép kín</span>
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminNewRoom.name?.trim()) return;
                                const rm: RoomType = {
                                  id: `adm-rm-${Date.now()}`,
                                  name: adminNewRoom.name.trim(),
                                  capacity: Number(adminNewRoom.capacity) || 2,
                                  priceWeekday: Number(adminNewRoom.priceWeekday) || 550000,
                                  priceWeekend: Number(adminNewRoom.priceWeekend) || 750000,
                                  totalRooms: Number(adminNewRoom.totalRooms) || 3,
                                  availableRooms: Number(adminNewRoom.availableRooms) || 3,
                                  viewType: 'Biển mây tràn',
                                  viewDescription: adminNewRoom.viewDescription || 'View biển mây',
                                  hasWaterHeater: Boolean(adminNewRoom.hasWaterHeater),
                                  hasAirConditioner: Boolean(adminNewRoom.hasAirConditioner),
                                  hasHeaterMattress: Boolean(adminNewRoom.hasHeaterMattress),
                                  hasPrivateBathroom: Boolean(adminNewRoom.hasPrivateBathroom),
                                  amenities: ['Bình nóng lạnh', 'Đệm sưởi', 'Wifi 4G']
                                };
                                const updated = {
                                  ...selectedListingDetail,
                                  roomTypes: [...(selectedListingDetail.roomTypes || []), rm]
                                };
                                commitListingUpdate(updated, `✅ Đã thêm hạng phòng "${rm.name}"!`);
                                setAdminNewRoom({ ...adminNewRoom, name: '' });
                              }}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                            >
                              + Thêm Hạng Phòng
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(selectedListingDetail.roomTypes || []).map((rm) => (
                            <div key={rm.id} className="bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-white text-sm">{rm.name}</h5>
                                  <p className="text-xs text-slate-400">
                                    Tối đa {rm.capacity} khách • Tổng {rm.totalRooms} phòng • Còn trống:{' '}
                                    <strong className="text-emerald-400">{rm.availableRooms}</strong>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...selectedListingDetail,
                                      roomTypes: (selectedListingDetail.roomTypes || []).filter((x) => x.id !== rm.id)
                                    };
                                    commitListingUpdate(updated, `🗑️ Đã xóa hạng phòng "${rm.name}"!`);
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                  title="Xóa hạng phòng"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                                <div>
                                  <span className="text-xs text-slate-400 block">Giá thường</span>
                                  <input
                                    type="number"
                                    value={rm.priceWeekday}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const updated = {
                                        ...selectedListingDetail,
                                        roomTypes: (selectedListingDetail.roomTypes || []).map((x) =>
                                          x.id === rm.id ? { ...x, priceWeekday: val } : x
                                        )
                                      };
                                      commitListingUpdate(updated);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-slate-400 block">Giá cuối tuần</span>
                                  <input
                                    type="number"
                                    value={rm.priceWeekend}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const updated = {
                                        ...selectedListingDetail,
                                        roomTypes: (selectedListingDetail.roomTypes || []).map((x) =>
                                          x.id === rm.id ? { ...x, priceWeekend: val } : x
                                        )
                                      };
                                      commitListingUpdate(updated);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs text-slate-400 block">Phòng trống</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={rm.totalRooms}
                                    value={rm.availableRooms}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const updated = {
                                        ...selectedListingDetail,
                                        roomTypes: (selectedListingDetail.roomTypes || []).map((x) =>
                                          x.id === rm.id ? { ...x, availableRooms: val } : x
                                        )
                                      };
                                      commitListingUpdate(updated);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* B. NẾU CƠ SỞ LÀ NHÀ XE KHÁCH (`bus`) -> ADMIN QUẢN LÝ CHUYẾN XE, SƠ ĐỒ GHẾ, ĐIỂM ĐÓN & XE MÁY KÈM */}
                    {selectedListingDetail.category === 'bus' && (
                      <div className="space-y-4">
                        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3">
                          <span className="text-xs font-extrabold text-teal-300 uppercase block">
                            + Thêm Chuyến Xe Mới Vào Hệ Thống (Quyền Admin)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                            <input
                              type="text"
                              value={adminNewTrip.operatorName}
                              onChange={(e) => setAdminNewTrip({ ...adminNewTrip, operatorName: e.target.value })}
                              placeholder="Tên nhà xe / chuyến xe..."
                              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <select
                              value={adminNewTrip.busType}
                              onChange={(e) => setAdminNewTrip({ ...adminNewTrip, busType: e.target.value as BusType })}
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            >
                              <option value="Giường nằm Cabin Đôi">Cabin Đôi 2 Tầng</option>
                              <option value="Giường nằm 2 tầng">Giường Nằm 2 Tầng</option>
                              <option value="Limousine 9 chỗ VIP">Limousine 9 Chỗ VIP</option>
                              <option value="Limousine 11 chỗ">Limousine 11 Chỗ</option>
                            </select>
                            <input
                              type="number"
                              value={adminNewTrip.baseFare}
                              onChange={(e) => setAdminNewTrip({ ...adminNewTrip, baseFare: Number(e.target.value) })}
                              placeholder="Giá vé"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const name = adminNewTrip.operatorName.trim() || selectedListingDetail.title;
                                const createdTrip: BusTrip = {
                                  id: `trip-adm-${Date.now()}`,
                                  operatorName: name,
                                  busType: adminNewTrip.busType,
                                  departureTime: adminNewTrip.departureTime,
                                  route: adminNewTrip.route,
                                  originCity: 'Hà Nội',
                                  destinationCity: 'Tà Xùa',
                                  baseFare: Number(adminNewTrip.baseFare) || 350000,
                                  totalSeats: adminNewTrip.busType.includes('Limousine') ? 9 : 24,
                                  bookedSeats: [1, 2],
                                  stops: [
                                    { id: `st-${Date.now()}-1`, name: 'Bến xe Mỹ Đình', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
                                    { id: `st-${Date.now()}-2`, name: 'Trung tâm Tà Xùa', type: 'dropoff', minuteOffset: 300, fareModifier: 0 }
                                  ],
                                  phone: selectedListingDetail.phone,
                                  zalo: selectedListingDetail.zalo,
                                  rating: 4.9,
                                  amenities: ['Wifi', 'Chăn ấm', 'Cổng sạc USB']
                                };
                                updateTripsBoth((prev) => [createdTrip, ...prev]);
                                setAdminNewTrip({ ...adminNewTrip, operatorName: '' });
                                showAdminToast(`✅ Admin đã thêm chuyến xe "${createdTrip.operatorName}"!`);
                              }}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              + Thêm Chuyến
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {localTrips.map((tr) => (
                            <div key={tr.id} className="bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-bold text-white text-sm">{tr.operatorName}</span>
                                  <span className="ml-2 text-xs text-teal-300">
                                    ({tr.busType} • Xuất phát {tr.departureTime} • {formatVND(tr.baseFare)})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateTripsBoth((prev) => prev.filter((x) => x.id !== tr.id));
                                    showAdminToast(`🗑️ Đã xóa chuyến xe "${tr.operatorName}"!`);
                                  }}
                                  className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa chuyến</span>
                                </button>
                              </div>

                              {/* Sơ đồ ghế nhanh cho Admin khóa/mở */}
                              <div>
                                <span className="text-xs text-slate-400 block mb-1.5">
                                  Sơ đồ ghế ({tr.totalSeats - tr.bookedSeats.length}/{tr.totalSeats} ghế trống) - Bấm để Khóa/Mở ghế:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.from({ length: tr.totalSeats }, (_, i) => i + 1).map((seatNum) => {
                                    const isBooked = tr.bookedSeats.includes(seatNum);
                                    return (
                                      <button
                                        key={seatNum}
                                        type="button"
                                        onClick={() => {
                                          updateTripsBoth((prev) =>
                                            prev.map((item) => {
                                              if (item.id !== tr.id) return item;
                                              const nextBooked = isBooked
                                                ? item.bookedSeats.filter((s) => s !== seatNum)
                                                : [...item.bookedSeats, seatNum];
                                              return { ...item, bookedSeats: nextBooked };
                                            })
                                          );
                                        }}
                                        className={`px-2 py-1 rounded text-xs font-bold cursor-pointer border ${
                                          isBooked
                                            ? 'bg-rose-900/60 border-rose-600 text-rose-200'
                                            : 'bg-slate-900 border-teal-500/40 text-teal-300'
                                        }`}
                                      >
                                        Ghế {seatNum}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Điểm đón trả */}
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-xs text-slate-400">Điểm đón/trả:</span>
                                {tr.stops.map((st) => (
                                  <span
                                    key={st.id}
                                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1"
                                  >
                                    <span>{st.name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateTripsBoth((prev) =>
                                          prev.map((item) =>
                                            item.id === tr.id
                                              ? { ...item, stops: item.stops.filter((s) => s.id !== st.id) }
                                              : item
                                          )
                                        )
                                      }
                                      className="text-rose-400 hover:text-rose-300"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={adminNewStopName}
                                    onChange={(e) => setAdminNewStopName(e.target.value)}
                                    placeholder="Thêm điểm đón..."
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white w-36"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!adminNewStopName.trim()) return;
                                      const st: RouteStop = {
                                        id: `st-${Date.now()}`,
                                        name: adminNewStopName.trim(),
                                        type: 'pickup',
                                        minuteOffset: 30,
                                        fareModifier: 0
                                      };
                                      updateTripsBoth((prev) =>
                                        prev.map((item) =>
                                          item.id === tr.id ? { ...item, stops: [...item.stops, st] } : item
                                        )
                                      );
                                      setAdminNewStopName('');
                                    }}
                                    className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg cursor-pointer"
                                  >
                                    + Thêm
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* C. NẾU CƠ SỞ LÀ QUÁN ĂN / CAFE (`restaurant` | `coffee`) -> ADMIN SỬA GIỜ MỞ CỬA & MENU */}
                    {(selectedListingDetail.category === 'restaurant' ||
                      selectedListingDetail.category === 'coffee') && (
                      <div className="space-y-4">
                        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Giờ mở cửa</label>
                            <input
                              type="time"
                              value={selectedListingDetail.openingHours?.openTime || '06:30'}
                              onChange={(e) =>
                                commitListingUpdate({
                                  ...selectedListingDetail,
                                  openingHours: {
                                    openTime: e.target.value,
                                    closeTime: selectedListingDetail.openingHours?.closeTime || '22:00',
                                    ...selectedListingDetail.openingHours
                                  }
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Giờ đóng cửa</label>
                            <input
                              type="time"
                              value={selectedListingDetail.openingHours?.closeTime || '22:00'}
                              onChange={(e) =>
                                commitListingUpdate({
                                  ...selectedListingDetail,
                                  openingHours: {
                                    openTime: selectedListingDetail.openingHours?.openTime || '06:30',
                                    ...selectedListingDetail.openingHours,
                                    closeTime: e.target.value
                                  }
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Ghi chú phục vụ</label>
                            <input
                              type="text"
                              value={selectedListingDetail.openingHours?.serviceNote || ''}
                              onChange={(e) =>
                                commitListingUpdate({
                                  ...selectedListingDetail,
                                  openingHours: {
                                    openTime: selectedListingDetail.openingHours?.openTime || '06:30',
                                    closeTime: selectedListingDetail.openingHours?.closeTime || '22:00',
                                    ...selectedListingDetail.openingHours,
                                    serviceNote: e.target.value
                                  }
                                })
                              }
                              placeholder="VD: Nhận đặt bàn săn mây sớm..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3">
                          <span className="text-xs font-extrabold text-teal-300 uppercase block">
                            + Thêm Món Vào Thực Đơn Cơ Sở (Quyền Admin)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                            <input
                              type="text"
                              value={adminNewMenu.name || ''}
                              onChange={(e) => setAdminNewMenu({ ...adminNewMenu, name: e.target.value })}
                              placeholder="Tên món ăn / đồ uống..."
                              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="number"
                              step="5000"
                              value={adminNewMenu.price || 65000}
                              onChange={(e) => setAdminNewMenu({ ...adminNewMenu, price: Number(e.target.value) })}
                              placeholder="Giá (VNĐ)"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={adminNewMenu.unit || 'Phần'}
                              onChange={(e) => setAdminNewMenu({ ...adminNewMenu, unit: e.target.value })}
                              placeholder="Đơn vị (Nồi, Ly...)"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminNewMenu.name?.trim()) return;
                                const item: MenuItem = {
                                  id: `adm-mn-${Date.now()}`,
                                  name: adminNewMenu.name.trim(),
                                  category: adminNewMenu.category || 'Đặc sản',
                                  price: Number(adminNewMenu.price) || 65000,
                                  unit: adminNewMenu.unit || 'Phần',
                                  isBestSeller: true,
                                  isAvailable: true
                                };
                                commitListingUpdate(
                                  {
                                    ...selectedListingDetail,
                                    menuItems: [...(selectedListingDetail.menuItems || []), item]
                                  },
                                  `✅ Đã thêm món "${item.name}" vào thực đơn!`
                                );
                                setAdminNewMenu({ ...adminNewMenu, name: '' });
                              }}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              + Thêm Món
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(selectedListingDetail.menuItems || []).map((mn) => (
                            <div
                              key={mn.id}
                              className="bg-slate-850 border border-slate-750 p-3.5 rounded-xl flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-white text-xs">{mn.name}</div>
                                <div className="text-xs text-teal-300 font-bold">
                                  {formatVND(mn.price)} / {mn.unit}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...selectedListingDetail,
                                      menuItems: (selectedListingDetail.menuItems || []).map((x) =>
                                        x.id === mn.id ? { ...x, isAvailable: !x.isAvailable } : x
                                      )
                                    };
                                    commitListingUpdate(updated);
                                  }}
                                  className={`text-xs font-bold px-2 py-1 rounded-lg cursor-pointer ${
                                    mn.isAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {mn.isAvailable ? 'Còn món' : 'Hết món'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...selectedListingDetail,
                                      menuItems: (selectedListingDetail.menuItems || []).filter((x) => x.id !== mn.id)
                                    };
                                    commitListingUpdate(updated, `🗑️ Đã xóa món "${mn.name}"!`);
                                  }}
                                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* D. NẾU CƠ SỞ LÀ XE MÁY, TOUR, PHOTO, TRANG PHỤC, MÁY ẢNH, TAXI -> ADMIN QUẢN LÝ GÓI DỊCH VỤ */}
                    {!['homestay', 'bus', 'restaurant', 'coffee'].includes(selectedListingDetail.category) && (
                      <div className="space-y-4">
                        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 space-y-3">
                          <span className="text-xs font-extrabold text-teal-300 uppercase block">
                            + Thêm Gói Dịch Vụ / Phương Tiện Cho Cơ Sở Này (Quyền Admin)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                            <input
                              type="text"
                              value={adminNewPkg.name || ''}
                              onChange={(e) => setAdminNewPkg({ ...adminNewPkg, name: e.target.value })}
                              placeholder="Tên gói / dòng xe..."
                              className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="number"
                              step="10000"
                              value={adminNewPkg.price || 150000}
                              onChange={(e) => setAdminNewPkg({ ...adminNewPkg, price: Number(e.target.value) })}
                              placeholder="Giá (VNĐ)"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="number"
                              value={adminNewPkg.availableQuantity || 10}
                              onChange={(e) =>
                                setAdminNewPkg({
                                  ...adminNewPkg,
                                  availableQuantity: Number(e.target.value),
                                  totalQuantity: Number(e.target.value)
                                })
                              }
                              placeholder="Số lượng trống"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminNewPkg.name?.trim()) return;
                                const pkg: ServicePackageItem = {
                                  id: `adm-pkg-${Date.now()}`,
                                  name: adminNewPkg.name.trim(),
                                  price: Number(adminNewPkg.price) || 150000,
                                  halfDayPrice:
                                    selectedListingDetail.category === 'motorbike'
                                      ? Math.round((Number(adminNewPkg.price) || 150000) / 2)
                                      : undefined,
                                  unit: selectedListingDetail.category === 'motorbike' ? 'ngày' : 'gói',
                                  totalQuantity: Number(adminNewPkg.totalQuantity) || 10,
                                  availableQuantity: Number(adminNewPkg.availableQuantity) || 10,
                                  isAvailable: true
                                };
                                commitListingUpdate(
                                  {
                                    ...selectedListingDetail,
                                    servicePackages: [...(selectedListingDetail.servicePackages || []), pkg]
                                  },
                                  `✅ Đã thêm gói dịch vụ "${pkg.name}"!`
                                );
                                setAdminNewPkg({ ...adminNewPkg, name: '' });
                              }}
                              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              + Thêm Gói
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(selectedListingDetail.servicePackages || []).map((pk) => (
                            <div
                              key={pk.id}
                              className="bg-slate-850 border border-slate-750 p-3.5 rounded-xl flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="font-bold text-white text-xs">{pk.name}</div>
                                <div className="text-xs text-teal-300 font-bold">
                                  {formatVND(pk.price)}/{pk.unit} • Còn trống: {pk.availableQuantity ?? 5}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = {
                                    ...selectedListingDetail,
                                    servicePackages: (selectedListingDetail.servicePackages || []).filter(
                                      (x) => x.id !== pk.id
                                    )
                                  };
                                  commitListingUpdate(updated, `🗑️ Đã xóa gói "${pk.name}"!`);
                                }}
                                className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bảng Danh Sách Cơ Sở */}
            <div className="space-y-3">
              {filteredListings.map((l) => (
                <div
                  key={l.id}
                  className="bg-slate-900 border border-slate-750 hover:border-slate-700 rounded-2xl p-4.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <img
                      src={l.coverImage}
                      alt={l.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-750"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-white text-sm">{l.title}</h4>
                        {l.isAdminFeatured && (
                          <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-2.5 py-0.5 rounded-full font-extrabold shadow-sm">
                            {l.adminFeaturedLabel || '👑 Admin Đề Xuất'} (Ưu tiên #{l.adminPriorityRank ?? 10})
                          </span>
                        )}
                        <span className="text-xs bg-slate-800 text-teal-300 px-2 py-0.5 rounded-full font-bold border border-teal-500/30">
                          {l.category.toUpperCase()}
                        </span>
                        <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Từ {formatVND(l.minPrice)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Khu vực: {l.area}</span>
                        <span>•</span>
                        <span>Hotline: <strong className="text-slate-300">{l.phone}</strong></span>
                        <span>•</span>
                        <span>Ảnh: {(l.images || []).length} ảnh</span>
                      </div>

                      <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap gap-2">
                        {l.roomTypes && l.roomTypes.length > 0 && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-medium">
                            {l.roomTypes.length} hạng phòng • Còn {l.roomTypes.reduce((s, r) => s + r.availableRooms, 0)} phòng trống
                          </span>
                        )}
                        {l.openingHours && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-medium">
                            Giờ mở cửa: {l.openingHours.openTime} - {l.openingHours.closeTime}
                          </span>
                        )}
                        {l.menuItems && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-300 font-medium">
                            Menu: {l.menuItems.length} món
                          </span>
                        )}
                        {l.servicePackages && l.servicePackages.length > 0 && (
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-medium">
                            {l.servicePackages.length} gói dịch vụ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cụm công cụ điều khiển toàn quyền của Admin */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                    {/* Nút Ghim Ưu Tiên 1-Chạm & Ô chỉnh hạng ưu tiên trực tiếp */}
                    <div className="flex items-center gap-1 bg-slate-850 border border-slate-750 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!onUpdateListing) return;
                          const nextFeatured = !l.isAdminFeatured;
                          const updated: Listing = {
                            ...l,
                            isAdminFeatured: nextFeatured,
                            adminPriorityRank: l.adminPriorityRank ?? 10,
                            adminFeaturedLabel: l.adminFeaturedLabel || '👑 Admin Đề Xuất'
                          };
                          void Promise.resolve(onUpdateListing(updated)).then((ok) => {
                            if (ok === false) return;
                            showAdminToast(
                            nextFeatured
                              ? `👑 Đã ghim "${l.title}" lên đầu trang (Hạng #${updated.adminPriorityRank})!`
                              : `Đã bỏ ghim ưu tiên cho "${l.title}".`
                            );
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          l.isAdminFeatured
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-slate-300 hover:text-amber-300'
                        }`}
                        title="Ghim hoặc bỏ ghim cơ sở này lên đầu danh sách gợi ý"
                      >
                        {l.isAdminFeatured ? `👑 Đang Ghim` : '👑 Ghim Top'}
                      </button>
                      {l.isAdminFeatured && (
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={l.adminPriorityRank ?? 10}
                          onChange={(e) => {
                            if (!onUpdateListing) return;
                            const nextRank = Math.max(1, Number(e.target.value) || 1);
                            onUpdateListing({
                              ...l,
                              adminPriorityRank: nextRank
                            });
                          }}
                          title="Thứ tự ưu tiên (1 = Cao nhất)"
                          className="w-12 bg-slate-900 border border-amber-500/40 rounded-lg px-1.5 py-1 text-xs font-extrabold text-amber-300 text-center"
                        />
                      )}
                    </div>

                    <select
                      value={l.verificationTier}
                      onChange={(e) => onUpdateTier(l.id, Number(e.target.value) as VerificationTier)}
                      className={`border rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        l.verificationTier === 3
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : l.verificationTier === 2
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <option value={1}>Cấp 1: Cơ bản</option>
                      <option value={2}>Cấp 2: Xác minh</option>
                      <option value={3}>Cấp 3: Sáng lập</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListingDetail(l);
                        setEditingListingMode('profile');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa Hồ Sơ & Ảnh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListingDetail(l);
                        setEditingListingMode('service_features');
                      }}
                      className="bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Quản Trị Dịch Vụ</span>
                    </button>

                    {l.status !== 'approved' ? (
                      <button
                        type="button"
                        onClick={() => onApproveListing(l.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        Duyệt
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRejectListing(l.id)}
                        className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 font-bold text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
                      >
                        Tạm ẩn
                      </button>
                    )}

                    {onDeleteListing && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteListing(l.id);
                          if (selectedListingDetail?.id === l.id) {
                            setSelectedListingDetail(null);
                            setEditingListingMode(null);
                          }
                          showAdminToast(`🗑️ Đã xóa cơ sở "${l.title}" khỏi hệ thống!`);
                        }}
                        className="bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/50 p-1.5 rounded-xl cursor-pointer"
                        title="Xóa hẳn cơ sở này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: QUẢN TRỊ NỘI DUNG & HÌNH ẢNH TOÀN WEBSITE (CMS STUDIO)
           ======================================================== */}
        {adminTab === 'cms_content' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <span>CMS Quản Trị Toàn Bộ Nội Dung & Hình Ảnh Hiển Thị Trên Website</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thêm / Sửa / Xóa trực tiếp Ảnh nền Hero, Banner quảng bá, Chuyên mục, Điểm săn mây, Dự báo thời tiết, Bài viết cộng đồng & Footer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveCmsConfig()}
                className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Ra Website</span>
              </button>
            </div>

            {cmsSaveFeedback && (
              <div className="text-xs font-bold text-emerald-300 bg-emerald-500/15 px-4 py-3 rounded-xl border border-emerald-500/30">
                {cmsSaveFeedback}
              </div>
            )}

            {/* Sub-navigation cho 7 phân khu nội dung & kênh social trên website */}
            <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-750">
              {[
                {
                  id: 'social_channels_utm',
                  label: `🌐 1. Kênh Social (TikTok/FB/Zalo/SĐT) & Phễu UTM (${(cmsConfig.socialChannels || []).length})`
                },
                { id: 'hero_banners', label: `2a. Hero & 3+ Thẻ Điểm Nhấn (${(cmsConfig.heroBanners || []).length})` },
                {
                  id: 'curated_combos',
                  label: `📦 2b. Gói Combo & Trekking Đặc Biệt (${(cmsConfig.curatedCombos || []).length})`
                },
                { id: 'section_banners', label: '3. Banner & Nội Dung Các Chuyên Mục' },
                { id: 'emergency_alert', label: '4. Dải Băng Cảnh Báo Đèo' },
                { id: 'cloud_landmarks', label: `5. Điểm Săn Mây (${cmsLandmarks.length})` },
                { id: 'weather_forecasts', label: `6. Bản Tin Thời Tiết (${cmsForecasts.length})` },
                { id: 'community_footer', label: `7. Cộng Đồng & Footer (${cmsPosts.length})` }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCmsSubTab(st.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    cmsSubTab === st.id
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-850 text-slate-300 hover:text-white border border-slate-750'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* PHÂN KHU MỚI 1: QUẢN TRỊ KÊNH SOCIAL ĐA VỊ TRÍ (TIKTOK/FB/ZALO/SĐT) & PHỄU UTM */}
            {cmsSubTab === 'social_channels_utm' && (() => {
              const adminUtmUrl = buildCommunityUtmUrl(
                typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://taxuatrip.vn',
                adminUtmSource,
                adminUtmCampaign
              );
              const placementLabels: Record<SocialPlacement, string> = {
                header: 'Header / Topbar',
                footer: 'Footer Chân Trang',
                community_hub: 'Popup Cộng Đồng (Phần 4)',
                floating_dock: 'Nút Nổi Góc Màn Hình',
                sos_modal: 'Bảng Cứu Hộ SOS'
              };
              const platformLabels: Record<SocialChannelPlatform, string> = {
                tiktok: '🎵 TikTok Official',
                facebook_page: '📘 Facebook Fanpage',
                facebook_group: '👥 Facebook Group Cộng Đồng',
                zalo_oa: '💬 Zalo Official Account (OA)',
                zalo_group: '🟢 Nhóm Zalo Săn Mây / Ghép Chuyến',
                phone_hotline: '📞 SĐT Hotline Đặt Phòng/Vé Xe',
                phone_sos: '🚨 SĐT Cứu Hộ Đèo 24/7',
                youtube: '▶️ YouTube Channel',
                instagram: '📸 Instagram'
              };

              return (
                <div className="space-y-6">
                  {/* Khối 1: Form Thêm Kênh Social / Số Điện Thoại Mới */}
                  <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide block">
                          + THÊM KÊNH SOCIAL / SĐT HOTLINE MỚI & CHỌN VỊ TRÍ HIỂN THỊ TRÊN WEBSITE
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Mọi kênh thêm mới hoặc chỉnh sửa tại đây sẽ tự động hiển thị đồng bộ ở Header, Footer, Popup Cộng Đồng (Phần 4), Thanh nổi và Bảng SOS.
                        </p>
                      </div>
                      <span className="text-xs font-bold bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-500/30">
                        Đang hoạt động: {(cmsConfig.socialChannels || []).filter((c) => c.isActive).length}/{(cmsConfig.socialChannels || []).length} kênh
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Nền tảng / Loại kênh *</label>
                        <select
                          value={newSocialChannel.platform}
                          onChange={(e) =>
                            setNewSocialChannel({
                              ...newSocialChannel,
                              platform: e.target.value as SocialChannelPlatform
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
                        >
                          {(Object.keys(platformLabels) as SocialChannelPlatform[]).map((pf) => (
                            <option key={pf} value={pf}>
                              {platformLabels[pf]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Tên hiển thị của kênh *</label>
                        <input
                          type="text"
                          value={newSocialChannel.title}
                          onChange={(e) => setNewSocialChannel({ ...newSocialChannel, title: e.target.value })}
                          placeholder="VD: TikTok Tà Xùa Trip Official..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">ID Kênh hoặc Số Điện Thoại *</label>
                        <input
                          type="text"
                          value={newSocialChannel.handleOrNumber}
                          onChange={(e) =>
                            setNewSocialChannel({ ...newSocialChannel, handleOrNumber: e.target.value })
                          }
                          placeholder="VD: @taxuatrip.vn hoặc 0981 234 567"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-teal-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300 block mb-1">
                          Đường dẫn URL (Link TikTok/FB/Zalo hoặc `tel:0981234567`) *
                        </label>
                        <input
                          type="text"
                          value={newSocialChannel.url}
                          onChange={(e) => setNewSocialChannel({ ...newSocialChannel, url: e.target.value })}
                          placeholder="https://www.tiktok.com/@taxuatrip.official hoặc tel:0981234567"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">
                          Số lượng thành viên / Khung giờ trực
                        </label>
                        <input
                          type="text"
                          value={newSocialChannel.memberOrFollowerCount}
                          onChange={(e) =>
                            setNewSocialChannel({
                              ...newSocialChannel,
                              memberOrFollowerCount: e.target.value
                            })
                          }
                          placeholder="VD: 68.4K Followers / Trực 24/7"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300 block mb-1">Mô tả ngắn hiển thị cho khách</label>
                        <input
                          type="text"
                          value={newSocialChannel.description}
                          onChange={(e) =>
                            setNewSocialChannel({ ...newSocialChannel, description: e.target.value })
                          }
                          placeholder="VD: Cập nhật video biển mây thực tế lúc 05:30 sáng hằng ngày..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Nhãn nổi bật (Badge)</label>
                        <input
                          type="text"
                          value={newSocialChannel.badgeText}
                          onChange={(e) =>
                            setNewSocialChannel({ ...newSocialChannel, badgeText: e.target.value })
                          }
                          placeholder="VD: Chính thức / Live 05:30"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300"
                        />
                      </div>
                    </div>

                    {/* Chọn vị trí hiển thị trên website */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-300">Hiển thị tại vị trí:</span>
                        {(Object.keys(placementLabels) as SocialPlacement[]).map((pl) => {
                          const checked = newSocialChannel.placements.includes(pl);
                          return (
                            <label
                              key={pl}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                                checked
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const nextPl = e.target.checked
                                    ? [...newSocialChannel.placements, pl]
                                    : newSocialChannel.placements.filter((x) => x !== pl);
                                  setNewSocialChannel({ ...newSocialChannel, placements: nextPl });
                                }}
                                className="accent-teal-500"
                              />
                              <span>{placementLabels[pl]}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newSocialChannel.title.trim() || !newSocialChannel.handleOrNumber.trim()) {
                            showAdminToast('⚠️ Vui lòng nhập Tên kênh và ID/Số điện thoại!');
                            return;
                          }
                          const created: SocialChannelConfig = {
                            id: `soc-${Date.now()}`,
                            platform: newSocialChannel.platform,
                            title: newSocialChannel.title.trim(),
                            handleOrNumber: newSocialChannel.handleOrNumber.trim(),
                            url:
                              newSocialChannel.url.trim() ||
                              (newSocialChannel.platform.startsWith('phone')
                                ? `tel:${newSocialChannel.handleOrNumber.replace(/\s+/g, '')}`
                                : 'https://taxuatrip.vn'),
                            description:
                              newSocialChannel.description.trim() ||
                              'Kênh kết nối và hỗ trợ du khách chính thức của Tà Xùa Trip.',
                            memberOrFollowerCount: newSocialChannel.memberOrFollowerCount || 'Chính chủ',
                            badgeText: newSocialChannel.badgeText || 'Chính thức',
                            placements:
                              newSocialChannel.placements.length > 0
                                ? newSocialChannel.placements
                                : ['footer', 'community_hub'],
                            isVerifiedOfficial: true,
                            isActive: true,
                            sortOrder: (cmsConfig.socialChannels || []).length + 1
                          };
                          const nextConfig: SiteContentConfig = {
                            ...cmsConfig,
                            socialChannels: [created, ...(cmsConfig.socialChannels || [])]
                          };
                          setCmsConfig(nextConfig);
                          if (onUpdateSiteContent) onUpdateSiteContent(nextConfig);
                          setNewSocialChannel({
                            ...newSocialChannel,
                            title: '',
                            handleOrNumber: '',
                            url: '',
                            description: ''
                          });
                          showAdminToast(`✅ Đã thêm kênh "${created.title}" và đồng bộ hiển thị trên Website!`);
                        }}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-lg shrink-0"
                      >
                        + Thêm Kênh Social / SĐT
                      </button>
                    </div>
                  </div>

                  {/* Khối 2: Danh sách Kênh Social & SĐT Hiện Có (Sửa / Xóa / Bật-Tắt / Chọn Vị Trí) */}
                  <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                    <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide block">
                      DANH SÁCH KÊNH SOCIAL & SỐ ĐIỆN THOẠI ĐANG QUẢN TRỊ (SỬA TRỰC TIẾP / BẬT-TẮT / XÓA)
                    </span>

                    <div className="grid grid-cols-1 gap-4">
                      {(cmsConfig.socialChannels || []).map((ch) => (
                        <div
                          key={ch.id}
                          className={`bg-slate-850 border rounded-2xl p-4 space-y-3 transition-all ${
                            ch.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <select
                                value={ch.platform}
                                onChange={(e) => {
                                  const val = e.target.value as SocialChannelPlatform;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, platform: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-teal-300"
                              >
                                {(Object.keys(platformLabels) as SocialChannelPlatform[]).map((pf) => (
                                  <option key={pf} value={pf}>
                                    {platformLabels[pf]}
                                  </option>
                                ))}
                              </select>

                              <span className="text-xs font-mono text-slate-400">#{ch.id}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, isActive: !x.isActive } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  showAdminToast(
                                    !ch.isActive
                                      ? `🟢 Đã BẬT hiển thị kênh "${ch.title}"`
                                      : `⚪ Đã TẮT hiển thị kênh "${ch.title}"`
                                  );
                                }}
                                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer border ${
                                  ch.isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {ch.isActive ? '🟢 Đang Hiển Thị' : '⚪ Đang Ẩn'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).filter(
                                      (x) => x.id !== ch.id
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  showAdminToast(`🗑️ Đã xóa kênh "${ch.title}" khỏi hệ thống!`);
                                }}
                                className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 p-1.5 rounded-xl cursor-pointer"
                                title="Xóa kênh này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="text-xs text-slate-400 block">Tên hiển thị</label>
                              <input
                                type="text"
                                value={ch.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, title: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">ID / Số điện thoại</label>
                              <input
                                type="text"
                                value={ch.handleOrNumber}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, handleOrNumber: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">Thành viên / Giờ trực</label>
                              <input
                                type="text"
                                value={ch.memberOrFollowerCount || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, memberOrFollowerCount: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-xs text-slate-400 block">Đường dẫn URL / `tel:`</label>
                              <input
                                type="text"
                                value={ch.url}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, url: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">Mô tả ngắn</label>
                              <input
                                type="text"
                                value={ch.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                      x.id === ch.id ? { ...x, description: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                              />
                            </div>
                          </div>

                          {/* Tích chọn các vị trí hiển thị */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs font-bold text-slate-400">Vị trí hiển thị:</span>
                            {(Object.keys(placementLabels) as SocialPlacement[]).map((pl) => {
                              const hasPlacement = ch.placements.includes(pl);
                              return (
                                <label
                                  key={pl}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border ${
                                    hasPlacement
                                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                                      : 'bg-slate-900 text-slate-500 border-slate-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={hasPlacement}
                                    onChange={(e) => {
                                      const updatedPlacements = e.target.checked
                                        ? [...ch.placements, pl]
                                        : ch.placements.filter((item) => item !== pl);
                                      const next = {
                                        ...cmsConfig,
                                        socialChannels: (cmsConfig.socialChannels || []).map((x) =>
                                          x.id === ch.id ? { ...x, placements: updatedPlacements } : x
                                        )
                                      };
                                      setCmsConfig(next);
                                      if (onUpdateSiteContent) onUpdateSiteContent(next);
                                    }}
                                    className="accent-teal-500"
                                  />
                                  <span>{placementLabels[pl]}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Khối 3: Trình Tạo Link Chiến Dịch UTM & Mã QR Nội Bộ + Checklist 30 Ngày (Chuyển từ Popup khách về Admin) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7 bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                      <div>
                        <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide block">
                          CÔNG CỤ MARKETING NỘI BỘ DÀNH CHO ADMIN (PHỄU OMNICHANNEL UTM)
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                          Trình Tạo Link Chiến Dịch UTM & Mã QR In Dán Tại Homestay / Nhà Xe
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Gắn link UTM này vào Bio TikTok, bài đăng Fanpage hoặc in mã QR tại quầy lễ tân để đo chính xác số lượng khách truy cập từ từng kênh.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">Kênh nguồn phát tán (utm_source)</label>
                          <select
                            value={adminUtmSource}
                            onChange={(e) => setAdminUtmSource(e.target.value as any)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
                          >
                            <option value="tiktok">🎵 TikTok Bio & Video Săn Mây</option>
                            <option value="fb_page">📘 Facebook Fanpage Chính Thức</option>
                            <option value="fb_group">👥 Facebook Group Cộng Đồng</option>
                            <option value="zalo_oa">💬 Zalo OA (Bản tin 6h sáng)</option>
                            <option value="zalo_group">🟢 Nhóm Zalo Ghép Chuyến</option>
                            <option value="qr_offline">🖨️ Tem QR Dán Quầy Homestay / Xe Khách</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">Tên chiến dịch (utm_campaign)</label>
                          <input
                            type="text"
                            value={adminUtmCampaign}
                            onChange={(e) => setAdminUtmCampaign(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-teal-300"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-mono text-xs text-emerald-300 break-all">{adminUtmUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(adminUtmUrl);
                            setAdminCopiedUtm(true);
                            setTimeout(() => setAdminCopiedUtm(false), 2000);
                            showAdminToast('✅ Đã sao chép Link UTM chiến dịch!');
                          }}
                          className="shrink-0 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {adminCopiedUtm ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{adminCopiedUtm ? 'Đã chép UTM' : 'Sao chép Link UTM'}</span>
                        </button>
                      </div>

                      <div className="bg-slate-850 border border-slate-750 rounded-xl p-3.5 flex items-center gap-4">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                            adminUtmUrl
                          )}`}
                          alt="UTM QR Code"
                          className="w-20 h-20 rounded-xl bg-white p-1 shrink-0"
                        />
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-white">Mã QR Chiến Dịch ({adminUtmSource})</div>
                          <p className="text-slate-400">
                            Dùng mã QR này để in Standee đặt tại quầy lễ tân 179 Homestay hoặc gắn cuối video TikTok dẫn khách vào thẳng Cộng Đồng Tà Xùa Trip.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-teal-400 uppercase">
                          CHECKLIST VẬN HÀNH PHỄU CỘNG ĐỒNG 30 NGÀY (DÀNH CHO ADMIN)
                        </span>
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                          {adminLaunchChecklist.filter((i) => i.done).length}/{adminLaunchChecklist.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {adminLaunchChecklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-850 border border-slate-750 cursor-pointer hover:bg-slate-800 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() =>
                                setAdminLaunchChecklist((prev) =>
                                  prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x))
                                )
                              }
                              className="mt-0.5 accent-teal-500"
                            />
                            <span className={item.done ? 'line-through text-slate-500' : 'text-slate-200 font-semibold'}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* PHÂN KHU CMS 2: HERO, ẢNH NỀN & BANNER TRANG CHỦ */}
            {cmsSubTab === 'hero_banners' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide block">
                        Cấu Hình Khối Đầu Trang (Hero Section & Ảnh Nền Chính)
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tự động lưu & đồng bộ tức thì ra ngoài website khi gõ hoặc xóa. Xóa trống ô nào thì ô đó sẽ ẩn hoàn toàn trên giao diện.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next: SiteContentConfig = {
                            ...cmsConfig,
                            heroBadge: '🏔️ Cổng đặt phòng & thông tin Tà Xùa',
                            heroTitle: 'TÀ XÙA TRIP',
                            heroHeading: 'TÀ XÙA TRIP',
                            heroSubtitle: 'Đi thật. Biết trước.',
                            heroSubheading: 'Đi thật. Biết trước.',
                            heroDescription: '',
                            heroBackgroundImage:
                              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'
                          };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                          showAdminToast('✅ Đã đặt lại cấu hình Hero chuẩn (Đã xóa trống mô tả chi tiết)!');
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
                      >
                        Khôi phục chuẩn (Ẩn mô tả)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Nhãn Badge trên cùng</label>
                      <input
                        type="text"
                        value={cmsConfig.heroBadge ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...cmsConfig, heroBadge: val };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                        }}
                        placeholder="Để trống nếu muốn ẩn huy hiệu này"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Tiêu đề lớn (Hero Title)</label>
                      <input
                        type="text"
                        value={cmsConfig.heroTitle ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...cmsConfig, heroTitle: val, heroHeading: val };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Slogan nghệ thuật (Subtitle)</label>
                      <input
                        type="text"
                        value={cmsConfig.heroSubtitle ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...cmsConfig, heroSubtitle: val, heroSubheading: val };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400 block">
                        Mô tả chi tiết dưới tiêu đề Hero (Xóa trống sẽ ẩn hoàn toàn trên web)
                      </label>
                      {cmsConfig.heroDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...cmsConfig, heroDescription: '' };
                            setCmsConfig(next);
                            if (onUpdateSiteContent) onUpdateSiteContent(next);
                            showAdminToast('✅ Đã xóa trống mô tả Hero (Đã đồng bộ ẩn ra web)!');
                          }}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          ✕ Xóa sạch mô tả này
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={cmsConfig.heroDescription ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const next = { ...cmsConfig, heroDescription: val };
                        setCmsConfig(next);
                        if (onUpdateSiteContent) onUpdateSiteContent(next);
                      }}
                      placeholder="Để trống ô này để ẩn hoàn toàn đoạn mô tả dưới tiêu đề Hero trên trang chủ..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                    <div className="sm:col-span-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 block">
                          URL Ảnh Nền Hero Trang Chủ (`heroBackgroundImage`)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminTab('revid_api_gateway');
                            setRevidSubSection('live_playground');
                          }}
                          className="text-xs font-extrabold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>✨ Tạo ảnh 2K bằng RevidAPI (`nano-banana-pro`) →</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cmsConfig.heroBackgroundImage ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = { ...cmsConfig, heroBackgroundImage: val };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                        }}
                        placeholder="Dán link ảnh nền trang chủ..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />

                      {/* Chọn nhanh ảnh nền mẫu chất lượng cao */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-xs text-slate-400 font-bold">Gợi ý ảnh Tà Xùa 2K:</span>
                        {[
                          {
                            label: '🌅 Bình minh Đỉnh Gió',
                            url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'
                          },
                          {
                            label: '☁️ Biển mây Sống Lưng',
                            url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80'
                          },
                          {
                            label: '🌲 Hoàng hôn Háng Đồng',
                            url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80'
                          }
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              const next = { ...cmsConfig, heroBackgroundImage: preset.url };
                              setCmsConfig(next);
                              if (onUpdateSiteContent) onUpdateSiteContent(next);
                              showAdminToast(`✅ Đã chọn ảnh nền "${preset.label}"!`);
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-teal-300 px-2 py-0.5 rounded-lg border border-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {cmsConfig.heroBackgroundImage && (
                      <div className="rounded-xl overflow-hidden border border-slate-700 h-24 relative shadow-md">
                        <img src={cmsConfig.heroBackgroundImage} alt="Hero BG" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-xs text-emerald-300 px-1.5 py-0.5 rounded-md font-mono">
                          Live Web
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danh sách Banner Quảng Bá / 3+ Thẻ Điểm Nhấn Trang Chủ (Điểm Săn Mây Đỉnh Nhất, Combo Tiết Kiệm, Ẩm Thực & Cafe Đỉnh Gió...) */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold text-teal-400 uppercase tracking-wide block">
                        Quản Trị 3+ Thẻ Điểm Nhấn Hero (Điểm Săn Mây Đỉnh Nhất • Combo Tiết Kiệm • Ẩm Thực & Cafe Đỉnh Gió)
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Thêm mới, sửa nhãn huy hiệu (`badgeText`), tiêu đề, mô tả, ảnh nền và chọn đích đến khi khách bấm vào từng thẻ trên Hero.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCmsSubTab('curated_combos')}
                      className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold px-3.5 py-2 rounded-xl cursor-pointer shrink-0"
                    >
                      📦 Quản Lý Các Gói Combo & Trekking ({(cmsConfig.curatedCombos || []).length}) →
                    </button>
                  </div>

                  {/* Form thêm Thẻ Điểm Nhấn Hero mới */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                    <span className="text-xs font-bold text-slate-200 block">+ Thêm Thẻ Điểm Nhấn Mới Trên Hero</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={newHeroSlide.badgeText || ''}
                        onChange={(e) => setNewHeroSlide({ ...newHeroSlide, badgeText: e.target.value })}
                        placeholder="Nhãn đầu thẻ (VD: 🔥 Điểm Săn Mây Đỉnh Nhất)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold"
                      />
                      <input
                        type="text"
                        value={newHeroSlide.title || ''}
                        onChange={(e) => setNewHeroSlide({ ...newHeroSlide, title: e.target.value })}
                        placeholder="Tiêu đề chính (VD: Mùa Biển Mây Đạt Đỉnh 90%)..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newHeroSlide.imageUrl || ''}
                        onChange={(e) => setNewHeroSlide({ ...newHeroSlide, imageUrl: e.target.value })}
                        placeholder="URL Hình ảnh thu nhỏ..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={newHeroSlide.targetTab || 'map'}
                        onChange={(e) => setNewHeroSlide({ ...newHeroSlide, targetTab: e.target.value as any })}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300 font-bold"
                      >
                        <option value="map">Đích đến: Bản đồ & Tọa độ săn mây</option>
                        <option value="combo">Đích đến: Khu vực Gói Combo & Trekking</option>
                        <option value="transport">Đích đến: Mở Đặt Vé Xe + Xe Máy</option>
                        <option value="food">Đích đến: Ẩm Thực & Cafe Đỉnh Gió</option>
                        <option value="stay">Đích đến: Lưu trú Homestay</option>
                        <option value="motorbike">Đích đến: Trạm Xe Máy Tà Xùa Biker</option>
                        <option value="cloud">Đích đến: Dự báo Săn mây</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        type="text"
                        value={newHeroSlide.description || ''}
                        onChange={(e) => setNewHeroSlide({ ...newHeroSlide, description: e.target.value })}
                        placeholder="Mô tả dòng dưới (VD: Trải nghiệm Đỉnh Gió - Sống Lưng Khủng Long - Thảo Nguyên...)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newHeroSlide.title?.trim()) return;
                          const slide: HeroBannerSlide = {
                            id: `hb-${Date.now()}`,
                            badgeText: newHeroSlide.badgeText || '🔥 Điểm Nhấn Tà Xùa',
                            title: newHeroSlide.title.trim(),
                            subtitle: newHeroSlide.subtitle || newHeroSlide.description || '',
                            description: newHeroSlide.description || '',
                            imageUrl:
                              newHeroSlide.imageUrl ||
                              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
                            ctaText: newHeroSlide.ctaText || 'Khám phá ngay',
                            targetTab: newHeroSlide.targetTab || 'map',
                            sortOrder: (cmsConfig.heroBanners || []).length + 1,
                            isActive: true
                          };
                          const next = {
                            ...cmsConfig,
                            heroBanners: [...(cmsConfig.heroBanners || []), slide]
                          };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                          setNewHeroSlide({
                            ...newHeroSlide,
                            badgeText: '🔥 Điểm Săn Mây Đỉnh Nhất',
                            title: '',
                            subtitle: '',
                            description: ''
                          });
                          showAdminToast('✅ Đã thêm thẻ Điểm Nhấn mới lên Hero trang chủ!');
                        }}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                      >
                        + Thêm Thẻ Điểm Nhấn
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các Thẻ Điểm Nhấn đang có */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(cmsConfig.heroBanners || []).map((hb, idx) => (
                      <div
                        key={hb.id}
                        className={`bg-slate-850 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                          hb.isActive !== false ? 'border-slate-700' : 'border-slate-800 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="relative h-32">
                            <img src={hb.imageUrl} alt={hb.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="bg-slate-950/85 text-amber-300 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-amber-500/30">
                                Thẻ #{hb.sortOrder ?? idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                      x.id === hb.id ? { ...x, isActive: x.isActive === false ? true : false } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                                  hb.isActive !== false
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {hb.isActive !== false ? 'Đang hiện' : 'Đang ẩn'}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = {
                                  ...cmsConfig,
                                  heroBanners: (cmsConfig.heroBanners || []).filter((x) => x.id !== hb.id)
                                };
                                setCmsConfig(next);
                                if (onUpdateSiteContent) onUpdateSiteContent(next);
                              }}
                              className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg cursor-pointer"
                              title="Xóa Thẻ này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-3.5 space-y-2">
                            <div>
                              <label className="text-xs text-slate-400 block mb-0.5">Nhãn đầu thẻ (`badgeText`)</label>
                              <input
                                type="text"
                                value={hb.badgeText || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                      x.id === hb.id ? { ...x, badgeText: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-amber-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-0.5">Tiêu đề chính (`title`)</label>
                              <input
                                type="text"
                                value={hb.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                      x.id === hb.id ? { ...x, title: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-0.5">Mô tả ngắn (`description`)</label>
                              <input
                                type="text"
                                value={hb.description || hb.subtitle || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                      x.id === hb.id ? { ...x, description: val, subtitle: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-teal-300"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                <label className="text-xs text-slate-400 block mb-0.5">Đích đến khi click</label>
                                <select
                                  value={hb.targetTab || 'map'}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    const next = {
                                      ...cmsConfig,
                                      heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                        x.id === hb.id ? { ...x, targetTab: val } : x
                                      )
                                    };
                                    setCmsConfig(next);
                                    if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-200 font-bold"
                                >
                                  <option value="map">Bản đồ & Săn mây</option>
                                  <option value="combo">Gói Combo & Trekking</option>
                                  <option value="transport">Đặt Vé Xe + Xe Máy</option>
                                  <option value="food">Ẩm Thực & Cafe Đỉnh Gió</option>
                                  <option value="stay">Lưu trú Homestay</option>
                                  <option value="motorbike">Trạm Xe Máy Biker</option>
                                  <option value="cloud">Dự báo Săn mây</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-0.5">Thứ tự</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={hb.sortOrder ?? idx + 1}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 1;
                                    const next = {
                                      ...cmsConfig,
                                      heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                        x.id === hb.id ? { ...x, sortOrder: val } : x
                                      )
                                    };
                                    setCmsConfig(next);
                                    if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-0.5">URL Ảnh thu nhỏ</label>
                              <input
                                type="text"
                                value={hb.imageUrl}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    heroBanners: (cmsConfig.heroBanners || []).map((x) =>
                                      x.id === hb.id ? { ...x, imageUrl: val } : x
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                placeholder="URL ảnh banner..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PHÂN KHU CMS 2B: QUẢN TRỊ CÁC GÓI COMBO GỢI Ý & TOUR TREKKING ĐẶC BIỆT */}
            {cmsSubTab === 'curated_combos' && (
              <div className="space-y-5">
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                        <span>📦 Quản Lý Hệ Thống "Combo Gợi Ý & Tour Trekking Đặc Biệt" Trên Trang Khám Phá</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tạo gói đặc biệt tùy chỉnh, ghim thứ tự ưu tiên hiển thị đầu trang (`priorityOrder`), điều chỉnh giá ưu đãi, quyền lợi đi kèm và đích hành động khi khách đặt gói.
                      </p>
                    </div>
                  </div>

                  {/* Form tạo Gói Combo / Trekking mới */}
                  <div className="bg-slate-850 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                    <span className="text-xs font-extrabold text-amber-300 block">
                      + Tạo Gói Combo Săn Mây / Tour Trekking Ưu Tiên Mới
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newComboForm.title || ''}
                        onChange={(e) => setNewComboForm({ ...newComboForm, title: e.target.value })}
                        placeholder="Tên gói Combo (VD: Combo 2N1Đ Cabin Đôi + Homestay Đỉnh Gió)..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                      <input
                        type="text"
                        value={newComboForm.badgeText || ''}
                        onChange={(e) => setNewComboForm({ ...newComboForm, badgeText: e.target.value })}
                        placeholder="Nhãn nổi bật (VD: 🔥 Bán chạy #1 - Tiết kiệm 250k)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold"
                      />
                      <select
                        value={newComboForm.category || 'combo_2n1d'}
                        onChange={(e) => setNewComboForm({ ...newComboForm, category: e.target.value as any })}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-300 font-bold"
                      >
                        <option value="combo_2n1d">🎁 Combo Trọn Gói 2N1Đ (Xe + Phòng + Xe Máy)</option>
                        <option value="bus_motorbike">🚌 Combo Vé Xe + Xe Máy Giao Tận Nơi</option>
                        <option value="trekking_tour">🥾 Tour Trekking & Porter Bản Địa Thẩm Định</option>
                        <option value="cloud_dining">🍲 Combo Săn Mây + Ẩm Thực & Cafe Đỉnh Gió</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-0.5">Giá ưu đãi (VNĐ)</label>
                        <input
                          type="number"
                          value={newComboForm.comboPrice || 1250000}
                          onChange={(e) => setNewComboForm({ ...newComboForm, comboPrice: Number(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-extrabold"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-0.5">Giá gốc (VNĐ)</label>
                        <input
                          type="number"
                          value={newComboForm.originalPrice || 1500000}
                          onChange={(e) => setNewComboForm({ ...newComboForm, originalPrice: Number(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-0.5">Đơn vị tính</label>
                        <input
                          type="text"
                          value={newComboForm.unit || 'người'}
                          onChange={(e) => setNewComboForm({ ...newComboForm, unit: e.target.value })}
                          placeholder="người / cặp đôi"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-0.5">Thời lượng</label>
                        <input
                          type="text"
                          value={newComboForm.duration || '2 Ngày 1 Đêm'}
                          onChange={(e) => setNewComboForm({ ...newComboForm, duration: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-amber-300 font-bold block mb-0.5">Thứ tự ưu tiên (1 = Top 1)</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={newComboForm.priorityOrder ?? 1}
                          onChange={(e) =>
                            setNewComboForm({ ...newComboForm, priorityOrder: Math.max(1, Number(e.target.value) || 1) })
                          }
                          className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-extrabold text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newComboForm.imageUrl || ''}
                        onChange={(e) => setNewComboForm({ ...newComboForm, imageUrl: e.target.value })}
                        placeholder="URL Ảnh bìa gói Combo..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newComboForm.summary || ''}
                        onChange={(e) => setNewComboForm({ ...newComboForm, summary: e.target.value })}
                        placeholder="Mô tả tóm tắt gói (VD: Đón 22h Hà Nội • Săn mây Đỉnh Gió • Sống Lưng)..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <select
                        value={newComboForm.actionType || 'open_bus_combo'}
                        onChange={(e) => setNewComboForm({ ...newComboForm, actionType: e.target.value as any })}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 font-bold"
                      >
                        <option value="open_bus_combo">Hành động CTA: Mở Đặt Vé Xe + Xe Máy</option>
                        <option value="open_ai_advisor">Hành động CTA: Mở AI Lên Lịch Trình & Giữ Combo</option>
                        <option value="open_listing">Hành động CTA: Mở Hồ Sơ Cơ Sở Liên Kết</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <input
                        type="text"
                        value={newComboItemsText}
                        onChange={(e) => setNewComboItemsText(e.target.value)}
                        placeholder="Các quyền lợi bao gồm (ngăn cách bằng dấu chấm phẩy ; hoặc xuống dòng)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-teal-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newComboForm.title?.trim()) return;
                          const created: CuratedComboPackage = {
                            id: `combo-${Date.now()}`,
                            title: newComboForm.title.trim(),
                            badgeText: newComboForm.badgeText || '👑 Admin Đề Xuất',
                            category: (newComboForm.category as any) || 'combo_2n1d',
                            duration: newComboForm.duration || '2 Ngày 1 Đêm',
                            area: (newComboForm.area as any) || 'Đỉnh Gió',
                            comboPrice: Number(newComboForm.comboPrice) || 1150000,
                            originalPrice: Number(newComboForm.originalPrice) || 1450000,
                            unit: newComboForm.unit || 'người',
                            imageUrl:
                              newComboForm.imageUrl ||
                              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
                            summary:
                              newComboForm.summary ||
                              'Gói ưu tiên do Admin Tà Xùa Trip thẩm định giá và dịch vụ.',
                            includedItems: newComboItemsText
                              .split(/[;\n]/)
                              .map((s: string) => s.trim())
                              .filter(Boolean),
                            linkedListingId: newComboForm.linkedListingId || 'homestay-may',
                            actionType: (newComboForm.actionType as any) || 'open_bus_combo',
                            priorityOrder: Number(newComboForm.priorityOrder) || 1,
                            isPinnedFeatured: true,
                            isActive: true
                          };
                          const next = {
                            ...cmsConfig,
                            curatedCombos: [created, ...(cmsConfig.curatedCombos || [])]
                          };
                          setCmsConfig(next);
                          if (onUpdateSiteContent) onUpdateSiteContent(next);
                          setNewComboForm({ ...newComboForm, title: '', summary: '' });
                          showAdminToast(`🎁 Đã tạo gói "${created.title}" và ghim lên trang Khám Phá!`);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer shadow"
                      >
                        + Thêm Gói Combo Đặc Biệt
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các Gói Combo & Trekking hiện có */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...(cmsConfig.curatedCombos || [])]
                      .sort((a, b) => (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99))
                      .map((pkg) => (
                        <div
                          key={pkg.id}
                          className={`bg-slate-850 border rounded-2xl p-4 space-y-3 transition-all ${
                            pkg.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={pkg.imageUrl}
                                alt={pkg.title}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold px-2 py-0.5 rounded-full">
                                    Ưu tiên #{pkg.priorityOrder}
                                  </span>
                                  <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pkg.duration}
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={pkg.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const next = {
                                      ...cmsConfig,
                                      curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                        c.id === pkg.id ? { ...c, title: val } : c
                                      )
                                    };
                                    setCmsConfig(next);
                                    if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, isActive: !c.isActive } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                                  pkg.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {pkg.isActive ? 'Đang bật' : 'Đang tắt'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).filter((c) => c.id !== pkg.id)
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                  showAdminToast(`🗑️ Đã xóa gói "${pkg.title}"`);
                                }}
                                className="bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white p-1.5 rounded-lg cursor-pointer"
                                title="Xóa gói Combo này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="text-xs text-slate-400 block">Giá bán (VNĐ)</label>
                              <input
                                type="number"
                                value={pkg.comboPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, comboPrice: val } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-extrabold text-emerald-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">Giá gốc (VNĐ)</label>
                              <input
                                type="number"
                                value={pkg.originalPrice || pkg.comboPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, originalPrice: val } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-amber-300 font-bold block">Thứ tự ưu tiên</label>
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={pkg.priorityOrder}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, priorityOrder: val } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-xs font-extrabold text-amber-300 text-center"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">Ghim đầu trang</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, isPinnedFeatured: !c.isPinnedFeatured } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className={`w-full py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                                  pkg.isPinnedFeatured
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-900 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {pkg.isPinnedFeatured ? '👑 Đang Ghim' : 'Bình thường'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-slate-400 block">Nhãn Badge nổi bật</label>
                              <input
                                type="text"
                                value={pkg.badgeText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, badgeText: val } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block">Quyền lợi bao gồm (ngăn cách dấu ;)</label>
                              <input
                                type="text"
                                value={(pkg.includedItems || []).join('; ')}
                                onChange={(e) => {
                                  const list = e.target.value
                                    .split(';')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  const next = {
                                    ...cmsConfig,
                                    curatedCombos: (cmsConfig.curatedCombos || []).map((c) =>
                                      c.id === pkg.id ? { ...c, includedItems: list } : c
                                    )
                                  };
                                  setCmsConfig(next);
                                  if (onUpdateSiteContent) onUpdateSiteContent(next);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-teal-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* PHÂN KHU CMS 2: BANNER & NỘI DUNG CÁC CHUYÊN MỤC */}
            {cmsSubTab === 'section_banners' && (
              <div className="space-y-4">
                {(cmsConfig.sectionBanners || []).map((sec) => (
                  <div
                    key={sec.id}
                    className="bg-slate-900 border border-slate-750 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                  >
                    <div className="relative h-28 rounded-xl overflow-hidden border border-slate-700">
                      <img src={sec.bannerImageUrl} alt={sec.sectionName} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 text-teal-300 text-xs font-bold px-2 py-0.5 rounded">
                        {sec.sectionName}
                      </span>
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block">Tiêu đề chuyên mục ({sec.sectionKey})</label>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCmsConfig({
                                ...cmsConfig,
                                sectionBanners: (cmsConfig.sectionBanners || []).map((x) =>
                                  x.id === sec.id ? { ...x, title: val } : x
                                )
                              });
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block">URL Ảnh Banner Chuyên Mục</label>
                          <input
                            type="text"
                            value={sec.bannerImageUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCmsConfig({
                                ...cmsConfig,
                                sectionBanners: (cmsConfig.sectionBanners || []).map((x) =>
                                  x.id === sec.id ? { ...x, bannerImageUrl: val } : x
                                )
                              });
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block">Mô tả chuyên mục hiển thị dưới tiêu đề</label>
                        <input
                          type="text"
                          value={sec.subtitle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCmsConfig({
                              ...cmsConfig,
                              sectionBanners: (cmsConfig.sectionBanners || []).map((x) =>
                                x.id === sec.id ? { ...x, subtitle: val } : x
                              )
                            });
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHÂN KHU CMS 3: DẢI BĂNG CẢNH BÁO ĐÈO & SƯƠNG MÙ KHẨN CẤP */}
            {cmsSubTab === 'emergency_alert' && (
              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Dải Băng Cảnh Báo Đường Đèo & Thời Tiết Khẩn Cấp (Hiển Thị Trên Đầu Website)</span>
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      checked={cmsConfig.emergencyBanner.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCmsConfig((prev) => ({
                          ...prev,
                          alertEnabled: checked,
                          emergencyBanner: { ...prev.emergencyBanner, enabled: checked }
                        }));
                      }}
                      className="rounded text-teal-500"
                    />
                    <span>{cmsConfig.emergencyBanner.enabled ? 'Đang Bật Cảnh Báo' : 'Đang Tắt'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mức độ cảnh báo</label>
                    <select
                      value={cmsConfig.emergencyBanner.severity}
                      onChange={(e) => {
                        const val = e.target.value as 'info' | 'warning' | 'danger';
                        setCmsConfig((prev) => ({
                          ...prev,
                          alertLevel: val,
                          emergencyBanner: { ...prev.emergencyBanner, severity: val }
                        }));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="info">Thông tin mùa săn mây (Xanh)</option>
                      <option value="warning">Cảnh báo sương mù & trơn trượt (Vàng)</option>
                      <option value="danger">Khẩn cấp sạt lở / cấm đèo (Đỏ)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Tiêu đề cảnh báo</label>
                    <input
                      type="text"
                      value={cmsConfig.emergencyBanner.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCmsConfig((prev) => ({
                          ...prev,
                          emergencyBanner: { ...prev.emergencyBanner, title: val }
                        }));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nội dung chi tiết thông điệp cảnh báo</label>
                  <textarea
                    rows={2}
                    value={cmsConfig.emergencyBanner.message}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCmsConfig((prev) => ({
                        ...prev,
                        alertText: val,
                        emergencyBanner: { ...prev.emergencyBanner, message: val }
                      }));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* PHÂN KHU CMS 4: ĐIỂM SĂN MÂY & BẢN ĐỒ (THÊM / SỬA / XÓA ẢNH & NỘI DUNG) */}
            {cmsSubTab === 'cloud_landmarks' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-extrabold text-teal-400 uppercase block">
                    + Thêm Điểm Săn Mây Mới Lên Website
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      value={newLandmarkForm.name || ''}
                      onChange={(e) => setNewLandmarkForm({ ...newLandmarkForm, name: e.target.value })}
                      placeholder="Tên tọa độ săn mây..."
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={newLandmarkForm.area || 'Đỉnh Gió'}
                      onChange={(e) => setNewLandmarkForm({ ...newLandmarkForm, area: e.target.value as LocationArea })}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {LOCATION_AREAS.map((ar) => (
                        <option key={ar} value={ar}>
                          {ar}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newLandmarkForm.altitude || '1.800m'}
                      onChange={(e) => setNewLandmarkForm({ ...newLandmarkForm, altitude: e.target.value })}
                      placeholder="Độ cao (VD: 2.100m)"
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newLandmarkForm.imageUrl || ''}
                      onChange={(e) => setNewLandmarkForm({ ...newLandmarkForm, imageUrl: e.target.value })}
                      placeholder="URL ảnh thực tế..."
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLandmarkForm.description || ''}
                      onChange={(e) => setNewLandmarkForm({ ...newLandmarkForm, description: e.target.value })}
                      placeholder="Mô tả kinh nghiệm săn mây & đường đi..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newLandmarkForm.name?.trim()) return;
                        const lm: CloudLandmark = {
                          id: `lm-${Date.now()}`,
                          name: newLandmarkForm.name.trim(),
                          area: (newLandmarkForm.area as LocationArea) || 'Đỉnh Gió',
                          altitude: newLandmarkForm.altitude || '1.850m',
                          cloudProbability: Number(newLandmarkForm.cloudProbability) || 85,
                          bestTime: newLandmarkForm.bestTime || '05:30 - 07:30',
                          description: newLandmarkForm.description || 'Điểm săn mây tầm nhìn thoáng rộng.',
                          roadCondition: newLandmarkForm.roadCondition || 'Đường bê tông xe máy & ô tô đi tốt',
                          distanceFromCenter: newLandmarkForm.distanceFromCenter || '3km',
                          coordinates: { lat: 21.326, lng: 104.476 },
                          imageUrl:
                            newLandmarkForm.imageUrl ||
                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
                        };
                        const next = [lm, ...cmsLandmarks];
                        setCmsLandmarks(next);
                        if (onUpdateLandmarks) onUpdateLandmarks(next);
                        setNewLandmarkForm({ ...newLandmarkForm, name: '', description: '' });
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      + Thêm Điểm Săn Mây
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cmsLandmarks.map((lm) => (
                    <div key={lm.id} className="bg-slate-900 border border-slate-750 rounded-2xl p-4 flex gap-3.5">
                      <img src={lm.imageUrl} alt={lm.name} className="w-24 h-24 rounded-xl object-cover shrink-0 border border-slate-700" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <input
                            type="text"
                            value={lm.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const next = cmsLandmarks.map((x) => (x.id === lm.id ? { ...x, name: val } : x));
                              setCmsLandmarks(next);
                              if (onUpdateLandmarks) onUpdateLandmarks(next);
                            }}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = cmsLandmarks.filter((x) => x.id !== lm.id);
                              setCmsLandmarks(next);
                              if (onUpdateLandmarks) onUpdateLandmarks(next);
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Xóa điểm săn mây"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={lm.imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = cmsLandmarks.map((x) => (x.id === lm.id ? { ...x, imageUrl: val } : x));
                            setCmsLandmarks(next);
                            if (onUpdateLandmarks) onUpdateLandmarks(next);
                          }}
                          placeholder="URL ảnh..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                        />
                        <input
                          type="text"
                          value={lm.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = cmsLandmarks.map((x) => (x.id === lm.id ? { ...x, description: val } : x));
                            setCmsLandmarks(next);
                            if (onUpdateLandmarks) onUpdateLandmarks(next);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHÂN KHU CMS 5: BẢN TIN DỰ BÁO THỜI TIẾT & XÁC SUẤT MÂY */}
            {cmsSubTab === 'weather_forecasts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cmsForecasts.map((fc, idx) => (
                  <div key={fc.location + idx} className="bg-slate-900 border border-slate-750 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-300 text-sm">{fc.location}</span>
                      <span className="text-xs font-bold bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full">
                        Xác suất mây: {fc.cloudProbability}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-xs text-slate-400 block">Tỷ lệ mây (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={fc.cloudProbability}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = cmsForecasts.map((x, i) => (i === idx ? { ...x, cloudProbability: val } : x));
                            setCmsForecasts(next);
                            if (onUpdateForecasts) onUpdateForecasts(next);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block">Nhiệt độ thấp (°C)</label>
                        <input
                          type="number"
                          value={fc.tempMin}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = cmsForecasts.map((x, i) => (i === idx ? { ...x, tempMin: val } : x));
                            setCmsForecasts(next);
                            if (onUpdateForecasts) onUpdateForecasts(next);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block">Nhiệt độ cao (°C)</label>
                        <input
                          type="number"
                          value={fc.tempMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const next = cmsForecasts.map((x, i) => (i === idx ? { ...x, tempMax: val } : x));
                            setCmsForecasts(next);
                            if (onUpdateForecasts) onUpdateForecasts(next);
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block">Lời khuyên thực địa hiển thị cho du khách</label>
                      <input
                        type="text"
                        value={fc.advice}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next = cmsForecasts.map((x, i) => (i === idx ? { ...x, advice: val } : x));
                          setCmsForecasts(next);
                          if (onUpdateForecasts) onUpdateForecasts(next);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHÂN KHU CMS 6: BÀI VIẾT CỘNG ĐỒNG & THÔNG TIN FOOTER / CỨU HỘ */}
            {cmsSubTab === 'community_footer' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-extrabold text-teal-400 uppercase block">
                    + Đăng Bài Viết / Thông Báo Mới Lên Cộng Đồng Tà Xùa
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={newPostForm.title || ''}
                      onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })}
                      placeholder="Tiêu đề bài viết..."
                      className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newPostForm.imageUrl || ''}
                      onChange={(e) => setNewPostForm({ ...newPostForm, imageUrl: e.target.value })}
                      placeholder="URL ảnh đính kèm (nếu có)..."
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPostForm.content || ''}
                      onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
                      placeholder="Nội dung chi tiết bài viết..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPostForm.title?.trim()) return;
                        const p: CommunityPost = {
                          id: `post-${Date.now()}`,
                          authorName: newPostForm.authorName || 'Admin Tà Xùa Trip',
                          authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                          isVerifiedMember: true,
                          type: 'road_alert',
                          title: newPostForm.title.trim(),
                          content: newPostForm.content || '',
                          imageUrl: newPostForm.imageUrl,
                          contactPhone: newPostForm.contactPhone || '0981 119 115',
                          likes: 12,
                          commentsCount: 0,
                          createdAt: 'Vừa xong',
                          isPinned: true
                        };
                        const next = [p, ...cmsPosts];
                        setCmsPosts(next);
                        if (onUpdateCommunityPosts) onUpdateCommunityPosts(next);
                        setNewPostForm({ ...newPostForm, title: '', content: '', imageUrl: '' });
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      + Đăng Bài
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    {cmsPosts.map((po) => (
                      <div
                        key={po.id}
                        className="bg-slate-850 border border-slate-750 p-3 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white">{po.title}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{po.content}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = cmsPosts.filter((x) => x.id !== po.id);
                            setCmsPosts(next);
                            if (onUpdateCommunityPosts) onUpdateCommunityPosts(next);
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1.5 cursor-pointer"
                          title="Xóa bài viết"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cấu hình Footer & Hotline Cứu Hộ */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-extrabold text-teal-400 uppercase block">
                    Cấu Hình Thông Tin Chân Trang (Footer) & Hotline Cứu Hộ Đèo 24/7
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Slogan Chân Trang</label>
                      <input
                        type="text"
                        value={cmsConfig.footerConfig?.brandTagline || ''}
                        onChange={(e) =>
                          setCmsConfig({
                            ...cmsConfig,
                            footerConfig: {
                              ...(cmsConfig.footerConfig || INITIAL_SITE_CONTENT.footerConfig!),
                              brandTagline: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Hotline Cứu Hộ Khẩn Cấp 24/7</label>
                      <input
                        type="text"
                        value={cmsConfig.footerConfig?.rescueHotline || ''}
                        onChange={(e) =>
                          setCmsConfig({
                            ...cmsConfig,
                            footerConfig: {
                              ...(cmsConfig.footerConfig || INITIAL_SITE_CONTENT.footerConfig!),
                              rescueHotline: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: AI CHATBOT STUDIO & QUẢN LÝ RAG (THEO YÊU CẦU 2)
           ======================================================== */}
        {adminTab === 'ai_studio' && featureOpen('aiGateway') && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-teal-400" />
                    <span>AI Chatbot Studio: Gán Vai Trò, Tính Cách & File Kiến Thức (RAG)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kiểm soát hành vi, tính cách chuyên biệt cho từng trợ lý AI và giám sát lịch sử tương tác giữa các Member.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingKnowledge(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tải File Kiến Thức Mới</span>
                  </button>
                </div>
              </div>

              {/* Bộ Chọn Chatbot Để Cấu Hình */}
              <div className="flex flex-wrap gap-2">
                {chatbots.map((bot) => {
                  const isSel = bot.id === selectedBotId;
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => setSelectedBotId(bot.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500'
                          : 'bg-slate-900 border-slate-750 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bot.themeColor }} />
                        <span className="text-white font-extrabold">{bot.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Tính cách: <strong className="text-teal-300">{bot.personaTone}</strong> • RAG: {(bot.knowledgeFileIds || []).length} file
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* FORM CẤU HÌNH VAI TRÒ & TÍNH CÁCH CHO CHATBOT ĐANG CHỌN */}
              <form onSubmit={handleSaveBotConfig} className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                    Cấu Hình Chi Tiết: {activeBot.name}
                  </span>
                  <span className="text-xs text-slate-400">ID: {activeBot.id}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Vai trò hiển thị (Role Title)</label>
                    <input
                      type="text"
                      value={activeBot.roleTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, roleTitle: val } : b));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Tính cách & Giọng điệu (Persona Tone)</label>
                    <select
                      value={activeBot.personaTone}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, personaTone: val } : b));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="friendly">Thân thiện, gần gũi như người bản địa (Friendly)</option>
                      <option value="professional">Chuyên nghiệp, chính xác, lịch thiệp (Professional)</option>
                      <option value="enthusiastic">Nhiệt huyết, truyền cảm hứng xê dịch (Enthusiastic)</option>
                      <option value="concise">Ngắn gọn, súc tích, tập trung kết quả (Concise)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Màu sắc giao diện khung chat</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeBot.themeColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, themeColor: val } : b));
                        }}
                        className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400">{activeBot.themeColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Lời nhắc hệ thống chuyên sâu (System Prompt)</label>
                  <textarea
                    rows={3}
                    value={activeBot.systemPrompt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, systemPrompt: val } : b));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Lời chào mở đầu khi khách mở khung chat (Welcome Message)</label>
                  <input
                    type="text"
                    value={activeBot.welcomeMessage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, welcomeMessage: val } : b));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Kiểm Soát Tính Năng An Toàn (Checkboxes) */}
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">Kiểm soát tính năng bảo vệ hệ thống:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBot.autoQuoteEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, autoQuoteEnabled: val } : b));
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>Tự động báo giá chuẩn</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBot.hold30MinEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, hold30MinEnabled: val } : b));
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>Giữ chỗ 30 phút</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBot.maskPiiEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, maskPiiEnabled: val } : b));
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>Che PII (CCCD, SĐT)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeBot.blockInjectionEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, blockInjectionEnabled: val } : b));
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>Chặn Prompt Injection</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
                  >
                    Lưu Cấu Hình Chatbot
                  </button>
                </div>
              </form>

              {/* DANH SÁCH FILE KIẾN THỨC GÁN CHO CHATBOT (RAG KNOWLEDGE BASE) */}
              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Kho File Kiến Thức (Knowledge Base) Cho Chatbot</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Chatbot sẽ chỉ trả lời dựa trên các file kiến thức này, tuyệt đối không bịa đặt thông tin sai lệch.
                    </p>
                  </div>
                </div>

                {/* Form thêm file nếu đang mở */}
                {isAddingKnowledge && (
                  <form onSubmit={handleCreateKnowledgeFile} className="bg-slate-850 p-4 rounded-xl border border-teal-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400">Tải File Kiến Thức Mới Lên RAG</span>
                      <button type="button" onClick={() => setIsAddingKnowledge(false)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Tiêu đề tài liệu kiến thức *</label>
                      <input
                        type="text"
                        value={newFileTitle}
                        onChange={(e) => setNewFileTitle(e.target.value)}
                        placeholder="Ví dụ: Lịch chạy xe khách và số điện thoại nhà xe Tà Xùa"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Tóm tắt nội dung chính</label>
                      <input
                        type="text"
                        value={newFileSummary}
                        onChange={(e) => setNewFileSummary(e.target.value)}
                        placeholder="Tóm tắt ngắn gọn để AI định tuyến nhanh"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Nội dung văn bản (Markdown / Text)</label>
                      <textarea
                        rows={3}
                        value={newFileContent}
                        onChange={(e) => setNewFileContent(e.target.value)}
                        placeholder="Dán nội dung tài liệu kiến thức vào đây..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingKnowledge(false)} className="px-3 py-1.5 rounded-xl text-xs bg-slate-800 text-slate-300">
                        Hủy
                      </button>
                      <button type="submit" className="px-4 py-1.5 rounded-xl text-xs bg-teal-600 text-white font-bold cursor-pointer">
                        Lưu File Vào RAG
                      </button>
                    </div>
                  </form>
                )}

                {/* Danh sách các files */}
                <div className="space-y-2">
                  {knowledgeFiles.map((file) => {
                    const isAttached = (activeBot.knowledgeFileIds || []).includes(file.id);
                    return (
                      <div
                        key={file.id}
                        className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-teal-400 shrink-0" />
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{file.title || file.fileName}</span>
                              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {file.fileName} ({file.fileSize || '30 KB'})
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{file.summary || file.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const currentIds = activeBot.knowledgeFileIds || [];
                              const updatedIds = isAttached
                                ? currentIds.filter((id: string) => id !== file.id)
                                : [...currentIds, file.id];
                              setChatbots(chatbots.map(b => b.id === activeBot.id ? { ...b, knowledgeFileIds: updatedIds } : b));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                              isAttached
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            {isAttached ? '✓ Đang gán vào bot' : '+ Gán vào bot'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setKnowledgeFiles(knowledgeFiles.filter(f => f.id !== file.id))}
                            className="text-slate-500 hover:text-rose-400 p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GIÁM SÁT LỊCH SỬ TƯƠNG TÁC GIỮA CÁC MEMBER & CẢNH BÁO RỦI RO */}
              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Giám Sát Lịch Sử Tương Tác Hệ Thống & Radar Cảnh Báo Lừa Đảo</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tự động rà soát tin nhắn giữa Member ↔ Member, Member ↔ Đối tác để bảo vệ quyền lợi du khách.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Mã hóa SHA-256 Tamper-evident
                  </span>
                </div>

                <div className="space-y-2.5">
                  {interactionLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        log.isFlaggedScam
                          ? 'bg-rose-950/30 border-rose-600/50 text-rose-200'
                          : 'bg-slate-850 border-slate-750 text-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{log.senderName}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-teal-300 text-xs">{log.recipientName}</span>
                          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                            {log.channel === 'direct_chat' ? 'Chat Trực Tiếp' : log.channel === 'community' ? 'Cộng Đồng' : 'AI Concierge'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{log.timestamp}</span>
                      </div>

                      <p className="text-slate-200 text-xs italic bg-slate-900/60 p-2 rounded-lg">
                        "{log.messagePreview}"
                      </p>

                      {log.isFlaggedScam && (
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>CẢNH BÁO: {log.flagReason}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert(`Đã khóa quyền chat của đối tượng vi phạm: ${log.senderName}`)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Khóa Quyền Chat
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CỔNG BẢO MẬT 6 TRỢ LÝ AI (RLS) & CHỐNG PROMPT INJECTION (CHỈ HIỂN THỊ TRONG ADMIN) */}
              <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-teal-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>Ma Trận Cổng Kiểm Quyền 6 Trợ Lý AI (PostgreSQL RLS & PII Masking)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Đã chuyển từ trang Lịch trình Khách hàng về độc quyền trong Admin Studio để kiểm soát phân quyền dữ liệu và chống Prompt Injection.
                    </p>
                  </div>
                  <span className="text-xs text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Golden Set: Sai số giá/lịch = 0%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {[
                    {
                      name: '1. Concierge Khách',
                      role: 'Khách & Member',
                      tools: 'search_listings, check_availability, quote_price, create_hold(30m)',
                      rule: 'Giá và lịch chỉ lấy bằng truy vấn SQL từ DB; chặn 100% Prompt Injection đọc trộm chat người khác.'
                    },
                    {
                      name: '2. Trợ Lý Đối Tác',
                      role: 'Chủ cơ sở & Nhà xe',
                      tools: 'update_availability, suggest_price, draft_reply, translate',
                      rule: 'Lọc cứng theo provider_id ở tầng dữ liệu (RLS); giá đề xuất bắt buộc do chủ duyệt.'
                    },
                    {
                      name: '3. Admin Copilot',
                      role: 'CSKH & Admin',
                      tools: 'summarize_thread, find_similar_cases, query_warehouse',
                      rule: 'Chỉ đọc chat mức bằng chứng khi có ticket_id và đã ghi access_logs kèm lý do.'
                    },
                    {
                      name: '4. Bot Kiểm Duyệt',
                      role: 'Hệ thống tự động',
                      tools: 'classify_message, flag, mask_pii_before_embedding',
                      rule: 'Tự động che SĐT/CCCD trước khi tạo vector pgvector; khóa tài khoản do Moderator quyết định.'
                    },
                    {
                      name: '5. Trợ Lý Ghép Đi Chung',
                      role: 'Member xác minh OTP',
                      tools: 'match_trips, check_profile_trust',
                      rule: 'Ẩn hoàn toàn số điện thoại cá nhân ở tầng SQL trước khi hai bên bấm Chấp nhận.'
                    },
                    {
                      name: '6. Trợ Lý Nội Dung & SEO',
                      role: 'Đội nội dung',
                      tools: 'cluster_questions, draft_post',
                      rule: 'Gom nhóm câu hỏi từ kênh #hỏi-đáp đã ẩn danh 100%; bài đăng cần biên tập viên duyệt.'
                    }
                  ].map((ast, idx) => (
                    <div key={idx} className="bg-slate-850 border border-slate-750 rounded-xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-white">{ast.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                          {ast.role}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-sky-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">
                        {ast.tools}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{ast.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: TRỌNG TÀI KHIẾU NẠI & ĐỐI SOÁT BẰNG CHỨNG
           ======================================================== */}
        {adminTab === 'disputes' && <AdminFeedbackPanel />}

        {/* ========================================================
            TAB 5: VOUCHERS & TÍCH ĐIỂM
           ======================================================== */}
        {adminTab === 'vouchers_rewards' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-750 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <span>Quản Lý Mã Ưu Đãi Voucher ({vouchers.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vouchers.map((v) => (
                <div key={v.id} className="bg-slate-900 border border-slate-750 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-400">{v.code}</span>
                      <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {v.discountType === 'percent' ? `Giảm ${v.discountValue}%` : `Giảm ${formatVND(v.discountValue)}`}
                      </span>
                    </div>
                    <div className="text-slate-300 font-semibold mt-1">{v.title}</div>
                    <div className="text-xs text-slate-400">Đơn tối thiểu: {formatVND(v.minBookingAmount)}</div>
                  </div>

                  {onToggleVoucher && (
                    <button
                      type="button"
                      onClick={() => onToggleVoucher(v.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        v.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {v.isActive ? 'Đang mở' : 'Đã khóa'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: DUYỆT CHÍNH CHỦ
           ======================================================== */}
        {adminTab === 'claims' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-750 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Yêu Cầu Xác Nhận Quyền Sở Hữu Cơ Sở ({claimRequests.length})</span>
            </h3>

            {claimRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl">
                Không có yêu cầu xác nhận chính chủ nào đang chờ duyệt.
              </div>
            ) : (
              <div className="space-y-3">
                {claimRequests.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-750 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.listingTitle}</h4>
                      <div className="text-slate-300 mt-0.5">
                        Chủ cơ sở: <strong>{c.ownerName}</strong> • SĐT: <strong>{c.ownerPhone}</strong> (Zalo: {c.zalo})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        CCCD/Mã số thuế: {c.cccdOrTax} • Ghi chú: {c.proofDocumentNote}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === 'pending' && onApproveClaim && (
                        <button
                          type="button"
                          onClick={() => onApproveClaim(c.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                        >
                          Duyệt Chính Chủ
                        </button>
                      )}
                      {c.status === 'pending' && onRejectClaim && (
                        <button
                          type="button"
                          onClick={() => onRejectClaim(c.id)}
                          className="bg-rose-950/40 text-rose-300 border border-rose-800/40 font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          Từ chối
                        </button>
                      )}
                      {c.status === 'verified' && (
                        <span className="text-emerald-400 font-bold">✓ Đã xác minh chính chủ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 7: KIỂM TOÁN BẰNG CHỨNG
           ======================================================== */}
        {adminTab === 'evidence_audit' && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-750 pb-3">
              <Lock className="w-5 h-5 text-teal-400" />
              <span>Kiểm Toán Truy Cập Dữ Liệu Bằng Chứng (Audit Log)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Nhật ký truy vết bảo mật mọi phiên làm việc của Admin và Đối tác khi đọc dữ liệu bằng chứng.
            </p>

            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-900 border border-slate-750 p-3 rounded-xl text-xs flex justify-between gap-3">
                  <div>
                    <div className="font-bold text-teal-300">{log.ticketId} • {log.actor}</div>
                    <div className="text-slate-300 mt-0.5">{log.reason}</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono shrink-0">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: QUẢN TRỊ & ĐIỀU PHỐI REVIDAPI GATEWAY (https://revidapi.com/dashboard/docs)
           ======================================================== */}
        {adminTab === 'revid_api_gateway' && featureOpen('aiGateway') && (
          <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-6">
            {/* Header & Global Gateway Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-750 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-extrabold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>TÍCH HỢP CHÍNH THỨC: REVIDAPI.COM/DASHBOARD/DOCS · UNIFIED AI & MEDIA GATEWAY</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-teal-400" />
                  <span>Trung Tâm Quản Trị, Định Tuyến Độ Phức Tạp (L1–L5) & Ví Credit RevidAPI</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  Điều phối tập trung 17+ mô hình LLM (`Claude`, `GPT-5.6/6`, `Gemini`, `DeepSeek`, `Grok`, `Kimi`), Tạo Ảnh/Video bất đồng bộ (`/v1/generate`), Giọng đọc TTS (`/v1/text-to-speech`) và TikTok Scraper (`/v1/tiktok/download`) chỉ với 1 khóa API và 1 ví Credit.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Credit Wallet Quick Badge */}
                <div className="bg-slate-900 border border-amber-500/40 rounded-2xl px-4 py-2.5 text-right">
                  <span className="text-xs uppercase tracking-wider text-slate-400 block">
                    Số dư Ví RevidAPI Credit
                  </span>
                  <div className="text-base font-black text-amber-400 tabular-nums">
                    {revidConfig.creditWallet.balanceCredits.toLocaleString('vi-VN')} Credits
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">
                    ≈ {formatVND(Math.round((revidConfig.creditWallet.balanceCredits / 1500) * revidConfig.creditWallet.vndPer1500Credits))} · Hôm nay: {revidConfig.creditWallet.usedCreditsToday}/{revidConfig.creditWallet.dailyCreditLimit} cr
                  </span>
                </div>

                {/* Master Enable/Disable Switch */}
                <button
                  type="button"
                  onClick={() =>
                    saveRevidConfig(
                      { ...revidConfig, enabled: !revidConfig.enabled },
                      revidConfig.enabled
                        ? '⚠️ Đã tạm ngắt RevidAPI Gateway (Hệ thống tự động chuyển về Local Fallback).'
                        : '✅ Đã kích hoạt RevidAPI Gateway cho toàn bộ tính năng trên Web!'
                    )
                  }
                  className={`px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer border transition-all ${
                    revidConfig.enabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {revidConfig.enabled ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                      <span>GATEWAY ĐANG BẬT</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                      <span>ĐANG TẮT (FALLBACK)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 6 Sub-Navigation Pills */}
            <div className="flex flex-wrap gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
              {[
                { id: 'presets_manual', label: '🎯 1. Chế Độ Setup Mẫu (4 Presets) & Thủ Công' },
                { id: 'complexity_matrix', label: '🧠 2. Gán Model Theo Độ Phức Tạp (L1 → L5)' },
                { id: 'overview_keys', label: '🔑 3. Kết Nối Base URL, Đa Khóa & Ví Credit' },
                { id: 'models_catalog', label: `📊 4. Danh Mục Model & Giá Credit (${revidConfig.modelsCatalog.length})` },
                { id: 'live_playground', label: '⚡ 5. Live Playground (/chat & /generate)' },
                { id: 'logs_limits', label: `🛡️ 6. Hạn Mức Bảo Vệ & Nhật Ký Gọi API (${revidConfig.callLogs.length})` }
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setRevidSubSection(sub.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    revidSubSection === sub.id
                      ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* =====================================================================
                PHÂN KHU 1: CHẾ ĐỘ SETUP MẪU 1-CHẠM (PRESETS) & SETUP THỦ CÔNG (MANUAL)
               ===================================================================== */}
            {revidSubSection === 'presets_manual' && (
              <div className="space-y-6">
                {/* Mode Toggle Banner */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      <span>Phương Thức Vận Hành Hệ Thống API: Setup Mẫu (Preset) hay Thủ Công (Manual)?</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Chọn <strong>Setup Mẫu 1-Chạm</strong> để áp dụng ngay bộ cấu hình chuẩn hóa theo mục tiêu ngân sách/tốc độ, hoặc chuyển sang <strong>Setup Thủ Công</strong> để tinh chỉnh từng tham số chuyên sâu cho mỗi model.
                    </p>
                  </div>

                  <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        saveRevidConfig(
                          { ...revidConfig, setupMode: 'preset' },
                          '🎯 Đã chuyển sang Chế độ Setup Mẫu 1-Chạm (Preset Mode)'
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                        revidConfig.setupMode === 'preset'
                          ? 'bg-teal-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🎯 Chế Độ Setup Mẫu (4 Presets)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveRevidConfig(
                          { ...revidConfig, setupMode: 'manual' },
                          '🛠️ Đã mở khóa Chế độ Setup Thủ Công Chuyên Sâu (Manual Expert Mode)'
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                        revidConfig.setupMode === 'manual'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛠️ Chế Độ Setup Thủ Công
                    </button>
                  </div>
                </div>

                {/* 4 Preset Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REVID_PRESET_PROFILES.map((preset) => {
                    const isActive =
                      revidConfig.setupMode === 'preset' && revidConfig.activePresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                          isActive
                            ? 'bg-teal-950/35 border-teal-400 shadow-lg shadow-teal-500/10'
                            : 'bg-slate-900 border-slate-750 hover:border-slate-600'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              {preset.badge}
                            </span>
                            {isActive && (
                              <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đang áp dụng
                              </span>
                            )}
                          </div>

                          <h5 className="text-base font-extrabold text-white">{preset.name}</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">{preset.description}</p>

                          {/* Preset Level Summary Table */}
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">L1 (Lọc chat & PII):</span>
                              <span className="font-mono font-bold text-emerald-300">
                                {preset.levelMapping.L1_micro.primaryModelId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">L2 (Hỏi đáp nhanh FAQ):</span>
                              <span className="font-mono font-bold text-sky-300">
                                {preset.levelMapping.L2_fast.primaryModelId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">L3 (Lịch trình & Báo giá 179 cơ sở):</span>
                              <span className="font-mono font-bold text-amber-300">
                                {preset.levelMapping.L3_reasoning.primaryModelId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">L4 (Trọng tài đối soát cọc):</span>
                              <span className="font-mono font-bold text-purple-300">
                                {preset.levelMapping.L4_expert.primaryModelId}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">L5 (Ảnh/Video /v1/generate):</span>
                              <span className="font-mono font-bold text-rose-300">
                                {preset.levelMapping.L5_media.primaryModelId}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-xs font-bold text-teal-300">
                            Ước tính tiết kiệm: ~{preset.estimatedCreditSavingPercent}% Credit
                          </span>
                          <button
                            type="button"
                            onClick={() => handleApplyRevidPreset(preset.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                              isActive
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-teal-600 hover:bg-teal-500 text-white'
                            }`}
                          >
                            {isActive ? '✓ Đang kích hoạt mẫu này' : 'Kích hoạt Mẫu 1-Chạm →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Smart Orchestration Switches (Auto-Complexity, Cache Read, Key Rotation) */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>Các Cơ Chế Tự Động Hóa & Tối Ưu Chi Phí Thông Minh Trên RevidAPI</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <label className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer">
                      <div>
                        <div className="font-bold text-white">Tự Động Chấm Điểm Độ Phức Tạp (Auto-Router)</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Tự động phân tích độ dài và ràng buộc câu hỏi của khách để chọn L1 (0 cr), L2 (54 cr) hoặc L3 (108 cr) thay vì luôn gọi model đắt tiền.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={revidConfig.autoComplexityRouting}
                        onChange={(e) =>
                          saveRevidConfig(
                            { ...revidConfig, autoComplexityRouting: e.target.checked },
                            '✅ Đã cập nhật bộ định tuyến độ phức tạp tự động!'
                          )
                        }
                        className="w-4 h-4 accent-teal-500 mt-1 shrink-0"
                      />
                    </label>

                    <label className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer">
                      <div>
                        <div className="font-bold text-white">Tận Dụng Bộ Nhớ Đệm Prompt (Cache Read)</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Giữ nguyên ngữ cảnh 179 cơ sở trong bộ nhớ đệm của RevidAPI, giảm giá đọc token từ 258 cr xuống chỉ còn 26 cr/1M (tiết kiệm tới 90%).
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={revidConfig.promptCachingEnabled}
                        onChange={(e) =>
                          saveRevidConfig(
                            { ...revidConfig, promptCachingEnabled: e.target.checked },
                            '✅ Đã cập nhật chế độ Prompt Cache Read!'
                          )
                        }
                        className="w-4 h-4 accent-teal-500 mt-1 shrink-0"
                      />
                    </label>

                    <label className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer">
                      <div>
                        <div className="font-bold text-white">Xoay Vòng Đa Khóa Tự Động (Auto Key Failover)</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Khi Key chính chạm giới hạn băng thông (`HTTP 429`), hệ thống lập tức chuyển sang Backup Key mà khách hàng không hề hay biết.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={revidConfig.autoKeyRotation}
                        onChange={(e) =>
                          saveRevidConfig(
                            { ...revidConfig, autoKeyRotation: e.target.checked },
                            '✅ Đã cập nhật chế độ Xoay vòng đa khóa API!'
                          )
                        }
                        className="w-4 h-4 accent-teal-500 mt-1 shrink-0"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                PHÂN KHU 2: MA TRẬN GÁN MODEL THEO ĐỘ PHỨC TẠP (L1 -> L5) & TÍNH NĂNG
               ===================================================================== */}
            {revidSubSection === 'complexity_matrix' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-750 rounded-2xl p-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      Ma Trận Gán Model Theo Độ Phức Tạp (L1 → L5) Cho 7 Tác Vụ Cốt Lõi Trên Website
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bạn có thể thay đổi trực tiếp Cấp độ phức tạp, Model chính (Primary), Model dự phòng (Fallback), Temperature và Max Tokens cho từng tính năng. Khi chỉnh sửa tại đây, hệ thống sẽ tự chuyển sang chế độ <strong>Setup Thủ Công (Manual)</strong>.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold shrink-0">
                    Chế độ hiện tại: {revidConfig.setupMode === 'preset' ? `Theo Mẫu (${revidConfig.activePresetId})` : 'Thủ công (Manual)'}
                  </span>
                </div>

                <div className="space-y-4">
                  {revidConfig.featureRoutes.map((route) => {
                    const levelBadgeColor =
                      route.complexityLevel === 'L1_micro'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : route.complexityLevel === 'L2_fast'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : route.complexityLevel === 'L3_reasoning'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : route.complexityLevel === 'L4_expert'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                    return (
                      <div
                        key={route.featureId}
                        className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${levelBadgeColor}`}>
                                {route.complexityLevel.toUpperCase()}
                              </span>
                              <span className="font-mono text-xs text-teal-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                                {route.endpointPath}
                              </span>
                              <h5 className="text-sm font-extrabold text-white">{route.featureName}</h5>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{route.featureDescription}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-amber-300 font-bold">
                              ~{route.avgCreditsPerCall} cr / lần gọi
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = revidConfig.featureRoutes.map((r) =>
                                  r.featureId === route.featureId ? { ...r, isEnabled: !r.isEnabled } : r
                                );
                                saveRevidConfig(
                                  { ...revidConfig, featureRoutes: updated },
                                  `Đã ${route.isEnabled ? 'tắt' : 'bật'} tính năng "${route.featureName}"!`
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                                route.isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {route.isEnabled ? 'Đang bật' : 'Đã tắt'}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                          {/* Complexity Level Select */}
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">
                              Cấp độ phức tạp
                            </label>
                            <select
                              value={route.complexityLevel}
                              onChange={(e) => {
                                const nextLevel = e.target.value as RevidComplexityLevel;
                                const updated = revidConfig.featureRoutes.map((r) =>
                                  r.featureId === route.featureId ? { ...r, complexityLevel: nextLevel } : r
                                );
                                saveRevidConfig({
                                  ...revidConfig,
                                  setupMode: 'manual',
                                  featureRoutes: updated
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                            >
                              <option value="L1_micro">L1: Micro / Lọc tức thời (0-38 cr)</option>
                              <option value="L2_fast">L2: Hội thoại nhanh FAQ (54-86 cr)</option>
                              <option value="L3_reasoning">L3: Lịch trình & Báo giá (97-258 cr)</option>
                              <option value="L4_expert">L4: Trọng tài & Phân tích sâu (215-430 cr)</option>
                              <option value="L5_media">L5: Tạo Ảnh/Video/TTS/TikTok</option>
                            </select>
                          </div>

                          {/* Primary Model Select */}
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">
                              Model chính (Primary Model)
                            </label>
                            <select
                              value={route.primaryModelId}
                              onChange={(e) => {
                                const updated = revidConfig.featureRoutes.map((r) =>
                                  r.featureId === route.featureId ? { ...r, primaryModelId: e.target.value } : r
                                );
                                saveRevidConfig(
                                  { ...revidConfig, setupMode: 'manual', featureRoutes: updated },
                                  `✅ Đã gán model chính "${e.target.value}" cho ${route.featureName}`
                                );
                              }}
                              className="w-full bg-slate-950 border border-teal-500/50 rounded-xl px-3 py-2 text-teal-300 font-mono font-bold"
                            >
                              {revidConfig.modelsCatalog.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.id} ({m.isFree ? '0 cr - Free' : m.inputCreditsPer1M ? `${m.inputCreditsPer1M} cr/1M` : m.creditsPerJobRange})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Fallback Model Select */}
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">
                              Model dự phòng (Fallback)
                            </label>
                            <select
                              value={route.fallbackModelId}
                              onChange={(e) => {
                                const updated = revidConfig.featureRoutes.map((r) =>
                                  r.featureId === route.featureId ? { ...r, fallbackModelId: e.target.value } : r
                                );
                                saveRevidConfig({
                                  ...revidConfig,
                                  setupMode: 'manual',
                                  featureRoutes: updated
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                            >
                              {revidConfig.modelsCatalog.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.id}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Temperature / Aspect Ratio */}
                          {route.complexityLevel === 'L5_media' && route.endpointPath === '/v1/generate' ? (
                            <>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">
                                  Tỷ lệ khung hình (Aspect Ratio)
                                </label>
                                <select
                                  value={route.mediaAspectRatio || '16:9'}
                                  onChange={(e) => {
                                    const updated = revidConfig.featureRoutes.map((r) =>
                                      r.featureId === route.featureId
                                        ? { ...r, mediaAspectRatio: e.target.value as any }
                                        : r
                                    );
                                    saveRevidConfig({ ...revidConfig, setupMode: 'manual', featureRoutes: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                                >
                                  <option value="16:9">16:9 (Banner Ngang)</option>
                                  <option value="9:16">9:16 (Story / TikTok)</option>
                                  <option value="1:1">1:1 (Vuông)</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">
                                  Độ phân giải (Resolution)
                                </label>
                                <select
                                  value={route.mediaResolution || '2k'}
                                  onChange={(e) => {
                                    const updated = revidConfig.featureRoutes.map((r) =>
                                      r.featureId === route.featureId
                                        ? { ...r, mediaResolution: e.target.value as any }
                                        : r
                                    );
                                    saveRevidConfig({ ...revidConfig, setupMode: 'manual', featureRoutes: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                                >
                                  <option value="2k">2K Ultra HD</option>
                                  <option value="1080p">1080p Full HD</option>
                                  <option value="720p">720p Tiết kiệm Credit</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">
                                  Temperature ({route.temperature})
                                </label>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  max="1.5"
                                  value={route.temperature}
                                  onChange={(e) => {
                                    const updated = revidConfig.featureRoutes.map((r) =>
                                      r.featureId === route.featureId
                                        ? { ...r, temperature: Number(e.target.value) }
                                        : r
                                    );
                                    saveRevidConfig({ ...revidConfig, setupMode: 'manual', featureRoutes: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">
                                  Max Output Tokens
                                </label>
                                <input
                                  type="number"
                                  step="128"
                                  min="128"
                                  max="8192"
                                  value={route.maxTokens}
                                  onChange={(e) => {
                                    const updated = revidConfig.featureRoutes.map((r) =>
                                      r.featureId === route.featureId
                                        ? { ...r, maxTokens: Number(e.target.value) }
                                        : r
                                    );
                                    saveRevidConfig({ ...revidConfig, setupMode: 'manual', featureRoutes: updated });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =====================================================================
                PHÂN KHU 3: KẾT NỐI BASE URL, ĐA KHÓA API (MULTI-KEY VAULT) & VÍ CREDIT
               ===================================================================== */}
            {revidSubSection === 'overview_keys' && (
              <div className="space-y-6">
                {/* Base URL & Auth Header Config */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">
                        Cấu Hình Điểm Cuối (Base URL) & Chuẩn Header Xác Thực RevidAPI
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tương thích 100% tài liệu `https://revidapi.com/dashboard/docs` (`https://ai.revidapi.com/v1` và `https://revidapi.com/v1`).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePingRevidGateway}
                      disabled={pingStatus.loading}
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${pingStatus.loading ? 'animate-spin' : ''}`} />
                      <span>{pingStatus.loading ? 'Đang Ping /v1/models...' : '⚡ Test Kết Nối (GET /v1/models)'}</span>
                    </button>
                  </div>

                  {pingStatus.message && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span>✓ {pingStatus.message}</span>
                      {pingStatus.latencyMs && (
                        <span className="font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg text-teal-300">
                          Độ trễ: {pingStatus.latencyMs}ms
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-400 block mb-1">
                        Base URL RevidAPI (v1)
                      </label>
                      <input
                        type="text"
                        value={revidConfig.baseUrl}
                        onChange={(e) => saveRevidConfig({ ...revidConfig, baseUrl: e.target.value })}
                        placeholder="https://ai.revidapi.com/v1"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Định dạng Header Xác thực
                      </label>
                      <select
                        value={revidConfig.authHeaderMode}
                        onChange={(e) =>
                          saveRevidConfig({ ...revidConfig, authHeaderMode: e.target.value as any })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold"
                      >
                        <option value="bearer">Authorization: Bearer sk_live_...</option>
                        <option value="x_api_key">X-API-Key: sk_live_...</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Timeout (ms) / Số lần thử lại
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={revidConfig.timeoutMs}
                          onChange={(e) =>
                            saveRevidConfig({ ...revidConfig, timeoutMs: Number(e.target.value) })
                          }
                          className="w-2/3 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                        />
                        <input
                          type="number"
                          value={revidConfig.maxRetries}
                          onChange={(e) =>
                            saveRevidConfig({ ...revidConfig, maxRetries: Number(e.target.value) })
                          }
                          className="w-1/3 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Key Vault */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-extrabold text-white">
                    Kho Khóa API (Multi-Key Vault) & Tự Động Đảo Khóa Khi Chạm Rate Limit
                  </h4>

                  <div className="space-y-2.5">
                    {revidConfig.apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{k.label}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 uppercase">
                              {k.role}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                k.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {k.status === 'active' ? '● Đang hoạt động' : '○ Đã tạm khóa'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            Key: <span className="text-amber-300">{k.rawKey ? `${k.rawKey.slice(0, 10)}...` : k.maskedKey}</span> · Hôm nay: {k.requestsToday} req ({k.creditsUsedToday} credits) · Gần nhất: {k.lastUsedAt}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            placeholder="Nhập/cập nhật sk_live_..."
                            value={k.rawKey}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = revidConfig.apiKeys.map((item) =>
                                item.id === k.id
                                  ? {
                                      ...item,
                                      rawKey: val,
                                      maskedKey: val.length > 10 ? `${val.slice(0, 8)}...${val.slice(-4)}` : item.maskedKey
                                    }
                                  : item
                              );
                              saveRevidConfig({ ...revidConfig, apiKeys: updated });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono w-48"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = revidConfig.apiKeys.map((item) =>
                                item.id === k.id
                                  ? { ...item, status: item.status === 'active' ? ('disabled' as const) : ('active' as const) }
                                  : item
                              );
                              saveRevidConfig({ ...revidConfig, apiKeys: updated }, 'Đã cập nhật trạng thái API Key!');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                          >
                            {k.status === 'active' ? 'Tạm khóa' : 'Kích hoạt'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New API Key Form */}
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    <input
                      type="text"
                      placeholder="Tên gợi nhớ (VD: Key Dự Phòng 2)"
                      value={newApiKeyLabel}
                      onChange={(e) => setNewApiKeyLabel(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Mã khóa: sk_live_..."
                      value={newApiKeyValue}
                      onChange={(e) => setNewApiKeyValue(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                    <select
                      value={newApiKeyRole}
                      onChange={(e) => setNewApiKeyRole(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="primary">Primary (Khóa chính)</option>
                      <option value="backup">Backup (Dự phòng chống 429)</option>
                      <option value="media_studio">Media Studio (/v1/generate)</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newApiKeyLabel.trim() || !newApiKeyValue.trim()) return;
                        const entry = {
                          id: `key-${Date.now()}`,
                          label: newApiKeyLabel.trim(),
                          maskedKey:
                            newApiKeyValue.length > 10
                              ? `${newApiKeyValue.slice(0, 8)}...${newApiKeyValue.slice(-4)}`
                              : newApiKeyValue,
                          rawKey: newApiKeyValue.trim(),
                          role: newApiKeyRole,
                          status: 'active' as const,
                          requestsToday: 0,
                          creditsUsedToday: 0,
                          lastUsedAt: 'Chưa sử dụng'
                        };
                        saveRevidConfig(
                          { ...revidConfig, apiKeys: [...revidConfig.apiKeys, entry] },
                          '✅ Đã thêm API Key mới vào Multi-Key Vault!'
                        );
                        setNewApiKeyLabel('');
                        setNewApiKeyValue('');
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl px-4 py-2 cursor-pointer"
                    >
                      + Thêm Khóa API
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                PHÂN KHU 4: DANH MỤC 17+ MODEL REVIDAPI & BIỂU PHÍ CREDIT TRỰC TUYẾN
               ===================================================================== */}
            {revidSubSection === 'models_catalog' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: `Tất cả (${revidConfig.modelsCatalog.length})` },
                      { id: 'llm', label: 'LLM Chat (/v1/chat/completions)' },
                      { id: 'image', label: 'Tạo Ảnh AI (/v1/generate)' },
                      { id: 'video', label: 'Tạo Video & Motion (/v1/generate)' },
                      { id: 'tts', label: 'Giọng Đọc TTS (/v1/text-to-speech)' },
                      { id: 'social_scraper', label: 'TikTok & Social (/v1/tiktok/*)' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setModelCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          modelCategoryFilter === cat.id
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-750'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    Đơn vị tính: <strong>99.000 VNĐ ≈ 1.500 Credits</strong> (Hoàn 100% Credit nếu Job lỗi)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {revidConfig.modelsCatalog
                    .filter((m) => modelCategoryFilter === 'all' || m.category === modelCategoryFilter)
                    .map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                          m.isEnabled
                            ? 'bg-slate-900 border-slate-750'
                            : 'bg-slate-950/50 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-teal-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                {m.id}
                              </span>
                              <span className="text-xs font-bold text-slate-400">{m.provider}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-800 text-amber-300">
                              {m.recommendedLevel.toUpperCase()}
                            </span>
                          </div>

                          <h5 className="text-sm font-extrabold text-white">{m.name}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {m.category === 'llm' ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 font-mono">
                                In: {m.isFree ? '0 (MIỄN PHÍ)' : `${m.inputCreditsPer1M} cr/1M`}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-sky-300 font-mono">
                                Out: {m.isFree ? '0 (MIỄN PHÍ)' : `${m.outputCreditsPer1M} cr/1M`}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-mono">
                                Cache: {m.cacheReadCreditsPer1M ?? 0} cr/1M
                              </span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-slate-950 text-amber-300 font-mono font-bold">
                              Biểu phí: {m.creditsPerJobRange}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const updated = revidConfig.modelsCatalog.map((item) =>
                                item.id === m.id ? { ...item, isEnabled: !item.isEnabled } : item
                              );
                              saveRevidConfig(
                                { ...revidConfig, modelsCatalog: updated },
                                `Đã ${m.isEnabled ? 'khóa' : 'mở khóa'} model ${m.id}!`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                              m.isEnabled
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {m.isEnabled ? 'Đang cho phép' : 'Đã tắt'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* =====================================================================
                PHÂN KHU 5: PHÒNG THỬ NGHIỆM TRỰC TIẾP (LIVE PLAYGROUND & ASYNC JOBS)
               ===================================================================== */}
            {revidSubSection === 'live_playground' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: LLM Chat & Auto-Complexity Playground */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-teal-400" />
                      <span>1. Thử Nghiệm LLM (`/v1/chat/completions`)</span>
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-teal-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={playgroundUseAutoComplexity}
                        onChange={(e) => setPlaygroundUseAutoComplexity(e.target.checked)}
                        className="accent-teal-500"
                      />
                      <span>Tự chọn Model theo độ phức tạp</span>
                    </label>
                  </div>

                  {/* Quick Sample Prompts for L1, L2, L3, L4 */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setPlaygroundPrompt('Cọc riêng 300k vào STK 1903888999 ngoài web cho rẻ bạn nhé!')
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 cursor-pointer"
                    >
                      + Test L1 (Lọc Scam/PII - 0 cr)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlaygroundPrompt('Sáng mai ở Đỉnh Gió mấy giờ có biển mây đẹp nhất và nhiệt độ bao nhiêu?')
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-800 cursor-pointer"
                    >
                      + Test L2 (Hỏi nhanh thời tiết)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlaygroundPrompt(
                          'Tư vấn lịch trình 2N1Đ cho 4 người đi từ Hà Nội, ngân sách 1.800.000đ/người, ở homestay view mây và thuê kèm xe máy.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 cursor-pointer"
                    >
                      + Test L3 (Lập lịch trình & Báo giá)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlaygroundPrompt(
                          'Đối soát khiếu nại mã TK-409: Khách đã tải ảnh biên lai VietQR 500.000đ khớp với thẻ báo giá phòng #9-doi-soat-booking.'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-purple-300 border border-slate-800 cursor-pointer"
                    >
                      + Test L4 (Trọng tài đối soát cọc)
                    </button>
                  </div>

                  <form onSubmit={handleRunPlaygroundChat} className="space-y-3 text-xs">
                    {!playgroundUseAutoComplexity && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">
                          Chọn Model chỉ định thủ công
                        </label>
                        <select
                          value={playgroundSelectedModel}
                          onChange={(e) => setPlaygroundSelectedModel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                        >
                          {revidConfig.modelsCatalog
                            .filter((m) => m.category === 'llm')
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.id} — {m.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={playgroundPrompt}
                      onChange={(e) => setPlaygroundPrompt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                      placeholder="Nhập câu hỏi hoặc tác vụ để kiểm tra bộ định tuyến RevidAPI..."
                    />

                    <button
                      type="submit"
                      disabled={playgroundLoading}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer"
                    >
                      {playgroundLoading
                        ? 'Đang định tuyến & gọi /v1/chat/completions...'
                        : '⚡ Chạy Thử Nghiệm & Tính Toán Credit'}
                    </button>
                  </form>

                  {playgroundResult && (
                    <div className="bg-slate-950 border border-teal-500/40 rounded-2xl p-4 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <span className="font-extrabold text-teal-300">
                          Cấp độ phát hiện: {playgroundResult.complexity.level.toUpperCase()} ({playgroundResult.complexity.score} điểm)
                        </span>
                        <span className="font-mono text-amber-300 font-bold">
                          Model: {playgroundResult.modelUsed} ({playgroundResult.latencyMs}ms)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        Lý do chọn: {playgroundResult.complexity.reason}
                      </p>
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-100 leading-relaxed">
                        {playgroundResult.reply}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                        <span>
                          Tokens: In {playgroundResult.usage.inputTokens} (Cache Read: {playgroundResult.usage.cacheReadTokens}) · Out {playgroundResult.usage.outputTokens}
                        </span>
                        <span className="text-emerald-400 font-extrabold">
                          Chi phí: {playgroundResult.usage.creditsCharged} Credits
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Auto-Generated cURL Preview */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="text-xs font-extrabold uppercase text-slate-400">
                      Mã tích hợp cURL chuẩn `revidapi.com/dashboard/docs`:
                    </div>
                    <pre className="text-xs font-mono text-teal-300 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${revidConfig.baseUrl}/chat/completions \\
  -H "${revidConfig.authHeaderMode === 'x_api_key' ? 'X-API-Key: sk_live_...' : 'Authorization: Bearer sk_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${playgroundResult?.modelUsed || playgroundSelectedModel}","messages":[{"role":"user","content":"..."}]}'`}
                    </pre>
                  </div>
                </div>

                {/* Right Column: Async Media Job Generator (/v1/generate & /v1/jobs/{id}) */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      <span>2. Tạo Ảnh / Video Bất Đồng Bộ (`POST /v1/generate` & Polling Job)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gửi yêu cầu tạo ảnh/video Tà Xùa, tự động lấy `job_id` và Polling `GET /v1/jobs/{'{job_id}'}`. Có thể gắn trực tiếp ảnh vừa tạo làm Banner CMS!
                    </p>
                  </div>

                  <DemoNotice dark>
                    Chưa gửi yêu cầu tới RevidAPI. Job chỉ được mô phỏng trên trình duyệt, kết quả là ảnh mẫu có sẵn
                    và số credit trừ đi không phải số liệu thật.
                  </DemoNotice>

                  <form onSubmit={handleSubmitAsyncMediaJob} className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Model Media</label>
                        <select
                          value={mediaJobModel}
                          onChange={(e) => setMediaJobModel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono"
                        >
                          <option value="nano-banana-pro">nano-banana-pro (Ảnh)</option>
                          <option value="flux">flux (Ảnh thực tế)</option>
                          <option value="gpt-image-2.5">gpt-image-2.5 (Poster)</option>
                          <option value="muse-video">muse-video (Video 720p)</option>
                          <option value="kling-3.0">kling-3.0 (Video Cinema)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Khung hình</label>
                        <select
                          value={mediaAspectRatio}
                          onChange={(e) => setMediaAspectRatio(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                        >
                          <option value="16:9">16:9</option>
                          <option value="9:16">9:16</option>
                          <option value="1:1">1:1</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Độ phân giải</label>
                        <select
                          value={mediaResolution}
                          onChange={(e) => setMediaResolution(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
                        >
                          <option value="2k">2K</option>
                          <option value="1080p">1080p</option>
                          <option value="720p">720p</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={mediaJobPrompt}
                      onChange={(e) => setMediaJobPrompt(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                      placeholder="Nhập mô tả cảnh biển mây Tà Xùa..."
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingMediaJob}
                      className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black py-2.5 rounded-xl cursor-pointer"
                    >
                      {isSubmittingMediaJob
                        ? '⏳ Đang Polling GET /v1/jobs/{job_id}...'
                        : '🚀 Gửi Job Tạo Media (POST /v1/generate)'}
                    </button>
                  </form>

                  {/* Async Jobs Queue List */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {revidConfig.asyncJobs.map((job) => (
                      <div
                        key={job.jobId}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-teal-300">
                            {job.jobId} · {job.modelId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-black ${
                              job.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {job.status === 'completed' ? '✓ COMPLETED (100%)' : `⏳ PROCESSING (${job.progressPercent}%)`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{job.promptOrInput}</p>
                        {job.resultUrl && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <img
                              src={job.resultUrl}
                              alt={job.jobId}
                              className="w-20 h-12 rounded-lg object-cover border border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextCms = {
                                  ...cmsConfig,
                                  heroBackgroundImage: job.resultUrl
                                };
                                setCmsConfig(nextCms);
                                if (onUpdateSiteContent) onUpdateSiteContent(nextCms);
                                showAdminToast('🖼️ Đã gắn ảnh từ RevidAPI làm Ảnh nền Hero Trang chủ!');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Gắn làm Ảnh Nền Hero CMS →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =====================================================================
                PHÂN KHU 6: HẠN MỨC BẢO VỆ VÍ (CIRCUIT BREAKER) & NHẬT KÝ GỌI API
               ===================================================================== */}
            {revidSubSection === 'logs_limits' && (
              <div className="space-y-6">
                {/* Credit & Rate Limit Controls */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-extrabold text-white">
                    Cấu Hình Hạn Mức Chi Tiêu Credit Hàng Ngày & Cầu Dao Tự Động (Circuit Breaker)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Giới hạn Credit tối đa / ngày
                      </label>
                      <input
                        type="number"
                        value={revidConfig.creditWallet.dailyCreditLimit}
                        onChange={(e) =>
                          saveRevidConfig({
                            ...revidConfig,
                            creditWallet: {
                              ...revidConfig.creditWallet,
                              dailyCreditLimit: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Ngưỡng cảnh báo sắp hết Credit
                      </label>
                      <input
                        type="number"
                        value={revidConfig.creditWallet.lowBalanceAlertThreshold}
                        onChange={(e) =>
                          saveRevidConfig({
                            ...revidConfig,
                            creditWallet: {
                              ...revidConfig.creditWallet,
                              lowBalanceAlertThreshold: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Tự chuyển về Free Model khi đạt (%)
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={revidConfig.creditWallet.autoFallbackOnBudgetPercent}
                        onChange={(e) =>
                          saveRevidConfig({
                            ...revidConfig,
                            creditWallet: {
                              ...revidConfig.creditWallet,
                              autoFallbackOnBudgetPercent: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Giới hạn Request / phút / thành viên
                      </label>
                      <input
                        type="number"
                        value={revidConfig.creditWallet.rateLimitPerMinutePerUser}
                        onChange={(e) =>
                          saveRevidConfig({
                            ...revidConfig,
                            creditWallet: {
                              ...revidConfig.creditWallet,
                              rateLimitPerMinutePerUser: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* API Call Ledger Table */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-white">
                      Nhật Ký Gọi RevidAPI & Khấu Trừ Credit Thời Gian Thực ({revidConfig.callLogs.length} bản ghi)
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        saveRevidConfig(
                          {
                            ...revidConfig,
                            creditWallet: {
                              ...revidConfig.creditWallet,
                              balanceCredits: revidConfig.creditWallet.balanceCredits + 1500
                            }
                          },
                          '💳 Đã mô phỏng nạp thêm +1.500 Credits (99.000 VNĐ) vào Ví RevidAPI!'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      + Nạp thử 1.500 Credits (99k)
                    </button>
                  </div>

                  <div className="space-y-2">
                    {revidConfig.callLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-xs font-bold">
                              {log.complexityLevel.toUpperCase()}
                            </span>
                            <span className="font-mono font-bold text-amber-300">{log.modelUsed}</span>
                            <span className="font-bold text-white">{log.featureName}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            {log.endpoint} · Key: {log.keyLabel} · In: {log.inputTokens || 0} / Out: {log.outputTokens || 0} (Cache: {log.cacheReadTokens || 0})
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs text-slate-400">{log.latencyMs}ms</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-mono font-bold">
                            -{log.creditsCharged} cr
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{log.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
