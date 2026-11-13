import React, { useState } from 'react';
import {
  X,
  Star,
  CheckCircle2,
  Sparkles,
  Camera,
  Heart
} from 'lucide-react';
import { Booking, Review } from '../types/index.ts';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (review: Omit<Review, 'id' | 'createdAt' | 'isVerifiedStay'>) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSubmitReview
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(booking.guestName || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const availableTags = [
    'View mây chuẩn 100%',
    'Chủ nhà siêu nhiệt tình',
    'Phòng sạch sẽ, nước nóng tốt',
    'Đúng như ảnh chụp',
    'Sẽ quay lại lần sau',
    'Cà phê ngon view đẹp'
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const fullComment = selectedTags.length > 0 
      ? `[${selectedTags.join(', ')}] ${comment.trim()}`
      : comment.trim();

    onSubmitReview({
      listingId: booking.listingId,
      bookingId: booking.id,
      reviewerName: reviewerName.trim() || 'Du khách ẩn danh',
      rating,
      comment: fullComment,
      roomName: booking.roomName
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
        <div className="bg-brand-800 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Đánh Giá Dịch Vụ Thực Tế</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Đánh Giá Trải Nghiệm Tại {booking.listingTitle}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Đánh giá gắn với mã đơn xác thực {booking.id}
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
                <h4 className="text-lg font-black text-brand-800">
                  Cảm Ơn Đánh Giá Của Bạn!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Đánh giá đã được xác thực và hiển thị công khai trên hồ sơ của{' '}
                  <strong>{booking.listingTitle}</strong>. Cảm ơn bạn đã đóng góp cho cộng đồng!
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-brand-800 text-white text-xs font-bold rounded-2xl hover:bg-brand-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating selection */}
              <div className="text-center py-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Bạn đánh giá mức độ hài lòng về chuyến đi thế nào?
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-extrabold text-amber-700 mt-2">
                  {rating === 5 && 'Tuyệt vời · Đúng như kỳ vọng'}
                  {rating === 4 && 'Rất tốt · Có điểm cộng'}
                  {rating === 3 && 'Bình thường · Tạm ổn'}
                  {rating <= 2 && 'Chưa hài lòng · Cần cải thiện'}
                </div>
              </div>

              {/* Quick tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn các đặc điểm nổi bật (tùy chọn):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 border-teal-600 text-teal-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhận xét chi tiết (Thực tế không che giấu): *
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ về tầm nhìn view mây, chất lượng phòng, thái độ của chủ cơ sở, đồ ăn và đường đi..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                />
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên hiển thị của bạn
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-800 hover:bg-brand-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  Gửi Đánh Giá & Nhận Điểm
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
