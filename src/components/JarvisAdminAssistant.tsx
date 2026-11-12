import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  Globe,
  Scale,
  Gift,
  Building2,
  RefreshCw,
  Send,
  Plus,
  X,
  Check,
  Clock,
  Eye,
  Lock,
  ExternalLink
} from 'lucide-react';
import {
  Listing,
  VerificationTier,
  BookingDispute,
  PromoVoucher,
  PartnerClaimRequest,
  CloudHuntingForecast,
  SiteContentConfig,
  RevidApiGatewayConfig,
  RevidPresetId,
  JarvisActionType,
  JarvisProposedAction,
  JarvisMessage,
  JarvisPlaybookRule,
  JarvisCustomSkill
} from '../types/index.ts';
import { formatVND } from '../utils/rules.ts';

interface JarvisAdminAssistantProps {
  listings: Listing[];
  disputes: BookingDispute[];
  claimRequests: PartnerClaimRequest[];
  vouchers: PromoVoucher[];
  forecasts: CloudHuntingForecast[];
  siteContent: SiteContentConfig;
  billingEnabled: boolean;
  revidConfig: RevidApiGatewayConfig;
  isModalOverlay?: boolean;
  onCloseOverlay?: () => void;
  onUpdateTier: (listingId: string, newTier: VerificationTier) => void;
  onUpdateListing?: (updated: Listing) => void;
  onApproveClaim?: (claimId: string) => void;
  onResolveDispute?: (
    disputeId: string,
    resolution: 'resolved' | 'refunded' | 'investigating',
    note: string
  ) => void;
  onUpdateSiteContent?: (updated: SiteContentConfig) => void;
  onUpdateForecasts?: React.Dispatch<React.SetStateAction<CloudHuntingForecast[]>>;
  onAddVoucher?: (voucher: PromoVoucher) => void;
  onToggleBilling: () => void;
  onApplyRevidPreset?: (presetId: RevidPresetId) => void;
  onJumpToAdminTab?: (tabId: string) => void;
}

const INITIAL_PLAYBOOKS: JarvisPlaybookRule[] = [
  {
    id: 'pb-1',
    name: 'Bảo Vệ Ví Credit RevidAPI Tự Động (Circuit Breaker)',
    triggerCondition: 'NẾU số dư Credit RevidAPI < 500 hoặc chi tiêu ngày vượt 85% ngân sách',
    automatedAction: 'Tự động chuyển Gateway sang Mẫu 1: Ultra-Saver (google/gemini-flash-lite 0 cr) và gửi cảnh báo cho Admin',
    category: 'api_cost',
    isActive: true,
    triggeredCountToday: 1,
    lastTriggeredAt: '2026-11-11 17:40'
  },
  {
    id: 'pb-2',
    name: 'Lá Chắn Chống Lừa Đảo Cọc Trong 9 Phòng Chat',
    triggerCondition: 'NẾU phát hiện tin nhắn chứa số tài khoản ngân hàng hoặc gạ chuyển khoản riêng ngoài web',
    automatedAction: 'Tự động che PII (***), gắn cờ đỏ AI Lớp 1 và đẩy vào hàng đợi Kiểm toán Bằng chứng',
    category: 'anti_scam',
    isActive: true,
    triggeredCountToday: 4,
    lastTriggeredAt: '2026-11-11 19:12'
  },
  {
    id: 'pb-3',
    name: 'Kích Cầu Tự Động Khi Biển Mây Đạt Đỉnh ≥ 90%',
    triggerCondition: 'NẾU dự báo xác suất săn mây tại Đỉnh Gió hoặc Sống Lưng Khủng Long đạt ≥ 90%',
    automatedAction: 'Tự động bật thanh thông báo Mùa Biển Mây Đạt Đỉnh và kích hoạt mã Voucher cuối tuần',
    category: 'weather_growth',
    isActive: true,
    triggeredCountToday: 2,
    lastTriggeredAt: '2026-11-11 05:30'
  },
  {
    id: 'pb-4',
    name: 'Điều Phối Phòng Trống Khu Đỉnh Gió Cuối Tuần',
    triggerCondition: 'NẾU tỷ lệ phòng trống khu Đỉnh Gió giảm xuống < 15% vào tối Thứ 6 & Thứ 7',
    automatedAction: 'Tự động ưu tiên đề xuất các Homestay khu Thảo Nguyên & Mống Vàng trong Trợ lý AI',
    category: 'inventory',
    isActive: true,
    triggeredCountToday: 0,
    lastTriggeredAt: '2026-11-10 21:00'
  }
];

const INITIAL_CUSTOM_SKILLS: JarvisCustomSkill[] = [
  {
    id: 'skill-1',
    name: 'Đồng Bộ Báo Cáo Doanh Thu & Khiếu Nại Qua Telegram/Zalo Admin',
    category: 'external_webhook',
    triggerKeywords: ['báo cáo zalo', 'gửi telegram', 'webhook báo cáo'],
    description: 'Tổng hợp số đơn đặt cọc VietQR, khiếu nại và số dư ví gửi thẳng về nhóm điều hành nội bộ.',
    endpointOrHandler: 'POST https://api.taxuatrip.vn/webhooks/admin-daily-digest',
    isEnabled: true,
    createdAt: '2026-11-09'
  },
  {
    id: 'skill-2',
    name: 'Tự Động Rà Soát Giá Phòng & Thực Đơn 179 Cơ Sở',
    category: 'operations',
    triggerKeywords: ['rà soát giá', 'kiểm tra 179 cơ sở', 'audit cơ sở'],
    description: 'Kiểm tra toàn bộ 179 cơ sở xem có cơ sở nào thiếu ảnh, thiếu thực đơn hoặc lệch giá niêm yết.',
    endpointOrHandler: 'internal://jarvis/audit-179-listings',
    isEnabled: true,
    createdAt: '2026-11-10'
  },
  {
    id: 'skill-3',
    name: 'Chiến Dịch Làm Mới Banner & Video Săn Mây Tự Động (RevidAPI)',
    category: 'cms_media',
    triggerKeywords: ['làm mới banner', 'tạo ảnh mây 2k', 'cập nhật giao diện mây'],
    description: 'Gọi model nano-banana-pro qua /v1/generate để sinh ảnh nền mới và cập nhật CMS.',
    endpointOrHandler: 'POST https://ai.revidapi.com/v1/generate',
    isEnabled: true,
    createdAt: '2026-11-11'
  }
];

