import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parseLocation, pathForTab, listingPath, buildQuery, normalizeTab, MY_TRIPS_PATH } from './routing/routes.ts';
import { normalizeSearchIntent, quickDatePresets, todayInVietnam, addDays, type SearchIntent } from './search/searchIntent.ts';
import { readAttribution } from './search/attribution.ts';
import {
  BUS_TRIPS,
  CLOUD_FORECASTS,
  COMMUNITY_POSTS,
  INITIAL_USER_PROFILE,
  CLOUD_LANDMARKS,
  INITIAL_REWARD_SETTINGS,
  INITIAL_SITE_CONTENT,
  INITIAL_CURATED_COMBOS,
  INITIAL_REVID_GATEWAY_CONFIG
} from './data/mockData.ts';
import {
  Listing,
  Booking,
  UserRole,
  CommunityPost,
  VerificationTier,
  PartnerClaimRequest,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting,
  SiteContentConfig,
  CuratedComboPackage,
  CuratedComboCategory,
  CloudLandmark,
  CloudHuntingForecast
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection, HeroConsoleMode } from './components/HeroSection.tsx';
import { ListingCard } from './components/ListingCard.tsx';
import { ListingDetailModal } from './components/ListingDetailModal.tsx';
import { PartnerBookingsPanel } from './components/PartnerBookingsPanel.tsx';
import { LeaderboardCard } from './components/LeaderboardCard.tsx';
import { pointsApi } from './api/pointsApi.ts';
import { feedbackApi } from './api/feedbackApi.ts';
import { BusBookingModal } from './components/BusBookingModal.tsx';
import { CloudForecastWidget } from './components/CloudForecastWidget.tsx';
import { AIItineraryGenerator } from './components/AIItineraryGenerator.tsx';
import { CommunitySection } from './components/CommunitySection.tsx';
import { PartnerDashboard } from './components/PartnerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { JarvisAdminAssistant } from './components/JarvisAdminAssistant.tsx';
import { SosModal } from './components/SosModal.tsx';
import { BookingSuccessModal } from './components/BookingSuccessModal.tsx';
import { PointsModal } from './components/PointsModal.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { LegalPage } from './components/LegalPage.tsx';
import { InteractiveMapSection } from './components/InteractiveMapSection.tsx';
import { AITravelAdvisorModal } from './components/AITravelAdvisorModal.tsx';
import { ComingSoon, ComingSoonModal } from './components/ComingSoon.tsx';
import { isOpen as featureOpen, type FeatureKey } from './config/features.ts';
import {
  CompareFloatingBar,
  CompareHomestaysModal,
  WishlistDrawerModal
} from './components/CompareAndWishlistModals.tsx';
import { MyTripsModal } from './components/MyTripsModal.tsx';
import { DirectChatModal } from './components/DirectChatModal.tsx';
import { PartnerClaimModal } from './components/PartnerClaimModal.tsx';
import { VerificationMethodologySection } from './components/VerificationMethodologySection.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { listingsApi, managedToListing, claimToRequest, toContent, voucherFromServer, ApiError, type ManagedListing } from './api/listingsApi.ts';
import { onlyMappable, applyAvailability } from './utils/listingDisplay.ts';
import { EmptyState, ErrorState, Skeleton } from './components/ui/index.ts';
import { AuthUser, DEMO_ACCOUNTS } from './types/auth.ts';
import {
  formatVND,
  QUICK_SUGGESTIONS,
  matchesQuickSuggestion,
  QuickSuggestionId,
  isHomestayAvailableInDateRange,
  hiddenByDateFilter
} from './utils/rules.ts';
import {
  Bus,
  CloudSun,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Info,
  Compass,
  BedDouble,
  Bike,
  Package,
  Eye,
  Route,
  Building2,
  SlidersHorizontal,
  Search,
  Calendar,
  Users,
  MessageCircle,
  X,
  Mountain,
  Car,
  VolumeX,
  MapPin,
  RotateCcw,
  Clock,
  Utensils,
  Coffee,
  Tag,
  Award,
  Scale,
  Shirt
} from 'lucide-react';

const TAB_TITLES: Record<string, string> = {
  stay: 'Lưu trú',
  transport: 'Di chuyển',
  services: 'Dịch vụ',
  dining: 'Ăn uống',
  map: 'Bản đồ săn mây',
  weather: 'Dự báo săn mây',
  itinerary: 'Lịch trình',
  community: 'Cộng đồng',
  verified: 'Hồ sơ thẩm định',
  partner: 'Kênh đối tác',
  admin: 'Quản trị',
  terms: 'Điều khoản sử dụng',
  privacy: 'Chính sách dữ liệu cá nhân'
};

