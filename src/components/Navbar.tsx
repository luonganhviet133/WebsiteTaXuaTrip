import React, { useState } from 'react';
import {
  Search,
  ShieldAlert,
  Building2,
  ShieldCheck,
  Mountain,
  Download,
  FolderArchive,
  Globe,
  Heart,
  CalendarCheck,
  Compass,
  BedDouble,
  CloudSun,
  MapPin,
  Menu,
  X,
  Bus,
  Users,
  Sparkles,
  Car,
  Utensils,
  Camera,
  Shirt,
  MessageCircle,
  Tag,
  Award,
  Layers,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  Key,
  Shield,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { AuthUser } from '../types/auth.ts';
import { HostingModal } from './HostingModal.tsx';
import { PWAInstallButton } from './PwaAndNetworkBar.tsx';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  cloudPoints: number;
  onOpenSos: () => void;
  onOpenPointsModal: () => void;
  savedCount: number;
  onOpenSavedModal: () => void;
  bookingsCount?: number;
  onOpenMyTripsModal?: () => void;
  lowDataMode?: boolean;
  onToggleLowDataMode?: () => void;
  onOpenAiAdvisor?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: (role?: UserRole, mode?: 'login' | 'register') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  cloudPoints,
  onOpenSos,
  onOpenPointsModal,
  savedCount,
  onOpenSavedModal,
  bookingsCount = 0,
  onOpenMyTripsModal,
  lowDataMode = false,
  onToggleLowDataMode = () => {},
  onOpenAiAdvisor,
  currentUser = null,
  onOpenAuthModal,
  onLogout
}) => {
  // Unified aesthetic: Always use consistent, crisp white glass header across all tabs
  const isNavyHeader = false;
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [hostingModalTab, setHostingModalTab] = useState<'live' | 'deploy' | 'download'>('live');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleBlobDownload = async (url: string, filename: string, mimeType: string) => {
    try {
      setDownloadingFile(filename);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingFile(null);
    }
  };

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const primaryNavItems = [
    { id: 'explore', label: 'Khám phá' },
    { id: 'stay', label: 'Lưu trú' },
    { id: 'transport', label: 'Di Chuyển' },
    { id: 'weather', label: 'Săn mây' },
    { id: 'map', label: 'Bản đồ' }
  ];

  const secondaryNavItems = [
    { id: 'services', label: 'Dịch Vụ', icon: Shirt, desc: 'Tour trekking, porter & thuê đồ' },
    { id: 'dining', label: 'Ăn Uống', icon: Utensils, desc: 'Cà phê săn mây & ẩm thực bản địa' },
    { id: 'community', label: 'Cộng Đồng', icon: MessageCircle, desc: 'Hỏi đáp, ghép xe & đánh giá' },
    { id: 'verified', label: 'Về chúng tôi', icon: ShieldCheck, desc: 'Hồ sơ thẩm định thực địa Tà Xùa' }
  ];

  const isSecondaryActive = secondaryNavItems.some((item) => item.id === currentTab);

  const mobileBottomTabs = [
    { id: 'explore', label: 'Khám phá', icon: Compass },
    { id: 'stay', label: 'Lưu trú', icon: BedDouble },
    { id: 'transport', label: 'Di Chuyển', icon: Car },
    { id: 'community', label: 'Chat C/Đồng', icon: MessageCircle }
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
          isNavyHeader
            ? 'bg-brand-900/95 backdrop-blur-md border-b border-white/10 text-white'
            : 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-900 shadow-xs'
        }`}
      >
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
          {/* Main 3-Zone Header: Zero-overflow responsive layout */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-20">
            {/* Zone 1: Brand Lockup */}
            <button
              type="button"
              onClick={() => {
                setCurrentTab('explore');
                setIsMoreMenuOpen(false);
              }}
              className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group shrink-0 min-h-[44px]"
            >
              <div
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
                  isNavyHeader
                    ? 'bg-white text-brand-800'
                    : 'bg-brand-800 text-white'
                }`}
              >
                <Mountain className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500 ring-2 ring-brand-900" />
              </div>
              <div className="min-w-0">
                <div
                  className={`font-black text-xs sm:text-sm tracking-wider uppercase leading-tight whitespace-nowrap ${
                    isNavyHeader ? 'text-white' : 'text-brand-800'
                  }`}
                >
                  TÀ XÙA TRIP
                </div>
                <div
                  className={`hidden xl:block text-xs font-normal tracking-wide whitespace-nowrap ${
                    isNavyHeader ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  Đi thật. Biết trước.
                </div>
              </div>
            </button>

            {/* Zone 2: Streamlined Navigation Links + Dropdown (Desktop) */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 relative">
              {primaryNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentTab(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 cursor-pointer ${
                      isActive
                        ? isNavyHeader
                          ? 'text-white border-amber-400'
                          : 'text-brand-800 border-brand-800'
                        : isNavyHeader
                        ? 'text-white/80 hover:text-white border-transparent'
                        : 'text-slate-700 hover:text-brand-800 border-transparent'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* More Dropdown Menu (Dịch vụ, Ăn uống, Cộng đồng, Thẩm định) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1 text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 cursor-pointer ${
                    isSecondaryActive
                      ? isNavyHeader
                        ? 'text-amber-300 border-amber-400'
                        : 'text-teal-700 border-teal-700'
                      : isNavyHeader
                      ? 'text-white/80 hover:text-white border-transparent'
                      : 'text-slate-700 hover:text-brand-800 border-transparent'
                  }`}
                >
                  <span>Thêm</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMoreMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute top-full mt-2 left-0 w-64 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                    {secondaryNavItems.map((sec) => {
                      const Icon = sec.icon;
                      const active = currentTab === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            setCurrentTab(sec.id);
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-teal-50 text-brand-800 font-bold'
                              : 'hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${active ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-brand-800">{sec.label}</div>
                            <div className="text-xs text-slate-500 leading-tight">{sec.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            </nav>

            {/* Zone 3: Wishlist, My Trips, Primary AI Button & Points */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Wishlist: Shown outside only when NOT logged in and has saved items */}
              {!currentUser && savedCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenSavedModal}
                  aria-label={`Danh sách đã lưu (${savedCount})`}
                  className="relative inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:px-2.5 sm:min-h-[36px] rounded-full text-xs font-bold transition-colors cursor-pointer border shrink-0 bg-slate-100 hover:bg-slate-200 text-brand-800 border-slate-200"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span className="hidden md:inline ml-1">Đã lưu</span>
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-1.5 px-1.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-xs font-extrabold flex items-center justify-center tabular-nums shadow-xs">
                    {savedCount}
                  </span>
                </button>
              )}

              {/* AI Advisor Button (Clean, prominent button) */}
              {onOpenAiAdvisor && (
                <button
                  type="button"
                  onClick={onOpenAiAdvisor}
                  aria-label="Trợ lý AI tư vấn giá phòng, tour và lịch trình"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 min-h-[36px] rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 bg-brand-800 hover:bg-[#052243] text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                  <span className="whitespace-nowrap font-black">Tư vấn AI</span>
                </button>
              )}

              {/* User Profile & Role Dropdown (Desktop) */}
              {currentUser ? (
                <div className="hidden lg:relative lg:block">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-label={`Tài khoản: ${currentUser.name} (${currentUser.roleName})`}
                    className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 min-h-[36px] rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 bg-white hover:bg-slate-50 text-slate-800 border-slate-250 shadow-xs"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-300"
                      />
                      {(savedCount > 0 || bookingsCount > 0) && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
                      )}
                    </div>
                    <div className="flex flex-col items-start text-left leading-tight">
                      <span className="font-extrabold text-xs max-w-[85px] truncate">{currentUser.name}</span>
                      <span className={`text-xs font-black uppercase tracking-wider px-1 rounded-xs ${
                        currentUser.role === 'admin'
                          ? 'bg-rose-100 text-rose-700'
                          : currentUser.role === 'partner'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'partner' ? 'Chủ cơ sở' : 'Khách'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-xs text-slate-900 truncate">{currentUser.name}</p>
                            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                            <span className={`inline-block mt-0.5 text-xs font-black px-2 py-0.5 rounded-full ${
                              currentUser.role === 'admin'
                                ? 'bg-rose-100 text-rose-700'
                                : currentUser.role === 'partner'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}>
                              {currentUser.roleName}
                            </span>
                          </div>
                        </div>

                        {currentUser.facilityName && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                            <span className="font-bold">Cơ sở: </span>{currentUser.facilityName}
                          </div>
                        )}

                        {/* Personal Quick Access: Đã lưu, Đơn đặt, Điểm Mây (Tucked inside Profile) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenSavedModal();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Heart className={`w-3.5 h-3.5 ${savedCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                              <span>Cơ sở đã lưu</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-600 border border-rose-200 tabular-nums">
                              {savedCount}
                            </span>
                          </button>

                          {onOpenMyTripsModal && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenMyTripsModal();
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>Đơn đặt của tôi</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 text-teal-700 border border-teal-200 tabular-nums">
                                {bookingsCount}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenPointsModal();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <span>☁️</span>
                              <span>Điểm Mây tích lũy</span>
                            </span>
                            <span className="font-extrabold text-teal-700 text-xs bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60 tabular-nums">
                              {cloudPoints}đ
                            </span>
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentTab('admin');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Shield className="w-3.5 h-3.5 text-rose-600" />
                              <span>Trang Quản Trị Thẩm Định</span>
                            </button>
                          )}

                          {currentUser.role === 'partner' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentTab('partner');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Bảng Quản Lý Phòng & Lịch</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenAuthModal?.(currentUser.role, 'login');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-slate-500" />
                            <span>Đổi tài khoản / Vai trò khác</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout?.();
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 pt-1.5"
                          >
                            <LogOut className="w-3.5 h-3.5 text-red-500" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal?.('traveler', 'login')}
                  aria-label="Đăng nhập tài khoản"
                  className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                    isNavyHeader
                      ? 'bg-white text-slate-900 hover:bg-slate-100 border-white'
                      : 'bg-brand-800 text-white hover:bg-[#052243] border-brand-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}

              {/* Mobile / Tablet Menu Button (Quick Drawer trigger for screens < lg) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Mở toàn bộ menu dịch vụ"
                className={`lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors cursor-pointer shrink-0 ${
                  isNavyHeader
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Natural Thumb Zone, 56px height) */}
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200/90 grid grid-cols-5 items-center px-1.5 sm:px-3 pr-2 sm:pr-4 shadow-[0_-4px_20px_rgba(7,49,97,0.08)]"
      >
        {mobileBottomTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = currentTab === tab.id || (tab.id === 'transport' && currentTab === 'bus');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer min-w-0 ${
                isActive
                  ? 'text-brand-800 font-extrabold'
                  : 'text-slate-500 hover:text-brand-800 font-semibold'
              }`}
            >
              <div
                className={`px-3 py-0.5 rounded-full transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-700' : ''
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 5th Tab: Menu Drawer Trigger (Clean label, no duplicate emoji, safe distance from scrollbar) */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer min-w-0 mr-1 sm:mr-1.5 ${
            isMobileMenuOpen || ['services', 'dining', 'itinerary', 'partner', 'admin', 'verified'].includes(currentTab)
              ? 'text-brand-800 font-extrabold'
              : 'text-slate-500 hover:text-brand-800 font-semibold'
          }`}
        >
          <div
            className={`px-3 py-0.5 rounded-full transition-colors ${
              isMobileMenuOpen || ['services', 'dining', 'itinerary', 'partner', 'admin', 'verified'].includes(currentTab)
                ? 'bg-amber-100 text-amber-900 font-bold'
                : ''
            }`}
          >
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-xs tracking-tight mt-0.5 whitespace-nowrap font-bold">
            Menu
          </span>
        </button>
      </nav>

      {/* Mobile Action Sheet / Drawer for Full Navigation & Utilities */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Menu tiện ích di động Tà Xùa Trip"
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[86vh] overflow-y-auto p-5 space-y-5 shadow-2xl">
            {/* Drag Handle Affordance */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-brand-800">
                  Menu & Tiện ích Tà Xùa Trip
                </h2>
                <p className="text-xs text-slate-500">Đi thật · Biết trước · Hỗ trợ 24/7</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Đóng menu di động"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Advisor Callout in Mobile Drawer */}
            {onOpenAiAdvisor && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAiAdvisor();
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-linear-to-r from-brand-800 to-teal-900 text-white flex items-center justify-between gap-3 shadow-md border border-teal-500/30 cursor-pointer transition-transform active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Tính năng AI mới
                    </div>
                    <div className="text-sm font-extrabold leading-tight">
                      Hỏi Trợ Lý AI Tư Vấn
                    </div>
                    <div className="text-xs text-teal-200">
                      Check ngày, số người, đón xe & ngân sách
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full shrink-0">
                  Mở →
                </span>
              </button>
            )}

            {/* Primary Mobile Destinations Grid */}
            <div className="space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Danh Mục Khám Phá & Dịch Vụ:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'explore', label: 'Khám phá tổng quan', icon: Compass },
                  { id: 'stay', label: 'Lưu trú · Homestay', icon: BedDouble },
                  { id: 'transport', label: 'Di Chuyển (Xe/Taxi)', icon: Car },
                  { id: 'services', label: 'Dịch Vụ (Tour/Đồ)', icon: Shirt },
                  { id: 'dining', label: 'Ăn Uống (Quán/Cafe)', icon: Utensils },
                  { id: 'community', label: 'Chat Cộng Đồng 24/7', icon: MessageCircle },
                  { id: 'weather', label: 'Dự báo Săn mây', icon: CloudSun },
                  { id: 'map', label: 'Bản đồ tọa độ', icon: MapPin },
                  { id: 'itinerary', label: 'Trợ lý Lịch trình AI', icon: Sparkles },
                  { id: 'verified', label: 'Hồ sơ thẩm định', icon: ShieldCheck }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left text-xs font-bold min-h-[46px] transition-colors cursor-pointer ${
                        active
                          ? 'bg-brand-800 text-white border-brand-800'
                          : 'bg-slate-50 hover:bg-slate-100 text-brand-800 border-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-teal-700'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mountain Pass Utilities: SOS, Cloud Points, Low-Data Mode & PWA */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                An toàn đèo núi & Chế độ Offline
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSos();
                  }}
                  className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-3 py-2 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cứu hộ Đèo Chẹn 24/7</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenPointsModal();
                  }}
                  className="min-h-[44px] bg-teal-50 border border-teal-200 text-teal-900 rounded-xl px-3 py-2 text-xs font-extrabold cursor-pointer"
                >
                  ☁️ {cloudPoints} Điểm Mây
                </button>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <PWAInstallButton
                  isNavyHeader={false}
                  lowDataMode={lowDataMode}
                  onToggleLowDataMode={onToggleLowDataMode}
                />
              </div>
            </div>

            {/* User Profile & Role Switcher (Mobile Drawer) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {currentUser ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-slate-900 truncate">{currentUser.name}</span>
                        <span className={`text-xs font-black px-2 py-0.2 rounded-full ${
                          currentUser.role === 'admin'
                            ? 'bg-rose-100 text-rose-700'
                            : currentUser.role === 'partner'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {currentUser.roleName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>

                  {currentUser.facilityName && (
                    <div className="text-xs font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      🏡 <span className="font-bold">Cơ sở:</span> {currentUser.facilityName}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuthModal?.(currentUser.role, 'login');
                      }}
                      className="min-h-[38px] bg-white border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-100"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-600" />
                      <span>Đổi vai trò</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout?.();
                      }}
                      className="min-h-[38px] bg-red-50 border border-red-200 text-red-700 rounded-xl px-2.5 py-1.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-100"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-linear-to-br from-slate-900 to-brand-800 text-white rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">Đăng nhập tài khoản:</span>
                    <span className="text-xs text-teal-300">Khách / Chủ nhà / Admin</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuthModal?.('traveler', 'login');
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-xs font-bold cursor-pointer text-center"
                    >
                      Khách hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuthModal?.('partner', 'login');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg py-2 text-xs font-bold cursor-pointer text-center"
                    >
                      Chủ cơ sở
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuthModal?.('admin', 'login');
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2 text-xs font-bold cursor-pointer text-center"
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setHostingModalTab('live');
                    setIsDownloadModalOpen(true);
                  }}
                  className="min-h-[42px] bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Hosting Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleBlobDownload(
                      '/ta-xua-trip-chay-ngay.html',
                      'ta-xua-trip-chay-ngay.html',
                      'text/html;charset=utf-8'
                    );
                  }}
                  className="min-h-[42px] bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải bản .HTML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <HostingModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        initialTab={hostingModalTab}
        onDownloadFile={handleBlobDownload}
        downloadingFile={downloadingFile}
      />
    </>
  );
};

