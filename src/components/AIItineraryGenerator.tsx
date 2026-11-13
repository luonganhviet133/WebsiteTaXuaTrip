import { buildOfflineStepHtml, buildOfflineDayHtml } from '../utils/offlineItineraryHtml.ts';
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  Download,
  Printer,
  Check,
  WifiOff,
  PhoneCall,
  Calendar,
  Clock,
  Wallet,
  ArrowRight,
  RefreshCw,
  Compass,
  AlertTriangle,
  Star,
  FileDown
} from 'lucide-react';
import { Listing, LocationArea } from '../types/index.ts';
import { INITIAL_LISTINGS } from '../data/mockData.ts';
import { formatVND } from '../utils/rules.ts';

interface ItineraryStepSpec {
  stepKey: string;
  time: string;
  title: string;
  activity: string;
  location: string;
  tip: string;
  defaultCostPerPerson: number;
  linkedCategory?: 'homestay' | 'bus' | 'coffee' | 'restaurant' | 'tour' | 'motorbike';
  preferredArea?: string;
}

interface DayPlanSpec {
  dayNumber: number;
  dayTitle: string;
  theme: string;
  items: ItineraryStepSpec[];
}

interface AIItineraryGeneratorProps {
  onOpenAiAdvisor?: () => void;
  listings?: Listing[];
  onSelectListing?: (listing: Listing) => void;
  onOpenSosModal?: () => void;
}

const OFFLINE_STORAGE_KEY = 'taxua_saved_offline_itinerary_v2';