export default function App() {
  // Navigation & Role State (N02: Real Server Session Authentication)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('traveler');

  // Verify and restore session on mount with server API (N02.2 - no auto-login to demo!)
  useEffect(() => {
    const token = localStorage.getItem('taxua_session_token');
    if (!token) {
      setCurrentUser(null);
      setUserRole('traveler');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session invalid');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          const u: AuthUser = {
            id: data.user.id,
            name: data.user.fullName,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role,
            roleName: data.user.role === 'admin' ? 'Quản trị viên' : data.user.role === 'partner' ? 'Chủ cơ sở' : 'Khách hàng',
            facilityName: data.user.businessName,
            partnerListingTitle: data.user.businessName,
            partnerListingId: data.user.ownedListingIds?.[0],
            ownedListingIds: data.user.ownedListingIds || [],
            avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            createdAt: new Date().toISOString()
          };
          setCurrentUser(u);
          setUserRole(u.role);
          localStorage.setItem('taxua_auth_user', JSON.stringify(u));
        } else {
          throw new Error('Invalid user');
        }
      })
      .catch(() => {
        localStorage.removeItem('taxua_session_token');
        localStorage.removeItem('taxua_auth_user');
        setCurrentUser(null);
        setUserRole('traveler');
      });
  }, []);

  // U2: URL là nguồn sự thật cho màn đang xem (Back, chia sẻ link, tải lại đều đúng).
  const location = useLocation();
  const navigate = useNavigate();
  const route = React.useMemo(() => parseLocation(location.pathname, location.search), [location.pathname, location.search]);
  const [currentTab, setCurrentTabState] = useState<string>(() => route.tab || 'explore');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('traveler');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (role: UserRole = 'traveler', mode: 'login' | 'register' = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    try {
      localStorage.setItem('taxua_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
    showToast(`Đăng nhập thành công với vai trò: ${user.roleName}!`);
    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else if (user.role === 'partner') {
      setCurrentTab('partner');
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('taxua_session_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    try {
      localStorage.removeItem('taxua_session_token');
      localStorage.removeItem('taxua_auth_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setUserRole('traveler');
    if (currentTab === 'admin' || currentTab === 'partner') {
      setCurrentTab('explore');
    }
    showToast('Đã đăng xuất tài khoản.');
  };

  // Danh bạ cơ sở: đọc từ API (N03). Công khai chỉ có cơ sở đã duyệt.
  const [publicListings, setListings] = useState<Listing[]>([]);
  const [listingsLoad, setListingsLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const reloadListings = React.useCallback(async () => {
    try {
      setListings(await listingsApi.listPublic());
      setListingsLoad('ready');
    } catch (e) {
      console.error(e);
      setListingsLoad('error');
    }
  }, []);
  useEffect(() => {
    reloadListings();
  }, [reloadListings]);

  // N05.1: phòng trống theo đúng ngày khách đang chọn, từ server (một nguồn tồn cho lọc, thẻ, chi tiết, báo giá).
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, Record<string, number>> | null>(null);
  const [availabilityRange, setAvailabilityRange] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [availabilityTick, setAvailabilityTick] = useState(0);
  useEffect(() => {
    if (!availabilityRange) return;
    let cancelled = false;
    fetch(`/api/availability?checkIn=${availabilityRange.checkIn}&checkOut=${availabilityRange.checkOut}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled) setAvailabilityMap(body?.success ? body.data : null);
      })
      .catch(() => {
        if (!cancelled) setAvailabilityMap(null);
      });
    return () => {
      cancelled = true;
    };
  }, [availabilityRange?.checkIn, availabilityRange?.checkOut, availabilityTick]);
  const listings = React.useMemo(() => applyAvailability(publicListings, availabilityMap), [publicListings, availabilityMap]);

  // Hồ sơ quản lý: chủ cơ sở thấy cơ sở của mình (kể cả nháp/chờ duyệt), admin thấy tất cả.
  const [managedListings, setManagedListings] = useState<ManagedListing[]>([]);
  const reloadManaged = React.useCallback(async () => {
    try {
      if (currentUser?.role === 'admin') setManagedListings(await listingsApi.listAll());
      else if (currentUser?.role === 'partner') setManagedListings(await listingsApi.listMine());
      else setManagedListings([]);
    } catch (e) {
      console.error(e);
    }
  }, [currentUser?.id, currentUser?.role]);
  useEffect(() => {
    reloadManaged();
  }, [reloadManaged]);
  const managedAsListings = React.useMemo(
    () => managedListings.map(managedToListing).filter((l): l is Listing => l !== null),
    [managedListings]
  );

  const [selectedPartnerListingId, setSelectedPartnerListingId] = useState<string>('');
  // R4: lịch xe mẫu chưa được nhà xe xác nhận → không hiện khi chưa mở đặt vé xe.
  const [trips, setTrips] = useState(featureOpen('busBooking') ? BUS_TRIPS : []);
  const [landmarks, setLandmarks] = useState<CloudLandmark[]>(CLOUD_LANDMARKS);
  const [forecasts, setForecasts] = useState<CloudHuntingForecast[]>(CLOUD_FORECASTS);
  // Nội dung trang (CMS) lưu ở server; chưa có thì dùng nội dung mặc định.
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(INITIAL_SITE_CONTENT);
  useEffect(() => {
    listingsApi
      .getSiteContent()
      .then((saved: any) => {
        if (!saved) return;
        setSiteContent({
          ...INITIAL_SITE_CONTENT,
          ...saved,
          heroBanners: Array.isArray(saved.heroBanners) && saved.heroBanners.length > 0 ? saved.heroBanners : INITIAL_SITE_CONTENT.heroBanners,
          curatedCombos: Array.isArray(saved.curatedCombos) && saved.curatedCombos.length > 0 ? saved.curatedCombos : INITIAL_CURATED_COMBOS,
          socialChannels: Array.isArray(saved.socialChannels) && saved.socialChannels.length > 0 ? saved.socialChannels : INITIAL_SITE_CONTENT.socialChannels
        });
      })
      .catch((e) => console.error(e));
  }, []);

  // Admin sửa nội dung trang: lưu lên server sau 1,2 giây không gõ, báo kết quả thật.
  const siteContentSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUpdateSiteContent = (next: SiteContentConfig) => {
    setSiteContent(next);
    if (siteContentSaveTimer.current) clearTimeout(siteContentSaveTimer.current);
    siteContentSaveTimer.current = setTimeout(() => {
      listingsApi
        .putSiteContent(next)
        .then(() => showToast('Đã lưu nội dung trang lên máy chủ.'))
        .catch((e) => showToast(e instanceof ApiError ? `Chưa lưu nội dung trang: ${e.message}` : 'Chưa lưu được nội dung trang.'));
    }, 1200);
  };

  // Hero Console Mode & Curated Combo Filter States
  const [heroConsoleMode, setHeroConsoleMode] = useState<HeroConsoleMode>('stay');
  const [selectedComboCategory, setSelectedComboCategory] = useState<'all' | CuratedComboCategory>('all');
  const [showAllCuratedCombos, setShowAllCuratedCombos] = useState<boolean>(false);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(COMMUNITY_POSTS);
  // R4: không hiện đơn mẫu; đơn thật lấy từ server trong Chuyến đi của tôi.
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userProfile, setUserProfile] = useState(INITIAL_USER_PROFILE);
  const [billingEnabled, setBillingEnabled] = useState(false);
  // N06.3: khiếu nại thật từ server (admin) — dùng cho số đếm ở bảng quản trị và J.A.R.V.I.S. (chỉ đọc).
  const [disputes, setDisputes] = useState<BookingDispute[]>([]);
  useEffect(() => {
    if (currentUser?.role !== 'admin') return setDisputes([]);
    void feedbackApi.adminComplaints().then((r) => {
      if (!r.ok) return;
      const issue: Record<string, BookingDispute['issueType']> = { room: 'room_mismatch', price: 'pricing_scam' };
      setDisputes(
        r.data.map((c) => ({
          id: c.id, bookingId: c.bookingId, listingId: '', listingTitle: c.listingTitle, guestName: c.guestName, guestPhone: c.guestPhone,
          issueType: issue[c.category] || 'service_attitude', description: c.description, createdAt: c.createdAt,
          status: c.status === 'open' ? 'opening' : c.status !== 'closed' ? 'investigating' : c.outcome === 'refunded' ? 'refunded' : 'resolved',
        }))
      );
    });
  }, [currentUser?.id, currentUser?.role]);
  // N04.3: voucher lưu ở server, admin tạo; không còn voucher mẫu trong trình duyệt.
  const [vouchers, setVouchers] = useState<PromoVoucher[]>([]);
  const [rewardSettings, setRewardSettings] = useState<ServiceRewardSetting[]>(INITIAL_REWARD_SETTINGS);
  const [claimRequests, setClaimRequests] = useState<PartnerClaimRequest[]>([]);

  // Subcategory filter states for Di Chuyển, Dịch Vụ, Ăn Uống
  const [transportSubCategory, setTransportSubCategory] = useState<'all' | 'bus' | 'taxi' | 'motorbike'>('all');
  const [transportSearchQuery, setTransportSearchQuery] = useState('');
  const [transportTimeSlot, setTransportTimeSlot] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const [transportPickupZone, setTransportPickupZone] = useState<'all' | 'my_dinh_cau_giay' | 'yen_nghia_bigc' | 'noi_bai' | 'bac_ninh_viet_tri' | 'door_to_door'>('all');
  const [transportVehicleType, setTransportVehicleType] = useState<'all' | 'cabin_vip' | 'limousine' | 'sleeper_bus' | 'shared_car'>('all');
  const [transportOnlyBikeCombo, setTransportOnlyBikeCombo] = useState(false);
  const [transportSortBy, setTransportSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating'>('recommended');
  const [transportViewMode, setTransportViewMode] = useState<'grid' | 'list'>('grid');
  const [activeBusModalTripId, setActiveBusModalTripId] = useState<string | undefined>(undefined);
  const [activeBusModalCombo, setActiveBusModalCombo] = useState<boolean>(false);
  const [showTransportComboCalc, setShowTransportComboCalc] = useState<boolean>(false);
  const [calcPassengers, setCalcPassengers] = useState<number>(2);
  const [calcBikes, setCalcBikes] = useState<number>(1);
  const [calcReturnBeforeNoon, setCalcReturnBeforeNoon] = useState<boolean>(true);

  // R4: tính năng chưa mở thì nút dẫn tới nó mở hộp "Sắp ra mắt".
  const [lockedFeatureModal, setLockedFeatureModal] = useState<FeatureKey | null>(null);

  const handleOpenBusBookingModal = (tripId?: string, enableCombo: boolean = false) => {
    if (!featureOpen('busBooking')) return setLockedFeatureModal('busBooking');
    setActiveBusModalTripId(tripId);
    setActiveBusModalCombo(enableCombo);
    setIsBusModalOpen(true);
  };
  const [servicesSubCategory, setServicesSubCategory] = useState<'all' | 'tour' | 'photo' | 'costume' | 'camera'>('all');
  const [diningSubCategory, setDiningSubCategory] = useState<'all' | 'restaurant' | 'coffee'>('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [onlyCloudView, setOnlyCloudView] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedQuickSuggestions, setSelectedQuickSuggestions] = useState<QuickSuggestionId[]>([]);
  const [visibleExploreCount, setVisibleExploreCount] = useState<number>(12);

  const handleToggleQuickSuggestion = (suggestionId: QuickSuggestionId) => {
    setSelectedQuickSuggestions((prev) => {
      const exists = prev.includes(suggestionId);
      const next = exists ? prev.filter((id) => id !== suggestionId) : [...prev, suggestionId];
      if (next.length > 0 && selectedCategory !== 'all' && selectedCategory !== 'homestay') {
        setSelectedCategory('homestay');
      }
      return next;
    });
  };

  // Stay Page Specific Filters & View Controls
  const [staySearchQuery, setStaySearchQuery] = useState('');
  const [stayPriceRange, setStayPriceRange] = useState<'all' | 'under_600k' | '600k_1m' | 'over_1m'>('all');
  const [stayRoomCategory, setStayRoomCategory] = useState<'all' | 'bungalow' | 'double' | 'family' | 'dorm'>('all');
  const [stayAmenities, setStayAmenities] = useState<string[]>([]);
  const [staySortBy, setStaySortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'most_rooms'>('recommended');
  const [stayViewMode, setStayViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [visibleStayCount, setVisibleStayCount] = useState<number>(12);
  const [isFloatingSocialExpanded, setIsFloatingSocialExpanded] = useState<boolean>(false);
  const [stayViewDirection, setStayViewDirection] = useState('all');
  const [stayCarAccess, setStayCarAccess] = useState('all');
  // N04.1: lựa chọn tìm kiếm dùng chung (trang chủ → danh sách → chi tiết → báo giá).
  // Lấy từ URL khi mở trang, đã chuẩn hóa (ngày quá khứ/sai → ngày mai theo giờ VN).
  const initialIntent = React.useMemo(() => normalizeSearchIntent(route.query), []);
  const [stayCheckIn, setStayCheckIn] = useState(initialIntent.checkIn);
  const [stayCheckOut, setStayCheckOut] = useState(initialIntent.checkOut);
  const [stayFilterByAvailableDates, setStayFilterByAvailableDates] = useState(true);
  const [stayAdults, setStayAdults] = useState(initialIntent.adults);
  const [stayChildren, setStayChildren] = useState(initialIntent.children);
  const [stayRooms, setStayRooms] = useState(initialIntent.rooms);

  useEffect(() => {
    setAvailabilityRange({ checkIn: stayCheckIn, checkOut: stayCheckOut });
  }, [stayCheckIn, stayCheckOut]);

  /** Đổi lựa chọn từ bất kỳ màn nào; luôn chuẩn hóa để không lọt ngày sai/số âm. */
  const updateSearchIntent = (patch: Partial<SearchIntent>) => {
    const next = normalizeSearchIntent({
      checkIn: stayCheckIn,
      checkOut: stayCheckOut,
      adults: stayAdults,
      children: stayChildren,
      rooms: stayRooms,
      area: selectedArea,
      ...patch
    });
    setStayCheckIn(next.checkIn);
    setStayCheckOut(next.checkOut);
    setStayAdults(next.adults);
    setStayChildren(next.children);
    setStayRooms(next.rooms);
  };

  const handleToggleStayAmenity = (amenityKey: string) => {
    setStayAmenities((prev) =>
      prev.includes(amenityKey) ? prev.filter((k) => k !== amenityKey) : [...prev, amenityKey]
    );
  };

  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isJarvisOverlayOpen, setIsJarvisOverlayOpen] = useState(false);
  const [isCommunityPopupOpen, setIsCommunityPopupOpen] = useState(false);
  const [communityPopupSpaceId, setCommunityPopupSpaceId] = useState<string>('space-1');

  // Keyboard shortcut Ctrl + J / Cmd + J to summon J.A.R.V.I.S. exclusively for Admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        if (currentUser?.role === 'admin' && featureOpen('adminAssistant')) {
          e.preventDefault();
          setIsJarvisOverlayOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  const handleOpenCommunityPopup = (spaceId: string = 'space-1') => {
    if (!featureOpen('communityChat')) return setLockedFeatureModal('communityChat');
    setCommunityPopupSpaceId(spaceId);
    setIsCommunityPopupOpen(true);
  };

  // Modals & Pro OTA Pack States
  const [selectedListingDetail, setSelectedListingDetailState] = useState<Listing | null>(null);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const isMyTripsModalOpen = Boolean(route.myTrips);
  const [activeDirectChatListing, setActiveDirectChatListing] = useState<Listing | null>(null);
  const [activeClaimListing, setActiveClaimListing] = useState<Listing | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [isMobileFilterCollapsed, setIsMobileFilterCollapsed] = useState(false);
  const [activeSuccessBooking, setActiveSuccessBooking] = useState<Booking | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Voucher toggle handler
  const reloadVouchers = React.useCallback(async () => {
    if (currentUser?.role !== 'admin') return setVouchers([]);
    try {
      setVouchers((await listingsApi.listVouchers()).map(voucherFromServer));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser?.id, currentUser?.role]);
  useEffect(() => {
    reloadVouchers();
  }, [reloadVouchers]);

  const saveVoucher = async (v: PromoVoucher, okMsg: string) => {
    try {
      await listingsApi.upsertVoucher(v);
      showToast(okMsg);
      await reloadVouchers();
    } catch (e) {
      showToast(e instanceof ApiError ? `Chưa lưu voucher: ${e.message}` : 'Chưa lưu được voucher.');
    }
  };

  const handleToggleVoucher = (voucherId: string) => {
    const v = vouchers.find((x) => x.id === voucherId);
    if (v) void saveVoucher({ ...v, isActive: !v.isActive }, v.isActive ? `Đã tắt mã ${v.code}.` : `Đã bật mã ${v.code}.`);
  };

  const handleAddVoucher = (v: PromoVoucher) => {
    void saveVoucher(v, `Đã lưu mã ${v.code.toUpperCase()} lên máy chủ.`);
  };

  // Reward point percentage update handler
  const handleUpdateRewardPercent = (listingId: string, percent: number) => {
    setRewardSettings((prev) => {
      const exists = prev.find((r) => r.listingId === listingId);
      if (exists) {
        return prev.map((r) => (r.listingId === listingId ? { ...r, pointEarnRatePercent: percent } : r));
      }
      return [...prev, { listingId, pointEarnRatePercent: percent, pointRedemptionAllowed: true }];
    });
    showToast(`Đã lưu tỷ lệ tích điểm ${percent}% cho cơ sở!`);
  };

  // Nhận chính chủ (N03.2): lưu ở server; duyệt chỉ gắn quyền sở hữu, không nâng huy hiệu.
  const reloadClaims = React.useCallback(async () => {
    if (currentUser?.role !== 'admin') return setClaimRequests([]);
    try {
      setClaimRequests((await listingsApi.listClaims()).map(claimToRequest));
    } catch (e) {
      console.error(e);
    }
  }, [currentUser?.id, currentUser?.role]);
  useEffect(() => {
    reloadClaims();
  }, [reloadClaims]);

  const reviewClaim = async (claimId: string, decision: 'approve' | 'reject') => {
    try {
      await listingsApi.reviewClaim(claimId, decision);
      showToast(decision === 'approve' ? 'Đã duyệt: cơ sở được gắn cho tài khoản chủ cơ sở.' : 'Đã từ chối hồ sơ nhận cơ sở.');
      await Promise.all([reloadClaims(), reloadListings(), reloadManaged()]);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Không xử lý được hồ sơ.');
    }
  };
  const handleApproveClaim = (claimId: string) => {
    void reviewClaim(claimId, 'approve');
  };
  const handleRejectClaim = (claimId: string) => {
    void reviewClaim(claimId, 'reject');
  };

  const handleSubmitClaim = async (request: Omit<PartnerClaimRequest, 'id' | 'createdAt' | 'status'>) => {
    if (currentUser?.role !== 'partner') {
      showToast('Vui lòng đăng nhập bằng tài khoản Chủ cơ sở để gửi hồ sơ nhận cơ sở.');
      return;
    }
    try {
      // Không gửi số CCCD/MST qua kênh này; admin gọi điện xác minh với chủ cơ sở.
      await listingsApi.claim(request.listingId, {
        ownerName: request.ownerName,
        ownerPhone: request.ownerPhone.replace(/\s/g, ''),
        zalo: request.zalo,
        evidenceNote: request.proofDocumentNote
      });
      showToast('Đã gửi hồ sơ nhận cơ sở. Ban quản trị sẽ liên hệ để xác minh.');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Không gửi được hồ sơ.');
    }
  };

  const handleRegisterMember = (name: string, phone: string) => {
    setUserProfile((prev) => ({
      ...prev,
      name,
      phone
    }));
    showToast(`Chào mừng thành viên ${name} (${phone}) đã đăng ký!`);
  };

  // ---------- Điều hướng bằng đường dẫn (U2) ----------
  const filterQuery = () =>
    buildQuery({
      checkIn: currentTab === 'stay' ? stayCheckIn : undefined,
      checkOut: currentTab === 'stay' ? stayCheckOut : undefined,
      adults: currentTab === 'stay' ? stayAdults : undefined,
      children: currentTab === 'stay' ? stayChildren : undefined,
      rooms: currentTab === 'stay' ? stayRooms : undefined,
      area: selectedArea
    });

  /** Chuyển màn = đổi URL (đẩy vào lịch sử để nút Back quay lại được). */
  const setCurrentTab = (tab: string) => {
    const target = pathForTab(tab);
    const keepIntent = normalizeTab(tab) === 'stay';
    const qs = buildQuery({
      area: selectedArea,
      checkIn: keepIntent ? stayCheckIn : undefined,
      checkOut: keepIntent ? stayCheckOut : undefined,
      adults: keepIntent ? stayAdults : undefined,
      children: keepIntent ? stayChildren : undefined,
      rooms: keepIntent ? stayRooms : undefined
    });
    if (location.pathname !== target) navigate(`${target}${qs}`);
    else setCurrentTabState(normalizeTab(tab));
  };

  /** Đóng lớp phủ có URL riêng: quay lại trang trước nếu đến từ trong website, không thì về màn nền. */
  const leaveOverlayRoute = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate(`${pathForTab(currentTab)}${filterQuery()}`, { replace: true });
  };

  const setSelectedListingDetail = (listing: Listing | null) => {
    if (listing) {
      setSelectedListingDetailState(listing);
      const target = listingPath(listing.id);
      if (location.pathname !== target) navigate(`${target}${location.search}`);
    } else if (route.listingId) {
      leaveOverlayRoute();
    } else {
      setSelectedListingDetailState(null);
    }
  };

  const setIsMyTripsModalOpen = (open: boolean) => {
    if (open && !route.myTrips) navigate(MY_TRIPS_PATH);
    else if (!open && route.myTrips) leaveOverlayRoute();
  };

  // Đọc bộ lọc trong URL một lần khi mở trang (link chia sẻ có ngày/khu vực).
  useEffect(() => {
    const q = route.query;
    if (q.area) setSelectedArea(q.area);
    if (q.wishlistIds && q.wishlistIds.length > 0) {
      setUserProfile((prev) => ({
        ...prev,
        savedListings: Array.from(new Set([...prev.savedListings, ...q.wishlistIds!]))
      }));
    }
  }, []);

  // URL đổi (bấm link, Back/Forward, mở link chia sẻ) → cập nhật màn hiển thị.
  useEffect(() => {
    if (route.redirectTo) {
      navigate(route.redirectTo, { replace: true });
      return;
    }
    if (route.notFound) {
      showToast('Không tìm thấy trang này, đã chuyển về trang chủ.');
      navigate('/', { replace: true });
      return;
    }
    if (route.tab) setCurrentTabState(route.tab);
    if (!route.listingId) {
      setSelectedListingDetailState(null);
      return;
    }
    const id = route.listingId;
    setSelectedListingDetailState((prev) => (prev && prev.id === id ? prev : listings.find((l) => l.id === id) || prev));
    if (!listings.some((l) => l.id === id)) {
      listingsApi
        .getPublic(id)
        .then((found) => setSelectedListingDetailState(found))
        .catch(() => {
          showToast('Cơ sở trong đường dẫn không tồn tại hoặc chưa được duyệt.');
          navigate('/', { replace: true });
        });
    }
  }, [route]);

  // Bộ lọc đổi → ghi vào query của trang hiện tại (thay thế, không tạo thêm bước Back).
  // Bỏ qua lần đầu: bộ lọc trong link chia sẻ chưa kịp áp vào state.
  const filterSyncReady = React.useRef(false);
  useEffect(() => {
    if (!filterSyncReady.current) {
      filterSyncReady.current = true;
      return;
    }
    if (route.redirectTo || route.notFound) return;
    const qs = route.myTrips || route.checkinToken !== undefined
      ? location.search
      : route.listingId
        ? buildQuery({ checkIn: stayCheckIn, checkOut: stayCheckOut, adults: stayAdults, children: stayChildren, rooms: stayRooms, area: selectedArea })
        : filterQuery();
    if (qs !== location.search) navigate(`${location.pathname}${qs}`, { replace: true });
  }, [currentTab, stayCheckIn, stayCheckOut, stayAdults, stayChildren, stayRooms, selectedArea]);

  // Tiêu đề tab trình duyệt theo trang đang xem (chia sẻ, lịch sử trình duyệt dễ nhận ra).
  const baseTitle = React.useRef(typeof document !== 'undefined' ? document.title : 'Tà Xùa Trip');
  useEffect(() => {
    document.title = selectedListingDetail
      ? `${selectedListingDetail.title} | Tà Xùa Trip`
      : route.myTrips
        ? 'Chuyến đi của tôi | Tà Xùa Trip'
        : TAB_TITLES[currentTab]
          ? `${TAB_TITLES[currentTab]} | Tà Xùa Trip`
          : baseTitle.current;
  }, [selectedListingDetail, currentTab, route.myTrips]);

  // Toggle Favorite
  const handleToggleSave = (id: string) => {
    setUserProfile((prev) => {
      const isSaved = prev.savedListings.includes(id);
      const nextSaved = isSaved
        ? prev.savedListings.filter((item) => item !== id)
        : [...prev.savedListings, id];
      showToast(isSaved ? 'Đã bỏ lưu cơ sở' : 'Đã lưu cơ sở vào danh sách yêu thích!');
      return { ...prev, savedListings: nextSaved };
    });
  };

  // Toggle Homestay Comparison (up to 3)
  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        showToast('Đã bỏ cơ sở khỏi bảng so sánh');
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        showToast('Chỉ có thể so sánh tối đa 3 homestay cùng lúc!');
        return [...prev.slice(1), id];
      }
      showToast('Đã thêm homestay vào thanh So sánh!');
      return [...prev, id];
    });
  };

  // Filter listings
  const filteredListings = listings
    .filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedArea !== 'all' && item.area !== selectedArea) return false;
      if (onlyCloudView && !item.hasCloudView) return false;
      if (onlyAvailable && item.roomTypes) {
        const hasFreeRooms = item.roomTypes.some((r) => r.availableRooms > 0);
        if (!hasFreeRooms) return false;
      }
      if (selectedQuickSuggestions.length > 0) {
        const matchesAllQuick = selectedQuickSuggestions.every((qid) =>
          matchesQuickSuggestion(item, qid)
        );
        if (!matchesAllQuick) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchArea = item.area.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchArea && !matchTags) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.minPrice - b.minPrice;
      if (sortBy === 'price_desc') return b.minPrice - a.minPrice;

      // 1. Ưu tiên tuyệt đối các cơ sở được Admin ghim Đề Xuất (isAdminFeatured + adminPriorityRank)
      const featA = a.isAdminFeatured ? 1 : 0;
      const featB = b.isAdminFeatured ? 1 : 0;
      if (featA !== featB) return featB - featA;
      if (featA && featB) {
        const rankDiff = (b.adminPriorityRank || 0) - (a.adminPriorityRank || 0);
        if (rankDiff !== 0) return rankDiff;
      }

      // 2. Khi xem "Tất cả cơ sở" trên trang Khám phá, ưu tiên Homestay & Điểm trải nghiệm trước
      if (selectedCategory === 'all') {
        const catWeight = (cat: string) =>
          cat === 'homestay'
            ? 4
            : cat === 'coffee' || cat === 'restaurant' || cat === 'tour'
            ? 3
            : cat === 'photo' || cat === 'costume'
            ? 2
            : 1;
        const wDiff = catWeight(b.category) - catWeight(a.category);
        if (wDiff !== 0) return wDiff;
      }

      return b.verificationTier - a.verificationTier || b.rating - a.rating;
    });

  // Dedicated /stay Filtered Homestays (with full real-data filters: Date, Capacity, Price, Room Type, Amenities, Search & Sort)
  const stayNightsCount = Math.max(
    1,
    Math.round(
      (new Date(stayCheckOut).getTime() - new Date(stayCheckIn).getTime()) / (1000 * 60 * 60 * 24)
    ) || 2
  );

  const stayFilteredListings = listings
    .filter((item) => {
      if (item.category !== 'homestay') return false;
      if (selectedArea !== 'all' && item.area !== selectedArea) return false;
      if (onlyCloudView && !item.hasCloudView) return false;

      // 1. Search by Homestay Name, Area, Address, Room Type or Tag
      if (staySearchQuery.trim()) {
        const q = staySearchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchArea = item.area.toLowerCase().includes(q);
        const matchAddress = item.address.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchRoom = item.roomTypes?.some((r) => r.name.toLowerCase().includes(q));
        if (!matchTitle && !matchArea && !matchAddress && !matchTags && !matchRoom) return false;
      }

      // 2. Price Range Filter
      if (stayPriceRange === 'under_600k' && item.minPrice >= 600000) return false;
      if (stayPriceRange === '600k_1m' && (item.minPrice < 600000 || item.minPrice > 1000000)) return false;
      if (stayPriceRange === 'over_1m' && item.minPrice <= 1000000) return false;

      // 3. Room Category Filter
      if (stayRoomCategory !== 'all') {
        const allRoomText = [
          ...(item.roomTypes?.map((r) => `${r.name} ${r.viewType}`) || []),
          ...item.tags
        ]
          .join(' ')
          .toLowerCase();

        if (
          stayRoomCategory === 'bungalow' &&
          !allRoomText.includes('bungalow') &&
          !allRoomText.includes('kính') &&
          !allRoomText.includes('glamping') &&
          !allRoomText.includes('lều') &&
          !item.hasCloudView
        ) {
          return false;
        }
        if (
          stayRoomCategory === 'double' &&
          !item.roomTypes?.some((r) => r.capacity <= 3 || r.name.toLowerCase().includes('đôi'))
        ) {
          return false;
        }
        if (
          stayRoomCategory === 'family' &&
          !item.roomTypes?.some(
            (r) =>
              r.capacity >= 4 ||
              r.name.toLowerCase().includes('gia đình') ||
              r.name.toLowerCase().includes('nhóm')
          ) &&
          !allRoomText.includes('gia đình')
        ) {
          return false;
        }
        if (
          stayRoomCategory === 'dorm' &&
          !allRoomText.includes('sàn') &&
          !allRoomText.includes('tập thể') &&
          !allRoomText.includes('dorm') &&
          !allRoomText.includes('cộng đồng') &&
          !item.roomTypes?.some((r) => r.capacity >= 6)
        ) {
          return false;
        }
      }

      // 4. Mountain Amenities Filter
      if (stayAmenities.length > 0) {
        const combinedAmenitiesText = [
          ...(item.roomTypes?.flatMap((r) => r.amenities || []) || []),
          ...item.tags,
          item.description
        ]
          .join(' ')
          .toLowerCase();

        for (const am of stayAmenities) {
          if (
            am === 'heating' &&
            !combinedAmenitiesText.includes('sưởi') &&
            !combinedAmenitiesText.includes('điều hòa') &&
            !combinedAmenitiesText.includes('ấm')
          ) {
            return false;
          }
          if (
            am === 'hot_water' &&
            !combinedAmenitiesText.includes('nóng lạnh') &&
            !combinedAmenitiesText.includes('khép kín') &&
            !combinedAmenitiesText.includes('tắm')
          ) {
            return false;
          }
          if (
            am === 'bathtub' &&
            !combinedAmenitiesText.includes('bồn tắm') &&
            !combinedAmenitiesText.includes('kính') &&
            !combinedAmenitiesText.includes('ban công')
          ) {
            return false;
          }
          if (
            am === 'bbq' &&
            !combinedAmenitiesText.includes('bbq') &&
            !combinedAmenitiesText.includes('nướng') &&
            !combinedAmenitiesText.includes('lửa trại') &&
            !combinedAmenitiesText.includes('lẩu') &&
            !combinedAmenitiesText.includes('sân')
          ) {
            return false;
          }
        }
      }

      // 5. View Direction & Car Access
      if (stayViewDirection === 'mountain' && !item.hasCloudView) return false;
      if (
        stayViewDirection === 'valley' &&
        !item.roomTypes?.some((r) => r.viewType.toLowerCase().includes('thung lũng'))
      ) {
        return false;
      }

      if (
        stayCarAccess === 'yes' &&
        !item.tags.some((t) => t.toLowerCase().includes('ô tô'))
      ) {
        return false;
      }
      if (
        stayCarAccess === 'motorbike' &&
        !item.tags.some((t) => t.toLowerCase().includes('xe máy') || t.toLowerCase().includes('săn mây'))
      ) {
        return false;
      }

      // 6. Real Guest Capacity Check (stayAdults + stayChildren)
      // D04: không có quy định riêng cho trẻ em → trẻ em tính vào sức chứa như người lớn (giống báo giá server).
      const totalRequestedGuests = stayAdults + stayChildren;
      if (item.roomTypes && item.roomTypes.length > 0) {
        // N05.1: phòng còn 0 là 0 (trước đây Math.max(1, …) đếm thành 1). availableRooms đã theo ngày chọn (applyAvailability).
        const totalHomestayCapacity = item.roomTypes.reduce(
          (sum, r) => sum + Math.max(0, r.availableRooms ?? r.totalRooms ?? 0) * (r.capacity || 0),
          0
        );
        if (totalHomestayCapacity < totalRequestedGuests) return false;
      }

      // 7. Date Range Availability Filter
      if (stayFilterByAvailableDates) {
        // Tồn đã tính ở server theo từng đêm (applyAvailability); không trừ thêm đơn lưu trong trình duyệt để tránh đếm hai lần.
        if (hiddenByDateFilter(item, stayCheckIn, stayCheckOut, [])) return false;
      } else if (onlyAvailable && item.roomTypes) {
        const hasFreeRooms = item.roomTypes.some((r) => r.availableRooms > 0);
        if (!hasFreeRooms) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (staySortBy === 'price_asc') return a.minPrice - b.minPrice;
      if (staySortBy === 'price_desc') return b.minPrice - a.minPrice;
      if (staySortBy === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
      if (staySortBy === 'most_rooms') {
        const roomsA = a.roomTypes?.reduce((s, r) => s + (r.availableRooms || 0), 0) || 0;
        const roomsB = b.roomTypes?.reduce((s, r) => s + (r.availableRooms || 0), 0) || 0;
        return roomsB - roomsA;
      }
      const featA = a.isAdminFeatured ? 1 : 0;
      const featB = b.isAdminFeatured ? 1 : 0;
      if (featA !== featB) return featB - featA;
      if (featA && featB) {
        const rankDiff = (b.adminPriorityRank || 0) - (a.adminPriorityRank || 0);
        if (rankDiff !== 0) return rankDiff;
      }
      return b.verificationTier - a.verificationTier || b.rating - a.rating;
    });

  // Booking completion handler
  const handleBookingSuccess = (bookingInput: Booking) => {
    // N04.1: gắn nguồn khách lần chạm đầu (đã ghi trong main.tsx trước khi URL bị viết lại).
    const attribution = typeof window !== 'undefined' ? readAttribution(window.localStorage) : null;
    const newBooking: Booking = attribution ? { ...bookingInput, attribution } : bookingInput;
    setBookings((prev) => [newBooking, ...prev]);
    // N06.2 (D05): Điểm Mây chỉ cộng khi chuyến HOÀN TẤT, do server ghi — không cộng lúc đặt.
    setUserProfile((prev) => ({
      ...prev,
      bookingHistory: [newBooking, ...prev.bookingHistory]
    }));

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === newBooking.listingId) {
          return {
            ...l,
            stats: {
              ...l.stats,
              bookingsCount: l.stats.bookingsCount + 1
            }
          };
        }
        return l;
      })
    );

    setSelectedListingDetail(null);
    setIsBusModalOpen(false);
    setActiveSuccessBooking(newBooking);
  };

  // Partner dashboard handlers
  // N05.1: chủ cơ sở cập nhật phòng trống theo đêm, lưu trên máy chủ.
  const [partnerInventoryDate, setPartnerInventoryDate] = useState<string>(() => todayInVietnam());
  const [partnerRoomAvailability, setPartnerRoomAvailability] = useState<Record<string, number> | null>(null);
  const partnerListingIdForInventory = currentUser?.role === 'partner' ? selectedPartnerListingId || managedListings[0]?.id || '' : '';
  const reloadPartnerAvailability = React.useCallback(async () => {
    if (!partnerListingIdForInventory) return setPartnerRoomAvailability(null);
    try {
      const res = await fetch(
        `/api/listings/${encodeURIComponent(partnerListingIdForInventory)}/availability?checkIn=${partnerInventoryDate}&checkOut=${addDays(partnerInventoryDate, 1)}`
      );
      const body = await res.json();
      setPartnerRoomAvailability(
        body?.success ? Object.fromEntries(body.data.rooms.map((r: { roomTypeId: string; available: number }) => [r.roomTypeId, r.available])) : null
      );
    } catch {
      setPartnerRoomAvailability(null);
    }
  }, [partnerListingIdForInventory, partnerInventoryDate]);
  useEffect(() => {
    reloadPartnerAvailability();
  }, [reloadPartnerAvailability]);

  const handleUpdateAvailability = async (roomId: string, newAvailable: number) => {
    const listingId = partnerListingIdForInventory;
    if (!listingId) return;
    try {
      const res = await fetch(`/api/partner/listings/${encodeURIComponent(listingId)}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('taxua_session_token') || ''}` },
        body: JSON.stringify({ roomTypeId: roomId, dates: [partnerInventoryDate], availableRooms: newAvailable })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        showToast(`Chưa lưu: ${body?.error || 'không cập nhật được phòng trống.'}`);
        return;
      }
      showToast(`Đã lưu: đêm ${partnerInventoryDate.split('-').reverse().join('/')} còn ${newAvailable} phòng.`);
      await reloadPartnerAvailability();
      setAvailabilityTick((n) => n + 1);
    } catch {
      showToast('Không kết nối được máy chủ, chưa lưu phòng trống.');
    }
  };

  const handleConfirmBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b))
    );
    showToast('Đã xác nhận đơn đặt phòng!');
  };

  const handleCheckInBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'checked_in' } : b))
    );
    showToast('Khách đã Check-in tại quầy thành công!');
  };

  const handleCompleteBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'completed'
          };
        }
        return b;
      })
    );

    showToast('Đã hoàn tất lưu trú! Bạn đã có thể để lại đánh giá xác thực.');
  };

  // Admin handlers
  const handleToggleBilling = () => {
    setBillingEnabled(!billingEnabled);
    showToast(
      !billingEnabled
        ? 'Đã BẬT cờ thu phí (kết toán phí cuối tháng làm ở bước sau)'
        : 'Đã TẮT thu phí - Chế độ Beta miễn phí'
    );
  };

  const runAdmin = async (action: () => Promise<unknown>, okMsg: string) => {
    try {
      await action();
      showToast(okMsg);
      await Promise.all([reloadListings(), reloadManaged()]);
      return true;
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Thao tác không thành công.');
      return false;
    }
  };

  const handleUpdateTier = (listingId: string, newTier: VerificationTier) => {
    // D06: cấp 2–3 phải ghi nguồn xác minh (giấy tờ, người thẩm định, ngày).
    const source =
      newTier === 1 ? '' : window.prompt(`Nguồn xác minh cho Cấp ${newTier} (giấy tờ đã xem, người thẩm định, ngày):`) || '';
    if (newTier > 1 && source.trim().length < 5) {
      showToast('Chưa đổi cấp: cần ghi nguồn xác minh.');
      return;
    }
    void runAdmin(() => listingsApi.setVerification(listingId, newTier, source.trim()), `Đã cập nhật Cấp ${newTier} cho cơ sở.`);
  };

  const hasPendingVersion = (listingId: string) =>
    managedListings.some((m) => m.id === listingId && m.openVersion?.status === 'pending');

  const handleApproveListing = (listingId: string) => {
    void (hasPendingVersion(listingId)
      ? runAdmin(() => listingsApi.review(listingId, 'approve'), 'Đã duyệt bản cập nhật, thông tin mới đã công khai.')
      : runAdmin(() => listingsApi.setStatus(listingId, 'approved'), 'Đã phê duyệt cơ sở hiển thị công khai.'));
  };

  const handleRejectListing = (listingId: string) => {
    const note = window.prompt('Lý do từ chối (chủ cơ sở sẽ thấy):') || undefined;
    void (hasPendingVersion(listingId)
      ? runAdmin(() => listingsApi.review(listingId, 'reject', note), 'Đã từ chối bản cập nhật; bản công khai giữ nguyên.')
      : runAdmin(() => listingsApi.setStatus(listingId, 'rejected', note), 'Đã từ chối cơ sở; cơ sở không còn hiển thị công khai.'));
  };

  const handleAddCommunityPost = (post: CommunityPost) => {
    setCommunityPosts((prev) => [post, ...prev]);
    showToast('Đăng bài lên cộng đồng thành công!');
  };


  // N06.2: Điểm Mây hiển thị trên thanh điều hướng lấy từ sổ điểm của server (điểm đóng góp 12 tháng).
  useEffect(() => {
    if (!currentUser) {
      setUserProfile((prev) => ({ ...prev, cloudPoints: 0 }));
      return;
    }
    let alive = true;
    pointsApi.me().then((r) => {
      if (alive && r.ok) setUserProfile((prev) => ({ ...prev, cloudPoints: r.data.points12m }));
    });
    return () => {
      alive = false;
    };
  }, [currentUser?.id]);

  const partnerOwnedListings = currentUser?.role === 'partner' ? managedAsListings : [];

  const partnerListing = partnerOwnedListings.find((l: Listing) => l.id === selectedPartnerListingId) || partnerOwnedListings[0] || null;

  // Chủ cơ sở: lưu nháp rồi gửi duyệt. Admin: lưu và công khai ngay. Chỉ báo thành công khi server xác nhận.
  const handleUpdateListingFromPartnerOrAdmin = async (updated: Listing): Promise<boolean> => {
    if (currentUser?.role === 'admin') {
      const before = managedAsListings.find((l) => l.id === updated.id);
      const featuredChanged =
        !before ||
        Boolean(before.isAdminFeatured) !== Boolean(updated.isAdminFeatured) ||
        (before.adminPriorityRank || 0) !== (updated.adminPriorityRank || 0) ||
        (before.adminFeaturedLabel || '') !== (updated.adminFeaturedLabel || '');
      const contentChanged = !before || JSON.stringify(toContent(before)) !== JSON.stringify(toContent(updated));
      try {
        if (featuredChanged) {
          await listingsApi.setFeatured(updated.id, {
            isAdminFeatured: Boolean(updated.isAdminFeatured),
            adminPriorityRank: updated.adminPriorityRank || 0,
            adminFeaturedLabel: updated.adminFeaturedLabel
          });
        }
        if (contentChanged) await listingsApi.adminPublish(updated);
        await Promise.all([reloadListings(), reloadManaged()]);
        return true;
      } catch (e) {
        showToast(e instanceof ApiError ? `Chưa lưu: ${e.message}` : 'Chưa lưu được thay đổi.');
        return false;
      }
    }
    if (currentUser?.role === 'partner') {
      try {
        await listingsApi.saveDraft(updated);
        await listingsApi.submit(updated.id);
        showToast('Đã gửi bản cập nhật. Khách vẫn thấy thông tin cũ cho tới khi ban quản trị duyệt.');
        await reloadManaged();
        return true;
      } catch (e) {
        showToast(e instanceof ApiError ? `Chưa lưu: ${e.message}` : 'Chưa lưu được thay đổi.');
        return false;
      }
    }
    showToast('Bạn cần đăng nhập để sửa thông tin cơ sở.');
    return false;
  };

  const handleAddListingFromAdmin = async (created: Listing) => {
    await runAdmin(() => listingsApi.adminCreate(created), 'Đã tạo và công khai cơ sở mới.');
  };

  const handleDeleteListingFromAdmin = async (listingId: string) => {
    // Không xóa dữ liệu: gỡ khỏi trang công khai (status rejected) và ghi log.
    await runAdmin(() => listingsApi.setStatus(listingId, 'rejected', 'Admin gỡ cơ sở'), 'Đã gỡ cơ sở khỏi trang công khai.');
  };

  // Trạng thái tải danh bạ dùng chung cho các lưới cơ sở.
  const listingsStatusBlock =
    listingsLoad === 'loading' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Đang tải danh sách cơ sở">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    ) : listingsLoad === 'error' ? (
      <ErrorState message="Không tải được danh sách cơ sở. Kiểm tra mạng rồi thử lại." onRetry={() => { setListingsLoad('loading'); void reloadListings(); }} />
    ) : listings.length === 0 ? (
      <EmptyState title="Chưa có cơ sở nào được duyệt" description="Danh bạ đang được cập nhật, vui lòng quay lại sau." />
    ) : null;

  // Admin thấy mọi cơ sở (kể cả chờ duyệt, bị từ chối); người khác thấy danh sách công khai.
  const adminListings = currentUser?.role === 'admin' ? managedAsListings : listings;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-brand-800 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-brand-800 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white/15">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        cloudPoints={userProfile.cloudPoints}
        onOpenSos={() => setIsSosModalOpen(true)}
        onOpenPointsModal={() => setIsPointsModalOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        savedCount={userProfile.savedListings.length}
        onOpenSavedModal={() => setIsWishlistModalOpen(true)}
        bookingsCount={bookings.length}
        onOpenMyTripsModal={() => setIsMyTripsModalOpen(true)}
        lowDataMode={lowDataMode}
        onToggleLowDataMode={() => {
          setLowDataMode((prev) => {
            const next = !prev;
            showToast(
              next
                ? 'Đã BẬT Chế độ Sóng yếu (Tiết kiệm 4G & hiển thị cảnh báo sương mù Đèo Chẹn)'
                : 'Đã TẮT Chế độ Sóng yếu'
            );
            return next;
          });
        }}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Dải Băng Thời Tiết & Đèo Tà Xùa Tinh Gọn (Single Slim Bar on Top) */}
      {siteContent.emergencyBanner?.enabled ? (
        <div
          className={`px-4 py-1.5 text-xs font-bold flex flex-wrap items-center justify-center gap-2 border-b ${
            siteContent.emergencyBanner.severity === 'danger'
              ? 'bg-rose-600 text-white border-rose-700'
              : siteContent.emergencyBanner.severity === 'warning'
              ? 'bg-amber-400 text-slate-950 border-amber-500'
              : 'bg-[#064e3b] text-emerald-100 border-emerald-800'
          }`}
        >
          <span className="font-black uppercase">{siteContent.emergencyBanner.title}:</span>
          <span>{siteContent.emergencyBanner.message}</span>
        </div>
      ) : (
        <div className="bg-[#043328] text-emerald-100 px-3.5 sm:px-6 py-1.5 text-xs font-bold border-b border-emerald-900/60 shadow-2xs">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center flex-wrap">
            <span className="font-black uppercase tracking-wider text-emerald-300">
              CẬP NHẬT THỜI TIẾT & ĐÈO TÀ XÙA HÔM NAY:
            </span>
            <span className="text-emerald-50">
              Đường lên Sống Lưng Khủng Long và Thảo Nguyên thông thoáng, biển mây dày từ 05:30 - 08:30 sáng.
            </span>
          </div>
        </div>
      )}

      {/* Low-Bandwidth & Real-Time Mountain Fog Alert Strip */}
      {lowDataMode && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-extrabold flex flex-wrap items-center justify-center gap-3 border-b border-amber-500">
          <span>
            ⚠️ CẢNH BÁO ĐÈO CHẸN – ĐỈNH GIÓ: Sương mù dày từ 17:30, tầm nhìn &lt; 15m. Đã bật chế độ nén ảnh tiết kiệm 4G & ưu tiên danh bạ Offline.
          </span>
          <button
            type="button"
            onClick={() => setIsSosModalOpen(true)}
            className="bg-slate-950 text-amber-300 px-3 py-1 rounded-full text-xs cursor-pointer"
          >
            Xem SĐT Cứu hộ Offline →
          </button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentTab === 'explore' && (
          <>
            {/* 1. Hero Section + Floating Multi-Mode Search Console */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              onlyCloudView={onlyCloudView}
              setOnlyCloudView={setOnlyCloudView}
              onlyAvailable={onlyAvailable}
              setOnlyAvailable={setOnlyAvailable}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onExploreClick={() => {}}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              siteContent={siteContent}
              heroConsoleMode={heroConsoleMode}
              onChangeHeroConsoleMode={setHeroConsoleMode}
              selectedComboCategory={selectedComboCategory}
              onChangeComboCategory={setSelectedComboCategory}
              stayIntent={{ checkIn: stayCheckIn, checkOut: stayCheckOut, adults: stayAdults }}
              onChangeStayIntent={updateSearchIntent}
              onOpenBusComboModal={(enableBike) =>
                handleOpenBusBookingModal(undefined, Boolean(enableBike))
              }
            />

            {/* 2. KHU VỰC COMBO GỢI Ý & TOUR TREKKING ĐẶC BIỆT DO ADMIN TUYỂN CHỌN */}
            {(() => {
              // R4: gói mẫu (giá, ảnh kho, "Bán chạy nhất") không phải gói thật → chỉ hiện gói do admin tạo.
              const sampleComboIds = new Set(INITIAL_CURATED_COMBOS.map((c) => c.id));
              const allActiveCombos = [...(siteContent.curatedCombos || [])]
                .filter((c) => !sampleComboIds.has(c.id))
                .filter((c) => c.isActive !== false)
                .filter(
                  (c) =>
                    selectedComboCategory === 'all' || c.category === selectedComboCategory
                )
                .sort((a, b) => {
                  if (a.isPinnedFeatured !== b.isPinnedFeatured) {
                    return a.isPinnedFeatured ? -1 : 1;
                  }
                  return (a.priorityOrder || 99) - (b.priorityOrder || 99);
                });

              const isComboModeActive =
                heroConsoleMode === 'combo_trekking' ||
                selectedCategory === 'tour' ||
                showAllCuratedCombos ||
                selectedComboCategory !== 'all';

              const displayedCombos = isComboModeActive
                ? allActiveCombos
                : allActiveCombos.slice(0, 3);

              const handleSelectComboAction = (combo: CuratedComboPackage) => {
                if (combo.actionType === 'open_bus_combo') {
                  handleOpenBusBookingModal(undefined, true);
                  return;
                }
                if (combo.actionType === 'open_ai_advisor') {
                  setIsAiAdvisorOpen(true);
                  return;
                }
                const targetListing =
                  listings.find((l) => l.id === combo.linkedListingId) ||
                  listings.find((l) => l.isAdminFeatured) ||
                  listings[0];
                if (targetListing) {
                  setSelectedListingDetail(targetListing);
                }
              };

              const hasRealCombo = (siteContent.curatedCombos || []).some((c) => !sampleComboIds.has(c.id) && c.isActive !== false);
              if (!hasRealCombo) return null;

              return (
                <section
                  id="curated-combos-section"
                  className={`py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t transition-colors ${
                    heroConsoleMode === 'combo_trekking'
                      ? 'bg-gradient-to-b from-amber-50/60 via-white to-[#f8fafc] border-amber-200/80'
                      : 'bg-white border-slate-200/70'
                  }`}
                >
                  <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-xs font-black uppercase tracking-wider text-amber-950 mb-2">
                          <Package className="w-3.5 h-3.5 text-amber-700" />
                          <span>Gói Đặc Biệt Do Admin Thẩm Định & Quản Lý Trực Tiếp</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-800 tracking-tight">
                          Combo Săn Mây Trọn Gói & Tour Trekking Sống Lưng Khủng Long
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                          Kết hợp sẵn Xe Cabin Đôi, Phòng Kính Đỉnh Gió, Xe máy giao tận nơi và Porter H’Mông dẫn đoàn với mức giá tiết kiệm hơn đặt lẻ từ 90.000đ – 300.000đ.
                        </p>
                      </div>

                      {/* Filter Pills for Curated Combos */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: 'all', label: 'Tất cả gói' },
                          { id: 'combo_2n1d', label: '👑 Combo 2N1Đ' },
                          { id: 'trekking_tour', label: '🥾 Tour Trekking' },
                          { id: 'biker_pack', label: '🔥 Xe Khách + Xe Máy' },
                          { id: 'couple_retreat', label: '💎 Cặp Đôi' },
                          { id: 'group_family', label: '👨‍👩‍👧‍👦 Đoàn Đông' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() =>
                              setSelectedComboCategory(
                                tab.id as 'all' | CuratedComboCategory
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              selectedComboCategory === tab.id
                                ? 'bg-brand-800 text-white border-brand-800 shadow-2xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grid of Curated Combo Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {displayedCombos.map((combo) => {
                        const savedAmount = Math.max(0, combo.originalPrice - combo.comboPrice);
                        return (
                          <article
                            key={combo.id}
                            className={`rounded-3xl overflow-hidden border bg-white flex flex-col justify-between transition-all hover:shadow-xl ${
                              combo.isPinnedFeatured
                                ? 'border-amber-400/90 ring-1 ring-amber-300/40 shadow-md'
                                : 'border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div>
                              {/* Top Image & Priority Badge */}
                              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                                <img
                                  src={combo.imageUrl}
                                  alt={combo.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/25" />

                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs truncate">
                                    {combo.badgeText}
                                  </span>
                                  {savedAmount > 0 && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shrink-0">
                                      Tiết kiệm {Math.round(savedAmount / 1000)}k
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                                  <div className="flex items-center gap-2 text-xs font-bold text-teal-200 mb-1">
                                    <span>⏱️ {combo.duration}</span>
                                    <span>·</span>
                                    <span>📍 {combo.area}</span>
                                  </div>
                                  <h3 className="text-sm sm:text-base font-extrabold leading-snug line-clamp-2">
                                    {combo.title}
                                  </h3>
                                </div>
                              </div>

                              {/* Summary & Included Checklist */}
                              <div className="p-4 sm:p-5 space-y-3">
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                  {combo.summary}
                                </p>

                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
                                  <div className="text-xs font-extrabold uppercase tracking-wider text-brand-800">
                                    Quyền lợi trọn gói đã bao gồm:
                                  </div>
                                  <ul className="space-y-1 text-xs text-slate-700">
                                    {combo.includedItems.map((itemText, idx) => (
                                      <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                        <span>{itemText}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Price & Booking Actions Footer */}
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div>
                                {combo.originalPrice > combo.comboPrice && (
                                  <span className="text-xs text-slate-400 line-through block tabular-nums">
                                    Giá lẻ: {formatVND(combo.originalPrice)}
                                  </span>
                                )}
                                <div className="text-base sm:text-lg font-black text-brand-800 tabular-nums">
                                  {formatVND(combo.comboPrice)}
                                </div>
                                <span className="text-xs text-slate-500 font-semibold block">
                                  / {combo.unit}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setIsAiAdvisorOpen(true)}
                                  className="px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 cursor-pointer"
                                  title="Nhờ AI tùy chỉnh lịch trình theo gói này"
                                >
                                  Tùy chỉnh
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSelectComboAction(combo)}
                                  className="px-4 py-2.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                >
                                  Đặt Gói Combo →
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Toggle View All Combos & Admin Shortcut */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      {allActiveCombos.length > 3 && !isComboModeActive && (
                        <button
                          type="button"
                          onClick={() => setShowAllCuratedCombos(true)}
                          className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-brand-800 font-extrabold text-xs transition-colors cursor-pointer"
                        >
                          Xem toàn bộ {allActiveCombos.length} Gói Combo & Tour Trekking Đặc Biệt →
                        </button>
                      )}
                      {showAllCuratedCombos && (
                        <button
                          type="button"
                          onClick={() => setShowAllCuratedCombos(false)}
                          className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Thu gọn danh sách Combo
                        </button>
                      )}

                      {userRole === 'admin' && (
                        <button
                          type="button"
                          onClick={() => setCurrentTab('admin')}
                          className="ml-auto px-4 py-2 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-950 border border-amber-400 font-extrabold text-xs cursor-pointer"
                        >
                          ⚙️ Admin: Thêm / Sửa / Ghim Gói Combo Đặc Biệt →
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* 3. TRUNG TÂM XE MÁY PHƯỢT ĐÈO TÀ XÙA BIKER (Hiển thị nổi bật khi bấm tab Xe máy trên Hero) */}
            {(heroConsoleMode === 'motorbike' || selectedCategory === 'motorbike') && (() => {
              const motorbikeStations = listings.filter((l) => l.category === 'motorbike');
              return (
                <section
                  id="biker-hub-section"
                  className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50/70 via-white to-[#f8fafc] border-t border-amber-200"
                >
                  <div className="max-w-6xl mx-auto space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
                          <Bike className="w-3.5 h-3.5" />
                          <span>Tà Xùa Biker · Hệ Thống Xe Máy Kiểm Định Phanh Đèo 100%</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-800 tracking-tight">
                          Thuê Xe Máy Phượt Đèo Đỉnh Gió – Sống Lưng – Thảo Nguyên
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                          Giao xe tận sảnh Homestay hoặc nhận ngay khi xuống xe khách lúc 04:30 sáng. Kèm sẵn 2 mũ bảo hiểm kính chắn gió, áo mưa bộ và bảo lãnh cứu hộ đèo 24/7.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenBusBookingModal(undefined, true)}
                          className="px-4 py-2.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          🚌 Đặt Combo Vé Xe + Xe Máy (-30k/xe) →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHeroConsoleMode('stay');
                            setSelectedCategory('all');
                          }}
                          className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs cursor-pointer"
                        >
                          ✕ Đóng khung Biker
                        </button>
                      </div>
                    </div>

                    {/* Trạm xe máy có trong danh bạ (dữ liệu thật) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {motorbikeStations.map((station) => (
                        <ListingCard
                          key={station.id}
                          listing={station}
                          onSelect={(l) => setSelectedListingDetail(l)}
                          isSaved={userProfile.savedListings.includes(station.id)}
                          onToggleSave={handleToggleSave}
                          lowDataMode={lowDataMode}
                          onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* 4. DỮ LIỆU THẬT ĐANG CÔNG KHAI — Danh sách Cơ Sở Đã Thẩm Định (Ưu tiên Admin Featured) */}
            <section
              id="verified-listings-section"
              className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#f8fafc] border-t border-slate-200/70"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                      DỮ LIỆU THẬT ĐANG CÔNG KHAI · ƯU TIÊN ĐỀ XUẤT BỞI ADMIN
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-800 tracking-tight">
                      {selectedCategory === 'tour'
                        ? 'Tour Trekking & Trải Nghiệm Bản Địa Đã Thẩm Định'
                        : selectedCategory === 'motorbike'
                        ? 'Các Trạm Thuê Xe Máy Phượt Đèo Chính Chủ'
                        : selectedCategory === 'coffee' || selectedCategory === 'restaurant'
                        ? 'Tiệm Cà Phê Săn Mây & Ẩm Thực Đỉnh Gió'
                        : 'Homestay & Dịch Vụ Tà Xùa Đã Thẩm Định'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                      Các cơ sở có huy hiệu <strong className="text-amber-700">👑 Admin Đề Xuất</strong> được ban quản trị kiểm chứng chất lượng dịch vụ cao nhất và ưu tiên gợi ý hàng đầu.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {userRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setCurrentTab('admin')}
                        className="px-3.5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer shadow-xs"
                      >
                        👑 Quản lý Ghim Ưu Tiên (Admin) →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentTab('stay')}
                      className="text-sm font-extrabold text-brand-800 hover:text-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Xem toàn bộ Lưu trú ({listings.filter((l) => l.category === 'homestay').length}) →
                    </button>
                  </div>
                </div>

                {/* AI Trip Consultation Banner - Compact, elegant and high-converting */}
                <div className="mb-6 bg-gradient-to-r from-brand-800 via-[#0b4382] to-teal-800 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border border-teal-500/30">
                  <div className="relative z-10 max-w-2xl min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Trợ lý AI Thông Minh</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Tư Vấn Giá Phòng & Lên Lịch Trình Tà Xùa Tự Động
                    </h3>
                    <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                      Nhập <span className="font-bold text-amber-300">Ngày đi · Ngày về · Số người · Điểm đón · Ngân sách</span>. AI gợi ý homestay & xe đón và ước tính chi phí trọn gói để bạn tham khảo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiAdvisorOpen(true)}
                    className="relative z-10 shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Tư vấn chuyến đi ngay</span>
                  </button>
                </div>

                {/* Thanh công cụ 'Gợi ý nhanh' (Quick Suggestions Toolbar - Matching image_164099fa.png layout with zero truncation) */}
                <div
                  id="quick-suggestions-toolbar"
                  aria-label="Thanh công cụ Gợi ý nhanh"
                  className="bg-white border border-slate-200/90 rounded-3xl p-3.5 sm:p-5 mb-6 shadow-2xs"
                >
                  <div className="flex items-start sm:items-center gap-2.5 mb-3 sm:mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-teal-700 shrink-0 mt-0.5 sm:mt-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-brand-800">
                          GỢI Ý NHANH
                        </span>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
                          Tiêu chí Homestay Hot
                        </span>
                        {selectedQuickSuggestions.length > 0 && (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="hidden sm:inline text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
                              Đang lọc: {filteredListings.length} homestay
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedQuickSuggestions([])}
                              aria-label={`Bỏ tất cả ${selectedQuickSuggestions.length} bộ lọc gợi ý nhanh`}
                              className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border border-rose-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              Bỏ lọc ({selectedQuickSuggestions.length})
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                        Chạm để lọc nhanh danh sách homestay bên dưới theo nhu cầu thực tế của bạn
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {QUICK_SUGGESTIONS.map((item) => {
                      const isActive = selectedQuickSuggestions.includes(item.id);
                      const matchCount = listings.filter((l) =>
                        matchesQuickSuggestion(l, item.id)
                      ).length;

                      const getFilterActionDescription = (id: QuickSuggestionId) => {
                        switch (id) {
                          case 'cloud_bedroom':
                            return 'Lọc homestay có view mây phòng ngủ';
                          case 'car_parking':
                            return 'Lọc homestay có chỗ đỗ ô tô';
                          case 'quiet_retreat':
                            return 'Lọc homestay không gian yên tĩnh tuyệt đối';
                          case 'large_group':
                            return 'Lọc homestay phù hợp nhóm đông người';
                        }
                      };

                      const buttonAriaLabel = isActive
                        ? `${getFilterActionDescription(item.id)}: Đang bật, nhấn để bỏ lọc (${matchCount} homestay)`
                        : `${getFilterActionDescription(item.id)} (${matchCount} homestay)`;

                      const renderIcon = (id: QuickSuggestionId) => {
                        switch (id) {
                          case 'cloud_bedroom':
                            return <Eye className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'car_parking':
                            return <Car className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'quiet_retreat':
                            return <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                          case 'large_group':
                            return <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />;
                        }
                      };

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleQuickSuggestion(item.id)}
                          aria-pressed={isActive}
                          aria-label={buttonAriaLabel}
                          className={`group relative flex items-center justify-between gap-2 p-2.5 sm:p-3.5 rounded-2xl border text-left transition-all duration-300 ease-out cursor-pointer transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 ${
                            isActive
                              ? 'bg-brand-800 text-white border-teal-400 shadow-md ring-2 ring-teal-400/50 shadow-[0_0_18px_rgba(20,184,166,0.35)]'
                              : 'bg-white hover:bg-slate-50/80 text-slate-800 border-slate-200/90 hover:border-teal-400 hover:ring-2 hover:ring-teal-400/30 hover:shadow-[0_0_16px_rgba(20,184,166,0.25)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            <div
                              aria-hidden="true"
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                                isActive
                                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs ring-2 ring-white/30'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs group-hover:text-teal-700 group-hover:border-teal-400 group-hover:shadow-[0_0_8px_rgba(20,184,166,0.2)]'
                              }`}
                            >
                              {renderIcon(item.id)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs md:text-sm font-black leading-tight transition-colors duration-300 break-words ${
                                  isActive ? 'text-white' : 'text-brand-800 group-hover:text-teal-700'
                                }`}
                              >
                                {item.label}
                              </div>
                              <div
                                className={`text-xs leading-tight mt-0.5 transition-colors duration-300 line-clamp-2 break-words ${
                                  isActive ? 'text-teal-100 font-medium' : 'text-slate-500 group-hover:text-slate-600'
                                }`}
                              >
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center self-center pl-0.5">
                            {isActive ? (
                              <span
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-black bg-amber-400 text-slate-950 shadow-xs shadow-amber-400/50 ring-1 ring-amber-500/60"
                                aria-label={`Đang áp dụng bộ lọc, ${matchCount} phòng homestay phù hợp`}
                              >
                                {matchCount}
                              </span>
                            ) : (
                              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold bg-white text-slate-700 border border-slate-200/90 shadow-2xs transition-all duration-300 group-hover:border-teal-400 group-hover:text-teal-800 group-hover:shadow-[0_0_6px_rgba(20,184,166,0.2)]">
                                {matchCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Category Filter Segmented Control (11 loại cơ sở, số lượng lấy từ API) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6">
                  {[
                    { id: 'all', label: 'Tất cả cơ sở', count: listings.length },
                    { id: 'homestay', label: 'Lưu trú · Homestay', count: listings.filter((l) => l.category === 'homestay').length },
                    { id: 'coffee', label: 'Cà phê săn mây', count: listings.filter((l) => l.category === 'coffee').length },
                    { id: 'bus', label: 'Nhà xe & Limousine', count: listings.filter((l) => l.category === 'bus').length },
                    { id: 'restaurant', label: 'Ẩm thực bản địa', count: listings.filter((l) => l.category === 'restaurant').length },
                    { id: 'photo', label: 'Photographer', count: listings.filter((l) => l.category === 'photo').length },
                    { id: 'tour', label: 'Tour & Trekking', count: listings.filter((l) => l.category === 'tour').length },
                    { id: 'costume', label: 'Thuê Trang phục', count: listings.filter((l) => l.category === 'costume').length },
                    { id: 'motorbike', label: 'Thuê Xe máy', count: listings.filter((l) => l.category === 'motorbike').length },
                    { id: 'taxi', label: 'Taxi 24/7', count: listings.filter((l) => l.category === 'taxi').length },
                    { id: 'camera', label: 'Thuê Máy ảnh', count: listings.filter((l) => l.category === 'camera').length },
                    { id: 'rescue', label: 'Cứu hộ đèo 24/7', count: listings.filter((l) => l.category === 'rescue').length }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setVisibleExploreCount(12);
                        if (cat.id !== 'all' && cat.id !== 'homestay') {
                          setSelectedQuickSuggestions([]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        selectedCategory === cat.id
                          ? 'bg-brand-800 text-white border-brand-800 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="ml-1.5 opacity-75 tabular-nums">({cat.count})</span>
                    </button>
                  ))}
                </div>

                {listingsStatusBlock ? (
                  listingsStatusBlock
                ) : filteredListings.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-2xs">
                    <h3 className="text-lg font-extrabold text-brand-800 mb-2">
                      Chưa có phòng Cloud View khớp điều kiện lọc hiện tại
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Khi có hồ sơ thẩm định còn hiệu lực, phòng sẽ xuất hiện tại đây. Chúng tôi không tạo điểm hoặc thẻ mẫu giả định.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedArea('all');
                        setOnlyCloudView(false);
                        setOnlyAvailable(false);
                        setSelectedQuickSuggestions([]);
                      }}
                      className="px-6 py-2.5 rounded-full border border-slate-300 hover:border-brand-800 text-xs font-bold text-brand-800 transition-colors cursor-pointer"
                    >
                      Mở toàn bộ danh sách Lưu trú
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredListings.slice(0, visibleExploreCount).map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          onSelect={(l) => setSelectedListingDetail(l)}
                          isSaved={userProfile.savedListings.includes(listing.id)}
                          onToggleSave={handleToggleSave}
                          isCompared={compareIds.includes(listing.id)}
                          onToggleCompare={handleToggleCompare}
                          lowDataMode={lowDataMode}
                          onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                          onClaimListing={(l) => setActiveClaimListing(l)}
                        />
                      ))}
                    </div>

                    {filteredListings.length > visibleExploreCount && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setVisibleExploreCount((prev) => prev + 18)}
                          className="w-full sm:w-auto px-6 py-3 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                        >
                          Xem thêm 18 cơ sở tiếp theo ({Math.min(visibleExploreCount, filteredListings.length)} / {filteredListings.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisibleExploreCount(filteredListings.length)}
                          className="w-full sm:w-auto px-6 py-3 rounded-full border border-teal-300 hover:border-teal-600 bg-teal-50/70 text-teal-900 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                        >
                          Hiển thị toàn bộ {filteredListings.length} cơ sở
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentTab('stay');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto px-6 py-3 rounded-full border border-slate-300 hover:border-brand-800 bg-white text-brand-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                        >
                          Bộ lọc Lưu trú nâng cao →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Owner Claim Registration Banner */}
                <div className="mt-10 sm:mt-12 bg-gradient-to-r from-brand-900 via-[#06366d] to-[#084d5e] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md border border-white/10">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs mb-2.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>DÀNH CHO CHỦ CƠ SỞ DU LỊCH</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Bạn là chủ Homestay, Nhà xe hay Dịch vụ tại Tà Xùa?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">
                      Đăng ký xác nhận quyền sở hữu cơ sở để nhận huy hiệu Cấp 3 chính chủ, trực tiếp cập nhật phòng trống, tiếp nhận hội thoại của du khách và bảo vệ uy tín trước cộng đồng.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const firstListing = listings[0];
                      if (firstListing) setActiveClaimListing(firstListing);
                    }}
                    className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all transform active:scale-95 whitespace-nowrap cursor-pointer shadow-sm shrink-0"
                  >
                    Đăng Ký Xác Nhận Chính Chủ →
                  </button>
                </div>
              </div>
            </section>

            {/* 5. Interactive Map of Homestays & Cloud-Hunting Landmarks */}
            <InteractiveMapSection
              listings={onlyMappable(filteredListings)}
              unmappedCount={filteredListings.length - onlyMappable(filteredListings).length}
              landmarks={landmarks}
              onSelectListing={(l) => setSelectedListingDetail(l)}
            />
          </>
        )}

        {/* Dedicated /stay View — High-Craft OTA Homestay Discovery & Real-Time Availability */}
        {currentTab === 'stay' && (() => {
          const staySecBanner = siteContent.sectionBanners?.find((s) => s.sectionKey === 'stay');
          const allHomestays = listings.filter((l) => l.category === 'homestay');
          const activeFilterCount =
            (selectedArea !== 'all' ? 1 : 0) +
            (staySearchQuery.trim() ? 1 : 0) +
            (stayPriceRange !== 'all' ? 1 : 0) +
            (stayRoomCategory !== 'all' ? 1 : 0) +
            stayAmenities.length +
            (stayViewDirection !== 'all' ? 1 : 0) +
            (stayCarAccess !== 'all' ? 1 : 0) +
            (onlyCloudView ? 1 : 0) +
            (onlyAvailable ? 1 : 0);

          const handleResetAllStayFilters = () => {
            setSelectedArea('all');
            setStaySearchQuery('');
            setStayPriceRange('all');
            setStayRoomCategory('all');
            setStayAmenities([]);
            setOnlyCloudView(false);
            setOnlyAvailable(false);
            setStayViewDirection('all');
            setStayCarAccess('all');
            setStayFilterByAvailableDates(false);
            setStayAdults(2);
            setStayChildren(0);
            setStayRooms(1);
            setVisibleStayCount(12);
          };

          const shortInGlobal = stayCheckIn.slice(5).split('-').reverse().join('/');
          const shortOutGlobal = stayCheckOut.slice(5).split('-').reverse().join('/');

          return (
          <div className="bg-[#f8fafc] pb-20">
            {/* 1. Compact Command Hero + Above-the-Fold Quick Booking Bar */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-[#06366d] to-[#0a6b6e] text-white py-5 sm:py-7 px-4 sm:px-6 lg:px-8 border-b border-white/10">
              {staySecBanner?.isActive && staySecBanner.bannerImageUrl && (
                <img
                  src={staySecBanner.bannerImageUrl}
                  alt={staySecBanner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
                />
              )}
              <div className="relative z-10 max-w-6xl mx-auto space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-400/20 border border-teal-300/40 text-teal-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                        <span>{allHomestays.length} homestay & bungalow · {allHomestays.filter((l) => l.verificationTier >= 2).length} đã xác minh</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-slate-200">
                        <span>Giá và phòng trống theo từng đêm do cơ sở cập nhật</span>
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                      {staySecBanner?.isActive
                        ? staySecBanner.title
                        : 'Homestay & Bungalow Săn Mây Tà Xùa'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-3xl mt-1">
                      {staySecBanner?.isActive
                        ? staySecBanner.subtitle
                        : 'Xem view, tiện nghi (nóng lạnh, đệm sưởi…), đường vào và phòng trống theo từng đêm của từng cơ sở.'}
                    </p>
                  </div>

                  {/* Quick Community & Compare Shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {featureOpen('communityChat') && (
                    <button
                      type="button"
                      onClick={() => handleOpenCommunityPopup('space-5')}
                      className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>🏡 Review Thật (24 Online)</span>
                    </button>
                    )}
                    {featureOpen('communityChat') && (
                    <button
                      type="button"
                      onClick={() => handleOpenCommunityPopup('space-7')}
                      className="px-3 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Săn pass phòng giờ chót</span>
                    </button>
                    )}
                  </div>
                </div>

                {/* Integrated Above-the-Fold Quick Search & Availability Bar */}
                <div className="bg-white text-slate-900 rounded-2xl p-2.5 sm:p-3 shadow-lg border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                  {/* Search by Homestay Name */}
                  <div className="lg:col-span-3 relative">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 px-1">
                      Tìm tên Homestay / Hạng phòng
                    </label>
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={staySearchQuery}
                        onChange={(e) => {
                          setStaySearchQuery(e.target.value);
                          setVisibleStayCount(12);
                        }}
                        placeholder="VD: Mẩy, Lu Trế, Bungalow kính..."
                        className="w-full bg-slate-50 border border-slate-500 rounded-xl pl-8 pr-7 py-2 text-base font-semibold text-slate-800 focus:outline-none focus:border-brand-800"
                      />
                      {staySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStaySearchQuery('')}
                          className="absolute right-2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Check-in Date */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 px-1">
                      Nhận phòng
                    </label>
                    <input
                      type="date"
                      value={stayCheckIn}
                      min={todayInVietnam()}
                      aria-label="Ngày nhận phòng"
                      onChange={(e) => {
                        updateSearchIntent({ checkIn: e.target.value });
                        setStayFilterByAvailableDates(true);
                      }}
                      className="w-full bg-slate-50 border border-slate-500 rounded-xl px-2.5 py-2 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                    />
                  </div>

                  {/* Check-out Date */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between mb-0.5 px-1">
                      <span>Trả phòng</span>
                      <span className="text-teal-700 font-black">{stayNightsCount} đêm</span>
                    </label>
                    <input
                      type="date"
                      value={stayCheckOut}
                      min={stayCheckIn}
                      aria-label="Ngày trả phòng"
                      onChange={(e) => {
                        updateSearchIntent({ checkOut: e.target.value });
                        setStayFilterByAvailableDates(true);
                      }}
                      className="w-full bg-slate-50 border border-slate-500 rounded-xl px-2.5 py-2 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                    />
                  </div>

                  {/* Guests Selector */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 px-1">
                      Số lượng khách
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <select
                        value={stayAdults}
                        onChange={(e) => updateSearchIntent({ adults: Number(e.target.value) })}
                        className="bg-transparent text-base font-bold text-slate-800 focus:outline-none w-full cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((n) => (
                          <option key={n} value={n}>
                            {n} người lớn {stayChildren > 0 ? `+ ${stayChildren} trẻ em` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Area Selector */}
                  <div className="lg:col-span-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 px-1">
                      Tọa độ khu vực
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => {
                        setSelectedArea(e.target.value);
                        setVisibleStayCount(12);
                      }}
                      className="w-full bg-slate-50 border border-slate-500 rounded-xl px-2.5 py-2 text-base font-bold text-slate-800 focus:outline-none focus:border-brand-800 cursor-pointer"
                    >
                      <option value="all">Tất cả khu vực ({allHomestays.length})</option>
                      <option value="Đỉnh Gió">Đỉnh Gió Trung Tâm</option>
                      <option value="Sống Lưng Khủng Long">Sống Lưng Khủng Long</option>
                      <option value="Khe Cải">Bản Khe Cải</option>
                      <option value="Thảo Nguyên">Thảo Nguyên</option>
                      <option value="Mống Vàng">Mống Vàng</option>
                      <option value="Trung Tâm Tà Xùa">Trung Tâm Xã</option>
                    </select>
                  </div>

                  {/* Primary Check CTA */}
                  <div className="lg:col-span-1 flex items-end h-full pt-3 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setStayFilterByAvailableDates(true);
                        showToast(
                          `Tìm thấy ${stayFilteredListings.length} homestay phù hợp (${shortInGlobal} – ${shortOutGlobal})!`
                        );
                      }}
                      className="w-full h-[38px] lg:mt-3.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Lọc ({stayFilteredListings.length})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Visual Area & Cloud-Hunting Vibe Strip (1-Click Quick Chips) */}
            <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
                {/* Row A: Area Quick Pills with Real Counts */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                    Khu vực:
                  </span>
                  {[
                    { id: 'all', label: 'Tất cả Tà Xùa', icon: '🗺️' },
                    { id: 'Đỉnh Gió', label: 'Đỉnh Gió', icon: '☁️' },
                    { id: 'Sống Lưng Khủng Long', label: 'Sống Lưng Khủng Long', icon: '🦖' },
                    { id: 'Khe Cải', label: 'Bản Khe Cải', icon: '🌸' },
                    { id: 'Thảo Nguyên', label: 'Thảo Nguyên', icon: '🌿' },
                    { id: 'Mống Vàng', label: 'Mống Vàng', icon: '⛰️' },
                    { id: 'Trung Tâm Tà Xùa', label: 'Trung Tâm Xã', icon: '🏘️' }
                  ].map((areaItem) => {
                    const count =
                      areaItem.id === 'all'
                        ? allHomestays.length
                        : allHomestays.filter((l) => l.area === areaItem.id).length;
                    const isSelected = selectedArea === areaItem.id;
                    return (
                      <button
                        key={areaItem.id}
                        type="button"
                        onClick={() => {
                          setSelectedArea(areaItem.id);
                          setVisibleStayCount(12);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border inline-flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-brand-800 text-white border-brand-800 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{areaItem.icon}</span>
                        <span>{areaItem.label}</span>
                        <span
                          className={`text-xs px-1.5 py-0.2 rounded-full tabular-nums ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Row B: 1-Tap Mountain Vibe & Comfort Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wider shrink-0 mr-1">
                    Chọn nhanh:
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnlyCloudView((p) => !p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      onlyCloudView
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ☁️ Săn mây tại giường
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStayRoomCategory((prev) => (prev === 'bungalow' ? 'all' : 'bungalow'))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      stayRoomCategory === 'bungalow'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🪟 Bungalow kính & Glamping
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStayAmenity('heating')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      stayAmenities.includes('heating')
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ♨️ Đệm sưởi / Điều hòa ấm
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStayCarAccess((prev) => (prev === 'yes' ? 'all' : 'yes'))
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      stayCarAccess === 'yes'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🚗 Ô tô vào tận nơi
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setStayPriceRange((prev) =>
                        prev === 'under_600k' ? 'all' : 'under_600k'
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      stayPriceRange === 'under_600k'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    💰 Tiết kiệm &lt; 600k/đêm
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStayAmenity('bbq')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors shrink-0 ${
                      stayAmenities.includes('bbq')
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white hover:bg-teal-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔥 Sân nướng BBQ / Lửa trại
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Main 2-Column Layout: Sticky Left Filter Sidebar + Right Results & Views */}
            <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Sidebar: Sticky Real-Data Filters */}
                <aside
                  id="stay-filter-sidebar"
                  className="lg:col-span-4 lg:sticky lg:top-20 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 max-h-none lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-extrabold text-brand-800 text-sm sm:text-base">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block leading-tight">Bộ lọc chuyên sâu</span>
                        <span className="block text-xs font-medium text-slate-500">
                          Khớp đúng phòng trống & tiện nghi
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/60 tabular-nums">
                        {stayFilteredListings.length} căn
                      </span>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetAllStayFilters}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                        >
                          Đặt lại
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Collapse Toggle */}
                  <div className="lg:hidden flex items-center justify-between gap-2 bg-teal-50/70 border border-teal-200/80 rounded-xl p-2">
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterCollapsed(!isMobileFilterCollapsed)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-brand-800 cursor-pointer"
                    >
                      {isMobileFilterCollapsed ? 'Mở bộ lọc chi tiết ↓' : 'Thu gọn bộ lọc ↑'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById('stay-results-list')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-full bg-brand-800 text-white text-xs font-bold text-center cursor-pointer"
                    >
                      Xem {stayFilteredListings.length} căn trống →
                    </button>
                  </div>

                  <div className={`${isMobileFilterCollapsed ? 'hidden lg:block' : 'block'} space-y-4`}>
                    {/* Filter Group 1: Khoảng giá / đêm */}
                    <fieldset className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-3.5 pt-2.5">
                      <legend className="px-1.5 text-xs font-extrabold text-brand-800">
                        💰 Ngân sách / đêm
                      </legend>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {[
                          { id: 'all', label: 'Tất cả mức giá' },
                          { id: 'under_600k', label: 'Dưới 600.000đ' },
                          { id: '600k_1m', label: '600k – 1.000.000đ' },
                          { id: 'over_1m', label: 'Trên 1.000.000đ' }
                        ].map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => {
                              setStayPriceRange(pr.id as any);
                              setVisibleStayCount(12);
                            }}
                            className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left border transition-colors cursor-pointer ${
                              stayPriceRange === pr.id
                                ? 'bg-brand-800 text-white border-brand-800'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {pr.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    {/* Filter Group 2: Loại hình phòng */}
                    <fieldset className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-3.5 pt-2.5">
                      <legend className="px-1.5 text-xs font-extrabold text-brand-800">
                        🏡 Loại hình phòng ở
                      </legend>
                      <div className="space-y-1.5 pt-1">
                        {[
                          { id: 'all', label: 'Tất cả hạng phòng' },
                          { id: 'bungalow', label: '🪟 Bungalow kính săn mây / Glamping' },
                          { id: 'double', label: '🛏️ Phòng đôi riêng tư (2–3 khách)' },
                          { id: 'family', label: '👨‍👩‍👧‍👦 Phòng Gia đình / Nhóm 4–6 khách' },
                          { id: 'dorm', label: '🏕️ Nhà sàn H\'Mông / Tập thể (Dorm)' }
                        ].map((rc) => (
                          <button
                            key={rc.id}
                            type="button"
                            onClick={() => {
                              setStayRoomCategory(rc.id as any);
                              setVisibleStayCount(12);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left border transition-colors cursor-pointer flex items-center justify-between ${
                              stayRoomCategory === rc.id
                                ? 'bg-teal-50 text-teal-950 border-teal-500 font-extrabold'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                            }`}
                          >
                            <span>{rc.label}</span>
                            {stayRoomCategory === rc.id && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    {/* Filter Group 3: Tiện nghi sống còn vùng cao Tà Xùa */}
                    <fieldset className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-3.5 pt-2.5">
                      <legend className="px-1.5 text-xs font-extrabold text-brand-800">
                        ♨️ Tiện nghi sưởi ấm & săn mây
                      </legend>
                      <div className="space-y-2 pt-1">
                        {[
                          { key: 'heating', label: 'Đệm sưởi / Máy sưởi / Điều hòa ấm' },
                          { key: 'hot_water', label: 'Bình nóng lạnh & WC khép kín' },
                          { key: 'bathtub', label: 'Bồn tắm / Ban công kính ngắm mây' },
                          { key: 'bbq', label: 'Sân nướng BBQ / Lẩu gà đen / Lửa trại' }
                        ].map((am) => {
                          const checked = stayAmenities.includes(am.key);
                          return (
                            <label
                              key={am.key}
                              className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:border-teal-300"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleStayAmenity(am.key)}
                                className="rounded border-slate-300 text-brand-800 shrink-0"
                              />
                              <span>{am.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* Filter Group 4: Lịch trống & Chọn nhanh cuối tuần */}
                    <fieldset className="bg-[#f8fafc] border border-teal-200/90 rounded-2xl p-3.5 pt-2.5">
                      <legend className="px-1.5 text-xs font-extrabold text-brand-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-700" />
                        <span>Lịch trống & Cuối tuần</span>
                      </legend>
                      <div className="space-y-2.5 pt-1">
                        <label className="flex items-center justify-between gap-2 bg-white border border-teal-100 rounded-xl px-3 py-2 cursor-pointer">
                          <span className="text-xs font-semibold text-slate-700">
                            Chỉ hiện căn còn phòng trống
                          </span>
                          <input
                            type="checkbox"
                            checked={stayFilterByAvailableDates}
                            onChange={(e) => setStayFilterByAvailableDates(e.target.checked)}
                            className="rounded border-slate-300 text-brand-800 cursor-pointer"
                          />
                        </label>

                        <div className="flex flex-wrap gap-1.5">
                          {quickDatePresets().map((preset) => {
                            const isSelectedPreset =
                              stayFilterByAvailableDates &&
                              stayCheckIn === preset.inDate &&
                              stayCheckOut === preset.outDate;
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => {
                                  updateSearchIntent({ checkIn: preset.inDate, checkOut: preset.outDate });
                                  setStayFilterByAvailableDates(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                                  isSelectedPreset
                                    ? 'bg-brand-800 text-white border-brand-800'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </fieldset>

                    {/* Filter Group 5: View nhìn & Đường ô tô */}
                    <fieldset className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-3.5 pt-2.5 space-y-2.5">
                      <legend className="px-1.5 text-xs font-extrabold text-brand-800">
                        🏔️ Hướng nhìn & Đường vào
                      </legend>
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Hướng nhìn từ phòng
                        </label>
                        <select
                          value={stayViewDirection}
                          onChange={(e) => setStayViewDirection(e.target.value)}
                          className="w-full border border-slate-500 rounded-xl px-3 py-2 text-base font-semibold text-slate-800 bg-white"
                        >
                          <option value="all">Tất cả hướng nhìn</option>
                          <option value="mountain">Trực diện biển mây & Đỉnh núi</option>
                          <option value="valley">Thung lũng & Bản làng</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Phương tiện tiếp cận tận nơi
                        </label>
                        <select
                          value={stayCarAccess}
                          onChange={(e) => setStayCarAccess(e.target.value)}
                          className="w-full border border-slate-500 rounded-xl px-3 py-2 text-base font-semibold text-slate-800 bg-white"
                        >
                          <option value="all">Mọi phương tiện</option>
                          <option value="yes">Ô tô 16 chỗ / Limousine vào tận sân</option>
                          <option value="motorbike">Đường nhánh ưu tiên xe máy</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">
                            Người lớn
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={stayAdults}
                            onChange={(e) => updateSearchIntent({ adults: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-500 rounded-xl px-2.5 py-1.5 text-base font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">
                            Trẻ em
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={stayChildren}
                            onChange={(e) => updateSearchIntent({ children: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-500 rounded-xl px-2.5 py-1.5 text-base font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">
                            Số phòng
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={stayRooms}
                            onChange={(e) => updateSearchIntent({ rooms: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-500 rounded-xl px-2.5 py-1.5 text-base font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </fieldset>

                    <button
                      type="button"
                      onClick={handleResetAllStayFilters}
                      className="w-full text-xs font-bold text-slate-500 hover:text-brand-800 py-2 cursor-pointer flex items-center justify-center gap-1.5 transition-colors border border-slate-200 rounded-xl bg-slate-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa toàn bộ bộ lọc</span>
                    </button>
                  </div>
                </aside>

                {/* Right Column: Smart Results Control Bar + Active Chips + Grid/List/Map Views */}
                <div id="stay-results-list" className="lg:col-span-8 space-y-5">
                  {/* Smart Results Control Bar (Count + Sort + 3 View Modes) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-black text-brand-800 tabular-nums">
                            {stayFilteredListings.length} Homestay phù hợp
                          </span>
                          {stayFilterByAvailableDates && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Còn phòng {shortInGlobal} → {shortOutGlobal} ({stayNightsCount} đêm)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Đáp ứng cho <strong>{stayAdults} người lớn{stayChildren > 0 ? `, ${stayChildren} trẻ em` : ''}</strong> · Bấm nút <strong>⚖️ So sánh</strong> trên thẻ để đối chiếu tối đa 3 homestay.
                        </p>
                      </div>

                      {/* Sort & View Switcher */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <select
                          aria-label="Sắp xếp danh sách homestay"
                          value={staySortBy}
                          onChange={(e) => setStaySortBy(e.target.value as any)}
                          className="bg-slate-50 border border-slate-500 rounded-xl px-3 py-2 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800 cursor-pointer"
                        >
                          <option value="recommended">⭐ Đề xuất & Cấp 3</option>
                          <option value="price_asc">💰 Giá: Thấp đến Cao</option>
                          <option value="price_desc">💎 Giá: Cao đến Thấp</option>
                          <option value="rating">🏆 Đánh giá cao nhất</option>
                          <option value="most_rooms">🛏️ Nhiều phòng trống nhất</option>
                        </select>

                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setStayViewMode('grid')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                              stayViewMode === 'grid'
                                ? 'bg-white text-brand-800 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Xem dạng Lưới 2 cột"
                          >
                            ⊞ Lưới
                          </button>
                          <button
                            type="button"
                            onClick={() => setStayViewMode('list')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                              stayViewMode === 'list'
                                ? 'bg-white text-brand-800 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Xem dạng Danh sách ngang chi tiết từng hạng phòng (Booking style)"
                          >
                            ☰ Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => setStayViewMode('map')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                              stayViewMode === 'map'
                                ? 'bg-white text-brand-800 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Xem kèm Bản đồ tọa độ săn mây"
                          >
                            🗺️ Bản đồ
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active Filter Chips Bar */}
                    {activeFilterCount > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-500 mr-1">
                          Đang lọc:
                        </span>
                        {selectedArea !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setSelectedArea('all')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>📍 {selectedArea}</span>
                            <span>✕</span>
                          </button>
                        )}
                        {stayPriceRange !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setStayPriceRange('all')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>
                              💰{' '}
                              {stayPriceRange === 'under_600k'
                                ? '< 600k'
                                : stayPriceRange === '600k_1m'
                                ? '600k – 1tr'
                                : '> 1tr'}
                            </span>
                            <span>✕</span>
                          </button>
                        )}
                        {stayRoomCategory !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setStayRoomCategory('all')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>🏡 {stayRoomCategory}</span>
                            <span>✕</span>
                          </button>
                        )}
                        {onlyCloudView && (
                          <button
                            type="button"
                            onClick={() => setOnlyCloudView(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>☁️ Săn mây tại giường</span>
                            <span>✕</span>
                          </button>
                        )}
                        {stayCarAccess !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setStayCarAccess('all')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>🚗 Ô tô tận nơi</span>
                            <span>✕</span>
                          </button>
                        )}
                        {stayAmenities.map((am) => (
                          <button
                            key={am}
                            type="button"
                            onClick={() => handleToggleStayAmenity(am)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer"
                          >
                            <span>✓ {am}</span>
                            <span>✕</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Map Split-View when stayViewMode === 'map' */}
                  {stayViewMode === 'map' && (
                    <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                      <InteractiveMapSection
                        listings={onlyMappable(stayFilteredListings)}
                        unmappedCount={stayFilteredListings.length - onlyMappable(stayFilteredListings).length}
                        landmarks={landmarks}
                        onSelectListing={(l) => setSelectedListingDetail(l)}
                      />
                    </div>
                  )}

                  {/* Verified Homestays List Filtered by Date Range & Criteria */}
                  {listingsStatusBlock ? (
                    listingsStatusBlock
                  ) : stayFilteredListings.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                      <h3 className="text-lg font-extrabold text-brand-800">
                        Chưa có homestay khớp toàn bộ điều kiện lọc hiện tại
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                        Hãy thử nới rộng khoảng giá, bỏ bớt bộ lọc tiện nghi hoặc xem các phòng đang được nhượng lại giờ chót trong Cộng Đồng.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleResetAllStayFilters}
                          className="px-5 py-2.5 rounded-full bg-brand-800 text-white text-xs font-bold cursor-pointer"
                        >
                          Khôi phục toàn bộ {allHomestays.length} Homestay
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCommunityPopup('space-7')}
                          className="px-5 py-2.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold cursor-pointer"
                        >
                          🔥 Tìm phòng Pass lại giờ chót
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={
                          stayViewMode === 'list'
                            ? 'space-y-4'
                            : 'grid grid-cols-1 md:grid-cols-2 gap-5'
                        }
                      >
                        {stayFilteredListings.slice(0, visibleStayCount).map((listing) => {
                          const dateCheck = isHomestayAvailableInDateRange(listing, stayCheckIn, stayCheckOut, []);
                          return (
                            <ListingCard
                              key={listing.id}
                              listing={listing}
                              onSelect={(l) => setSelectedListingDetail(l)}
                              isSaved={userProfile.savedListings.includes(listing.id)}
                              onToggleSave={handleToggleSave}
                              isCompared={compareIds.includes(listing.id)}
                              onToggleCompare={handleToggleCompare}
                              lowDataMode={lowDataMode}
                              onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                              onClaimListing={(l) => setActiveClaimListing(l)}
                              layoutMode={stayViewMode === 'list' ? 'horizontal' : 'grid'}
                              stayAvailabilityBadge={
                                stayFilterByAvailableDates && listing.roomTypes && listing.roomTypes.length > 0
                                  ? {
                                      availableRoomsCount: dateCheck.availableRoomsCount,
                                      dateLabel: `${shortInGlobal} – ${shortOutGlobal}`,
                                      nightsCount: stayNightsCount
                                    }
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>

                      {/* Smart Pagination Controls */}
                      {stayFilteredListings.length > visibleStayCount && (
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setVisibleStayCount((prev) => prev + 12)}
                            className="w-full sm:w-auto px-6 py-3 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                          >
                            Xem thêm 12 homestay tiếp theo ({Math.min(visibleStayCount, stayFilteredListings.length)} / {stayFilteredListings.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibleStayCount(stayFilteredListings.length)}
                            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-brand-800 border border-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                          >
                            Hiển thị toàn bộ {stayFilteredListings.length} homestay
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Quick Curated Collections at Bottom */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mt-6">
                    <h2 className="text-base sm:text-lg font-extrabold text-brand-800 mb-3">
                      Bộ sưu tập lưu trú Tà Xùa được tìm nhiều nhất
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          label: '☁️ Bungalow kính săn mây tại giường (Đỉnh Gió) →',
                          action: () => {
                            setSelectedArea('Đỉnh Gió');
                            setOnlyCloudView(true);
                            setStayRoomCategory('bungalow');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        },
                        {
                          label: '🦖 Homestay gần Sống Lưng Khủng Long đón bình minh →',
                          action: () => {
                            setSelectedArea('Sống Lưng Khủng Long');
                            setOnlyCloudView(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        },
                        {
                          label: '🚗 Homestay có đường ô tô 16 chỗ / Limousine vào tận sân →',
                          action: () => {
                            setSelectedArea('all');
                            setStayCarAccess('yes');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        },
                        {
                          label: '🌸 Khu nghỉ yên tĩnh tại Bản Khe Cải & Thảo Nguyên →',
                          action: () => {
                            setSelectedArea('Khe Cải');
                            setOnlyCloudView(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={item.action}
                          className="text-left p-3 rounded-xl border border-slate-200 hover:border-brand-800 hover:bg-slate-50 text-xs font-bold text-brand-800 transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* R1: trang pháp lý */}
        {(currentTab === 'terms' || currentTab === 'privacy') && <LegalPage kind={currentTab} />}

        {/* Dedicated /verified View */}
        {currentTab === 'verified' && (
          <VerificationMethodologySection
            listings={listings}
            onSelectListing={(listing) => setSelectedListingDetail(listing)}
            onOpenDispute={() => setIsMyTripsModalOpen(true)}
            onOpenPartnerClaim={(listing) => {
              if (listing) {
                setActiveClaimListing(listing);
              } else if (listings.length > 0) {
                setActiveClaimListing(listings[0]);
              }
            }}
            onNavigateToStays={(_tier) => {
              setCurrentTab('stays');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            siteContent={siteContent}
          />
        )}

        {currentTab === 'map' && (
          <InteractiveMapSection
            listings={onlyMappable(listings)}
            unmappedCount={listings.length - onlyMappable(listings).length}
            landmarks={landmarks}
            onSelectListing={(l) => setSelectedListingDetail(l)}
          />
        )}

        {currentTab === 'weather' && !featureOpen('cloudForecast') && (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <ComingSoon
              feature="cloudForecast"
              actions={[
                { label: 'Xem bản đồ điểm săn mây', onClick: () => setCurrentTab('map') },
                { label: 'Tìm chỗ ở', onClick: () => setCurrentTab('stay') },
              ]}
            />
          </div>
        )}
        {currentTab === 'weather' && featureOpen('cloudForecast') && (
          <CloudForecastWidget
            forecasts={forecasts}
            listings={listings}
            onSelectListing={(l) => setSelectedListingDetail(l)}
            onOpenMap={() => {
              setCurrentTab('map');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCommunityCloudFeed={() => handleOpenCommunityPopup('space-4')}
          />
        )}

        {/* TAB DI CHUYỂN: Xe Khách - Taxi - Thuê Xe Máy */}
        {(currentTab === 'transport' || currentTab === 'bus') && (() => {
          const transportSecBanner = siteContent.sectionBanners?.find((s) => s.sectionKey === 'transport');

          const matchesTransportTimeSlot = (text: string, depTime?: string) => {
            if (transportTimeSlot === 'all') return true;
            const norm = text.toLowerCase();
            if (depTime) {
              const hr = parseInt(depTime.split(':')[0] || '0', 10);
              if (transportTimeSlot === 'morning') return hr >= 5 && hr <= 10;
              if (transportTimeSlot === 'afternoon') return hr >= 11 && hr <= 17;
              if (transportTimeSlot === 'night') return hr >= 19 || hr <= 3;
            }
            if (transportTimeSlot === 'morning') {
              return norm.includes('chuyến sáng') || norm.includes('06:') || norm.includes('07:') || norm.includes('04:30');
            }
            if (transportTimeSlot === 'afternoon') {
              return norm.includes('chuyến chiều') || norm.includes('13:') || norm.includes('14:');
            }
            if (transportTimeSlot === 'night') {
              return norm.includes('chuyến đêm') || norm.includes('21:') || norm.includes('22:');
            }
            return true;
          };

          const matchesTransportPickup = (text: string) => {
            if (transportPickupZone === 'all') return true;
            const norm = text.toLowerCase();
            if (transportPickupZone === 'my_dinh_cau_giay') {
              return norm.includes('mỹ đình') || norm.includes('cầu giấy') || norm.includes('nhổn') || norm.includes('hòa lạc');
            }
            if (transportPickupZone === 'yen_nghia_bigc') {
              return norm.includes('yên nghĩa') || norm.includes('bigc') || norm.includes('royal city') || norm.includes('thăng long');
            }
            if (transportPickupZone === 'noi_bai') {
              return norm.includes('nội bài') || norm.includes('sân bay');
            }
            if (transportPickupZone === 'bac_ninh_viet_tri') {
              return norm.includes('bắc ninh') || norm.includes('bắc giang') || norm.includes('việt trì') || norm.includes('phú thọ') || norm.includes('trung hà');
            }
            if (transportPickupZone === 'door_to_door') {
              return norm.includes('tận nơi') || norm.includes('tận nhà') || norm.includes('tận homestay') || norm.includes('xe ghép');
            }
            return true;
          };

          const matchesTransportVehicle = (text: string) => {
            if (transportVehicleType === 'all') return true;
            const norm = text.toLowerCase();
            if (transportVehicleType === 'cabin_vip') return norm.includes('cabin');
            if (transportVehicleType === 'limousine') return norm.includes('limousine') || norm.includes('9 chỗ') || norm.includes('11 chỗ');
            if (transportVehicleType === 'sleeper_bus') return norm.includes('giường nằm') || norm.includes('2 tầng') || norm.includes('thaco');
            if (transportVehicleType === 'shared_car') return norm.includes('xe ghép') || norm.includes('4 chỗ') || norm.includes('7 chỗ') || norm.includes('bán tải');
            return true;
          };

          const filteredTrips = trips.filter((trip) => {
            const combined = `${trip.operatorName} ${trip.busType} ${trip.route} ${trip.stops.map((s) => s.name).join(' ')} ${(trip.amenities || []).join(' ')}`;
            if (transportSearchQuery.trim() && !combined.toLowerCase().includes(transportSearchQuery.trim().toLowerCase())) {
              return false;
            }
            if (!matchesTransportTimeSlot(combined, trip.departureTime)) return false;
            if (!matchesTransportPickup(combined)) return false;
            if (!matchesTransportVehicle(combined)) return false;
            return true;
          });

          const filteredTransportListings = listings
            .filter((l) => {
              if (transportSubCategory === 'all') {
                if (!['bus', 'taxi', 'motorbike'].includes(l.category)) return false;
              } else if (l.category !== transportSubCategory) {
                return false;
              }
              const combined = `${l.title} ${l.priceNote || ''} ${l.description || ''} ${(l.tags || []).join(' ')} ${l.area} ${l.address}`;
              if (transportSearchQuery.trim() && !combined.toLowerCase().includes(transportSearchQuery.trim().toLowerCase())) {
                return false;
              }
              if (transportOnlyBikeCombo) {
                const hasCombo =
                  Boolean(l.motorbikeFleet?.enabled) ||
                  combined.toLowerCase().includes('combo') ||
                  combined.toLowerCase().includes('xe máy');
                if (!hasCombo) return false;
              }
              if (!matchesTransportTimeSlot(combined)) return false;
              if (!matchesTransportPickup(combined)) return false;
              if (!matchesTransportVehicle(combined)) return false;
              return true;
            })
            .sort((a, b) => {
              if (transportSortBy === 'price_asc') return a.minPrice - b.minPrice;
              if (transportSortBy === 'price_desc') return b.minPrice - a.minPrice;
              if (transportSortBy === 'rating') return b.rating - a.rating || b.reviewCount - a.reviewCount;
              return (b.verificationTier || 0) - (a.verificationTier || 0) || b.rating - a.rating;
            });

          const hasActiveTransportFilters =
            transportSearchQuery.trim() !== '' ||
            transportTimeSlot !== 'all' ||
            transportPickupZone !== 'all' ||
            transportVehicleType !== 'all' ||
            transportOnlyBikeCombo;

          const handleResetTransportFilters = () => {
            setTransportSearchQuery('');
            setTransportTimeSlot('all');
            setTransportPickupZone('all');
            setTransportVehicleType('all');
            setTransportOnlyBikeCombo(false);
            setTransportSortBy('recommended');
          };

          const handleOpenSeatMapForListing = (listingItem: Listing) => {
            const titleLower = listingItem.title.toLowerCase();
            let matchedTripId = trips[0]?.id;
            if (titleLower.includes('hiền hựu')) matchedTripId = 'bus-04';
            else if (titleLower.includes('thành mỹ')) matchedTripId = 'bus-05';
            else if (titleLower.includes('quang nghĩa') || titleLower.includes('tuấn thủy')) matchedTripId = 'bus-06';
            else if (titleLower.includes('khánh thịnh')) matchedTripId = 'bus-01';
            else if ((listingItem.priceNote || '').toLowerCase().includes('cabin')) matchedTripId = 'bus-02';
            handleOpenBusBookingModal(matchedTripId, false);
          };

          // Demo Combo Calculator values (Rule: return before 12:00 noon = 0.5 day)
          const singleTicketDemo = 350000;
          const busTotalDemo = singleTicketDemo * calcPassengers * 2; // khứ hồi
          const bikeDaysMultiplier = calcReturnBeforeNoon ? 1.5 : 2;
          const bikeRawCost = calcBikes * 150000 * bikeDaysMultiplier;
          const comboDiscountDemo = calcBikes * 30000 + (calcReturnBeforeNoon ? calcBikes * 60000 : 0);
          const finalComboDemo = busTotalDemo + bikeRawCost - calcBikes * 30000;

          return (
          <div className="bg-[#f8fafc] pb-14">
            {/* 1. COMPACT TRANSPORT COMMAND HERO + QUICK ROUTE & SCHEDULE FILTER BAR */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-[#06366d] to-[#0a6b6e] text-white pt-7 pb-8 px-4 sm:px-6 lg:px-8">
              {transportSecBanner?.isActive && transportSecBanner.bannerImageUrl && (
                <img
                  src={transportSecBanner.bannerImageUrl}
                  alt={transportSecBanner.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />
              )}
              <div className="max-w-7xl mx-auto relative z-10 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-extrabold uppercase tracking-wider text-teal-200 mb-2.5">
                      <Bus className="w-3.5 h-3.5 text-teal-300" />
                      <span>
                        {transportSecBanner?.isActive
                          ? transportSecBanner.badgeText
                          : 'ĐẶT GHẾ TRỰC TUYẾN & COMBO THUÊ XE MÁY CHÍNH CHỦ'}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                      {transportSecBanner?.isActive
                        ? transportSecBanner.title
                        : 'Di Chuyển Lên Tà Xùa An Toàn & Chủ Động'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-1.5 leading-relaxed">
                      {transportSecBanner?.isActive
                        ? transportSecBanner.subtitle
                        : 'Sơ đồ giường nằm 2 tầng, Cabin Đôi VIP, Limousine 9–11 chỗ kèm thuê xe máy nhận ngay tại bản (trả trước 12h trưa chỉ tính 0.5 ngày, giảm thêm 30.000đ/xe).'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {featureOpen('communityChat') && (
                    <button
                      type="button"
                      onClick={() => handleOpenCommunityPopup('space-2')}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-300/35 font-bold px-3.5 py-2.5 rounded-full text-xs transition-all cursor-pointer flex items-center gap-2 backdrop-blur-md"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>💬 Nhóm Ghép Xe & Đi Chung (38 Online)</span>
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => (featureOpen('busBooking') ? setShowTransportComboCalc((prev) => !prev) : setLockedFeatureModal('busBooking'))}
                      className={`font-extrabold px-3.5 py-2.5 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 border ${
                        showTransportComboCalc
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>Tính Combo Xe + Xe Máy (12h=0.5 ngày)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBusBookingModal(trips[0]?.id, false)}
                      className="bg-white hover:bg-teal-50 text-brand-800 font-black px-4 py-2.5 rounded-full text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Bus className="w-4 h-4 text-teal-700" />
                      <span>Mở Sơ Đồ Ghế 2 Tầng</span>
                    </button>
                  </div>
                </div>

                {/* QUICK ROUTE, PICKUP & SCHEDULE SEARCH BAR (Vexere / Traveloka Standard) */}
                <div className="bg-white text-slate-900 rounded-2xl p-3 sm:p-4 shadow-xl border border-white/40">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
                    {/* 1. Search by Bus Operator / Route / Phone */}
                    <div className="lg:col-span-3 relative">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Tìm nhà xe / Tuyến / SĐT
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={transportSearchQuery}
                          onChange={(e) => setTransportSearchQuery(e.target.value)}
                          placeholder="VD: Thành Mỹ, Hiền Hựu, Nội Bài..."
                          className="w-full pl-9 pr-7 py-2 rounded-xl border border-slate-500 bg-slate-50 focus:bg-white text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                        />
                        {transportSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setTransportSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Pickup Point in Hanoi / Nearby Provinces */}
                    <div className="lg:col-span-3">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Điểm đón khách xuất phát
                      </label>
                      <select
                        value={transportPickupZone}
                        onChange={(e) => setTransportPickupZone(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                      >
                        <option value="all">📍 Tất cả điểm đón (Hà Nội · Bắc Yên · Tỉnh)</option>
                        <option value="my_dinh_cau_giay">🚌 Bến xe Mỹ Đình · Cầu Giấy · Hòa Lạc</option>
                        <option value="yen_nghia_bigc">🏢 Bến xe Yên Nghĩa · BigC · Royal City</option>
                        <option value="noi_bai">✈️ Sân bay Nội Bài (Sảnh E)</option>
                        <option value="bac_ninh_viet_tri">🛣️ Bắc Ninh · Bắc Giang · Việt Trì · Phú Thọ</option>
                        <option value="door_to_door">🏠 Đón trả tận nhà & Tận cửa Homestay</option>
                      </select>
                    </div>

                    {/* 3. Departure Time Slot */}
                    <div className="lg:col-span-3">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Khung giờ khởi hành
                      </label>
                      <select
                        value={transportTimeSlot}
                        onChange={(e) => setTransportTimeSlot(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                      >
                        <option value="all">🕒 Mọi khung giờ (Sáng · Chiều · Đêm)</option>
                        <option value="morning">🌅 Chuyến Sáng (06:00 – 08:30 · Check-in trưa)</option>
                        <option value="afternoon">☀️ Chuyến Chiều (13:00 – 15:00 · Ngắm hoàng hôn)</option>
                        <option value="night">🌙 Chuyến Đêm (21:30 – 22:30 · Ngủ đón bình minh)</option>
                      </select>
                    </div>

                    {/* 4. Vehicle Type */}
                    <div className="lg:col-span-3">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Dòng xe & Sắp xếp
                      </label>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={transportVehicleType}
                          onChange={(e) => setTransportVehicleType(e.target.value as any)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                        >
                          <option value="all">🚐 Mọi dòng xe</option>
                          <option value="cabin_vip">🛏️ Cabin Đôi VIP</option>
                          <option value="limousine">💺 Limousine 9–11 ghế</option>
                          <option value="sleeper_bus">🚌 Giường nằm 2 tầng</option>
                          <option value="shared_car">🚗 Xe ghép / SUV 7 chỗ</option>
                        </select>
                        <select
                          value={transportSortBy}
                          onChange={(e) => setTransportSortBy(e.target.value as any)}
                          aria-label="Sắp xếp phương tiện"
                          className="px-2.5 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800 shrink-0"
                        >
                          <option value="recommended">★ Đề xuất</option>
                          <option value="price_asc">Giá ↑</option>
                          <option value="price_desc">Giá ↓</option>
                          <option value="rating">Đánh giá cao</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-7">
              {/* Interactive Motorbike Combo 12h Rule Calculator Drawer */}
              {showTransportComboCalc && featureOpen('busBooking') && (
                <div className="bg-gradient-to-r from-amber-50 via-white to-teal-50 border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 shadow-sm animate-fade-in">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 text-xs font-black uppercase tracking-wider">
                        <span>⚡ Độc quyền Tà Xùa Trip · Quy tắc 12h trưa = 0.5 ngày</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-brand-800">
                        Công Cụ Ước Tính Nhanh Combo Vé Xe Khách Khứ Hồi + Thuê Xe Máy Tại Bản
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Thay vì bị tính tròn 2 ngày (300.000đ) khi nhận xe sáng hôm trước và trả trưa hôm sau như nơi khác, hệ thống áp dụng <strong>trả xe trước 12:00 trưa chỉ tính 0.5 ngày (90.000đ)</strong> và <strong>giảm thêm 30.000đ/xe</strong> khi đặt kèm vé xe khách.
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-600">Số khách:</span>
                          <button
                            type="button"
                            onClick={() => setCalcPassengers((p) => Math.max(1, p - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 font-black text-brand-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black text-brand-800 tabular-nums w-4 text-center">{calcPassengers}</span>
                          <button
                            type="button"
                            onClick={() => setCalcPassengers((p) => Math.min(10, p + 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 font-black text-brand-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-600">Số xe máy:</span>
                          <button
                            type="button"
                            onClick={() => setCalcBikes((b) => Math.max(1, b - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 font-black text-brand-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-black text-brand-800 tabular-nums w-4 text-center">{calcBikes}</span>
                          <button
                            type="button"
                            onClick={() => setCalcBikes((b) => Math.min(6, b + 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 font-black text-brand-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCalcReturnBeforeNoon((prev) => !prev)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                            calcReturnBeforeNoon
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {calcReturnBeforeNoon ? '✓ Trả xe trước 12:00 trưa (1.5 ngày)' : 'Trả xe chiều tối sau 12:00 (2 ngày)'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 min-w-[260px]">
                      <div className="lg:text-right">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                          Tổng Combo {calcPassengers} khách khứ hồi + {calcBikes} xe máy
                        </span>
                        <div className="text-2xl font-black text-brand-800 tabular-nums">
                          {finalComboDemo.toLocaleString()}đ
                        </div>
                        <div className="text-xs font-bold text-emerald-700">
                          Đã tiết kiệm {comboDiscountDemo.toLocaleString()}đ (~{Math.round(finalComboDemo / calcPassengers).toLocaleString()}đ/người)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenBusBookingModal(trips[0]?.id, true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        Áp dụng Combo & Chọn Ghế →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SUB-CATEGORY TABS + QUICK CHIPS + VIEW MODE SWITCHER */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {[
                      {
                        id: 'all',
                        label: 'Tất cả phương tiện',
                        count:
                          listings.filter((l) => ['bus', 'taxi', 'motorbike'].includes(l.category)).length +
                          trips.length
                      },
                      {
                        id: 'bus',
                        label: '🚌 Xe Khách & Limousine',
                        count: listings.filter((l) => l.category === 'bus').length + trips.length
                      },
                      {
                        id: 'taxi',
                        label: '🚕 Taxi & SUV 24/7',
                        count: listings.filter((l) => l.category === 'taxi').length
                      },
                      {
                        id: 'motorbike',
                        label: '🛵 Thuê Xe Máy Đèo',
                        count: listings.filter((l) => l.category === 'motorbike').length
                      }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setTransportSubCategory(sub.id as any)}
                        className={`px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                          transportSubCategory === sub.id
                            ? 'bg-brand-800 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        <span>{sub.label}</span>
                        <span className="ml-1.5 opacity-80 tabular-nums">({sub.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* View Mode Switcher (3-Col Grid vs OTA Horizontal Schedule List) */}
                  <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setTransportOnlyBikeCombo((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        transportOnlyBikeCombo
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-teal-50/70 hover:bg-teal-100 text-teal-900 border-teal-200'
                      }`}
                    >
                      🛵 Có Combo Xe Máy (-30k)
                    </button>

                    <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTransportViewMode('grid')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                          transportViewMode === 'grid'
                            ? 'bg-brand-800 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⊞ Thẻ lưới
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransportViewMode('list')}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                          transportViewMode === 'list'
                            ? 'bg-brand-800 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ☰ Bảng gói & giờ chạy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Time-Slot & Vehicle Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
                  <span className="text-xs font-extrabold text-slate-400 shrink-0 mr-1">
                    Chọn nhanh:
                  </span>
                  {[
                    {
                      label: '🌅 Chuyến Sáng (06:00–08:30)',
                      active: transportTimeSlot === 'morning',
                      onClick: () => setTransportTimeSlot((p) => (p === 'morning' ? 'all' : 'morning'))
                    },
                    {
                      label: '🌙 Chuyến Đêm ngủ đón bình minh (21:30–22:30)',
                      active: transportTimeSlot === 'night',
                      onClick: () => setTransportTimeSlot((p) => (p === 'night' ? 'all' : 'night'))
                    },
                    {
                      label: '☀️ Chuyến Chiều (13:00–15:00)',
                      active: transportTimeSlot === 'afternoon',
                      onClick: () => setTransportTimeSlot((p) => (p === 'afternoon' ? 'all' : 'afternoon'))
                    },
                    {
                      label: '🛏️ Cabin Đôi VIP riêng tư',
                      active: transportVehicleType === 'cabin_vip',
                      onClick: () => setTransportVehicleType((p) => (p === 'cabin_vip' ? 'all' : 'cabin_vip'))
                    },
                    {
                      label: '🚐 Limousine 9–11 ghế massage',
                      active: transportVehicleType === 'limousine',
                      onClick: () => setTransportVehicleType((p) => (p === 'limousine' ? 'all' : 'limousine'))
                    },
                    {
                      label: '🚗 Xe ghép đón tận sảnh Hà Nội',
                      active: transportVehicleType === 'shared_car',
                      onClick: () => setTransportVehicleType((p) => (p === 'shared_car' ? 'all' : 'shared_car'))
                    }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={chip.onClick}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        chip.active
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}

                  {hasActiveTransportFilters && (
                    <button
                      type="button"
                      onClick={handleResetTransportFilters}
                      className="px-3 py-1 rounded-full text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 whitespace-nowrap cursor-pointer ml-auto"
                    >
                      ✕ Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>

              {/* 3. ONLINE SEAT-SELECTION SCHEDULE SECTION (6 Daily Trips with Timeline & Seat Availability) */}
              {(transportSubCategory === 'all' || transportSubCategory === 'bus') && filteredTrips.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-brand-800 flex items-center gap-2">
                      <Bus className="w-5 h-5 text-teal-700" />
                      <span>
                        Lịch Xe Chọn Ghế Trực Tuyến Hàng Ngày ({filteredTrips.length} chuyến khớp lộ trình)
                      </span>
                    </h2>
                    <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                      ✓ Chọn đúng vị trí Tầng 1 / Tầng 2 · Giữ chỗ 30 phút · VietQR tự động
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTrips.map((trip) => {
                      const availableSeatsCount = Math.max(1, trip.totalSeats - trip.bookedSeats.length);
                      const lastStop = trip.stops[trip.stops.length - 1];
                      const travelMins = lastStop?.minuteOffset || 315;
                      const [depHr, depMin] = trip.departureTime.split(':').map(Number);
                      const totalArrivalMins = depHr * 60 + depMin + travelMins;
                      const arrHr = Math.floor((totalArrivalMins / 60) % 24);
                      const arrMin = totalArrivalMins % 60;
                      const arrivalTimeStr = `${String(arrHr).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;
                      const isNightTrip = depHr >= 20;
                      const isMorningTrip = depHr >= 5 && depHr <= 10;

                      return (
                        <div
                          key={trip.id}
                          className="bg-white border border-slate-200 hover:border-brand-800/50 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Row: Time Slot Badge & Vehicle Type */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                                  isNightTrip
                                    ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                    : isMorningTrip
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-sky-50 text-sky-900 border-sky-200'
                                }`}
                              >
                                {isNightTrip
                                  ? '🌙 Chuyến Đêm · Sáng đón mây'
                                  : isMorningTrip
                                  ? '🌅 Chuyến Sáng · Check-in trưa'
                                  : '☀️ Chuyến Chiều · Ngắm hoàng hôn'}
                              </span>
                              <span className="bg-teal-50 text-teal-800 border border-teal-200/80 px-2.5 py-1 rounded-full text-xs font-extrabold">
                                {trip.busType}
                              </span>
                            </div>

                            {/* Visual Departure -> Arrival Timeline */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-3 flex items-center justify-between gap-2">
                              <div>
                                <div className="text-xl font-black text-brand-800 tabular-nums leading-none">
                                  {trip.departureTime}
                                </div>
                                <div className="text-xs font-bold text-slate-500 mt-1">
                                  {trip.originCity}
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col items-center px-2">
                                <span className="text-xs font-bold text-teal-700">
                                  ~{Math.floor(travelMins / 60)}h{travelMins % 60 > 0 ? `${travelMins % 60}p` : ''}
                                </span>
                                <div className="w-full h-0.5 bg-slate-300 relative my-1">
                                  <span className="w-2 h-2 rounded-full bg-brand-800 absolute left-0 -top-[3px]" />
                                  <span className="w-2 h-2 rounded-full bg-teal-600 absolute right-0 -top-[3px]" />
                                </div>
                                <span className="text-xs text-slate-500">Đón trả tận nơi</span>
                              </div>

                              <div className="text-right">
                                <div className="text-xl font-black text-teal-800 tabular-nums leading-none">
                                  {arrivalTimeStr}
                                </div>
                                <div className="text-xs font-bold text-slate-500 mt-1">
                                  {trip.destinationCity}
                                </div>
                              </div>
                            </div>

                            <h3 className="font-black text-brand-800 text-sm sm:text-base mb-0.5 line-clamp-1">
                              {trip.operatorName}
                            </h3>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-1">{trip.route}</p>

                            {/* Pickup & Dropoff Stops */}
                            <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 text-xs space-y-1 mb-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-brand-800 font-extrabold">Điểm đón & trả chính:</span>
                                <span className="font-extrabold text-emerald-700">
                                  Còn {availableSeatsCount}/{trip.totalSeats} ghế trống
                                </span>
                              </div>
                              <ul className="text-slate-600 space-y-0.5 text-xs">
                                {trip.stops.slice(0, 3).map((s, idx) => (
                                  <li key={idx} className="truncate">
                                    · {s.name} ({s.type === 'dropoff' ? 'Điểm trả' : `+${s.minuteOffset}p`})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Card Footer: Price + Combo Button + Seat Selection Button */}
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-end justify-between gap-2">
                            <div className="shrink-0">
                              <span className="text-xs text-slate-500 uppercase font-extrabold block whitespace-nowrap">
                                Giá vé 1 chiều
                              </span>
                              <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                                <span className="text-lg font-black text-brand-800 tabular-nums">
                                  {trip.baseFare.toLocaleString()}đ
                                </span>
                                <span className="text-xs text-slate-500 font-bold">/ghế</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleOpenBusBookingModal(trip.id, true)}
                                title="Đặt vé kèm thuê xe máy giảm ngay 30.000đ"
                                className="h-8 px-2.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-extrabold text-xs transition-colors cursor-pointer whitespace-nowrap"
                              >
                                🛵 +Xe máy (-30k)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenBusBookingModal(trip.id, false)}
                                className="h-8 bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-3.5 rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center"
                              >
                                Chọn Ghế Đón →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. VERIFIED TRANSPORT OPERATORS DIRECTORY (16 Bus Operators, 4 Local Taxis, 4 Motorbike Hubs) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-brand-800 flex items-center gap-2">
                    <Car className="w-5 h-5 text-teal-700" />
                    <span>
                      {transportSubCategory === 'bus'
                        ? `Danh Bạ ${filteredTransportListings.length} Nhà Xe & Xe Ghép Chuyên Tuyến Tà Xùa`
                        : transportSubCategory === 'taxi'
                        ? `Đội Xe Taxi Bản Địa & SUV Gầm Cao Tà Xùa 24/7 (${filteredTransportListings.length} cơ sở)`
                        : transportSubCategory === 'motorbike'
                        ? `Trạm Thuê Xe Máy Phượt Đèo & Xe Ôm Bản Địa (${filteredTransportListings.length} cơ sở)`
                        : `Danh Sách ${filteredTransportListings.length} Cơ Sở Nhà Xe, Taxi Bản Địa & Cho Thuê Xe Máy Đã Thẩm Định`}
                    </span>
                  </h2>
                  <span className="text-xs text-slate-500">
                    Bấm vào từng cơ sở để xem bảng giá gói vé, lịch chạy hoặc mở sơ đồ ghế
                  </span>
                </div>

                {filteredTransportListings.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                    <h3 className="text-lg font-extrabold text-brand-800">
                      Không tìm thấy nhà xe hoặc phương tiện khớp bộ lọc hiện tại
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                      Hãy thử chọn "Mọi khung giờ" hoặc "Tất cả điểm đón" để xem toàn bộ danh sách phương tiện.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetTransportFilters}
                      className="px-5 py-2.5 rounded-full bg-brand-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Khôi phục toàn bộ phương tiện
                    </button>
                  </div>
                ) : (
                  <div
                    className={
                      transportViewMode === 'list'
                        ? 'space-y-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    }
                  >
                    {filteredTransportListings.map((item) => (
                      <ListingCard
                        key={item.id}
                        listing={item}
                        onSelect={(l) => setSelectedListingDetail(l)}
                        isSaved={userProfile.savedListings.includes(item.id)}
                        onToggleSave={handleToggleSave}
                        lowDataMode={lowDataMode}
                        onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                        onClaimListing={(l) => setActiveClaimListing(l)}
                        onOpenSeatMap={item.category === 'bus' ? handleOpenSeatMapForListing : undefined}
                        layoutMode={transportViewMode === 'list' ? 'horizontal' : 'grid'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* TAB DỊCH VỤ: Tour Tà Xùa - Photographer - Thuê Trang Phục - Thuê Máy Ảnh */}
        {currentTab === 'services' && (() => {
          const servicesSecBanner = siteContent.sectionBanners?.find((s) => s.sectionKey === 'services');
          return (
          <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                    {servicesSecBanner?.isActive ? servicesSecBanner.badgeText : 'HỆ SINH THÁI DỊCH VỤ TRẢI NGHIỆM CHUYÊN NGHIỆP'}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-800">
                    {servicesSecBanner?.isActive ? servicesSecBanner.title : 'Dịch Vụ Du Lịch & Trải Nghiệm Tà Xùa'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    {servicesSecBanner?.isActive
                      ? servicesSecBanner.subtitle
                      : 'Tour trekking Sống Lưng Khủng Long, thợ chụp ảnh săn mây chuyên nghiệp, tiệm thuê trang phục Mông/Bohemian và thuê máy ảnh mirrorless/flycam uy tín.'}
                  </p>
                </div>

                {featureOpen('communityChat') && (
                <button
                  type="button"
                  onClick={() => handleOpenCommunityPopup('space-8')}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-4 py-3 rounded-full text-xs transition-all self-start sm:self-auto cursor-pointer flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>📸 Nhóm Ghép Tour & Thợ Chụp Ảnh (14 Online)</span>
                </button>
                )}
              </div>

              {/* Sub-Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả dịch vụ', count: listings.filter((l) => ['tour', 'photo', 'costume', 'camera'].includes(l.category)).length },
                  { id: 'tour', label: 'Tour Tà Xùa & Trekking', count: listings.filter((l) => l.category === 'tour').length },
                  { id: 'photo', label: 'Photographer Săn Mây', count: listings.filter((l) => l.category === 'photo').length },
                  { id: 'costume', label: 'Thuê Trang Phục Mông/Boho', count: listings.filter((l) => l.category === 'costume').length },
                  { id: 'camera', label: 'Thuê Máy Ảnh & Flycam', count: listings.filter((l) => l.category === 'camera').length }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setServicesSubCategory(sub.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      servicesSubCategory === sub.id
                        ? 'bg-brand-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1.5 opacity-75 tabular-nums">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Services Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings
                  .filter((l) => {
                    if (servicesSubCategory === 'all') return ['tour', 'photo', 'costume', 'camera'].includes(l.category);
                    return l.category === servicesSubCategory;
                  })
                  .map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onSelect={(l) => setSelectedListingDetail(l)}
                      isSaved={userProfile.savedListings.includes(item.id)}
                      onToggleSave={handleToggleSave}
                      lowDataMode={lowDataMode}
                      onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                      onClaimListing={(l) => setActiveClaimListing(l)}
                    />
                  ))}
              </div>
            </div>
          </div>
          );
        })()}

        {/* TAB ĂN UỐNG: Nhà Hàng và Cafe */}
        {currentTab === 'dining' && (() => {
          const diningSecBanner = siteContent.sectionBanners?.find((s) => s.sectionKey === 'dining');
          return (
          <div className="bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-teal-700 mb-2">
                    {diningSecBanner?.isActive ? diningSecBanner.badgeText : 'ẨM THỰC BẢN ĐỊA & CÀ PHÊ MÂY'}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-800">
                    {diningSecBanner?.isActive ? diningSecBanner.title : 'Ăn Uống: Nhà Hàng & Cà Phê Tà Xùa'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    {diningSecBanner?.isActive
                      ? diningSecBanner.subtitle
                      : 'Thưởng thức lẩu gà đen, lợn bản nướng mắc khén và ngồi nhâm nhi tách cà phê muối ấm nóng nhìn ngắm thung lũng mây Đỉnh Gió trập trùng.'}
                  </p>
                </div>

                {featureOpen('communityChat') && (
                <button
                  type="button"
                  onClick={() => handleOpenCommunityPopup('space-6')}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold px-4 py-3 rounded-full text-xs transition-all self-start sm:self-auto cursor-pointer flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>🍲 Nhóm Review Ẩm Thực & Quán Cafe (18 Online)</span>
                </button>
                )}
              </div>

              {/* Sub-Category Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                {[
                  { id: 'all', label: 'Tất cả ẩm thực', count: listings.filter((l) => ['restaurant', 'coffee'].includes(l.category)).length },
                  { id: 'restaurant', label: 'Nhà Hàng & Đặc Sản', count: listings.filter((l) => l.category === 'restaurant').length },
                  { id: 'coffee', label: 'Quán Cà Phê Săn Mây', count: listings.filter((l) => l.category === 'coffee').length }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setDiningSubCategory(sub.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      diningSubCategory === sub.id
                        ? 'bg-brand-800 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span className="ml-1.5 opacity-75 tabular-nums">({sub.count})</span>
                  </button>
                ))}
              </div>

              {/* Dining Listings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings
                  .filter((l) => {
                    if (diningSubCategory === 'all') return ['restaurant', 'coffee'].includes(l.category);
                    return l.category === diningSubCategory;
                  })
                  .map((item) => (
                    <ListingCard
                      key={item.id}
                      listing={item}
                      onSelect={(l) => setSelectedListingDetail(l)}
                      isSaved={userProfile.savedListings.includes(item.id)}
                      onToggleSave={handleToggleSave}
                      lowDataMode={lowDataMode}
                      onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
                      onClaimListing={(l) => setActiveClaimListing(l)}
                    />
                  ))}
              </div>
            </div>
          </div>
          );
        })()}

        {currentTab === 'itinerary' && !featureOpen('itineraryPlanner') && (
          <div className="max-w-3xl mx-auto px-4 py-8">
            <ComingSoon
              feature="itineraryPlanner"
              actions={[
                { label: 'Tìm chỗ ở', onClick: () => setCurrentTab('stay') },
                { label: 'Xem bản đồ', onClick: () => setCurrentTab('map') },
              ]}
            />
          </div>
        )}
        {currentTab === 'itinerary' && featureOpen('itineraryPlanner') && (
          <AIItineraryGenerator
            onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
            listings={listings}
            onSelectListing={(l) => setSelectedListingDetail(l)}
            onOpenSosModal={() => setIsSosModalOpen(true)}
          />
        )}

        {/* TAB CHAT CỘNG ĐỒNG RIÊNG */}
        {currentTab === 'community' && (
          <div className="max-w-5xl mx-auto px-4 pt-6">
            <LeaderboardCard />
          </div>
        )}
        {currentTab === 'community' && !featureOpen('communityChat') && (
          <div className="max-w-5xl mx-auto px-4 pb-8">
            <ComingSoon feature="communityChat" />
          </div>
        )}
        {currentTab === 'community' && featureOpen('communityChat') && (
          <CommunitySection
            posts={communityPosts}
            onAddPost={handleAddCommunityPost}
            siteContent={siteContent}
            listings={listings}
          />
        )}

        {currentTab === 'partner' && (
          currentUser?.role === 'partner' ? (
            partnerListing ? (
              <PartnerDashboard
                partnerListing={partnerListing}
                ownedListings={partnerOwnedListings}
                onSelectPartnerListing={(listingId) => setSelectedPartnerListingId(listingId)}
                onUpdateListing={handleUpdateListingFromPartnerOrAdmin}
                bookings={bookings.filter((b) => b.listingId === partnerListing.id)}
                onUpdateAvailability={handleUpdateAvailability}
                inventoryDate={partnerInventoryDate}
                onChangeInventoryDate={setPartnerInventoryDate}
                roomAvailability={partnerRoomAvailability}
                onConfirmBooking={handleConfirmBooking}
                onCheckInBooking={handleCheckInBooking}
                onCompleteBooking={handleCompleteBooking}
                billingEnabled={billingEnabled}
                bookingsPanel={
                  <PartnerBookingsPanel
                    listingId={partnerListing.id}
                    initialCheckinToken={route.checkinToken || undefined}
                    onCheckinFinished={() => {
                      if (route.checkinToken !== undefined) navigate(pathForTab('partner'), { replace: true });
                    }}
                  />
                }
              />
            ) : (
              <div className="max-w-2xl mx-auto my-12 px-4">
                <div className="bg-slate-900 rounded-3xl p-8 border border-amber-500/40 shadow-xl text-center space-y-5 text-white">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl font-black">
                    ⏳
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Hồ Sơ Đối Tác Đang Chờ Xác Minh & Cấp Quyền Cơ Sở
                  </h2>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Chào mừng <strong>{currentUser?.name || 'Quý đối tác'}</strong>! Tài khoản của bạn đã được đăng ký thành công trên hệ thống Tà Xùa Trip với 0 cơ sở được gán.
                  </p>
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <span>• Trạng thái tài khoản:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs">unverified (Chờ thẩm định thực địa)</span>
                    </div>
                    <p>
                      Theo quy trình thẩm định thực địa Tà Xùa Trip, Quản trị viên hệ thống sẽ kiểm tra cơ sở, đối soát thông tin và cấp quyền quản lý cơ sở tương ứng cho tài khoản đối tác của bạn.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-600 cursor-pointer transition-colors"
                    >
                      Kiểm tra trạng thái tài khoản
                    </button>
                    <a
                      href="https://zalo.me/0981234567"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
                    >
                      Liên hệ hỗ trợ xác minh
                    </a>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="max-w-2xl mx-auto my-12 px-4">
              <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-black">
                  🏡
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Cổng Quản Lý Cơ Sở Homestay & Đối Tác Dịch Vụ
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Trang này dành riêng cho chủ homestay, nhà xe, quán ăn, cafe và dịch vụ bản địa Tà Xùa quản trị đúng ngành dịch vụ của mình, xác nhận đặt chỗ và quản lý ví doanh thu.
                </p>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 inline-flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <span>Tài khoản hiện tại:</span>
                  <span className="font-extrabold">{currentUser?.name || 'Chưa đăng nhập'} ({currentUser?.roleName || 'Khách'})</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('partner', 'login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md cursor-pointer"
                  >
                    Đăng nhập Chủ cơ sở (Demo 1-chạm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('partner', 'register')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer"
                  >
                    Đăng ký cơ sở mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('explore')}
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Quay lại Khám phá
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              listings={adminListings}
              billingEnabled={billingEnabled}
              onToggleBilling={handleToggleBilling}
              onUpdateTier={handleUpdateTier}
              onApproveListing={handleApproveListing}
              onRejectListing={handleRejectListing}
              onAddListing={handleAddListingFromAdmin}
              onUpdateListing={handleUpdateListingFromPartnerOrAdmin}
              onDeleteListing={handleDeleteListingFromAdmin}
              trips={trips}
              onUpdateTrips={setTrips}
              siteContent={siteContent}
              onUpdateSiteContent={handleUpdateSiteContent}
              landmarks={landmarks}
              onUpdateLandmarks={setLandmarks}
              forecasts={forecasts}
              onUpdateForecasts={setForecasts}
              communityPosts={communityPosts}
              onUpdateCommunityPosts={setCommunityPosts}
              disputes={disputes}
              vouchers={vouchers}
              onToggleVoucher={handleToggleVoucher}
              onAddVoucher={handleAddVoucher}
              rewardSettings={rewardSettings}
              onUpdateRewardPercent={handleUpdateRewardPercent}
              claimRequests={claimRequests}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              currentUserId={currentUser?.id}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 px-4">
              <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-2xl font-black">
                  🛡️
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Cổng Quản Trị Viên Thẩm Định
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Khu vực bảo mật dành cho Quản trị viên Tà Xùa Trip kiểm tra tọa độ, cấp huy hiệu xác thực Cấp 1-3, kiểm duyệt tranh chấp và phân bổ mã giảm giá.
                </p>
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/80 inline-flex items-center gap-2 text-xs font-semibold text-rose-900">
                  <span>Tài khoản hiện tại:</span>
                  <span className="font-extrabold">{currentUser?.name || 'Chưa đăng nhập'} ({currentUser?.roleName || 'Khách'})</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('admin', 'login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm shadow-md cursor-pointer"
                  >
                    Đăng nhập Admin (Demo 1-chạm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('explore')}
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Quay lại Khám phá
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Compact Floating Dock (Single-row sleek pills that never obscure listing cards) */}
      <div className="fixed bottom-20 lg:bottom-4 right-3 sm:right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-none">
        {isFloatingSocialExpanded &&
          (siteContent.socialChannels || []).some((ch) => ch.isActive && ch.placements.includes('floating_dock')) && (
            <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-lg text-xs text-white">
              <span className="font-extrabold text-amber-300 mr-0.5">Kênh:</span>
              {(siteContent.socialChannels || [])
                .filter((ch) => ch.isActive && ch.placements.includes('floating_dock'))
                .map((ch) => {
                  const shortIcon =
                    ch.platform === 'tiktok'
                      ? '🎵 TikTok'
                      : ch.platform.startsWith('facebook')
                      ? '📘 FB'
                      : ch.platform.startsWith('zalo')
                      ? '💬 Zalo'
                      : ch.platform === 'phone_sos'
                      ? '🚨 Cứu hộ'
                      : ch.platform === 'phone_hotline'
                      ? `📞 ${ch.handleOrNumber}`
                      : '🌐 Kênh';
                  return (
                    <a
                      key={ch.id}
                      href={ch.url}
                      target={ch.url.startsWith('tel:') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      title={`${ch.title} (${ch.handleOrNumber})`}
                      className={`px-2 py-0.5 rounded-full font-bold transition-colors ${
                        ch.platform === 'phone_sos'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-white/15 hover:bg-white/25 text-white'
                      }`}
                    >
                      {shortIcon}
                    </a>
                  );
                })}
            </div>
          )}

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-xl">
          {(siteContent.socialChannels || []).some((ch) => ch.isActive && ch.placements.includes('floating_dock')) && (
            <button
              type="button"
              onClick={() => setIsFloatingSocialExpanded((prev) => !prev)}
              aria-label="Bật/tắt kênh liên hệ nhanh"
              title="Mở các kênh TikTok, Zalo, Hotline chính chủ"
              className={`h-9 px-3 rounded-full text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                isFloatingSocialExpanded
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <span>📞 Liên hệ</span>
            </button>
          )}

          {currentUser?.role === 'admin' && featureOpen('adminAssistant') && (
            <button
              type="button"
              onClick={() => setIsJarvisOverlayOpen(true)}
              aria-label="Triệu hồi Siêu Trợ Lý J.A.R.V.I.S. (Độc quyền Admin)"
              className="h-9 bg-slate-900 hover:bg-slate-800 text-cyan-300 font-black text-xs px-3 rounded-full flex items-center gap-1.5 border border-cyan-400 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span>💠 J.A.R.V.I.S.</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenCommunityPopup('space-1')}
            aria-label="Mở Popup Cộng Đồng Tà Xùa Trip"
            className="h-9 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs px-3.5 rounded-full flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span>Cộng Đồng</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAiAdvisorOpen(true)}
            aria-label="Mở Trợ lý AI Tà Xùa Trip"
            className="flex h-9 bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-3.5 rounded-full items-center gap-1.5 border border-white/15 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tư vấn AI</span>
          </button>
        </div>
      </div>

      {/* Community Hub Popup Modal (9 Optimized Chat Spaces & Live Online Members) */}
      {isCommunityPopupOpen && featureOpen('communityChat') && (
        <CommunitySection
          posts={communityPosts}
          onAddPost={handleAddCommunityPost}
          isPopupModal={true}
          onClosePopup={() => setIsCommunityPopupOpen(false)}
          initialSpaceId={communityPopupSpaceId}
          siteContent={siteContent}
          listings={listings}
        />
      )}

      {/* Admin-Only J.A.R.V.I.S. Tactical HUD Overlay (Summoned from any page via Orb or Ctrl+J) */}
      {currentUser?.role === 'admin' && featureOpen('adminAssistant') && isJarvisOverlayOpen && (
        <JarvisAdminAssistant
          listings={adminListings}
          disputes={disputes}
          claimRequests={claimRequests}
          vouchers={vouchers}
          forecasts={forecasts}
          siteContent={siteContent}
          billingEnabled={billingEnabled}
          revidConfig={INITIAL_REVID_GATEWAY_CONFIG}
          isModalOverlay={true}
          onCloseOverlay={() => setIsJarvisOverlayOpen(false)}
          onUpdateTier={handleUpdateTier}
          onUpdateListing={handleUpdateListingFromPartnerOrAdmin}
          onApproveClaim={handleApproveClaim}
          onUpdateSiteContent={handleUpdateSiteContent}
          onUpdateForecasts={setForecasts}
          onAddVoucher={handleAddVoucher}
          onToggleBilling={handleToggleBilling}
          onJumpToAdminTab={() => {
            setIsJarvisOverlayOpen(false);
            setCurrentTab('admin');
          }}
        />
      )}

      {/* Global Modals */}
      {selectedListingDetail && (
        <ListingDetailModal
          listing={applyAvailability([selectedListingDetail], availabilityMap)[0]}
          searchIntent={{ checkIn: stayCheckIn, checkOut: stayCheckOut, adults: stayAdults, children: stayChildren, rooms: stayRooms }}
          onChangeSearchIntent={updateSearchIntent}
          vouchers={vouchers}
          onClose={() => setSelectedListingDetail(null)}
          onBookSuccess={handleBookingSuccess}
          canReplyReviews={currentUser?.role === 'partner' && !!currentUser.ownedListingIds?.includes(selectedListingDetail.id)}
          onOpenDirectChat={(l) => setActiveDirectChatListing(l)}
          onClaimListing={(l) => setActiveClaimListing(l)}
          isLoggedIn={!!currentUser}
          onRequireLogin={() => handleOpenAuthModal('traveler', 'login')}
        />
      )}

      {isBusModalOpen && (
        <BusBookingModal
          trips={trips}
          initialTripId={activeBusModalTripId}
          initialEnableMotorbikeCombo={activeBusModalCombo}
          onClose={() => setIsBusModalOpen(false)}
          onBookSuccess={handleBookingSuccess}
        />
      )}

      {isSosModalOpen && <SosModal onClose={() => setIsSosModalOpen(false)} siteContent={siteContent} />}

      {isAccountOpen && currentUser && (
        <AccountModal
          onClose={() => setIsAccountOpen(false)}
          onProfileSaved={(p) => setCurrentUser((u) => (u ? { ...u, name: p.fullName, phone: p.phone, facilityName: p.businessName ?? u.facilityName } : u))}
          onLoggedOut={() => {
            setIsAccountOpen(false);
            handleLogout();
          }}
        />
      )}
      {isPointsModalOpen && (
        <PointsModal
          isLoggedIn={!!currentUser}
          onClose={() => setIsPointsModalOpen(false)}
          onLogin={() => {
            setIsPointsModalOpen(false);
            handleOpenAuthModal('traveler', 'login');
          }}
          onLoaded={(pts) => setUserProfile((prev) => ({ ...prev, cloudPoints: pts }))}
        />
      )}

      {activeSuccessBooking && (
        <BookingSuccessModal
          booking={activeSuccessBooking}
          onClose={() => setActiveSuccessBooking(null)}
        />
      )}

      {/* Pro OTA Pack: Floating Compare Bar, Compare Modal, Wishlist Drawer & My Trips Modal */}
      <CompareFloatingBar
        compareListings={listings.filter((l) => compareIds.includes(l.id))}
        onRemoveCompare={handleToggleCompare}
        onClearCompare={() => setCompareIds([])}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
      />

      <CompareHomestaysModal
        isOpen={isCompareModalOpen}
        compareListings={listings.filter((l) => compareIds.includes(l.id))}
        onClose={() => setIsCompareModalOpen(false)}
        onRemoveCompare={handleToggleCompare}
        onSelectListing={(l) => setSelectedListingDetail(l)}
      />

      <WishlistDrawerModal
        isOpen={isWishlistModalOpen}
        savedListings={listings.filter((l) => userProfile.savedListings.includes(l.id))}
        onClose={() => setIsWishlistModalOpen(false)}
        onToggleSave={handleToggleSave}
        onSelectListing={(l) => setSelectedListingDetail(l)}
        onCompareAllSaved={() => {
          const savedHomestays = listings
            .filter((l) => userProfile.savedListings.includes(l.id) && l.category === 'homestay')
            .slice(0, 3)
            .map((l) => l.id);
          if (savedHomestays.length > 0) {
            setCompareIds(savedHomestays);
          }
          setIsWishlistModalOpen(false);
          setIsCompareModalOpen(true);
        }}
      />

      <MyTripsModal
        isOpen={isMyTripsModalOpen}
        currentUser={currentUser}
        bookings={bookings}
        listings={listings}
        onClose={() => setIsMyTripsModalOpen(false)}
        onRequireLogin={() => setIsAuthModalOpen(true)}
      />

      {/* Direct Host Chat Modal */}
      {activeDirectChatListing && !featureOpen('directChat') && (
        <ComingSoonModal feature="directChat" onClose={() => setActiveDirectChatListing(null)} />
      )}
      {activeDirectChatListing && featureOpen('directChat') && (
        <DirectChatModal
          listing={activeDirectChatListing}
          isOpen={true}
          onClose={() => setActiveDirectChatListing(null)}
          userProfile={userProfile}
          onRegisterMember={handleRegisterMember}
        />
      )}

      {/* Partner Claim Owner Modal */}
      {activeClaimListing && (
        <PartnerClaimModal
          listing={activeClaimListing}
          isOpen={true}
          onClose={() => setActiveClaimListing(null)}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {/* AI Travel Advisor & Quote Modal */}
      {isAiAdvisorOpen && !featureOpen('aiAdvisor') && (
        <ComingSoonModal
          feature="aiAdvisor"
          onClose={() => setIsAiAdvisorOpen(false)}
          actions={[{ label: 'Tìm chỗ ở', onClick: () => setCurrentTab('stay') }]}
        />
      )}
      {lockedFeatureModal && <ComingSoonModal feature={lockedFeatureModal} onClose={() => setLockedFeatureModal(null)} />}
      <AITravelAdvisorModal
        isOpen={isAiAdvisorOpen && featureOpen('aiAdvisor')}
        onClose={() => setIsAiAdvisorOpen(false)}
        allListings={listings}
        vouchers={vouchers}
        onSelectListing={(listing: Listing) => {
          setSelectedListingDetail(listing);
          setIsAiAdvisorOpen(false);
        }}
        onBookListing={(listing: Listing) => {
          setSelectedListingDetail(listing);
          setIsAiAdvisorOpen(false);
        }}
      />

      {/* Multi-role Authentication & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
        initialMode={authModalMode}
      />

      {/* Khối Kênh Chính Chủ Tà Xùa Trip & Bản Đồ QR (Relocated Pre-Footer Trust Hub) */}
      <section className="bg-gradient-to-b from-[#f8fafc] to-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl flex-1">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-black uppercase tracking-wider mb-2 border border-teal-200/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>KÊNH CHÍNH CHỦ TÀ XÙA TRIP · ĐÃ THẨM ĐỊNH</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-brand-800 tracking-tight">
                  Hệ Sinh Thái Kênh Liên Lạc & Bản Đồ QR Toàn Tuyến
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Tránh tình trạng lừa đảo cọc phòng qua trung gian hoặc số điện thoại giả mạo. Mọi thông tin tư vấn và đặt dịch vụ áp dụng qua các đầu mối chính thức được kiểm duyệt dưới đây.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(siteContent.socialChannels || []).filter((ch) => ch.isActive).map((ch) => (
                  <a
                    key={ch.id}
                    href={ch.url}
                    target={ch.url.startsWith('tel:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {ch.platform === 'tiktok'
                          ? '🎵 TikTok'
                          : ch.platform.startsWith('facebook')
                          ? '📘 Facebook'
                          : ch.platform.startsWith('zalo')
                          ? '💬 Zalo'
                          : ch.platform === 'phone_sos'
                          ? '🚨 Cứu hộ'
                          : '📞 Hotline'}
                      </span>
                      <span className="text-xs text-teal-700 font-extrabold group-hover:translate-x-0.5 transition-transform">
                        ↗
                      </span>
                    </div>
                    <div className="text-xs font-black text-brand-800 truncate mt-1">
                      {ch.handleOrNumber}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center shrink-0 w-full sm:w-auto">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https%3A%2F%2Ftaxuatrip.vn"
                alt="QR Bản Đồ & Kênh Chính Chủ"
                className="w-28 h-28 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs"
              />
              <span className="text-xs font-black text-brand-800 mt-2">Mã QR Kết Nối 1-Chạm</span>
              <p className="text-xs text-slate-500 max-w-[150px] mt-0.5">
                Quét bằng Zalo hoặc Camera điện thoại để lưu danh bạ Tà Xùa
              </p>
              <button
                type="button"
                onClick={() => setIsCommunityPopupOpen(true)}
                className="mt-3 w-full px-4 py-2 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Mở Bản Đồ Kênh & QR →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer matching https://taxuaslay1.vercel.app/ (with pb-24 on mobile for Fixed Bottom Nav clearance) */}
      <footer className="bg-white border-t border-slate-200/90 text-slate-600 pt-12 pb-24 lg:py-14 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-800 text-white flex items-center justify-center">
                <Mountain className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-[0.1em] text-brand-800 uppercase">
                  TÀ XÙA TRIP
                </div>
                <div className="text-xs text-slate-500">
                  {siteContent.footerConfig?.brandTagline || 'Đi thật. Biết trước.'}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              {siteContent.footerConfig?.description ||
                'Nền tảng du lịch địa phương giúp bạn biết rõ nơi ở, bằng chứng và điều cần lưu ý trước khi lên đường.'}
            </p>
            <div className="text-xs text-slate-500 space-y-1 mb-2">
              <div>📍 {siteContent.footerConfig?.address || 'Trung tâm Xã Tà Xùa, Bắc Yên, Sơn La'}</div>
              <div>
                🚨 Cứu hộ 24/7:{' '}
                <span className="font-bold text-rose-600">{siteContent.footerConfig?.rescueHotline || '0981 119 115'}</span> · Zalo:{' '}
                <span className="font-bold text-brand-800">{siteContent.footerConfig?.supportZalo || '0981 234 567'}</span>
              </div>
            </div>
            <p className="text-xs font-extrabold tracking-widest text-teal-700">
              THẬT · HIỂU · TRỌN VẸN
            </p>
          </div>

          <div>
            <h2 className="font-extrabold text-brand-800 uppercase tracking-wider mb-3 text-xs">
              DỊCH VỤ
            </h2>
            <ul className="space-y-2 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setHeroConsoleMode('combo_trekking');
                    setCurrentTab('explore');
                    setTimeout(() => {
                      const el = document.getElementById('curated-combos-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 80);
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Tìm chuyến đi & Combo trọn gói
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('stay');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Lưu trú Homestay & Bungalow
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('map');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Bản đồ tọa độ săn mây
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setTransportSubCategory('bus');
                    setCurrentTab('transport');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Xe khách · Đón dọc tuyến
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setHeroConsoleMode('motorbike');
                    setSelectedCategory('motorbike');
                    setCurrentTab('explore');
                    setTimeout(() => {
                      const el = document.getElementById('biker-hub-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 80);
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Xe máy · Giao tận Homestay
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('weather');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Săn mây / Cloud View
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-extrabold text-brand-800 uppercase tracking-wider mb-3 text-xs">
              HỖ TRỢ
            </h2>
            <ul className="space-y-2 text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={() => setIsSosModalOpen(true)}
                  className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer text-left"
                >
                  Cứu hộ Đèo Chẹn & Núi 24/7
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('itinerary');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Trợ lý AI Lịch trình Offline
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('community');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Cộng đồng ghép xe & review
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-extrabold text-brand-800 uppercase tracking-wider mb-3 text-xs">
              VỀ CHÚNG TÔI & KÊNH CHÍNH THỨC
            </h2>
            <ul className="space-y-2 text-slate-600 mb-4">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTab('verified');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Phương pháp thẩm định
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('partner');
                    setCurrentTab('partner');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Cổng Đối tác / Chủ cơ sở
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('admin');
                    setCurrentTab('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-brand-800 cursor-pointer text-left"
                >
                  Quản trị thẩm định (Admin)
                </button>
              </li>
            </ul>

            {(siteContent.socialChannels || []).some((ch) => ch.isActive && ch.placements.includes('footer')) && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-extrabold text-brand-800 uppercase tracking-wider">
                  ✓ Kênh Social & SĐT Chính Thức
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(siteContent.socialChannels || [])
                    .filter((ch) => ch.isActive && ch.placements.includes('footer'))
                    .map((ch) => {
                      const iconTag =
                        ch.platform === 'tiktok'
                          ? '🎵 TikTok'
                          : ch.platform === 'facebook_page'
                          ? '📘 Fanpage FB'
                          : ch.platform === 'facebook_group'
                          ? '👥 Group FB'
                          : ch.platform === 'zalo_oa'
                          ? '💬 Zalo OA'
                          : ch.platform === 'zalo_group'
                          ? '🟢 Nhóm Zalo'
                          : ch.platform === 'phone_sos'
                          ? `🚨 ${ch.handleOrNumber}`
                          : ch.platform === 'phone_hotline'
                          ? `📞 ${ch.handleOrNumber}`
                          : ch.platform === 'youtube'
                          ? '▶️ YouTube'
                          : '📸 Instagram';
                      return (
                        <a
                          key={ch.id}
                          href={ch.url}
                          target={ch.url.startsWith('tel:') ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          title={`${ch.title} — ${ch.handleOrNumber}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            ch.platform === 'phone_sos'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{iconTag}</span>
                        </a>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{siteContent.footerConfig?.copyrightText || '© 2026 Tà Xùa Trip.'}</p>
          <p className="font-semibold text-brand-800">Đi thật. Biết trước.</p>
        </div>
      </footer>
    </div>
  );
}
