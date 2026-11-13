import React, { useState } from 'react';
import { defaultStayDates, todayInVietnam } from '../search/searchIntent.ts';
import {
  Building2,
  Package,
  Bus,
  Bike,
  Calendar,
  Users,
  CheckCircle2,
  CloudSun,
  Eye,
  Car,
  MapPin,
  Search,
  Compass,
  Clock,
  ShieldCheck,
  Sparkles,
  Wrench,
  Route
} from 'lucide-react';
import {
  LocationArea,
  SiteContentConfig,
  HeroBannerSlide,
  CuratedComboCategory
} from '../types/index.ts';

export type HeroConsoleMode = 'stay' | 'combo_trekking' | 'bus_shuttle' | 'motorbike';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  onlyCloudView: boolean;
  setOnlyCloudView: (val: boolean) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (val: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onExploreClick: () => void;
  onNavigateTab?: (tab: string) => void;
  siteContent?: SiteContentConfig;
  heroConsoleMode?: HeroConsoleMode;
  onChangeHeroConsoleMode?: (mode: HeroConsoleMode) => void;
  selectedComboCategory?: 'all' | CuratedComboCategory;
  onChangeComboCategory?: (cat: 'all' | CuratedComboCategory) => void;
  onOpenBusComboModal?: (enableBikeCombo?: boolean) => void;
  /** N04.1: ngày/khách dùng chung với danh sách và trang chi tiết. */
  stayIntent?: { checkIn: string; checkOut: string; adults: number };
  onChangeStayIntent?: (patch: Partial<{ checkIn: string; checkOut: string; adults: number }>) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedArea,
  setSelectedArea,
  onlyCloudView,
  setOnlyCloudView,
  onlyAvailable,
  setOnlyAvailable,
  onExploreClick,
  onNavigateTab,
  siteContent,
  heroConsoleMode: propHeroMode,
  onChangeHeroConsoleMode,
  selectedComboCategory = 'all',
  onChangeComboCategory,
  onOpenBusComboModal,
  stayIntent,
  onChangeStayIntent
}) => {
  const [internalHeroMode, setInternalHeroMode] = useState<HeroConsoleMode>('stay');
  const activeMode = propHeroMode || internalHeroMode;

  const setActiveMode = (mode: HeroConsoleMode) => {
    setInternalHeroMode(mode);
    if (onChangeHeroConsoleMode) {
      onChangeHeroConsoleMode(mode);
    }
  };

  // Stay form state
  // N04.1: dùng lựa chọn chung của App; chỉ khi không được truyền mới dùng state riêng.
  const fallbackDates = defaultStayDates();
  const [localCheckIn, setLocalCheckIn] = useState(fallbackDates.checkIn);
  const [localCheckOut, setLocalCheckOut] = useState(fallbackDates.checkOut);
  const [localGuests, setLocalGuests] = useState(2);
  const checkInDate = stayIntent?.checkIn ?? localCheckIn;
  const checkOutDate = stayIntent?.checkOut ?? localCheckOut;
  const guestCount = stayIntent?.adults ?? localGuests;
  const setCheckInDate = (v: string) => (onChangeStayIntent ? onChangeStayIntent({ checkIn: v }) : setLocalCheckIn(v));
  const setCheckOutDate = (v: string) => (onChangeStayIntent ? onChangeStayIntent({ checkOut: v }) : setLocalCheckOut(v));
  const setGuestCount = (v: number) => (onChangeStayIntent ? onChangeStayIntent({ adults: v }) : setLocalGuests(v));
  const todayVn = todayInVietnam();
  const [roomCount] = useState(1);
  const [bedViewFilter, setBedViewFilter] = useState(false);
  const [carAccessFilter, setCarAccessFilter] = useState(false);

  // Combo & Trekking form state
  const [comboDepartureDate, setComboDepartureDate] = useState(fallbackDates.checkIn);
  const [comboGuests, setComboGuests] = useState(2);

  // Bus Shuttle quick form state
  const [busPickupZone, setBusPickupZone] = useState('my_dinh_cau_giay');
  const [busTimeSlot, setBusTimeSlot] = useState('night_22h');
  const [busVehicleType, setBusVehicleType] = useState('cabin_vip');

  // Motorbike Biker quick form state
  const [bikeModelType, setBikeModelType] = useState('wave_blade');
  const [bikeDeliverySpot, setBikeDeliverySpot] = useState('homestay_dinh_gio');
  const [bikeRentalDuration, setBikeRentalDuration] = useState('1.5_days_noon');
  const [bikeQuantity, setBikeQuantity] = useState(1);

  const areas: (LocationArea | 'all')[] = [
    'all',
    'Đỉnh Gió',
    'Sống Lưng Khủng Long',
    'Khe Cải',
    'Trung Tâm Tà Xùa',
    'Mống Vàng',
    'Thảo Nguyên',
    'Bắc Yên'
  ];

  const scrollToElement = (elementId: string) => {
    window.setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleStaySearchSubmit = () => {
    if (selectedCategory !== 'all' && selectedCategory !== 'homestay') {
      setSelectedCategory('homestay');
    }
    onExploreClick();
    // N04.1: sang trang Lưu trú với đúng ngày/khách vừa chọn (giữ trong URL).
    if (onNavigateTab) onNavigateTab('stay');
    else scrollToElement('verified-listings-section');
  };

  const handleComboSearchSubmit = () => {
    setSelectedCategory('tour');
    onExploreClick();
    scrollToElement('curated-combos-section');
  };

  const handleMotorbikeSearchSubmit = () => {
    setSelectedCategory('motorbike');
    onExploreClick();
    scrollToElement('biker-hub-section');
  };

  const handleHeroBannerClick = (banner: HeroBannerSlide) => {
    const target = banner.targetTab || 'stay';
    if (target === 'combo_section') {
      setActiveMode('combo_trekking');
      setSelectedCategory('tour');
      scrollToElement('curated-combos-section');
      return;
    }
    if (target === 'bus_combo_modal') {
      if (onOpenBusComboModal) {
        onOpenBusComboModal(true);
      } else if (onNavigateTab) {
        onNavigateTab('transport');
      }
      return;
    }
    if (target === 'motorbike_section') {
      setActiveMode('motorbike');
      setSelectedCategory('motorbike');
      scrollToElement('biker-hub-section');
      return;
    }
    if (onNavigateTab) {
      onNavigateTab(target);
    }
  };

  const sortedHeroBanners = [...(siteContent?.heroBanners || [])]
    .filter((b) => b.isActive !== false)
    .sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

  // Determine whether Hero text fields should render (strictly respecting Admin's deletion in CMS)
  const heroBadge = siteContent?.heroBadge !== undefined ? siteContent.heroBadge : '🏔️ Cổng đặt phòng & thông tin Tà Xùa';
  const heroTitle = siteContent?.heroTitle !== undefined ? siteContent.heroTitle : 'TÀ XÙA TRIP';
  const heroSubtitle = siteContent?.heroSubtitle !== undefined ? siteContent.heroSubtitle : 'Đi thật. Biết trước.';
  const heroDescription = siteContent?.heroDescription !== undefined ? siteContent.heroDescription : 'Danh bạ homestay, quán ăn, nhà xe Tà Xùa: liên hệ trực tiếp chủ nhà không qua trung gian, ghi rõ thông tin nào đã được xác minh.';
  const heroBgImage = siteContent?.heroBackgroundImage;

  return (
    <div className="relative">
      {/* Deep Navy-to-Teal Hero Section with CMS-configurable Background Image & Content */}
      <div className="relative bg-gradient-to-br from-brand-900 via-[#063366] to-[#084d5e] text-white pt-7 sm:pt-14 pb-24 sm:pb-34 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {heroBgImage && (
          <img
            src={heroBgImage}
            alt="Tà Xùa Background"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/60 to-transparent" />
        {/* Subtle atmospheric radial glow */}
        <div
          className="pointer-events-none absolute -top-24 right-0 w-[550px] h-[550px] rounded-full opacity-25 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)'
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          {/* Brand Title */}
          <div className="max-w-2xl">
            {Boolean(heroBadge.trim()) && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-3">
                <span>{heroBadge}</span>
              </div>
            )}
            {Boolean(heroTitle.trim()) && (
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
                {heroTitle}
              </h1>
            )}
            {Boolean(heroSubtitle.trim()) && (
              <p className="font-script text-2xl sm:text-4xl text-teal-200 mt-1 mb-2 leading-tight">
                {heroSubtitle}
              </p>
            )}
            {Boolean(heroDescription.trim()) && (
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-4 max-w-lg">
                {heroDescription}
              </p>
            )}
          </div>

          {/* CMS Hero Promotional Spotlight Cards (Quản lý Thêm/Sửa/Xóa/Đích đến từ Admin CMS) */}
          {sortedHeroBanners.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
              {sortedHeroBanners.map((banner) => (
                <div
                  key={banner.id}
                  onClick={() => handleHeroBannerClick(banner)}
                  className="group relative rounded-2xl overflow-hidden border border-white/20 bg-slate-900/55 backdrop-blur-md p-3.5 flex items-center gap-3 cursor-pointer hover:border-teal-300/75 hover:bg-slate-900/75 transition-all shadow-md"
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/20 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-amber-300 block truncate">
                        {banner.badgeText}
                      </span>
                      <span className="text-xs text-teal-200/80 opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0">
                        Mở →
                      </span>
                    </div>
                    <h3 className="text-xs font-extrabold text-white line-clamp-1 mt-0.5">
                      {banner.title}
                    </h3>
                    <p className="text-xs text-teal-200/90 line-clamp-1 mt-0.5">
                      {banner.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating White Search Console Card overlapping Hero & Light Canvas */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-20">
        <div className="bg-white rounded-3xl sm:rounded-[28px] shadow-[0_22px_50px_rgba(7,49,97,0.12)] border border-slate-200/90 overflow-hidden">
          {/* Top 4 Service Mode Tabs Row */}
          <div className="flex items-center border-b border-slate-200/80 overflow-x-auto no-scrollbar bg-slate-50/60">
            <button
              type="button"
              onClick={() => {
                setActiveMode('stay');
                if (selectedCategory === 'tour' || selectedCategory === 'motorbike') {
                  setSelectedCategory('all');
                }
              }}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeMode === 'stay'
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-600 hover:text-brand-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Lưu trú</span>
              {activeMode === 'stay' && (
                <span className="absolute bottom-0 left-3 right-3 h-1 bg-amber-400 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('combo_trekking');
                setSelectedCategory('tour');
              }}
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeMode === 'combo_trekking'
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-600 hover:text-brand-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Combo & Trekking</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  activeMode === 'combo_trekking'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Thẩm định
              </span>
              {activeMode === 'combo_trekking' && (
                <span className="absolute bottom-0 left-3 right-3 h-1 bg-amber-400 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('bus_shuttle');
              }}
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeMode === 'bus_shuttle'
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-600 hover:text-brand-800'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Xe khách</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  activeMode === 'bus_shuttle'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                Đón dọc tuyến
              </span>
              {activeMode === 'bus_shuttle' && (
                <span className="absolute bottom-0 left-3 right-3 h-1 bg-amber-400 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('motorbike');
                setSelectedCategory('motorbike');
              }}
              className={`relative flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeMode === 'motorbike'
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-600 hover:text-brand-800'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Xe máy</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  activeMode === 'motorbike'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                Tà Xùa Biker
              </span>
              {activeMode === 'motorbike' && (
                <span className="absolute bottom-0 left-3 right-3 h-1 bg-amber-400 rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab('map');
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer ml-auto"
            >
              <MapPin className="w-4 h-4" />
              <span>Bản đồ tọa độ săn mây →</span>
            </button>
          </div>

          {/* ================= MODE 1: LƯU TRÚ (HOMESTAY) ================= */}
          {activeMode === 'stay' && (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center">
                {/* Check-in Date */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>NHẬN PHÒNG</span>
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    min={todayVn}
                    aria-label="Ngày nhận phòng"
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Check-out Date */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>TRẢ PHÒNG</span>
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    min={checkInDate}
                    aria-label="Ngày trả phòng"
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Guests Count */}
                <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>SỐ KHÁCH</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                    aria-label="Số khách"
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none"
                  />
                </div>

                {/* Area Selector */}
                <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>KHU VỰC</span>
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    aria-label="Chọn khu vực Tà Xùa"
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="all">{roomCount} phòng · Toàn Tà Xùa</option>
                    {areas
                      .filter((a) => a !== 'all')
                      .map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Primary Search Button */}
                <div className="col-span-2 lg:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleStaySearchSubmit}
                    className="w-full min-h-[46px] bg-brand-800 hover:bg-brand-700 text-white font-bold text-sm py-3 px-6 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Tìm phòng
                  </button>
                </div>
              </div>

              {/* Bottom Interest Filter Chips + Quick Keyword Input */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-brand-800 mr-1 whitespace-nowrap shrink-0">
                    Bạn quan tâm:
                  </span>

                  <button
                    type="button"
                    onClick={() => setOnlyAvailable(!onlyAvailable)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      onlyAvailable
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white hover:bg-slate-50 text-brand-800 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Đã thẩm định</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnlyCloudView(!onlyCloudView)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      onlyCloudView
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white hover:bg-slate-50 text-brand-800 border-slate-200'
                    }`}
                  >
                    <CloudSun className="w-3.5 h-3.5 text-teal-700" />
                    <span>Săn mây</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBedViewFilter(!bedViewFilter);
                      setOnlyCloudView(!bedViewFilter);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      bedViewFilter
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white hover:bg-slate-50 text-brand-800 border-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-700" />
                    <span>View từ giường</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCarAccessFilter(!carAccessFilter);
                      if (!carAccessFilter) {
                        setSelectedArea('Đỉnh Gió');
                      } else {
                        setSelectedArea('all');
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      carAccessFilter
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white hover:bg-slate-50 text-brand-800 border-slate-200'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5 text-teal-700" />
                    <span>Ô tô vào được</span>
                  </button>
                </div>

                {/* Compact keyword search input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên homestay, khu vực..."
                    className="w-full bg-slate-50 border border-slate-500 rounded-full pl-8 pr-3 py-2 sm:py-1.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 2: COMBO & TREKKING THẨM ĐỊNH ================= */}
          {activeMode === 'combo_trekking' && (
            <div className="p-4 sm:p-6 bg-gradient-to-b from-amber-50/30 to-white">
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center">
                {/* Loại Gói Combo / Trekking */}
                <div className="col-span-2 lg:col-span-4 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 mb-1">
                    <Package className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>LOẠI COMBO / TOUR THẨM ĐỊNH</span>
                  </label>
                  <select
                    value={selectedComboCategory}
                    onChange={(e) => {
                      if (onChangeComboCategory) {
                        onChangeComboCategory(e.target.value as 'all' | CuratedComboCategory);
                      }
                    }}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="all">Tất cả Gói Combo & Trekking Đặc Biệt</option>
                    <option value="combo_2n1d">👑 Combo 2N1Đ (Xe Cabin + Phòng Kính + Xe Máy)</option>
                    <option value="trekking_tour">🥾 Tour Trekking Sống Lưng & Đỉnh U Bò</option>
                    <option value="biker_pack">🔥 Combo Vé Xe Khách + Thuê Xe Máy (-30k)</option>
                    <option value="couple_retreat">💎 Combo Cặp Đôi Nghỉ Dưỡng & Lẩu Gà Đen</option>
                    <option value="group_family">👨‍👩‍👧‍👦 Combo Đoàn Đông & Gia Đình (4–8 khách)</option>
                  </select>
                </div>

                {/* Ngày Khởi Hành */}
                <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>NGÀY KHỞI HÀNH</span>
                  </label>
                  <input
                    type="date"
                    value={comboDepartureDate}
                    onChange={(e) => setComboDepartureDate(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Số Người Đi */}
                <div className="col-span-1 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>SỐ NGƯỜI ĐI</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={comboGuests}
                    onChange={(e) => setComboGuests(Math.max(1, Number(e.target.value)))}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none"
                  />
                </div>

                {/* Khu Vực Tuyến */}
                <div className="col-span-2 lg:col-span-2 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Compass className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>ĐIỂM ĐẾN CHÍNH</span>
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="all">Toàn tuyến Tà Xùa</option>
                    <option value="Đỉnh Gió">Đỉnh Gió & Mị Ơi</option>
                    <option value="Sống Lưng Khủng Long">Sống Lưng Khủng Long</option>
                    <option value="Khe Cải">Bản Khe Cải</option>
                    <option value="Thảo Nguyên">Thảo Nguyên & Cây Cô Đơn</option>
                  </select>
                </div>

                {/* Nút Xem Gói Combo */}
                <div className="col-span-2 lg:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleComboSearchSubmit}
                    className="w-full min-h-[46px] bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Xem Gói Combo →
                  </button>
                </div>
              </div>

              {/* Bottom Quick Chips for Combo & Trekking */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-xs font-bold text-brand-800 whitespace-nowrap">
                    Quyền lợi thẩm định:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onChangeComboCategory) onChangeComboCategory('combo_2n1d');
                      handleComboSearchSubmit();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>👑 Combo 2N1Đ Admin Đề Xuất (-260k)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onChangeComboCategory) onChangeComboCategory('trekking_tour');
                      handleComboSearchSubmit();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-brand-800 border border-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    <span>🥾 Có Porter H’Mông & Bảo hiểm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBusComboModal) onOpenBusComboModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 cursor-pointer whitespace-nowrap"
                  >
                    <Bus className="w-3.5 h-3.5 text-teal-700" />
                    <span>🚌 Tự ghép Vé Xe + Xe Máy (-30k/xe)</span>
                  </button>
                </div>

                <span className="text-xs font-bold text-teal-800">
                  ✓ Giá trọn gói niêm yết · Không phụ phí ẩn
                </span>
              </div>
            </div>
          )}

          {/* ================= MODE 3: XE KHÁCH ĐÓN DỌC TUYẾN ================= */}
          {activeMode === 'bus_shuttle' && (
            <div className="p-4 sm:p-6 bg-gradient-to-b from-emerald-50/25 to-white">
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center">
                {/* Điểm Đón */}
                <div className="col-span-2 lg:col-span-4 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>ĐIỂM ĐÓN TẠI HÀ NỘI & DỌC TUYẾN</span>
                  </label>
                  <select
                    value={busPickupZone}
                    onChange={(e) => setBusPickupZone(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="my_dinh_cau_giay">Bến xe Mỹ Đình · Công viên Cầu Giấy · Nhổn</option>
                    <option value="yen_nghia_bigc">Bến xe Yên Nghĩa · BigC Thăng Long · Hòa Lạc</option>
                    <option value="noi_bai">Sân bay Nội Bài (Sảnh E) · Sơn Tây · Cầu Trung Hà</option>
                    <option value="door_to_door">Xe ghép / Limousine đón tận sảnh nội thành</option>
                  </select>
                </div>

                {/* Khung Giờ */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>GIỜ KHỞI HÀNH</span>
                  </label>
                  <select
                    value={busTimeSlot}
                    onChange={(e) => setBusTimeSlot(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="night_22h">🌙 Đêm 21:30 – 22:30 (Đón bình minh)</option>
                    <option value="morning_06h">🌅 Sáng 06:30 – 07:00 (Lên thẳng Đỉnh Gió)</option>
                    <option value="afternoon_13h">🌤️ Chiều 13:00 – 16:30 (Ngắm hoàng hôn)</option>
                  </select>
                </div>

                {/* Dòng Xe */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Bus className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>DÒNG XE CHUYÊN TUYẾN</span>
                  </label>
                  <select
                    value={busVehicleType}
                    onChange={(e) => setBusVehicleType(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="cabin_vip">Giường nằm Cabin Đôi VIP (360k–380k)</option>
                    <option value="limousine">Limousine 9–11 ghế Massage (340k–350k)</option>
                    <option value="sleeper">Giường nằm 2 tầng 34 phòng (300k)</option>
                  </select>
                </div>

                {/* Nút Mở Sơ Đồ Ghế */}
                <div className="col-span-2 lg:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBusComboModal) {
                        onOpenBusComboModal(false);
                      } else if (onNavigateTab) {
                        onNavigateTab('transport');
                      }
                    }}
                    className="w-full min-h-[46px] bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Chọn Ghế Đón →
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBusComboModal) onOpenBusComboModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 cursor-pointer whitespace-nowrap"
                  >
                    <Bike className="w-3.5 h-3.5 text-teal-700" />
                    <span>🛵 Đặt kèm Xe máy giao tận Homestay (-30.000đ/xe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('transport');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-brand-800 border border-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    <Route className="w-3.5 h-3.5 text-teal-700" />
                    <span>Xem đầy đủ 16 Nhà xe & 6 khung giờ chạy →</span>
                  </button>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  ✓ Giữ chỗ 30 phút · Chọn đúng ghế tầng 1 / tầng 2
                </span>
              </div>
            </div>
          )}

          {/* ================= MODE 4: XE MÁY TÀ XÙA BIKER ================= */}
          {activeMode === 'motorbike' && (
            <div className="p-4 sm:p-6 bg-gradient-to-b from-amber-50/40 to-white">
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-4 items-center">
                {/* Dòng Xe Phượt Đèo */}
                <div className="col-span-2 lg:col-span-4 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 sm:border-r sm:border-slate-200/80 sm:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                    <Bike className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>DÒNG XE PHƯỢT ĐÈO ĐÃ KIỂM ĐỊNH PHANH</span>
                  </label>
                  <select
                    value={bikeModelType}
                    onChange={(e) => setBikeModelType(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="wave_blade">Xe số leo đèo khỏe: Wave Alpha / Honda Blade / Sirius (150k/ngày)</option>
                    <option value="airblade_vision">Xe tay ga đời mới: AirBlade / Vision (180k/ngày · Đi Thảo Nguyên)</option>
                    <option value="winner_exciter">Xe côn tay phượt Sống Lưng: Winner X / Exciter 150 (250k/ngày)</option>
                  </select>
                </div>

                {/* Điểm Giao Nhận Xe */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>ĐIỂM NHẬN XE</span>
                  </label>
                  <select
                    value={bikeDeliverySpot}
                    onChange={(e) => setBikeDeliverySpot(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="homestay_dinh_gio">Giao tận Homestay Đỉnh Gió / Trung Tâm</option>
                    <option value="bus_dropoff">Nhận tại điểm xuống Xe Khách lúc 04:30 sáng</option>
                    <option value="bac_yen">Nhận tại Thị trấn Bắc Yên (Chân đèo)</option>
                  </select>
                </div>

                {/* Thời Gian Thuê & Quy Tắc 12h Trưa */}
                <div className="col-span-1 lg:col-span-3 bg-slate-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-slate-200/80 sm:border-0 lg:border-r lg:border-slate-200/80 lg:pr-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>GÓI THUÊ ({bikeQuantity} XE)</span>
                  </label>
                  <select
                    value={bikeRentalDuration}
                    onChange={(e) => setBikeRentalDuration(e.target.value)}
                    className="w-full text-base sm:text-sm font-bold text-brand-800 bg-transparent focus:outline-none cursor-pointer truncate"
                  >
                    <option value="1.5_days_noon">1.5 Ngày (Trả trước 12h trưa ngày về = 225k)</option>
                    <option value="1_day">Thuê 1 Ngày tiêu chuẩn (150k/ngày)</option>
                    <option value="2_days">Thuê 2 Ngày trọn gói (300k)</option>
                  </select>
                </div>

                {/* Nút Tìm Xe Máy */}
                <div className="col-span-2 lg:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleMotorbikeSearchSubmit}
                    className="w-full min-h-[46px] bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-full shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Xem Trạm Xe →
                  </button>
                </div>
              </div>

              {/* Bottom Biker Policy Chips */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-950 border border-amber-300 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Trả xe trước 12:00 trưa hôm sau chỉ tính 0.5 ngày</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-brand-800 border border-slate-200 whitespace-nowrap">
                    <Wrench className="w-3.5 h-3.5 text-teal-700" />
                    <span>Kiểm tra phanh & lốp đèo 100% + Kèm 2 mũ & áo mưa</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBusComboModal) onOpenBusComboModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 cursor-pointer whitespace-nowrap"
                  >
                    <span>🔥 Đặt kèm Vé Xe Khách giảm ngay 30.000đ/xe →</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
