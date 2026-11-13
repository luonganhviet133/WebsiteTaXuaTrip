import React, { useState } from 'react';
import {
  X,
  Scale,
  Heart,
  Share2,
  CheckCircle2,
  Star,
  MapPin,
  Car,
  Eye,
  VolumeX,
  Users,
  BedDouble,
  Trash2,
  Sparkles,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { Listing } from '../types/index.ts';
import {
  formatVND,
  compareHomestaysMatrix,
  estimateMountainTravelMinutes,
  buildDeepLinkSearchParams
} from '../utils/rules.ts';

interface CompareFloatingBarProps {
  compareListings: Listing[];
  onRemoveCompare: (id: string) => void;
  onClearCompare: () => void;
  onOpenCompareModal: () => void;
}

export const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({
  compareListings,
  onRemoveCompare,
  onClearCompare,
  onOpenCompareModal
}) => {
  if (compareListings.length === 0) return null;

  return (
    <div
      id="homestay-compare-bar"
      className="fixed bottom-16 lg:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl bg-brand-900/95 backdrop-blur-md text-white border border-white/20 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 sm:px-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3"
    >
      <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-white/15">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold leading-tight whitespace-nowrap">
              So sánh ({compareListings.length}/3)
            </div>
            <div className="hidden sm:block text-xs text-slate-300">
              Chọn tối đa 3 căn để đặt cạnh nhau
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {compareListings.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/15 rounded-2xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs shrink-0"
            >
              <img
                src={item.coverImage}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-lg object-cover"
              />
              <span className="font-bold max-w-[85px] sm:max-w-[110px] truncate">{item.title}</span>
              <button
                type="button"
                onClick={() => onRemoveCompare(item.id)}
                aria-label={`Bỏ ${item.title} khỏi bảng so sánh`}
                className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t border-white/10 sm:border-0">
        <button
          type="button"
          onClick={onClearCompare}
          className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 font-semibold cursor-pointer whitespace-nowrap"
        >
          Xóa hết
        </button>
        <button
          type="button"
          onClick={onOpenCompareModal}
          className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-md whitespace-nowrap"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>So sánh ngay ({compareListings.length})</span>
        </button>
      </div>
    </div>
  );
};

interface CompareHomestaysModalProps {
  isOpen: boolean;
  compareListings: Listing[];
  onClose: () => void;
  onRemoveCompare: (id: string) => void;
  onSelectListing: (listing: Listing) => void;
}

export const CompareHomestaysModal: React.FC<CompareHomestaysModalProps> = ({
  isOpen,
  compareListings,
  onClose,
  onRemoveCompare,
  onSelectListing
}) => {
  if (!isOpen) return null;

  const matrix = compareHomestaysMatrix(compareListings);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Bảng so sánh chi tiết Homestay Tà Xùa"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl sm:my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-[#0a6b6e] text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold truncate">
                So Sánh Trực Tiếp Homestay ({matrix.rows.length} cơ sở)
              </h2>
              <p className="text-xs text-slate-200 line-clamp-1">
                Đặt cạnh nhau góc nhìn mây từ giường, đường ô tô, độ yên tĩnh & khoảng cách tới Đỉnh Gió
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng so sánh"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
          {matrix.rows.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm font-bold text-slate-700">
                Chưa có homestay nào trong danh sách so sánh.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-brand-800 text-white text-xs font-bold cursor-pointer"
              >
                Quay lại chọn Homestay
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Stacked Comparison Cards (< md) for zero horizontal scroll fatigue */}
              <div className="md:hidden space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {matrix.rows.map((row) => {
                    const fullItem = compareListings.find((l) => l.id === row.id);
                    if (!fullItem) return null;
                    return (
                      <div
                        key={row.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={fullItem.coverImage}
                            alt={row.title}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-xl object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-sm text-brand-800 leading-snug">
                                {row.title}
                              </h3>
                              <button
                                type="button"
                                onClick={() => onRemoveCompare(row.id)}
                                aria-label={`Xóa ${row.title} khỏi so sánh`}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-teal-700 font-semibold mt-0.5">
                              {row.area} · Cấp xác minh {row.verificationTier}/3 · ⭐ {row.rating}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-extrabold text-brand-800 tabular-nums">
                                {formatVND(row.minPrice)}/đêm
                              </span>
                              {matrix.bestPriceId === row.id && matrix.rows.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                                  Tối ưu chi phí
                                </span>
                              )}
                              {matrix.bestRatingId === row.id && matrix.rows.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                                  Điểm cao nhất
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                            <div className="text-slate-400 font-semibold">View mây tại giường</div>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {row.cloudViewFromBed ? '✓ Có cửa kính ngắm mây' : 'Ban công / Sân chung'}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                            <div className="text-slate-400 font-semibold">Đường ô tô</div>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {row.carParking ? '✓ Ô tô vào tận nơi' : 'Ưu tiên xe máy'}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                            <div className="text-slate-400 font-semibold">Sức chứa & Phòng trống</div>
                            <div className="font-bold text-slate-800 mt-0.5">
                              Tối đa {row.maxRoomCapacity} khách · Còn {row.totalAvailableRooms} phòng
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                            <div className="text-slate-400 font-semibold">Cách Đỉnh Gió</div>
                            <div className="font-bold text-slate-800 mt-0.5">
                              {row.distanceToDinhGioKm === null
                                ? 'Chưa có tọa độ'
                                : `${row.distanceToDinhGioKm} km (~${estimateMountainTravelMinutes(row.distanceToDinhGioKm)}p)`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectListing(fullItem);
                          }}
                          className="w-full min-h-[42px] bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs py-2.5 px-4 rounded-full cursor-pointer transition-colors"
                        >
                          Xem bằng chứng & Đặt phòng →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Side-by-Side Comparison Matrix Table (md:table) */}
              <table className="hidden md:table w-full border-collapse min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-3 w-48 text-slate-500 font-extrabold uppercase tracking-wider text-xs">
                      Tiêu chí thẩm định
                    </th>
                    {compareListings.slice(0, 3).map((item) => (
                      <th key={item.id} className="py-3 px-4 align-top w-64">
                        <div className="relative rounded-2xl overflow-hidden h-28 mb-2.5 bg-slate-100">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveCompare(item.id)}
                            aria-label={`Xóa ${item.title} khỏi so sánh`}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="font-extrabold text-sm text-brand-800 line-clamp-1 mb-1">
                          {item.title}
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold">
                          <MapPin className="w-3 h-3" />
                          <span>{item.area}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">Giá ghi nhận / đêm</td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-brand-800 tabular-nums">
                            {formatVND(row.minPrice)}
                          </span>
                          {matrix.bestPriceId === row.id && matrix.rows.length > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                              Tối ưu chi phí
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">Đánh giá & Cấp xác minh</td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-700">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {row.rating}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-brand-800 font-bold text-xs">
                            Cấp {row.verificationTier}/3
                          </span>
                          {matrix.bestRatingId === row.id && matrix.rows.length > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                              Được khen nhiều nhất
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-teal-700" />
                        <span>View biển mây từ giường</span>
                      </span>
                    </td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        {row.cloudViewFromBed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Có cửa kính ngắm mây từ giường</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">Ngắm mây tại sân chung / ban công</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-teal-700" />
                        <span>Đường ô tô & Bãi đỗ</span>
                      </span>
                    </td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        {row.carParking ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ô tô vào tận nơi · Có chỗ đỗ</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold">
                            Đường dốc nhỏ · Ưu tiên xe máy
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <VolumeX className="w-3.5 h-3.5 text-teal-700" />
                        <span>Độ yên tĩnh ban đêm</span>
                      </span>
                    </td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        {row.quietRetreat ? (
                          <span className="text-teal-800 font-bold">
                            Yên tĩnh tuyệt đối (Tách biệt khu trung tâm)
                          </span>
                        ) : (
                          <span className="text-slate-600">Gần trục chính · Tiện đi bộ ăn uống</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-700" />
                        <span>Sức chứa & Phòng trống</span>
                      </span>
                    </td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          Tối đa {row.maxRoomCapacity} khách / phòng
                        </div>
                        <div className="text-xs text-teal-700 font-semibold">
                          Đang còn {row.totalAvailableRooms} phòng trống
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      Khoảng cách tới Đỉnh Gió
                    </td>
                    {matrix.rows.map((row) => (
                      <td key={row.id} className="py-3.5 px-4">
                        {row.distanceToDinhGioKm === null ? (
                          <span className="text-slate-500">Chưa có tọa độ</span>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800">{row.distanceToDinhGioKm} km</span>{' '}
                            <span className="text-slate-500">
                              (~{estimateMountainTravelMinutes(row.distanceToDinhGioKm)} phút xe máy)
                            </span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-4 px-3 font-bold text-slate-700">Hành động</td>
                    {compareListings.slice(0, 3).map((item) => (
                      <td key={item.id} className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectListing(item);
                          }}
                          className="w-full bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs py-2.5 px-4 rounded-full cursor-pointer transition-colors"
                        >
                          Xem bằng chứng & Đặt →
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface WishlistDrawerModalProps {
  isOpen: boolean;
  savedListings: Listing[];
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onSelectListing: (listing: Listing) => void;
  onCompareAllSaved: () => void;
}

export const WishlistDrawerModal: React.FC<WishlistDrawerModalProps> = ({
  isOpen,
  savedListings,
  onClose,
  onToggleSave,
  onSelectListing,
  onCompareAllSaved
}) => {
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  if (!isOpen) return null;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${buildDeepLinkSearchParams({
          tab: 'stay',
          wishlistIds: savedListings.map((l) => l.id)
        })}`
      : '';

  const handleCopyWishlistUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch {
      setCopiedShareLink(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Danh sách Yêu thích & Chia sẻ nhóm"
    >
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="bg-brand-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <Heart className="w-5 h-5 fill-rose-400 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                Danh Sách Đã Lưu ({savedListings.length})
              </h2>
              <p className="text-xs text-slate-300">
                Lưu lại các homestay ưng ý và gửi link cho cả nhóm cùng bình chọn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng danh sách yêu thích"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Items List */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {savedListings.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-brand-800 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Chia sẻ danh sách này cho nhóm đi chung</span>
                </span>
                <span className="text-xs font-bold bg-white text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                  Deep Link tự động
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  aria-label="Liên kết chia sẻ danh sách yêu thích"
                  className="flex-1 bg-white border border-slate-500 rounded-xl px-3 py-2 text-base font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopyWishlistUrl}
                  className="bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-full cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {savedListings.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-brand-800">
                Bạn chưa lưu cơ sở nào vào danh sách yêu thích
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Hãy bấm vào biểu tượng trái tim trên mỗi thẻ Homestay hoặc Quán cà phê săn mây để lưu lại so sánh.
              </p>
            </div>
          ) : (
            savedListings.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs hover:border-brand-800/40 transition-colors"
              >
                <img
                  src={item.coverImage}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
                  onClick={() => {
                    onClose();
                    onSelectListing(item);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
                    <span>{item.area}</span>
                    <span>·</span>
                    <span>⭐ {item.rating}</span>
                  </div>
                  <h4
                    onClick={() => {
                      onClose();
                      onSelectListing(item);
                    }}
                    className="text-sm font-extrabold text-brand-800 truncate cursor-pointer hover:underline"
                  >
                    {item.title}
                  </h4>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">
                    {item.minPrice > 0 ? `${formatVND(item.minPrice)} / đêm` : 'Hỗ trợ 24/7'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectListing(item);
                      }}
                      className="text-xs font-bold text-brand-800 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSave(item.id)}
                  aria-label={`Xóa ${item.title} khỏi danh sách đã lưu`}
                  className="p-2 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {savedListings.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCompareAllSaved}
              className="flex-1 bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs py-3 rounded-full cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>Đưa vào Bảng So Sánh ({Math.min(3, savedListings.length)} căn)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
