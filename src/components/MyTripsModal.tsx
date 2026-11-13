import { DemoNotice } from './DemoNotice';
import React, { useState } from 'react';
import {
  X,
  CalendarCheck,
  QrCode,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  Star,
  MapPin,
  ShieldCheck,
  ArrowRight,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { Booking, Listing } from '../types/index.ts';
import { AuthUser } from '../types/auth.ts';
import { displayBookingStatus } from '../api/holdsApi.ts';
import { bookingsApi, formatCreatedAt, guestCanCancel, guestCountOf } from '../api/bookingsApi.ts';
import { CheckinQr } from './CheckinQr.tsx';
import { PaymentPanel } from './PaymentPanel.tsx';
import { GuestNotices } from './GuestNotices.tsx';
import { formatVND, canBookingLeaveReview } from '../utils/rules.ts';

interface MyTripsModalProps {
  isOpen: boolean;
  currentUser?: AuthUser | null;
  bookings: Booking[];
  listings: Listing[];
  onClose: () => void;
  onSelectListingForReview: (listing: Listing) => void;
  onOpenDispute?: (booking: Booking) => void;
  onOpenReviewModal?: (booking: Booking) => void;
  onRequireLogin?: () => void;
}

export const MyTripsModal: React.FC<MyTripsModalProps> = ({
  isOpen,
  currentUser,
  bookings,
  listings,
  onClose,
  onSelectListingForReview,
  onOpenDispute,
  onOpenReviewModal,
  onRequireLogin
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [activeVietQrBookingId, setActiveVietQrBookingId] = useState<string | null>(null);
  const [activeVoucherBookingId, setActiveVoucherBookingId] = useState<string | null>(null);
  const [serverBookings, setServerBookings] = useState<Booking[] | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'unauthenticated' | 'error'>('idle');
  const fetchSeqRef = React.useRef(0);
  // N05.3: tải lại danh sách sau khi khách hủy đơn
  const [reloadTick, setReloadTick] = useState(0);
  const [cancelling, setCancelling] = useState<{ id: string; reason: string; busy: boolean; error?: string } | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setServerBookings(null);
      setFetchStatus('idle');
      setIsLoadingBookings(false);
      return;
    }

    const token = localStorage.getItem('taxua_session_token');
    if (!token || !currentUser) {
      setServerBookings(null);
      setFetchStatus('unauthenticated');
      setIsLoadingBookings(false);
      return;
    }

    const currentSeq = ++fetchSeqRef.current;
    const controller = new AbortController();
    setIsLoadingBookings(true);
    setFetchStatus('loading');

    fetch('/api/user/bookings', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then((res) => {
        if (res.status === 401) {
          throw new Error('401');
        }
        return res.json();
      })
      .then((json) => {
        if (currentSeq !== fetchSeqRef.current) return;
        if (json.success && Array.isArray(json.data)) {
          setServerBookings(json.data);
          setFetchStatus('success');
        } else {
          setServerBookings([]);
          setFetchStatus('success');
        }
      })
      .catch((err) => {
        if (currentSeq !== fetchSeqRef.current) return;
        if (err.name === 'AbortError') return;
        if (err.message === '401') {
          setServerBookings(null);
          setFetchStatus('unauthenticated');
        } else {
          setServerBookings([]);
          setFetchStatus('error');
        }
      })
      .finally(() => {
        if (currentSeq === fetchSeqRef.current) {
          setIsLoadingBookings(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, currentUser?.id, reloadTick]);

  if (!isOpen) return null;

  // S6: Do NOT fallback to mock demo bookings when unauthenticated or for other users
  const activeBookings = serverBookings || [];

  const filteredBookings = activeBookings.filter((b) => {
    if (!lookupQuery.trim()) return true;
    const q = lookupQuery.trim().toLowerCase();
    const id = `${b.id || ''} ${b.bookingCode || ''}`.toLowerCase();
    const listingTitle = (b.listingTitle || '').toLowerCase();
    const guestPhone = (b.guestPhone || '').toLowerCase();
    const guestName = (b.guestName || '').toLowerCase();
    return (
      id.includes(q) ||
      listingTitle.includes(q) ||
      guestPhone.includes(q) ||
      guestName.includes(q)
    );
  });

  const getStatusBadge = (booking: Booking) => {
    switch (displayBookingStatus(booking.status, booking.holdExpiresAt)) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
            <Clock className="w-3 h-3" />
            <span>Giữ chỗ 30 phút · Chờ cọc</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã xác nhận giữ phòng</span>
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900">
            <ShieldCheck className="w-3 h-3" />
            <span>Đã Check-in tại cơ sở</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã hoàn tất chuyến đi</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Hết hạn giữ chỗ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Đã hủy
          </span>
        );
    }
  };


  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Quản lý Đơn đặt & Chuyến đi của tôi"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl sm:my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-[#0a6b6e] text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold truncate">
                Chuyến Đi & Đơn Đặt Của Tôi ({activeBookings.length})
              </h2>
              <p className="text-xs text-slate-200 line-clamp-1">
                Tra cứu mã giữ chỗ, quét mã VietQR đặt cọc tự động, mở Phiếu nhận phòng E-Voucher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ Chuyến đi của tôi"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Nhập mã đặt chỗ (VD: bk-101), tên homestay hoặc SĐT..."
              aria-label="Tìm kiếm mã đặt chỗ hoặc số điện thoại"
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-800"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Hiển thị {filteredBookings.length}/{activeBookings.length} đơn đặt {serverBookings !== null && '(Đã đồng bộ tài khoản)'}
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {/* Unauthenticated State (S6) */}
          {fetchStatus === 'unauthenticated' && (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-brand-800">
                <LogIn className="w-8 h-8 text-brand-800" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-brand-800">Vui Lòng Đăng Nhập</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Để bảo vệ quyền riêng tư và dữ liệu cá nhân, bạn cần đăng nhập tài khoản để xem các đơn đặt và chuyến đi của mình.
                </p>
              </div>
              {onRequireLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequireLogin();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-800 hover:bg-[#0a4585] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </button>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoadingBookings && (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-800"></div>
              <p className="text-xs font-semibold">Đang tải lịch sử chuyến đi của bạn...</p>
            </div>
          )}

          {/* Empty State */}
          {fetchStatus !== 'unauthenticated' && !isLoadingBookings && filteredBookings.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-brand-800">
                {lookupQuery.trim() ? 'Không Tìm Thấy Đơn Đặt Phù Hợp' : 'Bạn Chưa Có Chuyến Đi Nào'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {lookupQuery.trim()
                  ? `Không có kết quả nào khớp với "${lookupQuery}". Vui lòng thử tìm kiếm với mã đặt chỗ hoặc số điện thoại khác.`
                  : 'Mọi đơn đặt homestay, phòng nghỉ và xe di chuyển sẽ được lưu trữ an toàn tại đây.'}
              </p>
            </div>
          )}

          {fetchStatus === 'success' && <GuestNotices reloadKey={reloadTick} />}

          {fetchStatus !== 'unauthenticated' && (
            <DemoNotice>
              Tiền cọc và phần còn lại chuyển thẳng vào tài khoản của cơ sở (Tà Xùa Trip không giữ tiền). Bấm "Thanh toán" ở từng đơn
              để xem điều khoản và thông tin chuyển khoản. Đơn chỉ tính là đã trả khi cơ sở xác nhận.
            </DemoNotice>
          )}

          {/* Render Bookings */}
          {fetchStatus !== 'unauthenticated' && !isLoadingBookings && filteredBookings.map((booking) => {
            const matchedListing = listings.find((l) => l.id === booking.listingId);
            const isVietQrOpen = activeVietQrBookingId === booking.id;
            const isVoucherOpen = activeVoucherBookingId === booking.id;
            const eligibleForReview = canBookingLeaveReview(booking.status, booking.reviewed);

            return (
              <div
                key={booking.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-brand-800 text-white font-mono text-xs font-extrabold uppercase">
                      #{booking.bookingCode || booking.id}
                    </span>
                    {getStatusBadge(booking)}
                    <span className="text-xs text-slate-500 font-medium">
                      Đặt ngày: {formatCreatedAt(booking.createdAt)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Tổng chi phí ghi nhận</span>
                    <span className="text-base font-extrabold text-brand-800 tabular-nums">
                      {formatVND(booking.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-7 space-y-1">
                    <h3 className="text-base font-extrabold text-brand-800">
                      {booking.listingTitle}
                    </h3>
                    {booking.roomName && (
                      <div className="text-xs font-bold text-teal-700">
                        Hạng phòng / Dịch vụ: {booking.roomName}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>
                        📅 Nhận phòng: <strong>{booking.checkInDate}</strong>
                      </span>
                      <span>
                        📅 Trả phòng: <strong>{booking.checkOutDate}</strong>
                      </span>
                      <span>
                        👥 Số lượng: <strong>{guestCountOf(booking)} khách</strong>
                      </span>
                    </div>
                    {booking.status === 'cancelled' && booking.cancelReason && (
                      <p className="text-xs text-slate-600">Lý do hủy: {booking.cancelReason}</p>
                    )}

                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-2">
                    {['pending_deposit', 'confirmed', 'checked_in'].includes(booking.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveVoucherBookingId(null);
                          setActiveVietQrBookingId(isVietQrOpen ? null : booking.id);
                        }}
                        aria-expanded={isVietQrOpen}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                          isVietQrOpen ? 'bg-brand-800 text-white border-brand-800' : 'bg-slate-50 hover:bg-slate-100 text-brand-800 border-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Thanh toán</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveVietQrBookingId(null);
                        setActiveVoucherBookingId(isVoucherOpen ? null : booking.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isVoucherOpen
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Phiếu Check-in QR</span>
                    </button>

                    {/* Dispute / Trọng tài khiếu nại Button */}
                    {onOpenDispute && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDispute(booking);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                          booking.hasDispute
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                        <span>{booking.hasDispute ? 'Đang khiếu nại (Admin hỗ trợ)' : 'Khiếu nại dịch vụ'}</span>
                      </button>
                    )}

                    {eligibleForReview && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenReviewModal) {
                            onOpenReviewModal(booking);
                          } else if (matchedListing) {
                            onSelectListingForReview(matchedListing);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Viết Đánh Giá (+20 Điểm Mây)</span>
                      </button>
                    )}

                    {/* N05.3: khách không tự hoàn tất; chỉ hủy được theo bảng trạng thái (server kiểm lại) */}
                    {guestCanCancel({ status: booking.status, holdExpiresAt: booking.holdExpiresAt ?? null, checkInDate: booking.checkInDate }) && cancelling?.id !== booking.id && (
                      <button
                        type="button"
                        onClick={() => setCancelling({ id: booking.id, reason: '', busy: false })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>

                {cancelling?.id === booking.id && (
                  <form
                    className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setCancelling({ ...cancelling, busy: true, error: undefined });
                      const r = await bookingsApi.act(booking.id, 'cancel', cancelling.reason.trim() || undefined);
                      if (!r.ok) return setCancelling({ ...cancelling, busy: false, error: r.message });
                      setCancelling(null);
                      setReloadTick((n) => n + 1);
                    }}
                  >
                    <p className="text-xs font-bold text-rose-900">
                      {booking.status === 'confirmed'
                        ? 'Hủy đơn đã xác nhận: tiền cọc không được hoàn (điều khoản D03). Phòng sẽ được trả lại cho cơ sở.'
                        : 'Hủy giữ chỗ: phòng được trả lại ngay.'}
                    </p>
                    <label htmlFor={`cancel-reason-${booking.id}`} className="sr-only">Lý do hủy</label>
                    <input
                      id={`cancel-reason-${booking.id}`}
                      value={cancelling.reason}
                      onChange={(e) => setCancelling({ ...cancelling, reason: e.target.value })}
                      placeholder="Lý do (không bắt buộc)"
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-sm"
                    />
                    {cancelling.error && <p className="text-xs font-bold text-rose-700">{cancelling.error}</p>}
                    <div className="flex gap-2">
                      <button type="submit" disabled={cancelling.busy} className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                        Xác nhận hủy
                      </button>
                      <button type="button" onClick={() => setCancelling(null)} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                        Giữ đơn
                      </button>
                    </div>
                  </form>
                )}

                {/* N06.1: thanh toán thật theo D03 (điều khoản → tài khoản cơ sở + VietQR → biên lai; cơ sở xác nhận) */}
                {isVietQrOpen && <PaymentPanel bookingId={booking.id} />}

                {/* Expandable Panel 2: Digital Check-in E-Voucher */}
                {isVoucherOpen && (
                  <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-8 space-y-2">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-teal-300">
                        PHIẾU NHẬN PHÒNG ĐIỆN TỬ · TÀ XÙA TRIP E-VOUCHER
                      </div>
                      <div className="text-base font-extrabold">{booking.listingTitle}</div>
                      <div className="text-xs text-slate-200">
                        Khách lưu trú: <strong>{booking.guestName}</strong> ({booking.guestPhone})
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="bg-white/10 rounded-xl p-2.5">
                          <span className="text-xs text-slate-300 block">NHẬN PHÒNG (từ 14:00)</span>
                          <span className="font-extrabold">{booking.checkInDate}</span>
                        </div>
                        <div className="bg-white/10 rounded-xl p-2.5">
                          <span className="text-xs text-slate-300 block">TRẢ PHÒNG (trước 12:00)</span>
                          <span className="font-extrabold">{booking.checkOutDate}</span>
                        </div>
                      </div>
                      {matchedListing && (
                        <div className="text-xs text-teal-200 pt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Khu vực: {matchedListing.area} · SĐT Chủ nhà: {matchedListing.phone} (Lưu sẵn khi mất sóng)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-4 bg-white text-slate-900 rounded-2xl p-4 flex flex-col items-center text-center">
                      <div className="mb-2">
                        <CheckinQr bookingId={booking.id} />
                      </div>
                      <div className="font-mono text-xs font-extrabold text-brand-800">
                        {booking.bookingCode || booking.id}
                      </div>
                      <div className="text-xs text-slate-600">
                        Đưa mã QR này cho chủ cơ sở quét khi nhận phòng. Không gửi ảnh mã cho người khác.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
