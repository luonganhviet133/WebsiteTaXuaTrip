import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  MapPin,
  Copy,
  Check,
  Navigation,
  MessageCircle,
  Clock
} from 'lucide-react';
import { SiteContentConfig } from '../types/index.ts';

interface SosModalProps {
  onClose: () => void;
  siteContent?: SiteContentConfig;
}

const MOUNTAIN_LANDMARKS = [
  {
    id: 'deo-chen',
    label: 'Đèo Chẹn (Bắc Yên ↔ Tà Xùa)',
    coords: '21.2580°N, 104.4510°E',
    eta: '12–18 phút từ đội trực Bắc Yên / Tà Xùa'
  },
  {
    id: 'nga-ba-xa',
    label: 'Ngã 3 Trung Tâm Xã & Đỉnh Gió',
    coords: '21.3278°N, 104.4775°E',
    eta: '5–8 phút từ trạm trực trung tâm xã'
  },
  {
    id: 'song-lung',
    label: 'Dốc xuống Sống Lưng Khủng Long (Háng Đồng)',
    coords: '21.3612°N, 104.5240°E',
    eta: '15–20 phút (Cần xe côn/xe số khỏe kéo hộ)'
  },
  {
    id: 'thao-nguyen',
    label: 'Cung Thảo Nguyên – Cây Cô Đơn – Suối Sập',
    coords: '21.3410°N, 104.4590°E',
    eta: '10–15 phút từ trung tâm xã'
  },
  {
    id: 'phu-sa-phin',
    label: 'Chân đường rừng Phu Sa Phìn / Tà Xùa Cổ',
    coords: '21.3755°N, 104.5410°E',
    eta: '20–30 phút (Đội Porter & Dân quân Háng Đồng)'
  }
];

const INCIDENT_TYPES = [
  { id: 'bike_breakdown', label: 'Thủng lốp / Chết máy / Đứt xích giữa đèo' },
  { id: 'out_of_fuel', label: 'Hết xăng xe máy / Cần tiếp xăng gấp' },
  { id: 'fog_slippery', label: 'Sương mù dày đặc / Ô tô sa lầy cần dẫn đường' },
  { id: 'medical_lost', label: 'Sơ cứu Y tế / Trật khớp / Lạc đường trekking' }
];

