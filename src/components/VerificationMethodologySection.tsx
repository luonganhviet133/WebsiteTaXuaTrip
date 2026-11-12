import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  Phone,
  CreditCard,
  FileCheck,
  Eye,
  Compass,
  Sparkles,
  MapPin,
  ArrowRight,
  Lock,
  HelpCircle,
  XCircle,
  ChevronRight,
  AlertCircle,
  Award,
  ShieldAlert,
  ExternalLink,
  Flame,
  Wifi,
  Car,
  Camera,
  RefreshCw
} from 'lucide-react';
import { Listing, SiteContentConfig } from '../types/index.ts';
import { formatVND } from '../utils/rules.ts';

interface VerificationMethodologySectionProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onOpenDispute?: () => void;
  onOpenPartnerClaim?: (listing?: Listing) => void;
  onNavigateToStays: (filterTier?: number) => void;
  siteContent?: SiteContentConfig;
}

// Danh sách đen mẫu cảnh báo các trường hợp lừa đảo đã ghi nhận thực tế trên các hội nhóm Tà Xùa
interface BlacklistCase {
  phoneNumber: string;
  accountNumber?: string;
  fakeName: string;
  scamType: string;
  reportedDate: string;
  details: string;
}

const SAMPLE_BLACKLIST: BlacklistCase[] = [
  {
    phoneNumber: '0389124892',
    accountNumber: '10387654321',
    fakeName: 'Fanpage Giả Mạo: Homestay Mị Ơi Tà Xùa Giá Rẻ',
    scamType: 'Lừa cọc phòng qua Fanpage chạy quảng cáo',
    reportedDate: '10/2026',
    details: 'Sao chép toàn bộ ảnh của Mị Ơi, hạ giá phòng xuống 350k/đêm rồi yêu cầu cọc 100%. Sau khi nhận tiền lập tức chặn số và khóa chat.'
  },
  {
    phoneNumber: '0912445891',
    accountNumber: '99882233441',
    fakeName: 'Combo Xe Khách + Bungalow Tà Xùa 499k',
    scamType: 'Combo du lịch ảo không có cơ sở thật',
    reportedDate: '09/2026',
    details: 'Sử dụng hình ảnh của một resort tại Sa Pa để quảng cáo view Tà Xùa. Thực tế không có phòng và không có xe đón tại Hà Nội.'
  },
  {
    phoneNumber: '0778912345',
    accountNumber: '0451000345678',
    fakeName: 'Zalo mạo danh Quản lý Nhà Của An',
    scamType: 'Mạo danh nhân viên lễ tân gửi STK cá nhân',
    reportedDate: '11/2026',
    details: 'Chủ động nhắn tin cho khách hàng bình luận trên các bài review, gửi số tài khoản cá nhân khác với tài khoản chính thức của chủ nhà.'
  }
];

