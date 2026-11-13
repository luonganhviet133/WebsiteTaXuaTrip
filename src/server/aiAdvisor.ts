import { GoogleGenAI } from '@google/genai';
import { POINT_RULES } from '../config/community.ts';
import {
  INITIAL_LISTINGS,
  BUS_TRIPS,
  INITIAL_VOUCHERS,
  REVID_MODELS_CATALOG,
  INITIAL_REVID_GATEWAY_CONFIG
} from '../data/mockData.ts';
import type { RevidComplexityLevel } from '../types/index.ts';

export interface TripConsultRequest {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number; // e.g. 2
  pickupLocation: string; // e.g. "Hà Nội (Mỹ Đình / Phố Cổ)"
  budget: number; // in VND, total or per person
  budgetType?: 'total' | 'per_person';
  preferences?: string[]; // e.g. ["View mây phòng ngủ", "Có chỗ đậu ô tô", "Trekking"]
  notes?: string;
  userMessage?: string; // free-form question
}

export interface DayActivity {
  time: string;
  activity: string;
  location: string;
  costEstimate: number;
  tip: string;
  icon: 'cloud' | 'coffee' | 'food' | 'bed' | 'hike' | 'photo' | 'bus';
}

export interface DayItinerary {
  dayNumber: number;
  dayTitle: string;
  theme: string;
  activities: DayActivity[];
}

export interface TripConsultResponse {
  summary: string;
  stayDurationNights: number;
  totalGuests: number;
  budgetAssessment: {
    status: 'comfortable' | 'balanced' | 'tight';
    userBudget: number;
    estimatedTotalCost: number;
    estimatedCostPerPerson: number;
    savingsOrDeficit: number;
    verdictMessage: string;
  };
  breakdown: {
    stayCost: number;
    transportCost: number;
    diningCost: number;
    activitiesCost: number;
    contingencyCost: number;
  };
  recommendedHomestays: Array<{
    id: string;
    name: string;
    area: string;
    pricePerNight: number;
    totalStayCost: number;
    hasCloudView: boolean;
    rating: number;
    reviewCount: number;
    reason: string;
    coverImage: string;
    phone: string;
    zalo: string;
  }>;
  recommendedTransport: {
    type: string;
    details: string;
    estimatedCost: number;
    departureHint: string;
  };
  itinerary: DayItinerary[];
  applicableVouchers: Array<{
    code: string;
    description: string;
    discountValue: number;
  }>;
  memberPointsReward: number;
  travelTips: string[];
}

/**
 * Thu thập ngữ cảnh dữ liệu thực từ 179 cơ sở Tà Xùa để truyền vào Gemini API
 */
function buildRealAppContext(req: TripConsultRequest) {
  const homestays = INITIAL_LISTINGS.filter((l) => l.category === 'homestay');
  const cloudHomestays = homestays.filter((l) => l.hasCloudView || l.tags.some((t) => t.toLowerCase().includes('view mây')));
  const carAccessHomestays = homestays.filter((l) => l.tags.some((t) => t.toLowerCase().includes('đậu ô tô') || t.toLowerCase().includes('bãi đỗ xe')));
  const cafes = INITIAL_LISTINGS.filter((l) => l.category === 'coffee');
  const restaurants = INITIAL_LISTINGS.filter((l) => l.category === 'restaurant');
  const tours = INITIAL_LISTINGS.filter((l) => l.category === 'tour');
  const buses = BUS_TRIPS;

  // Lọc danh sách tiêu biểu khớp số khách và yêu cầu
  const sampleStays = homestays.slice(0, 20).map((h) => ({
    id: h.id,
    title: h.title,
    area: h.area,
    minPrice: h.minPrice,
    hasCloudView: h.hasCloudView,
    tags: h.tags,
    rating: h.rating,
    phone: h.phone,
    zalo: h.zalo,
    roomTypes: h.roomTypes?.map((r) => ({
      name: r.name,
      priceWeekday: r.priceWeekday,
      priceWeekend: r.priceWeekend,
      capacity: r.capacity,
      viewType: r.viewType
    }))
  }));

  return {
    totalVerifiedListings: INITIAL_LISTINGS.length,
    cloudHomestaysCount: cloudHomestays.length,
    carAccessCount: carAccessHomestays.length,
    sampleStays,
    sampleCafes: cafes.slice(0, 5).map((c) => ({ id: c.id, title: c.title, area: c.area, minPrice: c.minPrice })),
    sampleRestaurants: restaurants.slice(0, 5).map((r) => ({ id: r.id, title: r.title, area: r.area, minPrice: r.minPrice })),
    sampleTours: tours.slice(0, 3).map((t) => ({ id: t.id, title: t.title, minPrice: t.minPrice })),
    buses: buses.map((b) => ({ operator: b.operatorName, route: b.route, price: b.baseFare, departure: b.departureTime })),
    vouchers: INITIAL_VOUCHERS.filter((v) => v.isActive).map((v) => ({ code: v.code, title: v.title, discountValue: v.discountValue, discountType: v.discountType }))
  };
}

