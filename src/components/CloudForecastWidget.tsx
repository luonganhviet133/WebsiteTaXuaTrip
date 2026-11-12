import React, { useState, useMemo } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  Sparkles,
  Clock,
  BellRing,
  Check,
  Info,
  Sliders,
  MapPin,
  Eye,
  Compass,
  Camera,
  ArrowRight,
  Star
} from 'lucide-react';
import { CloudHuntingForecast, Listing } from '../types/index.ts';
import { INITIAL_LISTINGS } from '../data/mockData.ts';
import { calculateCloudProbability, formatVND } from '../utils/rules.ts';

interface CloudForecastWidgetProps {
  forecasts: CloudHuntingForecast[];
  listings?: Listing[];
  onSelectListing?: (listing: Listing) => void;
  onOpenMap?: () => void;
  onOpenCommunityCloudFeed?: () => void;
}

const GOLDEN_TIME_WINDOWS = [
  {
    window: '05:15 – 07:30',
    title: 'Bình minh đại dương mây',
    chanceBonus: '+8%',
    desc: 'Thời điểm nghịch nhiệt mạnh nhất, mây đặc quánh tràn qua thung lũng Sống Lưng & Đỉnh Gió.',
    highlight: true
  },
  {
    window: '07:30 – 09:45',
    title: 'Nắng sớm xuyên biển mây',
    chanceBonus: 'Chuẩn chụp ảnh',
    desc: 'Mặt trời lên cao chiếu tia nắng vàng rực qua lớp mây bồng bềnh tại Mị Ơi, Hiên Cafe.',
    highlight: false
  },
  {
    window: '16:30 – 18:00',
    title: 'Hoàng hôn tím trên biển mây',
    chanceBonus: 'Đỉnh Gió 92%',
    desc: 'Ngắm mặt trời lặn xuống biển mây phía Tây tại Đỉnh Gió, Cây Cô Đơn và Thảo Nguyên.',
    highlight: true
  }
];

const THREE_DAY_OUTLOOK = [
  {
    dayLabel: 'Hôm nay',
    dateNote: 'Đang đạt đỉnh mây',
    prob: 92,
    temp: '12°C – 19°C',
    wind: '7 km/h (Gió nhẹ)',
    verdict: 'Biển mây dày đặc tại Đỉnh Gió & Sống Lưng'
  },
  {
    dayLabel: 'Ngày mai',
    dateNote: 'Khí lạnh tăng cường nhẹ',
    prob: 89,
    temp: '11°C – 18°C',
    wind: '9 km/h (Đông Bắc)',
    verdict: 'Rất đẹp để săn bình minh lúc 05:30 sáng'
  },
  {
    dayLabel: 'Cuối tuần này',
    dateNote: 'Độ ẩm thung lũng 90%',
    prob: 94,
    temp: '10°C – 18°C',
    wind: '6 km/h (Lặng gió)',
    verdict: 'Cơ hội vàng săn thác mây Khe Cải & Đỉnh Gió'
  }
];

