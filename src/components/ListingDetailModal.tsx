import { ONLINE_PAYMENT_ENABLED } from '../config/features';
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  MessageSquare,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Users,
  Cloud,
  ArrowRight,
  Gift,
  Send,
  Award,
  Building2,
  Tag,
  Clock,
  Utensils,
  Coffee,
  UploadCloud,
  Image as ImageIcon,
  Bus,
  Bike,
  Camera,
  Compass,
  Sparkles
} from 'lucide-react';
import {
  Listing,
  RoomType,
  Booking,
  Review,
  PromoVoucher,
  ServiceRewardSetting,
  ServicePackageItem,
  PaymentProof
} from '../types/index.ts';
import {
  formatVND,
  canBookingLeaveReview,
  calculateHomestayStayCost,
  calculateMotorbikeRentalCost,
  getHomestayRoomSummary
} from '../utils/rules.ts';
import { verificationLabel } from '../utils/listingDisplay.ts';
import { requestQuote, nightLabel, type QuoteResponse } from '../api/quotesApi.ts';
import { createHold, holdErrorAction, newIdempotencyKey } from '../api/holdsApi.ts';
import { readAttribution } from '../search/attribution.ts';
import { defaultStayDates, nightsBetween, todayInVietnam } from '../search/searchIntent.ts';