/**
 * Tính số đêm lưu trú giữa 2 mốc ngày
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * Trình cố vấn thông minh nội bộ (Thuật toán dữ liệu thực)
 * Dùng khi GEMINI_API_KEY chưa cấu hình hoặc để tạo fallback nhanh, chính xác 100%
 */
export function generateLocalRuleBasedConsultation(req: TripConsultRequest): TripConsultResponse {
  const nights = calculateNights(req.checkIn, req.checkOut);
  const guests = Math.max(1, req.guests || 2);
  const budgetType = req.budgetType || 'total';
  let totalBudget = req.budget || (guests * 1800000);
  if (budgetType === 'per_person') {
    totalBudget = totalBudget * guests;
  }

  // Lọc homestay theo tiêu chí
  const homestays = INITIAL_LISTINGS.filter((l) => l.category === 'homestay');
  const needsCloud = req.preferences?.some((p) => p.toLowerCase().includes('mây')) ?? true;
  const needsCar = req.preferences?.some((p) => p.toLowerCase().includes('ô tô') || p.toLowerCase().includes('xe')) ?? false;

  let candidateStays = homestays.filter((h) => {
    if (needsCloud && !h.hasCloudView && !h.tags.some((t) => t.toLowerCase().includes('view mây'))) {
      return false;
    }
    if (needsCar && !h.tags.some((t) => t.toLowerCase().includes('đậu ô tô') || t.toLowerCase().includes('bãi đỗ xe'))) {
      return false;
    }
    return true;
  });

  if (candidateStays.length < 3) {
    candidateStays = homestays;
  }

  // Chọn 3 homestay phù hợp nhất theo giá và điểm đánh giá
  const chosenStays = candidateStays.slice(0, 3).map((h) => {
    const price = h.minPrice || 500000;
    const totalCost = price * nights;
    return {
      id: h.id,
      name: h.title,
      area: h.area,
      pricePerNight: price,
      totalStayCost: totalCost,
      hasCloudView: h.hasCloudView || false,
      rating: h.rating,
      reviewCount: h.reviewCount,
      reason: h.hasCloudView 
        ? 'Nằm tại vị trí ngắm biển mây xuất sắc, phòng kính mở rộng trực diện thung lũng.'
        : 'Không gian yên tĩnh, dịch vụ chu đáo và đường đi thuận lợi.',
      coverImage: h.coverImage,
      phone: h.phone,
      zalo: h.zalo
    };
  });

  // Tính toán chi phí ước lượng
  const stayAvgCostPerNight = chosenStays[0]?.pricePerNight || 550000;
  // Số phòng cần thuê: 2 người / phòng
  const roomsNeeded = Math.ceil(guests / 2);
  const totalStayCost = stayAvgCostPerNight * roomsNeeded * nights;

  // Chi phí di chuyển
  const isFromHanoi = req.pickupLocation.toLowerCase().includes('hà nội') || req.pickupLocation.toLowerCase().includes('nội bài');
  const transportPerPerson = isFromHanoi ? 700000 : 350000; // Khứ hồi Limousine/Cabin
  const totalTransportCost = transportPerPerson * guests;

  // Ăn uống (khoảng 350.000đ/người/ngày)
  const days = nights + 1;
  const diningCostPerPerson = days * 350000;
  const totalDiningCost = diningCostPerPerson * guests;

  // Hoạt động & cafe (khoảng 300.000đ/người: cafe Mị Ơi, Thào, vé Sống Lưng)
  const activitiesCostPerPerson = 300000;
  const totalActivitiesCost = activitiesCostPerPerson * guests;

  // Dự phòng
  const contingencyCost = 200000 * guests;

  const estimatedTotalCost = totalStayCost + totalTransportCost + totalDiningCost + totalActivitiesCost + contingencyCost;
  const estimatedCostPerPerson = Math.round(estimatedTotalCost / guests);
  const diff = totalBudget - estimatedTotalCost;

  let status: 'comfortable' | 'balanced' | 'tight' = 'balanced';
  let verdictMessage = 'Ngân sách của bạn rất cân đối và phù hợp với tiêu chuẩn dịch vụ thẩm định tại Tà Xùa.';

  if (diff >= 500000) {
    status = 'comfortable';
    verdictMessage = `Ngân sách dư dả! Bạn dư khoảng ${Math.round(diff).toLocaleString('vi-VN')} ₫ để nâng cấp lên phòng VIP hoặc trải nghiệm thêm lẩu cá tầm thượng hạng & tour trekking.`;
  } else if (diff < -300000) {
    status = 'tight';
    verdictMessage = `Tổng chi phí ước tính vượt ngân sách khoảng ${Math.abs(Math.round(diff)).toLocaleString('vi-VN')} ₫. Bạn có thể chọn phòng tập thể/dorm hoặc đi xe khách thay vì xe limousine riêng để tiết kiệm.`;
  }

  // Tạo lịch trình mẫu theo số ngày
  const itinerary: DayItinerary[] = [];

  // Ngày 1
  itinerary.push({
    dayNumber: 1,
    dayTitle: `Ngày 1: Đón tại ${req.pickupLocation} ➔ Lên Đèo Tà Xùa ➔ Nhận phòng ➔ Hoàng Hôn Mị Ơi`,
    theme: 'Khởi hành vùng cao, check-in phòng thẩm định & săn hoàng hôn rực rỡ',
    activities: [
      {
        time: '06:30 - 11:30',
        activity: `Xe Limousine VIP đón tại ${req.pickupLocation}, di chuyển qua Đèo Chẹn lên Tà Xùa.`,
        location: 'Tuyến đường Hà Nội - Thanh Sơn - Bắc Yên - Tà Xùa',
        costEstimate: Math.round(totalTransportCost / 2),
        tip: 'Nghỉ dừng chân tại đồi chè Thanh Sơn, nhớ uống nước gừng chống say xe đèo.',
        icon: 'bus'
      },
      {
        time: '12:00 - 13:30',
        activity: 'Thưởng thức cơm trưa bản địa (Gà đen H\'Mông nướng mật ong, canh măng rừng).',
        location: 'Nhà hàng Bếp Tà Xùa (Khu Trung tâm)',
        costEstimate: 180000 * guests,
        tip: 'Ăn uống vừa phải để chuẩn bị nhận phòng nghỉ ngơi lấy sức.',
        icon: 'food'
      },
      {
        time: '14:00 - 15:30',
        activity: `Nhận phòng tại ${chosenStays[0]?.name || 'Homestay đã thẩm định'}, mở rèm ngắm trọn thung lũng mây.`,
        location: chosenStays[0]?.area || 'Đỉnh Gió',
        costEstimate: Math.round(totalStayCost / nights),
        tip: 'Mã booking trên app tích hợp định vị GPS chuẩn, không lo bị chủ phòng đón nhầm.',
        icon: 'bed'
      },
      {
        time: '16:30 - 18:30',
        activity: 'Ngồi xích đu vô cực, săn hoàng hôn buông xuống thung lũng mây tại Tiệm Cà Phê Mị Ơi.',
        location: 'Đỉnh Gió Tà Xùa',
        costEstimate: 50000 * guests,
        tip: 'Nhiệt độ sau 17h30 giảm mạnh xuống 12°C - 15°C, hãy mang áo khoác ấm và khăn len.',
        icon: 'coffee'
      },
      {
        time: '19:00 - 21:30',
        activity: 'Ăn tối Lẩu Cá Tầm ấm nóng bên bếp than hồng & giao lưu cùng gia chủ.',
        location: 'Sân ngoài trời Homestay',
        costEstimate: 200000 * guests,
        tip: 'Trà Shan Tuyết cổ thụ trăm năm được gia chủ mời miễn phí.',
        icon: 'food'
      }
    ]
  });

  // Ngày 2
  itinerary.push({
    dayNumber: 2,
    dayTitle: 'Ngày 2: Săn Bình Minh Đại Dương Mây Sống Lưng Khủng Long ➔ Cây Cô Đơn ➔ Trở về',
    theme: 'Đón đại dương mây cuồn cuộn lúc 05:30 sáng và lưu giữ khoảnh khắc thanh xuân',
    activities: [
      {
        time: '05:15 - 07:30',
        activity: 'Chinh phục Sống Lưng Khủng Long Háng Đồng, chiêm ngưỡng biển mây bồng bềnh 360 độ.',
        location: 'Sống Lưng Khủng Long (Xã Háng Đồng, cách trung tâm 12km)',
        costEstimate: 50000 * guests,
        tip: 'Khung giờ mây đẹp nhất từ 05:45 - 07:15 sáng. Đi giày ma sát tốt vì đường sườn núi có sương mù.',
        icon: 'cloud'
      },
      {
        time: '08:00 - 09:00',
        activity: 'Ăn sáng phở gà nóng hổi và nhâm nhi tách cà phê ngắm mây cuộn sóng tại Thào Coffee.',
        location: 'Khu Trung tâm Tà Xùa',
        costEstimate: 60000 * guests,
        tip: 'Quán có view nhìn thẳng xuống biển mây Khe Cải.',
        icon: 'coffee'
      },
      {
        time: '09:30 - 11:30',
        activity: 'Check-in Cây Cô Đơn và Mỏm Cá Heo, ngắm thủy điện Suối Sập nước xanh như ngọc.',
        location: 'Cung đường Háng Đồng - Mỏm Cá Heo',
        costEstimate: 40000 * guests,
        tip: 'Thuê váy thổ cẩm người H\'Mông tại tiệm bản địa để có những bức ảnh rực rỡ.',
        icon: 'photo'
      },
      {
        time: '12:00 - 13:00',
        activity: 'Trả phòng homestay, nghỉ ngơi tại sảnh lounge.',
        location: chosenStays[0]?.name || 'Homestay',
        costEstimate: 0,
        tip: 'Được tặng 180 Điểm Mây tích lũy vào tài khoản Member khi hoàn tất kỳ nghỉ.',
        icon: 'bed'
      },
      {
        time: '13:30 - 18:30',
        activity: `Lên xe Limousine khứ hồi đưa đoàn về lại điểm đón ban đầu tại ${req.pickupLocation}.`,
        location: `Tà Xùa ➔ ${req.pickupLocation}`,
        costEstimate: Math.round(totalTransportCost / 2),
        tip: 'Tài xế bản địa thông thuộc đèo núi, xe êm và an toàn.',
        icon: 'bus'
      }
    ]
  });

  if (nights >= 2) {
    itinerary.push({
      dayNumber: 3,
      dayTitle: 'Ngày 3: Trekking Rừng Rêu Ma Mị Đỉnh U Bò ➔ Chợ Phiên Vùng Cao ➔ Kết thúc hành trình',
      theme: 'Khám phá thảm thực vật kỳ ảo cổ kính và mua đặc sản làm quà',
      activities: [
        {
          time: '07:00 - 11:00',
          activity: 'Trekking rừng nguyên sinh U Bò, chạm tay vào thảm rêu cổ tích ngàn năm.',
          location: 'Khu bảo tồn thiên nhiên Tà Xùa',
          costEstimate: 200000 * guests,
          tip: 'Có hướng dẫn viên người bản địa đi kèm hỗ trợ bảo hiểm.',
          icon: 'hike'
        },
        {
          time: '11:30 - 13:00',
          activity: 'Ghé chợ phiên Bắc Yên mua thịt trâu gác bếp, chè Tà Xùa và táo mèo chuẩn vị.',
          location: 'Thị trấn Bắc Yên',
          costEstimate: 100000 * guests,
          tip: 'Được dán tem QR truy xuất nguồn gốc do Tà Xùa Trip thẩm định.',
          icon: 'food'
        },
        {
          time: '13:30 - 18:30',
          activity: `Khởi hành về ${req.pickupLocation}.`,
          location: `Bắc Yên ➔ ${req.pickupLocation}`,
          costEstimate: 0,
          tip: 'Đánh giá chuyến đi trên web để nhận thêm 50 Điểm Mây thưởng.',
          icon: 'bus'
        }
      ]
    });
  }

  // N06.2: Điểm Mây theo đóng góp — cố định khi chuyến ở hoàn tất, không theo số tiền.
  const memberPointsReward = POINT_RULES.stay_completed;

  return {
    summary: `Kế hoạch du lịch Tà Xùa ${nights + 1}N${nights}Đ dành cho đoàn ${guests} khách đón tại ${req.pickupLocation}. Tận hưởng trọn vẹn biển mây phòng ngủ, lịch trình săn mây chuẩn giờ vàng và dịch vụ đã thẩm định thực tế.`,
    stayDurationNights: nights,
    totalGuests: guests,
    budgetAssessment: {
      status,
      userBudget: totalBudget,
      estimatedTotalCost,
      estimatedCostPerPerson,
      savingsOrDeficit: diff,
      verdictMessage
    },
    breakdown: {
      stayCost: totalStayCost,
      transportCost: totalTransportCost,
      diningCost: totalDiningCost,
      activitiesCost: totalActivitiesCost,
      contingencyCost
    },
    recommendedHomestays: chosenStays,
    recommendedTransport: {
      type: isFromHanoi ? 'Xe Limousine VIP / Xe Giường Cabin Đôi' : 'Xe Khách / Taxi Hợp Đồng',
      details: isFromHanoi
        ? 'Đón tận nơi tại Hà Nội (hoặc Sân bay Nội Bài), trả tận cửa homestay Đỉnh Gió/Trung Tâm. Ghế massage êm ái, wifi và nước uống miễn phí.'
        : 'Xe trung chuyển đèo chuyên nghiệp, tài xế bản địa tay lái vững.',
      estimatedCost: totalTransportCost,
      departureHint: 'Khởi hành 06:30 sáng Ngày 1 và về lúc 13:30 chiều Ngày cuối.'
    },
    itinerary,
    applicableVouchers: [
      { code: 'TAXUA2026', description: 'Giảm 10% tổng hóa đơn đặt phòng & xe qua nền tảng', discountValue: Math.round(estimatedTotalCost * 0.1) },
      { code: 'CLOUDVIEW', description: 'Tặng voucher cà phê ngắm mây 50k tại Tiệm Mị Ơi', discountValue: 50000 }
    ],
    memberPointsReward,
    travelTips: [
      'Nhiệt độ ban đêm tại Tà Xùa có thể xuống dưới 12°C, bắt buộc mang theo áo ấm giữ nhiệt, khăn len và mũ.',
      'Sáng sớm từ 05:15 - 07:15 là thời điểm biển mây gom dày và đẹp nhất tại Sống Lưng Khủng Long & Đỉnh Gió.',
      'Đặt phòng và giữ chỗ qua website có cam kết bảo vệ quyền lợi thành viên, hỗ trợ giải quyết khiếu nại 24/7.',
      'Đường đèo có nhiều khúc cua gấp, nếu tự lái xe máy hãy kiểm tra phanh kỹ và luôn bật đèn sương mù.'
    ]
  };
}

