import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Phone,
  Scale
} from 'lucide-react';
import { Booking, BookingDispute } from '../types/index.ts';

interface DisputeModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDispute: (dispute: Omit<BookingDispute, 'id' | 'createdAt' | 'status'>) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSubmitDispute
}) => {
  const [issueType, setIssueType] = useState<BookingDispute['issueType']>('false_photo');
  const [description, setDescription] = useState('');
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone || '');
  const [guestName, setGuestName] = useState(booking.guestName || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !guestPhone.trim()) return;

    onSubmitDispute({
      bookingId: booking.id,
      listingId: booking.listingId,
      listingTitle: booking.listingTitle,
      guestName: guestName.trim() || 'Du khách',
      guestPhone: guestPhone.trim(),
      issueType,
      description: description.trim()
    });

    setIsSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-[#073161] text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Scale className="w-3 h-3" />
              <span>Trung Tâm Hỗ Trợ Khiếu Nại & Trọng Tài</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Gửi Khiếu Nại & Yêu Cầu Hỗ Trợ Đơn Đặt
            </h3>
            <p className="text-xs text-rose-100 mt-0.5">
              Admin Tà Xùa Trip làm trung gian can thiệp, bảo vệ quyền lợi du khách 100%
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#073161]">
                  Khiếu Nại Đã Được Tiếp Nhận
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Mã khiếu nại của bạn đã được gắn trực tiếp vào đơn <strong>{booking.id}</strong>. Bộ phận trọng tài và điều phối viên Tà Xùa Trip sẽ trực tiếp liên hệ cơ sở <strong>{booking.listingTitle}</strong> và gọi lại cho bạn qua SĐT <strong>{guestPhone}</strong> trong vòng 15-30 phút!
                </p>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left text-xs text-rose-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Cam kết của Ban Quản Trị Tà Xùa Trip:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Xác minh đối chiếu hồ sơ và thỏa thuận đặt chỗ gốc.</li>
                  <li>Nếu cơ sở sai lệch cam kết (ảnh giả, đổi phòng, hủy vô cớ): Buộc hoàn cọc 100% hoặc đổi phòng tương đương miễn phí.</li>
                  <li>Tích lũy thêm điểm Mây đền bù trải nghiệm cho du khách.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#073161] text-white text-xs font-bold rounded-2xl hover:bg-[#0a3f7c] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Booking Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Mã đơn: <strong className="text-[#073161]">{booking.id}</strong></span>
                  <span className="font-semibold text-teal-700">{booking.checkInDate}</span>
                </div>
                <div className="font-bold text-[#073161] text-sm">{booking.listingTitle}</div>
                {booking.roomName && (
                  <div className="text-slate-600">Hạng phòng: {booking.roomName}</div>
                )}
              </div>

              {/* Issue Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Loại vấn đề bạn gặp phải:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'false_photo', label: 'Ảnh không đúng thực tế' },
                    { id: 'pricing_scam', label: 'Gian lận giá / Phụ thu sai' },
                    { id: 'room_mismatch', label: 'Sai hạng phòng đã chốt' },
                    { id: 'service_attitude', label: 'Thái độ phục vụ / Sự cố' },
                    { id: 'cancellation_refund', label: 'Yêu cầu huỷ & hoàn tiền' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIssueType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition-colors cursor-pointer ${
                        issueType === item.id
                          ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết sự việc / Bằng chứng thực tế: *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vui lòng nêu rõ thời điểm, thái độ phục vụ hoặc sự khác biệt giữa cam kết và thực tế để Admin có cơ sở can thiệp..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-600 text-slate-800"
                />
              </div>

              {/* Contact phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên của bạn *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#073161] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại Admin liên hệ *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#073161] text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  Gửi Khiếu Nại Lên Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