interface ListingDetailModalProps {
  /** N04.1: lựa chọn ngày/khách/phòng dùng chung với trang chủ và danh sách. */
  searchIntent?: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number };
  onChangeSearchIntent?: (patch: Partial<{ checkIn: string; checkOut: string; adults: number; children: number; rooms: number }>) => void;
  listing: Listing | null;
  reviews?: Review[];
  userBookings?: Booking[];
  vouchers?: PromoVoucher[];
  rewardSettings?: ServiceRewardSetting[];
  onClose: () => void;
  onBookSuccess: (booking: Booking) => void;
  onAddReview?: (review: Review, bookingId?: string) => void;
  onCompleteBooking?: (bookingId: string) => void;
  onOpenDirectChat?: (listing: Listing) => void;
  onClaimListing?: (listing: Listing) => void;
  /** N05.2: giữ phòng homestay cần đăng nhập */
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  reviews = [],
  userBookings = [],
  vouchers = [],
  rewardSettings = [],
  searchIntent,
  onChangeSearchIntent,
  onClose,
  onBookSuccess,
  onAddReview,
  onCompleteBooking,
  onOpenDirectChat,
  onClaimListing,
  isLoggedIn = false,
  onRequireLogin
}) => {
  if (!listing) return null;

  const allPhotos =
    listing.images && listing.images.length > 0
      ? listing.images
      : [listing.coverImage];
  const [activePhoto, setActivePhoto] = useState<string>(listing.coverImage);

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(
    listing.roomTypes && listing.roomTypes.length > 0 ? listing.roomTypes[0] : null
  );
  const [selectedPackage, setSelectedPackage] = useState<ServicePackageItem | null>(
    listing.servicePackages && listing.servicePackages.length > 0
      ? listing.servicePackages[0]
      : null
  );

  // N04.1: ngày lấy từ lựa chọn chung (không còn ngày cố định 14/11/2026); đổi ở đây thì báo ngược lên App.
  const fallbackDates = defaultStayDates();
  const [localCheckIn, setLocalCheckIn] = useState(searchIntent?.checkIn ?? fallbackDates.checkIn);
  const [localCheckOut, setLocalCheckOut] = useState(searchIntent?.checkOut ?? fallbackDates.checkOut);
  const checkIn = searchIntent?.checkIn ?? localCheckIn;
  const checkOut = searchIntent?.checkOut ?? localCheckOut;
  const setCheckIn = (v: string) => (onChangeSearchIntent ? onChangeSearchIntent({ checkIn: v }) : setLocalCheckIn(v));
  const setCheckOut = (v: string) => (onChangeSearchIntent ? onChangeSearchIntent({ checkOut: v }) : setLocalCheckOut(v));
  const [localStay, setLocalStay] = useState({ adults: searchIntent?.adults ?? 2, children: searchIntent?.children ?? 0, rooms: searchIntent?.rooms ?? 1 });
  const stayAdults = searchIntent?.adults ?? localStay.adults;
  const stayChildren = searchIntent?.children ?? localStay.children;
  const stayRooms = searchIntent?.rooms ?? localStay.rooms;
  const setStayGuests = (patch: Partial<{ adults: number; children: number; rooms: number }>) =>
    onChangeSearchIntent ? onChangeSearchIntent(patch) : setLocalStay((p) => ({ ...p, ...patch }));
  const [returnBeforeNoon, setReturnBeforeNoon] = useState<boolean>(true);
  const [serviceTimeSlot, setServiceTimeSlot] = useState<string>('05:30 - Khung giờ vàng săn mây');
  const [busPickupPoint, setBusPickupPoint] = useState<string>('Bến xe Mỹ Đình / Cầu Giấy (Hà Nội)');
  const [includeBusMotorbikeCombo, setIncludeBusMotorbikeCombo] = useState<boolean>(false);
  const [selectedBikeModel, setSelectedBikeModel] = useState<string>(
    listing.motorbikeFleet?.models?.[0] || 'Honda Wave Alpha 110cc'
  );

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(2);
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // N05.2: một khóa cho một lần đặt; bấm lại sau lỗi mạng gửi lại đúng khóa này để không tạo đơn trùng.
  const holdKeyRef = useRef<{ sig: string; key: string } | null>(null);

  useEffect(() => {
    setActivePhoto(listing.coverImage);
    setSelectedRoom(
      listing.roomTypes && listing.roomTypes.length > 0 ? listing.roomTypes[0] : null
    );
    setSelectedPackage(
      listing.servicePackages && listing.servicePackages.length > 0
        ? listing.servicePackages[0]
        : null
    );
    setSelectedMenuItemIds([]);
    setIncludeBusMotorbikeCombo(false);
  }, [listing.id]);

  // Eligible completed bookings that haven't been reviewed yet
  const eligibleBookings = userBookings.filter((b) =>
    canBookingLeaveReview(b.status, b.reviewed)
  );
  // Active bookings (confirmed / checked_in) that can be marked completed
  const activeBookings = userBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checked_in'
  );

  // Review Form State
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    eligibleBookings[0]?.id || ''
  );
  const [reviewerName, setReviewerName] = useState<string>(
    eligibleBookings[0]?.guestName || ''
  );
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (eligibleBookings.length > 0) {
      const current =
        eligibleBookings.find((b) => b.id === selectedBookingId) || eligibleBookings[0];
      setSelectedBookingId(current.id);
      if (!reviewerName.trim()) {
        setReviewerName(current.guestName);
      }
    } else {
      setSelectedBookingId('');
    }
  }, [userBookings.length, eligibleBookings.length]);

  // Promo Voucher & Admin Point Reward State
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<PromoVoucher | null>(null);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Payment Proof upload
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

  // Pre-ordered menu items if dining
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);

  // 1. Homestay: tổng tiền do server báo giá (N04.2), trình duyệt chỉ hiển thị.
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>('');
  const [quoteState, setQuoteState] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; quote?: QuoteResponse; code?: string; message?: string }>({ status: 'idle' });
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  useEffect(() => {
    if (listing.category !== 'homestay') return;
    if (!selectedRoom) {
      setQuoteState({ status: 'error', code: 'NOT_QUOTABLE', message: 'Cơ sở chưa cập nhật hạng phòng và giá trên Tà Xùa Trip.' });
      return;
    }
    const controller = new AbortController();
    setQuoteState((prev) => ({ ...prev, status: 'loading' }));
    const timer = setTimeout(() => {
      requestQuote(
        {
          listingId: listing.id,
          roomTypeId: selectedRoom.id,
          checkIn,
          checkOut,
          adults: stayAdults,
          children: stayChildren,
          rooms: stayRooms,
          voucherCode: appliedVoucherCode || undefined
        },
        controller.signal
      )
        .then((r) => setQuoteState(r.ok ? { status: 'ok', quote: r.quote } : { status: 'error', code: r.code, message: r.message }))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [listing.id, listing.category, selectedRoom?.id, checkIn, checkOut, stayAdults, stayChildren, stayRooms, appliedVoucherCode, quoteRefresh]);
  const stayQuote = quoteState.status === 'ok' ? quoteState.quote : undefined;
  const stayCost = { nights: stayQuote ? stayQuote.nights.length : Math.max(1, nightsBetween(checkIn, checkOut)) };

  // 2. Motorbike rental cost (with half-day before 12:00 noon support)
  const bikeDailyPrice = selectedPackage
    ? selectedPackage.price
    : listing.motorbikeFleet?.dailyRate || listing.minPrice || 0;
  const bikeCost = calculateMotorbikeRentalCost(
    checkIn,
    '08:00',
    checkOut,
    returnBeforeNoon ? '11:30' : '17:00',
    bikeDailyPrice,
    serviceQuantity
  );

  // 3. Dining pre-order total
  const diningPreorderTotal = (listing.menuItems || [])
    .filter((m) => selectedMenuItemIds.includes(m.id))
    .reduce((sum, item) => sum + item.price, 0);

  const calculateBaseTotal = () => {
    if (listing.category === 'homestay') {
      return stayQuote ? stayQuote.subtotal : 0;
    }
    if (listing.category === 'motorbike') {
      return bikeCost.totalCost;
    }
    if (listing.category === 'bus') {
      const unitFare = selectedPackage ? selectedPackage.price : listing.minPrice;
      const comboAddon = includeBusMotorbikeCombo
        ? Math.max(0, (listing.motorbikeFleet?.dailyRate || 0) - (listing.motorbikeFleet?.comboDiscountAmount || 0))
        : 0;
      return unitFare * serviceQuantity + comboAddon;
    }
    if (listing.category === 'restaurant' || listing.category === 'coffee') {
      return diningPreorderTotal > 0 ? diningPreorderTotal : listing.minPrice * guestsCount;
    }
    // tour, photo, costume, camera, taxi, rescue
    const pkgPrice = selectedPackage ? selectedPackage.price : listing.minPrice;
    return pkgPrice * serviceQuantity;
  };

  const baseTotal = calculateBaseTotal();
  let discountAmount = 0;
  if (listing.category === 'homestay') {
    discountAmount = stayQuote ? stayQuote.discount : 0;
  } else if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percent') {
      discountAmount = Math.round((baseTotal * appliedVoucher.discountValue) / 100);
    } else {
      discountAmount = appliedVoucher.discountValue;
    }
  }
  const totalAmount = Math.max(0, baseTotal - discountAmount);
  // Chưa có giá do cơ sở/admin nhập thì không cho đặt online, không tự gán giá (N03).
  const canBookOnline = baseTotal > 0;

  // Point rate from admin reward setting or default 8%
  const rewardSetting = rewardSettings.find((r) => r.listingId === listing.id);
  const earnRatePercent = rewardSetting ? rewardSetting.pointEarnRatePercent : 8;
  const earnedPoints = canBookOnline ? Math.max(10, Math.round((totalAmount * (earnRatePercent / 100)) / 1000)) : 0;

  const getConsoleLabels = () => {
    switch (listing.category) {
      case 'homestay':
        return {
          sectionJumpLabel: `Hạng phòng (${listing.roomTypes?.length || 0})`,
          consoleTitle: 'Đặt Phòng Homestay Trực Tuyến',
          consoleSubtitle: `Tính theo đêm (${stayCost.nights} đêm) • Giữ phòng xác thực`,
          selectedItemLabel: selectedRoom?.name || 'Phòng tiêu chuẩn',
          submitButtonLabel: `Xác Nhận Đặt Phòng (+${earnedPoints} Điểm Mây)`
        };
      case 'bus':
        return {
          sectionJumpLabel: `Loại vé & Combo (${listing.servicePackages?.length || 0})`,
          consoleTitle: 'Đặt Vé Xe & Combo Xe Máy Đi Kèm',
          consoleSubtitle: 'Giữ ghế trực tiếp với nhà xe • Ưu đãi -30k khi thuê kèm xe máy',
          selectedItemLabel: `${selectedPackage?.name || 'Vé xe tiêu chuẩn'} (${serviceQuantity} vé)${includeBusMotorbikeCombo ? ' + Combo Xe máy' : ''}`,
          submitButtonLabel: `Xác Nhận Đặt Vé Xe (+${earnedPoints} Điểm Mây)`
        };
      case 'motorbike':
        return {
          sectionJumpLabel: `Dòng xe (${listing.servicePackages?.length || 0})`,
          consoleTitle: 'Đặt Thuê Xe Máy Phượt Đèo',
          consoleSubtitle: `Tính linh hoạt (${bikeCost.daysLabel}) • Trả trước 12h trưa tính 0.5 ngày`,
          selectedItemLabel: `${selectedPackage?.name || selectedBikeModel} (${serviceQuantity} xe • ${bikeCost.daysLabel})`,
          submitButtonLabel: `Xác Nhận Thuê Xe Máy (+${earnedPoints} Điểm Mây)`
        };
      case 'restaurant':
      case 'coffee':
        return {
          sectionJumpLabel: `Thực đơn (${listing.menuItems?.length || 0} món)`,
          consoleTitle:
            listing.category === 'coffee'
              ? 'Đặt Bàn Săn Mây & Đồ Uống Trước'
              : 'Đặt Bàn Nhà Hàng & Món Đặc Sản',
          consoleSubtitle: 'Niêm yết giá minh bạch • Chuẩn bị sẵn không phải chờ đợi',
          selectedItemLabel:
            selectedMenuItemIds.length > 0
              ? `Đặt trước ${selectedMenuItemIds.length} món (${guestsCount} khách)`
              : `Đặt bàn ${guestsCount} khách`,
          submitButtonLabel: `Xác Nhận Đặt Bàn (+${earnedPoints} Điểm Mây)`
        };
      case 'tour':
        return {
          sectionJumpLabel: `Lịch trình Tour (${listing.servicePackages?.length || 0})`,
          consoleTitle: 'Đặt Tour Săn Mây & Porter Bản Địa',
          consoleSubtitle: 'Thổ địa dẫn đường an toàn • Bảo hiểm & hỗ trợ chụp ảnh',
          selectedItemLabel: `${selectedPackage?.name || 'Tour tiêu chuẩn'} (${serviceQuantity} khách)`,
          submitButtonLabel: `Xác Nhận Đặt Tour (+${earnedPoints} Điểm Mây)`
        };
      case 'photo':
        return {
          sectionJumpLabel: `Gói chụp ảnh (${listing.servicePackages?.length || 0})`,
          consoleTitle: 'Đặt Lịch Photographer Săn Mây',
          consoleSubtitle: 'Giao toàn bộ file gốc + Ảnh blend màu chất lượng cao',
          selectedItemLabel: `${selectedPackage?.name || 'Gói chụp săn mây'} (${serviceQuantity} gói)`,
          submitButtonLabel: `Xác Nhận Đặt Lịch Chụp (+${earnedPoints} Điểm Mây)`
        };
      case 'costume':
      case 'camera':
        return {
          sectionJumpLabel: `Gói thuê (${listing.servicePackages?.length || 0})`,
          consoleTitle:
            listing.category === 'costume'
              ? 'Đặt Thuê Trang Phục & Phụ Kiện'
              : 'Đặt Thuê Máy Ảnh & Flycam',
          consoleSubtitle: 'Giữ mẫu đúng lịch trình • Nhận từ sớm kịp đi săn mây',
          selectedItemLabel: `${selectedPackage?.name || 'Gói thuê'} (SL: ${serviceQuantity})`,
          submitButtonLabel: `Xác Nhận Giữ Đồ Thuê (+${earnedPoints} Điểm Mây)`
        };
      default:
        return {
          sectionJumpLabel: `Gói dịch vụ (${listing.servicePackages?.length || 0})`,
          consoleTitle: 'Đặt Dịch Vụ Trực Tuyến',
          consoleSubtitle: 'Xác nhận tức thì • Không phát sinh phụ phí ẩn',
          selectedItemLabel: `${selectedPackage?.name || 'Dịch vụ tiêu chuẩn'} (SL: ${serviceQuantity})`,
          submitButtonLabel: `Xác Nhận Đặt Dịch Vụ (+${earnedPoints} Điểm Mây)`
        };
    }
  };

  const labels = getConsoleLabels();

  useEffect(() => {
    if (listing.category !== 'homestay' || !appliedVoucherCode || !stayQuote) return;
    if (stayQuote.voucherError) setVoucherMessage({ type: 'error', text: stayQuote.voucherError.message });
    else if (stayQuote.discount > 0) setVoucherMessage({ type: 'success', text: `Đã áp dụng mã ${stayQuote.voucherCode}: giảm ${formatVND(stayQuote.discount)}.` });
  }, [stayQuote?.voucherError?.code, stayQuote?.discount, appliedVoucherCode]);

  const handleApplyVoucher = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;
    if (listing.category === 'homestay') {
      // Server kiểm điều kiện voucher trong báo giá; kết quả hiện ở voucherMessage bên dưới.
      setAppliedVoucherCode(code);
      return;
    }
    const found = vouchers.find(
      (v) => v.code.toUpperCase() === code && v.isActive
    );
    if (!found) {
      setVoucherMessage({ type: 'error', text: 'Mã voucher không hợp lệ hoặc đã hết hạn.' });
      setAppliedVoucher(null);
      return;
    }
    if (baseTotal < found.minBookingAmount) {
      setVoucherMessage({
        type: 'error',
        text: `Mã này chỉ áp dụng cho đơn từ ${formatVND(found.minBookingAmount)}.`
      });
      setAppliedVoucher(null);
      return;
    }
    setAppliedVoucher(found);
    const disc =
      found.discountType === 'percent'
        ? Math.round((baseTotal * found.discountValue) / 100)
        : found.discountValue;
    setVoucherMessage({
      type: 'success',
      text: `Đã áp dụng mã ${found.code}: Giảm ${formatVND(disc)}!`
    });
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBookOnline) return;
    if (listing.category === 'homestay' && stayQuote && Date.parse(stayQuote.expiresAt) < Date.now()) {
      setBookingError('Báo giá đã hết hạn 30 phút, đang lấy lại giá mới. Vui lòng kiểm tra rồi bấm đặt lại.');
      setQuoteRefresh((n) => n + 1);
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setBookingError('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ!');
      return;
    }
    setBookingError(null);
    if (listing.category === 'homestay') {
      void submitHomestayHold();
      return;
    }
    setIsSubmitting(true);

    setTimeout(() => {
      const depositAmount = Math.round(totalAmount * 0.3);
      const proof: PaymentProof | undefined = paymentProofUrl
        ? {
            imageUrl: paymentProofUrl,
            amountPaid: depositAmount,
            amountTransferred: depositAmount,
            uploadedAt: new Date().toISOString(),
            note: 'Chuyển cọc phòng/dịch vụ'
          }
        : undefined;

      const selectedMenuNames = (listing.menuItems || [])
        .filter((m) => selectedMenuItemIds.includes(m.id))
        .map((m) => m.name)
        .join(', ');

      const newBooking: Booking = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        listingId: listing.id,
        listingTitle: listing.title,
        category: listing.category,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        checkInDate: checkIn,
        checkOutDate:
          listing.category === 'homestay' || listing.category === 'motorbike'
            ? checkOut
            : checkIn,
        quoteId: listing.category === 'homestay' ? stayQuote?.id : undefined,
        guestsCount:
          listing.category === 'homestay'
            ? stayAdults + stayChildren
            : listing.category === 'restaurant' ||
          listing.category === 'coffee'
            ? guestsCount
            : serviceQuantity,
        roomName: labels.selectedItemLabel,
        pricingMode:
          listing.category === 'homestay'
            ? 'per_night'
            : listing.category === 'motorbike'
            ? returnBeforeNoon
              ? 'half_day_before_noon'
              : 'per_day'
            : 'per_trip_or_package',
        motorbikeRentalDetails:
          listing.category === 'motorbike'
            ? {
                pickupDate: checkIn,
                pickupHour: '07:00',
                returnDate: checkOut,
                returnBeforeNoon,
                calculatedDays: bikeCost.calculatedDays,
                bikeModel: selectedBikeModel,
                quantity: serviceQuantity
              }
            : undefined,
        comboMotorbikeIncluded:
          listing.category === 'bus' ? includeBusMotorbikeCombo : undefined,
        totalAmount,
        discountApplied: discountAmount > 0 ? discountAmount : undefined,
        voucherCodeApplied:
          listing.category === 'homestay' ? stayQuote?.voucherCode || undefined : appliedVoucher ? appliedVoucher.code : undefined,
        pointsEarned: earnedPoints,
        status: 'confirmed',
        paymentStatus: paymentProofUrl ? 'proof_uploaded' : 'unpaid',
        paymentProof: proof,
        reviewed: false,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-CONFIRMED-${Date.now()}`,
        platformFee: 50000,
        feeCharged: false,
        notes: [
          listing.category !== 'homestay' ? `Khung giờ: ${serviceTimeSlot}` : '',
          listing.category === 'bus' ? `Điểm đón: ${busPickupPoint}` : '',
          selectedMenuNames ? `Món đặt trước: ${selectedMenuNames}` : '',
          notes
        ]
          .filter(Boolean)
          .join(' • '),
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setIsSubmitting(false);
      onBookSuccess(newBooking);
    }, 250);
  };

  // N05.2: homestay giữ phòng trên máy chủ 30 phút; tổng tiền và cọc lấy từ báo giá server.
  const submitHomestayHold = async () => {
    if (!stayQuote) return;
    const token = typeof localStorage === 'undefined' ? '' : localStorage.getItem('taxua_session_token') || '';
    if (!isLoggedIn || !token) {
      setBookingError('Vui lòng đăng nhập để giữ phòng. Thông tin bạn đã nhập vẫn được giữ nguyên.');
      onRequireLogin?.();
      return;
    }
    const guestNote = notes.trim();
    const sig = [stayQuote.id, guestName.trim(), guestPhone.trim(), guestNote].join('|');
    if (holdKeyRef.current?.sig !== sig) holdKeyRef.current = { sig, key: newIdempotencyKey() };
    setIsSubmitting(true);
    const r = await createHold(
      {
        quoteId: stayQuote.id,
        idempotencyKey: holdKeyRef.current.key,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestNote: guestNote || undefined,
        attribution: readAttribution(localStorage),
      },
      token
    );
    setIsSubmitting(false);
    if (!r.ok) {
      const action = holdErrorAction(r.status, r.code);
      setBookingError(r.message);
      if (action === 'login') onRequireLogin?.();
      if (action === 'refresh_quote') {
        holdKeyRef.current = null;
        setQuoteRefresh((n) => n + 1);
      }
      return;
    }
    holdKeyRef.current = null;
    const b = r.booking;
    onBookSuccess({
      id: b.bookingCode,
      serverBookingId: b.id,
      quoteId: b.quoteId || undefined,
      listingId: listing.id,
      listingTitle: listing.title,
      category: listing.category,
      guestName: b.guestName,
      guestPhone: b.guestPhone,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      guestsCount: (b.adults || 0) + (b.children || 0),
      roomName: b.roomName || labels.selectedItemLabel,
      pricingMode: 'per_night',
      totalAmount: b.totalAmount,
      discountApplied: b.discount ? b.discount : undefined,
      voucherCodeApplied: b.voucherCode || undefined,
      depositAmount: b.depositAmount,
      holdExpiresAt: b.holdExpiresAt || undefined,
      pointsEarned: earnedPoints,
      status: 'pending',
      paymentStatus: 'unpaid',
      reviewed: false,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(b.bookingCode)}`,
      platformFee: 50000,
      feeCharged: false,
      notes: guestNote || undefined,
      createdAt: b.createdAt.replace('T', ' ').slice(0, 16),
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (eligibleBookings.length === 0) {
      setReviewError('Chỉ khách hàng đã hoàn tất đơn đặt dịch vụ mới có thể gửi đánh giá.');
      return;
    }
    if (!reviewerName.trim()) {
      setReviewError('Vui lòng nhập tên hiển thị của bạn.');
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewError('Vui lòng nhập nội dung bình luận (tối thiểu 5 ký tự).');
      return;
    }

    const targetBooking =
      eligibleBookings.find((b) => b.id === selectedBookingId) || eligibleBookings[0];

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      listingId: listing.id,
      bookingId: targetBooking?.id,
      reviewerName: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      roomName: targetBooking?.roomName || labels.selectedItemLabel,
      createdAt: new Date().toISOString().slice(0, 10),
      isVerifiedStay: true
    };

    setReviewError(null);
    if (onAddReview) {
      onAddReview(newReview, targetBooking?.id);
    }
    setReviewComment('');
    setReviewRating(5);
    setReviewSuccessMessage(
      'Cảm ơn bạn! Đánh giá xác thực đã được đăng công khai và cộng +50 Điểm Mây.'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-900">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-brand-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Header */}
        <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-slate-900">
          <img
            src={activePhoto}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041e42]/95 via-[#041e42]/40 to-transparent" />

          {/* Badges on Gallery */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-2.5 sm:gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                {listing.hasCloudView && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
                    <Cloud className="w-3.5 h-3.5" />
                    {listing.verificationTier >= 2 ? 'View biển mây đã xác minh' : 'View biển mây (cơ sở tự khai)'}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-brand-800 shadow-xs"
                  title={verificationLabel(listing).detail}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  {listing.verificationTier >= 2 ? `Cấp ${listing.verificationTier} · ` : ''}
                  {verificationLabel(listing).title}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-black/45 text-white">
                  {verificationLabel(listing).detail}
                </span>
              </div>
              <h2
                id="listing-detail-title"
                className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug"
              >
                {listing.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-md text-xs">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {listing.reviewCount > 0 ? (
                <>
                  <span className="font-extrabold text-brand-800 text-sm">{listing.rating}</span>
                  <span className="text-slate-600 font-medium">({listing.reviewCount} đánh giá thực tế)</span>
                </>
              ) : (
                <span className="text-slate-700 font-semibold">Chưa có đánh giá</span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Strip if multiple photos exist */}
        {allPhotos.length > 1 && (
          <div className="bg-slate-900 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-800">
            {allPhotos.slice(0, 8).map((photoUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActivePhoto(photoUrl)}
                className={`relative w-16 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activePhoto === photoUrl
                    ? 'border-teal-400 scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={photoUrl}
                  alt={`${listing.title} ảnh ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Mobile Quick-Jump Bar (< lg) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-service-options-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-brand-800 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {labels.sectionJumpLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-reviews-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-brand-800 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            ⭐ Đánh giá ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('listing-booking-console')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="ml-auto px-3.5 py-1.5 rounded-full bg-brand-800 text-white text-xs font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đặt ngay ↓
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Details, Category-Matched Options, & Verified Guest Reviews */}
          <div className="lg:col-span-7 space-y-6">
            {/* Address & Public Contact Box */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4">
              <div className="flex items-start gap-2.5 text-slate-700 text-xs mb-3 font-medium">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  {listing.address} ({listing.area})
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/80 space-y-3 text-xs">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    4 Kênh Liên Hệ Trực Tiếp Với Cơ Sở:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenDirectChat) onOpenDirectChat(listing);
                      }}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-teal-700" />
                      <span>Chat Web</span>
                    </button>

                    <a
                      href={`tel:${listing.phone.replace(/\s+/g, '')}`}
                      className="bg-slate-100 hover:bg-slate-200 text-brand-800 border border-slate-200 px-3 py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-700" />
                      <span>{listing.phone}</span>
                    </a>

                    <a
                      href={`https://zalo.me/${listing.zalo.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Zalo</span>
                    </a>

                    <a
                      href={
                        listing.facebook ||
                        `https://facebook.com/search/top?q=${encodeURIComponent(listing.title)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="font-extrabold text-indigo-600">f</span>
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>

                {onClaimListing && (
                  <button
                    type="button"
                    onClick={() => onClaimListing(listing)}
                    className="w-full text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl py-2 px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>Bạn Là Chủ Cơ Sở Này? Đăng Ký Thành Viên Để Xác Nhận Uy Tín →</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 mb-2">
                {listing.verificationTier === 3 ? 'Hồ sơ thẩm định thực địa & Trải nghiệm' : 'Giới thiệu cơ sở'}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* ========================================================================= */}
            {/* CATEGORY-MATCHED OPTIONS SECTION                                          */}
            {/* ========================================================================= */}
            <div id="listing-service-options-section" className="space-y-4">
              {/* 1. QUÁN ĂN & CAFE: Giờ Mở/Đóng Cửa & Thực Đơn Món */}
              {(listing.category === 'restaurant' ||
                listing.category === 'coffee' ||
                (listing.menuItems && listing.menuItems.length > 0)) && (
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                        {listing.category === 'coffee' ? (
                          <Coffee className="w-4 h-4 text-amber-700" />
                        ) : (
                          <Utensils className="w-4 h-4 text-teal-700" />
                        )}
                        <span>Thời Gian Phục Vụ & Thực Đơn Niêm Yết</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {listing.openingHours
                          ? `Giờ đón khách: ${listing.openingHours.openTime} - ${listing.openingHours.closeTime} • ${listing.openingHours.serviceNote || ''}`
                          : 'Mở cửa từ sáng sớm đón bình minh săn mây đến đêm muộn'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Đang mở cửa đón khách</span>
                    </span>
                  </div>

                  {listing.menuItems && listing.menuItems.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">
                        Chạm để chọn món đặt trước (Chuẩn bị sẵn khi bạn tới bàn):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {listing.menuItems.map((item) => {
                          const isChosen = selectedMenuItemIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isChosen) {
                                  setSelectedMenuItemIds(
                                    selectedMenuItemIds.filter((id) => id !== item.id)
                                  );
                                } else {
                                  setSelectedMenuItemIds([...selectedMenuItemIds, item.id]);
                                }
                              }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                                isChosen
                                  ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-600'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-brand-800 text-xs">
                                    {item.name}
                                  </span>
                                  {item.isBestSeller && (
                                    <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                      ⭐ Best Seller
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {item.unit}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-teal-800 block tabular-nums">
                                  {formatVND(item.price)}
                                </span>
                                <span
                                  className={`text-xs font-bold mt-1 inline-block ${
                                    isChosen ? 'text-teal-700' : 'text-slate-400'
                                  }`}
                                >
                                  {isChosen ? '✓ Đã chọn' : '+ Đặt trước'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. HOMESTAY: Room Types Selector */}
              {listing.category === 'homestay' &&
                listing.roomTypes &&
                listing.roomTypes.length > 0 && (
                  <div id="listing-rooms-section">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                        Chọn Hạng Phòng (Trang bị & View chi tiết)
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Xác minh: {listing.updatedCalendarDate}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {listing.roomTypes.map((room) => {
                        const isSelected = selectedRoom?.id === room.id;
                        const summary = getHomestayRoomSummary(room);
                        return (
                          <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50/70 border-teal-600 shadow-xs ring-1 ring-teal-600'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-extrabold text-brand-800 text-sm">
                                    {room.name}
                                  </h4>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                                    {summary.viewText}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-slate-400" />
                                    {summary.capacityText}
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    {room.availableRooms > 0 ? `Còn ${room.availableRooms} phòng trống` : 'Hết phòng các đêm đã chọn'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {summary.features.map((feat, i) => (
                                    <span
                                      key={i}
                                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                                    >
                                      ✓ {feat}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-right sm:shrink-0">
                                <div className="text-base font-extrabold text-brand-800 tabular-nums">
                                  {formatVND(room.priceWeekend)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Ngày thường: {formatVND(room.priceWeekday)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* 3. NHÀ XE, XE MÁY, TOUR, PHOTO, TRANG PHỤC, MÁY ẢNH, TAXI, CỨU HỘ: Service Packages Selector */}
              {listing.category !== 'homestay' &&
                listing.category !== 'restaurant' &&
                listing.category !== 'coffee' &&
                listing.servicePackages &&
                listing.servicePackages.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                        {listing.category === 'bus' ? (
                          <Bus className="w-4 h-4 text-teal-700" />
                        ) : listing.category === 'motorbike' ? (
                          <Bike className="w-4 h-4 text-teal-700" />
                        ) : listing.category === 'photo' || listing.category === 'camera' ? (
                          <Camera className="w-4 h-4 text-teal-700" />
                        ) : (
                          <Compass className="w-4 h-4 text-teal-700" />
                        )}
                        <span>Chọn Gói Dịch Vụ & Bảng Giá Niêm Yết</span>
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Giá chính chủ · Không phụ phí
                      </span>
                    </div>

                    <div className="space-y-3">
                      {listing.servicePackages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50/70 border-teal-600 shadow-xs ring-1 ring-teal-600'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-extrabold text-brand-800 text-sm">
                                    {pkg.name}
                                  </h4>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                    Còn {pkg.availableCount} suất trống
                                  </span>
                                </div>
                                {pkg.durationNote && (
                                  <p className="text-xs text-slate-600 font-medium">
                                    ⏱️ {pkg.durationNote}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {(pkg.includedFeatures || []).map((feat, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium border border-slate-200"
                                    >
                                      ✓ {feat}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="text-right sm:shrink-0">
                                <div className="text-base font-extrabold text-brand-800 tabular-nums">
                                  {formatVND(pkg.price)}
                                </div>
                                <div className="text-xs text-slate-500">
                                  / {pkg.unit}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bus + Motorbike Combo Card */}
                    {listing.category === 'bus' && listing.motorbikeFleet && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                            <Sparkles className="w-3 h-3" />
                            <span>Combo Nhà Xe + Thuê Xe Máy Đi Kèm</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                            Nhận xe máy ngay khi xuống xe khách tại Tà Xùa (Giảm ngay{' '}
                            {formatVND(listing.motorbikeFleet.comboDiscountAmount || listing.motorbikeFleet.comboDiscountPerBike || 30000)})
                          </h4>
                          <p className="text-xs text-slate-600">
                            Kho xe nhà xe hiện còn{' '}
                            <strong>
                              {Math.max(
                                0,
                                listing.motorbikeFleet.totalBikes -
                                  (listing.motorbikeFleet.bookedOnWeb || 0) -
                                  (listing.motorbikeFleet.rentedOffline ?? listing.motorbikeFleet.rentedOfflineCount ?? 0)
                              )}{' '}
                              xe trống
                            </strong>{' '}
                            ({(listing.motorbikeFleet.models || ['Honda Wave Alpha 110cc', 'Honda Blade 110cc']).join(', ')}). Trả trước 12h trưa tính
                            nửa ngày.
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-amber-400 text-xs font-extrabold text-brand-800 cursor-pointer shrink-0 shadow-2xs">
                          <input
                            type="checkbox"
                            checked={includeBusMotorbikeCombo}
                            onChange={(e) => setIncludeBusMotorbikeCombo(e.target.checked)}
                            className="rounded border-slate-300 text-brand-800"
                          />
                          <span>Gộp thuê xe máy (+{formatVND((listing.motorbikeFleet.dailyRate || listing.motorbikeFleet.pricePerDay || 150000) - (listing.motorbikeFleet.comboDiscountAmount || listing.motorbikeFleet.comboDiscountPerBike || 30000))})</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Benefits Box */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs">
              <h4 className="font-extrabold text-brand-800 mb-2.5 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-teal-700" />
                <span>Quyền lợi bảo vệ khách hàng trên Tà Xùa Trip:</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    {canBookOnline ? <>Tích lũy <strong>+{earnedPoints} Điểm Mây</strong> đổi ưu đãi</> : 'Tích Điểm Mây khi đặt online (khi cơ sở đã có giá)'}
                  </span>
                </li>
                {ONLINE_PAYMENT_ENABLED && (
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Lưu bằng chứng chuyển khoản (UNC) chống tranh chấp</span>
                </li>
                )}
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Đúng giá niêm yết • Không qua cò mồi trung gian</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Được để lại đánh giá xác thực gắn mã đơn</span>
                </li>
              </ul>
            </div>

            {/* VERIFIED GUEST REVIEWS SECTION */}
            <div
              id="listing-reviews-section"
              className="pt-6 border-t border-slate-200 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block mb-1">
                    BẰNG CHỨNG TRẢI NGHIỆM THỰC TẾ
                  </span>
                  <h3 className="text-lg font-extrabold text-brand-800 flex items-center gap-2">
                    <span>Đánh giá từ khách đã sử dụng dịch vụ</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {listing.reviewCount > 0 ? `${listing.rating} (${listing.reviewCount})` : 'Chưa có'}
                    </span>
                  </h3>
                </div>
              </div>

              {eligibleBookings.length > 0 ? (
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-[#f8fafc] border border-teal-200/90 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                        <Award className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-brand-800">
                          Viết đánh giá trải nghiệm đã hoàn tất của bạn
                        </h4>
                        <p className="text-xs text-slate-600">
                          Đơn dịch vụ của bạn tại cơ sở này đã hoàn tất. Hãy chia sẻ trải nghiệm thực tế!
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full shrink-0">
                      +50 Điểm Mây
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="review-author-name"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Tên người đánh giá *
                      </label>
                      <input
                        id="review-author-name"
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Nhập họ tên của bạn"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Đánh giá sao (1 - 5 sao) *
                      </label>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoveredStar ?? reviewRating) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoveredStar(star)}
                              onMouseLeave={() => setHoveredStar(null)}
                              aria-label={`Chấm ${star} sao`}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  active
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs font-extrabold text-brand-800">
                          {reviewRating}/5 sao
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review-comment-input"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Bình luận thực tế *
                    </label>
                    <textarea
                      id="review-comment-input"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm thực tế của bạn sau chuyến đi..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                      required
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs font-semibold text-rose-600">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    className="bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Đánh Giá Xác Thực</span>
                  </button>
                </form>
              ) : (
                <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-800 mb-0.5">
                      Chỉ mở đánh giá cho khách đã hoàn tất đơn dịch vụ
                    </p>
                    <p className="text-slate-500">
                      {reviewSuccessMessage ||
                        'Để chống seeding ảo, hệ thống chỉ cho phép viết đánh giá khi đơn đặt chuyển sang trạng thái Hoàn tất (Completed).'}
                    </p>
                  </div>

                  {activeBookings.length > 0 && onCompleteBooking && (
                    <button
                      type="button"
                      onClick={() => onCompleteBooking(activeBookings[0].id)}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Hoàn tất đơn #{activeBookings[0].id} để đánh giá
                    </button>
                  )}
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                  Chưa có bình luận văn bản nào cho cơ sở này. Hãy là người đầu tiên hoàn tất trải nghiệm và để lại đánh giá!
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-800 text-white font-extrabold text-xs flex items-center justify-center uppercase">
                            {rev.reviewerName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-brand-800">
                                {rev.reviewerName}
                              </span>
                              {rev.isVerifiedStay && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Đã xác thực {rev.bookingId ? `(#${rev.bookingId})` : ''}
                                </span>
                              )}
                            </div>
                            {rev.roomName && (
                              <p className="text-xs text-slate-500">{rev.roomName}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{rev.createdAt}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Form: Service-Adaptive Booking Console */}
          <div id="listing-booking-console" className="lg:col-span-5">
            <div className="bg-[#f8fafc] border border-slate-200 rounded-3xl p-5 sm:p-6 sticky top-6">
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-brand-800 mb-1">
                    {labels.consoleTitle}
                  </h3>
                  <p className="text-xs text-slate-500">{labels.consoleSubtitle}</p>
                </div>

                {/* A. HOMESTAY DATES & GUESTS */}
                {listing.category === 'homestay' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày nhận phòng
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          min={todayInVietnam()}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày trả phòng
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['adults', 'Người lớn', stayAdults, 1, 30],
                        ['children', 'Trẻ em', stayChildren, 0, 20],
                        ['rooms', 'Số phòng', stayRooms, 1, 10]
                      ] as const).map(([key, label, value, min, max]) => (
                        <div key={key}>
                          <label htmlFor={`stay-${key}`} className="block text-xs font-bold text-slate-700 mb-1">
                            {label}
                          </label>
                          <input
                            id={`stay-${key}`}
                            type="number"
                            inputMode="numeric"
                            min={min}
                            max={max}
                            value={value}
                            onChange={(e) => setStayGuests({ [key]: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-900 focus:outline-none focus:border-brand-800"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">Trẻ em tính vào sức chứa phòng; không có giá trẻ em riêng.</p>
                  </>
                )}

                {/* B. MOTORBIKE RENTAL: PICKUP/RETURN + HALF-DAY BEFORE 12:00 NOON */}
                {listing.category === 'motorbike' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày nhận xe
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-800"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày trả xe
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          min={checkIn}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <label className="flex items-center justify-between gap-2 text-xs font-bold text-amber-950 cursor-pointer">
                        <span>Trả xe trước 12:00 trưa ngày về (Tính 0.5 ngày)</span>
                        <input
                          type="checkbox"
                          checked={returnBeforeNoon}
                          onChange={(e) => setReturnBeforeNoon(e.target.checked)}
                          className="rounded border-amber-400 text-brand-800"
                        />
                      </label>
                      <p className="text-xs text-amber-800">
                        Thời gian tính phí hiện tại: <strong>{bikeCost.daysLabel}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Dòng xe ưu tiên
                        </label>
                        <select
                          value={selectedBikeModel}
                          onChange={(e) => setSelectedBikeModel(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                        >
                          {(
                            listing.motorbikeFleet?.models || [
                              'Honda Wave Alpha 110cc',
                              'Honda Blade 2025',
                              'Honda Winner X 150cc',
                              'Cào Cào XR150L'
                            ]
                          ).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số lượng xe thuê
                        </label>
                        <select
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {n} xe máy
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* C. BUS OPERATOR: DEPARTURE DATE, TIME, PICKUP POINT, SEATS */}
                {listing.category === 'bus' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày khởi hành
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số lượng vé / ghế
                        </label>
                        <select
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} ghế
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Chuyến giờ xuất bến
                      </label>
                      <select
                        value={serviceTimeSlot}
                        onChange={(e) => setServiceTimeSlot(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                      >
                        <option value="06:30 Sáng (Đến Tà Xùa 12:00 trưa)">
                          06:30 Sáng (Đến Tà Xùa 12:00 trưa)
                        </option>
                        <option value="13:00 Chiều (Ngắm hoàng hôn đèo)">
                          13:00 Chiều (Ngắm hoàng hôn đèo)
                        </option>
                        <option value="22:00 Đêm (Ngủ đêm trên xe, 04:30 đón bình minh)">
                          22:00 Đêm (Ngủ đêm trên xe, 04:30 đón bình minh)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Điểm đón khách dọc lộ trình
                      </label>
                      <select
                        value={busPickupPoint}
                        onChange={(e) => setBusPickupPoint(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                      >
                        <option value="Bến xe Mỹ Đình / Cầu Giấy (Hà Nội)">
                          Bến xe Mỹ Đình / Cầu Giấy (Hà Nội)
                        </option>
                        <option value="Sân bay Nội Bài (Sảnh E)">
                          Sân bay Nội Bài (Sảnh E)
                        </option>
                        <option value="Đại Lộ Thăng Long - Ngã 4 Hòa Lạc / Sơn Tây">
                          Đại Lộ Thăng Long - Ngã 4 Hòa Lạc / Sơn Tây
                        </option>
                        <option value="Ngã 3 Thanh Sơn / Phù Yên / Bắc Yên">
                          Ngã 3 Thanh Sơn / Phù Yên / Bắc Yên
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {/* D. RESTAURANT & COFFEE: TABLE RESERVATION DATE, TIME, GUESTS */}
                {(listing.category === 'restaurant' || listing.category === 'coffee') && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày đặt bàn
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số khách ngồi bàn
                        </label>
                        <select
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                        >
                          <option value={1}>1 khách</option>
                          <option value={2}>2 khách (Bàn view ban công)</option>
                          <option value={4}>4 khách (1 nồi lẩu / bàn nhóm)</option>
                          <option value={6}>6 - 8 khách (Bàn gia đình)</option>
                          <option value={10}>Đoàn 10+ khách</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Khung giờ nhận bàn
                      </label>
                      <select
                        value={serviceTimeSlot}
                        onChange={(e) => setServiceTimeSlot(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                      >
                        <option value="05:30 - 07:30 (Đón bình minh săn mây)">
                          05:30 - 07:30 (Đón bình minh săn mây)
                        </option>
                        <option value="11:30 - 13:30 (Bữa trưa đặc sản)">
                          11:30 - 13:30 (Bữa trưa đặc sản)
                        </option>
                        <option value="16:30 - 18:00 (Ngắm hoàng hôn Đỉnh Gió)">
                          16:30 - 18:00 (Ngắm hoàng hôn Đỉnh Gió)
                        </option>
                        <option value="19:00 - 21:30 (Lẩu gà đen & Nướng tối)">
                          19:00 - 21:30 (Lẩu gà đen & Nướng tối)
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {/* E. TOUR, PHOTO, COSTUME, CAMERA, TAXI, RESCUE */}
                {![
                  'homestay',
                  'motorbike',
                  'bus',
                  'restaurant',
                  'coffee'
                ].includes(listing.category) && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ngày sử dụng dịch vụ
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số lượng ({selectedPackage?.unit || 'suất'})
                        </label>
                        <select
                          value={serviceQuantity}
                          onChange={(e) => setServiceQuantity(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} {selectedPackage?.unit || 'suất'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Khung giờ bắt đầu
                      </label>
                      <select
                        value={serviceTimeSlot}
                        onChange={(e) => setServiceTimeSlot(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                      >
                        <option value="05:00 - 08:00 (Khung giờ vàng săn mây bình minh)">
                          05:00 - 08:00 (Khung giờ vàng săn mây bình minh)
                        </option>
                        <option value="08:30 - 12:00 (Buổi sáng nắng đẹp)">
                          08:30 - 12:00 (Buổi sáng nắng đẹp)
                        </option>
                        <option value="14:00 - 18:00 (Buổi chiều & Hoàng hôn)">
                          14:00 - 18:00 (Buổi chiều & Hoàng hôn)
                        </option>
                        <option value="Nhận từ tối hôm trước (20:00)">
                          Nhận từ tối hôm trước (20:00)
                        </option>
                      </select>
                    </div>
                  </>
                )}

                {/* Guest Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên khách đặt *
                  </label>
                  <input
                    id="booking-guest-name-input"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại nhận mã QR & Zalo xác nhận *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú yêu cầu riêng (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú điểm đón tại homestay, size váy, món ăn kiêng..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800"
                  />
                </div>

                {/* Promo Voucher Code Field */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-teal-700" />
                      <span>Mã Voucher giảm giá (nếu có)</span>
                    </span>
                    <span className="text-xs text-slate-400">Gợi ý: TAXUA10, SANMAY50K</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã: TAXUA10 / SANMAY50K"
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-800 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-brand-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-brand-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {voucherMessage && (
                    <p
                      className={`text-xs mt-1.5 font-semibold ${
                        voucherMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {voucherMessage.text}
                    </p>
                  )}
                </div>

                {/* Đính kèm biên lai: tắt cho tới khi có thanh toán thật (N06, quyết định D03) */}
                {ONLINE_PAYMENT_ENABLED && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Đính kèm ảnh chuyển khoản (Cọc 30%)</span>
                    </span>
                    <span className="text-xs text-slate-400">Bảo vệ quyền lợi</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lưu ảnh UNC chuyển khoản trên hệ thống để đối tác xác nhận nhận tiền và bảo vệ khiếu nại.
                  </p>

                  {paymentProofUrl ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold">Đã đính kèm ảnh biên lai chuyển khoản</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentProofUrl(null)}
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Gỡ ảnh
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentProofUrl(
                          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
                        )
                      }
                      className="w-full py-2.5 px-3 border border-dashed border-teal-600/40 hover:border-teal-600 rounded-xl text-xs font-bold text-teal-800 bg-teal-50/50 hover:bg-teal-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-teal-700" />
                      <span>Tải Ảnh Biên Lai Chuyển Khoản Cọc (1 Chạm)</span>
                    </button>
                  )}
                </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                  {listing.category === 'homestay' && quoteState.status === 'loading' && (
                    <p className="text-slate-500" role="status">Đang tính giá theo từng đêm…</p>
                  )}
                  {listing.category === 'homestay' && quoteState.status === 'error' && quoteState.code !== 'NOT_QUOTABLE' && (
                    <p className="rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-danger-700" role="alert">
                      {quoteState.message}
                    </p>
                  )}
                  {listing.category === 'homestay' && quoteState.code === 'NOT_QUOTABLE' && listing.minPrice > 0 && (
                    <p className="text-slate-600">
                      Giá tham khảo từ nguồn công khai: từ {formatVND(listing.minPrice)}/đêm (chưa xác minh).
                    </p>
                  )}
                  {stayQuote && (
                    <ul className="space-y-1 pb-1.5 border-b border-dashed border-slate-200" aria-label="Giá từng đêm">
                      {stayQuote.nights.map((n) => (
                        <li key={n.date} className="flex justify-between gap-2 text-slate-600">
                          <span>{nightLabel(n)}</span>
                          <span className="tabular-nums text-slate-900">
                            {formatVND(n.pricePerRoom)}
                            {stayQuote.rooms > 1 ? ` × ${stayQuote.rooms} phòng` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-between text-slate-600 gap-2">
                    <span className="shrink-0">Dịch vụ đã chọn:</span>
                    <span className="text-slate-900 font-bold text-right">
                      {labels.selectedItemLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Giá gốc niêm yết:</span>
                    <span className="text-slate-900 font-bold tabular-nums">
                      {formatVND(baseTotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Giảm giá Voucher ({listing.category === 'homestay' ? stayQuote?.voucherCode : appliedVoucher?.code}):</span>
                      <span>-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tích điểm thành viên ({earnRatePercent}%):</span>
                    <span className="text-teal-700 font-extrabold tabular-nums">
                      +{earnedPoints} Điểm Mây
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-200">
                    <span className="text-brand-800">Tổng thanh toán:</span>
                    <span className="text-teal-700 text-lg tabular-nums">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <p className="text-xs font-bold text-rose-600">{bookingError}</p>
                )}

                {!canBookOnline && (
                  <p role="note" className="rounded-control border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
                    Cơ sở chưa cập nhật {listing.category === 'homestay' ? 'hạng phòng và giá' : 'giá dịch vụ'} trên Tà Xùa Trip nên chưa
                    đặt online được. Vui lòng liên hệ trực tiếp qua số điện thoại hoặc Zalo ở trên.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !canBookOnline}
                  className="w-full min-h-[48px] bg-brand-800 hover:bg-brand-700 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang xử lý đơn đặt...</span>
                  ) : (
                    <>
                      <span>
                        {!canBookOnline
                          ? 'Chưa đặt online được'
                          : listing.category === 'homestay' && !isLoggedIn
                          ? 'Đăng nhập để giữ phòng'
                          : labels.submitButtonLabel}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-xs text-center text-slate-500">
                  🔒 Thông tin được bảo mật và chuyển thẳng đến chủ cơ sở
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Bottom Booking Bar (< lg) */}
        <div className="lg:hidden sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_24px_rgba(7,49,97,0.08)]">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500 truncate">
              {labels.selectedItemLabel}
            </div>
            <div className="text-base font-extrabold text-brand-800 tabular-nums">
              {formatVND(totalAmount)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('listing-booking-console');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              const input = document.getElementById('booking-guest-name-input');
              if (input) setTimeout(() => input.focus(), 350);
            }}
            className="min-h-[44px] bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Đặt ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
