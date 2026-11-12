import React from 'react';
import { 
  X, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Award, 
  Coffee, 
  Bike, 
  Compass, 
  HelpCircle 
} from 'lucide-react';
import { MemberProfile } from '../types/index.ts';

interface PointsModalProps {
  profile: MemberProfile;
  onClose: () => void;
  onRedeemReward: (title: string, cost: number) => void;
}

export const PointsModal: React.FC<PointsModalProps> = ({
  profile,
  onClose,
  onRedeemReward
}) => {
  const rewards = [
    {
      id: 'r1',
      title: 'Voucher 50.000đ tại Cà phê Mị Ơi / Thào Coffee',
      pointsCost: 100,
      icon: '☕',
      category: 'Ẩm thực & Thư giãn'
    },
    {
      id: 'r2',
      title: 'Giảm 100.000đ khi thuê Xe Máy Cào Cào leo núi',
      pointsCost: 150,
      icon: '🏍️',
      category: 'Phương tiện di chuyển'
    },
    {
      id: 'r3',
      title: 'Voucher giảm 150.000đ Tour Trekking Sống Lưng Khủng Long',
      pointsCost: 200,
      icon: '🥾',
      category: 'Trải nghiệm đỉnh cao'
    },
    {
      id: 'r4',
      title: 'Set Trà Shan Tuyết Cổ Thụ 500g đặc sản Tà Xùa',
      pointsCost: 250,
      icon: '🍵',
      category: 'Quà đặc sản'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Member Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-2xl shadow-lg">
            ☁️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">{profile.name}</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                {profile.membershipTier}
              </span>
            </div>
            <p className="text-xs text-slate-400">Tài khoản thành viên Tà Xùa Trip đã xác minh</p>
          </div>
        </div>

        {/* Points Balance Card */}
        <div className="bg-gradient-to-r from-teal-950/60 via-slate-800 to-slate-850 border border-teal-500/40 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Số Điểm Mây Khả Dụng:</span>
            <div className="text-3xl font-black text-teal-300 mt-0.5 flex items-center gap-2">
              <span>{profile.cloudPoints}</span>
              <span className="text-sm font-normal text-slate-400">Điểm Mây</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <span className="block text-emerald-400 font-bold">+50 - 100 điểm</span>
            <span>mỗi booking hoàn tất</span>
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            <span>Đổi Quà & Voucher Ưu Đãi Độc Quyền</span>
          </h3>

          {rewards.map((rew) => {
            const canAfford = profile.cloudPoints >= rew.pointsCost;
            return (
              <div
                key={rew.id}
                className="bg-slate-850 border border-slate-750 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-650 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{rew.icon}</div>
                  <div>
                    <h4 className="font-bold text-xs text-white">{rew.title}</h4>
                    <span className="text-xs text-slate-400">{rew.category}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <button
                    disabled={!canAfford}
                    onClick={() => onRedeemReward(rew.title, rew.pointsCost)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      canAfford
                        ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Đổi ({rew.pointsCost} điểm)
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Anti-fraud transparency note (from PDF Section 6 & 11) */}
        <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400 border border-slate-750 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Điểm Mây chỉ được cộng khi khách thực tế đến check-in và hoàn tất dịch vụ. Ngăn chặn tự đặt phòng ảo và hành vi gian lận.
          </span>
        </div>
      </div>
    </div>
  );
};