export const AIItineraryGenerator: React.FC<AIItineraryGeneratorProps> = ({
  onOpenAiAdvisor,
  listings = INITIAL_LISTINGS,
  onSelectListing,
  onOpenSosModal
}) => {
  // Interactive Trip Configurator State
  const [duration, setDuration] = useState<'1d' | '2n1d' | '3n2d'>('2n1d');
  const [vibe, setVibe] = useState<'chill' | 'trekking' | 'couple' | 'group'>('chill');
  const [transport, setTransport] = useState<'limo_bike' | 'private_car'>('limo_bike');
  const [preferredArea, setPreferredArea] = useState<LocationArea>('Đỉnh Gió');
  const [groupSize, setGroupSize] = useState<number>(2);

  // Custom Listing Overrides per stepKey (allows customer to swap Homestay, Bus, Cafe, etc.)
  const [customStepListingIds, setCustomStepListingIds] = useState<Record<string, string>>({});
  const [activeSwappingStepKey, setActiveSwappingStepKey] = useState<string | null>(null);

  // Offline Save State
  const [isOfflineSaved, setIsOfflineSaved] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(OFFLINE_STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const [savedTimestamp, setSavedTimestamp] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.savedAt || null;
    } catch {
      return null;
    }
  });

  // Candidate listings by category
  const getCandidateListings = (category?: string, areaHint?: string): Listing[] => {
    if (!category) return [];
    const approved = listings.filter((l) => l.status === 'approved' && l.category === category);
    const targetArea = areaHint || preferredArea;
    return [...approved].sort((a, b) => {
      const aAreaMatch = a.area.toLowerCase().includes(targetArea.toLowerCase()) ? 1 : 0;
      const bAreaMatch = b.area.toLowerCase().includes(targetArea.toLowerCase()) ? 1 : 0;
      if (aAreaMatch !== bAreaMatch) return bAreaMatch - aAreaMatch;
      if (Boolean(a.isAdminFeatured) !== Boolean(b.isAdminFeatured)) {
        return a.isAdminFeatured ? -1 : 1;
      }
      return b.rating - a.rating;
    });
  };

  // Resolve the active listing for a specific itinerary step
  const resolveStepListing = (step: ItineraryStepSpec): Listing | undefined => {
    if (!step.linkedCategory) return undefined;
    const overrideId = customStepListingIds[step.stepKey];
    if (overrideId) {
      const found = listings.find((l) => l.id === overrideId);
      if (found) return found;
    }
    const candidates = getCandidateListings(step.linkedCategory, step.preferredArea);
    return candidates[0];
  };

  // Calculate per-person cost for a step based on the resolved listing
  const computeStepCostPerPerson = (step: ItineraryStepSpec, resolvedListing?: Listing): number => {
    if (!resolvedListing) return step.defaultCostPerPerson;
    if (step.linkedCategory === 'homestay') {
      // Room price is typically for 2 guests; divide by 2 for per-person estimate
      return Math.round(resolvedListing.minPrice / 2);
    }
    if (step.linkedCategory === 'motorbike') {
      // 1 motorbike shared by 2 people, with 12h noon rule (1.5 days)
      return Math.round((resolvedListing.minPrice * 1.5) / 2);
    }
    return resolvedListing.minPrice || step.defaultCostPerPerson;
  };

  // Build dynamic itinerary schedule
  const activePlan = useMemo<DayPlanSpec[]>(() => {
    const isSelfDrive = transport === 'private_car';
    const isTrekking = vibe === 'trekking';
    const isCouple = vibe === 'couple';

    if (duration === '1d') {
      return [
        {
          dayNumber: 1,
          dayTitle: 'Lịch trình 1 Ngày Săn Mây Cấp Tốc: Đỉnh Gió ➔ Sống Lưng Khủng Long ➔ Thảo Nguyên',
          theme: 'Tối ưu cho khách xuất phát chuyến đêm từ Hà Nội hoặc di chuyển từ Bắc Yên / Mộc Châu sang',
          items: [
            {
              stepKey: '1d-dawn',
              time: '05:15 – 07:30',
              title: 'Đón bình minh đại dương mây trên Sống Lưng Khủng Long',
              activity:
                'Di chuyển vào xã Háng Đồng đón bình minh ở độ cao 1.800m, nơi biển mây cuộn trào qua dãy núi sống lưng.',
              location: 'Sống Lưng Khủng Long (Cách trung tâm xã 13km)',
              tip: 'Gửi xe ở bãi đầu dốc nếu đường ẩm sương; có thể thuê xe ôm bản địa chở xuống tận mỏm sống lưng.',
              defaultCostPerPerson: 120000,
              linkedCategory: 'tour',
              preferredArea: 'Sống Lưng Khủng Long'
            },
            {
              stepKey: '1d-morning-cafe',
              time: '08:00 – 10:30',
              title: 'Cà phê săn mây & điểm tâm sáng trên Đỉnh Gió',
              activity:
                'Thưởng thức cà phê muối ấm nóng, trà gừng mật ong và ngắm nắng sớm xuyên qua thung lũng mây.',
              location: 'Đỉnh Gió Tà Xùa (Độ cao 1.650m)',
              tip: 'Khung giờ 08:00 – 09:30 ánh sáng thuận chiều, chụp ảnh ban công gỗ nhìn thẳng xuống vực mây rất nét.',
              defaultCostPerPerson: 60000,
              linkedCategory: 'coffee',
              preferredArea: 'Đỉnh Gió'
            },
            {
              stepKey: '1d-lunch',
              time: '11:30 – 13:30',
              title: 'Ăn trưa đặc sản Lẩu Gà Đen H’Mông & Lợn Bản Nướng',
              activity:
                'Thưởng thức nồi lẩu gà đen hầm nấm rừng, rau cải mèo và thịt nướng mắc khén chuẩn vị vùng cao.',
              location: 'Trung tâm Xã Tà Xùa & Đỉnh Gió',
              tip: 'Đặt bàn trước 30 phút để nhà hàng chuẩn bị nước dùng nóng hổi ngay khi đoàn tới.',
              defaultCostPerPerson: 180000,
              linkedCategory: 'restaurant',
              preferredArea: 'Đỉnh Gió'
            },
            {
              stepKey: '1d-afternoon-bike',
              time: '14:00 – 17:15',
              title: 'Chinh phục Thảo Nguyên Tà Xùa, Cây Cô Đơn & Mỏm Cá Heo',
              activity:
                'Chạy dọc cung đường Thủy điện Suối Sập thoáng đãng, check-in đồi cỏ xanh và đón hoàng hôn trước khi về.',
              location: 'Cung đường Thảo Nguyên (Cách trung tâm 9,5km)',
              tip: 'Đường nhựa và bê tông êm ái, cả xe máy và ô tô đều di chuyển thuận lợi.',
              defaultCostPerPerson: 90000,
              linkedCategory: 'motorbike',
              preferredArea: 'Thảo Nguyên'
            }
          ]
        }
      ];
    }

    const day1: DayPlanSpec = {
      dayNumber: 1,
      dayTitle: `Ngày 1: Hà Nội ➔ Đèo Chẹn ➔ Nhận Phòng Homestay ${preferredArea} ➔ Hoàng Hôn Đỉnh Gió`,
      theme: isCouple
        ? 'Nghỉ dưỡng riêng tư tại Bungalow kính săn mây & thưởng thức bữa tối ấm áp giữa sương mù'
        : 'Di chuyển an toàn lên Tà Xùa, nhận xe máy tận Homestay & đón hoàng hôn tím trên biển mây',
      items: [
        {
          stepKey: 'd1-transport',
          time: '06:30 – 11:45',
          title: isSelfDrive
            ? 'Lộ trình Ô tô tự lái: Hà Nội ➔ Thanh Sơn ➔ Bắc Yên ➔ Đèo Chẹn ➔ Tà Xùa'
            : 'Xe Cabin Đôi / Limousine VIP đón dọc tuyến Hà Nội ➔ Trung tâm Tà Xùa',
          activity: isSelfDrive
            ? 'Chạy theo hướng QL32 qua Cầu Trung Hà – Thanh Sơn – Thu Cúc – Bắc Yên rồi leo 15km đèo lên Tà Xùa.'
            : 'Nghỉ ngơi trên ghế massage Limousine hoặc Cabin Đôi, nhà xe trả khách tận cửa Homestay.',
          location: 'Tuyến Hà Nội – Sơn Tây – Thanh Sơn – Bắc Yên – Tà Xùa',
          tip: isSelfDrive
            ? 'Bắt buộc đổ đầy bình xăng/dầu tại Thị trấn Bắc Yên trước khi leo Đèo Chẹn.'
            : 'Đặt kèm Combo Xe máy trên Tà Xùa Trip được giảm ngay 30.000đ/xe và giao xe tận sảnh Homestay.',
          defaultCostPerPerson: isSelfDrive ? 250000 : 320000,
          linkedCategory: 'bus',
          preferredArea: 'Bắc Yên'
        },
        {
          stepKey: 'd1-homestay',
          time: '12:15 – 14:00',
          title: `Nhận phòng Homestay góc nhìn Cloud View tại ${preferredArea}`,
          activity:
            'Nhận phòng đã thẩm định thực tế (đệm sưởi ấm, bình nóng lạnh, góc nhìn thung lũng mây không bị che khuất).',
          location: `Khu vực ${preferredArea}`,
          tip: 'Mở mã đặt chỗ trên ứng dụng để đối chiếu đúng căn phòng (Room ID) đã giữ.',
          defaultCostPerPerson: isCouple ? 420000 : 300000,
          linkedCategory: 'homestay',
          preferredArea
        },
        {
          stepKey: 'd1-motorbike',
          time: '14:30 – 16:30',
          title: 'Nhận xe máy vượt đèo check-in Thảo Nguyên & Cây Cô Đơn',
          activity:
            'Vi vu trên cung đường đèo thoáng đẹp nhất Tà Xùa dẫn ra Thảo Nguyên, Mỏm Cá Heo và Cây Cô Đơn.',
          location: 'Thảo Nguyên Tà Xùa (Cách trung tâm 9,5km)',
          tip: 'Áp dụng quy tắc độc quyền Tà Xùa Trip: Trả xe trước 12:00 trưa hôm sau chỉ tính 0.5 ngày (90.000đ).',
          defaultCostPerPerson: 110000,
          linkedCategory: 'motorbike',
          preferredArea: 'Đỉnh Gió'
        },
        {
          stepKey: 'd1-sunset-cafe',
          time: '16:45 – 18:15',
          title: 'Ngắm hoàng hôn buông xuống biển mây tại Cafe Đỉnh Gió',
          activity:
            'Nhâm nhi ca cao nóng hoặc trà Shan Tuyết cổ thụ, ngắm mặt trời lặn nhuộm tím đại dương mây.',
          location: 'Đỉnh Gió Tà Xùa (Độ cao 1.650m)',
          tip: 'Sau 17:15 nhiệt độ hạ nhanh xuống 12°C–14°C, nhớ mặc sẵn áo khoác cản gió.',
          defaultCostPerPerson: 55000,
          linkedCategory: 'coffee',
          preferredArea: 'Đỉnh Gió'
        },
        {
          stepKey: 'd1-dinner',
          time: '19:00 – 21:30',
          title: 'Thưởng thức Lẩu Gà Đen H’Mông & BBQ Nướng Than Hồng',
          activity:
            'Quây quần bên nồi lẩu gà đen nấu nấm rừng, rau cải mèo và thưởng thức rượu táo mèo êm dịu.',
          location: 'Đỉnh Gió & Trung tâm Xã Tà Xùa',
          tip: 'Nếu đi đoàn đông từ 4 người, nên báo trước nhà hàng chuẩn bị thêm mẹt lợn bản nướng.',
          defaultCostPerPerson: 190000,
          linkedCategory: 'restaurant',
          preferredArea: 'Đỉnh Gió'
        }
      ]
    };

    const day2: DayPlanSpec = {
      dayNumber: 2,
      dayTitle: isTrekking
        ? 'Ngày 2: Bình Minh Sống Lưng Khủng Long ➔ Trekking Rừng Cổ Thụ Phu Sa Phìn'
        : 'Ngày 2: Đón Đại Dương Mây Sống Lưng Khủng Long 05:15 ➔ Đồi Chè Cổ Thụ ➔ Về Hà Nội',
      theme: isTrekking
        ? 'Chinh phục rừng rêu nguyên sinh cùng Porter bản địa đã xác minh'
        : 'Săn biển mây dày đặc nhất lúc bình minh và mua quà đặc sản Tây Bắc',
      items: [
        {
          stepKey: 'd2-spine-dawn',
          time: '05:15 – 07:45',
          title: 'Săn biển mây bình minh tại Sống Lưng Khủng Long (Háng Đồng)',
          activity:
            'Đón khoảnh khắc mặt trời nhô lên khỏi biển mây trắng xóa bao phủ hai bên sườn núi Sống Lưng.',
          location: 'Sống Lưng Khủng Long (Cách trung tâm xã 13km)',
          tip: 'Khi đổ dốc xuống Sống Lưng bằng xe số, luôn cài số 1 hoặc số 2 để hãm bằng động cơ.',
          defaultCostPerPerson: 80000,
          linkedCategory: isTrekking ? 'tour' : 'coffee',
          preferredArea: 'Sống Lưng Khủng Long'
        },
        {
          stepKey: 'd2-midday-activity',
          time: '08:30 – 11:00',
          title: isTrekking
            ? 'Trekking rừng nguyên sinh Phu Sa Phìn cùng Porter bản địa'
            : 'Tham quan Bản Khe Cải & Thưởng trà Shan Tuyết Cổ Thụ 300 năm tuổi',
          activity: isTrekking
            ? 'Đi xuyên rừng rêu cổ thụ và đỗ quyên nguyên sinh dưới sự hướng dẫn an toàn của Porter bản địa.'
            : 'Dạo bộ bản làng người Mông yên bình tại Khe Cải và mua trà Shan Tuyết sao tay chính gốc.',
          location: isTrekking ? 'Đỉnh Phu Sa Phìn (2.868m)' : 'Bản Khe Cải & Đỉnh Gió',
          tip: isTrekking
            ? 'Mang giày độ bám cao, áo mưa mỏng và lưu sẵn SĐT Cứu hộ 0981 119 115.'
            : 'Trả xe máy trước 12:00 trưa để hưởng mức phí nửa ngày tiết kiệm.',
          defaultCostPerPerson: isTrekking ? 350000 : 100000,
          linkedCategory: isTrekking ? 'tour' : 'homestay',
          preferredArea: isTrekking ? 'Sống Lưng Khủng Long' : 'Khe Cải'
        },
        {
          stepKey: 'd2-return',
          time: '12:00 – 13:30',
          title:
            duration === '2n1d'
              ? 'Trả phòng, ăn trưa & Lên xe Limousine khởi hành về lại Hà Nội'
              : 'Ăn trưa tại bản & Nghỉ ngơi chuẩn bị khám phá Thác Háng Đề Chơ buổi chiều',
          activity:
            duration === '2n1d'
              ? 'Nhà xe đón tận Homestay lúc 13:00 chiều, về tới Hà Nội khoảng 18:15 tối.'
              : 'Chiều thong thả săn hoàng hôn tại Mỏm Đầu Rùa và tắm lá thuốc người vùng cao.',
          location: 'Trung tâm Tà Xùa ➔ Hà Nội',
          tip: 'Sau chuyến đi, chia sẻ đánh giá và ảnh thật để giúp người đi sau — đóng góp hữu ích được cộng Điểm Mây.',
          defaultCostPerPerson: duration === '2n1d' ? 320000 : 180000,
          linkedCategory: 'bus',
          preferredArea: 'Bắc Yên'
        }
      ]
    };

    if (duration === '2n1d') {
      return [day1, day2];
    }

    const day3: DayPlanSpec = {
      dayNumber: 3,
      dayTitle: 'Ngày 3: Săn Mây Tại Giường ➔ Chợ Phiên Bản Địa ➔ Khởi Hành Về Hà Nội',
      theme: 'Thong thả tận hưởng buổi sáng trong mây trước khi kết thúc hành trình 3N2Đ trọn vẹn',
      items: [
        {
          stepKey: 'd3-morning-stay',
          time: '06:00 – 08:30',
          title: 'Ngắm biển mây ngay từ ban công Homestay & Ăn sáng nóng',
          activity:
            'Tận hưởng buổi sáng yên tĩnh không cần di chuyển xa, ngắm mây trôi ngay trước cửa kính phòng.',
          location: `Khu vực ${preferredArea}`,
          tip: 'Buổi sáng ngày thứ 3 rất thích hợp để chụp bộ ảnh trang phục Mông/Bohemian tại sân Homestay.',
          defaultCostPerPerson: 300000,
          linkedCategory: 'homestay',
          preferredArea
        },
        {
          stepKey: 'd3-market-return',
          time: '09:30 – 13:00',
          title: 'Mua quà đặc sản Tây Bắc, trả xe máy trước 12h & Lên xe về Hà Nội',
          activity:
            'Mua măng trúc muối ớt, thịt trâu gác bếp, chè Shan Tuyết cổ thụ và lên chuyến xe 13:00 chiều.',
          location: 'Trung tâm Xã Tà Xùa ➔ Hà Nội',
          tip: 'Kiểm tra kỹ hành lý và sạc dự phòng trước khi trả phòng.',
          defaultCostPerPerson: 320000,
          linkedCategory: 'bus',
          preferredArea: 'Bắc Yên'
        }
      ]
    };

    return [day1, day2, day3];
  }, [duration, vibe, transport, preferredArea]);

  // Calculate dynamic total cost per person & for the group
  const totalEstimatedPerPerson = useMemo(() => {
    return activePlan.reduce((sum, day) => {
      return (
        sum +
        day.items.reduce((daySum, step) => {
          const resolved = resolveStepListing(step);
          return daySum + computeStepCostPerPerson(step, resolved);
        }, 0)
      );
    }, 0);
  }, [activePlan, customStepListingIds, listings, preferredArea]);

  const totalGroupCost = totalEstimatedPerPerson * groupSize;

  // Automatically extract unique verified contacts from all steps in the current itinerary
  const extractedItineraryContacts = useMemo(() => {
    const map = new Map<string, Listing>();
    activePlan.forEach((day) => {
      day.items.forEach((step) => {
        const resolved = resolveStepListing(step);
        if (resolved && !map.has(resolved.id)) {
          map.set(resolved.id, resolved);
        }
      });
    });
    return Array.from(map.values());
  }, [activePlan, customStepListingIds, listings, preferredArea]);

  const handleSaveOfflineToBrowser = () => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    try {
      localStorage.setItem(
        OFFLINE_STORAGE_KEY,
        JSON.stringify({
          duration,
          vibe,
          transport,
          preferredArea,
          groupSize,
          customStepListingIds,
          savedAt: nowStr
        })
      );
      setIsOfflineSaved(true);
      setSavedTimestamp(nowStr);
    } catch {
      setIsOfflineSaved(true);
    }
  };

  // Download a standalone offline HTML file that works with 0% internet on any phone
  const handleDownloadOfflineHtmlFile = () => {
    handleSaveOfflineToBrowser();
    const daysHtml = activePlan
      .map((day) => {
        const stepsHtml = day.items
          .map((step) => {
            const listing = resolveStepListing(step);
            const cost = computeStepCostPerPerson(step, listing);
            return buildOfflineStepHtml(step, listing, cost);
          })
          .join('');
        return buildOfflineDayHtml(day.dayTitle, stepsHtml);
      })
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Cẩm Nang & Lịch Trình Tà Xùa Offline (${duration.toUpperCase()})</title>
</head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;max-width:760px;margin:0 auto;padding:20px;">
  <div style="background:#073161;color:#fff;padding:20px;border-radius:16px;">
    <h1 style="margin:0 0 6px 0;font-size:22px;">TÀ XÙA TRIP — LỊCH TRÌNH & DANH BẠ OFFLINE</h1>
    <p style="margin:0;font-size:13px;opacity:0.9;">Mở file này trực tiếp trên điện thoại ngay cả khi mất sóng 4G tại Háng Đồng & Sống Lưng Khủng Long.</p>
    <div style="margin-top:12px;font-size:14px;background:rgba(255,255,255,0.15);padding:10px;border-radius:10px;">
      <strong>Chi phí dự kiến:</strong> ~${formatVND(totalEstimatedPerPerson)}/người · <strong>Tổng đoàn (${groupSize} người):</strong> ${formatVND(totalGroupCost)}
    </div>
  </div>
  <div style="background:#fff1f2;border:2px solid #f43f5e;border-radius:14px;padding:14px;margin-top:16px;">
    <div style="font-weight:800;color:#be123c;font-size:14px;margin-bottom:6px;">🚨 DANH BẠ CỨU HỘ KHẨN CẤP 24/7 (GỌI SÓNG 2G):</div>
    <div style="font-size:13px;line-height:1.6;">
      • Đội Cứu hộ Đèo Chẹn & Dốc Núi Tà Xùa: <strong>0981 119 115</strong><br/>
      • Sửa xe máy & Tiếp xăng lưu động (Ngã 3 Xã): <strong>0988 991 223</strong><br/>
      • Trạm Y Tế Xã Tà Xùa: <strong>0212 3851 456</strong> · Công an xã: <strong>0212 3851 123</strong>
    </div>
  </div>
  ${daysHtml}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lich-Trinh-Ta-Xua-Offline-${duration}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#f8fafc] pb-16">
      {/* 1. HERO HEADER (Synchronized Light OTA Design System) */}
      <div className="bg-gradient-to-br from-brand-900 via-[#06366d] to-[#0a6b6e] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Trợ Lý AI Thiết Kế Lịch Trình & Cẩm Nang Offline Tà Xùa
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mt-2 leading-relaxed">
                Lên lịch trình chi tiết từng khung giờ gắn với Homestay, Nhà xe, Quán Cafe thật đã thẩm định. Bạn có thể tự đổi cơ sở ở từng chặng giờ để hệ thống tính lại ngân sách và tải bản Offline dùng khi đi vào vùng lõm sóng 4G tại Háng Đồng & Sống Lưng Khủng Long.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onOpenAiAdvisor && (
                <button
                  type="button"
                  onClick={onOpenAiAdvisor}
                  className="px-4 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Chat AI Báo Giá & Giữ Chỗ 30 Phút</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadOfflineHtmlFile}
                className="px-4 py-2.5 rounded-full bg-white hover:bg-teal-50 text-brand-800 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4 text-teal-700" />
                <span>Tải File Lịch Trình Offline (.HTML)</span>
              </button>
            </div>
          </div>

          {/* 2. INTERACTIVE 5-CONTROL TRIP CONFIGURATOR BAR */}
          <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-xl border border-white/40 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Control 1: Duration */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  1. Thời lượng chuyến đi
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(
                    [
                      { id: '1d', label: '1 Ngày' },
                      { id: '2n1d', label: '2N1Đ' },
                      { id: '3n2d', label: '3N2Đ' }
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDuration(d.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                        duration === d.id
                          ? 'bg-brand-800 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 2: Vibe / Style */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  2. Phong cách trải nghiệm
                </label>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                >
                  <option value="chill">☁️ Săn mây & Cafe Chill</option>
                  <option value="trekking">🥾 Trekking Sống Lưng & Rừng</option>
                  <option value="couple">💑 Cặp đôi Bungalow Kính</option>
                  <option value="group">👨‍👩‍👧‍👦 Nhóm bạn / Gia đình</option>
                </select>
              </div>

              {/* Control 3: Preferred Stay Area */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  3. Khu vực lưu trú ưu tiên
                </label>
                <select
                  value={preferredArea}
                  onChange={(e) => setPreferredArea(e.target.value as LocationArea)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                >
                  <option value="Đỉnh Gió">📍 Đỉnh Gió (Trung tâm săn mây)</option>
                  <option value="Sống Lưng Khủng Long">🦖 Sống Lưng Khủng Long</option>
                  <option value="Khe Cải">🌸 Bản Khe Cải (Yên tĩnh)</option>
                  <option value="Thảo Nguyên">🌿 Thảo Nguyên Tà Xùa</option>
                </select>
              </div>

              {/* Control 4: Transport Mode */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  4. Phương tiện di chuyển
                </label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                >
                  <option value="limo_bike">🚌 Xe Cabin/Limo + Thuê xe máy</option>
                  <option value="private_car">🚗 Ô tô cá nhân tự lái</option>
                </select>
              </div>

              {/* Control 5: Group Size */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  5. Quy mô đoàn khách
                </label>
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value) || 2)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-500 bg-slate-50 text-base font-bold text-brand-800 focus:outline-none focus:border-brand-800"
                >
                  <option value={1}>👤 1 khách (Độc hành / Ghép đoàn)</option>
                  <option value={2}>👥 2 khách (Cặp đôi / Đôi bạn)</option>
                  <option value={4}>👨‍👩‍👧‍👦 Nhóm 4 khách</option>
                  <option value={6}>🚌 Đoàn 6 – 10 khách</option>
                </select>
              </div>
            </div>

            {/* Bottom Summary Bar inside Configurator */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-3.5 py-2 rounded-xl">
                  <Wallet className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-700">Dự toán chi phí / 1 người:</span>
                  <span className="text-base font-black text-brand-800 tabular-nums">
                    ~{formatVND(totalEstimatedPerPerson)}
                  </span>
                </div>
                <span className="text-xs text-slate-600">
                  Tổng ngân sách đoàn <strong>{groupSize} người</strong>:{' '}
                  <strong className="text-emerald-700 tabular-nums">{formatVND(totalGroupCost)}</strong>
                  {Object.keys(customStepListingIds).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomStepListingIds({})}
                      className="ml-2 text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      (Khôi phục gợi ý mặc định)
                    </button>
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveOfflineToBrowser}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isOfflineSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-brand-800 hover:bg-brand-700 text-white'
                  }`}
                >
                  {isOfflineSaved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  <span>
                    {isOfflineSaved
                      ? `Đã lưu Offline vào máy${savedTimestamp ? ` (${savedTimestamp})` : ''}`
                      : 'Lưu Lịch Trình Vào Máy'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Xuất PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN 2-COLUMN CONTENT: INTERACTIVE TIMELINE (LEFT 8 COLS) + OFFLINE SURVIVAL PACK (RIGHT 4 COLS) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT 8 COLS: DAY-BY-DAY SCHEDULE WITH REAL-TIME LISTING SWAPPER */}
          <div className="lg:col-span-8 space-y-6">
            {activePlan.map((day) => (
              <div
                key={day.dayNumber}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5"
              >
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-full mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Lộ trình Ngày {day.dayNumber} · Đã đồng bộ giờ vàng săn mây</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-800">{day.dayTitle}</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{day.theme}</p>
                </div>

                <div className="space-y-4">
                  {day.items.map((step) => {
                    const resolvedListing = resolveStepListing(step);
                    const stepCost = computeStepCostPerPerson(step, resolvedListing);
                    const candidates = getCandidateListings(step.linkedCategory, step.preferredArea);
                    const isSwapping = activeSwappingStepKey === step.stepKey;

                    return (
                      <div
                        key={step.stepKey}
                        className="bg-[#f8fafc] border border-slate-200/90 hover:border-brand-800/40 rounded-2xl p-4 sm:p-5 space-y-3 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-brand-800 bg-amber-100 border border-amber-300/80 px-3 py-1 rounded-lg tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-amber-800" />
                            <span>{step.time}</span>
                          </span>
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-700" />
                            <span>{step.location}</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-brand-800">
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                            {step.activity}
                          </p>
                        </div>

                        <div className="text-xs text-teal-900 bg-teal-50/90 border border-teal-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
                          💡 <strong>Mẹo thực địa:</strong> {step.tip}
                        </div>

                        {/* Linked Verified Establishment Card + Interactive Swapper */}
                        {resolvedListing && (
                          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={resolvedListing.coverImage}
                                  alt={resolvedListing.title}
                                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-brand-800">
                                      Cơ sở đề xuất cho chặng này
                                    </span>
                                    <span className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      <span>{resolvedListing.rating}</span>
                                    </span>
                                  </div>
                                  <h4 className="font-extrabold text-sm text-brand-800 mt-0.5">
                                    {resolvedListing.title}
                                  </h4>
                                  <div className="text-xs text-slate-500">
                                    📍 {resolvedListing.area} · SĐT chính chủ:{' '}
                                    <strong className="text-slate-700 tabular-nums">
                                      {resolvedListing.phone}
                                    </strong>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                                <div className="text-left sm:text-right mr-1">
                                  <span className="text-xs text-slate-400 block">Dự toán/người</span>
                                  <span className="text-sm font-black text-emerald-700 tabular-nums">
                                    ~{formatVND(stepCost)}
                                  </span>
                                </div>

                                {candidates.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveSwappingStepKey(isSwapping ? null : step.stepKey)
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>{isSwapping ? 'Đóng' : 'Đổi cơ sở khác'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onSelectListing && onSelectListing(resolvedListing)}
                                  className="px-3.5 py-1.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <span>Xem & Đặt</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Dropdown / Picker to Swap Establishment */}
                            {isSwapping && (
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="text-xs font-bold text-brand-800">
                                  Chọn cơ sở đã thẩm định khác cho chặng "{step.title}":
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                                  {candidates.slice(0, 8).map((cand) => {
                                    const isCurrent = cand.id === resolvedListing.id;
                                    return (
                                      <button
                                        key={cand.id}
                                        type="button"
                                        onClick={() => {
                                          setCustomStepListingIds((prev) => ({
                                            ...prev,
                                            [step.stepKey]: cand.id
                                          }));
                                          setActiveSwappingStepKey(null);
                                        }}
                                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                          isCurrent
                                            ? 'bg-teal-50 border-teal-600 font-bold text-brand-800'
                                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <div className="truncate">
                                          <div className="font-bold truncate">{cand.title}</div>
                                          <div className="text-xs text-slate-500">
                                            {cand.area} · ★ {cand.rating}
                                          </div>
                                        </div>
                                        <span className="font-extrabold text-emerald-700 tabular-nums shrink-0">
                                          {formatVND(cand.minPrice)}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT 4 COLS: TRUE OFFLINE SURVIVAL PACK & AUTO-EXTRACTED TRIP CONTACTS */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Card 1: Auto-Extracted Contacts for THIS Trip */}
            <div className="bg-white border-2 border-brand-800 rounded-3xl p-5 shadow-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-brand-800">
                    Danh Bạ Offline Của Chuyến Đi Này
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tự động trích xuất SĐT của các cơ sở trong lịch trình để gọi sóng 2G khi lên Háng Đồng mất 4G.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {extractedItineraryContacts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-brand-800 truncate">{item.title}</div>
                      <div className="text-xs text-slate-500">
                        {item.area} · <span className="font-mono font-bold text-slate-700">{item.phone}</span>
                      </div>
                    </div>
                    <a
                      href={`tel:${item.phone.replace(/\s+/g, '')}`}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-extrabold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Gọi</span>
                    </a>
                  </div>
                ))}
              </div>

              {/* 24/7 Emergency Rescue Block */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="font-extrabold text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Đường dây nóng Cứu hộ Đèo Chẹn & Núi 24/7:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Kéo xe, thủng lốp, dẫn đường:</span>
                  <a href="tel:0981119115" className="font-mono font-black text-rose-700 text-sm">
                    0981 119 115
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Sửa xe máy & Tiếp xăng đèo:</span>
                  <a href="tel:0988991223" className="font-mono font-black text-rose-700 text-sm">
                    0988 991 223
                  </a>
                </div>
                {onOpenSosModal && (
                  <button
                    type="button"
                    onClick={onOpenSosModal}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Mở Trung Tâm Cứu Hộ & Lấy Tọa Độ GPS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Offline Mountain Route & Fuel / Parking Cheat-Sheet */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3.5 text-xs">
              <div className="flex items-center gap-2 font-black text-brand-800 text-sm">
                <Compass className="w-4 h-4 text-teal-700" />
                <span>Sơ Đồ Mốc Đường Đèo & Lưu Ý Sống Còn</span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-brand-800 block">⛽ Cây xăng cuối cùng:</strong>
                  Đổ đầy bình tại <strong>Thị trấn Bắc Yên</strong> hoặc cây xăng trung tâm xã Tà Xùa trước khi đi Sống Lưng Khủng Long (13km đường đèo không có trạm xăng lớn).
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-brand-800 block">🅿️ Điểm gửi xe Sống Lưng Khủng Long:</strong>
                  Ô tô gầm thấp và tay lái yếu nên gửi xe tại bãi đỉnh dốc Háng Đồng, đi bộ hoặc thuê xe ôm bản địa (40k–50k) xuống sống lưng.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-brand-800 block">🌫️ Khung giờ sương mù dày:</strong>
                  Từ <strong>17:30 tối đến 06:00 sáng</strong> đoạn Đèo Chẹn và Đỉnh Gió thường có sương mù tầm nhìn dưới 10m — hạn chế tự lái xe ban đêm nếu chưa quen đèo.
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadOfflineHtmlFile}
                className="w-full py-2.5 px-4 rounded-full bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>Tải Trọn Bộ Lịch Trình & Sơ Đồ Về Máy</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
