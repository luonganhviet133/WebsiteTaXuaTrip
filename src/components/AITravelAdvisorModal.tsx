import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Users,
  MapPin,
  Wallet,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BedDouble,
  Car,
  Utensils,
  Camera,
  Coffee,
  Mountain,
  Tag,
  Gift,
  Share2,
  Printer,
  ChevronRight,
  Check,
  Send,
  Bot,
  RefreshCw,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Listing, PromoVoucher } from '../types/index.ts';
import { TripConsultRequest, TripConsultResponse, calculateNights } from '../server/aiAdvisor.ts';

interface AITravelAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectListing?: (listing: Listing) => void;
  onBookListing?: (listing: Listing) => void;
  allListings?: Listing[];
  vouchers?: PromoVoucher[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export const AITravelAdvisorModal: React.FC<AITravelAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectListing,
  allListings = [],
  vouchers = [],
  initialCheckIn = '2026-11-14',
  initialCheckOut = '2026-11-16',
  initialGuests = 2
}) => {
  // Form State
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [pickupLocation, setPickupLocation] = useState('Hà Nội (Mỹ Đình / Phố Cổ)');
  const [budgetAmount, setBudgetAmount] = useState('1800000');
  const [budgetType, setBudgetType] = useState<'per_person' | 'total'>('per_person');
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([
    'View mây phòng ngủ',
    'Có chỗ đậu ô tô'
  ]);
  const [userQuery, setUserQuery] = useState('');

  // Execution & Response State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<TripConsultResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'itinerary' | 'homestays' | 'chat'>('overview');
  const [isCopied, setIsCopied] = useState(false);

  // Free Chat Q&A State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào! Mình là Trợ lý AI Du lịch Tà Xùa. Bạn có thể nhập yêu cầu ngày đi, số người, điểm đón và ngân sách ở bảng bên trên, hoặc hỏi trực tiếp bất kỳ điều gì về giá phòng và lịch trình nhé!',
      time: 'Vừa xong'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);

  if (!isOpen) return null;

  const nights = calculateNights(checkIn, checkOut);

  const togglePreference = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const PREFERENCE_OPTIONS = [
    { id: 'cloud', label: 'View mây phòng ngủ', icon: Mountain },
    { id: 'car', label: 'Có chỗ đậu ô tô', icon: Car },
    { id: 'quiet', label: 'Yên tĩnh nghỉ dưỡng', icon: BedDouble },
    { id: 'hike', label: 'Trekking Sống Lưng Khủng Long', icon: Compass },
    { id: 'food', label: 'Ăn lẩu cá tầm / gà đen', icon: Utensils },
    { id: 'photo', label: 'Thuê váy thổ cẩm / thợ ảnh', icon: Camera }
  ];

  const PICKUP_SUGGESTIONS = [
    'Hà Nội (Mỹ Đình / Phố Cổ)',
    'Sân bay Quốc tế Nội Bài',
    'Bắc Yên (Đón trung chuyển đèo)',
    'Thanh Sơn / Phú Thọ',
    'Tự túc xe máy cá nhân'
  ];

  const BUDGET_PRESETS = [
    { label: '1.2 Tr/người (Tiết kiệm)', value: '1200000', type: 'per_person' as const },
    { label: '1.8 Tr/người (Tiêu chuẩn hot)', value: '1800000', type: 'per_person' as const },
    { label: '2.5 Tr/người (VIP View Mây)', value: '2500000', type: 'per_person' as const },
    { label: '5 Tr/đoàn (Gia đình)', value: '5000000', type: 'total' as const }
  ];

  const handleStartConsultation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingStep(1);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 700);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1400);

    const payload: TripConsultRequest = {
      checkIn,
      checkOut,
      guests,
      pickupLocation,
      budget: parseInt(budgetAmount, 10) || 1800000,
      budgetType,
      preferences: selectedPrefs,
      notes: userQuery,
      userMessage: userQuery
    };

    try {
      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setResult(resData.data);
        setActiveResultTab('overview');
      } else {
        throw new Error(resData.error || 'Không nhận được dữ liệu từ AI');
      }
    } catch (err: any) {
      console.warn('API error, relying on local fallback:', err);
      // Fallback request
      try {
        const fbRes = await fetch('/api/ai/quick-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const fbData = await fbRes.json();
        if (fbData.data) {
          setResult(fbData.data);
          setActiveResultTab('overview');
        }
      } catch (fbErr: any) {
        setErrorMsg('Tạm thời không thể kết nối tới dịch vụ AI. Vui lòng thử lại sau giây lát.');
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSubmitting) return;

    const userText = chatInput.trim();
    setChatInput('');
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setIsChatSubmitting(true);

    try {
      const payload: TripConsultRequest = {
        checkIn,
        checkOut,
        guests,
        pickupLocation,
        budget: parseInt(budgetAmount, 10) || 1800000,
        budgetType,
        preferences: selectedPrefs,
        userMessage: userText
      };

      const response = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();

      let reply = 'Đã đối soát dữ liệu hệ thống: ';
      if (resData.data) {
        reply = resData.data.summary;
        if (resData.data.budgetAssessment) {
          reply += `\n\n💰 Dự toán: ${resData.data.budgetAssessment.estimatedCostPerPerson.toLocaleString('vi-VN')} ₫/người. ${resData.data.budgetAssessment.verdictMessage}`;
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Đã nhận câu hỏi của bạn. Hệ thống đang kiểm tra danh sách homestay và lịch xe trống phù hợp nhất cho đoàn.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatSubmitting(false);
    }
  };

  const handleCopyPlan = () => {
    if (!result) return;
    const planText = `TÀ XÙA TRIP - KẾ HOẠCH DU LỊCH ĐÃ ĐỐI SOÁT DỮ LIỆU THỰC
${result.summary}
Thời gian: ${nights + 1} Ngày ${nights} Đêm (${checkIn} đến ${checkOut})
Đoàn: ${guests} khách - Điểm đón: ${pickupLocation}
Chi phí dự tính: ${result.budgetAssessment.estimatedTotalCost.toLocaleString('vi-VN')} ₫ (~${result.budgetAssessment.estimatedCostPerPerson.toLocaleString('vi-VN')} ₫/người)
Homestay đề xuất: ${result.recommendedHomestays.map((h) => `${h.name} (${h.area} - ${h.pricePerNight.toLocaleString('vi-VN')}đ)`).join(', ')}
Phương tiện: ${result.recommendedTransport.type} (${result.recommendedTransport.details})
Hotline hỗ trợ: 0981 234 567`;

    navigator.clipboard.writeText(planText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-[#052247] via-brand-800 to-[#0a468a] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-teal-300 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Trợ Lý AI Tư Vấn Phòng & Lịch Trình Tà Xùa
                </h2>
                <span className="text-xs font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-300/30">
                  Dữ liệu thật 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                AI gợi ý cơ sở, lịch xe và dự toán ngân sách tham khảo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ tư vấn AI"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
          {/* Top Form: Nhập tiêu chí chuyến đi */}
          <form onSubmit={handleStartConsultation} className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-xs font-black uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Thông số chuyến đi cần tư vấn
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                {nights + 1} ngày {nights} đêm · {guests} khách
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Ngày đi */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Ngày đi (Check-in)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs font-bold text-brand-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    required
                  />
                </div>
              </div>

              {/* Ngày về */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Ngày về (Check-out)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-bold text-brand-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    required
                  />
                </div>
              </div>

              {/* Số người */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Số lượng người
                </label>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                    className="w-full text-xs font-bold text-brand-800 bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 người (Đi một mình)</option>
                    <option value={2}>2 người (Cặp đôi / Bạn thân)</option>
                    <option value={3}>3 người</option>
                    <option value={4}>4 người (Gia đình / Nhóm bạn)</option>
                    <option value={6}>6 người (Nhóm đoàn)</option>
                    <option value={8}>8 người (Nguyên căn)</option>
                    <option value={12}>12+ người (Đoàn đông)</option>
                  </select>
                </div>
              </div>

              {/* Ngân sách */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Ngân sách ({budgetType === 'per_person' ? '₫ / người' : 'Tổng ₫'})
                  </label>
                  <button
                    type="button"
                    onClick={() => setBudgetType(budgetType === 'per_person' ? 'total' : 'per_person')}
                    className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    Đổi sang {budgetType === 'per_person' ? 'Tổng cả đoàn' : 'Từng người'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="100000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="VD: 1800000"
                    className="w-full text-xs font-bold text-brand-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₫</span>
                </div>
              </div>
            </div>

            {/* Điểm đón */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Điểm đón khởi hành
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-rose-500" />
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Nhập địa chỉ hoặc điểm đón cụ thể..."
                    className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {PICKUP_SUGGESTIONS.slice(0, 3).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setPickupLocation(sug)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                        pickupLocation === sug
                          ? 'bg-brand-800 text-white border-brand-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      {sug.split(' ')[0]} {sug.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sở thích / Tiêu chí ưu tiên */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Nhu cầu & Tiêu chí mong muốn
              </label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((pref) => {
                  const Icon = pref.icon;
                  const isSelected = selectedPrefs.includes(pref.label);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => togglePreference(pref.label)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs ring-1 ring-teal-400'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{pref.label}</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick budget presets */}
            <div className="flex items-center justify-between pt-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-600">Gợi ý nhanh:</span>
                {BUDGET_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setBudgetAmount(p.value);
                      setBudgetType(p.type);
                    }}
                    className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200/60 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white font-black text-xs sm:text-sm shadow-md transition-all transform active:scale-95 cursor-pointer disabled:opacity-70 ml-auto"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-300" />
                    <span>AI đang kiểm tra dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Kiểm tra & Tư vấn ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Loading Animation with Step Feedback */}
          {isLoading && (
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-md animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-brand-800">
                AI đang rà soát dữ liệu thực tế tại Tà Xùa...
              </h3>
              <div className="max-w-md mx-auto space-y-2 text-xs font-semibold text-slate-600">
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 1 ? 'text-teal-800' : 'text-slate-400'}`}>
                  {loadingStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <Clock className="w-4 h-4" />}
                  <span>Đang đối chiếu danh sách homestay...</span>
                </div>
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 2 ? 'text-teal-800' : 'text-slate-400'}`}>
                  {loadingStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <Clock className="w-4 h-4" />}
                  <span>Tính toán chi phí xe khách Limousine từ {pickupLocation}...</span>
                </div>
                <div className={`flex items-center justify-center gap-2 ${loadingStep >= 3 ? 'text-teal-800' : 'text-slate-400'}`}>
                  {loadingStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : <Clock className="w-4 h-4" />}
                  <span>Xây dựng lịch trình săn mây giờ vàng & áp dụng mã giảm giá...</span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMsg}</p>
                <p className="text-rose-600 mt-0.5">Vui lòng thử bấm "Kiểm tra & Tư vấn ngay" lại.</p>
              </div>
            </div>
          )}

          {/* Results Presentation */}
          {result && !isLoading && (
            <div className="space-y-6">
              {/* Navigation Segmented Tabs for Results */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: '📊 Tóm Tắt & Dự Toán Ngân Sách', icon: Wallet },
                  { id: 'itinerary', label: '📅 Lịch Trình Chi Tiết Từng Ngày', icon: Compass },
                  { id: 'homestays', label: '🏡 Homestay Khớp Tiêu Chí', icon: BedDouble },
                  { id: 'chat', label: '💬 Hỏi Thêm Trợ Lý AI', icon: MessageSquare }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveResultTab(tab.id as any)}
                    className={`inline-flex items-center gap-2 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeResultTab === tab.id
                        ? 'bg-brand-800 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleCopyPlan}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Đã sao chép!' : 'Chia sẻ kế hoạch'}</span>
                </button>
              </div>

              {/* Tab 1: Overview & Budget Breakdown */}
              {activeResultTab === 'overview' && (
                <div className="space-y-5">
                  {/* Executive Summary Card */}
                  <div className="bg-gradient-to-br from-teal-50/80 to-sky-50/80 border border-teal-200/80 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-5 h-5" />
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-brand-800">
                          Đánh giá từ Trợ lý AI Du lịch Tà Xùa:
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Assessment Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Ngân sách bạn có
                      </div>
                      <div className="text-lg sm:text-xl font-black text-brand-800 mt-1">
                        {result.budgetAssessment.userBudget.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        (~{Math.round(result.budgetAssessment.userBudget / guests).toLocaleString('vi-VN')} ₫ / khách)
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Tổng chi phí dự tính
                      </div>
                      <div className="text-lg sm:text-xl font-black text-teal-700 mt-1">
                        {result.budgetAssessment.estimatedTotalCost.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="text-xs font-bold text-teal-600 mt-0.5">
                        {result.budgetAssessment.estimatedCostPerPerson.toLocaleString('vi-VN')} ₫ / khách
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Tình trạng ngân sách
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {result.budgetAssessment.status === 'comfortable' && (
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                            ✨ Dư dả ({Math.round(result.budgetAssessment.savingsOrDeficit).toLocaleString('vi-VN')} ₫)
                          </span>
                        )}
                        {result.budgetAssessment.status === 'balanced' && (
                          <span className="text-xs font-black text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
                            ✅ Cân đối rất chuẩn
                          </span>
                        )}
                        {result.budgetAssessment.status === 'tight' && (
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                            ⚠️ Hơi chênh lệch
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 leading-snug">
                        {result.budgetAssessment.verdictMessage}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Cost Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-800 mb-3">
                      Bảng phân bổ chi phí thực tế ({guests} khách · {nights + 1}N{nights}Đ)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <BedDouble className="w-4 h-4 mx-auto text-teal-600 mb-1" />
                        <div className="text-xs font-bold text-slate-500">Tiền phòng ({nights}đ)</div>
                        <div className="text-xs font-black text-brand-800 mt-0.5">
                          {result.breakdown.stayCost.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <Car className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                        <div className="text-xs font-bold text-slate-500">Xe khứ hồi</div>
                        <div className="text-xs font-black text-brand-800 mt-0.5">
                          {result.breakdown.transportCost.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <Utensils className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                        <div className="text-xs font-bold text-slate-500">Ăn uống đặc sản</div>
                        <div className="text-xs font-black text-brand-800 mt-0.5">
                          {result.breakdown.diningCost.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <Compass className="w-4 h-4 mx-auto text-rose-600 mb-1" />
                        <div className="text-xs font-bold text-slate-500">Tour & Cafe</div>
                        <div className="text-xs font-black text-brand-800 mt-0.5">
                          {result.breakdown.activitiesCost.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                        <Wallet className="w-4 h-4 mx-auto text-slate-600 mb-1" />
                        <div className="text-xs font-bold text-slate-500">Dự phòng phát sinh</div>
                        <div className="text-xs font-black text-brand-800 mt-0.5">
                          {result.breakdown.contingencyCost.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Perks & Vouchers */}
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          Thành viên: nhận {result.memberPointsReward} Điểm Mây khi chuyến ở hoàn tất
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Đặt qua Tà Xùa Trip để được đảm bảo phòng thẩm định, hỗ trợ giải quyết khiếu nại 24/7
                        </p>
                      </div>
                    </div>
                    {result.applicableVouchers.length > 0 && (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                          Mã: {result.applicableVouchers[0].code}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Day-by-Day Itinerary */}
              {activeResultTab === 'itinerary' && (
                <div className="space-y-6">
                  {result.itinerary.map((day) => (
                    <div key={day.dayNumber} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-100/80 px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-brand-800">
                            {day.dayTitle}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {day.theme}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-teal-800 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs shrink-0">
                          Ngày {day.dayNumber}
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 divide-y divide-slate-100">
                        {day.activities.map((act, actIdx) => (
                          <div key={actIdx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3 sm:gap-4">
                            <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap mt-0.5">
                              {act.time}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {act.activity}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{act.location}</span>
                              </div>
                              {act.tip && (
                                <div className="mt-1.5 text-xs text-teal-900 bg-teal-50/60 rounded-lg px-2.5 py-1 border border-teal-100">
                                  💡 <strong>Mẹo Tà Xùa:</strong> {act.tip}
                                </div>
                              )}
                            </div>
                            {act.costEstimate > 0 && (
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-500">Dự tính:</span>
                                <div className="text-xs font-black text-slate-800">
                                  ~{act.costEstimate.toLocaleString('vi-VN')} ₫
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Travel Tips */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-800 mb-2.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Lưu ý vàng khi du lịch Tà Xùa
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {result.travelTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-teal-600 font-bold shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Recommended Homestays */}
              {activeResultTab === 'homestays' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-brand-800">
                      Homestay được AI gợi ý
                    </h4>
                    <span className="text-xs text-slate-500">
                      {result.recommendedHomestays.length} gợi ý phù hợp
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {result.recommendedHomestays.map((home) => {
                      const fullListing = allListings.find((l) => l.id === home.id);
                      return (
                        <div
                          key={home.id}
                          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col"
                        >
                          <div className="relative h-36 bg-slate-100 overflow-hidden">
                            <img
                              src={home.coverImage}
                              alt={home.name}
                              className="w-full h-full object-cover"
                            />
                            {home.hasCloudView && (
                              <span className="absolute top-2 left-2 text-xs font-black uppercase bg-teal-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                                ☁️ View Mây
                              </span>
                            )}
                            <span className="absolute bottom-2 right-2 text-xs font-black bg-slate-950/80 text-white px-2 py-0.5 rounded-md">
                              ⭐ {home.rating} ({home.reviewCount})
                            </span>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-500">{home.area}</div>
                              <h5 className="text-xs sm:text-sm font-black text-brand-800 line-clamp-1 mt-0.5">
                                {home.name}
                              </h5>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-snug">
                                {home.reason}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500">Giá phòng:</span>
                                <span className="text-xs font-black text-teal-800">
                                  {home.pricePerNight.toLocaleString('vi-VN')} ₫ / đêm
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {fullListing && onSelectListing ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectListing(fullListing);
                                      onClose();
                                    }}
                                    className="flex-1 bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold py-2 rounded-xl text-center transition-colors cursor-pointer"
                                  >
                                    Xem phòng
                                  </button>
                                ) : (
                                  <a
                                    href={`tel:${home.phone}`}
                                    className="flex-1 bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold py-2 rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Gọi đặt</span>
                                  </a>
                                )}
                                <a
                                  href={`https://zalo.me/${home.zalo}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-xs font-bold rounded-xl transition-colors"
                                >
                                  Zalo
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Interactive Member Chat with AI */}
              {activeResultTab === 'chat' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col h-96">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                    <span className="text-xs font-black uppercase text-brand-800 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-teal-600" />
                      Trò chuyện trực tiếp cùng AI Cố vấn
                    </span>
                    <span className="text-xs text-slate-500">
                      Sẵn sàng giải đáp mọi thắc mắc về đường đi, giá phòng & đèo dốc
                    </span>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'ai' && (
                          <span className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                          </span>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-brand-800 text-white rounded-br-none'
                              : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none shadow-2xs'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          <div
                            className={`text-xs mt-1 text-right ${
                              msg.sender === 'user' ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isChatSubmitting && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        <span>AI đang kiểm tra cơ sở dữ liệu và soạn câu trả lời...</span>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChatMessage} className="pt-3 border-t border-slate-200 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Hỏi thêm: Có homestay nào ô tô vào tận sân không? Cần mang đồ gì?"
                      className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={isChatSubmitting || !chatInput.trim()}
                      className="bg-brand-800 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-5 sm:px-8 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Dữ liệu đối soát trực tiếp từ Tà Xùa Trip · Bảo vệ quyền lợi thành viên</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
