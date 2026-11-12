import { ONLINE_PAYMENT_ENABLED } from '../config/features';
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
  Copy,
  Check,
  Sparkles,
  Star,
  MapPin,
  ShieldCheck,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  ExternalLink,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { Booking, Listing } from '../types/index.ts';
import { AuthUser } from '../types/auth.ts';
import {
  formatVND,
  buildVietQrPaymentPayload,
  canBookingLeaveReview,
  verifyPaymentProofStatus
} from '../utils/rules.ts';

interface MyTripsModalProps {
  isOpen: boolean;
  currentUser?: AuthUser | null;
  bookings: Booking[];
  listings: Listing[];
  onClose: () => void;
  onSelectListingForReview: (listing: Listing) => void;
  onSimulateCompleteBooking: (bookingId: string) => void;
  onConfirmDepositPaid: (bookingId: string) => void;
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
  onSimulateCompleteBooking,
  onConfirmDepositPaid,
  onOpenDispute,
  onOpenReviewModal,
  onRequireLogin
}) => {
  const [lookupQuery, setLookupQuery] = useState('');
  const [activeVietQrBookingId, setActiveVietQrBookingId] = useState<string | null>(null);
  const [activeVoucherBookingId, setActiveVoucherBookingId] = useState<string | null>(null);
  const [copiedMemoId, setCopiedMemoId] = useState<string | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [serverBookings, setServerBookings] = useState<Booking[] | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'unauthenticated' | 'error'>('idle');
  const fetchSeqRef = React.useRef(0);

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
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  // S6: Do NOT fallback to mock demo bookings when unauthenticated or for other users
  const activeBookings = serverBookings || [];

  const filteredBookings = activeBookings.filter((b) => {
    if (!lookupQuery.trim()) return true;
    const q = lookupQuery.trim().toLowerCase();
    const id = (b.id || '').toLowerCase();
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

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
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
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            Đã hủy
          </span>
        );
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMemoId(id);
      setTimeout(() => setCopiedMemoId(null), 2500);
    } catch {
      setCopiedMemoId(id);
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

          {!ONLINE_PAYMENT_ENABLED && fetchStatus !== 'unauthenticated' && (
            <DemoNotice>
              Thanh toán trực tuyến chưa mở: website chưa nhận tiền cọc, chưa nhận biên lai và chưa
              tự giữ phòng. Vui lòng liên hệ trực tiếp cơ sở (số điện thoại trên trang chi tiết) để đặt cọc và xác nhận.
            </DemoNotice>
          )}

          {/* Render Bookings */}
          {fetchStatus !== 'unauthenticated' && !isLoadingBookings && filteredBookings.map((booking) => {
            const matchedListing = listings.find((l) => l.id === booking.listingId);
            const vietQr = buildVietQrPaymentPayload(booking.id, booking.totalAmount, 50);
            const isVietQrOpen = activeVietQrBookingId === booking.id;
            const isVoucherOpen = activeVoucherBookingId === booking.id;
            const eligibleForReview = canBookingLeaveReview(booking.status, booking.reviewed);
            const proofStatus = verifyPaymentProofStatus(booking);

            return (
              <div
                key={booking.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-brand-800 text-white font-mono text-xs font-extrabold uppercase">
                      #{booking.id}
                    </span>
                    {getStatusBadge(booking.status)}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${proofStatus.statusBadgeColor}`}>
                      {proofStatus.statusLabel}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Đặt ngày: {booking.createdAt}
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
                        👥 Số lượng: <strong>{booking.guestsCount} khách/ghế</strong>
                      </span>
                    </div>

                    {/* Dải thông tin biên lai thanh toán đã lưu */}
                    <div className="pt-2 flex items-center gap-3">
                      {proofStatus.hasProof && proofStatus.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptUrl(proofStatus.proofImageUrl!)}
                          className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-teal-700" />
                          <span>Xem Ảnh Biên Lai Đã Nộp</span>
                          <ExternalLink className="w-3 h-3 text-teal-600" />
                        </button>
                      ) : ONLINE_PAYMENT_ENABLED ? (
                        <button
                          type="button"
                          onClick={() => {
                            booking.paymentStatus = 'proof_uploaded';
                            booking.paymentProof = {
                              imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
                              amountPaid: Math.round(booking.totalAmount * 0.3),
                              amountTransferred: Math.round(booking.totalAmount * 0.3),
                              uploadedAt: new Date().toISOString(),
                              note: 'Khách bổ sung biên lai sau khi đặt'
                            };
                            setPreviewReceiptUrl(booking.paymentProof.imageUrl);
                          }}
                          className="text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-sky-700" />
                          <span>+ Tải Biên Lai Chuyển Khoản Bổ Sung</span>
                        </button>
                      ) : null}

                      {booking.paymentStatus === 'partner_confirmed' && (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Đối tác đã xác nhận đã nhận tiền
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-2">
                    {ONLINE_PAYMENT_ENABLED && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveVoucherBookingId(null);
                        setActiveVietQrBookingId(isVietQrOpen ? null : booking.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isVietQrOpen
                          ? 'bg-brand-800 text-white border-brand-800'
                          : 'bg-slate-50 hover:bg-slate-100 text-brand-800 border-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Mã VietQR Cọc (50%)</span>
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

                    {booking.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onSimulateCompleteBooking(booking.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                      >
                        ✓ Đánh dấu Hoàn tất lưu trú
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable Panel 1: Dynamic VietQR Payment */}
                {ONLINE_PAYMENT_ENABLED && isVietQrOpen && (
                  <div className="bg-[#f8fafc] border border-teal-200 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    <div className="sm:col-span-4 flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200">
                      <img
                        src={vietQr.qrImageUrl}
                        alt={`Mã VietQR chuyển khoản ${vietQr.transferMemo}`}
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                      <span className="text-xs font-bold text-slate-500 mt-1.5">
                        Quét bằng App Ngân hàng bất kỳ (Napas 247)
                      </span>
                    </div>

                    <div className="sm:col-span-8 space-y-2.5 text-xs">
                      <div className="inline-flex items-center gap-1.5 text-teal-800 font-extrabold bg-teal-100/80 px-3 py-1 rounded-full text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thanh toán Cọc Bảo Đảm 50% qua VietQR tự động</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-500 block text-xs">Ngân hàng thụ hưởng:</span>
                          <span className="font-extrabold text-brand-800">{vietQr.bankCode} Bank</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">Số tài khoản:</span>
                          <span className="font-mono font-extrabold text-brand-800">
                            {vietQr.accountNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">Số tiền đặt cọc (50%):</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {formatVND(vietQr.depositAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">Thanh toán khi nhận phòng:</span>
                          <span className="font-bold text-slate-700">
                            {formatVND(vietQr.remainingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-xs text-slate-500 block">
                            Nội dung chuyển khoản tự động:
                          </span>
                          <span className="font-mono font-extrabold text-brand-800">
                            {vietQr.transferMemo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(vietQr.transferMemo, booking.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-800 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedMemoId === booking.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy nội dung</span>
                            </>
                          )}
                        </button>
                      </div>

                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => onConfirmDepositPaid(booking.id)}
                          className="w-full bg-brand-800 hover:bg-brand-700 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          Xác nhận đã chuyển khoản cọc → Chuyển sang Đã giữ phòng
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
                      <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-2">
                        <QrCode className="w-16 h-16 text-brand-800" />
                      </div>
                      <div className="font-mono text-xs font-extrabold text-brand-800">
                        {booking.id.toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-500">
                        Đưa mã này cho chủ cơ sở khi nhận phòng
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Xem Ảnh Biên Lai Chuyển Khoản */}
        {previewReceiptUrl && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-sm font-extrabold text-brand-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-700" />
                  <span>Biên Lai Chuyển Khoản Đã Lưu Trữ</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptUrl(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center max-h-[60vh]">
                <img
                  src={previewReceiptUrl}
                  alt="Biên lai chuyển khoản phóng to"
                  className="w-full h-auto object-contain max-h-[55vh]"
                />
              </div>
              <div className="flex justify-between items-center pt-1 text-xs text-slate-500">
                <span>Dùng để đối soát & làm bằng chứng khiếu nại</span>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptUrl(null)}
                  className="bg-brand-800 text-white font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