export const VerificationMethodologySection: React.FC<VerificationMethodologySectionProps> = ({
  listings,
  onSelectListing,
  onOpenDispute,
  onOpenPartnerClaim,
  onNavigateToStays,
  siteContent
}) => {
  const [scannerQuery, setScannerQuery] = useState('');
  const [activeTierTab, setActiveTierTab] = useState<number>(3);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [hasScanned, setHasScanned] = useState(false);

  // Banner lấy từ cấu hình CMS
  const verifiedSecBanner = siteContent?.sectionBanners?.find((s) => s.sectionKey === 'verified');

  // Thống kê số lượng theo cấp độ
  const tierCounts = useMemo(() => {
    return {
      tier1: listings.filter((l) => l.verificationTier === 1).length,
      tier2: listings.filter((l) => l.verificationTier === 2).length,
      tier3: listings.filter((l) => l.verificationTier === 3).length,
      total: listings.length
    };
  }, [listings]);

  // Bộ lọc quét Scanner
  const scanResult = useMemo(() => {
    const q = scannerQuery.trim().toLowerCase();
    if (!q) return null;

    const normalizedDigits = q.replace(/\D/g, '');

    // 1. Kiểm tra trong Blacklist lừa đảo
    const blacklisted = SAMPLE_BLACKLIST.find((item) => {
      const matchPhone = normalizedDigits && item.phoneNumber.replace(/\D/g, '').includes(normalizedDigits);
      const matchAccount = normalizedDigits && item.accountNumber?.includes(normalizedDigits);
      const matchName = item.fakeName.toLowerCase().includes(q);
      return matchPhone || matchAccount || matchName;
    });

    if (blacklisted) {
      return {
        type: 'scam' as const,
        data: blacklisted
      };
    }

    // 2. Kiểm tra trong danh sách cơ sở thật đã thẩm định
    const matchedListing = listings.find((l) => {
      const matchTitle = l.title.toLowerCase().includes(q);
      const phoneDigits = l.phone.replace(/\D/g, '');
      const matchPhone = normalizedDigits && phoneDigits.includes(normalizedDigits);
      const zaloDigits = l.zalo ? l.zalo.replace(/\D/g, '') : '';
      const matchZalo = normalizedDigits && zaloDigits.includes(normalizedDigits);
      const accountDigits = l.bankAccount?.accountNumber ? l.bankAccount.accountNumber.replace(/\D/g, '') : '';
      const matchAccount = normalizedDigits && accountDigits.includes(normalizedDigits);
      const accountHolder = l.bankAccount?.accountHolder ? l.bankAccount.accountHolder.toLowerCase() : '';
      const matchHolder = accountHolder && accountHolder.includes(q);

      return matchTitle || matchPhone || matchZalo || matchAccount || matchHolder;
    });

    if (matchedListing) {
      return {
        type: 'verified' as const,
        data: matchedListing
      };
    }

    // 3. Không tìm thấy trong DB
    return {
      type: 'unverified' as const,
      query: scannerQuery
    };
  }, [scannerQuery, listings]);

  const handleSearchExample = (text: string) => {
    setScannerQuery(text);
    setHasScanned(true);
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 font-sans pb-20">
      {/* KHỐI 1: HERO HEADER VÀ BẢO CHỨNG VÀNG */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#04244d] via-[#06366d] to-[#0a5460] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-teal-900/40">
        {verifiedSecBanner?.bannerImageUrl && (
          <img
            src={verifiedSecBanner.bannerImageUrl}
            alt="Thẩm định thực tế Tà Xùa"
            className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
          />
        )}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-black uppercase tracking-wider mb-4 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>{verifiedSecBanner?.badgeText || 'CHỐNG LỪA ĐẢO & ẢO GIÁ 100%'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            {verifiedSecBanner?.title || 'Hệ Thống Thẩm Định Thực Địa & Bảo Vệ Du Khách'}
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-3xl leading-relaxed mb-8 font-normal">
            {verifiedSecBanner?.subtitle ||
              'Tại Tà Xùa Trip, chúng tôi tin rằng du khách có quyền "Đi thật. Biết trước.". Mỗi cơ sở, phòng nghỉ và nhà xe đều được kiểm duyệt thực địa độc lập, đo đạc đường đèo và xác thực tài khoản ngân hàng chính chủ để bảo vệ an toàn cho kỳ nghỉ của bạn.'}
          </p>

          {/* 4 Thẻ chỉ số bảo chứng vàng */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-teal-300 mb-2">
                <Compass className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/30 px-2 py-0.5 rounded-full">GPS chuẩn</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">100%</div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Tọa độ & Đường dốc thật</div>
                <div className="text-[11px] text-slate-300 mt-0.5">Không có tọa độ ảo trên đèo</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-300 mb-2">
                <Lock className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 px-2 py-0.5 rounded-full">An toàn cọc</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">0%</div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Rủi ro lừa cọc phòng</div>
                <div className="text-[11px] text-slate-300 mt-0.5">Xác thực STK chính chủ CCCD</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-300 mb-2">
                <Building2 className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 px-2 py-0.5 rounded-full">Từng căn</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">Room ID</div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Định danh từng góc phòng</div>
                <div className="text-[11px] text-slate-300 mt-0.5">Không dùng 1 ảnh cho cả khu</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-300 mb-2">
                <Phone className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 px-2 py-0.5 rounded-full">Hỗ trợ 24/7</span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">24/7</div>
                <div className="text-xs text-slate-200 font-semibold mt-1">Hỗ trợ & Cứu hộ thực địa</div>
                <div className="text-[11px] text-slate-300 mt-0.5">Tiếp nhận phản ánh & can thiệp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-12 relative z-20">
        {/* KHỐI 2: CÔNG CỤ TRA CỨU QUICK TRUST SCANNER */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-black uppercase tracking-wider mb-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>CÔNG CỤ TRA CỨU NHANH (QUICK TRUST SCANNER)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#073161] tracking-tight">
                Kiểm Tra An Toàn Phòng & Số Tài Khoản Nhận Cọc
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Trước khi chuyển tiền cọc trên Facebook/TikTok, hãy dán số điện thoại, tên homestay hoặc STK vào đây để đối chiếu với hồ sơ thực tế.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đối chiếu từ 185 hồ sơ cơ sở Tà Xùa</span>
            </div>
          </div>

          {/* Ô nhập liệu tìm kiếm */}
          <div className="relative mb-3">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={scannerQuery}
              onChange={(e) => {
                setScannerQuery(e.target.value);
                setHasScanned(Boolean(e.target.value.trim()));
              }}
              placeholder="Nhập Số điện thoại, Tên Homestay hoặc Số tài khoản nhận cọc... (VD: 0981234567, Mị Ơi, Lu Trế...)"
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#073161] focus:bg-white shadow-inner transition-all"
            />
            {scannerQuery && (
              <button
                type="button"
                onClick={() => {
                  setScannerQuery('');
                  setHasScanned(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md bg-slate-200/60 cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Gợi ý bấm nhanh */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 mb-6">
            <span className="font-bold text-slate-600 mr-1">Thử nhanh mẫu:</span>
            <button
              type="button"
              onClick={() => handleSearchExample('Mị Ơi')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              🏡 Mị Ơi Homestay
            </button>
            <button
              type="button"
              onClick={() => handleSearchExample('0981 234 567')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              📞 Hotline Tà Xùa Trip
            </button>
            <button
              type="button"
              onClick={() => handleSearchExample('0389124892')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer transition-colors"
            >
              🚨 Thử số lừa cọc bị tố cáo: 0389124892
            </button>
          </div>

          {/* KẾT QUẢ TRA CỨU SCANNER */}
          {hasScanned && scanResult && (
            <div className="mt-4 transition-all">
              {/* TRƯỜNG HỢP 1: TÌM THẤY CƠ SỞ CHÍNH CHỦ ĐÃ XÁC MINH */}
              {scanResult.type === 'verified' && (
                <div className="bg-emerald-50/70 border-2 border-emerald-500/80 rounded-2xl p-5 sm:p-6 text-emerald-950">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-full">
                            ✓ CƠ SỞ CHÍNH CHỦ HỢP PHÁP
                          </span>
                          <span className="text-xs font-extrabold text-white bg-[#073161] px-2.5 py-0.5 rounded-full">
                            Cấp {scanResult.data.verificationTier} Thẩm Định
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-[#073161] mt-1">{scanResult.data.title}</h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectListing(scanResult.data)}
                      className="px-4 py-2.5 rounded-xl bg-[#073161] hover:bg-[#0a3f7c] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-center"
                    >
                      <span>Xem hồ sơ & Đặt phòng</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80">
                      <span className="text-slate-500 font-bold block mb-1">📍 Địa chỉ & Khu vực:</span>
                      <span className="font-extrabold text-slate-800">{scanResult.data.address || scanResult.data.area}</span>
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80">
                      <span className="text-slate-500 font-bold block mb-1">📞 Số điện thoại & Zalo đối chiếu:</span>
                      <span className="font-extrabold text-teal-800 text-sm">{scanResult.data.phone}</span>
                      {scanResult.data.zalo && <span className="text-slate-500 block text-[11px]">Zalo: {scanResult.data.zalo}</span>}
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/80">
                      <span className="text-slate-500 font-bold block mb-1">💳 Tài khoản nhận cọc chính thức:</span>
                      {scanResult.data.bankAccount ? (
                        <div>
                          <span className="font-black text-[#073161] block">{scanResult.data.bankAccount.bankCode} · {scanResult.data.bankAccount.accountNumber}</span>
                          <span className="text-emerald-800 font-bold block text-[11px]">Chủ TK: {scanResult.data.bankAccount.accountName || scanResult.data.bankAccount.accountHolder}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Thanh toán trực tiếp hoặc qua Hotline xác nhận</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-emerald-900 bg-emerald-100/60 p-2.5 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span><strong>Lưu ý an toàn:</strong> Chỉ chuyển cọc đúng số tài khoản và số điện thoại nêu trên. Mọi yêu cầu chuyển sang số tài khoản cá nhân khác đều có nguy cơ giả mạo!</span>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 2: NẰM TRONG DANH SÁCH ĐEN BỊ TỐ CÁO LỪA ĐẢO */}
              {scanResult.type === 'scam' && (
                <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-5 sm:p-6 text-rose-950">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider">
                        🚨 CẢNH BÁO LỪA ĐẢO / TÀI KHOẢN KHÔNG CHÍNH CHỦ
                      </div>
                      <h3 className="text-lg font-black text-rose-900 mt-0.5">{scanResult.data.fakeName}</h3>
                    </div>
                  </div>

                  <div className="bg-white/90 p-4 rounded-xl border border-rose-200 space-y-2 text-xs mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <strong className="text-slate-700">Số điện thoại cảnh báo:</strong> <span className="font-black text-rose-700">{scanResult.data.phoneNumber}</span>
                      </div>
                      {scanResult.data.accountNumber && (
                        <div>
                          <strong className="text-slate-700">Số tài khoản nhận cọc:</strong> <span className="font-black text-rose-700">{scanResult.data.accountNumber}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-slate-700">Hành vi ghi nhận:</strong> <span className="text-rose-900">{scanResult.data.details}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-rose-800">
                      ⚠️ Tuyệt đối KHÔNG CHUYỂN TIỀN vào số tài khoản hoặc liên hệ qua số điện thoại này!
                    </span>
                    <button
                      type="button"
                      onClick={onOpenDispute}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer shrink-0 transition-colors"
                    >
                      Báo cáo thêm chiêu trò này
                    </button>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 3: CHƯA NẰM TRONG DANH SÁCH THẨM ĐỊNH */}
              {scanResult.type === 'unverified' && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-amber-950">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-amber-900">
                        Chưa tìm thấy hồ sơ chính thức cho từ khóa "{scanResult.query}"
                      </h3>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Cơ sở, số điện thoại hoặc số tài khoản này hiện <strong>chưa nằm trong 185 cơ sở được thẩm định thực tế</strong> bởi Tà Xùa Trip. Điều này không có nghĩa chắc chắn là lừa đảo, nhưng bạn cần cẩn trọng cao độ:
                      </p>
                      <ul className="text-xs text-amber-900 list-disc list-inside mt-2 space-y-1">
                        <li>Yêu cầu chủ phòng gọi video trực tiếp quay không gian phòng và khung cảnh ngoài cửa sổ.</li>
                        <li>Yêu cầu cung cấp định vị GPS thực tế trên Google Maps để kiểm tra đường đèo.</li>
                        <li>Chỉ cọc số tiền nhỏ (tối đa 20–30%) và lưu lại biên lai ủy nhiệm chi ngân hàng có nội dung rõ ràng.</li>
                      </ul>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onNavigateToStays(3)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#073161] text-white text-xs font-bold hover:bg-[#0a3f7c] transition-colors cursor-pointer"
                        >
                          Xem các Homestay đã thẩm định Cấp 3 →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* KHỐI 3: MA TRẬN TIÊU CHUẨN 3 CẤP ĐỘ THẨM ĐỊNH (TIER 1 · TIER 2 · TIER 3) */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              <span>HỆ THỐNG HUY HIỆU BẢO CHỨNG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#073161] tracking-tight">
              Thang Tiêu Chuẩn Thẩm Định 3 Cấp Độ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Mỗi cơ sở trên Tà Xùa Trip được gắn nhãn minh bạch theo mức độ kiểm duyệt thực địa để du khách dễ dàng đưa ra quyết định phù hợp nhất với nhu cầu.
            </p>
          </div>

          {/* Tab chọn cấp độ */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { tier: 1, label: `Cấp 1: Xác Minh Danh Tính (${tierCounts.tier1})`, icon: CheckCircle2, color: 'text-slate-700' },
              { tier: 2, label: `Cấp 2: Pháp Lý & Nhận Cọc (${tierCounts.tier2})`, icon: FileCheck, color: 'text-teal-700' },
              { tier: 3, label: `Cấp 3: Thẩm Định Thực Địa (${tierCounts.tier3})`, icon: Sparkles, color: 'text-amber-500' }
            ].map((tab) => (
              <button
                key={tab.tier}
                type="button"
                onClick={() => setActiveTierTab(tab.tier)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  activeTierTab === tab.tier
                    ? 'bg-[#073161] text-white border-[#073161] shadow-md scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 3 Bento Cards Cấp độ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CẤP 1 */}
            <div
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                activeTierTab === 1
                  ? 'bg-blue-50/50 border-[#073161] shadow-md ring-2 ring-[#073161]/20'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-200">
                    CẤP 1 · CƠ BẢN
                  </span>
                  <span className="text-xs font-bold text-slate-400">{tierCounts.tier1} cơ sở</span>
                </div>
                <h3 className="text-lg font-black text-[#073161] mb-2">Xác Minh Danh Tính & Tọa Độ</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Cấp độ khởi đầu đảm bảo cơ sở thực sự tồn tại ở Tà Xùa, có chủ nhà thật và không phải là phòng ảo tự tạo trên mạng.
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Định vị tọa độ GPS chính xác trên bản đồ đèo Tà Xùa.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Xác minh SĐT / Zalo chủ nhà hoạt động liên tục &gt; 1 năm.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Niêm yết bảng giá phòng công khai, không nâng giá bất ngờ.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToStays(1)}
                className="w-full py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-extrabold text-[#073161] transition-colors cursor-pointer text-center"
              >
                Xem {tierCounts.tier1} cơ sở Cấp 1 →
              </button>
            </div>

            {/* CẤP 2 */}
            <div
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                activeTierTab === 2
                  ? 'bg-teal-50/60 border-teal-600 shadow-md ring-2 ring-teal-600/20'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
                    CẤP 2 · PHÁP LÝ & CỌC
                  </span>
                  <span className="text-xs font-bold text-teal-700 font-extrabold">{tierCounts.tier2} cơ sở</span>
                </div>
                <h3 className="text-lg font-black text-teal-950 mb-2">Xác Thực Pháp Lý & Tài Khoản</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Đảm bảo an toàn 100% khi chuyển cọc: giấy tờ kinh doanh hợp lệ và tài khoản ngân hàng chính chủ ủy nhiệm chi.
                </p>

                <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Đã nộp Giấy phép ĐKKD hoặc Giấy chứng nhận PCCC.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Xác thực tài khoản ngân hàng VietQR khớp CCCD chủ nhà.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>Cam kết giữ đúng phòng đã cọc, không bùng khách ngày lễ.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToStays(2)}
                className="w-full py-2.5 rounded-xl border border-teal-300 bg-white hover:bg-teal-50 text-xs font-extrabold text-teal-900 transition-colors cursor-pointer text-center"
              >
                Xem {tierCounts.tier2} cơ sở Cấp 2 →
              </button>
            </div>

            {/* CẤP 3 - CAO NHẤT */}
            <div
              className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                activeTierTab === 3
                  ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-500 shadow-xl ring-2 ring-amber-500/30'
                  : 'bg-white border-slate-300 hover:border-amber-400'
              }`}
            >
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs">
                ⭐ TIÊU CHUẨN CAO NHẤT
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-2xs">
                    CẤP 3 · THỰC ĐỊA TOÀN DIỆN
                  </span>
                  <span className="text-xs font-black text-amber-700">{tierCounts.tier3} cơ sở</span>
                </div>
                <h3 className="text-lg font-black text-[#073161] mb-2">Thẩm Định Thực Địa Tận Nơi</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Chuyên viên Tà Xùa Trip trực tiếp lên tận cơ sở, kiểm tra đường dốc ô tô, đo góc mây từng Room ID và thử nước nóng mùa đông.
                </p>

                <div className="space-y-2.5 text-xs text-slate-800 mb-6 font-medium">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Đo độ dốc đường đèo:</strong> Ghi rõ xe 16 chỗ vào tận sân hay phải gửi ngoài.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Định danh Room ID:</strong> Chụp góc nhìn mây thật 1:1, không dùng ảnh góc rộng ảo.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Tiện nghi sinh tồn:</strong> Thử bình nóng lạnh, đệm sưởi mùa đông và đo sóng 4G.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToStays(3)}
                className="w-full py-2.5 rounded-xl bg-[#073161] hover:bg-[#0a3f7c] text-xs font-black text-white transition-colors cursor-pointer text-center shadow-sm"
              >
                Ưu tiên xem {tierCounts.tier3} cơ sở Cấp 3 →
              </button>
            </div>
          </div>
        </section>

        {/* KHỐI 4: QUY TRÌNH 5 BƯỚC KHẢO SÁT THỰC ĐỊA KHÉP KÍN */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-black uppercase tracking-wider mb-2">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>QUY TRÌNH MINH BẠCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#073161] tracking-tight">
              5 Bước Thẩm Định Thực Địa Khép Kín
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Làm thế nào một homestay đạt chứng nhận Cấp 3 của Tà Xùa Trip? Xem toàn bộ các khâu kiểm duyệt nghiêm ngặt tại chỗ.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {[
              {
                step: 1,
                title: 'Thẩm tra chéo hồ sơ',
                desc: 'Đối chiếu CCCD chủ cơ sở, giấy đăng ký kinh doanh và lịch sử hoạt động tránh fanpage clone.',
                icon: FileCheck,
                badge: 'Pháp lý'
              },
              {
                step: 2,
                title: 'Đo đạc đường đèo & bãi xe',
                desc: 'Khảo sát độ dốc đường nhánh vào homestay. Xác định chính xác xe 4 chỗ, SUV hay xe 16 chỗ vào được.',
                icon: Car,
                badge: 'Giao thông'
              },
              {
                step: 3,
                title: 'Định danh Room ID & Góc Mây',
                desc: 'Gắn mã từng phòng. Bay drone và chụp ảnh góc thật 1:1, kiểm tra hướng đón bình minh và biển mây.',
                icon: Camera,
                badge: 'Cloud View'
              },
              {
                step: 4,
                title: 'Thử nghiệm tiện nghi mùa đông',
                desc: 'Kiểm tra công suất bình nước nóng dưới 5°C, đệm điện sưởi ấm, chăn bông và đo tốc độ mạng Wi-Fi/4G.',
                icon: Flame,
                badge: 'Tiện nghi'
              },
              {
                step: 5,
                title: 'Ký cam kết & Cấp mã QR định danh',
                desc: 'Ký cam kết giữ giá niêm yết và không bùng phòng. Cấp mã QR đối soát và liên tục giám sát phản hồi từ du khách.',
                icon: ShieldCheck,
                badge: 'Chứng nhận QR'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:bg-white hover:border-[#073161]/40 transition-all hover:shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-full bg-[#073161] text-white flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">
                      0{item.step}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#073161] mb-1.5">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KHỐI 5: ĐỐI CHIẾU TRỰC QUAN: ẢNH THẬT ROOM ID VS ẢNH GÓC RỘNG ẢO */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-wider mb-2">
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>MINH BẠCH THỰC TẾ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#073161] tracking-tight">
              Biết Trước Sự Thật vs Ảnh Ảo Quảng Cáo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Tại sao bạn thường thất vọng khi nhận phòng qua ảnh mạng xã hội? Đây là lý do Tà Xùa Trip phân tách từng Room ID.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tình huống 1: Góc nhìn biển mây */}
            <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50/50 flex flex-col">
              <div className="p-4 bg-[#073161] text-white flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider">TÌNH HUỐNG 1: GÓC NHÌN BIỂN MÂY</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">Vấn đề phổ biến #1</span>
              </div>
              <div className="p-5 flex-1 space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
                  <div className="flex items-center gap-1.5 font-extrabold text-rose-800 mb-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Ảo tưởng từ bài đăng quảng cáo mạng xã hội:</span>
                  </div>
                  <p className="leading-relaxed">
                    Chụp bằng ống kính góc siêu rộng (Ultra-Wide 0.5x), căn phòng trông rộng gấp ba, cửa sổ panorama không vướng bất kỳ chướng ngại vật nào, biển mây tràn tận chân giường.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bằng chứng thực tế do Tà Xùa Trip thẩm định:</span>
                  </div>
                  <p className="leading-relaxed">
                    Trong cùng khu, <strong>chỉ căn Bungalow 01 & 02</strong> có góc nhìn mây trực diện 180°. <strong>Căn 03 & 04</strong> bị mái tôn hàng xóm che khuất 40% tầm nhìn và chỉ đón được mây khi biển mây dâng cao trên 1.600m. Chúng tôi gắn nhãn rõ từng căn để bạn không bị bỡ ngỡ.
                  </p>
                </div>
              </div>
            </div>

            {/* Tình huống 2: Đường vào & Dốc xe ô tô */}
            <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50/50 flex flex-col">
              <div className="p-4 bg-[#073161] text-white flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider">TÌNH HUỐNG 2: ĐƯỜNG ĐÈO & XE Ô TÔ</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md">Vấn đề an toàn #1</span>
              </div>
              <div className="p-5 flex-1 space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950">
                  <div className="flex items-center gap-1.5 font-extrabold text-rose-800 mb-1">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Quảng cáo thường gặp: "Ô tô vào tận nơi thoải mái"</span>
                  </div>
                  <p className="leading-relaxed">
                    Nhiều khách đi xe sedan gầm thấp hoặc xe 16 chỗ khi đến ngã rẽ mới tá hỏa vì đường nhánh dốc 20%, đá hộc trơn trượt sau mưa mù, gầm xe bị cạ xước và không thể quay đầu.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ghi chú thực địa chính xác từ Tà Xùa Trip:</span>
                  </div>
                  <p className="leading-relaxed">
                    Ghi rõ: <em>"Đường bê tông dốc 18%, xe số 2 người lên tốt. Xe 16 chỗ hoặc gầm thấp bắt buộc gửi bãi đỗ trục chính Tà Xùa (cách 250m), có xe ôm bản địa hỗ trợ chở vali 30k/chuyến."</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KHỐI 6: CẨM NANG 4 CHIÊU TRÒ LỪA CỌC PHÒNG TÀ XÙA VÀ CÁCH PHÒNG TRÁNH */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-black uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>CẢNH GIÁC BẪY LỪA ĐẢO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#073161] tracking-tight">
              4 Chiêu Trò Lừa Cọc Tà Xùa Phổ Biến Nhất
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Các thủ đoạn tinh vi xuất hiện liên tục trên Facebook, TikTok và Zalo trong mùa săn mây cao điểm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                01
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Fanpage Clone chạy quảng cáo giá rẻ bất ngờ</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lập trang có tên giống hệt homestay có tiếng (VD: Mị Ơi, May, Lu Trế...), mua like ảo, chạy quảng cáo "Combo 2N1Đ chỉ 399k view mây tràn". Sau khi khách chuyển cọc 500k-1tr thì chặn số ngay lập tức.
                </p>
                <div className="mt-2 text-[11px] font-bold text-teal-800">
                  ✓ Cách phòng tránh: Tra cứu SĐT trên thanh Quick Scanner của Tà Xùa Trip trước khi cọc.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                02
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Nhận cọc 1 phòng cho nhiều đoàn vào ngày lễ</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Homestay thực tế chỉ có 4 phòng nhưng nhận cọc của 10 đoàn khác nhau. Đến đêm nhận phòng, khách bị đẩy sang nhà người quen ở sâu trong bản không có view mây và thiếu tiện nghi sưởi ấm.
                </p>
                <div className="mt-2 text-[11px] font-bold text-teal-800">
                  ✓ Cách phòng tránh: Chỉ chọn cơ sở Cấp 2 hoặc Cấp 3 đã ký quỹ cam kết không bùng khách.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                03
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Mạo danh lễ tân chủ động nhắn tin riêng trên Zalo</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kẻ gian canh bình luận trên các bài review hỏi giá phòng, sau đó kết bạn Zalo xưng là "Quản lý homestay", báo còn phòng chót và hối thúc chuyển tiền ngay vào số tài khoản cá nhân lạ.
                </p>
                <div className="mt-2 text-[11px] font-bold text-teal-800">
                  ✓ Cách phòng tránh: Luôn gọi lại đúng số Hotline chính thức niêm yết trên website để xác nhận.
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                04
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">Quảng cáo ảnh một đằng, nhận phòng một nẻo</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dùng ảnh của căn VIP đắt tiền nhất để tư vấn cho khách nhưng khi đến nơi lại xếp vào căn phòng phía sau không có cửa sổ nhìn ra đồi.
                </p>
                <div className="mt-2 text-[11px] font-bold text-teal-800">
                  ✓ Cách phòng tránh: Đặt theo mã Room ID cụ thể có hình ảnh góc nhìn thực địa kèm theo.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KHỐI 7: CỔNG TIẾP NHẬN PHẢN ÁNH, GIẢI QUYẾT TRANH CHẤP & CỨU HỘ 24/7 */}
        <section className="bg-gradient-to-br from-[#073161] to-[#04244d] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/30 border border-teal-300/40 text-teal-200 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              <span>KÊNH BẢO VỆ & HỖ TRỢ DU KHÁCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cổng Tiếp Nhận Phản Ánh & Can Thiệp Sự Cố 24/7
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Nếu bạn gặp bất kỳ vấn đề nào khi đến lưu trú hoặc phát hiện cơ sở cung cấp thông tin sai lệch so với hồ sơ thẩm định trên Tà Xùa Trip:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tiếp nhận phản ánh & can thiệp trực tiếp với chủ nhà bản địa.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hỗ trợ du khách tìm phương án lưu trú thay thế trên đèo khi phát sinh sự cố.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ghi nhận vi phạm, hạ bậc hoặc khóa vĩnh viễn cơ sở gian dối.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kết nối đội cứu hộ đèo Chẹn & Sống Lưng Khủng Long 24/7.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={onOpenDispute}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-transform active:scale-95 cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Gửi Phản Ánh Cơ Sở Sai Phạm</span>
            </button>
            <a
              href="tel:0981119115"
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Hotline Cứu Hộ Đèo: 0981 119 115</span>
            </a>
          </div>
        </section>

        {/* KHỐI 8: DUAL CALL TO ACTION */}
        <section className="bg-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-200 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="text-lg font-black text-[#073161]">Bắt Đầu Khám Phá Kỳ Nghỉ Đã Được Thẩm Định</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lọc nhanh hơn 91 homestay và 16 nhà xe đã được đối soát thực địa.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateToStays(3)}
              className="px-5 py-3 rounded-2xl bg-[#073161] hover:bg-[#0a3f7c] text-white text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <span>Xem Homestay Cấp 3 Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onOpenPartnerClaim?.()}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-extrabold text-[#073161] transition-all cursor-pointer"
            >
              Dành cho Chủ nhà: Đăng ký thẩm định
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