export const SosModal: React.FC<SosModalProps> = ({ onClose, siteContent }) => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>(MOUNTAIN_LANDMARKS[0].id);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(INCIDENT_TYPES[0].id);
  const [gpsCoords, setGpsCoords] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copiedSos, setCopiedSos] = useState(false);

  const selectedSpot =
    MOUNTAIN_LANDMARKS.find((s) => s.id === selectedSpotId) || MOUNTAIN_LANDMARKS[0];
  const selectedIncident =
    INCIDENT_TYPES.find((i) => i.id === selectedIncidentId) || INCIDENT_TYPES[0];

  const rescuePhone = siteContent?.footerConfig?.rescueHotline || '0981 119 115';
  const supportZalo = siteContent?.footerConfig?.supportZalo || '0981 234 567';

  const adminSosChannels = (siteContent?.socialChannels || [])
    .filter((ch) => ch.isActive && ch.placements.includes('sos_modal'))
    .map((ch) => ({
      title: ch.title,
      category: ch.description,
      phone: ch.handleOrNumber,
      badge: ch.badgeText || 'Trực 24/7 (Chính thức)',
      isPrimary: true
    }));

  const defaultEmergencyContacts = [
    {
      title: 'Đội Cứu Hộ Đèo Chẹn & Dốc Núi Tà Xùa',
      category: 'Kéo xe sa lầy, thủng lốp, chết máy, dẫn đường sương mù giữa đèo',
      phone: rescuePhone,
      badge: 'Trực 24/7',
      isPrimary: true
    },
    {
      title: 'Đội Xe Ôm Bản Địa & Sửa Xe Lưu Động (Ngã Ba Xã)',
      category: 'Thay săm lốp tại chỗ, tiếp xăng xe máy tận dốc Sống Lưng & Đỉnh Gió',
      phone: '0988 991 223',
      badge: 'Có mặt 10p',
      isPrimary: true
    },
    {
      title: 'Trạm Y Tế Xã Tà Xùa',
      category: 'Sơ cứu chấn thương, sốt cao, tụt huyết áp vùng cao',
      phone: '0212 3851 456',
      badge: 'Y tế khẩn cấp',
      isPrimary: false
    },
    {
      title: 'Công An & Dân Quân Tự Vệ Xã Tà Xùa',
      category: 'An ninh trật tự, lạc đường rừng, hỗ trợ tìm kiếm ban đêm',
      phone: '0212 3851 123',
      badge: 'Công quyền',
      isPrimary: false
    }
  ];

  const emergencyContacts =
    adminSosChannels.length > 0
      ? [...adminSosChannels, ...defaultEmergencyContacts.slice(1)]
      : defaultEmergencyContacts;

  const handleDetectGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsCoords(`${selectedSpot.coords} (Mốc ước tính)`);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords(
          `${pos.coords.latitude.toFixed(5)}°N, ${pos.coords.longitude.toFixed(5)}°E`
        );
        setGpsLoading(false);
      },
      () => {
        setGpsCoords(`${selectedSpot.coords} (Tọa độ mốc đèo)`);
        setGpsLoading(false);
      },
      { timeout: 5000 }
    );
  };

  const sosMessageText = `[CỨU HỘ KHẨN CẤP TÀ XÙA] Tôi đang gặp sự cố: "${
    selectedIncident.label
  }" tại khu vực: ${selectedSpot.label} (Tọa độ GPS: ${
    gpsCoords || selectedSpot.coords
  }). Rất mong đội cứu hộ hỗ trợ gấp!`;

  const handleCopySosMessage = () => {
    navigator.clipboard?.writeText(sosMessageText);
    setCopiedSos(true);
    setTimeout(() => setCopiedSos(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-white">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Trung Tâm Cứu Hộ Đèo Chẹn & Dốc Núi Tà Xùa 24/7
            </h2>
            <p className="text-xs text-rose-200 mt-0.5">
              Xác định nhanh mốc tọa độ trên đèo, gửi tin nhắn SOS kèm vị trí GPS hoặc gọi thẳng đội trực cứu hộ bản địa.
            </p>
          </div>
        </div>

        {/* Step 1: Quick GPS & Mountain Spot Selector */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>1. Chọn vị trí đèo bạn đang đứng & tình huống gặp phải</span>
            </span>
            <button
              type="button"
              onClick={handleDetectGps}
              className="px-3 py-1.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-400" />
              <span>{gpsLoading ? 'Đang lấy tọa độ...' : gpsCoords ? `GPS: ${gpsCoords}` : 'Lấy tọa độ GPS hiện tại'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Khu vực / Mốc đèo gần nhất:
              </label>
              <select
                value={selectedSpotId}
                onChange={(e) => setSelectedSpotId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-rose-400"
              >
                {MOUNTAIN_LANDMARKS.map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Sự cố đang gặp phải:
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 focus:outline-none focus:border-rose-400"
              >
                {INCIDENT_TYPES.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/80">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Thời gian tiếp cận dự kiến:</strong> {selectedSpot.eta} · Tọa độ mốc: {gpsCoords || selectedSpot.coords}
            </span>
          </div>

          {/* Generated SOS Message & 1-Click Actions */}
          <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-3 space-y-2">
            <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {sosMessageText}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySosMessage}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedSos ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSos ? 'Đã sao chép tin nhắn SOS!' : 'Sao chép nội dung cầu cứu'}</span>
              </button>

              <a
                href={`https://zalo.me/${supportZalo.replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCopySosMessage}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Gửi Zalo Đội Cứu Hộ</span>
              </a>

              <a
                href={`tel:${rescuePhone.replace(/\s+/g, '')}`}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi Ngay {rescuePhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: 24/7 Emergency Hotlines Directory */}
        <div className="space-y-2.5 mb-5">
          <div className="text-xs font-extrabold text-slate-200">
            2. Danh bạ trực chiến 24/7 tại xã Tà Xùa & Bắc Yên (Hoạt động cả khi mất mạng 4G)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                  contact.isPrimary
                    ? 'bg-rose-950/35 border-rose-500/60'
                    : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-xs sm:text-sm text-white leading-snug">
                      {contact.title}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        contact.isPrimary
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {contact.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    {contact.category}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="font-mono font-black text-sm text-rose-200 tabular-nums">
                    {contact.phone}
                  </span>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Gọi ngay</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Essential Safety Protocol */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-200 space-y-1.5">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Quy tắc sinh tồn khi gặp sự cố đường đèo sương mù:</span>
          </div>
          <p>1. Tấp xe sát lề phải (phía vách núi taluy dương), bật đèn cảnh báo hoặc đặt vật cản cách xe 15m phía trước/sau.</p>
          <p>2. Tuyệt đối không đứng sát mép hộ lan taluy âm khi trời tối hoặc sương mù dày dưới 5m.</p>
          <p>3. Khi đổ đèo dốc Sống Lưng hoặc Đèo Chẹn bằng xe số, luôn cài số 1 hoặc số 2 để hãm bằng động cơ, tránh rà phanh liên tục gây cháy má phanh.</p>
        </div>
      </div>
    </div>
  );
};