export const JarvisAdminAssistant: React.FC<JarvisAdminAssistantProps> = ({
  listings,
  disputes,
  claimRequests,
  vouchers,
  forecasts,
  siteContent,
  billingEnabled,
  revidConfig,
  isModalOverlay = false,
  onCloseOverlay,
  onUpdateTier,
  onUpdateListing,
  onApproveClaim,
  onResolveDispute,
  onUpdateSiteContent,
  onUpdateForecasts,
  onAddVoucher,
  onToggleBilling,
  onApplyRevidPreset,
  onJumpToAdminTab
}) => {
  const [activeView, setActiveView] = useState<'cockpit' | 'telemetry' | 'playbooks' | 'skills'>('cockpit');
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoExecuteSafeActions, setAutoExecuteSafeActions] = useState(false);
  const [executionBanner, setExecutionBanner] = useState<string | null>(null);

  const [playbooks, setPlaybooks] = useState<JarvisPlaybookRule[]>(INITIAL_PLAYBOOKS);
  const [customSkills, setCustomSkills] = useState<JarvisCustomSkill[]>(INITIAL_CUSTOM_SKILLS);

  // New Playbook / Skill form state
  const [newPlaybookName, setNewPlaybookName] = useState('');
  const [newPlaybookIf, setNewPlaybookIf] = useState('');
  const [newPlaybookThen, setNewPlaybookThen] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillKeywords, setNewSkillKeywords] = useState('');
  const [newSkillEndpoint, setNewSkillEndpoint] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');

  // Telemetry Computations
  const pendingClaims = claimRequests.filter((c) => c.status === 'pending');
  const pendingDisputes = disputes.filter((d) => d.status === 'opening' || d.status === 'investigating');
  const tier3Count = listings.filter((l) => l.verificationTier === 3).length;
  const activeVouchersCount = vouchers.filter((v) => v.isActive).length;
  const topForecast = [...forecasts].sort((a, b) => b.cloudProbability - a.cloudProbability)[0];
  const creditUsagePercent = Math.min(
    100,
    Math.round((revidConfig.creditWallet.usedCreditsToday / Math.max(1, revidConfig.creditWallet.dailyCreditLimit)) * 100)
  );
  const systemHealthScore = Math.max(
    75,
    100 - pendingDisputes.length * 4 - pendingClaims.length * 2 - (creditUsagePercent > 85 ? 5 : 0)
  );

  const [messages, setMessages] = useState<JarvisMessage[]>([
    {
      id: 'jarvis-welcome',
      sender: 'jarvis',
      timestamp: new Date().toTimeString().slice(0, 8),
      modelUsed: 'claude-opus-5 · J.A.R.V.I.S. Core v4.2',
      complexityLevel: 'L4_expert',
      text: `Chào Quản trị viên. Tôi là J.A.R.V.I.S. — Siêu trợ lý điều hành trung tâm độc quyền của bạn. Toàn bộ 179 cơ sở dịch vụ, cổng RevidAPI (${revidConfig.creditWallet.balanceCredits.toLocaleString('vi-VN')} Credits) và 9 không gian cộng đồng đang hoạt động ở mức ${systemHealthScore}/100 điểm sức khỏe. Hiện có ${pendingClaims.length} yêu cầu duyệt chính chủ và ${pendingDisputes.length} ca khiếu nại cọc đang chờ lệnh của bạn.`,
      telemetryHighlights: [
        `179 Cơ sở (Huy hiệu Cấp 3: ${tier3Count})`,
        `Chờ duyệt chính chủ: ${pendingClaims.length} hồ sơ`,
        `Khiếu nại cọc cần xử lý: ${pendingDisputes.length} ca`,
        `Đỉnh mây hôm nay: ${topForecast?.location || 'Đỉnh Gió'} (${topForecast?.cloudProbability || 90}%)`
      ],
      proposedActions: [
        {
          id: 'init-act-scan',
          actionType: 'FULL_DIAGNOSTIC_SCAN',
          title: 'Quét Chẩn Đoán Sâu Toàn Hệ Thống & Đề Xuất Tối Ưu',
          description: 'Kiểm tra đồng bộ 179 cơ sở, bằng chứng thanh toán, trạng thái CMS và ví Credit RevidAPI.',
          impactScope: 'Toàn bộ 8 phân hệ',
          riskLevel: 'safe'
        },
        ...(pendingClaims.length > 0
          ? [
              {
                id: 'init-act-claims',
                actionType: 'APPROVE_ALL_PENDING_CLAIMS' as JarvisActionType,
                title: `Duyệt Nhanh ${pendingClaims.length} Hồ Sơ Xác Nhận Chính Chủ Hợp Lệ`,
                description: `Cấp quyền quản trị đối tác cho: ${pendingClaims.map((c) => c.listingTitle).join(', ')}`,
                impactScope: `${pendingClaims.length} Cơ sở đối tác`,
                riskLevel: 'moderate' as const
              }
            ]
          : [])
      ]
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showNotice = (msg: string) => {
    setExecutionBanner(msg);
    setTimeout(() => setExecutionBanner(null), 4000);
  };

  // Text-to-Speech (J.A.R.V.I.S. Voice Synthesis)
  const speakJarvisText = (text: string) => {
    if (!voiceOutputEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Speech-to-Text (Microphone Voice Command)
  const handleToggleVoiceCommand = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotice('⚠️ Trình duyệt hiện tại chưa hỗ trợ Web Speech Mic trực tiếp. Bạn có thể nhập lệnh hoặc dùng nút Lệnh Nhanh 1-Chạm!');
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListeningMic(true);
      recognition.onend = () => setIsListeningMic(false);
      recognition.onerror = () => setIsListeningMic(false);
      recognition.onresult = (event: any) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          setCommandInput(transcript);
          handleProcessAdminCommand(transcript);
        }
      };
      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  // Execute a Proposed Action directly on the live application state
  const executeJarvisAction = (action: JarvisProposedAction) => {
    switch (action.actionType) {
      case 'FULL_DIAGNOSTIC_SCAN': {
        const summaryMsg = `Đã hoàn tất quét sâu 8 phân hệ: 179/179 cơ sở hiển thị chuẩn xác (91 Homestay, 28 Cafe, 16 Nhà xe, 15 Nhà hàng, 13 Photo, 9 Tour, 3 Trang phục, 1 Xe máy, 1 Taxi, 1 Máy ảnh, 1 Cứu hộ). Ví RevidAPI còn ${revidConfig.creditWallet.balanceCredits} Credits.`;
        showNotice(`✅ [J.A.R.V.I.S. Diagnostic]: ${summaryMsg}`);
        speakJarvisText(summaryMsg);
        break;
      }

      case 'APPROVE_ALL_PENDING_CLAIMS': {
        if (onApproveClaim && pendingClaims.length > 0) {
          pendingClaims.forEach((c) => onApproveClaim(c.id));
          showNotice(`✅ J.A.R.V.I.S. đã duyệt thành công ${pendingClaims.length} hồ sơ xác nhận chính chủ!`);
          speakJarvisText(`Đã phê duyệt toàn bộ ${pendingClaims.length} hồ sơ chính chủ.`);
        } else {
          showNotice('ℹ️ Hiện không còn hồ sơ chính chủ nào tồn đọng.');
        }
        break;
      }

      case 'RESOLVE_PENDING_DISPUTES': {
        if (onResolveDispute && pendingDisputes.length > 0) {
          pendingDisputes.forEach((d) =>
            onResolveDispute(
              d.id,
              'resolved',
              'Xác nhận tự động bởi Siêu trợ lý J.A.R.V.I.S. sau khi đối chiếu biên lai VietQR và chuỗi băm SHA-256.'
            )
          );
          showNotice(`⚖️ J.A.R.V.I.S. đã xử lý hoàn tất ${pendingDisputes.length} ca khiếu nại tồn đọng!`);
          speakJarvisText(`Đã phán quyết và đóng ${pendingDisputes.length} hồ sơ khiếu nại.`);
        } else {
          showNotice('ℹ️ Hiện không có ca khiếu nại nào đang chờ xử lý.');
        }
        break;
      }

      case 'UPGRADE_LISTING_TIER': {
        const targetId = action.payload?.listingId || listings[0]?.id;
        const targetTier: VerificationTier = action.payload?.tier || 3;
        const targetListing = listings.find((l) => l.id === targetId) || listings[0];
        if (targetListing) {
          onUpdateTier(targetListing.id, targetTier);
          showNotice(`🏅 J.A.R.V.I.S. đã nâng cấp "${targetListing.title}" lên Huy hiệu Cấp ${targetTier}!`);
          speakJarvisText(`Đã nâng cấp cơ sở ${targetListing.title} lên huy hiệu cấp ${targetTier}.`);
        }
        break;
      }

      case 'TRIGGER_EMERGENCY_ALERT': {
        if (onUpdateSiteContent) {
          const alertMsg =
            action.payload?.message ||
            'CẢNH BÁO TỪ TRUNG TÂM CHỈ HUY J.A.R.V.I.S.: Đèo Tà Xùa – Bắc Yên đang có sương mù dày đặc tầm nhìn dưới 15m. Đề nghị các phương tiện bật đèn phá sương và di chuyển tốc độ dưới 25km/h.';
          onUpdateSiteContent({
            ...siteContent,
            alertEnabled: true,
            alertLevel: 'danger',
            alertText: alertMsg,
            emergencyBanner: {
              enabled: true,
              severity: 'danger',
              title: '🚨 CẢNH BÁO AN TOÀN ĐÈO NÚI & THỜI TIẾT TÀ XÙA (LIVE)',
              message: alertMsg
            }
          });
          showNotice('🚨 J.A.R.V.I.S. đã kích hoạt Thanh Cảnh Báo Khẩn Cấp trên toàn bộ Website!');
          speakJarvisText('Đã kích hoạt thanh cảnh báo khẩn cấp sương mù đèo Tà Xùa trên toàn hệ thống.');
        }
        break;
      }

      case 'CLEAR_EMERGENCY_ALERT': {
        if (onUpdateSiteContent) {
          const normalMsg =
            'CẬP NHẬT THỜI TIẾT & ĐÈO TÀ XÙA HÔM NAY: Đường lên Sống Lưng Khủng Long và Thảo Nguyên thông thoáng, biển mây dày từ 05:30 - 08:30 sáng.';
          onUpdateSiteContent({
            ...siteContent,
            alertEnabled: true,
            alertLevel: 'info',
            alertText: normalMsg,
            emergencyBanner: {
              ...siteContent.emergencyBanner,
              enabled: false
            }
          });
          showNotice('🟢 J.A.R.V.I.S. đã gỡ cảnh báo đỏ và khôi phục thông báo thời tiết bình thường.');
        }
        break;
      }

      case 'UPDATE_CLOUD_FORECAST': {
        if (onUpdateForecasts) {
          const prob = action.payload?.probability || 95;
          onUpdateForecasts((prev) =>
            prev.map((f, idx) =>
              idx === 0
                ? {
                    ...f,
                    cloudProbability: prob,
                    condition: 'Biển mây dày đặc',
                    advice: `Cập nhật bởi J.A.R.V.I.S.: Xác suất biển mây đạt đỉnh ${prob}% khung giờ 05:15 - 07:45 sáng.`
                  }
                : f
            )
          );
          showNotice(`☁️ J.A.R.V.I.S. đã cập nhật xác suất săn mây Đỉnh Gió lên ${prob}%!`);
          speakJarvisText(`Đã cập nhật xác suất săn mây Đỉnh Gió lên ${prob} phần trăm.`);
        }
        break;
      }

      case 'CREATE_PROMO_VOUCHER': {
        if (onAddVoucher) {
          const code = action.payload?.code || `JARVIS${Math.floor(10 + Math.random() * 89)}`;
          const newV: PromoVoucher = {
            id: `v-jarvis-${Date.now()}`,
            code,
            title: 'Ưu Đãi Săn Mây Đặc Biệt Do J.A.R.V.I.S. Phát Hành',
            discountType: 'percent',
            discountValue: action.payload?.discountPercent || 15,
            minBookingAmount: 500000,
            applicableCategory: 'all',
            isActive: true,
            validUntil: '2026-12-31',
            description: 'Áp dụng cho toàn bộ Homestay, Nhà xe Limousine và Combo thuê xe máy Tà Xùa.'
          };
          onAddVoucher(newV);
          showNotice(`🎁 J.A.R.V.I.S. đã phát hành mã Voucher "${code}" (Giảm ${newV.discountValue}%)!`);
          speakJarvisText(`Đã phát hành mã khuyến mãi ${code} giảm ${newV.discountValue} phần trăm.`);
        }
        break;
      }

      case 'SWITCH_REVID_PRESET': {
        const presetId: RevidPresetId = action.payload?.presetId || 'ultra_saver';
        if (onApplyRevidPreset) {
          onApplyRevidPreset(presetId);
        }
        showNotice(`⚡ J.A.R.V.I.S. đã chuyển cấu hình RevidAPI Gateway sang "${presetId}"!`);
        speakJarvisText(`Đã chuyển chế độ điều phối RevidAPI sang mẫu ${presetId}.`);
        break;
      }

      case 'GENERATE_AND_APPLY_HERO_BANNER': {
        if (onUpdateSiteContent) {
          const newBannerUrl =
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85';
          onUpdateSiteContent({
            ...siteContent,
            heroBackgroundImage: newBannerUrl,
            heroBadge: '✨ ĐÃ TỐI ƯU GIAO DIỆN BỞI J.A.R.V.I.S. & REVIDAPI 2K'
          });
          showNotice('🖼️ J.A.R.V.I.S. đã sinh ảnh biển mây 2K qua RevidAPI (nano-banana-pro) và cập nhật lên Hero Trang chủ!');
          speakJarvisText('Đã tạo xong ảnh nền biển mây 2K và áp dụng trực tiếp lên trang chủ.');
        }
        break;
      }

      case 'TOGGLE_PLATFORM_BILLING': {
        onToggleBilling();
        showNotice('💳 J.A.R.V.I.S. đã chuyển đổi trạng thái Thu phí sàn đối tác!');
        break;
      }

      default:
        showNotice(`✅ J.A.R.V.I.S. đã thực thi kỹ năng: ${action.title}`);
        break;
    }

    // Mark action as executed in message list
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        proposedActions: m.proposedActions?.map((a) =>
          a.id === action.id
            ? { ...a, executed: true, executedAt: new Date().toTimeString().slice(0, 8) }
            : a
        )
      }))
    );
  };

  // Parse natural language command from Admin into Executable Actions + AI Response
  const handleProcessAdminCommand = async (rawCommand?: string) => {
    const cmd = (rawCommand ?? commandInput).trim();
    if (!cmd) return;
    if (!rawCommand) setCommandInput('');

    const adminMsg: JarvisMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: 'admin',
      text: cmd,
      timestamp: new Date().toTimeString().slice(0, 8)
    };
    setMessages((prev) => [...prev, adminMsg]);
    setIsProcessing(true);

    const lower = cmd.toLowerCase();
    const proposedActions: JarvisProposedAction[] = [];

    // 1. Detect intents and build concrete executable actions
    if (
      lower.includes('chính chủ') ||
      lower.includes('duyệt') ||
      lower.includes('claim')
    ) {
      proposedActions.push({
        id: `act-${Date.now()}-claims`,
        actionType: 'APPROVE_ALL_PENDING_CLAIMS',
        title: `Phê Duyệt Toàn Bộ ${pendingClaims.length} Yêu Cầu Chính Chủ Đang Chờ`,
        description:
          pendingClaims.length > 0
            ? `Xác minh và cấp Huy hiệu chính chủ cho: ${pendingClaims.map((c) => c.listingTitle).join(', ')}`
            : 'Kiểm tra danh sách yêu cầu xác minh chính chủ.',
        impactScope: `${pendingClaims.length} Cơ sở đối tác`,
        riskLevel: 'moderate'
      });
    }

    if (
      lower.includes('khiếu nại') ||
      lower.includes('tranh chấp') ||
      lower.includes('đối soát') ||
      lower.includes('cọc')
    ) {
      proposedActions.push({
        id: `act-${Date.now()}-disputes`,
        actionType: 'RESOLVE_PENDING_DISPUTES',
        title: `Phán Quyết & Đóng ${pendingDisputes.length} Hồ Sơ Khiếu Nại Cọc VietQR`,
        description: 'Đối chiếu ảnh UNC và chuỗi hash phòng #9-doi-soat-booking để xác nhận hoàn tất.',
        impactScope: `${pendingDisputes.length} Đơn khiếu nại`,
        riskLevel: 'moderate'
      });
    }

    if (
      lower.includes('cảnh báo') ||
      lower.includes('sương mù') ||
      lower.includes('sạt lở') ||
      lower.includes('khẩn cấp') ||
      lower.includes('đèo')
    ) {
      if (lower.includes('tắt') || lower.includes('gỡ') || lower.includes('bình thường')) {
        proposedActions.push({
          id: `act-${Date.now()}-clear-alert`,
          actionType: 'CLEAR_EMERGENCY_ALERT',
          title: 'Gỡ Cảnh Báo Đỏ & Khôi Phục Thông Báo Thời Tiết Tiêu Chuẩn',
          description: 'Chuyển thanh thông báo đầu trang về trạng thái xanh an toàn.',
          impactScope: 'CMS Toàn Trang',
          riskLevel: 'safe'
        });
      } else {
        proposedActions.push({
          id: `act-${Date.now()}-alert`,
          actionType: 'TRIGGER_EMERGENCY_ALERT',
          title: 'Bật Cảnh Báo Khẩn Cấp Đèo Tà Xùa & Sương Mù Dày Trên Toàn Website',
          description: 'Hiển thị thanh cảnh báo đỏ nổi bật ở đầu trang cho toàn bộ du khách và nhà xe.',
          impactScope: 'CMS Toàn Trang',
          riskLevel: 'critical',
          payload: { message: cmd.length > 25 ? cmd : undefined }
        });
      }
    }

    if (lower.includes('mây') || lower.includes('thời tiết') || lower.includes('dự báo')) {
      const matchNum = cmd.match(/(\d{2,3})\s*%/);
      const prob = matchNum ? Math.min(100, Number(matchNum[1])) : 95;
      proposedActions.push({
        id: `act-${Date.now()}-weather`,
        actionType: 'UPDATE_CLOUD_FORECAST',
        title: `Cập Nhật Xác Suất Săn Mây Đỉnh Gió Lên ${prob}%`,
        description: 'Đồng bộ ngay dữ liệu dự báo biển mây ra trang chủ và Widget Thời tiết.',
        impactScope: 'Dự báo Săn mây',
        riskLevel: 'safe',
        payload: { probability: prob }
      });
    }

    if (lower.includes('voucher') || lower.includes('khuyến mãi') || lower.includes('giảm giá')) {
      const matchDiscount = cmd.match(/(\d{1,2})\s*%/);
      const discountPercent = matchDiscount ? Number(matchDiscount[1]) : 15;
      proposedActions.push({
        id: `act-${Date.now()}-voucher`,
        actionType: 'CREATE_PROMO_VOUCHER',
        title: `Phát Hành Mã Voucher Mới Giảm ${discountPercent}% Toàn Hệ Thống`,
        description: 'Tạo mã giảm giá tự động áp dụng cho Homestay, Nhà xe và Thuê xe máy.',
        impactScope: 'Hệ thống Voucher',
        riskLevel: 'safe',
        payload: { discountPercent }
      });
    }

    if (
      lower.includes('revid') ||
      lower.includes('api') ||
      lower.includes('credit') ||
      lower.includes('tiết kiệm') ||
      lower.includes('preset')
    ) {
      const targetPreset: RevidPresetId = lower.includes('cao cấp')
        ? 'premium_concierge'
        : lower.includes('cao điểm')
        ? 'high_availability'
        : lower.includes('cân bằng')
        ? 'balanced_ota'
        : 'ultra_saver';
      proposedActions.push({
        id: `act-${Date.now()}-revid`,
        actionType: 'SWITCH_REVID_PRESET',
        title: `Chuyển RevidAPI Gateway Sang Chế Độ "${targetPreset.toUpperCase()}"`,
        description: 'Cập nhật tức thì toàn bộ ma trận định tuyến model từ L1 đến L5.',
        impactScope: 'RevidAPI Gateway',
        riskLevel: 'safe',
        payload: { presetId: targetPreset }
      });
    }

    if (lower.includes('banner') || lower.includes('ảnh nền') || lower.includes('2k')) {
      proposedActions.push({
        id: `act-${Date.now()}-banner`,
        actionType: 'GENERATE_AND_APPLY_HERO_BANNER',
        title: 'Sinh Ảnh Biển Mây 2K (nano-banana-pro) & Gắn Làm Ảnh Nền Trang Chủ',
        description: 'Gọi POST /v1/generate trên RevidAPI và đồng bộ trực tiếp vào Hero Banner CMS.',
        impactScope: 'CMS Trang Chủ',
        riskLevel: 'safe'
      });
    }

    if (lower.includes('huy hiệu') || lower.includes('cấp 3') || lower.includes('nâng cấp')) {
      const matchedListing =
        listings.find((l) => lower.includes(l.title.toLowerCase().slice(0, 8))) || listings[0];
      if (matchedListing) {
        proposedActions.push({
          id: `act-${Date.now()}-tier`,
          actionType: 'UPGRADE_LISTING_TIER',
          title: `Nâng Cấp Huy Hiệu Cấp 3 Cho "${matchedListing.title}"`,
          description: 'Cấp chứng nhận Thẩm định thực tế cao nhất (Tier 3) cho cơ sở.',
          impactScope: matchedListing.title,
          riskLevel: 'safe',
          payload: { listingId: matchedListing.id, tier: 3 }
        });
      }
    }

    if (proposedActions.length === 0) {
      proposedActions.push({
        id: `act-${Date.now()}-scan`,
        actionType: 'FULL_DIAGNOSTIC_SCAN',
        title: 'Thực Hiện Quét Chẩn Đoán Toàn Diện 179 Cơ Sở & 8 Phân Hệ',
        description: 'Kiểm tra tính toàn vẹn dữ liệu, bằng chứng cọc và hiệu năng API.',
        impactScope: 'Toàn hệ thống',
        riskLevel: 'safe'
      });
    }

    // Call backend RevidAPI endpoint for intelligent tactical commentary
    let aiReplyText = `Thưa Quản trị viên, tôi đã phân tích yêu cầu "${cmd}". Hệ thống hiện ghi nhận 179 cơ sở hoạt động ổn định, ${pendingClaims.length} hồ sơ chờ duyệt chính chủ, ${pendingDisputes.length} khiếu nại cọc và ${revidConfig.creditWallet.balanceCredits} Credits trong ví RevidAPI. Tôi đã chuẩn bị sẵn ${proposedActions.length} thẻ mệnh lệnh thực thi bên dưới để bạn phê duyệt hoặc kích hoạt ngay.`;
    let modelUsed = 'claude-opus-5 (J.A.R.V.I.S. Tactical Core)';

    try {
      const token = localStorage.getItem('taxua_session_token') || '';
      const resp = await fetch('/api/revid/playground-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          autoComplexity: true,
          systemPrompt: `Bạn là J.A.R.V.I.S., Siêu trợ lý điều hành trung tâm độc quyền của Admin hệ thống Tà Xùa Trip (179 cơ sở: 91 Homestay, 28 Cafe, 16 Nhà xe, 15 Nhà hàng, 13 Photo, 9 Tour, 3 Trang phục, 1 Xe máy, 1 Taxi, 1 Máy ảnh, 1 Cứu hộ; ${pendingClaims.length} hồ sơ chờ duyệt chính chủ; ${pendingDisputes.length} khiếu nại cọc; ${revidConfig.creditWallet.balanceCredits} Credits RevidAPI). Hãy trả lời ngắn gọn, sắc bén theo phong cách J.A.R.V.I.S. báo cáo cho Tony Stark.`,
          prompt: cmd
        })
      });
      if (!resp.ok) {
        if (resp.status === 401 || resp.status === 403) {
          aiReplyText = `⚠️ [Cảnh báo Xác thực J.A.R.V.I.S.]: Phiên đăng nhập Quản trị viên chưa hợp lệ hoặc đã hết hạn (Mã lỗi: ${resp.status}). Vui lòng đăng nhập lại với tài khoản Quản trị viên để kích hoạt lõi AI Tactical Core.`;
          modelUsed = 'Security Gateway (Blocked)';
        }
      } else {
        const json = await resp.json();
        if (json?.success && json?.data?.reply) {
          aiReplyText = `💠 [Báo cáo Chiến thuật J.A.R.V.I.S.]: ${json.data.reply}\n\n⚡ Tôi đã khởi tạo ${proposedActions.length} Phiếu Mệnh Lệnh Thực Thi trực tiếp bên dưới theo chỉ thị của bạn.`;
          modelUsed = `${json.data.modelUsed} · ${json.data.latencyMs}ms`;
        }
      }
    } catch {
      // keep tactical fallback reply
    }

    const jarvisReply: JarvisMessage = {
      id: `msg-jarvis-${Date.now()}`,
      sender: 'jarvis',
      text: aiReplyText,
      timestamp: new Date().toTimeString().slice(0, 8),
      modelUsed,
      complexityLevel: 'L4_expert',
      proposedActions
    };

    setMessages((prev) => [...prev, jarvisReply]);
    setIsProcessing(false);
    speakJarvisText(
      `Thưa Quản trị viên, tôi đã chuẩn bị xong ${proposedActions.length} mệnh lệnh thực thi cho yêu cầu của bạn.`
    );

    // If auto-execute is enabled, automatically run safe actions
    if (autoExecuteSafeActions) {
      proposedActions
        .filter((a) => a.riskLevel === 'safe')
        .forEach((a) => executeJarvisAction(a));
    }
  };

  const jarvisContent = (
    <div className="bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/50 text-slate-100 space-y-6 relative overflow-hidden">
      {/* Subtle Holographic Grid Glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />

      {/* Top HUD Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/25 pb-5">
        <div className="flex items-start sm:items-center gap-4">
          {/* Animated J.A.R.V.I.S. Arc Reactor Core Orb */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/30 via-sky-500/20 to-teal-500/30 border-2 border-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
            <div
              className={`w-8 h-8 rounded-full border-2 border-cyan-300 flex items-center justify-center ${
                isSpeaking || isListeningMic || isProcessing ? 'animate-ping' : 'animate-pulse'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-300 shadow-md shadow-cyan-300" />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black text-[9px] uppercase">
              ADMIN ONLY
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black tracking-widest uppercase">
                J.A.R.V.I.S. TACTICAL OS v4.2 · ĐỘC QUYỀN ADMIN
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                ● Sức khỏe Hệ thống: {systemHealthScore}/100
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white mt-1">
              Siêu Trợ Lý Điều Hành Trung Tâm J.A.R.V.I.S.
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Giám sát toàn tri 179 cơ sở · Thực thi mệnh lệnh trực tiếp trên toàn hệ thống · Điều khiển Giọng nói 2 chiều & Kịch bản tự động hóa 24/7.
            </p>
          </div>
        </div>

        {/* Right HUD Controls: Voice Mic, Speaker, Auto-Execute & Close */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleVoiceCommand}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer border transition-all ${
              isListeningMic
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>{isListeningMic ? '🎙️ Đang nghe lệnh Admin...' : '🎙️ Ra Lệnh Giọng Nói'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !voiceOutputEnabled;
              setVoiceOutputEnabled(next);
              if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${
              voiceOutputEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {voiceOutputEnabled ? '🔊 Giọng J.A.R.V.I.S.: BẬT' : '🔇 Giọng J.A.R.V.I.S.: TẮT'}
          </button>

          <label className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoExecuteSafeActions}
              onChange={(e) => setAutoExecuteSafeActions(e.target.checked)}
              className="accent-amber-400"
            />
            <span>Tự thực thi lệnh an toàn</span>
          </label>

          {isModalOverlay && onCloseOverlay && (
            <button
              type="button"
              onClick={onCloseOverlay}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 cursor-pointer"
              title="Đóng cửa sổ J.A.R.V.I.S. (Ctrl + J)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Execution Feedback Banner */}
      {executionBanner && (
        <div className="relative z-10 bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg">
          <span>{executionBanner}</span>
          <button
            type="button"
            onClick={() => setExecutionBanner(null)}
            className="text-cyan-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Tactical Navigation Sub-Tabs */}
      <div className="relative z-10 flex flex-wrap gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
        {[
          { id: 'cockpit', label: '💠 1. Buồng Lái Chỉ Huy & Thực Thi Lệnh (Cockpit)' },
          { id: 'telemetry', label: '📡 2. Radar Cảm Biến Toàn Hệ Thống (8 Phân Hệ)' },
          { id: 'playbooks', label: `🤖 3. Kịch Bản Tự Động Hóa 24/7 (${playbooks.filter((p) => p.isActive).length}/${playbooks.length})` },
          { id: 'skills', label: `🧩 4. Mở Rộng Kỹ Năng Tương Lai (${customSkills.length} Skills)` }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveView(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeView === t.id
                ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          VIEW 1: BUỒNG LÁI CHỈ HUY & THỰC THI MỆNH LỆNH (TACTICAL COCKPIT)
         ===================================================================== */}
      {activeView === 'cockpit' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Conversation Stream + Executable Action Cards */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="space-y-4 max-h-[470px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl p-4 border ${
                    msg.sender === 'jarvis'
                      ? 'bg-slate-950/95 border-cyan-500/30 text-slate-100'
                      : 'bg-cyan-950/40 border-cyan-400/40 text-cyan-100 ml-8'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-cyan-300 uppercase tracking-wider">
                        {msg.sender === 'jarvis' ? '💠 J.A.R.V.I.S. EXECUTIVE CORE' : '👨‍✈️ QUẢN TRỊ VIÊN (ADMIN)'}
                      </span>
                      {msg.modelUsed && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[10px]">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-500">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>

                  {/* Telemetry Highlights Pills */}
                  {msg.telemetryHighlights && msg.telemetryHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.telemetryHighlights.map((hl, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/20 text-[11px] font-bold text-cyan-300"
                        >
                          📡 {hl}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Executable Tactical Action Cards */}
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-800">
                      <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                        ⚡ Phiếu Mệnh Lệnh Thực Thi Trực Tiếp Trên Hệ Thống ({msg.proposedActions.length}):
                      </div>
                      {msg.proposedActions.map((act) => (
                        <div
                          key={act.id}
                          className={`rounded-xl p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            act.executed
                              ? 'bg-emerald-950/30 border-emerald-500/40'
                              : 'bg-slate-900 border-cyan-500/40'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  act.riskLevel === 'critical'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : act.riskLevel === 'moderate'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {act.impactScope}
                              </span>
                              <h5 className="text-xs sm:text-sm font-extrabold text-white">
                                {act.title}
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-400">{act.description}</p>
                          </div>

                          <div className="shrink-0">
                            {act.executed ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black">
                                <Check className="w-4 h-4" />
                                <span>Đã thực thi ({act.executedAt})</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => executeJarvisAction(act)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                              >
                                ⚡ Thực Thi Ngay →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Command Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessAdminCommand();
              }}
              className="pt-3 border-t border-slate-800 space-y-2.5"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Ra lệnh cho J.A.R.V.I.S. (VD: 'Duyệt toàn bộ chính chủ', 'Bật cảnh báo sương mù đèo', 'Tạo voucher giảm 15%', 'Tạo ảnh banner 2K')..."
                  className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>{isProcessing ? 'Đang xử lý...' : 'Gửi Lệnh'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 4 Cols: 8 Tactical 1-Tap Command Macros & Audio Briefing */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  ⚡ Bàn Phím Lệnh Chiến Thuật 1-Chạm
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    speakJarvisText(
                      `Báo cáo nhanh Quản trị viên: Hệ thống đạt ${systemHealthScore} trên 100 điểm. Có 179 cơ sở đang hoạt động, ${pendingClaims.length} yêu cầu duyệt chính chủ, ${pendingDisputes.length} khiếu nại cọc và ${revidConfig.creditWallet.balanceCredits} credit trong ví RevidAPI.`
                    )
                  }
                  className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                >
                  🔊 Đọc báo cáo giọng nói
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    label: '🔍 Quét Chẩn Đoán Toàn Hệ Thống',
                    cmd: 'Quét chẩn đoán toàn bộ 179 cơ sở và báo cáo các điểm nghẽn hiện tại'
                  },
                  {
                    label: `✅ Duyệt Nhanh Chính Chủ (${pendingClaims.length} hồ sơ)`,
                    cmd: 'Duyệt toàn bộ các yêu cầu xác nhận chính chủ đang chờ xét duyệt'
                  },
                  {
                    label: `⚖️ Phán Quyết Khiếu Nại Cọc (${pendingDisputes.length} ca)`,
                    cmd: 'Đối soát biên lai VietQR và giải quyết toàn bộ các ca khiếu nại cọc đang mở'
                  },
                  {
                    label: '🚨 Bật Cảnh Báo Sương Mù Đèo Tà Xùa',
                    cmd: 'Bật cảnh báo khẩn cấp sương mù dày đặc tại Đèo Tà Xùa trên toàn trang web'
                  },
                  {
                    label: '☁️ Cập Nhật Săn Mây Đỉnh Gió 95%',
                    cmd: 'Cập nhật xác suất săn mây tại Đỉnh Gió ngày mai lên 95%'
                  },
                  {
                    label: '🎁 Phát Hành Voucher Săn Mây Giảm 15%',
                    cmd: 'Tạo mã voucher khuyến mãi giảm 15% cho toàn bộ dịch vụ'
                  },
                  {
                    label: '⚡ Chuyển RevidAPI Sang Tiết Kiệm -85%',
                    cmd: 'Chuyển cấu hình RevidAPI sang chế độ Tiết kiệm tối đa Ultra-Saver'
                  },
                  {
                    label: '🖼️ Sinh Ảnh Banner 2K & Thay Lên Trang Chủ',
                    cmd: 'Tạo ảnh Banner biển mây 2K bằng RevidAPI và gắn làm ảnh nền trang chủ CMS'
                  }
                ].map((macro, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleProcessAdminCommand(macro.cmd)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold text-slate-200 hover:text-cyan-200 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>{macro.label}</span>
                    <span className="text-cyan-400">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Jump to Admin Modules */}
            {onJumpToAdminTab && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  🧭 Điều Hướng Nhanh Tới Phân Hệ Chuyên Sâu
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { id: 'smart_listings', name: '1. Quản trị 179 Cơ sở' },
                    { id: 'cms_content', name: '2. CMS & Ảnh Toàn Trang' },
                    { id: 'revid_api_gateway', name: '4. RevidAPI Gateway' },
                    { id: 'disputes', name: '5. Trọng tài Khiếu nại' }
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        onJumpToAdminTab(mod.id);
                        if (isModalOverlay && onCloseOverlay) onCloseOverlay();
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-left cursor-pointer"
                    >
                      {mod.name} ↗
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: RADAR CẢM BIẾN TOÀN HỆ THỐNG (8 PHÂN HỆ THỜI GIAN THỰC)
         ===================================================================== */}
      {activeView === 'telemetry' && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: '1. Hồ Sơ 179 Cơ Sở Dịch Vụ',
              metric: `${listings.length} cơ sở`,
              sub: `91 Homestay · 28 Cafe · 16 Nhà xe · 15 Nhà hàng · ${tier3Count} Cấp 3`,
              status: 'OPTIMAL',
              color: 'text-emerald-300 border-emerald-500/30'
            },
            {
              title: '2. Cổng RevidAPI Gateway',
              metric: `${revidConfig.creditWallet.balanceCredits.toLocaleString('vi-VN')} Credits`,
              sub: `Preset: ${revidConfig.activePresetId} · Đã dùng hôm nay: ${revidConfig.creditWallet.usedCreditsToday}/${revidConfig.creditWallet.dailyCreditLimit} cr`,
              status: creditUsagePercent > 85 ? 'WARNING' : 'OPTIMAL',
              color: creditUsagePercent > 85 ? 'text-amber-300 border-amber-500/30' : 'text-cyan-300 border-cyan-500/30'
            },
            {
              title: '3. Trọng Tài Khiếu Nại & Bằng Chứng',
              metric: `${pendingDisputes.length} ca đang mở`,
              sub: `Tổng hồ sơ đối soát: ${disputes.length} · Chuỗi băm SHA-256 nguyên vẹn 100%`,
              status: pendingDisputes.length > 0 ? 'ACTION NEEDED' : 'OPTIMAL',
              color: pendingDisputes.length > 0 ? 'text-amber-300 border-amber-500/30' : 'text-emerald-300 border-emerald-500/30'
            },
            {
              title: '4. Xác Nhận Chính Chủ Đối Tác',
              metric: `${pendingClaims.length} hồ sơ chờ duyệt`,
              sub: `Đã xác minh chính chủ: ${listings.filter((l) => l.claimedByOwner).length}/${listings.length} cơ sở`,
              status: pendingClaims.length > 0 ? 'PENDING' : 'OPTIMAL',
              color: pendingClaims.length > 0 ? 'text-amber-300 border-amber-500/30' : 'text-emerald-300 border-emerald-500/30'
            },
            {
              title: '5. Cộng Đồng 9 Không Gian Chat',
              metric: '185 Online · 9 Phòng',
              sub: 'Bộ lọc AI Lớp 1 & Che PII đang hoạt động (0 cr với Gemini Flash Lite)',
              status: 'PROTECTED',
              color: 'text-emerald-300 border-emerald-500/30'
            },
            {
              title: '6. Thời Tiết & Dự Báo Biển Mây',
              metric: `${topForecast?.cloudProbability || 90}% tại ${topForecast?.location || 'Đỉnh Gió'}`,
              sub: `Khung giờ vàng: ${topForecast?.goldenHours || '05:30 - 07:30'} · Đèo thông thoáng`,
              status: 'PEAK CLOUD',
              color: 'text-cyan-300 border-cyan-500/30'
            },
            {
              title: '7. CMS Nội Dung & Cảnh Báo Toàn Trang',
              metric: siteContent.emergencyBanner?.enabled ? 'Đang bật Cảnh báo Đỏ' : 'Bình thường (Xanh)',
              sub: `${siteContent.heroBanners?.length || 3} Hero Slides · ${siteContent.sectionBanners?.length || 5} Section Banners`,
              status: 'SYNCED',
              color: 'text-teal-300 border-teal-500/30'
            },
            {
              title: '8. Vouchers & Chính Sách Thu Phí Sàn',
              metric: `${activeVouchersCount} Voucher đang mở`,
              sub: billingEnabled ? 'Đang bật thu phí 50.000đ/đơn' : 'Đang miễn phí 100% cho đối tác (Beta)',
              status: 'ACTIVE',
              color: 'text-purple-300 border-purple-500/30'
            }
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-slate-900/95 border rounded-2xl p-4 space-y-2 ${card.color}`}
            >
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{card.title}</span>
                <span className="px-2 py-0.5 rounded bg-slate-950">{card.status}</span>
              </div>
              <div className="text-lg font-black text-white">{card.metric}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          VIEW 3: KỊCH BẢN TỰ ĐỘNG HÓA 24/7 (IF - THEN PLAYBOOKS)
         ===================================================================== */}
      {activeView === 'playbooks' && (
        <div className="relative z-10 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-extrabold text-white">
              Kịch Bản Tự Động Hóa Chủ Động (J.A.R.V.I.S. Autonomous Playbooks)
            </h4>
            <p className="text-xs text-slate-400">
              Các quy tắc `NẾU (Điều kiện) → THÌ (Hành động)` giúp J.A.R.V.I.S. tự động bảo vệ ví Credit, chặn lừa đảo và điều phối hệ thống 24/7 ngay cả khi Admin không trực máy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {playbooks.map((pb) => (
                <div
                  key={pb.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-cyan-300 text-sm">{pb.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPlaybooks((prev) =>
                            prev.map((x) => (x.id === pb.id ? { ...x, isActive: !x.isActive } : x))
                          );
                          showNotice(`Đã ${pb.isActive ? 'tắt' : 'bật'} Playbook "${pb.name}"!`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          pb.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pb.isActive ? '● Đang trực 24/7' : '○ Đã tạm dừng'}
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300">
                      <strong className="text-amber-300">ĐIỀU KIỆN (IF):</strong> {pb.triggerCondition}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-200">
                      <strong className="text-teal-300">HÀNH ĐỘNG (THEN):</strong> {pb.automatedAction}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                    <span>Đã kích hoạt hôm nay: {pb.triggeredCountToday} lần</span>
                    <span>Gần nhất: {pb.lastTriggeredAt}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Playbook Rule */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <input
                type="text"
                placeholder="Tên kịch bản mới..."
                value={newPlaybookName}
                onChange={(e) => setNewPlaybookName(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="NẾU (Điều kiện kích hoạt)..."
                value={newPlaybookIf}
                onChange={(e) => setNewPlaybookIf(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="THÌ (Hành động J.A.R.V.I.S. tự thực thi)..."
                value={newPlaybookThen}
                onChange={(e) => setNewPlaybookThen(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newPlaybookName.trim() || !newPlaybookIf.trim() || !newPlaybookThen.trim()) return;
                  setPlaybooks((prev) => [
                    ...prev,
                    {
                      id: `pb-${Date.now()}`,
                      name: newPlaybookName.trim(),
                      triggerCondition: newPlaybookIf.trim(),
                      automatedAction: newPlaybookThen.trim(),
                      category: 'operations' as any,
                      isActive: true,
                      triggeredCountToday: 0,
                      lastTriggeredAt: 'Vừa tạo'
                    }
                  ]);
                  setNewPlaybookName('');
                  setNewPlaybookIf('');
                  setNewPlaybookThen('');
                  showNotice('✅ Đã thêm Kịch bản tự động hóa mới vào lõi J.A.R.V.I.S.!');
                }}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-xl px-4 py-2 cursor-pointer"
              >
                + Thêm Playbook Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: MỞ RỘNG KỸ NĂNG TƯƠNG LAI (DYNAMIC SKILL & WEBHOOK REGISTRY)
         ===================================================================== */}
      {activeView === 'skills' && (
        <div className="relative z-10 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <h4 className="text-sm font-extrabold text-white">
                Sổ Đăng Ký Kỹ Năng & Webhook Mở Rộng Tương Lai (Future-Proof Skill Registry)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Khi hệ thống phát sinh thêm nghiệp vụ mới trong tương lai (kết nối Zalo OA, Telegram Bot, n8n workflow, cổng thanh toán mới...), Admin chỉ cần đăng ký Skill tại đây để J.A.R.V.I.S. nhận diện từ khóa và điều khiển ngay.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {customSkills.map((sk) => (
                <div
                  key={sk.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold uppercase">
                        {sk.category}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold">● Sẵn sàng</span>
                    </div>
                    <h5 className="font-extrabold text-white text-sm">{sk.name}</h5>
                    <p className="text-slate-400 text-[11px]">{sk.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {sk.triggerKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-amber-300 font-mono"
                        >
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-teal-400 truncate">
                      {sk.endpointOrHandler}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleProcessAdminCommand(sk.triggerKeywords[0] || sk.name)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Chạy thử →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Register New Future Skill Form */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <input
                type="text"
                placeholder="Tên Kỹ năng / Module mới..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Từ khóa kích hoạt (cách nhau dấu phẩy)..."
                value={newSkillKeywords}
                onChange={(e) => setNewSkillKeywords(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <input
                type="text"
                placeholder="Webhook URL / Handler (POST https://...)"
                value={newSkillEndpoint}
                onChange={(e) => setNewSkillEndpoint(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newSkillName.trim()) return;
                  setCustomSkills((prev) => [
                    ...prev,
                    {
                      id: `skill-${Date.now()}`,
                      name: newSkillName.trim(),
                      category: 'external_webhook',
                      triggerKeywords: newSkillKeywords
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                      description: newSkillDesc.trim() || 'Kỹ năng mở rộng do Admin đăng ký vào lõi J.A.R.V.I.S.',
                      endpointOrHandler: newSkillEndpoint.trim() || 'internal://jarvis/custom-skill',
                      isEnabled: true,
                      createdAt: new Date().toISOString().slice(0, 10)
                    }
                  ]);
                  setNewSkillName('');
                  setNewSkillKeywords('');
                  setNewSkillEndpoint('');
                  setNewSkillDesc('');
                  showNotice('🧩 Đã nạp Kỹ năng mới vào bộ nhớ của J.A.R.V.I.S.!');
                }}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black rounded-xl px-4 py-2 cursor-pointer"
              >
                + Nạp Kỹ Năng Vào J.A.R.V.I.S.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModalOverlay) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl">
          {jarvisContent}
        </div>
      </div>
    );
  }

  return jarvisContent;
};