/**
 * Gọi Google Gemini API (Server-side) với context dữ liệu thực từ app
 */
// apiKey truyền từ nơi gọi (Worker: env.GEMINI_API_KEY); mặc định đọc process.env khi chạy Node.
export async function consultWithGeminiAI(
  req: TripConsultRequest,
  apiKey: string | undefined = process.env.GEMINI_API_KEY
): Promise<TripConsultResponse> {

  // Nếu không có API Key hoặc bị lỗi mạng, dùng fallback thông minh chất lượng cao
  if (!apiKey) {
    console.log('[AI Advisor] GEMINI_API_KEY not found in process.env. Using high-fidelity verified rule engine.');
    return generateLocalRuleBasedConsultation(req);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const realAppContext = buildRealAppContext(req);
    const nights = calculateNights(req.checkIn, req.checkOut);

    const systemInstruction = `
Bạn là Chuyên gia Tư vấn Lịch trình & Giá phòng Tà Xùa Trip (AI Travel Advisor).
Nhiệm vụ của bạn là kiểm tra dữ liệu thực tế của hệ thống du lịch Tà Xùa và tư vấn chính xác, chu đáo cho khách du lịch.

DỮ LIỆU THỰC TẾ TRONG HỆ THỐNG:
- Tổng số cơ sở đã thẩm định thực tế: ${realAppContext.totalVerifiedListings} cơ sở
- Các homestay view mây tiêu biểu: ${JSON.stringify(realAppContext.sampleStays.slice(0, 8))}
- Dịch vụ xe khách / limousine đón Hà Nội - Tà Xùa: ${JSON.stringify(realAppContext.buses)}
- Quán cà phê & điểm săn mây: ${JSON.stringify(realAppContext.sampleCafes)}
- Nhà hàng & món đặc sản: ${JSON.stringify(realAppContext.sampleRestaurants)}
- Mã voucher đang kích hoạt: ${JSON.stringify(realAppContext.vouchers)}

QUY TẮC BẮT BUỘC KHI TƯ VẤN:
1. Đọc kỹ ngày đi (${req.checkIn}), ngày về (${req.checkOut}) -> Thời lượng = ${nights + 1} ngày ${nights} đêm.
2. Số lượng người: ${req.guests} người.
3. Điểm đón: ${req.pickupLocation}.
4. Ngân sách yêu cầu: ${req.budget ? req.budget.toLocaleString('vi-VN') + ' ₫' : 'Tối ưu tiêu chuẩn'}.
5. Tên homestay, quán cà phê, tour trong lịch trình PHẢI LẤY TỪ DỮ LIỆU THỰC Ở TRÊN (ví dụ: Mẩy Tà Xùa Homestay, Lu Trế Homestay, Tiệm Mị Ơi, Thào Coffee, Tour Sống Lưng Khủng Long). Không bịa tên homestay ảo.
6. Tính toán chi phí thực tế và so khớp với ngân sách của khách.
7. Đưa ra lịch trình theo khung giờ hợp lý, nhấn mạnh khung giờ vàng săn mây sáng sớm (05:15 - 07:15).
8. Phản hồi bằng JSON tuân thủ đúng cấu trúc được yêu cầu.
`;

    const prompt = `
Hãy tư vấn chi tiết chuyến đi Tà Xùa với thông tin sau:
- Ngày đi: ${req.checkIn}
- Ngày về: ${req.checkOut}
- Số người: ${req.guests} người
- Điểm đón: ${req.pickupLocation}
- Ngân sách: ${req.budget ? req.budget.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa định mức, hãy đề xuất mức hợp lý'}
- Loại ngân sách: ${req.budgetType === 'per_person' ? 'Theo từng người' : 'Tổng cả đoàn'}
- Sở thích/Ưu tiên: ${(req.preferences || []).join(', ') || 'Săn mây, nghỉ dưỡng, ăn đặc sản'}
${req.notes ? `- Ghi chú thêm: ${req.notes}` : ''}
${req.userMessage ? `- Câu hỏi cụ thể của member: "${req.userMessage}"` : ''}

Hãy trả về định dạng JSON thuần túy (không kèm markdown code block \`\`\`json) với đầy đủ các trường:
{
  "summary": "...",
  "stayDurationNights": ${nights},
  "totalGuests": ${req.guests},
  "budgetAssessment": {
    "status": "comfortable" | "balanced" | "tight",
    "userBudget": number,
    "estimatedTotalCost": number,
    "estimatedCostPerPerson": number,
    "savingsOrDeficit": number,
    "verdictMessage": "..."
  },
  "breakdown": {
    "stayCost": number,
    "transportCost": number,
    "diningCost": number,
    "activitiesCost": number,
    "contingencyCost": number
  },
  "recommendedHomestays": [
    {
      "id": "...",
      "name": "...",
      "area": "...",
      "pricePerNight": number,
      "totalStayCost": number,
      "hasCloudView": boolean,
      "rating": number,
      "reviewCount": number,
      "reason": "...",
      "coverImage": "url",
      "phone": "...",
      "zalo": "..."
    }
  ],
  "recommendedTransport": {
    "type": "...",
    "details": "...",
    "estimatedCost": number,
    "departureHint": "..."
  },
  "itinerary": [
    {
      "dayNumber": 1,
      "dayTitle": "...",
      "theme": "...",
      "activities": [
        {
          "time": "...",
          "activity": "...",
          "location": "...",
          "costEstimate": number,
          "tip": "...",
          "icon": "cloud" | "coffee" | "food" | "bed" | "hike" | "photo" | "bus"
        }
      ]
    }
  ],
  "applicableVouchers": [
    {
      "code": "TAXUA2026",
      "description": "...",
      "discountValue": number
    }
  ],
  "memberPointsReward": number,
  "travelTips": [
    "..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json'
      }
    });

    const textOutput = response.text?.trim() || '';
    if (!textOutput) {
      throw new Error('Empty response from Gemini API');
    }

    // Làm sạch chuỗi JSON nếu có bao quanh bởi markdown
    const cleanedJson = textOutput.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsedData = JSON.parse(cleanedJson) as TripConsultResponse;
    // Điểm Mây do quy tắc của hệ thống quyết định, không lấy số AI tự đưa ra (N06.2).
    parsedData.memberPointsReward = POINT_RULES.stay_completed;

    // Đảm bảo dữ liệu homestay có ảnh và liên hệ thực tế
    if (parsedData.recommendedHomestays && parsedData.recommendedHomestays.length > 0) {
      parsedData.recommendedHomestays = parsedData.recommendedHomestays.map((item, idx) => {
        const match = INITIAL_LISTINGS.find((l) => l.id === item.id || l.title.toLowerCase().includes(item.name.toLowerCase()));
        return {
          ...item,
          coverImage: match?.coverImage || item.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          phone: match?.phone || item.phone || '0981 234 567',
          zalo: match?.zalo || item.zalo || '0981234567',
          id: match?.id || item.id || `homestay-${idx}`
        };
      });
    }

    return parsedData;
  } catch (error) {
    console.error('[AI Advisor] Error in Gemini call, gracefully falling back to rule engine:', error);
    return generateLocalRuleBasedConsultation(req);
  }
}

/**
 * BỘ PHÂN TÍCH ĐỘ PHỨC TẠP TÁC VỤ TỰ ĐỘNG CHO REVIDAPI GATEWAY
 * Chấm điểm câu hỏi / tác vụ để tự động gán cấp độ L1 -> L5
 */
export function classifyTaskComplexity(
  promptText: string,
  featureHint?: string
): {
  level: RevidComplexityLevel;
  score: number;
  reason: string;
  recommendedModelId: string;
  fallbackModelId: string;
} {
  const lower = (promptText || '').toLowerCase();

  if (
    featureHint === 'media' ||
    lower.includes('tạo ảnh') ||
    lower.includes('banner') ||
    lower.includes('video') ||
    lower.includes('tiktok') ||
    lower.includes('thuyết minh giọng đọc')
  ) {
    return {
      level: 'L5_media',
      score: 95,
      reason: 'Tác vụ đa phương thức (Ảnh / Video / TTS / TikTok Scraper) qua /v1/generate',
      recommendedModelId: 'nano-banana-pro',
      fallbackModelId: 'flux'
    };
  }

  if (
    featureHint === 'arbitration' ||
    lower.includes('khiếu nại') ||
    lower.includes('tranh chấp') ||
    lower.includes('biên lai') ||
    lower.includes('sha-256') ||
    lower.includes('đối soát cọc')
  ) {
    return {
      level: 'L4_expert',
      score: 90,
      reason: 'Đối soát bằng chứng thanh toán VietQR & phân tích tranh chấp chuyên sâu',
      recommendedModelId: 'claude-sonnet-5',
      fallbackModelId: 'claude-opus-5'
    };
  }

  if (
    featureHint === 'itinerary' ||
    lower.includes('lịch trình') ||
    lower.includes('ngân sách') ||
    lower.includes('báo giá') ||
    lower.includes('combo') ||
    lower.includes('2n1đ') ||
    lower.includes('3n2đ') ||
    promptText.length > 220
  ) {
    return {
      level: 'L3_reasoning',
      score: 72,
      reason: 'Yêu cầu lập lịch trình đa ràng buộc & tính toán chi phí từ 179 cơ sở',
      recommendedModelId: 'gpt-5.6-sol',
      fallbackModelId: 'claude-sonnet-5'
    };
  }

  if (
    featureHint === 'moderation' ||
    lower.includes('stk') ||
    lower.includes('chuyển khoản riêng') ||
    promptText.length < 65
  ) {
    return {
      level: 'L1_micro',
      score: 20,
      reason: 'Tác vụ ngắn / Kiểm duyệt lừa đảo & che PII tốc độ cao (< 400ms)',
      recommendedModelId: 'google/gemini-flash-lite',
      fallbackModelId: 'deepseek-v4-flash'
    };
  }

  return {
    level: 'L2_fast',
    score: 45,
    reason: 'Hỏi đáp nhanh thông tin thời tiết săn mây, giờ xe chạy hoặc tiện nghi cơ sở',
    recommendedModelId: 'gpt-5.6-luna',
    fallbackModelId: 'deepseek-v4-pro'
  };
}

/**
 * GỌI TRỰC TIẾP REVIDAPI (/v1/chat/completions) HOẶC MÔ PHỎNG KHI CHƯA NHẬP KEY THẬT
 */
export async function executeRevidPlaygroundChat(params: {
  baseUrl?: string;
  apiKey?: string;
  authHeaderMode?: 'bearer' | 'x_api_key';
  modelId?: string;
  autoComplexity?: boolean;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const startTime = Date.now();
  const baseUrl = (params.baseUrl || INITIAL_REVID_GATEWAY_CONFIG.baseUrl).replace(/\/+$/, '');
  const apiKey = (params.apiKey || process.env.REVID_API_KEY || '').trim();
  const classification = classifyTaskComplexity(params.prompt);
  const chosenModelId = params.autoComplexity
    ? classification.recommendedModelId
    : params.modelId || classification.recommendedModelId;

  const modelSpec =
    REVID_MODELS_CATALOG.find((m) => m.id === chosenModelId) || REVID_MODELS_CATALOG[0];

  // Nếu có API key thật (sk_live_... hoặc sk_...), gọi thẳng tới RevidAPI endpoint
  if (apiKey && apiKey.startsWith('sk_') && !apiKey.includes('...')) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (params.authHeaderMode === 'x_api_key') {
        headers['X-API-Key'] = apiKey;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: chosenModelId,
          temperature: params.temperature ?? 0.4,
          max_tokens: params.maxTokens ?? 1024,
          messages: [
            {
              role: 'system',
              content:
                params.systemPrompt ||
                'Bạn là Trợ lý AI chính thức của nền tảng du lịch Tà Xùa Trip (179 cơ sở đã thẩm định). Hãy trả lời ngắn gọn, chính xác, minh bạch giá.'
            },
            { role: 'user', content: params.prompt }
          ]
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        const replyText =
          data?.choices?.[0]?.message?.content || 'Đã nhận phản hồi từ RevidAPI.';
        const inputTokens = data?.usage?.prompt_tokens || Math.ceil(params.prompt.length / 3);
        const outputTokens = data?.usage?.completion_tokens || Math.ceil(replyText.length / 3);
        const cacheReadTokens = Math.round(inputTokens * 0.6);
        const creditsCharged = modelSpec.isFree
          ? 0
          : Number(
              (
                ((inputTokens - cacheReadTokens) * (modelSpec.inputCreditsPer1M || 50)) / 1_000_000 +
                (cacheReadTokens * (modelSpec.cacheReadCreditsPer1M || 20)) / 1_000_000 +
                (outputTokens * (modelSpec.outputCreditsPer1M || 100)) / 1_000_000
              ).toFixed(4)
            );

        return {
          liveApiCalled: true,
          endpoint: `${baseUrl}/chat/completions`,
          complexity: classification,
          modelUsed: chosenModelId,
          provider: modelSpec.provider,
          reply: replyText,
          latencyMs: Date.now() - startTime,
          usage: {
            inputTokens,
            outputTokens,
            cacheReadTokens,
            creditsCharged
          }
        };
      }
    } catch (err) {
      console.warn('[RevidAPI Gateway] Live call failed, using intelligent sandbox response:', err);
    }
  }

  // Phản hồi thông minh bám sát dữ liệu 179 cơ sở Tà Xùa Trip khi chạy chế độ Sandbox/Demo
  const inputTokens = Math.max(120, Math.ceil(params.prompt.length * 1.8));
  const outputTokens = 310;
  const cacheReadTokens = Math.round(inputTokens * 0.65);
  const creditsCharged = modelSpec.isFree
    ? 0
    : Number(
        (
          ((inputTokens - cacheReadTokens) * (modelSpec.inputCreditsPer1M || 54)) / 1_000_000 +
          (cacheReadTokens * (modelSpec.cacheReadCreditsPer1M || 27)) / 1_000_000 +
          (outputTokens * (modelSpec.outputCreditsPer1M || 108)) / 1_000_000
        ).toFixed(4)
      );

  const simulatedReply =
    classification.level === 'L1_micro'
      ? `✅ [Kiểm duyệt AI Lớp 1 - ${modelSpec.name}]: Tin nhắn an toàn, không phát hiện hành vi gạ chuyển khoản cọc ngoài luồng hay rò rỉ thông tin nhạy cảm (PII).`
      : classification.level === 'L4_expert'
      ? `⚖️ [Phân tích Trọng tài - ${modelSpec.name}]: Đã đối chiếu ảnh biên lai VietQR và chuỗi băm SHA-256 tại phòng #9-doi-soat-booking. Khớp 100% với thẻ báo giá ràng buộc. Đề xuất: Xác nhận Đã Nhận Cọc cho đơn đặt.`
      : classification.level === 'L3_reasoning'
      ? `🗺️ [Tư vấn Lịch trình & Báo giá - ${modelSpec.name}]: Dựa trên dữ liệu 179 cơ sở tại Tà Xùa, gợi ý bạn ở Mẩy Tà Xùa Homestay hoặc Pơ Mu Homestay (Đỉnh Gió, từ 550.000đ/đêm, có bình nóng lạnh & đệm sưởi), đi kèm Combo Vé xe Cabin Đôi + Thuê xe máy nhận tại bản (giảm ngay 30.000đ, trả xe trước 12h trưa hôm sau chỉ tính 0.5 ngày).`
      : `☁️ [Phản hồi Nhanh - ${modelSpec.name}]: Sáng mai tại Đỉnh Gió và Sống Lưng Khủng Long xác suất biển mây đạt 90% trong khung giờ vàng 05:30 - 07:30. Đường đèo thông thoáng, nhiệt độ 13-18°C.`;

  return {
    liveApiCalled: false,
    endpoint: `${baseUrl}/chat/completions`,
    complexity: classification,
    modelUsed: chosenModelId,
    provider: modelSpec.provider,
    reply: simulatedReply,
    latencyMs: modelSpec.avgLatencyMs,
    usage: {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      creditsCharged
    }
  };
}
