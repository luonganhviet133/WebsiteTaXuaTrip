import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Phone,
  FileText,
  CheckCircle2,
  Award,
  AlertCircle
} from 'lucide-react';
import { Listing, PartnerClaimRequest } from '../types/index.ts';

interface PartnerClaimModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSubmitClaim: (request: Omit<PartnerClaimRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const PartnerClaimModal: React.FC<PartnerClaimModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSubmitClaim
}) => {
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState(listing.phone || '');
  const [zalo, setZalo] = useState(listing.zalo || '');
  const [cccdOrTax, setCccdOrTax] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !ownerPhone.trim() || !cccdOrTax.trim() || !hasAgreedTerms) {
      return;
    }

    onSubmitClaim({
      listingId: listing.id,
      listingTitle: listing.title,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      zalo: zalo.trim(),
      cccdOrTax: cccdOrTax.trim(),
      proofDocumentNote: proofNote.trim() || 'Hồ sơ xác thực chính chủ cơ sở'
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
        <div className="bg-gradient-to-r from-brand-800 to-brand-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Award className="w-3 h-3" />
              <span>Chương trình Đối Tác Uy Tín</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Bạn Là Chủ Cơ Sở Này?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Đăng ký thành viên chính chủ để xác nhận uy tín & nhận huy hiệu Cấp 3
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-black text-brand-800">
                  Đã Gửi Hồ Sơ Xác Thực Thành Công!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Cảm ơn bạn! Ban quản trị Tà Xùa Trip đã tiếp nhận yêu cầu xác nhận cơ sở{' '}
                  <strong className="text-brand-800">{listing.title}</strong>. Chúng tôi sẽ liên hệ số điện thoại{' '}
                  <strong>{ownerPhone}</strong> trong vòng 2-4 giờ làm việc để hoàn tất cấp quyền quản lý cho bạn.
                </p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-left text-xs text-teal-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Quyền lợi sau khi xác thực thành viên chính chủ:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Gắn nhãn Đối Tác Xác Thực Cấp 3 (Huy hiệu vàng uy tín).</li>
                  <li>Tự cập nhật lịch trống, phòng trống và giá theo thời gian thực.</li>
                  <li>Nhận thông báo cuộc trò chuyện trực tiếp từ du khách trên website.</li>
                  <li>Hưởng ưu đãi 0đ phí hoa hồng sàn theo chính sách cộng đồng Tà Xùa.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-brand-800 text-white text-xs font-bold rounded-full hover:bg-brand-700 transition-colors cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Listing Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                <img
                  src={listing.coverImage}
                  alt={listing.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cơ sở đang yêu cầu xác nhận:
                  </div>
                  <div className="text-sm font-extrabold text-brand-800 truncate">
                    {listing.title}
                  </div>
                  <div className="text-xs text-slate-500">{listing.address}</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên chủ cơ sở / Người đại diện hợp pháp *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A (Chủ Homestay)"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại chính chủ (Nhận OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="0981 xxx xxx"
                      className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số Zalo hỗ trợ khách *
                    </label>
                    <input
                      type="tel"
                      required
                      value={zalo}
                      onChange={(e) => setZalo(e.target.value)}
                      placeholder="0981 xxx xxx"
                      className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số CCCD hoặc Mã số thuế hộ kinh doanh *
                  </label>
                  <input
                    type="text"
                    required
                    value={cccdOrTax}
                    onChange={(e) => setCccdOrTax(e.target.value)}
                    placeholder="VD: 014201xxxxxx hoặc MST Hộ kinh doanh"
                    className="w-full px-3.5 py-2.5 text-base bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi chú / Chứng từ sở hữu (Hợp đồng thuê, ảnh biển hiệu, sổ đỏ)
                  </label>
                  <textarea
                    rows={2}
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Mô tả giấy phép kinh doanh, hợp đồng thuê đất hoặc ảnh biển hiệu tại thực địa..."
                    className="w-full px-3.5 py-2 text-base bg-white border border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                  />
                </div>

                {/* Terms agreement */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={hasAgreedTerms}
                    onChange={(e) => setHasAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-brand-800 focus:ring-brand-800"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    Tôi cam kết là chủ sở hữu / người đại diện hợp pháp của cơ sở này, cung cấp thông tin phòng và giá thật, không chặt chém và bảo vệ quyền lợi của du khách.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!hasAgreedTerms}
                  className="px-6 py-2.5 bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold rounded-full shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Xác Nhận & Gửi Hồ Sơ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
