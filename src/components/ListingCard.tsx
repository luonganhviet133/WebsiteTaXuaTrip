import React from 'react';
import {
  Star,
  MapPin,
  Heart,
  Sparkles,
  MessageSquare,
  Camera,
  Clock,
  CheckCircle2,
  Scale,
  Users,
  BedDouble
} from 'lucide-react';
import { Listing } from '../types/index.ts';
import { formatVND } from '../utils/rules.ts';
import { verificationLabel } from '../utils/listingDisplay.ts';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  lowDataMode?: boolean;
  onOpenDirectChat?: (listing: Listing) => void;
  onClaimListing?: (listing: Listing) => void;
  onOpenSeatMap?: (listing: Listing) => void;
  layoutMode?: 'grid' | 'horizontal';
  stayAvailabilityBadge?: {
    availableRoomsCount: number;
    dateLabel: string;
    nightsCount: number;
  };
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelect,
  isSaved = false,
  onToggleSave,
  isCompared = false,
  onToggleCompare,
  lowDataMode = false,
  onOpenDirectChat,
  onOpenSeatMap,
  layoutMode = 'grid',
  stayAvailabilityBadge
}) => {
  const getCategoryMeta = (cat: Listing['category']) => {
    switch (cat) {
      case 'homestay':
        return {
          label: 'Homestay',
          pricePrefix: 'Giá phòng từ',
          unitLabel: '/ đêm',
          ctaLabel: 'Chọn phòng →',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
        };
      case 'bus':
        return {
          label: 'Nhà xe & Combo Xe máy',
          pricePrefix: 'Giá vé niêm yết',
          unitLabel: '/ ghế',
          ctaLabel: 'Chọn ghế & Xe →',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      case 'motorbike':
        return {
          label: 'Thuê xe máy leo đèo',
          pricePrefix: 'Giá thuê 24h',
          unitLabel: '/ ngày',
          ctaLabel: 'Thuê xe ngay →',
          badgeColor: 'bg-amber-50 text-amber-900 border-amber-200'
        };
      case 'taxi':
        return {
          label: 'Taxi bản địa 24/7',
          pricePrefix: 'Giá chuyến từ',
          unitLabel: '/ chuyến',
          ctaLabel: 'Đặt xe đón →',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
        };
      case 'coffee':
        return {
          label: 'Cà phê săn mây',
          pricePrefix: 'Đồ uống từ',
          unitLabel: '/ món',
          ctaLabel: 'Xem menu & Bàn →',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'restaurant':
        return {
          label: 'Nhà hàng đặc sản',
          pricePrefix: 'Thực đơn từ',
          unitLabel: '/ người',
          ctaLabel: 'Thực đơn & Bàn →',
          badgeColor: 'bg-orange-50 text-orange-800 border-orange-200'
        };
      case 'tour':
        return {
          label: 'Tour & Trekking',
          pricePrefix: 'Trọn gói từ',
          unitLabel: '/ khách',
          ctaLabel: 'Xem lịch trình →',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'photo':
        return {
          label: 'Photographer săn mây',
          pricePrefix: 'Gói chụp từ',
          unitLabel: '/ buổi',
          ctaLabel: 'Xem gói chụp →',
          badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
        };
      case 'costume':
        return {
          label: 'Thuê trang phục',
          pricePrefix: 'Giá thuê từ',
          unitLabel: '/ bộ · ngày',
          ctaLabel: 'Chọn mẫu thuê →',
          badgeColor: 'bg-pink-50 text-pink-800 border-pink-200'
        };
      case 'camera':
        return {
          label: 'Thuê máy ảnh & Flycam',
          pricePrefix: 'Giá thuê 24h',
          unitLabel: '/ máy · ngày',
          ctaLabel: 'Chọn thiết bị →',
          badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200'
        };
      case 'rescue':
        return {
          label: 'Cứu hộ đèo 24/7',
          pricePrefix: 'Trực chiến 24/7',
          unitLabel: '',
          ctaLabel: 'Gọi cứu hộ →',
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      default:
        return {
          label: 'Dịch vụ Tà Xùa',
          pricePrefix: 'Giá niêm yết',
          unitLabel: '/ gói',
          ctaLabel: 'Xem chi tiết →',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  const meta = getCategoryMeta(listing.category);
  const firstRoom = listing.roomTypes?.[0];
  const firstPkg = listing.servicePackages?.[0];
  const firstMenu = listing.menuItems?.[0];
  const photoCount = listing.images?.length || 1;
  const nightsCount = stayAvailabilityBadge ? Math.max(1, stayAvailabilityBadge.nightsCount) : 1;

  // Build service-matched highlight snippet & feature pills
  const getServiceHighlight = (): { primary: string; pills: string[] } => {
    switch (listing.category) {
      case 'homestay': {
        const totalAvail =
          stayAvailabilityBadge?.availableRoomsCount ??
          (listing.roomTypes?.reduce((sum, r) => sum + (r.availableRooms || 0), 0) ||
            firstRoom?.availableRooms ||
            2);
        const mergedAmenities = Array.from(
          new Set([
            ...(firstRoom?.amenities || []),
            ...(listing.tags || [])
          ])
        ).slice(0, 4);
        const pills =
          mergedAmenities.length > 0
            ? mergedAmenities
            : ['Bình nóng lạnh', 'Đệm sưởi', 'Wifi'];
        return {
          primary: firstRoom
            ? `${firstRoom.name} (${firstRoom.capacity} khách) · Còn ${totalAvail} phòng trống`
            : `${listing.area} · Còn ${totalAvail} phòng trống`,
          pills
        };
      }
      case 'bus': {
        const bikesLeft = listing.motorbikeFleet
          ? Math.max(
              0,
              listing.motorbikeFleet.totalBikes -
                (listing.motorbikeFleet.bookedOnWeb || 0) -
                (listing.motorbikeFleet.rentedOffline ?? listing.motorbikeFleet.rentedOfflineCount ?? 0)
            )
          : 9;
        return {
          primary:
            listing.priceNote ||
            `Sơ đồ giường 2 tầng / Limousine · Sẵn ${bikesLeft} xe máy cho thuê`,
          pills:
            listing.tags && listing.tags.length > 0
              ? listing.tags.slice(0, 3)
              : ['Chọn ghế Tầng 1/2', 'Combo Xe + Xe máy (-30k)', 'Đón trả tận nơi']
        };
      }
      case 'motorbike': {
        const bikesLeft = listing.motorbikeFleet
          ? Math.max(
              0,
              listing.motorbikeFleet.totalBikes -
                (listing.motorbikeFleet.bookedOnWeb || 0) -
                (listing.motorbikeFleet.rentedOffline ?? listing.motorbikeFleet.rentedOfflineCount ?? 0)
            )
          : 16;
        return {
          primary:
            listing.priceNote ||
            `Còn ${bikesLeft} xe sẵn sàng · Trả trước 12h trưa tính 0.5 ngày`,
          pills:
            listing.tags && listing.tags.length > 0
              ? listing.tags.slice(0, 3)
              : ['Wave / Blade / Winner X', '2 mũ BH + Áo mưa', 'Giao tận Homestay']
        };
      }
      case 'coffee':
      case 'restaurant': {
        const openStr = listing.openingHours
          ? `${listing.openingHours.openTime} – ${listing.openingHours.closeTime}`
          : '06:00 – 22:00';
        const menuCount = listing.menuItems?.length || 5;
        return {
          primary: firstMenu
            ? `Best-seller: ${firstMenu.name} (${formatVND(firstMenu.price)})`
            : `Thực đơn ${menuCount} món niêm yết giá minh bạch`,
          pills: [`Mở cửa ${openStr}`, `${menuCount} món đặc sản`, 'Đặt bàn trước']
        };
      }
      case 'tour':
      case 'photo':
      case 'costume':
      case 'camera':
      case 'taxi':
      case 'rescue': {
        const pkgCount = listing.servicePackages?.length || 3;
        return {
          primary:
            listing.priceNote ||
            (firstPkg
              ? `${firstPkg.name} (${formatVND(firstPkg.price)}/${firstPkg.unit})`
              : `${pkgCount} gói dịch vụ niêm yết`),
          pills:
            listing.tags && listing.tags.length > 0
              ? listing.tags.slice(0, 3)
              : firstPkg?.includedFeatures?.slice(0, 2) || [`${pkgCount} gói dịch vụ`, 'Xác nhận tức thì']
        };
      }
    }
  };

  const highlight = getServiceHighlight();
  const bikesAvailableCount = listing.motorbikeFleet
    ? Math.max(
        0,
        listing.motorbikeFleet.totalBikes -
          (listing.motorbikeFleet.bookedOnWeb || 0) -
          (listing.motorbikeFleet.rentedOffline ?? listing.motorbikeFleet.rentedOfflineCount ?? 0)
      )
    : 0;

  // Horizontal OTA List Layout (Booking.com / Vexere style for /stay and /transport pages)
  if (layoutMode === 'horizontal') {
    const roomsList = listing.roomTypes?.slice(0, 3) || [];
    const packagesList = listing.servicePackages?.slice(0, 3) || [];
    return (
      <article
        onClick={() => onSelect(listing)}
        className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col md:flex-row group cursor-pointer ${
          isCompared
            ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
            : 'border-slate-200/90 hover:border-brand-800/50 shadow-2xs hover:shadow-lg'
        }`}
      >
        {/* Left Image Column */}
        <div className="relative md:w-72 h-52 md:h-auto shrink-0 overflow-hidden bg-slate-100">
          <img
            src={listing.coverImage}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-500 ${
              lowDataMode ? 'contrast-95' : 'group-hover:scale-[1.03]'
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10">
            <div className="flex items-center gap-1 flex-wrap">
              {listing.isAdminFeatured && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-slate-950 bg-amber-400 px-2.5 py-1 rounded-full border border-amber-200 shadow-xs">
                  <span>{listing.adminFeaturedLabel || '👑 Admin Đề Xuất'}</span>
                </span>
              )}
              {listing.hasCloudView && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-teal-900/90 px-2.5 py-1 rounded-full border border-teal-300/30">
                  ☁️ View Biển Mây
                </span>
              )}
              {(listing.category === 'bus' || listing.category === 'motorbike') && bikesAvailableCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-emerald-800/90 px-2.5 py-1 rounded-full border border-emerald-300/30">
                  🛵 Sẵn {bikesAvailableCount} xe máy
                </span>
              )}
              {listing.verificationTier === 3 && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-brand-800/90 px-2 py-1 rounded-full border border-white/20">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Cấp 3</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {onToggleCompare && listing.category === 'homestay' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompare(listing.id);
                  }}
                  title="So sánh homestay (tối đa 3 cơ sở)"
                  className={`h-7 px-2 rounded-full text-xs font-extrabold flex items-center gap-1 border transition-colors cursor-pointer ${
                    isCompared
                      ? 'bg-teal-500 text-slate-950 border-teal-300'
                      : 'bg-black/45 hover:bg-black/65 text-white border-white/25'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  <span>{isCompared ? 'Đã chọn' : 'So sánh'}</span>
                </button>
              )}
              {onToggleSave && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(listing.id);
                  }}
                  className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 border border-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label={`Lưu ${listing.title}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                </button>
              )}
            </div>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
            <span className="inline-flex items-center gap-1 font-semibold truncate">
              <MapPin className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span>{listing.area}</span>
            </span>
            {photoCount > 1 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 text-xs">
                <Camera className="w-3 h-3" />
                <span>{photoCount} ảnh</span>
              </span>
            )}
          </div>
        </div>

        {/* Center Details & Room / Service Package Breakdown */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-black text-brand-800 group-hover:text-teal-700 transition-colors leading-snug">
                {listing.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-medium line-clamp-1 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate">{highlight.primary}</span>
            </p>

            {/* Room Breakdown Table (For Homestay) */}
            {listing.category === 'homestay' && roomsList.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 mb-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Hạng phòng đã thẩm định</span>
                  <span>Tình trạng & Giá / đêm</span>
                </div>
                {roomsList.map((rm) => (
                  <div
                    key={rm.id}
                    className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0 flex items-center gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{rm.name}</span>
                      <span className="text-xs text-slate-500 shrink-0">
                        · {rm.capacity} khách · {rm.viewType}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          rm.availableRooms > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {rm.availableRooms > 0 ? `Còn ${rm.availableRooms} căn` : 'Hết phòng'}
                      </span>
                      <span className="font-extrabold text-brand-800 tabular-nums">
                        {rm.price ? formatVND(rm.price) : 'Liên hệ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Service Package Breakdown Table (For Bus / Taxi / Motorbike / Services) */}
            {listing.category !== 'homestay' && packagesList.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5 mb-3">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Gói dịch vụ & Lịch trình niêm yết</span>
                  <span>Tình trạng & Đơn giá</span>
                </div>
                {packagesList.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200/60 first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{pkg.name}</div>
                      {pkg.durationNote && (
                        <div className="text-xs text-slate-500 truncate">{pkg.durationNote}</div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {pkg.availableCount !== undefined && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Còn {pkg.availableCount} chỗ
                        </span>
                      )}
                      <span className="font-extrabold text-brand-800 tabular-nums">
                        {formatVND(pkg.price)}/{pkg.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {highlight.pills.map((pill, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Right Pricing & Action Column */}
        <div className="p-4 sm:p-5 md:w-60 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50/50 flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
          <div className="flex md:flex-col items-center md:items-end gap-2 w-full justify-between">
            <div className="inline-flex items-center gap-1.5 bg-brand-800 text-white px-2.5 py-1 rounded-xl text-xs font-black tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {listing.reviewCount > 0 ? (
                <>
                  <span>{listing.rating}</span>
                  <span className="text-xs font-medium text-slate-200">({listing.reviewCount})</span>
                </>
              ) : (
                <span className="font-semibold">Chưa có đánh giá</span>
              )}
            </div>

            {stayAvailabilityBadge && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Còn {stayAvailabilityBadge.availableRoomsCount} phòng trống</span>
              </span>
            )}

            {(listing.category === 'bus' || listing.category === 'motorbike') && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-extrabold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                <span>🎁 Combo Xe máy -30k · 12h=0.5 ngày</span>
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 uppercase font-extrabold block whitespace-nowrap">
              {meta.pricePrefix}
            </span>
            <div className="flex items-baseline md:justify-end gap-1 whitespace-nowrap">
              <span className="text-xl font-black text-brand-800 tabular-nums">
                {listing.minPrice > 0 ? formatVND(listing.minPrice) : 'Liên hệ'}
              </span>
              {listing.minPrice > 0 && meta.unitLabel && (
                <span className="text-xs text-slate-500 font-bold">{meta.unitLabel}</span>
              )}
            </div>
            {nightsCount > 1 && listing.category === 'homestay' && (
              <div className="text-xs font-bold text-teal-800 mt-0.5 tabular-nums">
                Tổng {nightsCount} đêm: {formatVND(listing.minPrice * nightsCount)}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-1.5 mt-3">
              {onOpenDirectChat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDirectChat(listing);
                  }}
                  title="Chat trực tiếp trên Web (Bảo vệ bằng chứng cọc)"
                  className="px-2.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 cursor-pointer"
                >
                  💬 Chat
                </button>
              )}
              {onOpenSeatMap && listing.category === 'bus' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSeatMap(listing);
                  }}
                  title="Mở sơ đồ giường 2 tầng / ghế Limousine"
                  className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300 cursor-pointer"
                >
                  💺 Sơ đồ ghế
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(listing);
                }}
                className="bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-full transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {meta.ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelect(listing)}
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col group cursor-pointer ${
        isCompared
          ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
          : listing.isAdminFeatured
          ? 'border-amber-400/90 hover:border-amber-500 shadow-sm hover:shadow-lg ring-1 ring-amber-300/40'
          : 'border-slate-200/90 hover:border-brand-800/50 shadow-2xs hover:shadow-lg'
      }`}
    >
      {/* Admin Featured Priority Strip (Khi Admin ghim ưu tiên cơ sở lên đầu) */}
      {listing.isAdminFeatured && !stayAvailabilityBadge && (
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 text-xs font-black flex items-center justify-between gap-2 border-b border-amber-400/80">
          <span className="truncate">
            {listing.adminFeaturedLabel || '👑 Admin Đề Xuất · Ưu Tiên Hàng Đầu'}
          </span>
          <span className="text-xs font-extrabold bg-slate-950/90 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
            Top #{listing.adminPriorityRank ? Math.max(1, 101 - listing.adminPriorityRank) : 1}
          </span>
        </div>
      )}

      {/* Integrated Availability Strip Inside Card when Filtering by Date on /stay */}
      {stayAvailabilityBadge && (
        <div className="px-3.5 py-2 bg-emerald-50/90 border-b border-emerald-200/80 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Còn <strong>{stayAvailabilityBadge.availableRoomsCount} phòng trống</strong> ({stayAvailabilityBadge.dateLabel})
            </span>
          </span>
          <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            Sẵn sàng đặt
          </span>
        </div>
      )}

      {/* 1. Large Immersive Cloud View Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={listing.coverImage}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            lowDataMode ? 'contrast-95' : 'group-hover:scale-[1.03]'
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />

        {/* Top Badges & Compare + Heart Save Buttons */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {listing.hasCloudView && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-teal-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-300/30 shadow-xs">
                <span>☁️ View Biển Mây</span>
              </span>
            )}

            {(listing.category === 'bus' || listing.category === 'motorbike') && bikesAvailableCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-emerald-800/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-300/30 shadow-xs">
                <span>🛵 Sẵn {bikesAvailableCount} xe máy</span>
              </span>
            )}

            {(listing.category === 'coffee' || listing.category === 'restaurant') && (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-emerald-800/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-300/30 shadow-xs">
                <Clock className="w-3 h-3 text-emerald-300" />
                <span>
                  {listing.openingHours
                    ? `${listing.openingHours.openTime}–${listing.openingHours.closeTime}`
                    : 'Đang mở cửa'}
                </span>
              </span>
            )}

            {listing.verificationTier === 3 ? (
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-brand-800/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Cấp 3</span>
              </span>
            ) : listing.verificationTier === 2 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-xs">
                <span>Cấp 2</span>
              </span>
            ) : (
              <span
                title={verificationLabel(listing).detail}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200 shadow-xs"
              >
                <span>{verificationLabel(listing).title}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleCompare && listing.category === 'homestay' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(listing.id);
                }}
                title="Thêm vào bảng so sánh Homestay (tối đa 3 căn)"
                className={`h-8 px-2.5 rounded-full text-xs font-extrabold flex items-center gap-1 backdrop-blur-md border transition-colors cursor-pointer ${
                  isCompared
                    ? 'bg-teal-400 text-slate-950 border-teal-200 shadow-sm'
                    : 'bg-black/40 hover:bg-black/60 text-white border-white/25'
                }`}
              >
                <Scale className="w-3 h-3" />
                <span>{isCompared ? 'Đã chọn' : 'So sánh'}</span>
              </button>
            )}

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(listing.id);
                }}
                className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xs transition-colors cursor-pointer shrink-0"
                aria-label={`Lưu ${listing.title} vào danh sách yêu thích`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSaved ? 'fill-rose-500 text-rose-500' : 'text-white'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Image Overlay: Area & Rating & Photo Count */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10 text-white">
          <div className="flex items-center gap-1 text-xs font-semibold drop-shadow-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-teal-300 shrink-0" />
            <span className="truncate">{listing.area}</span>
            <span aria-hidden="true" className="opacity-60">·</span>
            <span className="text-teal-200 font-bold truncate">{meta.label}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {photoCount > 1 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/90">
                <Camera className="w-3 h-3" />
                <span>{photoCount} ảnh</span>
              </span>
            )}

            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-black tabular-nums shadow-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {listing.reviewCount > 0 ? (
                <>
                  <span>{listing.rating}</span>
                  <span className="text-white/70 text-xs font-normal">({listing.reviewCount})</span>
                </>
              ) : (
                <span className="font-semibold">Chưa có đánh giá</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Card Content Body: Service-Matched Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-base sm:text-lg font-black text-brand-800 group-hover:text-teal-700 transition-colors line-clamp-1 mb-1.5"
            title={listing.title}
          >
            {listing.title}
          </h3>

          <p className="text-xs text-slate-600 font-medium line-clamp-2 mb-2.5 flex items-start gap-1.5 leading-relaxed">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
            <span>{highlight.primary}</span>
          </p>

          {/* Quick Room Preview on Homestay Cards when on /stay */}
          {stayAvailabilityBadge && listing.roomTypes && listing.roomTypes.length > 1 && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                🛏️ {listing.roomTypes.length} hạng phòng ({listing.roomTypes.map((r) => r.name.split(' ')[0]).slice(0, 2).join(', ')}...)
              </span>
              <span className="shrink-0 font-bold text-brand-800 inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-teal-700" />
                <span>Tối đa {Math.max(...listing.roomTypes.map((r) => r.capacity || 2))} khách/phòng</span>
              </span>
            </div>
          )}

          {/* Quick Bus & Motorbike Combo Strip on Transport Cards */}
          {listing.category === 'bus' && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-teal-50/70 border border-teal-200/70 text-xs text-teal-900 flex items-center justify-between gap-2">
              <span className="truncate font-semibold">
                🎁 Combo Xe + Xe máy giảm 30k (12h trưa = 0.5 ngày)
              </span>
              {onOpenSeatMap && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSeatMap(listing);
                  }}
                  className="shrink-0 font-extrabold text-brand-800 hover:underline cursor-pointer"
                >
                  Sơ đồ ghế →
                </button>
              )}
            </div>
          )}

          {/* Service-specific micro tags */}
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {highlight.pills.slice(0, 3).map((pill, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 truncate max-w-[180px]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* 3. High-Contrast, Non-Wrapping Pricing & Direct CTAs (Bulletproof on 2-col & 3-col grids) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
          <div className="shrink-0">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-extrabold block leading-tight whitespace-nowrap">
              {meta.pricePrefix}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5 whitespace-nowrap">
              <span className="text-base sm:text-lg font-black text-brand-800 tabular-nums tracking-tight">
                {listing.minPrice > 0 ? formatVND(listing.minPrice) : 'Liên hệ'}
              </span>
              {listing.minPrice > 0 && meta.unitLabel && (
                <span className="text-xs text-slate-600 font-bold">{meta.unitLabel}</span>
              )}
            </div>
            {stayAvailabilityBadge && nightsCount > 1 && listing.minPrice > 0 && (
              <div className="text-xs font-bold text-teal-700 tabular-nums mt-0.5 whitespace-nowrap">
                Tổng {nightsCount} đêm: {formatVND(listing.minPrice * nightsCount)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {onOpenDirectChat && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDirectChat(listing);
                }}
                className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors cursor-pointer border border-teal-200/80"
                title="Chat trực tiếp trên Web (Bảo vệ bằng chứng cọc)"
              >
                <span>💬</span>
                <span className="hidden xl:inline">Chat</span>
              </button>
            )}

            <a
              href={`https://zalo.me/${listing.zalo.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200/80 shadow-2xs"
              title="Nhắn tin Zalo trực tiếp với chủ cơ sở"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Zalo</span>
            </a>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(listing);
              }}
              className="bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs h-8 px-3 rounded-full transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs flex items-center"
            >
              {meta.ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
