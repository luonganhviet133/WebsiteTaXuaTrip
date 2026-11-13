import React from 'react';
import { DemoNotice } from './DemoNotice';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Calendar, 
  MapPin, 
  User, 
  Sparkles, 
  Share2, 
  Download,
  ShieldCheck
} from 'lucide-react';
import { Booking } from '../types/index.ts';
import { formatVND, calculateMemberPoints } from '../utils/rules.ts';
import { holdExpiryLabel } from '../api/holdsApi.ts';
import { DEPOSIT_PERCENT } from '../config/payment.ts';

interface BookingSuccessModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  booking,
  onClose
}) => {
  if (!booking) return null;

  const pointsEarned = calculateMemberPoints(booking.totalAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {booking.holdExpiresAt ? (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">Đã Giữ Phòng</h2>
            <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-left text-xs leading-relaxed text-amber-100">
              <p className="font-bold">
                Phòng được giữ đến <span className="text-amber-300">{holdExpiryLabel(booking.holdExpiresAt)}</span> (30 phút).
              </p>
              {typeof booking.depositAmount === 'number' && (
                <p className="mt-1">
                  Tiền cọc {DEPOSIT_PERCENT}%: <strong className="text-amber-300">{formatVND(booking.depositAmount)}</strong>, chuyển thẳng vào tài khoản
                  của cơ sở. Mở "Chuyến đi của tôi" → "Thanh toán" để đọc điều khoản và xem thông tin chuyển khoản. Chưa được cơ sở
                  xác nhận nhận cọc trước giờ trên thì phòng tự được trả lại.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
              Đã Tạo Phiếu Đặt Chỗ
            </h2>
            <DemoNotice dark className="mb-6 text-left">
              Phiếu này chỉ lưu trên trình duyệt của bạn, chưa gửi tới chủ cơ sở và chưa giữ phòng.
              Vui lòng gọi hoặc nhắn Zalo cho cơ sở để xác nhận phòng và đặt cọc.
            </DemoNotice>
          </>
        )}

        {/* N05.3: đơn trên server chưa có QR ở bước này; QR nhận phòng hiện trong "Chuyến đi của tôi" khi cơ sở xác nhận */}
        {booking.holdExpiresAt ? (
          <div className="bg-white p-4 rounded-2xl max-w-[260px] mx-auto mb-4 shadow-xl text-slate-900">
            <div className="text-xs text-slate-600">Mã đặt chỗ</div>
            <div className="font-mono text-xl font-black tracking-wider">{booking.bookingCode || booking.id}</div>
            <div className="text-xs text-slate-600 mt-1">Mã QR nhận phòng có trong "Chuyến đi của tôi" sau khi cơ sở xác nhận đã nhận cọc.</div>
          </div>
        ) : (
        <div className="bg-white p-4 rounded-2xl max-w-[200px] mx-auto mb-4 shadow-xl">
          <img
            src={booking.qrCodeUrl}
            alt="Mã QR Check-in"
            className="w-full h-auto object-contain"
          />
          <div className="text-xs text-slate-800 font-mono font-bold mt-1 text-center">
            {booking.id}
          </div>
        </div>
        )}

        {/* Cloud points earned alert */}
        <div className="bg-gradient-to-r from-teal-500/20 via-sky-500/20 to-indigo-500/20 border border-teal-500/30 rounded-2xl p-3 mb-6 flex items-center justify-center gap-2 text-xs font-bold text-teal-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Điểm Mây dự kiến: <strong>+{pointsEarned}</strong> (bản demo, chưa lưu lên hệ thống)</span>
        </div>

        {/* Booking Details Card */}
        <div className="bg-slate-850 rounded-2xl p-4 border border-slate-750 text-left text-xs space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Dịch vụ:</span>
            <span className="text-white font-semibold truncate max-w-[200px]">{booking.listingTitle}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Khách đại diện:</span>
            <span className="text-white font-semibold">{booking.guestName} ({booking.guestPhone})</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Thời gian:</span>
            <span className="text-sky-300 font-semibold">{booking.checkInDate} {booking.checkOutDate !== booking.checkInDate ? ` - ${booking.checkOutDate}` : ''}</span>
          </div>

          {booking.seatNumbers && (
            <div className="flex justify-between">
              <span className="text-slate-400">Số ghế:</span>
              <span className="text-teal-300 font-bold">{booking.seatNumbers.map(s => `Ghế ${s}`).join(', ')}</span>
            </div>
          )}

          {booking.pickupStop && (
            <div className="flex justify-between">
              <span className="text-slate-400">Điểm đón:</span>
              <span className="text-slate-200 font-medium">{booking.pickupStop}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-750 text-sm font-bold">
            <span className="text-slate-300">Tổng thanh toán:</span>
            <span className="text-teal-400">{formatVND(booking.totalAmount)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3 rounded-xl text-xs transition-colors"
        >
          Hoàn Tất & Về Trang Chủ
        </button>
      </div>
    </div>
  );
};