export const CloudForecastWidget: React.FC<CloudForecastWidgetProps> = ({
  forecasts,
  listings = INITIAL_LISTINGS,
  onSelectListing,
  onOpenMap,
  onOpenCommunityCloudFeed
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(
    forecasts[0]?.location || 'Đỉnh Gió'
  );
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [spotCategoryFilter, setSpotCategoryFilter] = useState<'all' | 'homestay' | 'coffee'>('all');

  // Interactive Live Weather Simulator
  const [simHumidity, setSimHumidity] = useState(88);
  const [simWind, setSimWind] = useState(9);
  const [simTempDiff, setSimTempDiff] = useState(10);
  const [showSim, setShowSim] = useState(false);

  const activeForecast =
    forecasts.find((f) => f.location === selectedLocation) || forecasts[0];

  const simulatedResult = calculateCloudProbability({
    humidity: simHumidity,
    windSpeed: simWind,
    tempDiff: simTempDiff
  });

  // Match real verified Homestays & Cloud Cafes at or near the selected cloud location
  const matchingCloudViewListings = useMemo(() => {
    const locNorm = selectedLocation.toLowerCase();
    const pool = listings.filter((l) => {
      if (l.status !== 'approved') return false;
      if (spotCategoryFilter === 'all') {
        if (!['homestay', 'coffee'].includes(l.category)) return false;
      } else if (l.category !== spotCategoryFilter) {
        return false;
      }
      return true;
    });

    const exactAreaMatches = pool.filter((l) => {
      const areaLower = l.area.toLowerCase();
      const titleLower = l.title.toLowerCase();
      const addrLower = l.address.toLowerCase();
      if (locNorm.includes('đỉnh gió')) {
        return areaLower.includes('đỉnh gió') || areaLower.includes('trung tâm');
      }
      if (locNorm.includes('sống lưng')) {
        return areaLower.includes('sống lưng') || addrLower.includes('háng đồng');
      }
      if (locNorm.includes('khe cải')) {
        return areaLower.includes('khe cải') || titleLower.includes('khe cải');
      }
      if (locNorm.includes('thảo nguyên') || locNorm.includes('cá heo')) {
        return areaLower.includes('thảo nguyên') || addrLower.includes('thảo nguyên');
      }
      return areaLower.includes(locNorm);
    });

    const targetList = exactAreaMatches.length >= 3 ? exactAreaMatches : pool;

    return [...targetList]
      .sort((a, b) => {
        if (Boolean(a.isAdminFeatured) !== Boolean(b.isAdminFeatured)) {
          return a.isAdminFeatured ? -1 : 1;
        }
        if (Boolean(a.hasCloudView) !== Boolean(b.hasCloudView)) {
          return a.hasCloudView ? -1 : 1;
        }
        return b.rating - a.rating;
      })
      .slice(0, 6);
  }, [listings, selectedLocation, spotCategoryFilter]);

  const handleSubscribeAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    setAlertSubscribed(true);
  };

  return (
    <div className="bg-[#f8fafc] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header & Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-black uppercase tracking-wider mb-2 border border-teal-200/60">
              <CloudSun className="w-3.5 h-3.5 text-teal-600" />
              <span>DỮ LIỆU KHÍ TƯỢNG ĐỘ CAO 1.500M – 1.850M</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#073161] tracking-tight">
              Trung Tâm Dự Báo Săn Mây & Tọa Độ Cloud View Tà Xùa
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Phân tích từ độ ẩm thung lũng, tốc độ gió và chênh lệch nhiệt độ ngày - đêm tại 5 đỉnh săn mây chính. Chọn tọa độ bên dưới để xem ngay giờ vàng và các Homestay / Quán Cafe ngắm biển mây trực diện.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenCommunityCloudFeed && (
              <button
                type="button"
                onClick={onOpenCommunityCloudFeed}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-extrabold text-emerald-900 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Xem ảnh "Mây Sáng Nay" thực địa</span>
              </button>
            )}
            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-xs font-extrabold text-sky-900 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-sky-700" />
                <span>Mở Bản đồ tọa độ săn mây</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSim(!showSim)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>{showSim ? 'Ẩn mô phỏng khí tượng' : 'Mô phỏng thời tiết'}</span>
            </button>
          </div>
        </div>

        {/* 2. Radar Selector: 5 Cloud Hunting Coordinates */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {forecasts.map((f) => {
            const isSelected = f.location === selectedLocation;
            return (
              <button
                key={f.location}
                type="button"
                onClick={() => setSelectedLocation(f.location)}
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-50 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-[#073161]' : 'text-slate-800'}`}>
                    {f.location}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black tabular-nums ${
                      f.cloudProbability >= 85
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {f.cloudProbability}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>🌡️ {f.tempMin}°–{f.tempMax}°C</span>
                  <span className="text-teal-700 font-bold">{f.goldenHours.split('&')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Main Forecast Dashboard & 3-Day Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Active Coordinate Deep Telemetry & Golden Time Windows */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>Đang xem dữ liệu khí tượng tại tọa độ</span>
                </div>
                <h2 className="text-2xl font-black text-[#073161] flex flex-wrap items-center gap-2.5">
                  <span>{activeForecast.location}</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                    {activeForecast.condition}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl shrink-0">
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-semibold">Xác suất biển mây hôm nay</div>
                  <div className="text-2xl font-black text-teal-700 tabular-nums leading-none mt-0.5">
                    {activeForecast.cloudProbability}%
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                  <CloudSun className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* 4 Key Weather Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Độ ẩm thung lũng</span>
                </div>
                <div className="text-lg font-black text-[#073161] tabular-nums">{activeForecast.humidity}%</div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Đạt ngưỡng ngưng tụ</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Wind className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Tốc độ gió</span>
                </div>
                <div className="text-lg font-black text-[#073161] tabular-nums">{activeForecast.windSpeedKmH} km/h</div>
                <div className="text-[11px] text-teal-700 font-bold mt-0.5">Gió êm giữ biển mây</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Biên độ nhiệt</span>
                </div>
                <div className="text-lg font-black text-[#073161] tabular-nums">
                  {activeForecast.tempMin}°C – {activeForecast.tempMax}°C
                </div>
                <div className="text-[11px] text-amber-800 font-bold mt-0.5">Nghịch nhiệt mạnh</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Khung giờ vàng</span>
                </div>
                <div className="text-sm font-black text-rose-700 mt-1">{activeForecast.goldenHours}</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-0.5">Đẹp nhất trong ngày</div>
              </div>
            </div>

            {/* Golden Hours Breakdown */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Lịch Trình Khung Giờ Săn Mây Hiệu Quả Nhất Trong Ngày
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {GOLDEN_TIME_WINDOWS.map((gw, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border ${
                      gw.highlight
                        ? 'bg-teal-50/70 border-teal-300'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-amber-800 tabular-nums">{gw.window}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200">
                        {gw.chanceBonus}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-[#073161] mb-1">{gw.title}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{gw.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Guide Advice */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-[#073161] mb-1">
                  Lời khuyên thực địa từ Thổ địa Tà Xùa tại {activeForecast.location}:
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {activeForecast.advice}
                </p>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: 3-Day Outlook + Alert Subscription + Mountain Packing */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* 3-Day Cloud Trend */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-extrabold text-[#073161] text-sm flex items-center justify-between">
                <span>Dự báo xu hướng 3 ngày tới</span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Mùa mây đẹp
                </span>
              </h3>
              <div className="space-y-2.5">
                {THREE_DAY_OUTLOOK.map((d, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800">{d.dayLabel}</span>
                        <span className="text-[11px] text-slate-500 ml-2">· {d.dateNote}</span>
                      </div>
                      <span className="text-xs font-black text-teal-800 bg-teal-100 border border-teal-300 px-2.5 py-0.5 rounded-full tabular-nums">
                        {d.prob}% có mây
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span>{d.temp}</span>
                      <span>Gió: {d.wind}</span>
                    </div>
                    <div className="text-[11px] text-teal-700 font-bold">{d.verdict}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free Cloud Alert */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <BellRing className="w-4 h-4 text-amber-600" />
                <h4 className="font-extrabold text-[#073161] text-sm">Bật Báo Thức & Cảnh Báo Biển Mây</h4>
              </div>
              <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                Nhận thông báo Zalo/Email lúc 05:00 sáng khi camera thực địa xác nhận biển mây đạt trên 85%.
              </p>

              {alertSubscribed ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Đã bật thông báo săn mây cho {selectedLocation}!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribeAlert} className="space-y-2">
                  <input
                    type="text"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="Nhập SĐT Zalo hoặc Email nhận tin..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#073161] hover:bg-[#0a3f7c] text-white font-extrabold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    Đăng Ký Nhận Báo Mây Miễn Phí
                  </button>
                </form>
              )}
            </div>

            {/* Practical Checklist */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 text-xs shadow-2xs">
              <h4 className="font-extrabold text-[#073161] text-sm mb-2.5 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Lưu ý quan trọng khi đi săn mây sớm:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-600">
                <li>• Mặc áo giữ nhiệt + áo gió chống nước (nhiệt độ 05:00 sáng khoảng 11°C–14°C).</li>
                <li>• Kiểm tra phanh và lốp xe máy trước khi đổ dốc xuống Sống Lưng Khủng Long.</li>
                <li>• Nếu ở Homestay có Cloud View tại Đỉnh Gió, bạn có thể ngắm biển mây ngay từ ban công phòng lúc 05:30.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Interactive Weather Simulator (Collapsible) */}
        {showSim && (
          <div className="bg-white border border-teal-200 rounded-3xl p-6 transition-all shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-base font-extrabold text-[#073161] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>Bộ Mô Phỏng Hình Thành Biển Mây Tà Xùa</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Điều chỉnh độ ẩm, tốc độ gió và chênh lệch nhiệt độ để kiểm tra khả năng ngưng tụ biển mây:
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500">Xác suất mô phỏng:</span>
                <div className="text-2xl font-black text-teal-700 tabular-nums">{simulatedResult.score}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Độ ẩm không khí:</span>
                  <span className="text-sky-700 tabular-nums">{simHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={simHumidity}
                  onChange={(e) => setSimHumidity(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Tốc độ gió:</span>
                  <span className="text-indigo-700 tabular-nums">{simWind} km/h</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={simWind}
                  onChange={(e) => setSimWind(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-700">Chênh lệch nhiệt độ Ngày - Đêm:</span>
                  <span className="text-amber-700 tabular-nums">{simTempDiff}°C</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="18"
                  value={simTempDiff}
                  onChange={(e) => setSimTempDiff(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-700">
                <strong className="text-[#073161]">Nhận định khí tượng:</strong> {simulatedResult.verdict}
              </span>
              <span className="text-slate-500">Mô hình nghịch nhiệt thung lũng Bắc Yên – Tà Xùa</span>
            </div>
          </div>
        )}

        {/* 5. Verified Cloud View Homestays & Cafes Right At This Coordinate */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 mb-1">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Đã thẩm định góc nhìn thực tế (Cloud View Verified)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#073161]">
                Homestay Ngắm Mây Tại Giường & Quán Cafe Săn Mây Đẹp Nhất Khu Vực {selectedLocation}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Bấm vào từng cơ sở để xem ảnh chụp góc nhìn thực tế không qua chỉnh sửa và kiểm tra phòng trống / menu.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(
                [
                  { id: 'all', label: 'Tất cả Cloud View' },
                  { id: 'homestay', label: '🏡 Homestay săn mây' },
                  { id: 'coffee', label: '☕ Cafe mép vực mây' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSpotCategoryFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                    spotCategoryFilter === tab.id
                      ? 'bg-[#073161] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchingCloudViewListings.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectListing && onSelectListing(item)}
                className="bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-md rounded-2xl overflow-hidden flex flex-col justify-between transition-all cursor-pointer group"
              >
                <div>
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
                      {item.isAdminFeatured && (
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                          {item.adminFeaturedLabel || '👑 Admin Đề Xuất'}
                        </span>
                      )}
                      <span className="bg-white/95 text-teal-800 border border-teal-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                        ☁️ Cloud View {item.hasCloudView ? '9.6' : '9.2'}/10
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-slate-950/75 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{item.rating}</span>
                    </span>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>📍 {item.area}</span>
                      <span>{item.category === 'coffee' ? '☕ Quán Cafe Săn Mây' : '🏡 Homestay Cloud View'}</span>
                    </div>
                    <h4 className="font-extrabold text-[#073161] text-sm line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Giá niêm yết từ</span>
                    <span className="text-sm font-black text-[#073161] tabular-nums">
                      {formatVND(item.minPrice)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      /{item.category === 'coffee' ? 'đồ uống' : 'đêm'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                    <span>Xem góc nhìn & Đặt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
