import type { 
  Listing, 
  CloudLandmark,
  Booking,
  Review,
  BusTrip, 
  CloudHuntingForecast, 
  CommunityPost, 
  MemberProfile, 
  PartnerClaimRequest,
  BookingDispute,
  PromoVoucher,
  ServiceRewardSetting,
  SiteContentConfig,
  CuratedComboPackage,
  MenuItem,
  ServicePackageItem,
  RevidModelSpec,
  RevidPresetProfile,
  RevidApiGatewayConfig
} from '../types/index.ts';

function cleanHtmlEntities(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const RAW_LISTINGS: Listing[] = [
  {
    "id": "homestay-may",
    "title": "Mẩy Tà Xùa Homestay & Cloud Lounge",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Khu Đỉnh Gió, Xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0981 234 567",
    "zalo": "0981234567",
    "rating": 4.9,
    "reviewCount": 142,
    "hasCloudView": true,
    "minPrice": 550000,
    "priceNote": "Đã bao gồm bữa sáng đặc sản & trà Shan Tuyết",
    "description": "Nằm tại vị trí đắc địa nhất Đỉnh Gió với tầm nhìn 180 độ ôm trọn thung lũng mây Tà Xùa. Buổi sáng chỉ cần mở cửa kính là biển mây tràn tận chân giường.",
    "coverImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-03",
    "isInstantBooking": true,
    "partnerId": "partner-01",
    "tags": [
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Đỉnh Gió",
      "Bồn tắm view núi",
      "Sưởi ấm"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3268,
      "lng": 104.4785
    },
    "stats": {
      "views": 3420,
      "callClicks": 520,
      "bookingsCount": 88
    },
    "roomTypes": [
      {
        "id": "may-r1",
        "name": "Bungalow Kính Mặt Trời (View Biển Mây)",
        "capacity": 2,
        "priceWeekend": 750000,
        "priceWeekday": 550000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi điện",
          "Wifi 4G",
          "Ban công riêng",
          "Trà Shan Tuyết"
        ],
        "imageUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
      },
      {
        "id": "may-r2",
        "name": "Phòng VIP Đỉnh Gió (Gia đình 4 người)",
        "capacity": 4,
        "priceWeekend": 1200000,
        "priceWeekday": 950000,
        "totalRooms": 2,
        "availableRooms": 2,
        "viewType": "Thung lũng",
        "amenities": [
          "2 giường đôi",
          "Bồn tắm ngâm thảo dược",
          "Lò sưởi củi",
          "View 180 độ"
        ],
        "imageUrl": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    "id": "homestay-lutre",
    "title": "Lu Trế Homestay - Nóc Nhà Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh cao nhất khu du lịch Tà Xùa (cách mỏm Đỉnh Gió 800m)",
    "phone": "0977 889 900",
    "zalo": "0977889900",
    "rating": 4.8,
    "reviewCount": 96,
    "hasCloudView": true,
    "minPrice": 480000,
    "priceNote": "View 360 độ từ điểm cao nhất dãy núi",
    "description": "Tọa lạc tại mỏm cao nhất của dãy Tà Xùa, Lu Trế là nơi đón ánh bình minh đầu tiên rọi vào sóng mây bồng bềnh. Yên tĩnh tuyệt đối và lãng mạn.",
    "coverImage": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-03",
    "isInstantBooking": true,
    "partnerId": "partner-02",
    "tags": [
      "View mây phòng ngủ",
      "Yên tĩnh tuyệt đối",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.329,
      "lng": 104.476
    },
    "stats": {
      "views": 2890,
      "callClicks": 410,
      "bookingsCount": 64
    },
    "roomTypes": [
      {
        "id": "lutre-r1",
        "name": "Lều Glamping Mây Bồng Bềnh",
        "capacity": 3,
        "priceWeekend": 600000,
        "priceWeekday": 480000,
        "totalRooms": 5,
        "availableRooms": 4,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Đệm sưởi",
          "Chăn lông cừu",
          "Đèn bão vintage",
          "Bình siêu tốc"
        ],
        "imageUrl": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"
      }
    ]
  },
  {
    "id": "coffee-mi-oi",
    "title": "Tiệm Cà Phê Mị Ơi - View Vực Mây Đỉnh Gió",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Dốc Đỉnh Gió, Xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0912 889 112",
    "zalo": "0912889112",
    "rating": 4.95,
    "reviewCount": 310,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống 45k - 65k, tặng kèm góc check-in xích đu mây",
    "description": "Quán cà phê gỗ kinh điển nổi tiếng bậc nhất Tà Xùa. Nằm chênh vênh mép vực với sàn gỗ và xích đu giữa biển mây. Tọa độ sống ảo không thể bỏ lỡ.",
    "coverImage": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-03",
    "isInstantBooking": true,
    "partnerId": "partner-04",
    "tags": [
      "Xích đu vô cực",
      "Cà phê muối",
      "Ngắm hoàng hôn",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3272,
      "lng": 104.4772
    },
    "stats": {
      "views": 6890,
      "callClicks": 980,
      "bookingsCount": 210
    }
  },
  {
    "id": "tour-song-lung",
    "title": "Tour Trekking Chinh Phục Sống Lưng Khủng Long & Đỉnh U Bò",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Xuất phát từ Bản Háng Đồng, Xã Háng Đồng, Bắc Yên",
    "phone": "0973 112 334",
    "zalo": "0973112334",
    "rating": 4.95,
    "reviewCount": 180,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Giá trọn gói 1 ngày: Guide bản địa + Xe ôm trung chuyển + Bữa trưa nướng ống tre",
    "description": "Trải nghiệm đi trên sống núi hẹp tựa lưng khủng long khổng lồ, hai bên là biển mây cuồn cuộn. Hướng dẫn viên bản địa kinh nghiệm, hỗ trợ chụp ảnh máy cơ và flycam.",
    "coverImage": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-06",
    "isInstantBooking": true,
    "partnerId": "partner-tour-01",
    "tags": [
      "Guide H'Mông bản địa",
      "Bảo hiểm du lịch",
      "Hỗ trợ flycam",
      "Cơm lam gà nướng"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3695,
      "lng": 104.5132
    },
    "stats": {
      "views": 4120,
      "callClicks": 820,
      "bookingsCount": 290
    }
  },
  {
    "id": "tx-stay-1",
    "title": "Chillout Village Tà Xùa",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0933669881",
    "zalo": "0933669881",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 30,
    "hasCloudView": true,
    "minPrice": 400000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Chillout Village nổi bật với không gian nghỉ dưỡng riêng tư, view thung lũng đẹp và những căn phòng kính rộng mở hướng núi. Bên cạnh hệ thống phòng tiện nghi, homestay còn có bể bơi và nhiều hoạt động giải trí, mang đến trải nghiệm thư giãn trọn vẹn giữa thiên nhiên Tà Xùa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170201336-644236.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170201336-644236.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781171503178-208857.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170214795-569697.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170199783-26996.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170202369-760636.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170203208-646195.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170203880-916530.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170204850-775443.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-1",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.315,
      "lng": 104.4655
    },
    "stats": {
      "views": 1200,
      "callClicks": 140,
      "bookingsCount": 35
    },
    "roomTypes": [
      {
        "id": "rm-0-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 400000,
        "priceWeekday": 340000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781171503178-208857.png.w1080.webp"
      },
      {
        "id": "rm-0-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 600000,
        "priceWeekday": 520000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170214795-569697.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-2",
    "title": "Homestay Trà Mây Tà Xùa",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Bẹ, xã Tà Xùa",
    "phone": "0975091172",
    "zalo": "0975091172",
    "facebook": "https://www.facebook.com/tramaytaxua",
    "rating": 4.82,
    "reviewCount": 37,
    "hasCloudView": true,
    "minPrice": 360000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "TRÀ MÂY TÀ XÙA – CHẠM MÂY, THƯỞNG TRÀ, TÌM VỀ BÌNH YÊN\nẨn mình giữa núi rừng Tây Bắc hùng vĩ, Homestay Trà Mây Tà Xùa tọa lạc tại Bản Bẹ, xã Tà Xùa, Sơn La – nơi thiên nhiên giao hòa cùng nét đẹp văn hóa bản địa, mang đến một không gian nghỉ dưỡng yên bình, gần gũi và đầy cảm xúc.\nSở hữu vị trí độc đáo với tầm nhìn hướng ra hai thung lũng rộng lớn, Trà Mây là điểm dừng chân lý tưởng để du khách chiêm ngưỡng biển mây bồng bềnh, đón những tia nắng đầu ngày và tận hưởng bầu không khí trong lành giữa núi rừng. Hệ thống bungalow riêng tư cùng khu nhà sàn mang đậm nét truyền thống tạo nên không gian lưu trú ấm cúng, mộc mạc nhưng vẫn đầy đủ tiện nghi.\nKhông chỉ là nơi lưu trú, Trà Mây còn mang đến trải nghiệm văn hóa trà Shan Tuyết cổ thụ đặc trưng của vùng đất Tà Xùa. Du khách có thể thưởng thức những chén trà thơm giữa khung cảnh núi non, tìm hiểu câu chuyện về những cây trà hàng trăm năm tuổi và khám phá nét đẹp trong đời sống, văn hóa của người dân địa phương.\nNằm cách khu rừng trà cổ thụ khoảng 1 km, Trà Mây cũng là điểm khởi đầu thuận tiện cho hành trình khám phá thiên nhiên và những giá trị đặc sắc của vùng đất Tà Xùa.\nĐến với Trà Mây, mỗi chuyến đi không chỉ là hành trình săn mây, mà còn là dịp sống chậm lại, cảm nhận hương trà và lưu giữ những khoảnh khắc bình yên giữa đại ngàn Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861261076-fbed0926-fd90-4ca0-83e1-8a448a17952c.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861261076-fbed0926-fd90-4ca0-83e1-8a448a17952c.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861463004-e18ceb10-b201-486b-b2cf-e4f099759893.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861593090-1b943954-f642-4867-bafa-ec35785dd471.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861625771-369ecf54-ffe4-4f0a-a62c-b517e596d964.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861639617-723eab08-d203-46b3-a381-d67d3f428909.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861734751-5f92067b-5b6b-4dee-913a-a0a06748b9b2.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793862063780-6fe99b4a-4414-4b77-a9d2-ac72712f65bb.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793862600328-a69ab4ca-0981-498c-88a2-00608924211c.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-2",
    "tags": [
      "View mây phòng ngủ",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31915,
      "lng": 104.4686
    },
    "stats": {
      "views": 1285,
      "callClicks": 152,
      "bookingsCount": 39
    },
    "roomTypes": [
      {
        "id": "rm-1-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 360000,
        "priceWeekday": 306000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861463004-e18ceb10-b201-486b-b2cf-e4f099759893.jpg.w1080.webp"
      },
      {
        "id": "rm-1-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 540000,
        "priceWeekday": 468000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861593090-1b943954-f642-4867-bafa-ec35785dd471.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-3",
    "title": "Chạm Cảm Xúc Home",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe cải",
    "phone": "0946561111",
    "zalo": "0946561111",
    "facebook": "https://www.facebook.com/profile.php?id=61583268689178",
    "rating": 4.94,
    "reviewCount": 44,
    "hasCloudView": true,
    "minPrice": 800000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Căn home nhỏ xinh nằm khuất trong lưng chừng núi Khe Cải với view thẳng ra thác mây và biển mây. Chạm không có nhiều phòng mà dành chủ yếu không gian sân vườn để hoà mình với thiên nhiên. Đến nhà Chạm bạn có thể tìm được không gian yên tĩnh tách biệt hoàn toàn với sự ồn náo của phố thị, để được chill, được sống với chính mình...",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778100296-79ce7bb4-06dc-42aa-b3ce-ef2f16ea7df7.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778100296-79ce7bb4-06dc-42aa-b3ce-ef2f16ea7df7.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778090664-1b9e7d46-9cda-4aa0-a3b3-5196ad587a01.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778092572-b4a9ff97-a41c-4c8f-adf4-bdbb2b61e6e7.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778094330-bc1d4de7-41ad-43bf-be0c-f7a24f1df50e.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778096084-5cadb1bb-e374-40da-b1ac-26764c7087f5.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778098209-96ddae2a-87a2-4e7f-8b7a-1125b344c355.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778102560-17c48ebf-6766-46ee-ab72-5f4a2c96132a.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778582223-6fb7c8fe-99cc-430b-88f1-a37bdb1c8fcb.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-3",
    "tags": [
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31815,
      "lng": 104.4651
    },
    "stats": {
      "views": 1370,
      "callClicks": 164,
      "bookingsCount": 43
    },
    "roomTypes": [
      {
        "id": "rm-2-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 800000,
        "priceWeekday": 680000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778090664-1b9e7d46-9cda-4aa0-a3b3-5196ad587a01.jpg.w1080.webp"
      },
      {
        "id": "rm-2-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1200000,
        "priceWeekday": 1040000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778092572-b4a9ff97-a41c-4c8f-adf4-bdbb2b61e6e7.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-4",
    "title": "Tà Xùa Ecolodge",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Chung Trinh, Xã Tà Xùa, Sơn La",
    "phone": "0989345302",
    "zalo": "0989345302",
    "facebook": "https://www.facebook.com/EcolodgeTaxua",
    "rating": 4.76,
    "reviewCount": 51,
    "hasCloudView": true,
    "minPrice": 1500000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Ecolodge là khu nghỉ dưỡng sinh thái giữa núi rừng Tà Xùa, Sơn La, nơi du khách có thể tận hưởng không gian xanh yên bình giữ đồi táo mèo và chè shan tuyết, không khí trong lành và khung cảnh biển mây tuyệt đẹp. Với kiến trúc gỗ, mái Pơ Mu gần gũi thiên nhiên, nơi đây mang đến trải nghiệm nghỉ dưỡng thư thái, khám phá văn hóa bản địa và thưởng thức vẻ đẹp hoang sơ của vùng núi Tây Bắc.\n\nTà Xùa Ecolodge is a peaceful mountain retreat nestled in the beautiful highlands of Tà Xùa, Son La. Surrounded by fresh mountain air among shan tea and H&#x27;mong apple trees, lush landscapes and spectacular sea-of-cloud views, it offers a relaxing escape where guests can reconnect with nature, experience local culture and enjoy the authentic charm of Vietnam’s Northwest mountains.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595961687-cbacba42-6906-4682-beef-586aacfb4a59.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595961687-cbacba42-6906-4682-beef-586aacfb4a59.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595987258-06155992-f84e-4d0c-8a07-ee32edc51d61.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595989531-57d14948-6016-4aa5-b8d1-bb3acf994b43.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595991801-019fb0d8-102e-4f6a-be6a-dab26c19f936.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595993157-845e4ba2-5844-4729-ab40-fd46631b0d31.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793596139993-894087bc-9d85-4dea-92a4-6f9b97896068.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793596142081-f5355353-c912-4383-bfa6-f2d8a0cfd066.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793596144720-da16c725-d559-40ee-9a74-9def43643a03.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-4",
    "tags": [
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31752,
      "lng": 104.46938
    },
    "stats": {
      "views": 1455,
      "callClicks": 176,
      "bookingsCount": 47
    },
    "roomTypes": [
      {
        "id": "rm-3-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 1500000,
        "priceWeekday": 1275000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595987258-06155992-f84e-4d0c-8a07-ee32edc51d61.jpg.w1080.webp"
      },
      {
        "id": "rm-3-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 2250000,
        "priceWeekday": 1950000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595989531-57d14948-6016-4aa5-b8d1-bb3acf994b43.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-5",
    "title": "Dốc Mơ Homestay - Nhà trong Mây",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0855117868",
    "zalo": "0855117868",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 58,
    "hasCloudView": true,
    "minPrice": 599000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Dốc Mơ Homestay - Nhà trong Mây là nơi du khách có thể hiện thực hóa giấc mơ được sống lơ lửng giữa một thiên đường mây sương mờ ảo. Tọa lạc bên triền dốc cao khoáng đạt, homestay sở hữu lối kiến trúc nhà gỗ thô mộc mang tone màu trầm ấm, kết hợp khéo léo với hệ thống vách kính lớn mở ra tầm nhìn không giới hạn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068920781-340001.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068921875-142751.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068922612-141431.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068923333-568209.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068924212-193512.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068924777-18629.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068925346-449673.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-5",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24776,
      "lng": 104.43199
    },
    "stats": {
      "views": 1540,
      "callClicks": 188,
      "bookingsCount": 51
    },
    "roomTypes": [
      {
        "id": "rm-4-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 599000,
        "priceWeekday": 509150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068920781-340001.jpg.w1080.webp"
      },
      {
        "id": "rm-4-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 898500,
        "priceWeekday": 778700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068921875-142751.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-6",
    "title": "Homestay Mùa Thanh Hằng",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trung Tâm · Xã tà xùa",
    "phone": "0984369299",
    "zalo": "0984369299",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 65,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Home view biển mây, thung lũng, có điều hòa 2 chiều và đầy đủ các tiện ích khác  . Các hạng phòng từ 1-3 kính",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462637990-019510d8-f2a5-466e-a2aa-75b57793bc7f.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462640633-f44e9cb9-d9e4-4ba8-9631-49034978f816.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462643454-0cb82b81-9f0b-4d92-bc90-2cb24c2d8c76.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462647054-2ba67e90-77f6-4508-8925-34774d8f71b7.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462649291-75b7dd2a-d131-481a-9bb4-6ae695e62fa1.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462651450-3b6fe633-8c35-4a01-abce-0f16d77f44b5.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462654194-09a25289-3911-4132-8dc0-7b328ec12037.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-6",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3198,
      "lng": 104.47076
    },
    "stats": {
      "views": 1625,
      "callClicks": 200,
      "bookingsCount": 55
    },
    "roomTypes": [
      {
        "id": "rm-5-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462637990-019510d8-f2a5-466e-a2aa-75b57793bc7f.jpg.w1080.webp"
      },
      {
        "id": "rm-5-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462640633-f44e9cb9-d9e4-4ba8-9631-49034978f816.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-7",
    "title": "May Home Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0774262626",
    "zalo": "0774262626",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 72,
    "hasCloudView": true,
    "minPrice": 799000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635791580-187280.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635791580-187280.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635789859-33129.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635790799-434596.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635792263-180503.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635792901-846660.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635793907-949589.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635794596-553555.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635795526-763090.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-7",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24427,
      "lng": 104.43042
    },
    "stats": {
      "views": 1710,
      "callClicks": 212,
      "bookingsCount": 59
    },
    "roomTypes": [
      {
        "id": "rm-6-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 799000,
        "priceWeekday": 679150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635789859-33129.jpg.w1080.webp"
      },
      {
        "id": "rm-6-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1198500,
        "priceWeekday": 1038700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635790799-434596.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-8",
    "title": "Nhà trên bản",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0987898626",
    "zalo": "0987898626",
    "facebook": "https://www.facebook.com/profile.php?id=61587863627362",
    "rating": 4.84,
    "reviewCount": 79,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Trên Bản Tà Xùa là homestay nằm ngay khu vực trung tâm Tà Xùa, xung quanh là các gia đình người Mông bản địa, thuận tiện di chuyển đến các quán cà phê, nhà hàng và các điểm săn mây nổi tiếng. Homestay mang phong cách mộc mạc, gần gũi với thiên nhiên, sở hữu không gian yên tĩnh cùng tầm nhìn hướng núi và thung lũng đặc trưng của vùng cao Tây Bắc. Đây là lựa chọn phù hợp cho du khách muốn nghỉ dưỡng, tận hưởng không khí trong lành và khám phá vẻ đẹp Tà Xùa một cách nhẹ nhàng, thư thái.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499385927-244448.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499385927-244448.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499387526-111879.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499388646-393840.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499389706-796405.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499390800-905469.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499391911-198191.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499392908-433893.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499394068-597760.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-8",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24743,
      "lng": 104.43042
    },
    "stats": {
      "views": 1795,
      "callClicks": 224,
      "bookingsCount": 63
    },
    "roomTypes": [
      {
        "id": "rm-7-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 350000,
        "priceWeekday": 297500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499387526-111879.jpg.w1080.webp"
      },
      {
        "id": "rm-7-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 525000,
        "priceWeekday": 455000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781499388646-393840.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-9",
    "title": "Cloud Forest Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0395805715",
    "zalo": "0395805715",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 86,
    "hasCloudView": true,
    "minPrice": 799000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cloud Forest là một góc trốn lý tưởng dành cho những ai yêu thích phong cách trẻ trung, hiện đại nhưng vẫn muốn hòa mình trọn vẹn vào thiên nhiên Tà Xùa. Đúng như tên gọi, homestay tựa như một ngôi nhà ẩn mình giữa làn sương mờ, nổi bật với lối kiến trúc sử dụng các hệ khung cửa kính lớn sát trần. Không gian nơi đây mang tone màu gỗ sáng kết hợp sắc trắng thanh lịch, tạo cảm giác vừa ngập tràn ánh sáng ban mai, vừa cực kỳ ấm cúng và có gu giữa cái lạnh đặc trưng của vùng cao.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335773608-723261.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335771465-934897.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772980-804483.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335774199-682607.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335774777-366165.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335775321-386966.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335776022-303115.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-9",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3234,
      "lng": 104.47726
    },
    "stats": {
      "views": 1880,
      "callClicks": 236,
      "bookingsCount": 67
    },
    "roomTypes": [
      {
        "id": "rm-8-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 799000,
        "priceWeekday": 679150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335773608-723261.jpg.w1080.webp"
      },
      {
        "id": "rm-8-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1198500,
        "priceWeekday": 1038700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335771465-934897.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-10",
    "title": "Moong Homestay Ta Xua",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0965180162",
    "zalo": "0965180162",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 93,
    "hasCloudView": true,
    "minPrice": 700000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Moong Homestay là một góc nhỏ mang đậm phong cách kiến trúc mộc mạc và nguyên bản của vùng cao Tây Bắc. Homestay ghi điểm nhờ vẻ đẹp thô mộc từ những căn nhà gỗ, mái lợp ngói âm dương sẫm màu kết hợp cùng khuôn viên ngập tràn cỏ hoa và sắc màu rực rỡ của các họa tiết thổ cẩm. Không hướng đến sự tiện nghi sang trọng, Moong Homestay níu chân du khách bằng sự bình dị, ấm áp, mang lại một không gian tĩnh lặng lý tưởng để bạn hoàn toàn thả lỏng tâm hồn và cảm nhận trọn vẹn hơi thở của núi rừng Tà Xùa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336064197-970833.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336064822-40890.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336066109-80684.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336066579-288653.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336067301-431895.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336067873-267699.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336068397-972972.png.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-10",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.33013,
      "lng": 104.48049
    },
    "stats": {
      "views": 1965,
      "callClicks": 248,
      "bookingsCount": 71
    },
    "roomTypes": [
      {
        "id": "rm-9-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 700000,
        "priceWeekday": 595000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336064197-970833.png.w1080.webp"
      },
      {
        "id": "rm-9-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1050000,
        "priceWeekday": 910000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336064822-40890.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-11",
    "title": "Tà Xùa Ecolodge",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Chung Trinh, Xã Tà Xùa, Sơn La",
    "phone": "0868832088",
    "zalo": "0868832088",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 100,
    "hasCloudView": true,
    "minPrice": 499000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Ecolodge (tại Bản Chung Trinh) là một trong những khu nghỉ dưỡng được đầu tư bài bản và chỉn chu nhất tại thiên đường mây Tà Xùa. Mang phong cách kiến trúc mộc mạc đậm chất Tây Bắc kết hợp hài hòa với thiên nhiên, nơi đây sở hữu hệ thống phòng đa dạng từ các căn Bungalow riêng tư, phòng nhà sàn đến đệm cộng đồng. Tà Xùa Ecolodge là lựa chọn hoàn hảo cho những ai muốn tìm kiếm một không gian nghỉ dưỡng sinh thái đúng nghĩa, có tầm nhìn ôm trọn thung lũng sương mù huyền ảo.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236035436-727228.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236035436-727228.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236034187-398296.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236034807-539097.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236036061-709571.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236036670-79406.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236037304-271297.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236038054-824728.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236038717-519019.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-11",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31875,
      "lng": 104.46938
    },
    "stats": {
      "views": 2050,
      "callClicks": 260,
      "bookingsCount": 75
    },
    "roomTypes": [
      {
        "id": "rm-10-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 499000,
        "priceWeekday": 424150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236034187-398296.png.w1080.webp"
      },
      {
        "id": "rm-10-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 748500,
        "priceWeekday": 648700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236034807-539097.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-12",
    "title": "Tà Xùa Clouds Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0393000008",
    "zalo": "0393000008",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 107,
    "hasCloudView": true,
    "minPrice": 400000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Clouds Homestay là một trong những cái tên đình đám và quen thuộc nhất đối với cộng đồng mê xê dịch khi đến với thiên đường mây. Sở hữu vị trí đắc địa ngay sát sườn núi, homestay được thiết kế theo lối không gian mở với các căn nhà gỗ mộc mạc và hệ thống vách kính lớn hướng thẳng ra thung lũng sâu.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260193087-455820.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260193087-455820.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260193848-397417.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260194541-263118.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260195234-513722.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260195981-835803.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635791580-187280.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-12",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24549,
      "lng": 104.4331
    },
    "stats": {
      "views": 2135,
      "callClicks": 272,
      "bookingsCount": 79
    },
    "roomTypes": [
      {
        "id": "rm-11-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 400000,
        "priceWeekday": 340000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260193848-397417.jpg.w1080.webp"
      },
      {
        "id": "rm-11-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 600000,
        "priceWeekday": 520000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781260194541-263118.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-13",
    "title": "Chillin House Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0977632953",
    "zalo": "0977632953",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 114,
    "hasCloudView": true,
    "minPrice": 699000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Chillin House mang đến một không gian lưu trú mộc mạc, yên bình và đậm chất &quot;chill&quot; giữa lòng Tà Xùa. Homestay nổi bật với những căn bungalow bằng gỗ tự nhiên, thiết kế tối giản nhưng ấm cúng, kết hợp cùng hệ thống cửa kính lớn hướng thẳng ra thung lũng. Với khoảng sân hiên gỗ rộng rãi, đây là toạ độ lý tưởng để bạn ngồi thong thả nhâm nhi tách trà nóng, phóng tầm mắt ngắm nhìn biển mây cuồn cuộn hay thưởng thức những bữa tiệc nướng ấm áp bên bạn bè giữa cái lạnh vùng cao.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276473094-899077.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276473094-899077.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276460081-939302.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276461046-90175.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276461742-340095.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276462813-272107.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276463522-100935.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276464213-460475.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276464984-687231.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-13",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32822,
      "lng": 104.4751
    },
    "stats": {
      "views": 2220,
      "callClicks": 284,
      "bookingsCount": 83
    },
    "roomTypes": [
      {
        "id": "rm-12-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 699000,
        "priceWeekday": 594150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276460081-939302.jpg.w1080.webp"
      },
      {
        "id": "rm-12-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1048500,
        "priceWeekday": 908700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276461046-90175.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-14",
    "title": "Homestay Tà Xùa C",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0374523633",
    "zalo": "0374523633",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 121,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa C Homestay là góc lưu trú mang đậm phong cách vintage hoài cổ và mộc mạc. Lấy chất liệu gỗ tự nhiên làm chủ đạo, từ những căn bungalow nhỏ xinh cho đến phòng gia đình đều mang tông màu trầm ấm, mang lại cảm giác cực kỳ gần gũi. Nếu bạn đang tìm kiếm một không gian yên bình, có khoảng sân nhỏ để sáng ra ngắm sương giăng, tối đến lên đèn lung linh nướng BBQ hay trò chuyện cùng bạn bè thì đây là một lựa chọn rất đáng cân nhắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256822262-665472.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256822262-665472.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256817715-10817.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256818915-931149.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256819695-615641.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256820427-238182.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256820965-964661.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256821705-271233.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256822889-952672.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-14",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.2421,
      "lng": 104.4335
    },
    "stats": {
      "views": 2305,
      "callClicks": 296,
      "bookingsCount": 87
    },
    "roomTypes": [
      {
        "id": "rm-13-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256817715-10817.jpg.w1080.webp"
      },
      {
        "id": "rm-13-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781256818915-931149.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-15",
    "title": "A Phủ Home&#x27;s",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "ngay Trung Tâm xã Tà Xùa",
    "phone": "0988238629",
    "zalo": "0988238629",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.98,
    "reviewCount": 128,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "A Phủ Home&#x27;s là điểm dừng chân mộc mạc, quen thuộc của cộng đồng mê săn mây Tà Xùa. Sở hữu hệ thống phòng đa dạng từ phòng đôi ấm cúng đến phòng dorm tiết kiệm , nơi đây đáp ứng tốt nhu cầu của cả khách đi lẻ lẫn nhóm đông người. Homestay ghi điểm nhờ không gian kết nối mở với các hoạt động đốt lửa trại và tiệc nướng BBQ đậm chất núi rừng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187594943-205295.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187594943-205295.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187593068-141016.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187594423-323331.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187595588-878679.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187596185-442300.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187596867-258116.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187597619-195574.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187598390-978479.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-15",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3245,
      "lng": 104.4686
    },
    "stats": {
      "views": 2390,
      "callClicks": 308,
      "bookingsCount": 91
    },
    "roomTypes": [
      {
        "id": "rm-14-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187593068-141016.jpg.w1080.webp"
      },
      {
        "id": "rm-14-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781187594423-323331.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-16",
    "title": "Amora Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Phiêng Ban, Bắc Yên, Sơn La",
    "phone": "0967551526",
    "zalo": "0967551526",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 135,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm · Bản Phiêng Ban, Bắc Yên, Sơn La. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189729074-727385.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189729074-727385.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189726585-276559.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189728086-455809.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189729890-265439.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189730573-345122.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189731621-987274.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189732635-300208.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189733559-626456.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-16",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24197,
      "lng": 104.4331
    },
    "stats": {
      "views": 2475,
      "callClicks": 320,
      "bookingsCount": 95
    },
    "roomTypes": [
      {
        "id": "rm-15-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189726585-276559.jpg.w1080.webp"
      },
      {
        "id": "rm-15-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781189728086-455809.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-17",
    "title": "Bếp Nhà Táo",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Trung tâm Khe Cải, huyện Bắc Yên, tỉnh Sơn La, Việt Nam",
    "phone": "866008000",
    "zalo": "866008000",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.82,
    "reviewCount": 142,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Bếp Nhà Táo là điểm lưu trú được nhiều du khách yêu thích nhờ không gian mộc mạc, ấm áp và cảm giác gần gũi như ở nhà. Nằm giữa thiên nhiên Tà Xùa, homestay mang đến không gian thư giãn yên tĩnh cùng nhiều góc ngắm núi đẹp, phù hợp cho các cặp đôi, nhóm bạn và gia đình.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172148301-790559.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172148301-790559.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172144493-74085.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172145463-110734.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172146301-735195.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172146984-884025.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172147646-389868.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172148939-592379.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172149752-158155.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-17",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31665,
      "lng": 104.45938
    },
    "stats": {
      "views": 2560,
      "callClicks": 332,
      "bookingsCount": 99
    },
    "roomTypes": [
      {
        "id": "rm-16-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172144493-74085.jpg.w1080.webp"
      },
      {
        "id": "rm-16-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172145463-110734.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-18",
    "title": "Noong Ơi Homestay Coffee",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải · Sơn La, Việt Nam",
    "phone": "0978679378",
    "zalo": "0978679378",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.94,
    "reviewCount": 149,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Noong Ơi Homestay Coffee là điểm lưu trú kết hợp quán cà phê tại Tà Xùa, nổi bật với không gian gần gũi thiên nhiên và tầm nhìn hướng núi thoáng đãng. Homestay mang phong cách mộc mạc, yên bình, phù hợp cho du khách muốn nghỉ ngơi, thưởng thức cà phê và tận hưởng không khí trong lành của vùng cao Tà Xùa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172670256-518911.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172670256-518911.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172671062-813428.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172672176-270559.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172673054-747543.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172673973-527917.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172674942-903736.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172675647-844427.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172676415-221295.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-18",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31524,
      "lng": 104.46399
    },
    "stats": {
      "views": 2645,
      "callClicks": 344,
      "bookingsCount": 103
    },
    "roomTypes": [
      {
        "id": "rm-17-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 350000,
        "priceWeekday": 297500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172671062-813428.jpg.w1080.webp"
      },
      {
        "id": "rm-17-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 525000,
        "priceWeekday": 455000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172672176-270559.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-19",
    "title": "Mando Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0843399333",
    "zalo": "0843399333",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.76,
    "reviewCount": 156,
    "hasCloudView": true,
    "minPrice": 699000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173764021-981487.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173764021-981487.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173757556-230104.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173758307-614350.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173759041-579886.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173760072-875658.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173760668-292138.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173761266-144756.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173762063-109300.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-19",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24295,
      "lng": 104.42875
    },
    "stats": {
      "views": 2730,
      "callClicks": 356,
      "bookingsCount": 107
    },
    "roomTypes": [
      {
        "id": "rm-18-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 699000,
        "priceWeekday": 594150,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173757556-230104.jpg.w1080.webp"
      },
      {
        "id": "rm-18-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 1048500,
        "priceWeekday": 908700,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781173758307-614350.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-20",
    "title": "Cam&#x27;s House Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió · Bắc Yên, Sơn La",
    "phone": "0961773761",
    "zalo": "0961773761",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 163,
    "hasCloudView": true,
    "minPrice": 600000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cam&#x27;s House là một homestay xinh xắn nằm ngay tại trung tâm xã Tà Xùa. Nơi đây mang phong cách thiết kế mộc mạc với cổng chào gỗ đặc trưng, tọa lạc trong một xóm nhỏ yên bình và tách biệt khỏi sự ồn ào của phố thị. Điểm đắt giá nhất của Cam&#x27;s House là khoảng sân vườn rộng rãi và hệ thống phòng nghỉ (phòng đôi, phòng gia đình) sở hữu tầm nhìn kính hướng trọn ra thung lũng, giúp du khách có thể săn biển mây bồng bềnh và ngắm bình minh ngay tại phòng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175292959-600426.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175292959-600426.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175290032-696265.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175290676-828286.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175291477-242556.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175292254-362712.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175293777-620371.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175294690-2294.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175296176-733940.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-20",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.33004,
      "lng": 104.47893
    },
    "stats": {
      "views": 2815,
      "callClicks": 368,
      "bookingsCount": 111
    },
    "roomTypes": [
      {
        "id": "rm-19-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 600000,
        "priceWeekday": 510000,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175290032-696265.jpg.w1080.webp"
      },
      {
        "id": "rm-19-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 900000,
        "priceWeekday": 780000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781175290676-828286.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-21",
    "title": "BB Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0365971979",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 170,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "BB Homestay Tà Xùa là một điểm dừng chân mang phong cách mộc mạc, gần gũi và đầy thư thái, rất được lòng cộng đồng xê dịch khi ghé thăm thiên đường mây Tây Bắc. Được thiết kế với chất liệu gỗ tự nhiên ấm áp làm chủ đạo, homestay đem lại cảm giác bình yên, thân thuộc ngay từ những bước chân đầu tiên.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909686990-288075.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909686990-288075.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909688064-750527.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909688842-130734.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909689536-5140.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909690325-375909.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909691030-573174.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909691622-411937.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909692316-467567.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-21",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24155,
      "lng": 104.43042
    },
    "stats": {
      "views": 2900,
      "callClicks": 380,
      "bookingsCount": 115
    },
    "roomTypes": [
      {
        "id": "rm-20-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909688064-750527.jpg.w1080.webp"
      },
      {
        "id": "rm-20-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909688842-130734.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-22",
    "title": "Sơn Tra Our House",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0983303026",
    "zalo": "0375832369",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 177,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Sơn Tra Our House là một điểm dừng chân mang phong cách mộc mạc, gần gũi và đầy thư thái, tọa lạc tại vị trí đắc địa ngay gần khu vực Sống Lưng Khủng Long – tọa độ săn mây và trekking nổi tiếng bậc nhất Tà Xùa. Đúng như cái tên &quot;Our House&quot; đầy thân thương, homestay mở ra một không gian lưu trú ấm cúng, riêng tư và hoàn toàn tách biệt khỏi sự xô bồ. Đây là điểm hẹn lý tưởng cho những ai đang tìm kiếm một nơi yên tĩnh để nghỉ ngơi sau chuỗi ngày bận rộn, thong thả hòa mình vào thiên nhiên và trải nghiệm trọn vẹn nhịp sống hoang sơ của vùng cao Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846387075-655359.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846387569-314721.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846387970-932391.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846389381-172208.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846390073-873681.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846390851-39291.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846391448-598770.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-22",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36761,
      "lng": 104.54076
    },
    "stats": {
      "views": 2985,
      "callClicks": 392,
      "bookingsCount": 119
    },
    "roomTypes": [
      {
        "id": "rm-21-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846387075-655359.jpg.w1080.webp"
      },
      {
        "id": "rm-21-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846387569-314721.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-23",
    "title": "Homestay &amp; Coffe Đỉnh Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0918614486",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.84,
    "reviewCount": 34,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Homestay &amp; Coffee Đỉnh Tà Xùa là một trong những khu phức hợp lưu trú kết hợp cà phê sở hữu vị trí vô cùng lý tưởng dành cho các tín đồ mê xê dịch. Với lối kiến trúc ưu tiên chất liệu gỗ mộc mạc mang tone màu ấm áp đặc trưng của vùng cao, nơi đây mở ra một không gian ngập tràn ánh sáng và gió ngàn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762855901-943720.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762855901-943720.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762857435-932673.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762858460-428837.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762859429-171308.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762860534-449033.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762861342-248400.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762862318-982068.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-23",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32583,
      "lng": 104.48048
    },
    "stats": {
      "views": 3070,
      "callClicks": 404,
      "bookingsCount": 123
    },
    "roomTypes": [
      {
        "id": "rm-22-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762857435-932673.jpg.w1080.webp"
      },
      {
        "id": "rm-22-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783762858460-428837.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-24",
    "title": "Vàng Pè Homestay - Sống lưng khủng long",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0933669881",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 41,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Vàng Pè Homestay là một điểm lưu trú mang phong cách mộc mạc, hoang sơ và đậm đà bản sắc văn hóa vùng cao, tọa lạc ngay gần khu vực Sống lưng khủng long — một trong những tọa độ săn mây và trekking nổi tiếng nhất Tà Xùa. Được xây dựng theo lối kiến trúc nhà gỗ truyền thống ấm cúng, homestay mang đến một không gian lưu trú vô cùng gần gũi và bình dị.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780451701-680625.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780451701-680625.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780452765-870712.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780453608-401033.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780454453-816036.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780455296-281498.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780456804-979543.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780457671-594558.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780458354-67358.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-24",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36404,
      "lng": 104.53938
    },
    "stats": {
      "views": 3155,
      "callClicks": 416,
      "bookingsCount": 127
    },
    "roomTypes": [
      {
        "id": "rm-23-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780452765-870712.jpg.w1080.webp"
      },
      {
        "id": "rm-23-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780453608-401033.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-25",
    "title": "Estopa Retreat - Tà Xùa",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Trò A, Xã Tà Xùa, Sơn La",
    "phone": "0358438546",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 48,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Estopa Retreat Tà Xùa là một trạm dừng chân mang phong cách mộc mạc, giản dị và thấm đẫm hơi thở văn hóa vùng cao, tọa lạc yên bình ngay bên trong một bản làng địa phương nguyên bản. Estopa Retreat mở ra một lối đi riêng — nơi du khách được thực sự hòa mình vào nhịp sống chậm rãi, bình dị của đồng bào người Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780772972-201309.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780772972-201309.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780773837-426088.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780774607-765634.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861261076-fbed0926-fd90-4ca0-83e1-8a448a17952c.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595961687-cbacba42-6906-4682-beef-586aacfb4a59.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236035436-727228.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-25",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3236,
      "lng": 104.4751
    },
    "stats": {
      "views": 3240,
      "callClicks": 428,
      "bookingsCount": 131
    },
    "roomTypes": [
      {
        "id": "rm-24-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780773837-426088.jpg.w1080.webp"
      },
      {
        "id": "rm-24-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780774607-765634.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-26",
    "title": "Thác Mây Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0586111586",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 55,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673351020-545007.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673351020-545007.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673346930-317802.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673348184-275580.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673349374-615936.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673350260-195648.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673351868-167646.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-26",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32335,
      "lng": 104.4751
    },
    "stats": {
      "views": 3325,
      "callClicks": 440,
      "bookingsCount": 135
    },
    "roomTypes": [
      {
        "id": "rm-25-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673346930-317802.jpg.w1080.webp"
      },
      {
        "id": "rm-25-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783673348184-275580.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-27",
    "title": "Nhà Dà Homestay Tà Xùa",
    "category": "homestay",
    "area": "Mống Vàng",
    "address": "Bản Mống Vàng, xã Tà Xùa, Bắc Yên,Sơn La",
    "phone": "0328763166",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 62,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Dà Homestay là một điểm dừng chân mang phong cách đậm chất bản địa, hoang sơ và bình dị tọa lạc tại bản Mống Vàng — một trong những khu vực giữ được nét đẹp nguyên bản, yên bình và tách biệt khỏi sự ồn ào tại Tà Xùa. Nơi đây tựa như một nếp nhà ẩn mình giữa lưng chừng núi, mang lại không gian tĩnh lặng tuyệt đối để bạn tìm về với sự thư thái, thong thả ngắm nhìn từng dải sương mờ dâng cao mỗi sớm mai.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607922241-262702.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607922241-262702.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607923478-756565.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607924488-716619.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607925509-80652.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607926399-22994.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607927246-952306.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607928149-343136.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607929222-631591.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-27",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Mống Vàng"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.33825,
      "lng": 104.5015
    },
    "stats": {
      "views": 3410,
      "callClicks": 452,
      "bookingsCount": 139
    },
    "roomTypes": [
      {
        "id": "rm-26-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607923478-756565.jpg.w1080.webp"
      },
      {
        "id": "rm-26-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607924488-716619.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-28",
    "title": "Tà Xùa Hills",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa, Xã Bắc Yên, Tỉnh Sơn La",
    "phone": "0969868484",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 69,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Hills Homestay là một trong những điểm dừng chân quen thuộc, mang đậm phong cách thô mộc, bình dị và tràn ngập hơi thở của núi rừng Tây Bắc. Nằm nép mình bên triền đồi hoang sơ , homestay sở hữu những căn nhà gỗ nhỏ xinh mang tone màu trầm ấm, kết hợp hài hòa cùng khoảng sân hiên rộng mở hướng thẳng ra cảnh sắc đại ngàn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609812834-795603.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609812834-795603.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609809844-753779.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609810870-895730.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609811631-456376.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609813770-437201.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609815015-604496.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609815768-762638.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609816669-275099.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-28",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24294,
      "lng": 104.4266
    },
    "stats": {
      "views": 3495,
      "callClicks": 464,
      "bookingsCount": 143
    },
    "roomTypes": [
      {
        "id": "rm-27-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609809844-753779.jpg.w1080.webp"
      },
      {
        "id": "rm-27-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783609810870-895730.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-29",
    "title": "Khèn Coffee House",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió · Làng Chếu, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0567276666",
    "zalo": "0869111294",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 76,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Khèn House Tà Xùa là một trong những điểm dừng chân đầy lôi cuốn dành cho những ai muốn bắt trọn khoảnh khắc kỳ vĩ nhất của thiên nhiên Tây Bắc. Tọa lạc bên triền đồi với góc nhìn khoáng đạt, nơi đây được biết đến là tọa độ ngắm hiện tượng &quot;Thác Mây&quot; vô cùng lý tưởng — nơi bạn có thể tận mắt chứng kiến những dải mây trắng muốt đổ tràn qua khe núi rực rỡ như một dòng thác cạn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482200058-352715.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482200058-352715.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482201217-308524.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482201836-154432.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482202736-174458.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482203590-716298.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482204432-622183.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482205185-373858.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482205981-494145.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-29",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32705,
      "lng": 104.4816
    },
    "stats": {
      "views": 3580,
      "callClicks": 476,
      "bookingsCount": 147
    },
    "roomTypes": [
      {
        "id": "rm-28-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482201217-308524.jpg.w1080.webp"
      },
      {
        "id": "rm-28-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783482201836-154432.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-30",
    "title": "Pê Lu Chế Homestay - Nhà chúng mình",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió · Háng Đồng, Sơn La, Việt Nam",
    "phone": "0902298868",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.98,
    "reviewCount": 83,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Pê Lu Chế — Nhà Chúng Mình là một điểm dừng chân bình dị dành cho những ai muốn tìm kiếm một không gian lưu trú mộc mạc và gần gũi tại Tà Xùa. Nằm khép mình bên triền đồi sương mờ, homestay mở ra một chốn về nhẹ nhàng, nơi ranh giới giữa chủ và khách hoàn toàn bị xóa nhòa. Nơi đây mang đến một lối sống chậm đích thực, đem lại cảm giác thân thương như người nhà cho du khách — tọa độ lý tưởng để bạn hoàn toàn được thả lỏng cơ thể, thong thả ngồi bên hiên nhà nhâm nhi tách trà nóng và ngắm nhìn dải mây bồng bềnh cuộn sóng mỗi sớm mai.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503681159-214398.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503681159-214398.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503678301-78048.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503679277-769376.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503679874-860085.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276473094-899077.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-30",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32843,
      "lng": 104.47588
    },
    "stats": {
      "views": 3665,
      "callClicks": 488,
      "bookingsCount": 151
    },
    "roomTypes": [
      {
        "id": "rm-29-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503678301-78048.jpg.w1080.webp"
      },
      {
        "id": "rm-29-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783503679277-769376.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-31",
    "title": "Sunset Clouds Tà Xùa",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Chung Trinh, Xã Tà Xùa, Sơn La",
    "phone": "0986275494",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 90,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Sunset Clouds Tà Xùa là một chốn dừng chân đầy lãng mạn và mộng mơ dành cho những ai muốn bắt trọn từng khoảnh khắc diệu kỳ của thiên nhiên vùng cao. Điểm đắt giá nhất tại đây chính là thiết kế những căn phòng ngủ sở hữu hệ thống vách kính full tràn viền vô cùng khoáng đạt. Lối kiến trúc mở này giúp không gian bên trong luôn ngập tràn ánh nắng ấm áp mỗi sớm mai, đồng thời xóa nhòa mọi ranh giới với tự nhiên mang đến một trải nghiệm đầy cảm xúc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081390-671086.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081390-671086.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504080175-563945.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081930-13598.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504082408-817030.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504082893-373650.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504083567-682650.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504084170-934254.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504084769-584025.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-31",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31797,
      "lng": 104.47399
    },
    "stats": {
      "views": 3750,
      "callClicks": 500,
      "bookingsCount": 155
    },
    "roomTypes": [
      {
        "id": "rm-30-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504080175-563945.jpg.w1080.webp"
      },
      {
        "id": "rm-30-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081930-13598.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-32",
    "title": "Xìu Home Tà Xùa",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Chung Trinh, Xã Tà Xùa, Sơn La",
    "phone": "0848098888",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.82,
    "reviewCount": 97,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Xìu Home Tà Xùa là một điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm một chốn trú ẩn thực sự yên bình, tĩnh lặng và đề cao sự tự do trong hành trình trốn phố. Homestay gây ấn tượng bởi thiết kế theo mô hình các căn nhà riêng, hộp nhà riêng biệt mang lại một không gian lưu trú vô cùng thoáng đãng và ngập tràn hơi thở tự nhiên.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523453216-183331.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523453216-183331.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523454260-228283.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523455026-785758.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523455804-226804.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523456552-779937.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523457314-403384.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523458066-540329.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523458654-97476.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-32",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3245,
      "lng": 104.47075
    },
    "stats": {
      "views": 3835,
      "callClicks": 512,
      "bookingsCount": 159
    },
    "roomTypes": [
      {
        "id": "rm-31-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523454260-228283.jpg.w1080.webp"
      },
      {
        "id": "rm-31-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783523455026-785758.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-33",
    "title": "Bảo Ngọc Homestay Travel",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0965858988",
    "zalo": "0965858988",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.94,
    "reviewCount": 104,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Bảo Ngọc Homestay Travel là một điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm một không gian lưu trú thoải mái, bình yên, đồng thời mong muốn có sự hỗ trợ trọn gói cho hành trình khám phá Tà Xùa. Sở hữu vị trí khoáng đạt hướng thẳng ra núi đồi trùng điệp, homestay mang đến một không gian nghỉ dưỡng vô cùng dễ chịu và ngập tràn ánh sáng tự nhiên qua hệ thống cửa sổ lớn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415420233-84613.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415420233-84613.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415416933-613486.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415418095-57945.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415418846-994476.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415419665-152906.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782635791580-187280.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-33",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24209,
      "lng": 104.43043
    },
    "stats": {
      "views": 3920,
      "callClicks": 524,
      "bookingsCount": 163
    },
    "roomTypes": [
      {
        "id": "rm-32-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415416933-613486.jpg.w1080.webp"
      },
      {
        "id": "rm-32-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783415418095-57945.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-34",
    "title": "thong dong retreat",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Xím Vàng, Xã Xím Vàng, Sơn La",
    "phone": "0949998298",
    "zalo": "0949998298",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.76,
    "reviewCount": 111,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Thong dong retreat mang đến cho bạn trải nghiệm cắm trại giữa núi rừng Tây Bắc, cuộc sống của người dân bản địa, bạn có thể hòa mình vào thiên nhiên. Đêm đến đây là một địa điểm săn milky way cực kì độc đáo,với tầm nhìn rộng lớn, bao quát cả màn đêm lấp lánh, thu trọn cả bầu trời sao vào tầm mắt, đẹp như một bức họa kì công",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434421185-263238.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434421185-263238.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434421926-979223.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434422662-582721.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434423704-636078.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793861261076-fbed0926-fd90-4ca0-83e1-8a448a17952c.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793595961687-cbacba42-6906-4682-beef-586aacfb4a59.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781236035436-727228.png.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-34",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32243,
      "lng": 104.47241
    },
    "stats": {
      "views": 4005,
      "callClicks": 536,
      "bookingsCount": 167
    },
    "roomTypes": [
      {
        "id": "rm-33-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434421926-979223.jpg.w1080.webp"
      },
      {
        "id": "rm-33-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434422662-582721.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-35",
    "title": "Gạo Tà Xùa Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0973235604",
    "zalo": "0973235604",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 118,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Gạo Tà Xùa Homestay là một tọa độ nghỉ dưỡng lý tưởng dành cho những ai muốn tìm kiếm sự thuận tiện, thoải mái và trọn vẹn tiện ích trong hành trình khám phá thiên đường mây. Tọa lạc ngay tại khu vực trung tâm xã Tà Xùa, homestay mở ra một không gian lưu trú vô cùng thoáng đãng, ngập tràn ánh sáng tự nhiên với hệ thống phòng ốc sạch sẽ, tinh tươm. Nơi đây mang lại một cảm giác thư thái và an nhiên tuyệt đối — một trạm dừng chân hoàn hảo để bạn thả lỏng cơ thể sau chặng đường dài, thong thả ngắm nhìn sắc trời vùng cao và dễ dàng kết nối với nhịp sống bản địa xung quanh.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434999105-407533.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434999105-407533.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434998181-63581.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434999990-108515.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435000954-337667.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435001964-967185.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435002800-767793.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435003636-219657.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435004529-802703.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-35",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24548,
      "lng": 104.42877
    },
    "stats": {
      "views": 4090,
      "callClicks": 548,
      "bookingsCount": 171
    },
    "roomTypes": [
      {
        "id": "rm-34-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434998181-63581.jpg.w1080.webp"
      },
      {
        "id": "rm-34-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783434999990-108515.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-36",
    "title": "Homestay Gió Bản",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0986072128",
    "zalo": "0986072128",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 125,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Gió Bản Homestay là một điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm một trải nghiệm trốn phố trọn vẹn, thuận tiện và đong đầy cảm xúc tại thiên đường mây Tà Xùa. Nơi đây khéo léo thiết kế một tổ hợp tiện ích hoàn hảo ngay bên triền núi khoáng đạt, xóa tan mọi lo lắng về việc phải di chuyển xa trong sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435606236-595957.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435606236-595957.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435601825-530546.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435603200-819115.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435603955-32646.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435604611-622549.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435605352-465673.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435606828-613679.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435607341-569218.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-36",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24276,
      "lng": 104.43198
    },
    "stats": {
      "views": 4175,
      "callClicks": 560,
      "bookingsCount": 175
    },
    "roomTypes": [
      {
        "id": "rm-35-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435601825-530546.jpg.w1080.webp"
      },
      {
        "id": "rm-35-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783435603200-819115.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-37",
    "title": "Tà Xùa Mây Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0337219848",
    "zalo": "0337219848",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 132,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mây Homestay Tà Xùa là một trong những điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm sự thuận tiện, dễ dàng trong di chuyển nhưng vẫn giữ trọn trải nghiệm sống chậm bình yên vùng cao. Tọa lạc ngay tại khu vực trung tâm xã Tà Xùa, homestay mở ra một không gian lưu trú vô cùng thoáng đãng với lối bài trí mộc mạc, khép mình đầy tinh tế sau những dải sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437263188-882970.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437263188-882970.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437264125-625578.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437264743-41534.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437265363-860383.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437266093-839203.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437266882-60843.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437268133-513013.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437268997-477497.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-37",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24832,
      "lng": 104.42739
    },
    "stats": {
      "views": 4260,
      "callClicks": 572,
      "bookingsCount": 179
    },
    "roomTypes": [
      {
        "id": "rm-36-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437264125-625578.jpg.w1080.webp"
      },
      {
        "id": "rm-36-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437264743-41534.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-38",
    "title": "Mây Mơ Màng Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0367026666",
    "zalo": "0367026666",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.84,
    "reviewCount": 139,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mây Mơ Màng Homestay là một điểm dừng chân vô cùng thơ mộng, ngọt ngào và ngập tràn sắc màu thiên nhiên dành cho hành trình khám phá vùng cao của bạn. Tọa lạc ngay tại khu vực trung tâm xã Tà Xùa thuận tiện, homestay mở ra một thế giới bình yên khép mình sau những dải sương mờ. Đúng như tên gọi đầy chất thơ, nơi đây sở hữu một khuôn viên siêu xinh được tô điểm bởi những khóm hoa hồng rực rỡ và các loài cây xanh mướt, mang lại bầu không khí trong lành, thoáng mát và siêu đẹp.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438027957-358842.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438027957-358842.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438020017-590822.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438021400-360782.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438022280-353886.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438022849-116202.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438023574-535762.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438024257-145114.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438025037-774142.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-38",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.2416,
      "lng": 104.43309
    },
    "stats": {
      "views": 4345,
      "callClicks": 584,
      "bookingsCount": 183
    },
    "roomTypes": [
      {
        "id": "rm-37-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438020017-590822.jpg.w1080.webp"
      },
      {
        "id": "rm-37-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438021400-360782.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-39",
    "title": "A Tủa Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0398816001",
    "zalo": "0398816001",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 146,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "A Tủa Homestay là một điểm dừng chân đầy ấn tượng và mộng mơ dành cho những ai muốn hiện thực hóa giấc mơ được ngủ lơ lửng giữa thiên đường mây sương. Điểm đắt giá và độc đáo nhất tại đây chính là thiết kế những căn bungalow sở hữu tới 3 mặt kính full tràn viền từ sàn đến trần. Lối kiến trúc mở khoáng đạt này hoàn toàn xóa nhòa mọi ranh giới với tự nhiên, mang lại một trải nghiệm độc bản đầy cảm xúc — nơi bạn chỉ cần nhẹ nhàng mở mắt sau một giấc ngủ dài là đã thấy cả một đại dương mây bồng bềnh cuộn sóng lướt ngay trước mắt, mang lại cảm giác thư thái và an nhiên tuyệt đối.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438570244-965892.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438570244-965892.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438566951-957951.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438567995-298991.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438568641-417921.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438569539-838615.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438571049-654357.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438571780-264923.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438572626-584428.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-39",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24744,
      "lng": 104.4266
    },
    "stats": {
      "views": 4430,
      "callClicks": 596,
      "bookingsCount": 187
    },
    "roomTypes": [
      {
        "id": "rm-38-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438566951-957951.jpg.w1080.webp"
      },
      {
        "id": "rm-38-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783438567995-298991.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-40",
    "title": "Phỏng Lài Mountain Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0941793789",
    "zalo": "0941793789",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 153,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Phỏng Lài Mountain Homestay tựa như một bức tranh nghệ thuật đầy ấn tượng, mang phong cách kiến trúc độc bản kết hợp hài hòa giữa nét thô mộc của gỗ đá vùng cao và các chi tiết decor phá cách, thời thượng. Mỗi căn phòng tại đây đều sở hữu những ô cửa kính lớn hướng thẳng ra thung lũng sâu, giúp du khách dễ dàng bắt trọn khoảnh khắc đại dương mây bồng bềnh cuộn sóng và những vệt nắng bình minh rực rỡ ngay từ giường ngủ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067542501-603643.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067542501-603643.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067543172-310571.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067543903-463687.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067544650-322701.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067545690-433848.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067546358-560825.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067547084-229307.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067547928-885169.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-40",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24426,
      "lng": 104.4335
    },
    "stats": {
      "views": 4515,
      "callClicks": 608,
      "bookingsCount": 191
    },
    "roomTypes": [
      {
        "id": "rm-39-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067543172-310571.jpg.w1080.webp"
      },
      {
        "id": "rm-39-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067543903-463687.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-41",
    "title": "LAO XAN Boutique Stay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0988289535",
    "zalo": "0988289535",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 160,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "LAO XAN Boutique Stay là một chốn dừng chân đầy nghệ thuật dành cho những tâm hồn muốn tìm kiếm sự thư thái, bình yên và một không gian lưu trú thực sự có gu tại Tà Xùa. Mang đậm tinh thần &quot;Boutique&quot;, nơi đây ghi điểm bởi phong cách thiết kế tinh tế, tỉ mỉ và ngập tràn hơi thở bản địa đương đại.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072257056-300715.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072257056-300715.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072250308-849297.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072251127-757371.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072251898-959127.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072252972-904613.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072253806-249318.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072254601-640332.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072255304-999214.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-41",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24382,
      "lng": 104.4266
    },
    "stats": {
      "views": 4600,
      "callClicks": 620,
      "bookingsCount": 195
    },
    "roomTypes": [
      {
        "id": "rm-40-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072250308-849297.jpg.w1080.webp"
      },
      {
        "id": "rm-40-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783072251127-757371.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-42",
    "title": "Happy Town Tà Xùa - Thị Trấn Vui Vẻ",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0355303689",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 167,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Happy Town Tà Xùa là một điểm dừng chân mang phong cách vô cùng bình yên, trong lành và tràn ngập hơi thở của thiên nhiên đại ngàn. Nằm ẩn mình một cách đầy tinh tế ngay trong lòng khu rừng Sơn Tra (táo mèo) đặc trưng của vùng cao, homestay mở ra một không gian lưu trú vô cùng thoáng đãng, nơi du khách có thể hoàn toàn tách biệt khỏi những lo toan thường nhật.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091376005-787987.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091376005-787987.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091374085-712390.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091374796-287697.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091375324-358383.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091376501-4079.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091377024-305530.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091377632-803667.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091378227-457655.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-42",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32955,
      "lng": 104.4816
    },
    "stats": {
      "views": 4685,
      "callClicks": 632,
      "bookingsCount": 199
    },
    "roomTypes": [
      {
        "id": "rm-41-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091374085-712390.jpg.w1080.webp"
      },
      {
        "id": "rm-41-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783091374796-287697.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-43",
    "title": "Homestay Vân Sơn Lâm",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0911777848",
    "zalo": "0386756534",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 174,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Homestay Vân Sơn Lâm là một trong những điểm dừng chân mang phong cách kiến trúc mộc mạc, bình dị và đậm chất hoang sơ của núi rừng Sơn La tại Tà Xùa. Nép mình bên triền đồi với tầm nhìn khoáng đạt, homestay sở hữu những căn nhà bằng chất liệu gỗ tự nhiên mang tone màu trầm ấm, kết hợp cùng khoảng sân hiên rộng thoáng hướng thẳng ra thung lũng sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896773424-832632.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896773424-832632.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896774173-251.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896775189-16462.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896776021-518069.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896776555-152032.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896777497-884848.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896778221-55140.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896779027-342132.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-43",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31152,
      "lng": 104.45937
    },
    "stats": {
      "views": 4770,
      "callClicks": 644,
      "bookingsCount": 203
    },
    "roomTypes": [
      {
        "id": "rm-42-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896774173-251.jpg.w1080.webp"
      },
      {
        "id": "rm-42-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782896775189-16462.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-44",
    "title": "Tà Xùa Haus Meej Homestay",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0355303689",
    "zalo": "0355303689",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 31,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Haus Meej Homestay là một điểm dừng chân mang phong cách vô cùng tươi mới, nhẹ nhàng và tràn đầy năng lượng cho hành trình trốn phố của bạn. Nằm nép mình bên triền đồi hoang sơ , homestay khéo léo kết hợp giữa lối kiến trúc nhà gỗ mộc mạc của đồng bào bản địa với những gam màu sắc tươi sáng, rực rỡ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897780410-950031.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897780410-950031.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897776398-294758.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897777207-926411.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897778021-762118.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897778902-195123.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897779380-937657.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897779863-847289.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897781118-622168.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-44",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32995,
      "lng": 104.4805
    },
    "stats": {
      "views": 4855,
      "callClicks": 656,
      "bookingsCount": 207
    },
    "roomTypes": [
      {
        "id": "rm-43-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897776398-294758.jpg.w1080.webp"
      },
      {
        "id": "rm-43-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782897777207-926411.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-45",
    "title": "Sóc nâu Homestay",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trung Tâm · Bản Tà Xùa, Xã Tà Xùa, Sơn La, Việt Nam",
    "phone": "0372582888",
    "zalo": "0372582888",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.98,
    "reviewCount": 38,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Sóc Nâu Homestay là điểm dừng chân lý tưởng dành cho những tâm hồn xê dịch đang tìm kiếm một không gian sống chậm vừa mộc mạc, vừa tràn đầy hơi thở trẻ trung tại Tà Xùa. Nép mình bên triền đồi với thiết kế nhà gỗ mang tone màu trầm ấm, homestay ghi điểm tuyệt đối nhờ khoảng không gian trước mặt mở ra cả một đại dương mây bồng bềnh cuộn sóng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899104609-597410.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899104609-597410.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899102798-620298.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899103914-761480.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899105222-103137.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899106044-850082.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899106821-377374.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899107509-931068.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899108023-396785.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-45",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31913,
      "lng": 104.47075
    },
    "stats": {
      "views": 4940,
      "callClicks": 668,
      "bookingsCount": 211
    },
    "roomTypes": [
      {
        "id": "rm-44-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899102798-620298.jpg.w1080.webp"
      },
      {
        "id": "rm-44-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782899103914-761480.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-46",
    "title": "A Lầu Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0989957898",
    "zalo": "0989957898",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 45,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833551581-159748.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833551581-159748.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833534657-50076.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833536754-245355.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833537474-489472.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833538298-650157.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833538869-99231.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833549285-408012.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833550797-471737.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-46",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24502,
      "lng": 104.43043
    },
    "stats": {
      "views": 5025,
      "callClicks": 680,
      "bookingsCount": 215
    },
    "roomTypes": [
      {
        "id": "rm-45-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833534657-50076.jpg.w1080.webp"
      },
      {
        "id": "rm-45-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833536754-245355.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-47",
    "title": "Lux House Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Đường Bản Mây, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0815169696",
    "zalo": "0815169696",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.82,
    "reviewCount": 52,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Lux House Tà Xùa là điểm dừng chân lý tưởng dành cho những ai yêu thích vẻ đẹp thô mộc, bình yên của những căn nhà gỗ vùng cao. Nép mình bên triền đồi, homestay mang đến không gian lưu trú ấm cúng, kín gió với khoảng ban công rộng hướng thẳng xuống thung lũng sâu. Đây là toạ độ tuyệt vời để bạn vừa nhâm nhi tách trà nóng, vừa thu trọn cả đại dương mây bồng bềnh cuộn sóng ngay dưới chân.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616723989-864385.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616723989-864385.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616710415-665039.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616711147-296152.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616712015-409390.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616712738-950287.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616713403-395503.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616714054-570257.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616714707-212592.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-47",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24684,
      "lng": 104.43041
    },
    "stats": {
      "views": 5110,
      "callClicks": 692,
      "bookingsCount": 219
    },
    "roomTypes": [
      {
        "id": "rm-46-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616710415-665039.jpg.w1080.webp"
      },
      {
        "id": "rm-46-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782616711147-296152.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-48",
    "title": "Nhà Bên suối Retreat - Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0963970106",
    "zalo": "0963970106",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.94,
    "reviewCount": 59,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Bên Suối Retreat là một mảnh ghép vô cùng độc đáo tại Tà Xùa khi lựa chọn vị trí nép mình bên một dòng suối nhỏ nguyên sơ và thơ mộng. Lấy cảm hứng từ những nếp nhà gỗ vùng cao thô mộc, retreat mang đến một không gian lưu trú tràn ngập hương cỏ cây, tiếng nước chảy róc rách và sự an nhiên tuyệt đối. Đây là trạm dừng chân hoàn hảo để bạn tạm lánh xa những xô bồ phố thị, lắng lòng mình lại để lắng nghe hơi thở bản địa và chạm vào sự bình yên nguyên bản nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782618664904-658144.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782618664904-658144.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617506453-94857.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617507676-704041.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617508534-995762.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617509450-58041.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617510272-625908.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617511101-306044.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617512163-60202.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-48",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24186,
      "lng": 104.42877
    },
    "stats": {
      "views": 5195,
      "callClicks": 704,
      "bookingsCount": 223
    },
    "roomTypes": [
      {
        "id": "rm-47-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617506453-94857.jpg.w1080.webp"
      },
      {
        "id": "rm-47-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782617507676-704041.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-49",
    "title": "Homestay A Của - Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0812280333",
    "zalo": "0812280333",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.76,
    "reviewCount": 66,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "A Của Homestay là một điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm một không gian lưu trú mộc mạc, bình yên và gần gũi với cuộc sống bản địa tại Tà Xùa. Homestay sở hữu thiết kế nhà gỗ thô mộc mang tone màu trầm ấm, nép mình bên triền đồi hoang sơ. Đây là toạ độ tuyệt vời để bạn tạm lánh xa những xô bồ phố thị, thong thả ngồi bên hiên nhà uống tách trà nóng và bắt trọn đại dương mây bồng bềnh cuộn sóng ngay dưới chân.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619295412-20437.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619295412-20437.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619289816-992907.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619290818-948843.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619291934-348803.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619292468-533152.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619292984-592593.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619293420-372394.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619293976-466674.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-49",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24848,
      "lng": 104.43198
    },
    "stats": {
      "views": 5280,
      "callClicks": 716,
      "bookingsCount": 227
    },
    "roomTypes": [
      {
        "id": "rm-48-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619289816-992907.jpg.w1080.webp"
      },
      {
        "id": "rm-48-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619290818-948843.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-50",
    "title": "À Lôi Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0343881819",
    "zalo": "0343881819",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 73,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "À Lôi Homestay là điểm dừng chân hoàn hảo cho những ai muốn tìm kiếm một trải nghiệm lưu trú đơn giản, thuần túy và gần gũi với cuộc sống vùng cao tại Tà Xùa. Homestay giữ nguyên phong cách bản địa mộc mạc với nếp nhà gỗ thô sơ, mang tone màu trầm ấm. Đây là tọa độ lý tưởng để bạn hoàn toàn sống chậm, thong thả ngồi bên hiên nhà nhâm nhi tách trà ấm và tận hưởng bầu không khí an nhiên, tĩnh lặng giữa đại ngàn sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619646975-147831.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619646975-147831.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619642807-348081.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619643836-299815.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619644359-941892.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619645148-719293.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619645840-414797.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619646475-282229.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-50",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24223,
      "lng": 104.42739
    },
    "stats": {
      "views": 5365,
      "callClicks": 728,
      "bookingsCount": 231
    },
    "roomTypes": [
      {
        "id": "rm-49-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619642807-348081.jpg.w1080.webp"
      },
      {
        "id": "rm-49-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782619643836-299815.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-51",
    "title": "Rêu homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0946525979",
    "zalo": "0946525979",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 80,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Rêu homestay ẩn mình đầy tinh tế dưới hình hài của một nếp nhà gỗ thô mộc mang tone màu trầm ấm và hơi thở nguyên bản của vùng cao Tây Bắc. Nơi đây mở ra một không gian sống chậm đích thực, nơi mỗi sớm mai thức giấc, bạn chỉ cần thong thả tựa lưng bên hiên nhà, nhâm nhi tách trà ấm và để tâm hồn mình tan ra giữa đại ngàn sương mờ tĩnh lặng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620107385-976341.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620107385-976341.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620105583-126419.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620106395-171791.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620108454-775108.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620109157-422933.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620109887-910707.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-51",
    "tags": [
      "Có ăn uống",
      "Gia đình",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24621,
      "lng": 104.43309
    },
    "stats": {
      "views": 5450,
      "callClicks": 740,
      "bookingsCount": 235
    },
    "roomTypes": [
      {
        "id": "rm-50-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620105583-126419.jpg.w1080.webp"
      },
      {
        "id": "rm-50-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620106395-171791.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-52",
    "title": "Homestay Tà Xùa Đan Huyền",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long · Bản chống tra, xã háng đồng, huyện bắc yên , Son La, Vietnam",
    "phone": "0355664776",
    "zalo": "0355664776",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 87,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Homestay Tà Xùa Đan Huyền - lựa chọn lối thiết kế khép mình đầy giản dị bên triền đồi, homestay mang đậm phong cách kiến trúc mộc mạc của đồng bào dân tộc bản địa với nếp nhà gỗ mang tone màu trầm ấm. Nơi đây mở ra một không gian sống chậm đích thực, đưa bạn rời xa những xô bồ phố thị để lắng lòng mình lại, thưởng thức tách trà nóng bên hiên nhà và tận hưởng sự an nhiên tĩnh lặng giữa đại ngàn sương m",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620417076-240079.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620417076-240079.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620418357-576460.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620419071-52786.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620419846-165465.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620420700-519273.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620421518-313076.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783780451701-680625.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-52",
    "tags": [
      "Chỗ đỗ xe",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36571,
      "lng": 104.5386
    },
    "stats": {
      "views": 5535,
      "callClicks": 752,
      "bookingsCount": 239
    },
    "roomTypes": [
      {
        "id": "rm-51-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620418357-576460.jpg.w1080.webp"
      },
      {
        "id": "rm-51-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782620419071-52786.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-53",
    "title": "Là Nhà Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0978753358",
    "zalo": "0978753358",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.84,
    "reviewCount": 94,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Là Nhà Homestay là điểm dừng chân lý tưởng dành cho những ai muốn tìm kiếm một không gian lưu trú mộc mạc, gần gũi và ngập tràn hơi thở ấm áp của gia đình giữa lòng Tà Xùa sương mờ. Homestay sở hữu những căn nhà gỗ nhỏ xinh với tone màu trầm ấm, kết hợp hài hòa cùng những ô cửa kính lớn hướng thẳng ra khoảng không bao la của núi đồi.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535214802-944290.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535214802-944290.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535211928-574723.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535213141-81752.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535213904-930901.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535215783-936036.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535216639-89301.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535217348-337492.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-53",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24258,
      "lng": 104.4335
    },
    "stats": {
      "views": 5620,
      "callClicks": 764,
      "bookingsCount": 243
    },
    "roomTypes": [
      {
        "id": "rm-52-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535211928-574723.jpg.w1080.webp"
      },
      {
        "id": "rm-52-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782535213141-81752.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-54",
    "title": "Lofi Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0336604158",
    "zalo": "0336604158",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 101,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Lofi Homestay là một điểm dừng chân mang phong cách nhẹ nhàng, mộc mạc và ngập tràn giai điệu thư thái giữa thiên đường mây Tà Xùa. Lối thiết kế và bài trí tại đây mang lại một trải nghiệm thị giác vô cùng mãn nhãn: những khung cửa mở rộng đón trọn vẹn ánh sáng tự nhiên, kết hợp hài hòa cùng sắc xanh mướt mát của cây cỏ vây quanh — tựa như đang được thong thả ẩn mình, dạo chơi và lạc lối giữa một khu rừng nguyên sinh ngập nắng, nơi chỉ cần phóng tầm mắt ra xa là đã có thể chạm tay vào đại dương mây bồng bềnh.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463184353-373326.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463184353-373326.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463185878-155777.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463186720-455095.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463187532-943245.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463188571-812721.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463189199-239453.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463190182-453096.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463190901-632515.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-54",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24839,
      "lng": 104.4266
    },
    "stats": {
      "views": 5705,
      "callClicks": 776,
      "bookingsCount": 247
    },
    "roomTypes": [
      {
        "id": "rm-53-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463185878-155777.jpg.w1080.webp"
      },
      {
        "id": "rm-53-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782463186720-455095.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-55",
    "title": "Homestay Emerald Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0963332699",
    "zalo": "0963332699",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 108,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Emerald Homestay Tà Xùa là một điểm dừng chân mang phong cách lãng mạn, mộc mạc và đầy chất thơ, nổi bật với thiết kế phòng ngủ dạng &quot;hộp kính&quot; độc đáo sở hữu hai mặt vách kính kịch trần góc rộng. Với tầm view ôm trọn 180 độ ra thung lũng sâu, homestay mở ra một không gian khoáng đạt ngoạn mục, nơi du khách có thể ngắm nhìn toàn cảnh những dãy núi trùng điệp vắt ngang trời và một bản làng vùng cao thanh bình với những mái nhà nhấp nhô nép mình bên triền đồi xanh mướt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488873173-657199.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488873173-657199.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488874023-918863.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488874872-958936.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488889464-803948.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488890300-754437.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488891020-739977.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783068919428-947967.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-10/1793462645347-82289a38-6352-4a73-8b1e-70891ebb690b.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-55",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24167,
      "lng": 104.43311
    },
    "stats": {
      "views": 5790,
      "callClicks": 788,
      "bookingsCount": 251
    },
    "roomTypes": [
      {
        "id": "rm-54-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488874023-918863.jpg.w1080.webp"
      },
      {
        "id": "rm-54-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782488874872-958936.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-56",
    "title": "Mùa Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0989375677",
    "zalo": "0989375677",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 115,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mùa Homestay là một điểm dừng chân mang phong cách thô mộc, bình yên và tràn ngập hơi thở của núi rừng Tây Bắc tại Tà Xùa. Đúng như cái tên gọi gợi nhớ về những mùa mây bồng bềnh, homestay sở hữu những căn nhà gỗ nhỏ xinh với mái lợp giản dị, nép mình bên triền đồi hoang sơ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492289169-700999.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492289169-700999.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492277936-824813.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492278610-451336.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492279324-517021.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492280102-782365.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492280803-391973.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492281544-448408.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492282194-267824.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-56",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24726,
      "lng": 104.42737
    },
    "stats": {
      "views": 5875,
      "callClicks": 800,
      "bookingsCount": 255
    },
    "roomTypes": [
      {
        "id": "rm-55-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492277936-824813.jpg.w1080.webp"
      },
      {
        "id": "rm-55-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492278610-451336.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-57",
    "title": "Homestay Thảo Nguyên Tà Xùa",
    "category": "homestay",
    "area": "Thảo Nguyên",
    "address": "Khu vực khác · Thảo Nguyên Tà Xùa, Sơn La",
    "phone": "0363026808",
    "zalo": "0363026808",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 122,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Homestay Thảo Nguyên là một điểm dừng chân mang phong cách thô mộc, khoáng đạt và cực kỳ gần gũi với tự nhiên tại thiên đường mây Tà Xùa. Đúng như tên gọi của mình, homestay mở ra một không gian tự do tuyệt đối nhờ vị trí nép mình bên những triền đồi cỏ xanh trải dài, nơi ranh giới giữa mặt đất, đồng cỏ và mây trời như hòa làm một. Với lối kiến trúc sử dụng chất liệu gỗ tự nhiên ấm cúng làm chủ đạo, Homestay Thảo Nguyên mang lại cảm giác bình dị, thân thuộc — góc lý tưởng để bạn rũ bỏ mọi lo toan, thong thả ngồi bên hiên nhà đón những làn gió mát lành và ngắm nhìn biển mây bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490023734-937838.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490023734-937838.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490024844-246434.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490025844-232832.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490026658-224276.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490027314-111177.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490028291-196846.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490029115-498994.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490029697-319250.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-57",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Thảo Nguyên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.35149,
      "lng": 104.457
    },
    "stats": {
      "views": 5960,
      "callClicks": 812,
      "bookingsCount": 259
    },
    "roomTypes": [
      {
        "id": "rm-56-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490024844-246434.jpg.w1080.webp"
      },
      {
        "id": "rm-56-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490025844-232832.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-58",
    "title": "An Phú Homestay tà xùa",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Tà Xùa, Xã Tà Xùa, Sơn La, Việt Nam",
    "phone": "0986888446",
    "zalo": "0986888446",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 129,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "An Phú Homestay là một trong những điểm dừng chân quen thuộc và cực kỳ được lòng du khách khi đến với thiên đường mây Tà Xùa. Sở hữu lối thiết kế hài hòa giữa nét mộc mạc của gỗ và sự chỉn chu, hiện đại, homestay mang đến một không gian lưu trú ấm cúng, dễ chịu giữa lòng bản cao. Nằm ở vị trí có tầm nhìn thoáng đãng hướng thẳng ra thung lũng, An Phú tựa như một trạm dừng chân lý tưởng để bạn trốn khỏi những xô bồ của phố thị, thong thả tựa lưng bên hiên cửa và cảm nhận từng dải mây trắng bồng bềnh lướt qua ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490527658-308335.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490527658-308335.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490521870-578975.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490522806-687913.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490523481-577141.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490524626-301723.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490525152-98403.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490525779-785257.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490526391-180223.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-58",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31959,
      "lng": 104.47075
    },
    "stats": {
      "views": 6045,
      "callClicks": 824,
      "bookingsCount": 263
    },
    "roomTypes": [
      {
        "id": "rm-57-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490521870-578975.jpg.w1080.webp"
      },
      {
        "id": "rm-57-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782490522806-687913.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-59",
    "title": "Money House Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0332336099",
    "zalo": "0377428279",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 136,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Money House Tà Xùa là một điểm lưu trú vô cùng độc đáo, dễ thương và tràn đầy năng lượng tươi mới dành cho các tín đồ mê xê dịch. Khác biệt với những homestay truyền thống, nơi đây đốn tim du khách bởi sự xuất hiện của những chú mèo &quot;meo meo&quot; siêu cute, quấn người và sẵn sàng làm bạn đồng hành cùng bạn trong suốt chuyến đi. Không gian tại Money House được quy hoạch chỉn chu, tích hợp đầy đủ tiện ích từ lưu trú đến ẩm thực, mang lại một trải nghiệm nghỉ dưỡng thong thả và trọn vẹn tuyệt đối giữa lòng bản mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491311114-498986.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491311114-498986.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491308031-353507.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491308891-691630.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491309663-936885.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491310410-570229.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491311732-933057.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491312323-447934.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491312807-699164.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-59",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24789,
      "lng": 104.43044
    },
    "stats": {
      "views": 6130,
      "callClicks": 836,
      "bookingsCount": 267
    },
    "roomTypes": [
      {
        "id": "rm-58-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491308031-353507.jpg.w1080.webp"
      },
      {
        "id": "rm-58-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782491308891-691630.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-60",
    "title": "New Sun House",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0333285866",
    "zalo": "0826363966",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.98,
    "reviewCount": 143,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "New Sun House là một trong những tọa độ dừng chân tuyệt vời nhất để du khách đón trọn những vạt nắng đầu tiên của ngày mới tại thiên đường mây Tà Xùa. Sở hữu lối kiến trúc nhà gỗ mộc mạc mang tone màu ấm áp kết hợp hài hòa với các hệ cửa kính lớn, homestay mở ra một không gian lưu trú vô cùng thoáng đãng và ngập tràn ánh sáng. Nơi đây mang lại một cảm giác tự do, thư thái tuyệt đối — nơi bạn chỉ cần mở mắt ra là đã có thể chạm tay vào sương mờ và ngắm nhìn đại dương mây bồng bềnh cuộn sóng ngay trước hiên nhà.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492897177-232099.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492897177-232099.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492891352-366362.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492892681-819565.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492893269-59062.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492894037-304713.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492895010-303472.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492895892-616028.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492896560-444233.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-60",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3115,
      "lng": 104.46241
    },
    "stats": {
      "views": 6215,
      "callClicks": 848,
      "bookingsCount": 271
    },
    "roomTypes": [
      {
        "id": "rm-59-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492891352-366362.jpg.w1080.webp"
      },
      {
        "id": "rm-59-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492892681-819565.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-61",
    "title": "Trạm Lưu Trú Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0353690166",
    "zalo": "0353690166",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 150,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Trạm Lưu Trú Tà Xùa là một trong những tọa độ nghỉ ngơi được lòng cộng đồng mê dịch chuyển nhờ phong cách thô mộc, giản dị và gần gũi với thiên nhiên hoang sơ. Giữa cái lạnh bao phủ của thiên đường mây, nơi đây đón tiếp du khách bằng những căn phòng gỗ tự nhiên ấm cúng, mang tone màu trầm ấm phối cùng hệ thống vách kính lớn hướng trọn góc nhìn ra núi đồi bồng bềnh sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782493284817-977233.jfif",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782493284817-977233.jfif",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493276491-619370.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493277605-294269.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493278607-916490.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493279424-97814.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493280148-642677.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493280787-863821.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493281383-287818.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-61",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24804,
      "lng": 104.42877
    },
    "stats": {
      "views": 6300,
      "callClicks": 860,
      "bookingsCount": 275
    },
    "roomTypes": [
      {
        "id": "rm-60-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493276491-619370.jpg.w1080.webp"
      },
      {
        "id": "rm-60-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782493277605-294269.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-62",
    "title": "Giàng Homestay Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0352536765",
    "zalo": "0352536765",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.82,
    "reviewCount": 157,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Giàng Homestay là một điểm dừng chân mang phong cách thô mộc, phóng khoáng và tràn đầy chất thơ ngự trị trên đỉnh cao Tà Xùa. Đúng như lời ca tụng về một tọa độ &quot;chạm tay vào thiên nhiên&quot;, homestay sở hữu tầm nhìn cực đại mở thẳng ra khoảng không bao la — nơi ranh giới giữa biển mây và trời xanh như hòa làm một. Được thiết kế theo lối kiến trúc nhà gỗ mộc mạc nép mình bên vách núi, Giàng Homestay mang lại một không gian tĩnh mịch, biệt lập tuyệt đối. Đây không chỉ là nơi để bạn thong thả trốn phố &quot;chữa lành&quot;, mà còn là góc ban công lý tưởng để săn tìm Milky Way lấp lánh khi màn đêm buông xuống.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270350389-999773.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270350389-999773.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270349251-454799.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270351085-187389.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270351823-654381.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270352831-808489.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270353689-441607.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270354391-438958.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270355133-24941.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-62",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24334,
      "lng": 104.43198
    },
    "stats": {
      "views": 6385,
      "callClicks": 872,
      "bookingsCount": 279
    },
    "roomTypes": [
      {
        "id": "rm-61-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270349251-454799.jpg.w1080.webp"
      },
      {
        "id": "rm-61-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270351085-187389.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-63",
    "title": "Lù Homestay Tà xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0982276996",
    "zalo": "0982276996",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.94,
    "reviewCount": 164,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Lù Homestay là một điểm dừng chân mang phong cách vô cùng mộc mạc, bình dị và đậm chất thơ của vùng cao Tây Bắc. Homestay giữ chân du khách bằng những căn nhà gỗ nhỏ nhắn có tone màu trầm ấm, mái lợp đơn sơ nép mình duyên dáng bên triền đồi cỏ xanh. Không chạy theo lối thiết kế hào nhoáng, Lù Homestay mang lại một không gian tĩnh lặng, trong lành tuyệt đối — nơi bạn có thể rũ bỏ hoàn toàn khói bụi thành thị, thong thả ngồi bên hiên nhà nhâm nhi tách trà ấm và cảm nhận những dải mây trắng bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272731961-604778.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272731961-604778.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272726323-648833.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272727395-174531.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272728198-19879.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272728999-974006.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272729655-605246.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272730590-790977.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272731381-162809.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-63",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24478,
      "lng": 104.42739
    },
    "stats": {
      "views": 6470,
      "callClicks": 884,
      "bookingsCount": 283
    },
    "roomTypes": [
      {
        "id": "rm-62-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272726323-648833.jpg.w1080.webp"
      },
      {
        "id": "rm-62-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782272727395-174531.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-64",
    "title": "Tà Xùa Village",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0365590173",
    "zalo": "0365590173",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.76,
    "reviewCount": 171,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Village là một trong những khu lưu trú được đầu tư bài bản, mang phong cách nghỉ dưỡng sinh thái kết hợp hài hòa giữa nét đẹp thô mộc của núi rừng và sự chỉn chu, hiện đại. Nằm trải dài bên triền đồi với những căn bungalow gỗ mái vòm độc đáo độc lập, nơi đây mở ra một không gian khoáng đạt, tự do tuyệt đối. Đến với Tà Xùa Village, du khách sẽ được tận hưởng cảm giác thong thả &quot;chữa lành&quot; đúng nghĩa — nơi mỗi sáng thức dậy chỉ cần mở cửa phòng là cả một đại dương mây bồng bềnh lướt qua ngay trước mắt, mang lại sự thư thái trọn vẹn cho tâm hồn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270716558-246571.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270716558-246571.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270713803-144522.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270714778-741150.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270715631-887602.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270717453-5626.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270718320-411962.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270719208-657303.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270720144-901273.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-64",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24704,
      "lng": 104.43309
    },
    "stats": {
      "views": 6555,
      "callClicks": 896,
      "bookingsCount": 287
    },
    "roomTypes": [
      {
        "id": "rm-63-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270713803-144522.jpg.w1080.webp"
      },
      {
        "id": "rm-63-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782270714778-741150.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-65",
    "title": "Cloud Valley Háng Đồng",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Khu vực khác · Bản Háng Đồng, Bắc Yên, Việt Nam",
    "phone": "0888909883",
    "zalo": "0888909883",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 178,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cloud Valley Háng Đồng là một điểm dừng chân mang phong cách thô mộc, giản dị và đậm chất thơ vùng cao, tọa lạc ngay tại bản Háng Đồng — thủ phủ của những biển mây dày đặc nhất Tà Xùa. Không chạy theo lối thiết kế bóng bẩy, nơi đây giữ trọn nét văn hóa truyền thống với những căn nhà sàn, nhà gỗ mộc mạc, nép mình bình yên bên triền núi. Cloud Valley mang đến một không gian lưu trú ấm cúng và nguyên bản tuyệt đối, nơi du khách có thể rũ bỏ hoàn toàn khói bụi thành thị, thong thả ngồi bên hiên nhà sàn ngắm nhìn dải mây trắng bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292145061-508692.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292145061-508692.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292134217-423337.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292135556-298115.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292136378-388590.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292137184-510480.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292138194-462034.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292138852-992212.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292139653-675511.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-65",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36176,
      "lng": 104.53861
    },
    "stats": {
      "views": 6640,
      "callClicks": 908,
      "bookingsCount": 291
    },
    "roomTypes": [
      {
        "id": "rm-64-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292134217-423337.jpg.w1080.webp"
      },
      {
        "id": "rm-64-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782292135556-298115.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-66",
    "title": "Homestay Tà Xùa Mùa Trứ",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0967535339",
    "zalo": "0967535339",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 35,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mùa Trứ Homestay là một điểm dừng chân mang đậm nét văn hóa bản địa, mộc mạc và chân chất nằm giữa thiên đường mây Tà Xùa. Không chạy theo xu hướng hiện đại hay hào nhoáng, homestay giữ nguyên lối kiến trúc nhà gỗ mộc mạc, giản dị của đồng bào vùng cao với khoảng sân hiên rộng mở hướng thẳng ra núi đồi hoang sơ. Nơi đây mang lại một không gian tĩnh lặng, tách biệt tuyệt đối — góc lý tưởng cho những ai muốn trải nghiệm một cuộc sống &quot;bỏ phố về rừng&quot; đúng nghĩa, thong thả đón những làn gió ngàn và cảm nhận biển mây bồng bềnh lướt qua ngay trước hiên nhà.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210233052-324474.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210233052-324474.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210232145-5131.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210234037-294034.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210235223-201008.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210235919-470973.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210236517-172951.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210237204-497668.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210237931-361355.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-66",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24845,
      "lng": 104.4335
    },
    "stats": {
      "views": 6725,
      "callClicks": 920,
      "bookingsCount": 295
    },
    "roomTypes": [
      {
        "id": "rm-65-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210232145-5131.jpg.w1080.webp"
      },
      {
        "id": "rm-65-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782210234037-294034.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-67",
    "title": "Sóc Garden",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trung Tâm · Bản Tà Xùa, Xã Tà Xùa, Sơn La, Việt Nam",
    "phone": "0917950999",
    "zalo": "0917950999",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 42,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Sóc Garden là một góc nhỏ ẩn mình đầy bình yên, mang phong cách sân vườn mộc mạc và thơ mộng giữa lòng thiên đường mây Tà Xùa. Homestay sở hữu những căn nhà gỗ xinh xắn với tone màu trầm ấm, bao quanh là khuôn viên ngập tràn hoa lá. Điểm đắt giá của Sóc Garden là mang lại một không gian tĩnh lặng, an nhiên tuyệt đối — nơi du khách có thể thong thả lùi lại một bước, chạm tay vào làn sương mờ và cảm nhận trọn vẹn sự thư thái của tâm hồn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533413491-346441.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533413491-346441.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533412319-458510.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533414321-72771.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533415109-399847.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533415891-780768.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533416811-595821.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533417635-34015.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533418541-54492.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-67",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31838,
      "lng": 104.4686
    },
    "stats": {
      "views": 6810,
      "callClicks": 932,
      "bookingsCount": 299
    },
    "roomTypes": [
      {
        "id": "rm-66-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533412319-458510.jpg.w1080.webp"
      },
      {
        "id": "rm-66-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781533414321-72771.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-68",
    "title": "Mon&#x27;s House",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0941256888",
    "zalo": "0941256888",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.84,
    "reviewCount": 49,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mon&#x27;s House là một điểm dừng chân mang phong cách vô cùng mộc mạc, bình yên và gần gũi với cuộc sống bản địa tại Tà Xùa. Nép mình bên bản làng thanh bình, homestay sở hữu những căn nhà gỗ nhỏ xinh, mang tone màu trầm ấm kết hợp cùng hệ thống vách kính lớn. Điểm đắt giá nhất tại Mon&#x27;s House chính là tầm nhìn panorama tuyệt đối hướng thẳng ra thung lũng sâu , nơi du khách có thể thong thả ngồi bên hiên nhà uống tách trà nóng và bắt trọn đại dương mây bồng bềnh cuộn sóng ngay dưới chân.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532660904-362439.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532660904-362439.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532656208-751433.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532657218-498190.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532658100-153463.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532659047-793004.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532659649-159494.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532660356-681668.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532661443-116788.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-68",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24599,
      "lng": 104.43311
    },
    "stats": {
      "views": 6895,
      "callClicks": 944,
      "bookingsCount": 303
    },
    "roomTypes": [
      {
        "id": "rm-67-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532656208-751433.jpg.w1080.webp"
      },
      {
        "id": "rm-67-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781532657218-498190.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-69",
    "title": "Y Xoa Homestay",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0986174196",
    "zalo": "0986174196",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 56,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Y Xoa Homestay là điểm dừng chân lý tưởng dành cho những tâm hồn xê dịch đam mê khám phá và muốn bắt trọn những khoảnh khắc kỳ vĩ nhất của đất trời Tây Bắc. Nằm gần tọa độ danh tiếng &quot;Sống lưng khủng long&quot;, homestay sở hữu thiết kế nhà gỗ mộc mạc mang tone màu trầm ấm, hài hòa giữa thiên nhiên hoang sơ. Đây là nơi du khách chỉ cần bước ra hiên nhà là có thể đón những vạt nắng bình minh đầu tiên, phóng tầm mắt ngắm nhìn đại dương mây bồng bềnh cuộn sóng và sẵn sàng cho hành trình chinh phục những cung đường huyền thoại.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536435772-711709.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536435772-711709.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536436592-737381.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536437380-645013.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536438088-247179.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536438966-573493.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536439667-988080.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536440495-24425.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-69",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36594,
      "lng": 104.53937
    },
    "stats": {
      "views": 6980,
      "callClicks": 956,
      "bookingsCount": 307
    },
    "roomTypes": [
      {
        "id": "rm-68-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536436592-737381.jpg.w1080.webp"
      },
      {
        "id": "rm-68-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781536437380-645013.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-70",
    "title": "Tà Xùa Lu Trế",
    "category": "homestay",
    "area": "Mống Vàng",
    "address": "Bản Mống Vàng, xã Tà Xùa, Bắc Yên,Sơn La",
    "phone": "0385175102",
    "zalo": "0385175102",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 63,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Lu Trế Homestay là điểm dừng chân độc nhất vô nhị dành cho những ai muốn tìm kiếm một trải nghiệm &quot;bỏ phố về rừng&quot; đúng nghĩa. Nằm biệt lập trên đỉnh núi cao nhất của Tà Xùa, homestay mở ra một không gian hoang sơ, tĩnh lặng tuyệt đối, nơi gần như tách biệt hoàn toàn với thế giới ồn ào bên dưới. Đúng như lời đồn về một tọa độ &quot;chạm tay vào mây trời&quot;, Lu Trế được bao bọc bởi đại dương sương mờ và mây ngàn suốt bốn mùa quanh năm , mang lại cảm giác như đang sống lơ lửng giữa một thiên đường mộng mơ lưng chừng đá núi.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537938966-575504.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537938966-575504.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537937336-637170.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537938046-836679.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537939714-234900.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537940346-721647.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537940999-64862.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783607922241-262702.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360859469-644843.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-70",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Mống Vàng"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.33241,
      "lng": 104.5
    },
    "stats": {
      "views": 7065,
      "callClicks": 968,
      "bookingsCount": 311
    },
    "roomTypes": [
      {
        "id": "rm-69-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537937336-637170.jpg.w1080.webp"
      },
      {
        "id": "rm-69-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781537938046-836679.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-71",
    "title": "Phố Núi Homestay",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Bản Chống Tra, Xã Háng Đồng, Huyện Bắc Yên, Sơn La",
    "phone": "0965807840",
    "zalo": "0965807840",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 70,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "hố Núi Homestay là sự lựa chọn lưu trú lý tưởng cho những ai thích sự tiện lợi, ấm cúng và gần gũi. Homestay sở hữu các căn phòng gỗ sạch sẽ, bài trí tối giản nhưng đầy đủ tiện nghi cơ bản đáp ứng nhu cầu nghỉ ngơi sau một ngày dài di chuyển. Điểm nhấn của Phố Núi chính là sự kết hợp &quot;2 trong 1&quot; hoàn hảo — bạn chỉ cần mở cửa phòng là có thể hòa mình vào không khí trong lành của núi rừng, dạo bước ra khoảng sân hiên ngắm cảnh núi đồi hoang sơ và dễ dàng bước xuống tầng dưới để thưởng thức ngay những món ăn nóng hổi mà không cần phải đi đâu xa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408105326-94291.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408105326-94291.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408103090-753666.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408104929-70855.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408105789-974482.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408106548-681204.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408107391-208845.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408108017-662284.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-71",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36844,
      "lng": 104.54074
    },
    "stats": {
      "views": 7150,
      "callClicks": 980,
      "bookingsCount": 315
    },
    "roomTypes": [
      {
        "id": "rm-70-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408103090-753666.jpg.w1080.webp"
      },
      {
        "id": "rm-70-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408104929-70855.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-72",
    "title": "Nhà Lưng Núi",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long · Bản Chống Tra, xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0984051510",
    "zalo": "0984051510",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 77,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Lưng Núi là một điểm dừng chân mang phong cách thô mộc, nguyên bản và đậm chất thơ hoang sơ tại Tà Xùa. Đúng như tên gọi đầy thân thương của mình, nơi đây là một căn nhà gỗ nhỏ nhắn nằm nép mình duyên dáng ngay lưng chừng núi, bao quanh là triền cỏ xanh và mây ngàn bảng lảng. Không đi theo lối thiết kế hào nhoáng, Nhà Lưng Núi giữ chân những tâm hồn xê dịch bằng một khoảng không gian tĩnh lặng tuyệt đối — nơi bạn có thể rũ bỏ hoàn toàn khói bụi thành phố, thong thả ngồi bên hiên nhà lật mở từng trang sách và cảm nhận những dải mây lướt nhẹ qua ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427391942-254570.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427391942-254570.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427387648-162847.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427388917-865588.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427389784-379808.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427390928-633200.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427392644-465927.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427393355-552636.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427394188-544359.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-72",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36175,
      "lng": 104.54244
    },
    "stats": {
      "views": 7235,
      "callClicks": 992,
      "bookingsCount": 319
    },
    "roomTypes": [
      {
        "id": "rm-71-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427387648-162847.jpg.w1080.webp"
      },
      {
        "id": "rm-71-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781427388917-865588.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-73",
    "title": "A Dua Homestay",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0988263142",
    "zalo": "0988263142",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 84,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "A Dua Homestay là một điểm dừng chân mang đậm hơi thở bản địa và sự thô mộc hoang sơ, tọa lạc ngay sát vách địa danh Sống Lưng Khủng Long huyền thoại. Homestay được dựng hoàn toàn theo lối kiến trúc nhà gỗ mộc mạc của đồng bào vùng cao, sở hữu khoảng hiên rộng và những ô cửa mở thẳng ra thung lũng sâu thẳm. Nơi đây không có vẻ bóng bẩy của các khu nghỉ dưỡng hiện đại, mà ôm trọn lòng tin của du khách bằng một không gian yên bình nguyên bản — nơi bạn chỉ cần mở cửa phòng là đã có thể đón những làn gió ngàn và ngắm nhìn đại dương mây cuồn cuộn đổ về ngay dưới chân.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429339958-329104.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429339958-329104.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429336042-756678.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429336923-839942.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429337910-716888.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429338723-432969.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429339416-966521.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429341047-342132.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429341816-256545.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-73",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36708,
      "lng": 104.5424
    },
    "stats": {
      "views": 7320,
      "callClicks": 1004,
      "bookingsCount": 323
    },
    "roomTypes": [
      {
        "id": "rm-72-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429336042-756678.jpg.w1080.webp"
      },
      {
        "id": "rm-72-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781429336923-839942.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-74",
    "title": "Skyline Homestay Tà Xùa",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0853710888",
    "zalo": "0853710888",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 91,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Skyline Homestay là một điểm dừng chân hiện đại, mang phong cách trẻ trung và ngập tràn sức sống giữa biển mây Tà Xùa. Nổi bật với lối kiến trúc tối giản kết hợp các hệ khung cửa kính lớn và ban công kính trong suốt, homestay mang đến một không gian lưu trú vô cùng thoáng đãng. Đây là nơi bạn có thể chạm tay vào sương mờ mỗi sớm mai, thả hồn theo những dải mây bồng bềnh cuộn sóng ngay trước mắt và tận hưởng sự thư thái, tự do giữa đất trời vùng cao.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337592080-663592.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337592080-663592.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337592986-148317.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337593811-952887.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337594509-811520.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337600001-333183.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337601245-820409.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337601804-840332.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793778100296-79ce7bb4-06dc-42aa-b3ce-ef2f16ea7df7.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-74",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31473,
      "lng": 104.46078
    },
    "stats": {
      "views": 7405,
      "callClicks": 1016,
      "bookingsCount": 327
    },
    "roomTypes": [
      {
        "id": "rm-73-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337592986-148317.jpg.w1080.webp"
      },
      {
        "id": "rm-73-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781337593811-952887.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-75",
    "title": "Đom Đóm Homestay",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0985488826",
    "zalo": "0985488826",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.98,
    "reviewCount": 98,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Đom Đóm Homestay là một điểm dừng chân mang phong cách vô cùng mộc mạc, mộc mạc và gần gũi với thiên nhiên Tà Xùa. Đúng như cái tên mộc mạc của mình, homestay được xây dựng chủ yếu bằng chất liệu gỗ thô mộc, nép mình bên triền đồi với tầm nhìn mở thẳng ra khoảng không bao la của núi rừng. Nơi đây không có sự hào nhoáng của những khu resort hiện đại mà giữ chân những tâm hồn xê dịch bằng một không gian tĩnh lặng, tràn ngập hơi thở dịu dàng, bình yên của một mái nhà vùng cao đích thực.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336756266-456255.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336756266-456255.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336747023-423614.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336461146-519061.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336461976-74422.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336462773-725855.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336463511-609222.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336748228-176590.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336748894-977462.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-75",
    "tags": [
      "Cặp đôi",
      "Gia đình",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31338,
      "lng": 104.46397
    },
    "stats": {
      "views": 7490,
      "callClicks": 1028,
      "bookingsCount": 331
    },
    "roomTypes": [
      {
        "id": "rm-74-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336747023-423614.png.w1080.webp"
      },
      {
        "id": "rm-74-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336461146-519061.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-76",
    "title": "Nhà Mer Homestay",
    "category": "homestay",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0967833685",
    "zalo": "0967833685",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 105,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Mer Homestay là một điểm dừng chân mang phong cách trẻ trung, nhẹ nhàng và vô cùng thơ mộng tại thiên đường mây Tà Xùa. Không theo lối mòn thô mộc đơn điệu, Nhà Mer kết hợp hài hòa giữa chất liệu gỗ ấm áp với tone màu decor sáng sủa, tinh tế cùng các hệ khung cửa kính lớn sát trần. Đúng như tinh thần tinh gọn và &quot;chill&quot; hết nấc, đây là nơi du khách chỉ cần lười biếng mở mắt ra mỗi sớm mai là đã có thể thu trọn cả thung lũng mây bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336937657-530830.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336937657-530830.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336938474-156275.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336939260-857732.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336940225-59862.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336941121-237081.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336942002-789022.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336942724-882153.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336943335-594424.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-76",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31802,
      "lng": 104.45939
    },
    "stats": {
      "views": 7575,
      "callClicks": 1040,
      "bookingsCount": 335
    },
    "roomTypes": [
      {
        "id": "rm-75-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336938474-156275.jpg.w1080.webp"
      },
      {
        "id": "rm-75-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336939260-857732.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-77",
    "title": "Paàng Village",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Khu vực khác · Làng Chếu, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0592000555",
    "zalo": "0592000555",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.82,
    "reviewCount": 112,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Pàng Village hiện lên như một ngôi làng thu nhỏ đầy mộng mơ, mang đậm phong cách thô mộc và nguyên bản của núi rừng Tây Bắc. Homestay được thiết kế theo lối kiến trúc nhà gỗ truyền thống với mái lợp ngói âm dương xám rêu hoài cổ, nép mình duyên dáng bên triền đồi cỏ xanh mướt. Với tầm nhìn mở thẳng ra khoảng không bao la của thung lũng, Pàng Village mang lại một không gian tĩnh lặng, trong lành tuyệt đối — nơi bạn có thể chạm tay vào sương mờ mỗi sớm mai và thong thả cảm nhận nhịp sống chậm rãi giữa đại dương mây bồng bềnh.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359975952-570948.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359975952-570948.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359974990-270612.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359976545-30374.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359977297-324713.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359977879-89772.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359978477-740919.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359979048-789051.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359979632-346418.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-77",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.2415,
      "lng": 104.43309
    },
    "stats": {
      "views": 7660,
      "callClicks": 1052,
      "bookingsCount": 339
    },
    "roomTypes": [
      {
        "id": "rm-76-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359974990-270612.jpg.w1080.webp"
      },
      {
        "id": "rm-76-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781359976545-30374.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-78",
    "title": "Mây Hạ Retreat",
    "category": "homestay",
    "area": "Mống Vàng",
    "address": "Bản Mống Vàng, xã Tà Xùa, Sơn La",
    "phone": "0976709589",
    "zalo": "0976709589",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.94,
    "reviewCount": 119,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mây Hạ Retreat là một góc trốn lý tưởng dành cho những ai yêu thích phong cách trẻ trung, hiện đại nhưng vẫn muốn hòa mình trọn vẹn vào thiên nhiên Tà Xùa. Nổi bật với lối kiến trúc nhà gỗ tinh tế kết hợp các hệ khung cửa kính lớn sát trần, nơi đây mang lại một không gian lưu trú vô cùng ngập tràn ánh sáng. Đúng như tinh thần của một khu &quot;Retreat&quot;, Mây Hạ mang đến sự thong thả, riêng tư tuyệt đối — nơi bạn có thể lười biếng nằm cuộn mình trong chăn hay bước ra ban công là đã thấy biển mây bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360859469-644843.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360859469-644843.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360858270-440502.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360857125-929240.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360860501-317757.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360861822-263895.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360863239-995277.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360864677-936800.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360865826-378942.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-78",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Mống Vàng"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.33792,
      "lng": 104.49461
    },
    "stats": {
      "views": 7745,
      "callClicks": 1064,
      "bookingsCount": 343
    },
    "roomTypes": [
      {
        "id": "rm-77-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360858270-440502.jpg.w1080.webp"
      },
      {
        "id": "rm-77-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781360857125-929240.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-79",
    "title": "Mây House",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long · Bản Chống Tra, xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0397781999",
    "zalo": "0397781999",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.76,
    "reviewCount": 126,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Mây House Homestay là một điểm dừng chân mộc mạc nằm ngay gần địa danh Sống Lưng Khủng Long nổi tiếng của Tà Xùa. Không chạy theo lối thiết kế hiện đại, homestay giữ nguyên nét thô mộc đặc trưng của vùng cao với những căn nhà gỗ nhỏ nhắn, mái lá đơn sơ và khoảng sân hiên ngập tràn sắc hoa. Đây là toạ độ lý tưởng cho những ai muốn tìm kiếm một không gian lưu trú bình dị, gần gũi, nơi bạn có thể thong thả ngồi bên hiên nhà uống tách trà nóng và ngắm nhìn dải mây trắng vắt ngang qua những triền đồi hùng vĩ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361204489-598059.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361204489-598059.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361205975-319074.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361206609-711503.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361207401-87433.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361208203-890747.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361208829-649500.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361209445-176832.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361210064-590345.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-79",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36355,
      "lng": 104.5455
    },
    "stats": {
      "views": 7830,
      "callClicks": 1076,
      "bookingsCount": 347
    },
    "roomTypes": [
      {
        "id": "rm-78-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361205975-319074.jpg.w1080.webp"
      },
      {
        "id": "rm-78-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781361206609-711503.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-80",
    "title": "Nơi Ấy Homestay",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long · Háng Đồng, Sơn La, Việt Nam",
    "phone": "0366479663",
    "zalo": "0366479663",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 133,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nơi Ấy Homestay là một điểm dừng chân mang phong cách vô cùng mộc mạc, bình dị và đậm chất thơ giữa lòng Tà Xùa. Đúng như cái tên đầy hoài niệm của mình, homestay được xây dựng chủ yếu từ chất liệu gỗ tự nhiên thô mộc, nép mình bên triền đồi với những ô cửa kính mở hướng thẳng ra khoảng không bao la. Nơi đây mang lại cảm giác thân thuộc như một ngôi nhà xưa cũ – nơi bạn có thể trốn khỏi những ồn ào của phố thị, thong thả ngồi bên hiên nhà nhâm nhi tách trà nóng và ngắm nhìn biển mây bồng bềnh cuộn sóng ngay trước mắt.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370457207-754703.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370457207-754703.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370456546-452767.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370457747-333072.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370458363-529294.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370458923-481671.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370459396-273071.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370459995-926431.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370460476-719684.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-80",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36454,
      "lng": 104.5386
    },
    "stats": {
      "views": 7915,
      "callClicks": 1088,
      "bookingsCount": 351
    },
    "roomTypes": [
      {
        "id": "rm-79-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370456546-452767.jpg.w1080.webp"
      },
      {
        "id": "rm-79-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370457747-333072.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-81",
    "title": "1941M Homestay",
    "category": "homestay",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "02477753268",
    "zalo": "02477753268",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 140,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "1941M Homestay là một điểm dừng chân mang phong cách thô mộc, hoang sơ và cực kỳ gần gũi với thiên nhiên Tây Bắc. Homestay giữ chân du khách bằng những căn nhà gỗ có tone màu trầm ấm, mái lợp đơn sơ nép mình bên vách núi. Không hướng đến sự xa hoa, 1941M Homestay mang lại một không gian tĩnh lặng tuyệt đối — nơi bạn có thể rũ bỏ hoàn toàn khói bụi thành phố để lắng nghe tiếng gió ngàn và cảm nhận biển mây cuồn cuộn lướt qua ngay trước hiên nhà.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370743999-161764.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370743999-161764.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370744599-897502.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370745198-524045.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370745783-766427.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370746467-377659.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370747180-385150.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370747788-288138.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783846386021-739256.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-81",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36723,
      "lng": 104.54511
    },
    "stats": {
      "views": 8000,
      "callClicks": 1100,
      "bookingsCount": 355
    },
    "roomTypes": [
      {
        "id": "rm-80-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370744599-897502.jpg.w1080.webp"
      },
      {
        "id": "rm-80-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370745198-524045.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-82",
    "title": "Samu Retreat",
    "category": "homestay",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Chung Trinh, Xã Tà Xùa, Sơn La",
    "phone": "0979564988",
    "zalo": "0979564988",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.72,
    "reviewCount": 147,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Samu Retreat là điểm dừng chân lý tưởng dành cho những ai đang tìm kiếm một không gian nghỉ dưỡng yên bình, tách biệt khỏi sự xô bồ. Tọa lạc tại Bản Bé, homestay sở hữu thiết kế tinh tế, hài hòa với thiên nhiên cùng view ôm trọn cảnh sắc núi non trùng điệp của Tà Xùa. Với hệ thống phòng nghỉ từ phòng đôi có bồn tắm lãng mạn đến phòng gia đình rộng rãi, Samu Retreat mang lại trải nghiệm thư thái trọn vẹn cho du khách.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230602418-691263.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230602418-691263.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230603213-892595.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230603935-745666.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230604600-461020.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230605318-225824.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230606009-432491.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230606529-972934.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230607040-57913.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-82",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31768,
      "lng": 104.46937
    },
    "stats": {
      "views": 8085,
      "callClicks": 1112,
      "bookingsCount": 359
    },
    "roomTypes": [
      {
        "id": "rm-81-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230603213-892595.jpg.w1080.webp"
      },
      {
        "id": "rm-81-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781230603935-745666.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-83",
    "title": "MiAmi Mountain Retreat",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0926936555",
    "zalo": "0926936555",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.84,
    "reviewCount": 154,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254245883-757918.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254245883-757918.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254246419-388240.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254247238-666486.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254247768-589711.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254248341-760365.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254249172-233017.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254249842-696423.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254250542-825881.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-83",
    "tags": [
      "View săn mây",
      "Có ăn uống",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3302,
      "lng": 104.4805
    },
    "stats": {
      "views": 8170,
      "callClicks": 1124,
      "bookingsCount": 363
    },
    "roomTypes": [
      {
        "id": "rm-82-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254246419-388240.png.w1080.webp"
      },
      {
        "id": "rm-82-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254247238-666486.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-84",
    "title": "Pơ Mu Homestay",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0398066886",
    "zalo": "0398066886",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 161,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255534676-191186.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255534676-191186.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255535403-30324.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255536072-625539.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255536972-29453.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255537539-339496.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255538376-678630.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255539306-808854.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255539954-367969.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-84",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24255,
      "lng": 104.42874
    },
    "stats": {
      "views": 8255,
      "callClicks": 1136,
      "bookingsCount": 367
    },
    "roomTypes": [
      {
        "id": "rm-83-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255535403-30324.jpg.w1080.webp"
      },
      {
        "id": "rm-83-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781255536072-625539.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-85",
    "title": "Tà Xùa Retreat",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa C, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0336604158",
    "zalo": "0336604158",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.78,
    "reviewCount": 168,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Tà Xùa Retreat mang đến một không gian nghỉ dưỡng thực sự yên bình và tĩnh lặng, tách biệt khỏi những ồn ào của khu trung tâm. Với lối kiến trúc ưu tiên sử dụng chất liệu gỗ, tre nứa tự nhiên kết hợp cùng các vách kính lớn, mỗi căn phòng tại đây đều là một góc nhỏ ấm cúng mở tầm nhìn thẳng ra thung lũng sâu hun hút. Đây là điểm dừng chân lý tưởng cho những ai muốn lười biếng nằm lướt điện thoại hay chỉ cần mở mắt thức dậy là có thể thu trọn khoảnh khắc bình minh và biển mây bồng bềnh ngay tại giường.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258815285-144052.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258815285-144052.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258816131-289268.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258816689-67324.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258817296-205573.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258817769-574646.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258818373-219383.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258818970-318945.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258819552-648757.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-85",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Phù hợp nhóm đông",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24576,
      "lng": 104.43044
    },
    "stats": {
      "views": 8340,
      "callClicks": 1148,
      "bookingsCount": 371
    },
    "roomTypes": [
      {
        "id": "rm-84-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258816131-289268.jpg.w1080.webp"
      },
      {
        "id": "rm-84-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258816689-67324.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-86",
    "title": "Păng Nhù Homestay - Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0352536765",
    "zalo": "0352536765",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 175,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Păng Nhù Homestay mang đến một không gian lưu trú đậm chất mộc mạc, gần gũi với thiên nhiên vùng cao. Điểm đắt giá nhất của homestay chính là tầm nhìn hướng thẳng ra thung lũng sâu sương mờ bao phủ. Được thiết kế theo phong cách nhà gỗ truyền thống kết hợp các ô cửa kính lớn, Păng Nhù mở ra một không gian ngắm mây lý tưởng cho du khách. Với khoảng sân hiên rộng rãi ngập tràn sắc hoa và những bộ bàn ghế gỗ mộc, đây là nơi bạn có thể thong thả thưởng tách trà ấm và tận hưởng trọn vẹn sự yên bình của đất trời Tà Xùa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274789940-113401.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274789940-113401.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274788842-130000.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274790687-803439.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274791399-360270.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274792047-728499.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274792612-393447.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274793277-906189.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274793911-594084.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-86",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24617,
      "lng": 104.4304
    },
    "stats": {
      "views": 8425,
      "callClicks": 1160,
      "bookingsCount": 375
    },
    "roomTypes": [
      {
        "id": "rm-85-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274788842-130000.jpg.w1080.webp"
      },
      {
        "id": "rm-85-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781274790687-803439.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-87",
    "title": "Nhà Của An Homestay &amp; Coffee Tà Xùa",
    "category": "homestay",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0374561451",
    "zalo": "0374561451",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.92,
    "reviewCount": 32,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhà Của An là một homestay nhỏ xinh, mang đậm hơi thở mộc mạc và giản dị của vùng cao Tà Xùa. Không chạy theo xu hướng sang trọng, nơi đây giữ chân du khách bằng những căn nhà gỗ, mái lá đơn sơ mang tone màu trầm ấm và không gian ngập tràn cây cỏ. Điểm đắt giá của Nhà Của An chính là cảm giác an nhiên đúng như cái tên của quán – nơi bạn có thể tạm gác lại những âu lo, thong thả ngồi bên hiên nhà uống tách trà nóng và ngắm nhìn nhịp sống bình lặng trôi qua.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278696581-882921.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278696581-882921.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278693822-166616.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278695681-718276.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278697194-432129.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278697821-726030.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278698413-507344.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278699119-475035.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278699569-217285.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-87",
    "tags": [
      "View săn mây",
      "Chỗ đỗ xe",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32406,
      "lng": 104.47728
    },
    "stats": {
      "views": 8510,
      "callClicks": 1172,
      "bookingsCount": 379
    },
    "roomTypes": [
      {
        "id": "rm-86-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278693822-166616.jpg.w1080.webp"
      },
      {
        "id": "rm-86-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278695681-718276.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-88",
    "title": "Nhặt Nắng house Tà Xùa",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0369545237",
    "zalo": "0369545237",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.74,
    "reviewCount": 39,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Nhặt Nắng House là một homestay nhỏ xinh mang phong cách mộc mạc, nhẹ nhàng, đem lại cảm giác bình yên như một &quot;ngôi nhà thứ hai&quot; giữa lòng Tà Xùa. Sử dụng chất liệu gỗ tông màu ấm áp làm chủ đạo kết hợp với những ô cửa kính lớn đón trọn ánh sáng tự nhiên, nơi đây mở ra không gian lưu trú vô cùng thoáng đãng. Với những bộ bàn ghế gỗ đặt ngoài hiên và những góc Decor xinh xắn, Nhặt Nắng House là điểm dừng chân lý tưởng cho những tâm hồn muốn tìm kiếm sự thư thái và thong thả &quot;nhặt&quot; từng vạt nắng bình yên nơi núi rừng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258511744-732115.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258511744-732115.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258387726-515744.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258388418-451930.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258389092-580661.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258389854-544837.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258390605-970849.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258391174-344453.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258391903-100023.jpg.w1080.webp"
    ],
    "verificationTier": 2,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-88",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Phù hợp nhóm đông",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24848,
      "lng": 104.43197
    },
    "stats": {
      "views": 8595,
      "callClicks": 1184,
      "bookingsCount": 383
    },
    "roomTypes": [
      {
        "id": "rm-87-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258387726-515744.jpg.w1080.webp"
      },
      {
        "id": "rm-87-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781258388418-451930.jpg.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-stay-89",
    "title": "La Cheu Home",
    "category": "homestay",
    "area": "Bắc Yên",
    "address": "Khu vực khác · Làng Chếu, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0975855755",
    "zalo": "0975855755",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.86,
    "reviewCount": 46,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Đã bao gồm ăn sáng & tư vấn săn mây thực địa",
    "description": "Cơ sở du lịch thẩm định tại Khu vực khác · Làng Chếu, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195882811-517711.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195882811-517711.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195880052-551051.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195880747-126753.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195881667-218685.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195882200-790895.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195883721-504036.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195884484-10875.png.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195885121-186944.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-stay-89",
    "tags": [
      "View săn mây",
      "Cặp đôi",
      "View mây phòng ngủ",
      "Có chỗ đậu ô tô",
      "Yên tĩnh tuyệt đối",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24184,
      "lng": 104.42739
    },
    "stats": {
      "views": 8680,
      "callClicks": 1196,
      "bookingsCount": 387
    },
    "roomTypes": [
      {
        "id": "rm-88-1",
        "name": "Phòng Kính Panorama View Mây",
        "capacity": 2,
        "priceWeekend": 450000,
        "priceWeekday": 382500,
        "totalRooms": 4,
        "availableRooms": 3,
        "viewType": "Biển mây tràn",
        "amenities": [
          "Bình nóng lạnh",
          "Đệm sưởi",
          "Wifi tốc độ cao",
          "Ban công ngắm mây",
          "Bàn trà"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195880052-551051.png.w1080.webp"
      },
      {
        "id": "rm-88-2",
        "name": "Bungalow Gỗ View Đỉnh Núi",
        "capacity": 4,
        "priceWeekend": 675000,
        "priceWeekday": 585000,
        "totalRooms": 2,
        "availableRooms": 1,
        "viewType": "Đỉnh núi",
        "amenities": [
          "Bình nóng lạnh",
          "Máy sưởi",
          "Bồn tắm gỗ",
          "View thung lũng 180°"
        ],
        "imageUrl": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781195880747-126753.png.w1080.webp"
      }
    ]
  },
  {
    "id": "tx-cafe-90",
    "title": "hây hây meadow",
    "category": "coffee",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu vực khác · Bản Xím Vàng, xã Xím Vàng, Sơn La",
    "phone": "0949998298",
    "zalo": "0949998298",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.75,
    "reviewCount": 45,
    "hasCloudView": true,
    "minPrice": 150000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán cà phê nhỏ view 360 là ruộng bậc thang trải bát ngát. Có nhiều góc chụp checkin không bị đông đúc. Có mái nhà cờ đỏ sao vàng lớn nhất Tà Xùa. Được đánh giá là có nước uống ngon như ở Hà Nội. \nView hây hây meadow phù hợp đón hoàng hôn, thác mây, săn biển mây và đặc biệt là địa điểm săn milky’s way đỉnh thật sự.\nQuán có cà phê, trà, các loại đồ uống và nhận đặt ăn tại quán. Cũng có địa điểm camping phù hợp với đoàn ngắm sao.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497649081-d07e519b-a6ba-4020-ba73-4d8eba93cf3b.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497649081-d07e519b-a6ba-4020-ba73-4d8eba93cf3b.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497627770-9d1ff367-e1f8-4e73-a7b7-5753e0b190d7.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497629620-2e6a134b-931f-42fc-a58c-5fe5ac71bfca.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497631706-a6c63139-195e-496a-ab2b-d8ec2d352a99.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497632980-861b5672-bede-4ee8-88a2-2b8ec05b75c8.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497634432-be1ab9e8-9d8a-4735-b432-b7168458cdc6.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497635779-2dbeec0c-eb9e-4072-8d7f-8e51e55b33f2.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793497638259-e5534c67-cebd-42fd-bc55-b558021f4aac.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-1",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.321,
      "lng": 104.475
    },
    "stats": {
      "views": 2200,
      "callClicks": 210,
      "bookingsCount": 80
    }
  },
  {
    "id": "tx-cafe-91",
    "title": "Chillout Village – Nhà hàng &amp; Cafe",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Khe Cải",
    "phone": "0933669881",
    "zalo": "0933669881",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.81,
    "reviewCount": 53,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Nhà hàng &amp; cafe nội khu của Chillout Village ở bản Khe Cải: ghé ăn bữa cơm nóng, thưởng ly cà phê và ngắm mây trời thung lũng. Khu nghỉ có bể bơi vô cực nhìn ra thung lũng mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170201336-644236.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170201336-644236.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-2",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31724,
      "lng": 104.459
    },
    "stats": {
      "views": 2290,
      "callClicks": 220,
      "bookingsCount": 85
    }
  },
  {
    "id": "tx-cafe-92",
    "title": "Moong Homestay &amp; Coffee",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0965180162",
    "zalo": "0965180162",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 61,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Moong Homestay ở Đỉnh Gió có quầy cà phê, khách ghé ngồi uống nước, ngắm mây. Nên gọi trước hỏi giờ mở cửa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781336065411-812014.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-3",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32382,
      "lng": 104.48149
    },
    "stats": {
      "views": 2380,
      "callClicks": 230,
      "bookingsCount": 90
    }
  },
  {
    "id": "tx-cafe-93",
    "title": "Cloud Coffee – Cloud Forest Tà Xùa",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0395805715",
    "zalo": "0395805715",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.93,
    "reviewCount": 69,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán cà phê của Cloud Forest ở Đỉnh Gió, thường có tên trong các danh sách cafe view săn mây của Tà Xùa: nghỉ chân, săn mây và uống cà phê ở cùng một chỗ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781335772359-95901.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-4",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32854,
      "lng": 104.47552
    },
    "stats": {
      "views": 2470,
      "callClicks": 240,
      "bookingsCount": 95
    }
  },
  {
    "id": "tx-cafe-94",
    "title": "Sunset Clouds Coffee",
    "category": "coffee",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long",
    "phone": "0986275494",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.75,
    "reviewCount": 77,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán nhỏ view săn mây, cách trung tâm Tà Xùa khoảng 4 km về hướng Sống Lưng Khủng Long. Khách ghé kể cà phê đậm vị, view rất đẹp.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081390-671086.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783504081390-671086.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-5",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36567,
      "lng": 104.54496
    },
    "stats": {
      "views": 2560,
      "callClicks": 250,
      "bookingsCount": 100
    }
  },
  {
    "id": "tx-cafe-95",
    "title": "Mi Ami Mountain Retreat – Cafe &amp; Nhà hàng",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0926936555",
    "zalo": "0926936555",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.81,
    "reviewCount": 85,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Mi Ami Mountain Retreat ở Đỉnh Gió đã mở cafe và nhà hàng: vừa ăn uống, nghỉ chân vừa ngồi ngắm mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254245883-757918.png.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781254245883-757918.png.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-6",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32417,
      "lng": 104.47556
    },
    "stats": {
      "views": 2650,
      "callClicks": 260,
      "bookingsCount": 105
    }
  },
  {
    "id": "tx-cafe-96",
    "title": "Noong Ơi Homestay Coffee",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Khe Cải",
    "phone": "0978679378",
    "zalo": "0978679378",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 93,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Homestay kèm quán cà phê, có góc check-in view săn mây, ngắm núi và thung lũng; có chỗ đỗ xe, hợp cặp đôi, gia đình và nhóm bạn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172670256-518911.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781172670256-518911.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-7",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31783,
      "lng": 104.46491
    },
    "stats": {
      "views": 2740,
      "callClicks": 270,
      "bookingsCount": 110
    }
  },
  {
    "id": "tx-cafe-97",
    "title": "Cà phê Bản – Sống Lưng Khủng Long",
    "category": "coffee",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long",
    "phone": "0933669881",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/BanCoffeeSongkhungLong",
    "rating": 4.93,
    "reviewCount": 101,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Tiệm ăn sáng &amp; cà phê ngay khu Sống Lưng Khủng Long (xã Háng Đồng), có khung cửa sổ nhìn ra núi non. Nhiều lịch trình gợi ý ghé ăn sáng ở đây sau khi săn bình minh trên Sống Lưng. Quán phục vụ cả khách nước ngoài.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ca-phe-ban-song-lung-khung-long-1793061260691.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ca-phe-ban-song-lung-khung-long-1793061260691.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-8",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36385,
      "lng": 104.53913
    },
    "stats": {
      "views": 2830,
      "callClicks": 280,
      "bookingsCount": 115
    }
  },
  {
    "id": "tx-cafe-98",
    "title": "MẬN – The Cocktail Bar (Mận Pub)",
    "category": "coffee",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trung Tâm",
    "phone": "0933669881",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/Man.thecocktailbar",
    "rating": 4.75,
    "reviewCount": 109,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán bar nhỏ ở khu Thiên Đường Mây (trung tâm Tà Xùa) với không gian âm nhạc ngẫu hứng buổi tối — chỗ ghé sau bữa tối để nghe nhạc, nhâm nhi cocktail.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/man-the-cocktail-bar-man-pub-1793061261562.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/man-the-cocktail-bar-man-pub-1793061261562.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-9",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3197,
      "lng": 104.47484
    },
    "stats": {
      "views": 2920,
      "callClicks": 290,
      "bookingsCount": 120
    }
  },
  {
    "id": "tx-cafe-99",
    "title": "Lili Mountain – Tiệm cà phê Tử Tế",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Khe Cải",
    "phone": "0889369236",
    "zalo": "0889369236",
    "facebook": "https://www.facebook.com/profile.php?id=61594848062942",
    "rating": 4.81,
    "reviewCount": 117,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Tiệm cà phê ở bản Khe Cải, gần Ameii Hill, Tiệm Cà Phê Hoàng Hôn và Trạm Mây. Quán tự giới thiệu &quot;không chỉ bán view check-in mà là một ly nước ngon và tử tế&quot;.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/lili-mountain-tiem-ca-phe-tu-te-1793061262541.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/lili-mountain-tiem-ca-phe-tu-te-1793061262541.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-10",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31788,
      "lng": 104.45921
    },
    "stats": {
      "views": 3010,
      "callClicks": 300,
      "bookingsCount": 125
    }
  },
  {
    "id": "tx-cafe-100",
    "title": "Mây Bay Coffee – Tà Xùa",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0988803127",
    "zalo": "0988803127",
    "facebook": "https://www.facebook.com/maybaycoffee.taxua",
    "rating": 4.87,
    "reviewCount": 125,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán cà phê săn mây ở khu Đỉnh Gió (bản Cáo A), có phục vụ ăn uống, ngồi ngắm mây và hoàng hôn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/may-bay-coffee-ta-xua-1793061263478.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/may-bay-coffee-ta-xua-1793061263478.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-11",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32426,
      "lng": 104.48124
    },
    "stats": {
      "views": 3100,
      "callClicks": 310,
      "bookingsCount": 130
    }
  },
  {
    "id": "tx-cafe-101",
    "title": "Mây Bản Tà Xùa – Homestay &amp; Coffee",
    "category": "coffee",
    "area": "Mống Vàng",
    "address": "Mống Vàng",
    "phone": "0945386555",
    "zalo": "0945386555",
    "facebook": "https://www.facebook.com/maybantaxua",
    "rating": 4.93,
    "reviewCount": 133,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Homestay kèm quán cà phê ở ngã 3 Mống Vàng, có bungalow gỗ hai mặt kính view săn mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/may-ban-ta-xua-homestay-coffee-1793061264315.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/may-ban-ta-xua-homestay-coffee-1793061264315.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-12",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Mống Vàng"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3355,
      "lng": 104.49531
    },
    "stats": {
      "views": 3190,
      "callClicks": 320,
      "bookingsCount": 135
    }
  },
  {
    "id": "tx-cafe-102",
    "title": "Hiên Nhà trên Thảo Nguyên",
    "category": "coffee",
    "area": "Thảo Nguyên",
    "address": "Thảo Nguyên",
    "phone": "0919921990",
    "zalo": "0919921990",
    "facebook": "https://www.facebook.com/profile.php?id=61553282432027",
    "rating": 4.75,
    "reviewCount": 141,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán cà phê giữa Thảo Nguyên Tà Xùa — chỗ dừng chân ngắm trời mây với một ly nước ấm. Từ 01/01/2026 quán áp dụng hình thức &quot;check-in kèm đồ uống&quot;: được tham quan, chụp ảnh mọi góc của Hiên, kèm 01 phần nước trong menu, ghế camping và phòng vệ sinh.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/hien-nha-tren-thao-nguyen-1793061266963.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/hien-nha-tren-thao-nguyen-1793061266963.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-13",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Thảo Nguyên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.35387,
      "lng": 104.45763
    },
    "stats": {
      "views": 3280,
      "callClicks": 330,
      "bookingsCount": 140
    }
  },
  {
    "id": "tx-cafe-103",
    "title": "Cà phê Tháng 10 – Tà Xùa",
    "category": "coffee",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trung Tâm",
    "phone": "0933669881",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/Caphethang10taxua",
    "rating": 4.81,
    "reviewCount": 149,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán cà phê ở trung tâm Tà Xùa, không gian rộng và ấm cúng, khuôn viên nhiều hoa; có những buổi nhạc acoustic.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ca-phe-thang-10-ta-xua-1793061265731.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ca-phe-thang-10-ta-xua-1793061265731.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-14",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.318,
      "lng": 104.46943
    },
    "stats": {
      "views": 3370,
      "callClicks": 340,
      "bookingsCount": 145
    }
  },
  {
    "id": "tx-cafe-104",
    "title": "Khèn Coffee House",
    "category": "coffee",
    "area": "Bắc Yên",
    "address": "Làng Chếu, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0567276666",
    "zalo": "0869111294",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 157,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Cơ sở du lịch thẩm định tại Làng Chếu, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479765436-943476.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479765436-943476.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479766947-78772.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479767676-926186.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479768453-388585.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479769105-522359.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479769722-819943.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479770659-452681.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783479771462-902764.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-15",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24712,
      "lng": 104.43251
    },
    "stats": {
      "views": 3460,
      "callClicks": 350,
      "bookingsCount": 150
    }
  },
  {
    "id": "tx-cafe-105",
    "title": "An&#x27;s Coffee - Tà Xùa",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0982478955",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.93,
    "reviewCount": 165,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "An’s Coffee Tà Xùa là một trong những quán cà phê sở hữu vị trí đắc địa bậc nhất tại khu vực Đỉnh Gió — nơi được mệnh danh là thiên đường săn mây của mảnh đất vùng cao này. Mang phong cách mộc mạc, gần gũi với chất liệu gỗ tự nhiên làm chủ đạo, quán mở ra một không gian khoáng đạt tuyệt đối để du khách hòa mình vào thiên nhiên.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835358858-740267.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835358858-740267.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835358333-995768.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835356239-676282.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835357162-950758.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835359643-415341.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835360196-235024.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835360966-408103.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782835361842-317322.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-16",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32697,
      "lng": 104.47607
    },
    "stats": {
      "views": 3550,
      "callClicks": 360,
      "bookingsCount": 155
    }
  },
  {
    "id": "tx-cafe-106",
    "title": "Khe Cải Coffee (Ngày Nào Đó)",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0347389375",
    "zalo": "0347389375",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.75,
    "reviewCount": 173,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Ngày nào đó Cafe (ngaynaodo.cafe) là một trong những tọa độ dừng chân mang phong cách vô cùng mộc mạc, bình dị và đầy chất thơ nằm ngay tại bản Khe Cải — thủ phủ săn mây và ngắm hoàng hôn nổi tiếng bậc nhất Tà Xùa. Lấy cảm hứng từ những nếp nhà gỗ thô mộc của vùng cao, quán mở ra một không gian thư thái hoàn hảo, nơi thời gian như lắng đọng lại. Đúng như cái tên gợi nhắc về những lời hẹn ước, &quot;Ngày nào đó&quot; là trạm dừng chân lý tưởng để bạn thong thả nép mình bên hiên nhà, nhâm nhi một tách cà phê ấm nóng và thu trọn vào tầm mắt bức tranh thiên nhiên diễm lệ khi mây trời và núi non hòa làm một.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637971562-182968.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637971562-182968.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637966335-40246.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637967705-75088.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637968748-800863.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637969843-697249.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637970848-223155.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637972543-340012.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782637973554-205846.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-17",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31265,
      "lng": 104.46436
    },
    "stats": {
      "views": 3640,
      "callClicks": 370,
      "bookingsCount": 160
    }
  },
  {
    "id": "tx-cafe-107",
    "title": "Cafe Làng Văn Hóa",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "100088548559007",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.81,
    "reviewCount": 181,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Cafe Làng Văn Hóa Tà Xùa là một góc nhỏ mang phong cách thô mộc, bình dị và đầy chất thơ nằm ngay khu vực Đỉnh Gió. Không ồn ào hay phô trương, quán mang lại cảm giác thân thuộc như một nếp nhà vùng cao — nơi thời gian như trôi chậm lại một nhịp.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293911917-598353.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293911917-598353.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293912586-77507.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293913168-253997.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293914003-266465.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293914982-844087.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293915727-376213.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293916373-440168.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782293916938-166474.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-18",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32976,
      "lng": 104.47622
    },
    "stats": {
      "views": 3730,
      "callClicks": 380,
      "bookingsCount": 165
    }
  },
  {
    "id": "tx-cafe-108",
    "title": "Tiệm Cà Phê Hoàng Hôn",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Bản Khe Cải, Tà Xùa, Sơn La",
    "phone": "0963970106",
    "zalo": "0963970106",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 189,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Tiệm Cà Phê Hoàng Hôn tọa lạc tại khu vực Khe Cải là một trong những tọa độ dừng chân lãng mạn và &quot;thơ&quot; bậc nhất bản mây. Đúng như tên gọi của mình, quán sở hữu vị trí đắc địa hướng thẳng về phía mặt trời lặn, nép mình bình yên giữa khung cảnh núi non trùng điệp. Không gian quán được decor vô cùng xinh xắn, tỉ mỉ với chất liệu thô mộc làm chủ đạo, mở ra một khoảng trời khoáng đạt và tự do. Đây là địa điểm lý tưởng để bạn thong thả ngồi nhâm nhi ly nước ấm, lắng nghe một bản nhạc nhẹ nhàng và ngắm nhìn vạt nắng hoàng hôn nhuộm hồng cả thung lũng mây ngàn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783478715140-965439.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783478715140-965439.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972702019-559912.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972697502-280566.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972698483-166009.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972699197-956735.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972700196-568868.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972701099-832724.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781972702939-232867.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-19",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31341,
      "lng": 104.4642
    },
    "stats": {
      "views": 3820,
      "callClicks": 390,
      "bookingsCount": 170
    }
  },
  {
    "id": "tx-cafe-109",
    "title": "Trạm Mây Tà Xùa",
    "category": "coffee",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0987323962",
    "zalo": "0987323962",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.93,
    "reviewCount": 197,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Quán Cà Phê Trạm Mây là một trong những điểm hẹn dừng chân mang phong cách thơ mộng, nhẹ nhàng và vô cùng hút khách tại thiên đường mây Tà Xùa. Đúng như tên gọi của mình, quán tựa như một &quot;trạm dừng&quot; bình yên ngự trị sát rìa núi, nơi ranh giới giữa mặt đất và mây ngàn như hòa làm một. Với lối thiết kế thô mộc tận dụng chất liệu gỗ tự nhiên kết hợp cùng không gian mở hướng thẳng ra thung lũng sâu, Trạm Mây mang đến một bầu không khí thong thả, tự do tuyệt đối — góc lý tưởng để bạn nhâm nhi một tách trà ấm, lật mở vài trang sách và ngắm nhìn biển mây bồng bềnh cuộn sóng ngay dưới chân.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973262895-589307.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973262895-589307.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973257913-478211.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973259265-47953.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973260158-338421.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973263596-465246.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973264458-817896.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973265201-585976.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973265823-401222.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-20",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31416,
      "lng": 104.45989
    },
    "stats": {
      "views": 3910,
      "callClicks": 400,
      "bookingsCount": 175
    }
  },
  {
    "id": "tx-cafe-110",
    "title": "Panorama coffee",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió",
    "phone": "0855692888",
    "zalo": "0855692888",
    "facebook": "https://www.facebook.com/thietkekientrucahome123/",
    "rating": 4.75,
    "reviewCount": 205,
    "hasCloudView": true,
    "minPrice": 40000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Panorama là một quán cafe nhỏ ở khu vực Đỉnh gió - Tà Xùa.\r\nMọi người thường tới quán để check in góc ban công thần thánh.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781584231935-759716.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781584231935-759716.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781584231329-551634.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781584230387-180359.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-21",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32951,
      "lng": 104.48052
    },
    "stats": {
      "views": 4000,
      "callClicks": 410,
      "bookingsCount": 180
    }
  },
  {
    "id": "tx-cafe-111",
    "title": "Thào Coffee Tà Xùa",
    "category": "coffee",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0846298888",
    "zalo": "0846298888",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.81,
    "reviewCount": 213,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Thào Coffee là quán cà phê đầu tiên và mang tính biểu tượng bậc nhất tại trung tâm Tà Xùa. Nằm ngay sát bên triền núi, quán giữ chân du khách bằng một không gian thô mộc được dựng hoàn toàn từ gỗ và lợp mái ngói âm dương sậm màu theo phong cách nhà sàn truyền thống của đồng bào H&#x27;Mông. Không chỉ là nơi thưởng thức ly cà phê ấm giữa cái lạnh vùng cao, Thào Coffee còn là một &quot;toạ độ&quot; văn hoá – nơi bạn có thể vừa chạm tay vào sương mờ, vừa cảm nhận trọn vẹn nhịp sống bình dị và nét đẹp nguyên bản của đất trời Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339039005-802756.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339039005-802756.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339040514-504347.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339041604-65763.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339042360-41134.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339043471-633378.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339044393-504724.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339045252-401116.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339046058-149714.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-22",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24223,
      "lng": 104.42807
    },
    "stats": {
      "views": 4090,
      "callClicks": 420,
      "bookingsCount": 185
    }
  },
  {
    "id": "tx-cafe-112",
    "title": "Nhà H&#x27;Mông",
    "category": "coffee",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0347389375",
    "zalo": "0347389375",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 221,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Nhà H&#x27;Mông Cafe là một trong những toạ độ dừng chân mang không gian văn hoá đặc trưng và mộc mạc tại Tà Xùa. Quán tái hiện hoàn hảo kiến trúc nhà ở truyền thống của đồng bào người H&#x27;Mông với vách gỗ thô mộc, cột kèo tự nhiên và mái ngói âm dương rêu phong cổ kính. Giữa cái lạnh bao phủ của vùng cao, bước vào Nhà H&#x27;Mông, bạn sẽ cảm nhận ngay sự ấm áp tỏa ra từ bếp lửa bập bùng giữa nhà, hương cà phê thơm nồng quyện cùng sắc màu rực rỡ của những tấm thổ cẩm treo tường, tạo nên một không gian trốn phố vô cùng an nhiên và hoài niệm.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339825199-974357.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339825199-974357.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339826235-213878.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339827050-187941.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339827809-242341.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339828783-292482.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339829447-859756.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339830300-902362.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781339831144-430481.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-23",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24598,
      "lng": 104.43183
    },
    "stats": {
      "views": 4180,
      "callClicks": 430,
      "bookingsCount": 190
    }
  },
  {
    "id": "tx-cafe-113",
    "title": "Mị ơi Cafe",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0989254806",
    "zalo": "0989254806",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.93,
    "reviewCount": 229,
    "hasCloudView": true,
    "minPrice": 50000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "CƠ SỞ 1: MỊ ƠI CAFE ĐỈNH GIÓ\r\nCƠ SỞ 2: MỊ ƠI TÀ XÙA - HOMESTAY CAFE GLAMPING",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368915614-716987.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368915614-716987.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368914693-260329.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368916252-177516.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368916939-35770.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368917784-135365.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368918423-413386.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368919382-715178.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368920303-210339.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-24",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32826,
      "lng": 104.47677
    },
    "stats": {
      "views": 4270,
      "callClicks": 440,
      "bookingsCount": 195
    }
  },
  {
    "id": "tx-cafe-114",
    "title": "Hiên",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0987525555",
    "zalo": "0987525555",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.75,
    "reviewCount": 237,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Cà Phê Hiên là một góc trốn nhỏ xinh, mang phong cách mộc mạc và vô cùng yên bình nằm giữa lòng Tà Xùa. Đúng như tên gọi, điểm nhấn của quán là chiếc &quot;hiên nhà&quot; bằng gỗ nhỏ gọn hướng thẳng ra khoảng không bao la của núi đồi. Với lối thiết kế tối giản, sử dụng chất liệu gỗ thô mộc làm chủ đạo kết hợp cùng những món đồ trang trí vintage hoài cổ, Hiên đem lại cảm giác thân thuộc, nhẹ nhàng – nơi du khách có thể thong thong thả thả ngồi ngắm mây trôi vội vã qua những ô cửa sổ cũ kỹ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340305409-35441.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340305409-35441.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340302220-489760.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340300022-912854.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340301401-572031.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340302908-108694.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340303556-253073.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340304602-931735.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781340306054-630799.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-25",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32387,
      "lng": 104.48013
    },
    "stats": {
      "views": 4360,
      "callClicks": 450,
      "bookingsCount": 200
    }
  },
  {
    "id": "tx-cafe-115",
    "title": "Nhà Của An Homestay &amp; Coffee Tà Xùa",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0374561451",
    "zalo": "0374561451",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.81,
    "reviewCount": 245,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Cơ sở du lịch thẩm định tại Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278317822-896110.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278317822-896110.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278318765-570794.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278319508-319641.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278320194-891246.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278320874-375398.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278321970-653850.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278322563-388556.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781278323402-938046.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-26",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32924,
      "lng": 104.47698
    },
    "stats": {
      "views": 4450,
      "callClicks": 460,
      "bookingsCount": 205
    }
  },
  {
    "id": "tx-cafe-116",
    "title": "Chill Cafe",
    "category": "coffee",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0977632953",
    "zalo": "0977632953",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.87,
    "reviewCount": 253,
    "hasCloudView": true,
    "minPrice": 45000,
    "priceNote": "Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)",
    "description": "Cơ sở du lịch thẩm định tại Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276896946-174957.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276896946-174957.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276894668-217689.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276889041-670697.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276890274-949839.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276891290-735013.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276892192-48267.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276893089-816340.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781276893889-928981.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-cafe-27",
    "tags": [
      "View thung lũng mây",
      "Cà phê muối",
      "Xích đu sống ảo",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32647,
      "lng": 104.47991
    },
    "stats": {
      "views": 4540,
      "callClicks": 470,
      "bookingsCount": 210
    }
  },
  {
    "id": "tx-rest-117",
    "title": "Vua Lẩu - Nướng Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0983310765",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 50,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910956071-74590.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910956071-74590.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910956704-149706.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910957477-81175.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910958127-476720.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910958824-925330.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910959540-585307.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910960132-602877.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784910960803-618443.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-1",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.433
    },
    "stats": {
      "views": 1800,
      "callClicks": 320,
      "bookingsCount": 95
    }
  },
  {
    "id": "tx-rest-118",
    "title": "Cơm nhà Namiya - Đỉnh Gió",
    "category": "restaurant",
    "area": "Đỉnh Gió",
    "address": "Đỉnh Gió, Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0865292896",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 59,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơm nhà Namiya là một tọa độ ẩm thực mang phong cách vô cùng mộc mạc, bình dị và ngập tràn sự ấm cúng, tọa lạc ngay tại khu vực Đỉnh Gió — thiên đường săn mây nổi tiếng của Tà Xùa. Namiya giữ chân du khách bằng hương vị tinh tế của những bữa cơm nhà nóng hổi và sự hiếu khách, chân thành. Giữa cái lạnh sương mờ của vùng cao, ghé vào Namiya để thong thả thưởng thức những món ăn đậm đà bản sắc chính là trải nghiệm &quot;chữa lành&quot; chiếc bụng đói hoàn hảo, giúp bạn nạp đầy năng lượng sau những cung đường trekking và săn ảnh dài.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951895653-561760.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951895653-561760.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951896685-941282.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951897450-346939.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951898424-104743.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951899217-940284.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951900352-831302.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951901234-322452.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783951902272-477891.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-2",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.32808,
      "lng": 104.47753
    },
    "stats": {
      "views": 1880,
      "callClicks": 335,
      "bookingsCount": 102
    }
  },
  {
    "id": "tx-rest-119",
    "title": "Nhà hàng Hang Chú - Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung tâm Tà Xùa, huyện Bắc Yên, tỉnh Sơn La, Việt Nam",
    "phone": "0911745198",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 68,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Nhà hàng Hang Chú &amp; Hidden Bar là một tổ hợp ẩm thực và giải trí vô cùng độc đáo, mang phong cách mộc mạc tinh tế pha chút bí ẩn, tọa lạc ngay trong lòng bản làng Tà Xùa. Không chỉ là nơi dừng chân để lấp đầy chiếc bụng đói, Hang Chú dẫn dắt du khách vào một hành trình đánh thức mọi giác quan: từ việc thưởng thức những món ăn mang đậm tinh hoa ẩm thực Tây Bắc cho đến việc trốn mình trong một chiếc Hidden Bar đầy cá tính. Sự kết hợp ngẫu hứng giữa nếp sống bản địa hoang sơ và một chút thi vị, hiện đại của góc bar nhỏ biến nơi đây thành điểm hẹn lý tưởng để bạn thong thả tận hưởng trọn vẹn cuộc sống về đêm trên đỉnh mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952565789-259691.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952565789-259691.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952550319-719162.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952551328-74418.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952552067-869552.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952552753-683325.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952553390-243244.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952553889-881907.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783952554495-583411.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-3",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24268,
      "lng": 104.42763
    },
    "stats": {
      "views": 1960,
      "callClicks": 350,
      "bookingsCount": 109
    }
  },
  {
    "id": "tx-rest-120",
    "title": "Nhà Hàng- Coffee Gió Bản Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0986072128",
    "zalo": "0986072128",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 77,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436978126-99002.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436978126-99002.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436975022-39264.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436975737-737996.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436976584-835033.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436977268-887839.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436978839-938246.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436979581-431880.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783436980390-859221.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-4",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24791,
      "lng": 104.4325
    },
    "stats": {
      "views": 2040,
      "callClicks": 365,
      "bookingsCount": 116
    }
  },
  {
    "id": "tx-rest-121",
    "title": "Nhà Hàng Bếp Việt",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0336638333",
    "zalo": "0898563115",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 86,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm · Bản Tà Xùa A, Tà Xùa, Bắc Yên, Sơn La. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437593853-753900.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437593853-753900.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437594773-446615.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437595549-82375.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437596229-837028.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437596747-212873.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437597572-684406.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783437598508-784143.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-5",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24206,
      "lng": 104.43075
    },
    "stats": {
      "views": 2120,
      "callClicks": 380,
      "bookingsCount": 123
    }
  },
  {
    "id": "tx-rest-122",
    "title": "Mùa Quán Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0989375677",
    "zalo": "0989375677",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 95,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492116101-969.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492116101-969.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492117470-556218.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492118241-269664.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492118988-679029.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492119799-447731.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492121296-789581.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492121930-267109.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782492122486-823659.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-6",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24741,
      "lng": 104.42701
    },
    "stats": {
      "views": 2200,
      "callClicks": 395,
      "bookingsCount": 130
    }
  },
  {
    "id": "tx-rest-123",
    "title": "Trạm Mây Tà Xùa",
    "category": "restaurant",
    "area": "Khe Cải",
    "address": "Khe Cải, Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0987323962",
    "zalo": "0987323962",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 104,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Quán Nướng Trạm Mây là tọa độ ẩm thực &quot;sưởi ấm&quot; chiếc bụng đói lý tưởng nhất của du khách khi đêm buông xuống tại Tà Xùa. Quán ghi điểm bởi không gian ăn uống quây quần, ấm cúng mang đậm phong cách dã ngoại (camping) ngoài trời bên bếp than hồng cheo leo giữa mây ngàn. Chuyên phục vụ các set nướng BBQ đa dạng từ thịt bò, thịt lợn bản cho đến gà đồi được tẩm ướp đậm đà theo gia vị mắc khén, hạt dổi đặc trưng, Trạm Mây mang lại một trải nghiệm vị giác tuyệt vời. Còn gì hạnh phúc hơn khi giữa cái lạnh thấu xương của vùng cao, bạn được ngồi cùng những người thương yêu, lắng nghe tiếng thịt nướng xèo xèo và hít hà mùi thơm nức mũi giữa đất trời Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973420068-129342.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973420068-129342.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973416894-915684.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973416077-899289.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973417783-766805.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973418697-830364.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973419298-570584.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973420622-132406.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781973421219-178731.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-7",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31358,
      "lng": 104.46318
    },
    "stats": {
      "views": 2280,
      "callClicks": 410,
      "bookingsCount": 137
    }
  },
  {
    "id": "tx-rest-124",
    "title": "Tiệm Mì Cay Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0363962345",
    "zalo": "0363962345",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 113,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Tiệm Mì Cay Tà Xùa là một tọa độ ẩm thực độc đáo và cực kỳ được lòng giới trẻ khi đến với bản mây. Giữa cái lạnh thấu xương và sương mù bao phủ đặc trưng của vùng cao, tiệm mì mang đến một luồng năng lượng ấm áp với những tô mì cay bốc khói nghi ngút, thơm phức. Không gian quán được bài trí tối giản, mộc mạc nhưng vô cùng gần gũi, mở ra tầm nhìn hướng ra thiên nhiên hoang sơ. Còn gì tuyệt vời hơn sau một chuyến chạy xe đường dài đổ đèo săn mây, bạn được ngồi quây quần cùng bạn bè, xì xụp thưởng thức hương vị cay nồng, đậm đà của tô mì giữa đất trời Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798001511-421225.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798001511-421225.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798002171-539430.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798003024-867289.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798003713-950536.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798004329-800292.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798004898-231484.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798005696-10069.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781798006440-100500.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-8",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24515,
      "lng": 104.43223
    },
    "stats": {
      "views": 2360,
      "callClicks": 425,
      "bookingsCount": 144
    }
  },
  {
    "id": "tx-rest-125",
    "title": "Tiệm lẩu nướng Trạm Mây",
    "category": "restaurant",
    "area": "Khe Cải",
    "address": "Khe cải - Tà Xùa - Bắc yên - Sơn La",
    "phone": "0987323962",
    "zalo": "0987323962",
    "facebook": "https://www.facebook.com/trammaytaxua/",
    "rating": 4.9,
    "reviewCount": 122,
    "hasCloudView": false,
    "minPrice": 200000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Tiệm lẩu nướng Trạm Mây nằm trong khuôn viên của tiệm cà phê Trạm Mây, nằm tại bản Khe cải - cách trung tâm Tà Xùa 2km.\r\nTại đây mọi người có thể ngắm trọn vẹn thung lũng mây, và hoàng hôn Tà Xùa, cùng thưởng thức tiệc BBQ và lẩu ngoài trời vô cùng chill.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583867705-726339.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583867705-726339.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583866678-105734.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583868427-404990.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583869854-48890.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583870659-269617.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583871469-723322.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583872189-851387.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781583872794-123449.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-9",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Khe Cải"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.31614,
      "lng": 104.45938
    },
    "stats": {
      "views": 2440,
      "callClicks": 440,
      "bookingsCount": 151
    }
  },
  {
    "id": "tx-rest-126",
    "title": "Nhà Hàng Phố Núi",
    "category": "restaurant",
    "area": "Sống Lưng Khủng Long",
    "address": "Sống Lưng Khủng Long, Bản Chống Tra, Xã Háng Đồng, Huyện Bắc Yên, Sơn La",
    "phone": "0965807840",
    "zalo": "0965807840",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 131,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Nhà hàng ghi điểm với không gian rộng rãi, ấm cúng được thiết kế chủ yếu bằng chất liệu gỗ thô mộc, mang đậm phong cách kiến trúc vùng cao. Nơi đây chuyên phục vụ các món ăn đặc sản Tây Bắc như lẩu gà đen homestay tự nuôi, thịt trâu gác bếp, lợn bản nướng tảng thơm lừng quyện cùng gia vị mắc khén, hạt dổi đặc trưng. Giữa cái lạnh bao phủ của vùng cao, được ngồi quây quần bên nồi lẩu nghi ngút khói, nhâm nhi chút rượu ngô ấm nồng và ngắm nhìn sương mờ bảng lảng qua ô cửa kính lớn sẽ là trải nghiệm ẩm thực cực kỳ trọn vẹn cho du khách.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408518415-65977.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408518415-65977.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408524049-896267.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781408524995-277339.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-10",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.36278,
      "lng": 104.54147
    },
    "stats": {
      "views": 2520,
      "callClicks": 455,
      "bookingsCount": 158
    }
  },
  {
    "id": "tx-rest-127",
    "title": "Nhà Hàng Đồi Mây",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Bắc Yên, Sơn La",
    "phone": "0352753377",
    "zalo": "0352753377",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 140,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Nhà Hàng Đồi Mây là một điểm hẹn ẩm thực quen thuộc và vô cùng thuận tiện tọa lạc ngay tại khu vực trung tâm xã Tà Xùa. Không gian nhà hàng được thiết kế ấm cúng, rộng rãi, mở ra tầm nhìn thoáng đãng hướng về phía núi đồi mây phủ. Nơi đây chinh phục thực khách bằng một thực đơn gọi món đậm đà bản sắc Tây Bắc, nổi bật với các món ăn mộc mạc nhưng gây thương nhớ như cơm lam dẻo thơm nướng ống tre, xôi nếp nương thơm dẻo, gà bản nướng vàng ruộm da giòn hay những nồi lẩu nghi ngút khói. Đây là tọa độ dừng chân lý tưởng để sưởi ấm chiếc bụng đói của du khách sau những giờ phút miệt mài rong đuổi săn mây.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410163976-57944.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410163976-57944.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410161810-930250.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410163044-238203.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410164898-411005.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410166062-339698.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410166880-936185.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410167842-91984.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781410168635-189546.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-11",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24787,
      "lng": 104.43297
    },
    "stats": {
      "views": 2600,
      "callClicks": 470,
      "bookingsCount": 165
    }
  },
  {
    "id": "tx-rest-128",
    "title": "Bếp ăn Xuân Thì Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0868515825",
    "zalo": "0868515825",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 149,
    "hasCloudView": false,
    "minPrice": 90000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Bếp Ăn Xuân Thì là một điểm hẹn ẩm thực mang phong cách nhẹ nhàng, ấm áp và vô cùng tinh tế giữa lòng Tà Xùa. Quán ghi điểm với không gian ăn uống được bài trí gọn gàng, gần gũi, mang lại cảm giác thân thuộc như một gian bếp gia đình sưởi ấm lòng du khách giữa cái lạnh vùng cao. Điểm khác biệt lớn nhất tại Xuân Thì chính là sự chu đáo và đa dạng trong ẩm thực; quán phục vụ xuyên suốt các bữa ăn trong ngày với thực đơn phong phú từ các set lẩu nghi ngút khói, đồ nướng xèo xèo thơm nức mũi, cho đến cả những mâm cơm chay thanh tịnh được chế biến tỉ mỉ theo yêu cầu riêng của thực khách.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409026275-533297.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409026275-533297.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409036482-312889.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409027479-926984.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409028275-283772.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409029094-550296.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409029770-954486.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409030658-508890.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781409031496-257808.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-12",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24203,
      "lng": 104.42862
    },
    "stats": {
      "views": 2680,
      "callClicks": 485,
      "bookingsCount": 172
    }
  },
  {
    "id": "tx-rest-129",
    "title": "Nhà hàng Sammu Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm · Cổng chào Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0948555333",
    "zalo": "0948555333",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.7,
    "reviewCount": 158,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Nhà hàng Sammu là một trong những toạ độ ẩm thực quen thuộc, chỉn chu và cực kỳ nổi tiếng nằm ngay tại khu vực trung tâm Tà Xùa. Nhà hàng ghi điểm với không gian rộng rãi, bài trí gọn gàng và mang lại cảm giác vô cùng ấm áp, thân thiện ngay từ khi bước vào. Không chạy theo lối thiết kế vách kính bóng bẩy, Sammu giữ trọn nét thô mộc, ấm cúng của một không gian ẩm thực vùng cao — nơi du khách có thể quây quần bên nhau, rũ bỏ cái lạnh thấu xương của sương mờ để thưởng thức những món ăn đặc sản nóng hổi trong bầu không khí vô cùng gần gũi và hiếu khách.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411217324-882855.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411217324-882855.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411213930-871570.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411211459-652456.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411212376-582557.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411213043-278129.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411214484-314355.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411215064-474966.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781411215795-830992.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-13",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.2475,
      "lng": 104.42793
    },
    "stats": {
      "views": 2760,
      "callClicks": 500,
      "bookingsCount": 179
    }
  },
  {
    "id": "tx-rest-130",
    "title": "Nhà Hàng A Phủ - Tinh Hoa Ẩm Thực Tà Xùa",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0374232388",
    "zalo": "0374232388",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 167,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Nhà Hàng A Phủ là một trong những địa điểm ăn uống nổi tiếng và tấp nập bậc nhất nằm ngay tại trung tâm Tà Xùa. Mang phong cách kiến trúc nhà sàn gỗ mộc mạc, ấm cúng và đậm đà bản sắc vùng cao, nhà hàng là điểm dừng chân lý tưởng của mọi đoàn khách sau một ngày dài mải miết săn mây. Nơi đây chinh phục thực khách bằng thực đơn món ăn bản địa phong phú, nguyên liệu tươi ngon được chế biến kỳ công, mang đến trải nghiệm ẩm thực Tây Bắc đích thực giữa lòng biển mây sương mờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342067045-290479.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342067045-290479.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342066283-86014.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342067773-837772.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342068290-382150.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342069017-301855.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342069896-324064.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342070501-391.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342071128-81656.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-14",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.24345,
      "lng": 104.43272
    },
    "stats": {
      "views": 2840,
      "callClicks": 515,
      "bookingsCount": 186
    }
  },
  {
    "id": "tx-rest-131",
    "title": "Tiệm Nướng Cánh Cam",
    "category": "restaurant",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0965957761",
    "zalo": "0965957761",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.9,
    "reviewCount": 176,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc",
    "description": "Cơ sở du lịch thẩm định tại Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370032656-414424.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370032656-414424.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370028513-448381.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370029369-819701.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370030107-977392.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370031060-133928.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370031913-19858.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781370033611-330496.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-rest-15",
    "tags": [
      "Lẩu gà đen",
      "Thịt lợn bản",
      "Cơm lam",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.2453,
      "lng": 104.43031
    },
    "stats": {
      "views": 2920,
      "callClicks": 530,
      "bookingsCount": 193
    }
  },
  {
    "id": "tx-bus-132",
    "title": "Nhà Xe Hải Giang",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0974130007",
    "zalo": "0974130007",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 80,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Cơ sở du lịch thẩm định tại Tà Xùa. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909231710-179134.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784909231710-179134.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-1",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 3500,
      "callClicks": 620,
      "bookingsCount": 180
    }
  },
  {
    "id": "tx-bus-133",
    "title": "Minh Châu Limousine",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0944233168",
    "zalo": "0944233168",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 91,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Cơ sở du lịch thẩm định tại Tà Xùa. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784794543327-817078.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784794543327-817078.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-2",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 3620,
      "callClicks": 645,
      "bookingsCount": 192
    }
  },
  {
    "id": "tx-bus-134",
    "title": "Nhà xe Hiền Hựu",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Trung Tâm Tà Xùa, Bắc Yên, Sơn La, Việt Nam",
    "phone": "0967136378",
    "zalo": "0967136378",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 102,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Nhà xe Hiền Hựu là một trong những nhà xe uy tín lâu năm tại Tà Xùa, với đa dạng các dòng xe như limousine, cabin đơn, cabin đôi, giường nằm\r\n- Xe đi: sáng 6h-7h và tối 21h- 22h tại cổng sau BigC Thăng Long, Royal city\r\n- Tà xùa về Hà Nội:  12h-13h- 14h -  20h -20h15",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781505592311-984762.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781505592311-984762.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781505593375-175422.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781505594125-63068.jpg.w1080.webp",
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781505620484-556324.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-3",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 3740,
      "callClicks": 670,
      "bookingsCount": 204
    }
  },
  {
    "id": "tx-bus-135",
    "title": "Nhà Xe Thành Mỹ",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0941256888",
    "zalo": "0941256888",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.8,
    "reviewCount": 113,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe Limousine",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342538686-993254.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781342538686-993254.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-4",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 3860,
      "callClicks": 695,
      "bookingsCount": 216
    }
  },
  {
    "id": "tx-bus-136",
    "title": "Nhà Xe Quang Nghĩa",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0334255255",
    "zalo": "0334255255",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 124,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe VIP 24 cabin đôi \r\nCabin đơn 34 phòng ViP\r\nXe limosine ghế ngả",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368243009-817672.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781368243009-817672.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-5",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 3980,
      "callClicks": 720,
      "bookingsCount": 228
    }
  },
  {
    "id": "tx-bus-137",
    "title": "Nhà Xe Tuấn Thủy",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0981288282",
    "zalo": "0981288282",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 135,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "DÒNG XE LIMOUSINE - CABIN ĐÔI CUNG ĐIỆN DI ĐỘNG",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781367139588-777261.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781367139588-777261.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-6",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4100,
      "callClicks": 745,
      "bookingsCount": 240
    }
  },
  {
    "id": "tx-bus-138",
    "title": "Nhà xe Bình Minh",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "08650081180904008118",
    "zalo": "0865008118",
    "facebook": "https://www.facebook.com/profile.php?id=100013522756996",
    "rating": 4.8,
    "reviewCount": 146,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Nhà xe tuyến Hà Nội – Tà Xùa, có hotline hỗ trợ tư vấn.",
    "coverImage": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    "images": [
      ""
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-7",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4220,
      "callClicks": 770,
      "bookingsCount": 252
    }
  },
  {
    "id": "tx-bus-139",
    "title": "Nhà Xe Hạnh Anh",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0964771999",
    "zalo": "0986888446",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.88,
    "reviewCount": 157,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Cơ sở du lịch thẩm định tại Tà Xùa. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782490781617-326885.jfif",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782490781617-326885.jfif"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-8",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4340,
      "callClicks": 795,
      "bookingsCount": 264
    }
  },
  {
    "id": "tx-bus-140",
    "title": "Nhà Xe Hương Sơn",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0987213993",
    "zalo": "0989287256",
    "facebook": "https://www.facebook.com/groups/taxua",
    "rating": 4.96,
    "reviewCount": 168,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Thaco Bus Đời Mới\r\nXe Mới, Sạch Sẽ\r\nTài Xế Giàu Kinh Nghiệm\r\nĐón trả tận nơi ( Theo Yêu Cầu )\r\nNhà xe có đón tại Bắc Giang, Bắc Ninh, Việt Trì",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781367813356-847969.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781367813356-847969.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-9",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4460,
      "callClicks": 820,
      "bookingsCount": 276
    }
  },
  {
    "id": "tx-bus-141",
    "title": "Nhà Xe Kiên Dũng",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0943778787",
    "zalo": "0943778787",
    "facebook": "https://www.facebook.com/profile.php?id=100045850002797",
    "rating": 4.8,
    "reviewCount": 179,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Tà Xùa travel: chuyên tuyến Hà Nội – Tà Xùa.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/nha-xe-kien-dung-1793061056277.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/nha-xe-kien-dung-1793061056277.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-10",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4580,
      "callClicks": 845,
      "bookingsCount": 288
    }
  },
  {
    "id": "tx-bus-142",
    "title": "Mạnh Quyền Xe Ghép",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0334362789",
    "zalo": "0334362789",
    "facebook": "https://www.facebook.com/profile.php?id=100005082279919",
    "rating": 4.88,
    "reviewCount": 190,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe ghép, xe hợp đồng, bao xe giá rẻ; limousine 9 chỗ đưa đón tận nơi, đi về theo giờ của đoàn.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/manh-quyen-xe-ghep-1793061057094.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/manh-quyen-xe-ghep-1793061057094.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-11",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4700,
      "callClicks": 870,
      "bookingsCount": 300
    }
  },
  {
    "id": "tx-bus-143",
    "title": "Nhà Xe Duy Huê",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0966190668",
    "zalo": "0966190668",
    "facebook": "https://www.facebook.com/profile.php?id=100021496930254",
    "rating": 4.96,
    "reviewCount": 201,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Nhà xe có xe ngày, xe đêm, đi về trong ngày; nhận chở khách và gửi hàng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/nha-xe-duy-hue-1793061062988.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/nha-xe-duy-hue-1793061062988.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-12",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4820,
      "callClicks": 895,
      "bookingsCount": 312
    }
  },
  {
    "id": "tx-bus-144",
    "title": "Sơn Cầm",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0876208765",
    "zalo": "0876208765",
    "facebook": "https://www.facebook.com/profile.php?id=61575849557646",
    "rating": 4.8,
    "reviewCount": 212,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe 4–6 chỗ đời mới tuyến Sơn La ⇄ Tà Xùa (Mộc Châu) ⇄ Hà Nội ⇄ Bắc Ninh; đón trả tận nơi, hỗ trợ hành lý, không nhồi nhét, đúng giờ.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/son-cam-1793061054766.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/son-cam-1793061054766.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-13",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 4940,
      "callClicks": 920,
      "bookingsCount": 324
    }
  },
  {
    "id": "tx-bus-145",
    "title": "Hùng Xe Ghép",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0325249188",
    "zalo": "0325249188",
    "facebook": "https://www.facebook.com/profile.php?id=100076221033219",
    "rating": 4.88,
    "reviewCount": 223,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe ghép tuyến Hà Nội – Phù Yên – Bắc Yên – Tà Xùa và ngược lại; nhận bao xe, gửi hàng hóa. Chiều Tà Xùa – Hà Nội chạy khoảng 7h–9h sáng.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/hung-xe-ghep-1793061055578.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/hung-xe-ghep-1793061055578.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-14",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 5060,
      "callClicks": 945,
      "bookingsCount": 336
    }
  },
  {
    "id": "tx-bus-146",
    "title": "Khánh Thịnh Limousine",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "0981195519",
    "zalo": "0981195519",
    "facebook": "https://www.facebook.com/profile.php?id=100017053515397",
    "rating": 4.96,
    "reviewCount": 234,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Cơ sở du lịch thẩm định tại Tà Xùa. Phục vụ du khách săn mây, nghỉ dưỡng và khám phá cảnh đẹp Tây Bắc.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/khanh-thinh-limousine-1793061057866.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/khanh-thinh-limousine-1793061057866.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-15",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 5180,
      "callClicks": 970,
      "bookingsCount": 348
    }
  },
  {
    "id": "tx-bus-147",
    "title": "Xe ghép Bắc Yên – Hà Nội (Bia Hơi Bắc Yên)",
    "category": "bus",
    "area": "Bắc Yên",
    "address": "Tà Xùa",
    "phone": "08341346660988357567",
    "zalo": "0834134666",
    "facebook": "https://www.facebook.com/profile.php?id=100043245522541",
    "rating": 4.8,
    "reviewCount": 245,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin",
    "description": "Xe ghép tuyến Bắc Yên (Tà Xùa) – Hà Nội. &quot;An tâm tay lái – Chạm mây Tà Xùa&quot;.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/xe-ghep-bac-yen-ha-noi-bia-hoi-bac-yen-1793061061992.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/xe-ghep-bac-yen-ha-noi-bia-hoi-bac-yen-1793061061992.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-bus-16",
    "tags": [
      "Limousine",
      "Cabin giường nằm",
      "Đón dọc tuyến",
      "Bắc Yên"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.245,
      "lng": 104.43
    },
    "stats": {
      "views": 5300,
      "callClicks": 995,
      "bookingsCount": 360
    }
  },
  {
    "id": "tx-tour-148",
    "title": "CàchuaTx Vistar",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "08659636470812251575",
    "zalo": "0865963647",
    "facebook": "https://facebook.com/search/top?q=C%C3%A0chuaTx%20Vistar",
    "rating": 4.85,
    "reviewCount": 65,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking CàchuaTx Vistar tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/cachuatx-vistar-1793061050040.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/cachuatx-vistar-1793061050040.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-1",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2400,
      "callClicks": 410,
      "bookingsCount": 110
    }
  },
  {
    "id": "tx-tour-149",
    "title": "Hồ Guider Trekking",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0349754481",
    "zalo": "0349754481",
    "facebook": "https://facebook.com/search/top?q=H%E1%BB%93%20Guider%20Trekking",
    "rating": 4.95,
    "reviewCount": 73,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking Hồ Guider Trekking tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ho-guider-trekking-1793061051090.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/ho-guider-trekking-1793061051090.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-2",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2495,
      "callClicks": 428,
      "bookingsCount": 118
    }
  },
  {
    "id": "tx-tour-150",
    "title": "A Vàng Travel",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "03856321690817559089",
    "zalo": "0385632169",
    "facebook": "https://facebook.com/search/top?q=A%20V%C3%A0ng%20Travel",
    "rating": 4.85,
    "reviewCount": 81,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking A Vàng Travel tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/a-vang-travel-1793061051910.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/a-vang-travel-1793061051910.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-3",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2590,
      "callClicks": 446,
      "bookingsCount": 126
    }
  },
  {
    "id": "tx-tour-151",
    "title": "Tráng Porter",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0353947175",
    "zalo": "0353947175",
    "facebook": "https://facebook.com/search/top?q=Tr%C3%A1ng%20Porter",
    "rating": 4.95,
    "reviewCount": 89,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking Tráng Porter tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784972956837-561323.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784972956837-561323.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-4",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2685,
      "callClicks": 464,
      "bookingsCount": 134
    }
  },
  {
    "id": "tx-tour-152",
    "title": "Hiệp Cuver",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0916394236",
    "zalo": "0916394236",
    "facebook": "https://facebook.com/search/top?q=Hi%E1%BB%87p%20Cuver",
    "rating": 4.85,
    "reviewCount": 97,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking Hiệp Cuver tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783140638392-316084.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783140638392-316084.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-5",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2780,
      "callClicks": 482,
      "bookingsCount": 142
    }
  },
  {
    "id": "tx-tour-153",
    "title": "TA XUA GREEN TOUR",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0383580145",
    "zalo": "0383580145",
    "facebook": "https://facebook.com/search/top?q=TA%20XUA%20GREEN%20TOUR",
    "rating": 4.95,
    "reviewCount": 105,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking TA XUA GREEN TOUR tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067176034-596178.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783067176034-596178.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-6",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2875,
      "callClicks": 500,
      "bookingsCount": 150
    }
  },
  {
    "id": "tx-tour-154",
    "title": "Giàng Táu",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0987 654 321",
    "zalo": "0987654321",
    "facebook": "https://facebook.com/search/top?q=Gi%C3%A0ng%20T%C3%A1u",
    "rating": 4.85,
    "reviewCount": 113,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking Giàng Táu tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784973083359-748945.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784973083359-748945.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-7",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 2970,
      "callClicks": 518,
      "bookingsCount": 158
    }
  },
  {
    "id": "tx-tour-155",
    "title": "Đạt Bin Bin",
    "category": "tour",
    "area": "Sống Lưng Khủng Long",
    "address": "Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long",
    "phone": "0933669881",
    "zalo": "0898563115",
    "facebook": "https://facebook.com/search/top?q=%C4%90%E1%BA%A1t%20Bin%20Bin",
    "rating": 4.95,
    "reviewCount": 121,
    "hasCloudView": true,
    "minPrice": 450000,
    "priceNote": "Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn",
    "description": "Dịch vụ hướng dẫn viên và tour trekking Đạt Bin Bin tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784973166218-599512.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1784973166218-599512.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-tour-8",
    "tags": [
      "Trekking",
      "Porter bản địa",
      "Săn mây",
      "Sống Lưng Khủng Long"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.365,
      "lng": 104.542
    },
    "stats": {
      "views": 3065,
      "callClicks": 536,
      "bookingsCount": 166
    }
  },
  {
    "id": "tx-photo-156",
    "title": "Thợ Chụp Ảnh A Lư Porter - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0866548583",
    "zalo": "0866548583",
    "facebook": "https://facebook.com/search/top?q=A%20L%C6%B0%20Porter",
    "rating": 4.88,
    "reviewCount": 75,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp A Lư Porter tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/a-lu-porter-1793061048710.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/a-lu-porter-1793061048710.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-1",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 2800,
      "callClicks": 490,
      "bookingsCount": 130
    }
  },
  {
    "id": "tx-photo-157",
    "title": "Thợ Chụp Ảnh Dương Đại - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0855932788",
    "zalo": "0855932788",
    "facebook": "https://facebook.com/search/top?q=D%C6%B0%C6%A1ng%20%C4%90%E1%BA%A1i",
    "rating": 4.93,
    "reviewCount": 81,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Dương Đại tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/duong-dai-1793061058599.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/duong-dai-1793061058599.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-2",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 2880,
      "callClicks": 512,
      "bookingsCount": 140
    }
  },
  {
    "id": "tx-photo-158",
    "title": "Thợ Chụp Ảnh Huy Kúnn - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0865548296",
    "zalo": "0865548296",
    "facebook": "https://facebook.com/search/top?q=Huy%20K%C3%BAnn",
    "rating": 4.98,
    "reviewCount": 87,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Huy Kúnn tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/huy-kunn-1793061059455.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/huy-kunn-1793061059455.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-3",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 2960,
      "callClicks": 534,
      "bookingsCount": 150
    }
  },
  {
    "id": "tx-photo-159",
    "title": "Thợ Chụp Ảnh Tiệm Ảnh Xinh - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0829878345",
    "zalo": "0829878345",
    "facebook": "https://facebook.com/search/top?q=Ti%E1%BB%87m%20%E1%BA%A2nh%20Xinh",
    "rating": 4.88,
    "reviewCount": 93,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Tiệm Ảnh Xinh tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/tiem-anh-xinh-1793061060319.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/danh-ba/tiem-anh-xinh-1793061060319.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-4",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3040,
      "callClicks": 556,
      "bookingsCount": 160
    }
  },
  {
    "id": "tx-photo-160",
    "title": "Thợ Chụp Ảnh Trungphoto tà xùa - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0355139660",
    "zalo": "0355139660",
    "facebook": "https://facebook.com/search/top?q=Trungphoto%20t%C3%A0%20x%C3%B9a",
    "rating": 4.93,
    "reviewCount": 99,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Trungphoto tà xùa tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793607875576-c064269a-4ff9-4119-92a4-0ebccdebf5ca.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/submissions/2026-11/1793607875576-c064269a-4ff9-4119-92a4-0ebccdebf5ca.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-5",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3120,
      "callClicks": 578,
      "bookingsCount": 170
    }
  },
  {
    "id": "tx-photo-161",
    "title": "Thợ Chụp Ảnh Trần Duy Tiệp - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0383580145",
    "zalo": "0383580145",
    "facebook": "https://facebook.com/search/top?q=Tr%E1%BA%A7n%20Duy%20Ti%E1%BB%87p",
    "rating": 4.98,
    "reviewCount": 105,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Trần Duy Tiệp tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308020593-793710.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308020593-793710.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-6",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3200,
      "callClicks": 600,
      "bookingsCount": 180
    }
  },
  {
    "id": "tx-photo-162",
    "title": "Thợ Chụp Ảnh Sồng Chơ Porter - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0344389894",
    "zalo": "0344389894",
    "facebook": "https://facebook.com/search/top?q=S%E1%BB%93ng%20Ch%C6%A1%20Porter",
    "rating": 4.88,
    "reviewCount": 111,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Sồng Chơ Porter tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308131737-733227.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308131737-733227.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-7",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3280,
      "callClicks": 622,
      "bookingsCount": 190
    }
  },
  {
    "id": "tx-photo-163",
    "title": "Thợ Chụp Ảnh Giàng Táu - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0375271309",
    "zalo": "0375271309",
    "facebook": "https://facebook.com/search/top?q=Gi%C3%A0ng%20T%C3%A1u",
    "rating": 4.93,
    "reviewCount": 117,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Giàng Táu tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308213144-468243.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308213144-468243.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-8",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3360,
      "callClicks": 644,
      "bookingsCount": 200
    }
  },
  {
    "id": "tx-photo-164",
    "title": "Thợ Chụp Ảnh Hiệp CuVer - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0916394236",
    "zalo": "0916394236",
    "facebook": "https://facebook.com/search/top?q=Hi%E1%BB%87p%20CuVer",
    "rating": 4.98,
    "reviewCount": 123,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Hiệp CuVer tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308291351-871339.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1783308291351-871339.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-9",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3440,
      "callClicks": 666,
      "bookingsCount": 210
    }
  },
  {
    "id": "tx-photo-165",
    "title": "Thợ Chụp Ảnh Sơn Bùi - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0961165445",
    "zalo": "0961165445",
    "facebook": "https://facebook.com/search/top?q=S%C6%A1n%20B%C3%B9i",
    "rating": 4.88,
    "reviewCount": 129,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Sơn Bùi tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833970571-162804.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833970571-162804.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-10",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3520,
      "callClicks": 688,
      "bookingsCount": 220
    }
  },
  {
    "id": "tx-photo-166",
    "title": "Thợ Chụp Ảnh Ger Hang - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0384322093",
    "zalo": "0384322093",
    "facebook": "https://facebook.com/search/top?q=Ger%20Hang",
    "rating": 4.93,
    "reviewCount": 135,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Ger Hang tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833740239-144842.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833740239-144842.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-11",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3600,
      "callClicks": 710,
      "bookingsCount": 230
    }
  },
  {
    "id": "tx-photo-167",
    "title": "Thợ Chụp Ảnh Ng Đăng Nam - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0978107103",
    "zalo": "0978107103",
    "facebook": "https://facebook.com/search/top?q=Ng%20%C4%90%C4%83ng%20Nam",
    "rating": 4.98,
    "reviewCount": 141,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Ng Đăng Nam tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782834057911-577512.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782834057911-577512.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-12",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3680,
      "callClicks": 732,
      "bookingsCount": 240
    }
  },
  {
    "id": "tx-photo-168",
    "title": "Thợ Chụp Ảnh Sói - Săn Mây Tà Xùa",
    "category": "photo",
    "area": "Đỉnh Gió",
    "address": "Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng",
    "phone": "0933669881",
    "zalo": "0968881080",
    "facebook": "https://facebook.com/search/top?q=S%C3%B3i",
    "rating": 4.88,
    "reviewCount": 147,
    "hasCloudView": true,
    "minPrice": 350000,
    "priceNote": "Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật",
    "description": "Nhiếp ảnh gia chuyên nghiệp Sói tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833886756-975182.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782833886756-975182.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-photo-13",
    "tags": [
      "Chụp ảnh săn mây",
      "Flycam 4K",
      "Chỉnh màu",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3275,
      "lng": 104.478
    },
    "stats": {
      "views": 3760,
      "callClicks": 754,
      "bookingsCount": 250
    }
  },
  {
    "id": "tx-costume-169",
    "title": "Tiệm thuê đồ Vấn Vương",
    "category": "costume",
    "area": "Đỉnh Gió",
    "address": "Khu vực Đỉnh Gió & Trung tâm Xã Tà Xùa",
    "phone": "0865292896",
    "zalo": "0911745198",
    "facebook": "https://facebook.com/search/top?q=Ti%E1%BB%87m%20thu%C3%AA%20%C4%91%E1%BB%93%20V%E1%BA%A5n%20V%C6%B0%C6%A1ng",
    "rating": 4.95,
    "reviewCount": 110,
    "hasCloudView": true,
    "minPrice": 80000,
    "priceNote": "Thuê từ 80.000đ - 150.000đ/ngày, đầy đủ phụ kiện mũ, ô dù thổ cẩm, kiềng bạc",
    "description": "Tiệm thuê đồ Vấn Vương sở hữu bộ sưu tập váy H'Mông cách tân, trang phục Bohemian và vintage bay bổng cho du khách chụp ảnh săn mây. Đồ sạch thơm, tư vấn phối phụ kiện miễn phí.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782982603471-117089.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782982603471-117089.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-costume-1",
    "tags": [
      "Trang phục Mông",
      "Váy Bohemian",
      "Phụ kiện kiềng bạc",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.327,
      "lng": 104.477
    },
    "stats": {
      "views": 3100,
      "callClicks": 560,
      "bookingsCount": 140
    }
  },
  {
    "id": "tx-costume-170",
    "title": "Tiệm Chill",
    "category": "costume",
    "area": "Đỉnh Gió",
    "address": "Khu vực Đỉnh Gió & Trung tâm Xã Tà Xùa",
    "phone": "0367920398",
    "zalo": "0367920398",
    "facebook": "https://facebook.com/search/top?q=Ti%E1%BB%87m%20Chill",
    "rating": 4.95,
    "reviewCount": 125,
    "hasCloudView": true,
    "minPrice": 80000,
    "priceNote": "Thuê từ 80.000đ - 150.000đ/ngày, đầy đủ phụ kiện mũ, ô dù thổ cẩm, kiềng bạc",
    "description": "Tiệm Chill sở hữu bộ sưu tập váy H'Mông cách tân, trang phục Bohemian và vintage bay bổng cho du khách chụp ảnh săn mây. Đồ sạch thơm, tư vấn phối phụ kiện miễn phí.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782834582615-23324.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782834582615-23324.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-costume-2",
    "tags": [
      "Trang phục Mông",
      "Váy Bohemian",
      "Phụ kiện kiềng bạc",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.327,
      "lng": 104.477
    },
    "stats": {
      "views": 3190,
      "callClicks": 580,
      "bookingsCount": 152
    }
  },
  {
    "id": "tx-costume-171",
    "title": "Cloud Concept - Tà Xùa",
    "category": "costume",
    "area": "Đỉnh Gió",
    "address": "Khu vực Đỉnh Gió & Trung tâm Xã Tà Xùa",
    "phone": "0866999045",
    "zalo": "0866999045",
    "facebook": "https://facebook.com/search/top?q=Cloud%20Concept%20-%20T%C3%A0%20X%C3%B9a",
    "rating": 4.95,
    "reviewCount": 140,
    "hasCloudView": true,
    "minPrice": 80000,
    "priceNote": "Thuê từ 80.000đ - 150.000đ/ngày, đầy đủ phụ kiện mũ, ô dù thổ cẩm, kiềng bạc",
    "description": "Cloud Concept - Tà Xùa sở hữu bộ sưu tập váy H'Mông cách tân, trang phục Bohemian và vintage bay bổng cho du khách chụp ảnh săn mây. Đồ sạch thơm, tư vấn phối phụ kiện miễn phí.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782834957938-683198.jfif",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/homestays/1782834957938-683198.jfif"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-costume-3",
    "tags": [
      "Trang phục Mông",
      "Váy Bohemian",
      "Phụ kiện kiềng bạc",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.327,
      "lng": 104.477
    },
    "stats": {
      "views": 3280,
      "callClicks": 600,
      "bookingsCount": 164
    }
  },
  {
    "id": "tx-camera-172",
    "title": "Tiệm thuê đồ Vấn Vương",
    "category": "camera",
    "area": "Trung Tâm Tà Xùa",
    "address": "Khu trung tâm Xã Tà Xùa, Bắc Yên, Sơn La",
    "phone": "0865292896",
    "zalo": "0865292896",
    "facebook": "https://facebook.com/search/top?q=Ti%E1%BB%87m%20thu%C3%AA%20%C4%91%E1%BB%93%20V%E1%BA%A5n%20V%C6%B0%C6%A1ng",
    "rating": 4.88,
    "reviewCount": 76,
    "hasCloudView": false,
    "minPrice": 250000,
    "priceNote": "Cho thuê máy ảnh Sony, Canon & Flycam DJI quay chụp biển mây",
    "description": "Tiệm thuê đồ Vấn Vương chuyên cho thuê máy ảnh mirrorless và flycam chất lượng cao tại Tà Xùa. Thủ tục nhanh gọn, hướng dẫn thông số chụp săn mây tối ưu.",
    "coverImage": "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782980770857-217378.jpg.w1080.webp",
    "images": [
      "https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1782980770857-217378.jpg.w1080.webp"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-04",
    "isInstantBooking": true,
    "partnerId": "partner-camera-1",
    "tags": [
      "Thuê máy ảnh",
      "Flycam DJI",
      "Sony A7",
      "Trung Tâm Tà Xùa"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3255,
      "lng": 104.4835
    },
    "stats": {
      "views": 1850,
      "callClicks": 340,
      "bookingsCount": 52
    }
  },
  {
    "id": "tx-taxi-1",
    "title": "Taxi Bản & Xe Ô Tô Đón Trả Tà Xùa - Bắc Yên 24/7",
    "category": "taxi",
    "area": "Trung Tâm Tà Xùa",
    "address": "Ngã 3 Tà Xùa & Bến xe thị trấn Bắc Yên",
    "phone": "0979 334 556",
    "zalo": "0979334556",
    "facebook": "https://facebook.com/taxitaxuabacyen247",
    "rating": 4.9,
    "reviewCount": 94,
    "hasCloudView": false,
    "minPrice": 200000,
    "priceNote": "Xe 4 chỗ & 7 chỗ gầm cao, đón trả tận homestay, đưa đón Sống Lưng & Mỏm Cá Heo",
    "description": "Đội xe taxi bản địa tay lái cừ khôi chuyên đường đèo sương mù. Nhận đưa đón trọn gói Bắc Yên - Tà Xùa, đi Sống Lưng Khủng Long, Cây Táo Mèo Cô Đơn, Háng Đồng an toàn và đúng hẹn.",
    "coverImage": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-06",
    "isInstantBooking": true,
    "claimedByOwner": true,
    "ownerVerificationStatus": "verified_owner",
    "partnerId": "partner-taxi-01",
    "tags": [
      "Xe 7 chỗ gầm cao",
      "Bác tài bản địa",
      "Đón tận homestay",
      "Hỗ trợ 24/7"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.325,
      "lng": 104.482
    },
    "stats": {
      "views": 2450,
      "callClicks": 490,
      "bookingsCount": 135
    }
  },
  {
    "id": "tx-rescue-1",
    "title": "Đội Cứu Hộ Đèo Chẹn & Đường Núi Tà Xùa 24/7",
    "category": "rescue",
    "area": "Trung Tâm Tà Xùa",
    "address": "Trực 24/7 tại Trạm Cứu Hộ Đèo Chẹn & Ngã 3 Xã Tà Xùa",
    "phone": "1900 8899",
    "zalo": "0988001122",
    "facebook": "https://facebook.com/cuuhodeochen247",
    "rating": 5,
    "reviewCount": 310,
    "hasCloudView": false,
    "minPrice": 0,
    "priceNote": "Hỗ trợ khẩn cấp 24/7: chết máy, lầy bùn, thủng săm, hết xăng giữa đèo",
    "description": "Đội ngũ thợ cơ khí và tình nguyện viên bản địa trang bị xe cẩu tời, dây cáp, xăng dự phòng và phụ tùng thay thế. Có mặt trong 15-30 phút tại mọi cung đèo hiểm trở Bắc Yên - Tà Xùa.",
    "coverImage": "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-06",
    "isInstantBooking": false,
    "partnerId": "partner-rescue-01",
    "tags": [
      "Cứu hộ 24/7",
      "Kéo xe lầy bùn",
      "Hỗ trợ săm lốp",
      "Miễn phí tư vấn"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.322,
      "lng": 104.471
    },
    "stats": {
      "views": 6100,
      "callClicks": 1850,
      "bookingsCount": 420
    }
  },
  {
    "id": "tx-bike-1",
    "title": "Thuê Xe Máy Leo Núi & Cào Cào Tà Xùa (Biker Hub)",
    "category": "motorbike",
    "area": "Trung Tâm Tà Xùa",
    "address": "Ngã 3 Tà Xùa (cạnh quán Trà Mây)",
    "phone": "0978 223 344",
    "zalo": "0978223344",
    "facebook": "https://facebook.com/thuexemaytaxua",
    "rating": 4.85,
    "reviewCount": 165,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "Honda Wave 110cc, Blade, Winner X, Cào cào XR150 (kèm 2 mũ BH, áo mưa, găng tay)",
    "description": "Dàn xe số và xe côn tay leo núi được bảo dưỡng thắng đĩa, xích líp và lốp gai định kỳ mỗi tuần. Miễn phí bình xăng ban đầu, hỗ trợ giao xe tận homestay.",
    "coverImage": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-06",
    "isInstantBooking": true,
    "partnerId": "partner-bike-01",
    "tags": [
      "Xe số leo đèo",
      "Cào cào XR150",
      "Giao tận nơi",
      "Bảo dưỡng định kỳ"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.323,
      "lng": 104.474
    },
    "stats": {
      "views": 4200,
      "callClicks": 890,
      "bookingsCount": 240
    }
  },
  {
    "id": "tx-taxi-2",
    "title": "Đội Xe Gầm Cao 7 Chỗ Săn Mây Đỉnh Gió – Sống Lưng (A Páo Car)",
    "category": "taxi",
    "area": "Đỉnh Gió",
    "address": "Dốc Đỉnh Gió & Ngã 3 Trung Tâm Xã Tà Xùa",
    "phone": "0985 612 889",
    "zalo": "0985612889",
    "facebook": "https://facebook.com/apaocartaxua",
    "rating": 4.95,
    "reviewCount": 128,
    "hasCloudView": true,
    "minPrice": 250000,
    "priceNote": "Chuyên đón khách 04:30 sáng đi Sống Lưng Khủng Long, Thảo Nguyên, Mỏm Cá Heo",
    "description": "Đội xe Fortuner, Xpander, Everest 7 chỗ gầm cao của anh em tài xế bản địa Đỉnh Gió. Đón tận cửa Homestay từ 4h30 sáng đi săn mây bình minh không lo lạnh hay sương mù dày.",
    "coverImage": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "claimedByOwner": true,
    "ownerVerificationStatus": "verified_owner",
    "partnerId": "partner-taxi-02",
    "tags": [
      "Đón săn mây 04:30",
      "SUV 7 chỗ gầm cao",
      "Chuyến Sáng",
      "Đón tận Homestay"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.327,
      "lng": 104.478
    },
    "stats": {
      "views": 3180,
      "callClicks": 640,
      "bookingsCount": 182
    }
  },
  {
    "id": "tx-taxi-3",
    "title": "Xe Hợp Đồng & Taxi Gia Đình Thảo Nguyên – Cây Cô Đơn (Tây Bắc Car)",
    "category": "taxi",
    "area": "Thảo Nguyên",
    "address": "Cung đường Thảo Nguyên - Thủy điện Suối Sập & Trung tâm xã",
    "phone": "0963 778 219",
    "zalo": "0963778219",
    "facebook": "https://facebook.com/taybaccartaxua",
    "rating": 4.88,
    "reviewCount": 86,
    "hasCloudView": false,
    "minPrice": 300000,
    "priceNote": "Thuê xe 5-7 chỗ theo chuyến hoặc trọn gói nửa ngày / cả ngày đi các điểm",
    "description": "Phù hợp cho nhóm bạn hoặc gia đình có người lớn tuổi, trẻ nhỏ muốn di chuyển êm ái giữa các điểm Thảo Nguyên, Mỏm Cá Heo, Cây Cô Đơn và Bản Khe Cải. Tài xế kiêm nhiếp ảnh nhiệt tình.",
    "coverImage": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "partnerId": "partner-taxi-03",
    "tags": [
      "Bao xe trọn ngày",
      "Gia đình & Nhóm",
      "Thảo Nguyên - Cá Heo",
      "Giá niêm yết"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.348,
      "lng": 104.465
    },
    "stats": {
      "views": 2150,
      "callClicks": 420,
      "bookingsCount": 115
    }
  },
  {
    "id": "tx-taxi-4",
    "title": "Xe Bán Tải & SUV 2 Cầu Chuyên Tuyến Háng Đồng – Xím Vàng",
    "category": "taxi",
    "area": "Sống Lưng Khủng Long",
    "address": "Ngã 3 Háng Đồng & Đầu dốc Sống Lưng Khủng Long",
    "phone": "0917 445 901",
    "zalo": "0917445901",
    "facebook": "https://facebook.com/bantaiximvang",
    "rating": 4.92,
    "reviewCount": 74,
    "hasCloudView": true,
    "minPrice": 220000,
    "priceNote": "Xe bán tải Ford Ranger 2 cầu chở người & hành lý vượt đèo Háng Đồng - Xím Vàng",
    "description": "Chuyên trị các cung đường dốc gắt xuống Sống Lưng Khủng Long, thác Háng Đồng và ruộng bậc thang Xím Vàng. Nhận trung chuyển đoàn trekking Sa Mu – U Bò 24/7.",
    "coverImage": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "partnerId": "partner-taxi-04",
    "tags": [
      "Bán tải 2 cầu 4x4",
      "Sống Lưng - Háng Đồng",
      "Trung chuyển Trekking",
      "Hỗ trợ 24/7"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.368,
      "lng": 104.512
    },
    "stats": {
      "views": 1980,
      "callClicks": 390,
      "bookingsCount": 98
    }
  },
  {
    "id": "tx-bike-2",
    "title": "Trạm Xe Máy Số & Tay Côn Đỉnh Gió (Giao Nhận Tận Cửa Homestay)",
    "category": "motorbike",
    "area": "Đỉnh Gió",
    "address": "Khu Đỉnh Gió (gần Mị Ơi & Mẩy Homestay)",
    "phone": "0968 331 992",
    "zalo": "0968331992",
    "facebook": "https://facebook.com/xemaydinhgiotaxua",
    "rating": 4.92,
    "reviewCount": 142,
    "hasCloudView": false,
    "minPrice": 150000,
    "priceNote": "30 xe Wave Alpha 2025, Sirius FI, Winner X · Giao xe miễn phí tại Đỉnh Gió & Khe Cải",
    "description": "Nằm ngay trung tâm khu Đỉnh Gió, giao xe tới tận sảnh Homestay trong 5 phút. Áp dụng chuẩn quy tắc trả xe trước 12h trưa chỉ tính 0.5 ngày (90.000đ). Xe luôn đầy bình xăng và kèm 2 mũ bảo hiểm kính chắn sương.",
    "coverImage": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "claimedByOwner": true,
    "ownerVerificationStatus": "verified_owner",
    "partnerId": "partner-bike-02",
    "tags": [
      "Giao tận Homestay",
      "Trả trước 12h = 0.5 ngày",
      "Combo Xe + Xe máy (-30k)",
      "Đỉnh Gió"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3265,
      "lng": 104.4778
    },
    "stats": {
      "views": 3650,
      "callClicks": 780,
      "bookingsCount": 215
    }
  },
  {
    "id": "tx-bike-3",
    "title": "Cơ Sở Thuê Xe Máy Minh Tâm – Cổng Chào Tà Xùa (Nhận Xe Từ 04:30 Sáng)",
    "category": "motorbike",
    "area": "Trung Tâm Tà Xùa",
    "address": "Cổng chào xã Tà Xùa (điểm trả khách xe Cabin đêm)",
    "phone": "0942 889 105",
    "zalo": "0942889105",
    "facebook": "https://facebook.com/xemayminhtamtaxua",
    "rating": 4.89,
    "reviewCount": 118,
    "hasCloudView": false,
    "minPrice": 140000,
    "priceNote": "Mở cửa đón khách đi chuyến đêm từ 04:30 sáng · Có phòng chờ vệ sinh cá nhân miễn phí",
    "description": "Điểm nhận xe lý tưởng nhất cho du khách đi xe Cabin đôi chuyến 22:00 đêm từ Hà Nội lên tới Tà Xùa lúc 04:30 sáng. Có phòng nghỉ ấm, nước nóng vệ sinh cá nhân miễn phí trước khi lấy xe máy đi săn mây Sống Lưng.",
    "coverImage": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "partnerId": "partner-bike-03",
    "tags": [
      "Nhận xe 04:30 sáng",
      "Có phòng chờ miễn phí",
      "Chuyến Đêm",
      "Combo Xe + Xe máy (-30k)"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.3242,
      "lng": 104.4751
    },
    "stats": {
      "views": 2980,
      "callClicks": 610,
      "bookingsCount": 176
    }
  },
  {
    "id": "tx-bike-4",
    "title": "Đội Xe Ôm Bản Địa Sống Lưng Khủng Long & Đỉnh Gió (Porter Bike)",
    "category": "motorbike",
    "area": "Sống Lưng Khủng Long",
    "address": "Đầu dốc Sống Lưng Khủng Long & Ngã 3 Trung Tâm",
    "phone": "0398 552 714",
    "zalo": "0398552714",
    "facebook": "https://facebook.com/porterbiketaxua",
    "rating": 4.96,
    "reviewCount": 204,
    "hasCloudView": true,
    "minPrice": 60000,
    "priceNote": "Xe ôm bản địa chở xuống tận Sống Lưng (60k khứ hồi) hoặc chở đi săn mây nửa ngày (200k)",
    "description": "Dành cho du khách tay lái yếu không muốn tự điều khiển xe máy qua các con dốc đứng. Đội thanh niên H'Mông bản địa vững tay lái, xe số lắp lốp gai bám đường, kiêm chụp ảnh hộ nhiệt tình.",
    "coverImage": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    "images": [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
    ],
    "verificationTier": 3,
    "updatedCalendarDate": "2026-11-08",
    "isInstantBooking": true,
    "partnerId": "partner-bike-04",
    "tags": [
      "Tài xế bản địa chở",
      "Xuống dốc Sống Lưng",
      "An toàn cho nữ",
      "Hỗ trợ chụp ảnh"
    ],
    "status": "approved",
    "coordinates": {
      "lat": 21.369,
      "lng": 104.513
    },
    "stats": {
      "views": 3890,
      "callClicks": 920,
      "bookingsCount": 310
    }
  }
];

function buildDefaultMenuForCategory(listing: Listing): MenuItem[] {
  if (listing.category === 'coffee') {
    return [
      {
        id: `${listing.id}-m1`,
        name: 'Cà Phê Muối Kem Béo Đỉnh Gió',
        category: 'drink',
        price: 55000,
        unit: 'Ly nóng / đá',
        isAvailable: true,
        isBestSeller: true,
        description: 'Cà phê Arabica Sơn La pha phin truyền thống quyện lớp kem muối mặn ngọt ấm áp giữa biển mây.'
      },
      {
        id: `${listing.id}-m2`,
        name: 'Trà Shan Tuyết Cổ Thụ Tà Xùa (Ấm Gốm)',
        category: 'drink',
        price: 65000,
        unit: 'Ấm 1-2 người',
        isAvailable: true,
        isBestSeller: true,
        description: 'Búp trà cổ thụ trên 200 năm tuổi hái tại đỉnh Tà Xùa, hương cốm non, hậu ngọt sâu.'
      },
      {
        id: `${listing.id}-m3`,
        name: 'Cacao Nóng Kem Trứng Nướng',
        category: 'drink',
        price: 55000,
        unit: 'Cốc nóng',
        isAvailable: true,
        description: 'Thức uống giữ ấm cơ thể lý tưởng khi săn mây sáng sớm 5h30.'
      },
      {
        id: `${listing.id}-m4`,
        name: 'Trà Táo Mèo Mật Ong Rừng Quế Ấm',
        category: 'drink',
        price: 50000,
        unit: 'Ly nóng',
        isAvailable: true,
        description: 'Táo mèo ngâm mật ong rừng Tây Bắc kết hợp thanh quế thơm nồng.'
      },
      {
        id: `${listing.id}-m5`,
        name: 'Combo Bánh Sừng Bò Nướng Bơ & Hạt Hướng Dương',
        category: 'combo',
        price: 45000,
        unit: 'Phần',
        isAvailable: true,
        description: 'Bánh nướng nóng giòn nhâm nhi cùng trà nóng ngắm mây luồn.'
      }
    ];
  }
  return [
    {
      id: `${listing.id}-m1`,
      name: 'Lẩu Gà Đen H’Mông Nấu Nấm Rừng & Thuốc Bắc',
      category: 'food',
      price: 450000,
      unit: 'Nồi (2-4 người)',
      isAvailable: true,
      isBestSeller: true,
      description: 'Gà đen bản địa thịt săn chắc, nước dùng ngọt thanh từ xương hầm, táo đỏ, kỷ tử và rau cải mèo Tà Xùa.'
    },
    {
      id: `${listing.id}-m2`,
      name: 'Lẩu Cá Tầm Suối Sập Măng Chua Tây Bắc',
      category: 'food',
      price: 550000,
      unit: 'Nồi (3-5 người)',
      isAvailable: true,
      isBestSeller: true,
      description: 'Cá tầm tươi sống bắt tại hồ Suối Sập, thịt giòn sần sật, ăn kèm măng rừng chua cay.'
    },
    {
      id: `${listing.id}-m3`,
      name: 'Thịt Lợn Bản Nướng Mắc Khén Hạt Dổi',
      category: 'specialty',
      price: 180000,
      unit: 'Đĩa lớn',
      isAvailable: true,
      description: 'Thịt ba chỉ lợn cắp nách ướp mắc khén nướng than hoa thơm lừng, chấm chẩm chéo.'
    },
    {
      id: `${listing.id}-m4`,
      name: 'Set BBQ Nướng Săn Mây Trọn Gói (Bò, Lợn Bản, Gà Đồi, Rau Củ)',
      category: 'combo',
      price: 195000,
      unit: 'Suất / người',
      isAvailable: true,
      description: 'Thực đơn nướng bếp than hồng ngoài trời buổi tối se lạnh tại Tà Xùa.'
    },
    {
      id: `${listing.id}-m5`,
      name: 'Cải Mèo Tà Xùa Xào Tỏi / Luộc Chấm Trứng',
      category: 'food',
      price: 60000,
      unit: 'Đĩa',
      isAvailable: true,
      description: 'Đặc sản rau cải mèo trồng trên nương đá cao, vị ngăm đắng nhẹ hậu ngọt giòn.'
    }
  ];
}

function buildDefaultPackagesForCategory(listing: Listing): ServicePackageItem[] {
  const base = listing.minPrice > 0 ? listing.minPrice : 200000;
  switch (listing.category) {
    case 'bus':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Vé Giường Nằm 2 Tầng / Limousine VIP (1 Chiều)',
          price: base,
          unit: 'ghế / lượt',
          durationNote: 'Khởi hành 06:30, 13:00, 22:00 hàng ngày • Đón trả tận nơi',
          includedFeatures: ['Chọn vị trí ghế Tầng 1 / Tầng 2', 'Nước suối, chăn đắp, cổng sạc USB', 'Đón trả tận Homestay trung tâm Tà Xùa'],
          availableCount: 9
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Combo Vé Xe Khứ Hồi + Thuê Xe Máy Nhận Tại Bản (-30k)',
          price: base * 2 + 150000 - 30000,
          unit: 'combo trọn gói',
          durationNote: 'Vé khứ hồi 2 chiều + 1 ngày xe máy (trả trước 12h trưa tính nửa ngày)',
          includedFeatures: ['Tiết kiệm ngay 30.000đ khi đặt kèm xe máy', 'Nhận xe máy ngay khi xuống xe khách', 'Kèm 2 mũ bảo hiểm & áo mưa'],
          availableCount: 6
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Cabin Đôi VIP Riêng Tư (Dành cho 2 người)',
          price: Math.round(base * 1.75),
          unit: 'cabin đôi',
          durationNote: 'Khoang riêng có rèm che, màn hình giải trí & ghế massage',
          includedFeatures: ['Không gian riêng tư cho cặp đôi', 'Đón tại Mỹ Đình / Cầu Giấy / Nội Bài', 'Miễn phí trung chuyển Đỉnh Gió'],
          availableCount: 4
        }
      ];
    case 'motorbike':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Thuê Xe Số Leo Đèo (Honda Wave Alpha / Blade / Sirius)',
          price: 150000,
          unit: 'ngày (24h)',
          durationNote: 'Trả xe trước 12:00 trưa hôm sau chỉ tính 0.5 ngày (90.000đ)',
          includedFeatures: ['Xe mới bảo dưỡng phanh & lốp gai', 'Kèm 2 mũ bảo hiểm kính chắn gió & áo mưa', 'Giao nhận xe tận Homestay'],
          availableCount: 14
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Thuê Xe Tay Côn / Bán Tự Động Vượt Đèo (Winner X / Exciter)',
          price: 250000,
          unit: 'ngày (24h)',
          durationNote: 'Động cơ 150cc khỏe khoắn chinh phục Sống Lưng & Háng Đồng',
          includedFeatures: ['Phanh ABS an toàn đường sương mù', 'Kèm giá đỡ điện thoại & dây buộc đồ', 'Hỗ trợ kỹ thuật dọc đường 24/7'],
          availableCount: 5
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Thuê Xe Cào Cào Chuyên Dụng Honda XR150L',
          price: 350000,
          unit: 'ngày (24h)',
          durationNote: 'Chuyên trị địa hình dốc đá, Thảo Nguyên & Mỏm Cá Heo',
          includedFeatures: ['Phuộc hành trình dài êm ái', 'Lốp gai địa hình bám đường tuyệt đối', 'Bảo hiểm hỗ trợ cứu hộ đèo'],
          availableCount: 3
        }
      ];
    case 'taxi':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Xe 4-7 Chỗ Đón/Trả Thị Trấn Bắc Yên ↔ Trung Tâm Tà Xùa',
          price: 250000,
          unit: 'chuyến',
          durationNote: 'Di chuyển 15km đèo (~35 phút) • Phục vụ 24/7 cả đêm muộn',
          includedFeatures: ['Bác tài bản địa thông thuộc từng khúc cua', 'Xe gầm cao êm ái chống say xe', 'Đón trả tận cửa Homestay'],
          availableCount: 6
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Đưa Đón Săn Mây Khứ Hồi: Trung Tâm ↔ Sống Lưng Khủng Long',
          price: 350000,
          unit: 'chuyến khứ hồi',
          durationNote: 'Đón từ 05:00 sáng • Chờ khách chụp ảnh & ăn sáng thoải mái',
          includedFeatures: ['Không lo tự lái xe máy trời sương mù lạnh', 'Ghé điểm check-in trên cung đường Háng Đồng', 'Chia sẻ chỉ từ 60k-80k/người khi đi nhóm'],
          availableCount: 5
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Thuê Xe Ô Tô 7 Chỗ Kèm Tài Xế Đi Trọn Ngày Các Điểm Tà Xùa',
          price: 900000,
          unit: 'ngày',
          durationNote: 'Lịch trình linh hoạt: Đỉnh Gió - Sống Lưng - Thảo Nguyên - Cây Cô Đơn',
          includedFeatures: ['Bao gồm toàn bộ xăng xe & tài xế kiêm thổ địa', 'Tư vấn giờ mây đẹp nhất từng tọa độ', 'Phù hợp gia đình có trẻ nhỏ / người lớn tuổi'],
          availableCount: 3
        }
      ];
    case 'tour':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Tour Săn Mây Thực Địa 1 Ngày (Sống Lưng - Thảo Nguyên - Cây Cô Đơn)',
          price: base,
          unit: 'khách',
          durationNote: '05:00 - 17:30 • Khởi hành hàng ngày từ trung tâm Tà Xùa',
          includedFeatures: ['Thổ địa / Guider bản địa dẫn đường & hỗ trợ chụp ảnh', 'Xe di chuyển giữa các điểm săn mây', 'Bữa trưa đặc sản bản địa & nước uống'],
          availableCount: 12
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Tour Trekking Chinh Phục Đỉnh Sa Mu – U Bò / Phu Sa Phìn (2N1Đ)',
          price: 1350000,
          unit: 'khách trọn gói',
          durationNote: '2 Ngày 1 Đêm ngủ lều/lán gỗ rừng nguyên sinh rêu cổ thụ',
          includedFeatures: ['Porter người Mông gùi đồ & nấu ăn suốt tuyến', 'Lều trại cách nhiệt, túi ngủ ấm & gậy trekking', 'Bảo hiểm du lịch & giấy phép kiểm lâm'],
          availableCount: 10
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Thuê Porter / Thổ Địa Dẫn Đoàn Riêng & Quay Chụp Săn Mây',
          price: 400000,
          unit: 'buổi (4-5 tiếng)',
          durationNote: 'Đón tại Homestay lúc 05:00 sáng đi thẳng tọa độ đang có biển mây',
          includedFeatures: ['Cam kết dẫn tới đúng điểm có mây theo hướng gió', 'Hỗ trợ cầm đồ, tạo dáng & chụp ảnh bằng iPhone/máy cơ', 'An toàn tuyệt đối trên các mỏm đá'],
          availableCount: 6
        }
      ];
    case 'photo':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Gói Chụp Săn Mây Cá Nhân (1-2 Tọa Độ Đẹp Nhất)',
          price: base,
          unit: 'gói / buổi',
          durationNote: 'Chụp 2-3 tiếng khung giờ vàng bình minh (05:30) hoặc hoàng hôn (16:00)',
          includedFeatures: ['Giao toàn bộ 200+ file gốc chất lượng cao ngay sau buổi chụp', 'Chỉnh màu & retouch kỹ 15-20 ảnh thần thái nhất', 'Hướng dẫn tạo dáng tự nhiên cho người ít chụp ảnh'],
          availableCount: 4
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Gói Chụp Cặp Đôi / Bạn Thân (Đỉnh Gió - Thảo Nguyên - Sống Lưng)',
          price: Math.round(base * 1.7),
          unit: 'gói / cặp đôi',
          durationNote: 'Theo sát hành trình nửa ngày • Tặng kèm 1 video Reel/TikTok săn mây',
          includedFeatures: ['Toàn bộ file gốc + 30 ảnh chỉnh màu điện ảnh (Film/Nàng thơ)', 'Tặng 1 clip ngắn quay dọc bắt trọn khoảnh khắc biển mây', 'Tư vấn phối trang phục hợp bối cảnh từng điểm'],
          availableCount: 3
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Gói Chụp Nhóm Đông & Quay Flycam Toàn Cảnh Biển Mây 4K',
          price: 900000,
          unit: 'đoàn (3-6 người)',
          durationNote: 'Máy ảnh Full-frame + Flycam DJI quay góc rộng trên Sống Lưng Khủng Long',
          includedFeatures: ['Không giới hạn số lượng file chụp nhóm & cá nhân', '35 ảnh retouch + 3-5 cảnh bay Flycam 4K xuyên biển mây', 'Thợ ảnh kiêm thổ địa dẫn đi góc vắng người'],
          availableCount: 2
        }
      ];
    case 'costume':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Set Trang Phục Cô Gái H’Mông / Tây Bắc Đầy Đủ Phụ Kiện',
          price: base,
          unit: 'bộ / ngày',
          durationNote: 'Bao gồm váy thổ cẩm giặt thơm sạch + mũ bạc + kiềng cổ + gùi hoa/ô',
          includedFeatures: ['Hơn 100 mẫu váy Mông trắng, Mông hoa, Mông đen mới nhất', 'Miễn phí mượn kèm gùi hoa cải, khèn hoặc ô thổ cẩm', 'Hỗ trợ mặc đồ & tết tóc tại tiệm từ 5h00 sáng'],
          availableCount: 20
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Set Đầm Bohemian / Vintage / Nàng Thơ Chụp Thảo Nguyên & Đỉnh Gió',
          price: base + 30000,
          unit: 'bộ / ngày',
          durationNote: 'Đầm maxi bay bổng kèm áo khoác lông / khăn choàng len ấm áp',
          includedFeatures: ['Phối sẵn phụ kiện mũ cao bồi, bốt cổ cao & khăn choàng', 'Chất vải dày dặn giữ ấm tốt trong tiết trời 12-16°C', 'Đổi trả linh hoạt tại trung tâm xã Tà Xùa'],
          availableCount: 15
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Combo Thuê 2 Bộ Trang Phục (1 Bộ Bình Minh + 1 Bộ Hoàng Hôn)',
          price: Math.round(base * 1.8),
          unit: 'combo 2 bộ / ngày',
          durationNote: 'Tiết kiệm chi phí cho cả lịch trình Sống Lưng buổi sáng & Cafe buổi chiều',
          includedFeatures: ['Tự do chọn 2 phong cách khác nhau trong tiệm', 'Miễn phí toàn bộ phụ kiện trang sức & đạo cụ chụp ảnh', 'Giữ đồ cá nhân miễn phí tại cửa hàng'],
          availableCount: 10
        }
      ];
    case 'camera':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Thuê Máy Ảnh Fujifilm X-T30 II / X-S10 + Lens Chân Dung Xóa Phông',
          price: base,
          unit: 'máy / 24h',
          durationNote: 'Đã cài sẵn công thức màu Film Classic Negative / Nostalgic Neg chụp ăn ngay',
          includedFeatures: ['Kèm thẻ nhớ 64GB, 2 viên pin đầy, dây đeo & túi chống sốc', 'Có sẵn đầu đọc thẻ chuyển ảnh thẳng sang iPhone/Android trong 1 phút', 'Hướng dẫn sử dụng chi tiết cho người mới'],
          availableCount: 5
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Thuê Máy Ảnh Sony A6400 / Canon R50 Quay Chụp Săn Mây Nét Căng',
          price: base + 40000,
          unit: 'máy / 24h',
          durationNote: 'Lấy nét mắt siêu nhanh, quay video 4K mượt mà dưới ánh sáng bình minh',
          includedFeatures: ['Kèm lens đa dụng Sigma 18-50mm f/2.8', 'Miễn phí mượn chân máy Tripod gọn nhẹ chụp phơi sáng/tự chụp', 'Nhận máy từ tối hôm trước để kịp đi săn mây 5h sáng'],
          availableCount: 4
        },
        {
          id: `${listing.id}-pkg-3`,
          name: 'Thuê Flycam DJI Mini 3 Pro / Mini 4 Pro (Kèm 2 Pin Fly More)',
          price: 380000,
          unit: 'bộ / buổi',
          durationNote: 'Quay dọc 4K HDR bắt trọn Sống Lưng Khủng Long & biển mây cuộn',
          includedFeatures: ['Điều khiển có màn hình DJI RC tiện lợi không cần gắn điện thoại', 'Hỗ trợ hướng dẫn cất/hạ cánh an toàn tránh gió lốc đèo', 'Chép file gốc 4K tốc độ cao ngay khi trả máy'],
          availableCount: 2
        }
      ];
    case 'rescue':
      return [
        {
          id: `${listing.id}-pkg-1`,
          name: 'Cứu Hộ Lưu Động: Vá Lốp, Thay Săm, Cấp Xăng & Kích Bình Giữa Đèo',
          price: 100000,
          unit: 'lần hỗ trợ',
          durationNote: 'Có mặt sau 15-25 phút tại Đèo Chẹn, Sống Lưng, Thảo Nguyên, Khe Cải',
          includedFeatures: ['Tư vấn xử lý sự cố an toàn qua điện thoại miễn phí 100%', 'Chỉ thu đúng chi phí xăng/săm phụ tùng niêm yết công khai', 'Hoạt động 24/7 bất kể mưa sương mù đêm khuya'],
          availableCount: 10
        },
        {
          id: `${listing.id}-pkg-2`,
          name: 'Xe Bán Tải / Cẩu Tời Kéo Xe Chết Máy Hoặc Sa Lầy Về Trung Tâm',
          price: 250000,
          unit: 'chuyến cứu hộ',
          durationNote: 'Trang bị tời điện chuyên dụng & thùng chở xe máy/hỗ trợ ô tô',
          includedFeatures: ['Đưa cả người và xe về trạm sửa chữa trung tâm an toàn', 'Đội ngũ thợ máy bản địa giàu kinh nghiệm', 'Cam kết không ép giá du khách gặp sự cố'],
          availableCount: 4
        }
      ];
    default:
      return [];
  }
}

const BUS_OPERATOR_PROFILES: Record<
  string,
  {
    minPrice: number;
    priceNote: string;
    tags: string[];
    totalBikes: number;
    bookedBikes: number;
  }
> = {
  'tx-bus-132': {
    minPrice: 300000,
    priceNote: 'Giường nằm 2 tầng 34 phòng & Limousine · Xuất bến 06:30, 22:00 tại Mỹ Đình / Cầu Giấy',
    tags: ['Giường nằm 2 tầng', 'Chuyến Sáng', 'Chuyến Đêm', 'Đón Mỹ Đình / Cầu Giấy', 'Combo Xe + Xe máy (-30k)'],
    totalBikes: 14,
    bookedBikes: 5
  },
  'tx-bus-133': {
    minPrice: 350000,
    priceNote: 'Limousine 9–11 ghế VIP massage · Khởi hành 07:00, 13:30, 21:30 · Đón Nội Bài & Mỹ Đình',
    tags: ['Limousine 9 chỗ', 'Chuyến Sáng', 'Chuyến Chiều', 'Đón Nội Bài', 'Đón Mỹ Đình / Cầu Giấy'],
    totalBikes: 12,
    bookedBikes: 4
  },
  'tx-bus-134': {
    minPrice: 320000,
    priceNote: 'Cabin đôi & Limousine · Đi 06:30, 21:30 tại BigC Thăng Long & Royal City · Về 13:00, 20:00',
    tags: ['Cabin Đôi VIP', 'Limousine 9 chỗ', 'Chuyến Sáng', 'Chuyến Đêm', 'Đón BigC / Royal City'],
    totalBikes: 16,
    bookedBikes: 5
  },
  'tx-bus-135': {
    minPrice: 350000,
    priceNote: 'Cabin đôi 22 phòng VIP & Limousine · Xuất bến 06:30, 07:00, 22:30 · Dàn xe máy mới 100%',
    tags: ['Cabin Đôi VIP', 'Chuyến Sáng', 'Chuyến Đêm', 'Đón Mỹ Đình / Cầu Giấy', 'Combo Xe + Xe máy (-30k)'],
    totalBikes: 20,
    bookedBikes: 6
  },
  'tx-bus-136': {
    minPrice: 360000,
    priceNote: 'Xe VIP 24 Cabin đôi & 34 phòng đơn · Xuất bến 07:00, 22:00 · Đón Yên Nghĩa, Mỹ Đình, Sơn Tây',
    tags: ['Cabin Đôi VIP', 'Giường nằm 2 tầng', 'Chuyến Đêm', 'Đón Yên Nghĩa', 'Đón Mỹ Đình / Cầu Giấy'],
    totalBikes: 15,
    bookedBikes: 4
  },
  'tx-bus-137': {
    minPrice: 380000,
    priceNote: 'Cung Điện Di Động Cabin Đôi 22 phòng · Chuyến đêm 22:00 ngủ thẳng tới Đỉnh Gió đón bình minh',
    tags: ['Cabin Đôi VIP', 'Chuyến Đêm', 'Trả tận Homestay', 'Đón Mỹ Đình / Cầu Giấy', 'Combo Xe + Xe máy (-30k)'],
    totalBikes: 12,
    bookedBikes: 3
  },
  'tx-bus-138': {
    minPrice: 300000,
    priceNote: 'Limousine 11 ghế ngả & Giường nằm · Khởi hành 07:00, 14:00, 22:00 tuyến Hà Nội – Tà Xùa',
    tags: ['Limousine 9 chỗ', 'Chuyến Sáng', 'Chuyến Chiều', 'Chuyến Đêm', 'Đón Mỹ Đình / Cầu Giấy'],
    totalBikes: 10,
    bookedBikes: 3
  },
  'tx-bus-139': {
    minPrice: 320000,
    priceNote: 'Cabin đơn/đôi & Limousine · Trung chuyển tận cửa Homestay Đỉnh Gió & Bản Khe Cải',
    tags: ['Cabin Đôi VIP', 'Trả tận Homestay', 'Chuyến Sáng', 'Chuyến Đêm', 'Combo Xe + Xe máy (-30k)'],
    totalBikes: 14,
    bookedBikes: 5
  },
  'tx-bus-140': {
    minPrice: 300000,
    priceNote: 'Thaco Bus đời mới · Đón trả Bắc Giang, Bắc Ninh, Việt Trì, Nội Bài, Hà Nội lên thẳng Tà Xùa',
    tags: ['Giường nằm 2 tầng', 'Đón Bắc Ninh / Việt Trì', 'Đón Nội Bài', 'Chuyến Sáng', 'Chuyến Đêm'],
    totalBikes: 12,
    bookedBikes: 4
  },
  'tx-bus-141': {
    minPrice: 300000,
    priceNote: 'Chuyên tuyến Hà Nội – Bắc Yên – Tà Xùa · Khởi hành 06:45, 13:30, 22:00 tại Mỹ Đình, Nhổn, Hòa Lạc',
    tags: ['Limousine 9 chỗ', 'Chuyến Sáng', 'Chuyến Chiều', 'Đón Mỹ Đình / Cầu Giấy', 'Trả tận Homestay'],
    totalBikes: 11,
    bookedBikes: 3
  },
  'tx-bus-142': {
    minPrice: 350000,
    priceNote: 'Xe ghép 5–7 chỗ & Limousine 9 chỗ · Đón trả tận sảnh chung cư Hà Nội, đi về theo giờ của đoàn',
    tags: ['Xe ghép đón tận nhà', 'Limousine 9 chỗ', 'Trả tận Homestay', 'Chuyến Sáng', 'Chuyến Chiều'],
    totalBikes: 8,
    bookedBikes: 2
  },
  'tx-bus-143': {
    minPrice: 280000,
    priceNote: 'Xe ngày 07:00 & Xe đêm 22:00 đi về trong ngày · Nhận chở khách, gửi hàng hóa & xe máy',
    tags: ['Giường nằm 2 tầng', 'Chuyến Sáng', 'Chuyến Đêm', 'Nhận gửi hàng / xe', 'Đón Mỹ Đình / Cầu Giấy'],
    totalBikes: 10,
    bookedBikes: 4
  },
  'tx-bus-144': {
    minPrice: 350000,
    priceNote: 'Xe ghép 4–7 chỗ đời mới · Tuyến Bắc Ninh ⇄ Hà Nội ⇄ Mộc Châu ⇄ Tà Xùa, đón tận nơi không nhồi nhét',
    tags: ['Xe ghép đón tận nhà', 'Đón Bắc Ninh / Việt Trì', 'Trả tận Homestay', 'Chuyến Sáng', 'Chuyến Chiều'],
    totalBikes: 8,
    bookedBikes: 2
  },
  'tx-bus-145': {
    minPrice: 330000,
    priceNote: 'Xe ghép linh hoạt Hà Nội – Phù Yên – Bắc Yên – Tà Xùa · Chiều về Tà Xùa – Hà Nội 07:00–09:00 sáng',
    tags: ['Xe ghép đón tận nhà', 'Chuyến Sáng', 'Chuyến Chiều', 'Trả tận Homestay', 'Nhận gửi hàng / xe'],
    totalBikes: 9,
    bookedBikes: 3
  },
  'tx-bus-146': {
    minPrice: 350000,
    priceNote: 'Limousine 9 ghế Boeing massage · Xuất bến 06:30, 13:00, 22:00 · Đón Mỹ Đình, Nội Bài & Hòa Lạc',
    tags: ['Limousine 9 chỗ', 'Chuyến Sáng', 'Chuyến Chiều', 'Đón Nội Bài', 'Combo Xe + Xe máy (-30k)'],
    totalBikes: 16,
    bookedBikes: 5
  },
  'tx-bus-147': {
    minPrice: 320000,
    priceNote: 'Xe ghép 5–7 chỗ gầm cao Bắc Yên (Tà Xùa) ⇄ Hà Nội · An tâm tay lái đèo sương mù, đón tận nơi',
    tags: ['Xe ghép đón tận nhà', 'Trả tận Homestay', 'Chuyến Sáng', 'Chuyến Chiều', 'Chuyến Đêm'],
    totalBikes: 10,
    bookedBikes: 3
  }
};

const ADMIN_FEATURED_DEFAULTS: Record<
  string,
  { priorityRank: number; featuredLabel: string }
> = {
  'homestay-may': {
    priorityRank: 100,
    featuredLabel: '👑 Admin Đề Xuất #1 · View Mây Tràn Giường'
  },
  'homestay-lutre': {
    priorityRank: 98,
    featuredLabel: '🔥 Top Nóc Nhà Săn Mây Đỉnh Gió'
  },
  'tx-stay-1': {
    priorityRank: 96,
    featuredLabel: '💎 Khu Nghỉ Dưỡng Bể Bơi & Kính Panorama'
  },
  'tx-stay-2': {
    priorityRank: 94,
    featuredLabel: '🌿 Bản Bẹ Trà Cổ Thụ · Đề Xuất'
  },
  'tx-stay-3': {
    priorityRank: 92,
    featuredLabel: '☁️ Bungalow Săn Mây Được Yêu Thích'
  },
  'tx-stay-4': {
    priorityRank: 90,
    featuredLabel: '⭐ Ưu Tiên Thẩm Định Cấp 3'
  },
  'coffee-mi-oi': {
    priorityRank: 88,
    featuredLabel: '☕ Top 1 Cafe Đỉnh Gió Ngắm Hoàng Hôn'
  },
  'tour-song-lung': {
    priorityRank: 86,
    featuredLabel: '🥾 Tour Trekking Chuẩn Thổ Địa H’Mông'
  },
  'tx-bus-139': {
    priorityRank: 84,
    featuredLabel: '🚌 Cabin Đôi & Limousine Hàng Đầu'
  },
  'motorbike-taxua-biker': {
    priorityRank: 82,
    featuredLabel: '🛵 Trạm Xe Máy Phượt Đèo Uy Tín #1'
  }
};

export const INITIAL_LISTINGS: Listing[] = RAW_LISTINGS.map((raw) => {
  const busProfile = raw.category === 'bus' ? BUS_OPERATOR_PROFILES[raw.id] : undefined;
  const adminFeatured = ADMIN_FEATURED_DEFAULTS[raw.id];
  const cleaned: Listing = {
    ...raw,
    minPrice: busProfile ? busProfile.minPrice : raw.minPrice,
    title: cleanHtmlEntities(raw.title),
    description: cleanHtmlEntities(raw.description),
    priceNote: busProfile ? busProfile.priceNote : cleanHtmlEntities(raw.priceNote),
    address: cleanHtmlEntities(raw.address),
    tags: busProfile ? busProfile.tags : (raw.tags || []).map((t) => cleanHtmlEntities(t)),
    isAdminFeatured: adminFeatured ? true : Boolean(raw.isAdminFeatured),
    adminPriorityRank: adminFeatured ? adminFeatured.priorityRank : raw.adminPriorityRank || 0,
    adminFeaturedLabel: adminFeatured ? adminFeatured.featuredLabel : raw.adminFeaturedLabel,
    roomTypes: raw.roomTypes?.map((rm) => ({
      ...rm,
      name: cleanHtmlEntities(rm.name),
      viewType: rm.viewType,
      amenities: rm.amenities.map((a) => cleanHtmlEntities(a))
    }))
  };

  if (cleaned.category === 'coffee' || cleaned.category === 'restaurant') {
    if (!cleaned.openingHours) {
      cleaned.openingHours =
        cleaned.category === 'coffee'
          ? {
              openTime: '05:30',
              closeTime: '22:00',
              is24Hours: false,
              serviceNote: 'Mở cửa sớm đón khách săn mây bình minh & ngắm hoàng hôn'
            }
          : {
              openTime: '06:30',
              closeTime: '23:00',
              is24Hours: false,
              serviceNote: 'Phục vụ điểm tâm sáng, lẩu gà đen, cá tầm & đồ nướng Tây Bắc'
            };
    }
    if (!cleaned.menuItems || cleaned.menuItems.length === 0) {
      cleaned.menuItems = buildDefaultMenuForCategory(cleaned);
    }
  } else if (cleaned.category !== 'homestay') {
    if (!cleaned.servicePackages || cleaned.servicePackages.length === 0) {
      cleaned.servicePackages = buildDefaultPackagesForCategory(cleaned);
    }
    if (
      (cleaned.category === 'bus' || cleaned.category === 'motorbike') &&
      !cleaned.motorbikeFleet
    ) {
      cleaned.motorbikeFleet = {
        totalBikes: busProfile ? busProfile.totalBikes : cleaned.category === 'motorbike' ? 25 : 14,
        bookedOnWeb: busProfile ? busProfile.bookedBikes : cleaned.category === 'motorbike' ? 6 : 3,
        rentedOfflineCount: cleaned.category === 'motorbike' ? 3 : 2,
        rentedOffline: cleaned.category === 'motorbike' ? 3 : 2,
        pricePerDay: cleaned.category === 'motorbike' ? 150000 : 180000,
        dailyRate: cleaned.category === 'motorbike' ? 150000 : 180000,
        halfDayRateBeforeNoon: cleaned.category === 'motorbike' ? 90000 : 100000,
        comboDiscountPerBike: 30000,
        comboDiscountAmount: 30000,
        enabled: true,
        models: ['Honda Wave Alpha 110cc', 'Honda Blade 2025', 'Yamaha Sirius FI', 'Honda Winner X']
      };
    }
  }

  return cleaned;
});

export const CLOUD_LANDMARKS: CloudLandmark[] = [
  {
    id: 'spot-dinh-gio',
    name: 'Đỉnh Gió Tà Xùa (Tọa độ Săn Mây & Hoàng Hôn 180°)',
    area: 'Đỉnh Gió',
    altitude: '1.650m',
    cloudProbability: 92,
    bestTime: '05:20 - 07:45 & 16:45 - 18:00',
    description: 'Tọa độ săn mây trung tâm đắc địa nhất Tà Xùa, tập trung nhiều homestay kính và quán cà phê mép vực (Mị Ơi, Hiên, Mẩy). Biển mây thường đọng lại dày đặc ngay dưới thung lũng.',
    roadCondition: 'Đường nhựa & bê tông dễ đi, xe máy và ô tô 16 chỗ vào tận nơi.',
    distanceFromCenter: 'Cách ngã ba trung tâm xã 1,5 km',
    coordinates: { lat: 21.3278, lng: 104.4775 },
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'spot-song-lung',
    name: 'Sống Lưng Khủng Long (Háng Đồng)',
    area: 'Sống Lưng Khủng Long',
    altitude: '1.800m',
    cloudProbability: 88,
    bestTime: '05:30 - 08:30',
    description: 'Biểu tượng huyền thoại của Tà Xùa với sống núi hẹp chạy dài gần 2km giữa hai vực mây cuộn sóng. Điểm trekking và bay flycam ngoạn mục bậc nhất Tây Bắc.',
    roadCondition: 'Cách trung tâm 13km đường đèo, đoạn xuống sống lưng dốc đứng (nên đi bộ hoặc thuê xe ôm bản địa 30k/lượt).',
    distanceFromCenter: 'Cách trung tâm xã 13 km về hướng Háng Đồng',
    coordinates: { lat: 21.3695, lng: 104.5132 },
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'spot-khe-cai',
    name: 'Thung Lũng Mây Bản Khe Cải',
    area: 'Khe Cải',
    altitude: '1.520m',
    cloudProbability: 84,
    bestTime: '06:00 - 08:00 & 16:30 - 17:45',
    description: 'Bản người H\'Mông yên bình nằm chếch về phía Tây, nơi ngắm biển mây nhuộm ánh hoàng hôn đỏ rực và những vườn hoa cúc họa mi, tam giác mạch.',
    roadCondition: 'Đường bê tông nhỏ có dốc, xe máy đi tốt.',
    distanceFromCenter: 'Cách trung tâm xã 3 km',
    coordinates: { lat: 21.3188, lng: 104.4685 },
    imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'spot-thao-nguyen',
    name: 'Thảo Nguyên Tà Xùa & Mỏm Cá Heo',
    area: 'Thảo Nguyên',
    altitude: '1.680m',
    cloudProbability: 76,
    bestTime: '07:00 - 17:00',
    description: 'Đồi cỏ xanh mướt trải dài bất tận kết hợp cùng Mỏm Đá Đầu Cá Heo tự nhiên. Không gian khoáng đạt lý tưởng để cắm trại dã ngoại và săn mây luồn.',
    roadCondition: 'Đường nhựa liên xã đẹp, đi bộ thêm 400m lên đồi cỏ.',
    distanceFromCenter: 'Cách trung tâm xã 9 km (cung đường đi Thủy điện Suối Sập)',
    coordinates: { lat: 21.3510, lng: 104.4620 },
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 'spot-cay-co-don',
    name: 'Cây Cô Đơn & Đỉnh Gió Háng Đồng',
    area: 'Mống Vàng',
    altitude: '1.620m',
    cloudProbability: 80,
    bestTime: '06:00 - 09:00 & 16:00 - 17:30',
    description: 'Cây táo mèo đứng lẻ loi trên mỏm đồi nhìn thẳng xuống dòng sông Suối Sập ẩn hiện dưới làn mây trắng và sương mù.',
    roadCondition: 'Ngay sát trục đường chính đi Thủy điện Suối Sập, gửi xe đi bộ 3 phút.',
    distanceFromCenter: 'Cách trung tâm xã 11 km',
    coordinates: { lat: 21.3585, lng: 104.4565 },
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80'
  }
];

export const BUS_TRIPS: BusTrip[] = [
  {
    id: 'bus-01',
    operatorName: 'Khánh Thịnh Limousine Tà Xùa',
    busType: 'Limousine 9 chỗ VIP',
    departureTime: '06:30',
    route: 'Hà Nội - Bắc Yên - Tà Xùa',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 350000,
    totalSeats: 9,
    bookedSeats: [1, 2, 4],
    phone: '0984 112 233',
    zalo: '0984112233',
    rating: 4.9,
    amenities: ['Ghế massage bọc da', 'Cổng sạc Type-C/USB', 'Wifi 4G', 'Nước suối khăn lạnh', 'Trả tận homestay'],
    stops: [
      { id: 's1', name: 'Bến xe Mỹ Đình (Cổng sau)', type: 'pickup', minuteOffset: 0, fareModifier: 0, pickupNote: 'Cây xăng đối diện bến xe' },
      { id: 's2', name: 'Sân bay Nội Bài (Sảnh E)', type: 'pickup', minuteOffset: 35, fareModifier: 40000, pickupNote: 'Cột số 9 sảnh tầng 2' },
      { id: 's3', name: 'Đại Lộ Thăng Long (Ngã 4 Hòa Lạc)', type: 'pickup', minuteOffset: 45, fareModifier: 0, pickupNote: 'Cầu vượt bộ hành' },
      { id: 's4', name: 'Thị xã Sơn Tây', type: 'pickup', minuteOffset: 70, fareModifier: -30000, pickupNote: 'Bến xe Sơn Tây' },
      { id: 's5', name: 'Ngã 3 Phù Yên (Sơn La)', type: 'both', minuteOffset: 190, fareModifier: -80000, pickupNote: 'Cây xăng trung tâm Phù Yên' },
      { id: 's6', name: 'Ngã 3 Bắc Yên (Chân đèo)', type: 'both', minuteOffset: 240, fareModifier: -50000, pickupNote: 'Khách sạn Sao Mai' },
      { id: 's7', name: 'Bến xe Tà Xùa / Trung tâm xã', type: 'dropoff', minuteOffset: 300, fareModifier: 0, pickupNote: 'Điểm trung chuyển trung tâm' },
      { id: 's8', name: 'Trả tận nơi các Homestay Đỉnh Gió', type: 'dropoff', minuteOffset: 320, fareModifier: 30000, pickupNote: 'Xe đưa thẳng lên Mẩy/Lu Trế/Mị Ơi' }
    ]
  },
  {
    id: 'bus-02',
    operatorName: 'Tà Xùa Express - Xe Cabin Đôi Chuyên Tuyến',
    busType: 'Giường nằm Cabin Đôi',
    departureTime: '22:00',
    route: 'Hà Nội - Tà Xùa (Chuyến đêm ngủ đến nơi đón bình minh)',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 380000,
    totalSeats: 22,
    bookedSeats: [1, 2, 5, 6, 9, 10],
    phone: '0979 334 455',
    zalo: '0979334455',
    rating: 4.8,
    amenities: ['Cabin rèm riêng tư', 'Màn hình giải trí TV', 'Tai nghe', 'Cổng sạc', 'Đến Tà Xùa 04:30 sáng đón mây'],
    stops: [
      { id: 'b2-s1', name: 'Bến xe Yên Nghĩa', type: 'pickup', minuteOffset: 0, fareModifier: 0, pickupNote: 'Cổng 1 Bến xe Yên Nghĩa' },
      { id: 'b2-s2', name: 'Công viên Cầu Giấy (Cổng chính)', type: 'pickup', minuteOffset: 30, fareModifier: 0, pickupNote: 'Đường Thành Thái' },
      { id: 'b2-s3', name: 'Cầu Trung Hà (Phú Thọ)', type: 'pickup', minuteOffset: 90, fareModifier: -50000, pickupNote: 'Đầu cầu bờ Ba Vì' },
      { id: 'b2-s4', name: 'Thị trấn Bắc Yên', type: 'both', minuteOffset: 280, fareModifier: -50000, pickupNote: 'Quảng trường Bắc Yên' },
      { id: 'b2-s5', name: 'Đỉnh Gió Tà Xùa (04:30 sáng)', type: 'dropoff', minuteOffset: 360, fareModifier: 0, pickupNote: 'Kịp giờ đón biển mây bình minh' }
    ]
  },
  {
    id: 'bus-03',
    operatorName: 'Anh Hào Limousine Tây Bắc',
    busType: 'Limousine 11 chỗ',
    departureTime: '13:00',
    route: 'Hà Nội - Bắc Yên - Tà Xùa (Chuyến chiều ngắm hoàng hôn)',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 340000,
    totalSeats: 11,
    bookedSeats: [3, 4],
    phone: '0915 678 910',
    zalo: '0915678910',
    rating: 4.75,
    amenities: ['Ghế ngả 45 độ', 'Rèm chống nắng', 'Điều hòa sâu', 'Trung chuyển linh hoạt'],
    stops: [
      { id: 'b3-s1', name: 'Bến xe Mỹ Đình', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
      { id: 'b3-s2', name: 'Ngã tư Nhổn (ĐH Công Nghiệp)', type: 'pickup', minuteOffset: 25, fareModifier: 0 },
      { id: 'b3-s3', name: 'Thanh Sơn (Phú Thọ)', type: 'both', minuteOffset: 120, fareModifier: -60000 },
      { id: 'b3-s4', name: 'Trung tâm xã Tà Xùa (18:00)', type: 'dropoff', minuteOffset: 300, fareModifier: 0 }
    ]
  },
  {
    id: 'bus-04',
    operatorName: 'Nhà Xe Hiền Hựu – Cabin Đôi & Limousine',
    busType: 'Giường nằm Cabin Đôi',
    departureTime: '21:30',
    route: 'Hà Nội (BigC / Royal City) - Bắc Yên - Tà Xùa',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 360000,
    totalSeats: 22,
    bookedSeats: [1, 3, 7, 8, 12],
    phone: '0967 136 378',
    zalo: '0967136378',
    rating: 4.96,
    amenities: ['Cabin đôi rèm che', 'Chăn lông ấm', 'Đón BigC Thăng Long & Royal City', 'Đến Tà Xùa 04:00 sáng'],
    stops: [
      { id: 'b4-s1', name: 'Royal City (Ngã Tư Sở)', type: 'pickup', minuteOffset: 0, fareModifier: 0, pickupNote: 'Cổng chính Nguyễn Trãi' },
      { id: 'b4-s2', name: 'BigC Thăng Long (Cổng sau)', type: 'pickup', minuteOffset: 20, fareModifier: 0, pickupNote: 'Đường Mạc Thái Tổ' },
      { id: 'b4-s3', name: 'Đại Lộ Thăng Long (Hòa Lạc)', type: 'pickup', minuteOffset: 50, fareModifier: 0 },
      { id: 'b4-s4', name: 'Trung tâm xã Tà Xùa & Đỉnh Gió', type: 'dropoff', minuteOffset: 340, fareModifier: 0, pickupNote: 'Hỗ trợ trung chuyển tận Homestay' }
    ]
  },
  {
    id: 'bus-05',
    operatorName: 'Nhà Xe Thành Mỹ – Chuyên Tuyến Săn Mây',
    busType: 'Limousine 9 chỗ VIP',
    departureTime: '07:00',
    route: 'Hà Nội (Mỹ Đình / Cầu Giấy) - Tà Xùa',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 350000,
    totalSeats: 9,
    bookedSeats: [1, 5],
    phone: '0941 256 888',
    zalo: '0941256888',
    rating: 4.88,
    amenities: ['Ghế Boeing massage', 'Có sẵn dàn xe máy mới 100%', 'Giảm 30k khi thuê kèm xe máy', 'Đón trả tận nơi'],
    stops: [
      { id: 'b5-s1', name: 'Công viên Cầu Giấy', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
      { id: 'b5-s2', name: 'Bến xe Mỹ Đình', type: 'pickup', minuteOffset: 15, fareModifier: 0 },
      { id: 'b5-s3', name: 'Sơn Tây (Quốc lộ 32)', type: 'pickup', minuteOffset: 65, fareModifier: -30000 },
      { id: 'b5-s4', name: 'Trung tâm xã Tà Xùa & Đỉnh Gió (12:15)', type: 'dropoff', minuteOffset: 315, fareModifier: 0 }
    ]
  },
  {
    id: 'bus-06',
    operatorName: 'Nhà Xe Quang Nghĩa – Cung Điện Di Động',
    busType: 'Giường nằm 2 tầng',
    departureTime: '14:00',
    route: 'Hà Nội (Yên Nghĩa / Mỹ Đình) - Bắc Yên - Tà Xùa',
    originCity: 'Hà Nội',
    destinationCity: 'Tà Xùa',
    baseFare: 320000,
    totalSeats: 24,
    bookedSeats: [2, 4, 6, 11, 14, 15],
    phone: '0334 255 255',
    zalo: '0334255255',
    rating: 4.9,
    amenities: ['Phòng nằm VIP riêng biệt', 'Cổng sạc & Wifi suốt tuyến', 'Nhận chở kèm xe máy / hành lý lớn', 'Đến Tà Xùa 19:15 kịp ăn tối'],
    stops: [
      { id: 'b6-s1', name: 'Bến xe Yên Nghĩa', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
      { id: 'b6-s2', name: 'Bến xe Mỹ Đình', type: 'pickup', minuteOffset: 30, fareModifier: 0 },
      { id: 'b6-s3', name: 'Cầu Trung Hà (Ba Vì)', type: 'pickup', minuteOffset: 85, fareModifier: -40000 },
      { id: 'b6-s4', name: 'Ngã 3 Bắc Yên & Trung tâm Tà Xùa (19:15)', type: 'dropoff', minuteOffset: 315, fareModifier: 0 }
    ]
  }
];

export const CLOUD_FORECASTS: CloudHuntingForecast[] = [
  {
    location: 'Đỉnh Gió',
    cloudProbability: 92,
    condition: 'Biển mây dày đặc',
    humidity: 91,
    windSpeedKmH: 7,
    tempMin: 14,
    tempMax: 22,
    goldenHours: '05:20 - 07:45',
    ratingStar: 5,
    advice: 'Thời tiết hoàn hảo! Độ ẩm cao và gió nhẹ tạo nên lớp mây trắng xóa dày bồng bềnh phủ kín thung lũng. Nên có mặt tại Mị Ơi hoặc Lu Trế trước 5:30.'
  },
  {
    location: 'Sống Lưng Khủng Long',
    cloudProbability: 88,
    condition: 'Biển mây dày đặc',
    humidity: 87,
    windSpeedKmH: 10,
    tempMin: 13,
    tempMax: 20,
    goldenHours: '05:45 - 08:30',
    ratingStar: 5,
    advice: 'Biển mây cuộn hai bên sườn núi Háng Đồng. Đường xuống có sương sớm trơn trượt, nên đi giày leo núi bám gai hoặc thuê xe ôm bản địa chở xuống đầu dốc.'
  },
  {
    location: 'Khe Cải',
    cloudProbability: 84,
    condition: 'Mây luồn bồng bềnh',
    humidity: 85,
    windSpeedKmH: 8,
    tempMin: 15,
    tempMax: 23,
    goldenHours: '06:00 - 08:00 & 16:30 - 17:45',
    ratingStar: 4.5,
    advice: 'Khe Cải đón nắng sớm làm biển mây ánh hồng rực rỡ. Chiều tối khoảng 17h có biển mây hoàng hôn đỏ rực rất đáng chiêm ngưỡng.'
  },
  {
    location: 'Thảo Nguyên',
    cloudProbability: 76,
    condition: 'Mây luồn bồng bềnh',
    humidity: 82,
    windSpeedKmH: 14,
    tempMin: 14,
    tempMax: 21,
    goldenHours: '06:30 - 09:00',
    ratingStar: 4,
    advice: 'Đồi cỏ thảo nguyên mờ ảo trong mây luồn, thích hợp trải thảm dã ngoại, cắm trại nhẹ nhàng và chụp ảnh concept Boho thảo nguyên.'
  },
  {
    location: 'Mống Vàng',
    cloudProbability: 80,
    condition: 'Biển mây dày đặc',
    humidity: 86,
    windSpeedKmH: 9,
    tempMin: 15,
    tempMax: 22,
    goldenHours: '05:30 - 08:00',
    ratingStar: 4.5,
    advice: 'Mống Vàng có mỏm đá ngắm cảnh tự nhiên. Tầm nhìn thoáng ít bị cây che chắn, ngắm trọn vẹn lớp mây đọng.'
  }
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-01',
    authorName: 'Hoàng Anh Tú',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    isVerifiedMember: true,
    type: 'carpool',
    title: 'Tìm 2 bạn ghép xe Limousine Hà Nội - Tà Xùa tối thứ 6 này (07/11)',
    content: 'Team mình có 2 bạn nữ đã book xe Limousine 9 chỗ xuất phát 22h tối thứ 6 từ Cầu Giấy. Muốn tìm thêm 2 bạn đi cùng để share tiền xe và cùng lên kế hoạch săn mây cuối tuần. Ai đi cùng nhắn mình nhé!',
    departureDate: '2026-11-07',
    route: 'Hà Nội -> Tà Xùa',
    contactPhone: '0982 990 114',
    likes: 24,
    commentsCount: 9,
    createdAt: '2 giờ trước'
  },
  {
    id: 'post-02',
    authorName: 'Thùy Dung Travel',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    isVerifiedMember: true,
    type: 'road_alert',
    title: 'Cập nhật tình hình đường đèo Chẹn & dốc Bắc Yên sáng nay',
    content: 'Sáng nay đường lên Tà Xùa đoạn qua đèo Chẹn có sương mù khá đặc từ km 12 đến km 18. Tầm nhìn xa khoảng 10-15m. Các bạn đi xe máy chú ý bật đèn pha vàng, giảm tốc độ và bóp còi khi vào cua gấp nhé. Đường khô ráo không sạt lở!',
    departureDate: 'Hôm nay',
    route: 'Bắc Yên -> Tà Xùa',
    contactPhone: '0918 223 344',
    likes: 58,
    commentsCount: 16,
    createdAt: '4 giờ trước'
  },
  {
    id: 'post-03',
    authorName: 'Minh Quân Phượt',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    isVerifiedMember: true,
    type: 'share_room',
    title: 'Ghép phòng Bungalow Đỉnh Gió đêm thứ Bảy do bạn bận việc đột xuất',
    content: 'Mình đã cọc 1 phòng Bungalow Kính đôi tại Mẩy Homestay đêm 08/11 view mây cực đẹp. Do bạn đồng hành bị ốm không đi được nên pass lại 1 suất ở ghép hoặc nhượng lại nguyên phòng giá ưu đãi cho bạn nào chưa có chỗ ở cuối tuần.',
    departureDate: '2026-11-08',
    route: 'Tà Xùa - Đỉnh Gió',
    contactPhone: '0945 671 289',
    likes: 19,
    commentsCount: 7,
    createdAt: '6 giờ trước'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'TX-2026-9902',
    listingId: 'homestay-may',
    listingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    category: 'homestay',
    guestName: 'Lê Thành Đạt',
    guestPhone: '0986 555 777',
    checkInDate: '2026-10-25',
    checkOutDate: '2026-10-27',
    guestsCount: 2,
    roomName: 'Bungalow Kính Mặt Trời (View Biển Mây)',
    totalAmount: 1900000,
    status: 'completed',
    reviewed: false,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-2026-9902-COMPLETED',
    platformFee: 50000,
    feeCharged: true,
    notes: 'Đã hoàn tất lưu trú 2 đêm săn mây tại Đỉnh Gió',
    createdAt: '2026-10-24 10:15'
  },
  {
    id: 'TX-2026-9905',
    listingId: 'homestay-lu-tre',
    listingTitle: 'Lu Trế Homestay - Nóc Nhà Tà Xùa',
    category: 'homestay',
    guestName: 'Lê Thành Đạt',
    guestPhone: '0986 555 777',
    checkInDate: '2026-10-18',
    checkOutDate: '2026-10-19',
    guestsCount: 2,
    roomName: 'Lều Glamping Mây Bồng Bềnh',
    totalAmount: 800000,
    status: 'completed',
    reviewed: false,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-2026-9905-COMPLETED',
    platformFee: 50000,
    feeCharged: true,
    notes: 'Đã trả phòng đúng hạn',
    createdAt: '2026-10-17 09:00'
  },
  {
    id: 'TX-2026-8891',
    listingId: 'homestay-may',
    listingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    category: 'homestay',
    guestName: 'Nguyễn Văn Minh',
    guestPhone: '0912 345 678',
    checkInDate: '2026-11-10',
    checkOutDate: '2026-11-12',
    guestsCount: 2,
    roomName: 'Bungalow Kính Mặt Trời (View Biển Mây)',
    totalAmount: 1900000,
    status: 'confirmed',
    reviewed: false,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-2026-8891-CONFIRMED',
    platformFee: 50000,
    feeCharged: false,
    notes: 'Khách cần phòng tầng cao view trực diện thung lũng',
    createdAt: '2026-11-02 14:30'
  },
  {
    id: 'TX-2026-7643',
    listingId: 'bus-01',
    listingTitle: 'Khánh Thịnh Limousine Tà Xùa',
    category: 'bus',
    guestName: 'Trần Thị Mai',
    guestPhone: '0978 123 456',
    checkInDate: '2026-11-08',
    checkOutDate: '2026-11-08',
    guestsCount: 2,
    seatNumbers: [3, 4],
    pickupStop: 'Bến xe Mỹ Đình (Cổng sau)',
    dropoffStop: 'Bến xe Tà Xùa / Trung tâm xã',
    totalAmount: 700000,
    status: 'completed',
    reviewed: false,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TX-2026-7643-COMPLETED',
    platformFee: 50000,
    feeCharged: true,
    notes: 'Đã đón đúng giờ tại Mỹ Đình',
    createdAt: '2026-10-31 09:15'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-01',
    listingId: 'homestay-may',
    bookingId: 'TX-2026-6410',
    reviewerName: 'Phạm Hoàng Yến',
    rating: 5,
    comment: 'Đúng như hồ sơ thẩm định! Phòng Bungalow kính nhìn thẳng ra biển mây Đỉnh Gió ngay từ trên giường lúc 5h45 sáng. Nước nóng ổn định, có điều hòa 2 chiều ấm áp.',
    roomName: 'Bungalow Kính Mặt Trời (View Biển Mây)',
    createdAt: '2026-10-29',
    isVerifiedStay: true
  },
  {
    id: 'rev-02',
    listingId: 'homestay-may',
    bookingId: 'TX-2026-5922',
    reviewerName: 'Vũ Quốc Huy',
    rating: 5,
    comment: 'Đường ô tô 16 chỗ vào tận cổng rất tiện. Chủ nhà chuẩn bị sẵn trà Shan Tuyết cổ thụ nóng và hỗ trợ gọi xe máy đi Sống Lưng Khủng Long giá niêm yết.',
    roomName: 'Phòng Đôi Mây Ngàn Thảo Nguyên',
    createdAt: '2026-10-21',
    isVerifiedStay: true
  },
  {
    id: 'rev-03',
    listingId: 'homestay-lu-tre',
    bookingId: 'TX-2026-5108',
    reviewerName: 'Đỗ Minh Tâm',
    rating: 5,
    comment: 'Vị trí cao nhất Đỉnh Gió nên tầm nhìn 360 độ không bị mái tôn nào che khuất. Lều glamping có đệm sưởi điện rất ấm dù ngoài trời 13 độ.',
    roomName: 'Lều Glamping Mây Bồng Bềnh',
    createdAt: '2026-10-26',
    isVerifiedStay: true
  },
  {
    id: 'rev-04',
    listingId: 'coffee-mi-oi',
    bookingId: 'TX-2026-4819',
    reviewerName: 'Nguyễn Bảo Ngọc',
    rating: 5,
    comment: 'Cà phê muối ấm nóng cực ngon, sàn gỗ ngắm mây buổi sáng đẹp mê hồn. Nên đến trước 6h30 sáng để chọn bàn sát lan can.',
    roomName: 'Đặt bàn săn mây sớm',
    createdAt: '2026-10-28',
    isVerifiedStay: true
  }
];

export const INITIAL_USER_PROFILE: MemberProfile = {
  id: 'user-vip-01',
  name: 'Lê Thành Đạt',
  phone: '0986 555 777',
  cloudPoints: 0, // N06.2: lấy từ server (/api/me/points) khi đăng nhập
  membershipTier: 'Thợ Săn Mây Bạc',
  savedListings: ['homestay-may', 'coffee-mi-oi', 'tour-song-lung'],
  bookingHistory: INITIAL_BOOKINGS
};

export const INITIAL_CLAIM_REQUESTS: PartnerClaimRequest[] = [
  {
    id: 'claim-01',
    listingId: 'homestay-may',
    listingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    ownerName: 'Vàng A Mẩy',
    ownerPhone: '0981 234 567',
    zalo: '0981234567',
    cccdOrTax: '014201008892',
    proofDocumentNote: 'Giấy chứng nhận đăng ký hộ kinh doanh du lịch Mẩy Tà Xùa & Sổ đỏ đất Đỉnh Gió',
    status: 'verified',
    createdAt: '2026-11-01 10:20'
  },
  {
    id: 'claim-02',
    listingId: 'coffee-mi-oi',
    listingTitle: 'Tiệm Cà Phê Mị Ơi - Đỉnh Gió',
    ownerName: 'Nguyễn Thùy Linh (Mị)',
    ownerPhone: '0978 445 667',
    zalo: '0978445667',
    cccdOrTax: '025195007412',
    proofDocumentNote: 'Hợp đồng thuê mặt bằng Đỉnh Gió 5 năm & Giấy phép an toàn VSTP',
    status: 'pending',
    createdAt: '2026-11-05 14:15'
  }
];

export const INITIAL_DISPUTES: BookingDispute[] = [
  {
    id: 'disp-01',
    bookingId: 'TX-2026-9902',
    listingId: 'homestay-may',
    listingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    guestName: 'Lê Thành Đạt',
    guestPhone: '0986 555 777',
    issueType: 'service_attitude',
    description: 'Sáng ngày 26/10 bị cúp điện tạm thời do mưa gió 30 phút, homestay đã khắc phục bằng máy phát nhưng bình nóng lạnh hoạt động chậm. Đề nghị admin hỗ trợ tích thêm điểm bồi thường trải nghiệm.',
    status: 'investigating',
    adminAssigned: 'Admin Điều Phối Tà Xùa',
    createdAt: '2026-10-27 18:00'
  }
];

export const INITIAL_VOUCHERS: PromoVoucher[] = [
  {
    id: 'vouch-01',
    code: 'TAXUA10',
    title: 'Giảm 10% Săn Mây Mùa Đẹp',
    discountType: 'percent',
    discountValue: 10,
    minBookingAmount: 500000,
    applicableCategory: 'all',
    isActive: true,
    validUntil: '2026-12-31',
    description: 'Áp dụng cho mọi dịch vụ lưu trú, di chuyển và combo tour trên website'
  },
  {
    id: 'vouch-02',
    code: 'SANMAY50K',
    title: 'Ưu đãi 50.000đ Thành Viên Mới',
    discountType: 'fixed',
    discountValue: 50000,
    minBookingAmount: 300000,
    applicableCategory: 'all',
    isActive: true,
    validUntil: '2026-11-30',
    description: 'Giảm trực tiếp 50.000đ khi đặt dịch vụ qua hệ thống xác minh'
  },
  {
    id: 'vouch-03',
    code: 'DICHVU15',
    title: 'Giảm 15% Tour & Thuê Trang Phục',
    discountType: 'percent',
    discountValue: 15,
    minBookingAmount: 200000,
    applicableCategory: 'tour',
    isActive: true,
    validUntil: '2026-12-15',
    description: 'Dành riêng cho các tour trekking Sống Lưng và thuê trang phục H\'Mông'
  }
];

export const INITIAL_REWARD_SETTINGS: ServiceRewardSetting[] = [
  { listingId: 'homestay-may', pointEarnRatePercent: 8, pointRedemptionAllowed: true },
  { listingId: 'homestay-lu-tre', pointEarnRatePercent: 10, pointRedemptionAllowed: true },
  { listingId: 'homestay-nha-cua-an', pointEarnRatePercent: 6, pointRedemptionAllowed: true },
  { listingId: 'bus-01', pointEarnRatePercent: 5, pointRedemptionAllowed: true },
  { listingId: 'taxi-taxua-247', pointEarnRatePercent: 7, pointRedemptionAllowed: true },
  { listingId: 'tour-song-lung', pointEarnRatePercent: 12, pointRedemptionAllowed: true },
  { listingId: 'costume-mong-hoa', pointEarnRatePercent: 10, pointRedemptionAllowed: true },
  { listingId: 'camera-rental-taxua', pointEarnRatePercent: 8, pointRedemptionAllowed: true }
];

export const INITIAL_CURATED_COMBOS: CuratedComboPackage[] = [
  {
    id: 'combo-admin-1',
    title: 'Combo Săn Mây Đỉnh Gió 2N1Đ: Xe Cabin Đôi + Bungalow Kính + Xe Máy Giao Tận Nơi',
    badgeText: '👑 Admin Đề Xuất #1 · Bán chạy nhất',
    category: 'combo_2n1d',
    duration: '2 Ngày 1 Đêm',
    area: 'Đỉnh Gió',
    comboPrice: 1290000,
    originalPrice: 1550000,
    unit: 'người (áp dụng từ 2 khách)',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Gói trọn vẹn nhất cho khách lần đầu lên Tà Xùa: Ngủ Cabin Đôi từ Hà Nội lên thẳng Đỉnh Gió đón bình minh, ở phòng kính Mẩy/Lu Trế có đệm sưởi và nhận xe máy Wave/Blade đầy xăng ngay tại sảnh.',
    includedItems: [
      '🚌 Vé khứ hồi Xe Cabin Đôi VIP / Limousine 9 chỗ (Hà Nội ⇄ Đỉnh Gió Tà Xùa)',
      '🏡 01 đêm Bungalow Kính View Biển Mây (Đệm sưởi + Bình nóng lạnh + Ăn sáng + Trà Shan Tuyết)',
      '🛵 01 Xe máy số Wave Alpha / Honda Blade đời mới giao tận Homestay (tính linh hoạt mốc 12h trưa)',
      '☕ Tặng Voucher đồ uống ngắm hoàng hôn tại Tiệm Cà Phê Mị Ơi'
    ],
    linkedListingId: 'homestay-may',
    actionType: 'open_listing',
    priorityOrder: 1,
    isPinnedFeatured: true,
    isActive: true
  },
  {
    id: 'combo-admin-2',
    title: 'Tour Trekking Thẩm Định: Chinh Phục Sống Lưng Khủng Long – Đỉnh U Bò – Rừng Nguyên Sinh',
    badgeText: '🥾 Trekking Thẩm Định · Có Porter Bản Địa',
    category: 'trekking_tour',
    duration: '1 Ngày Chuyên Sâu / 2N1Đ',
    area: 'Sống Lưng Khủng Long',
    comboPrice: 650000,
    originalPrice: 820000,
    unit: 'khách (đoàn ghép 4–8 người)',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Hành trình trekking an toàn tuyệt đối cùng Guide người H’Mông bản địa đã qua thẩm định: Săn biển mây cuồn cuộn trên Sống Lưng Khủng Long, thưởng thức bữa trưa gà nướng ống tre và hỗ trợ quay Flycam 4K.',
    includedItems: [
      '🧭 Hướng dẫn viên & Porter H’Mông bản địa dẫn đường 1 kèm đoàn (trang bị gậy leo núi, áo mưa, y tế)',
      '🛵 Xe ôm bản địa trung chuyển đoạn dốc đứng xuống Sống Lưng Khủng Long an toàn',
      '🍗 Bữa trưa dã ngoại giữa biển mây: Gà đen nướng mắc khén, cơm lam ống tre & trái cây',
      '📸 Hỗ trợ chụp ảnh máy cơ & quay clip Flycam sống lưng mây miễn phí'
    ],
    linkedListingId: 'tour-song-lung',
    actionType: 'open_listing',
    priorityOrder: 2,
    isPinnedFeatured: true,
    isActive: true
  },
  {
    id: 'combo-admin-3',
    title: 'Combo Tiết Kiệm Tà Xùa Biker: Vé Xe Khách Khứ Hồi + Thuê Xe Máy Phượt Đèo (Trả Trước 12h Trưa)',
    badgeText: '🔥 Tiết Kiệm 90.000đ · Chuẩn Phượt Thủ',
    category: 'biker_pack',
    duration: 'Linh hoạt 2N1Đ / 3N2Đ',
    area: 'Trung Tâm Tà Xùa',
    comboPrice: 820000,
    originalPrice: 910000,
    unit: 'người (Vé khứ hồi + Xe máy 1.5 ngày)',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Đặt chung vé xe Limousine/Cabin Đôi kèm xe máy kiểm định phanh đèo. Áp dụng chính sách trả xe trước 12:00 trưa hôm sau chỉ tính 0.5 ngày và giảm thêm 30.000đ/xe.',
    includedItems: [
      '🚌 02 chiều vé xe Limousine VIP hoặc Giường nằm 2 tầng (Chọn ghế tầng 1/tầng 2 trực tuyến)',
      '🏍️ Xe máy Honda Wave / Blade / Sirius hoặc Winner X kiểm tra phanh & lốp trước khi giao',
      '⏱️ Chính sách vàng: Trả xe trước 12:00 trưa ngày về chỉ tính 0.5 ngày thuê (+75k)',
      '🚨 Bảo lãnh cứu hộ đèo Tà Xùa – Háng Đồng – Thảo Nguyên 24/7 miễn phí'
    ],
    linkedListingId: 'motorbike-taxua-biker',
    actionType: 'open_bus_combo',
    priorityOrder: 3,
    isPinnedFeatured: true,
    isActive: true
  },
  {
    id: 'combo-admin-4',
    title: 'Combo Cặp Đôi Nghỉ Dưỡng: Chillout Village Bể Bơi Vô Cực + Lẩu Gà Đen H’Mông Tối',
    badgeText: '💎 Cặp Đôi & Kỷ Niệm · Riêng Tư Tuyệt Đối',
    category: 'couple_retreat',
    duration: '2 Ngày 1 Đêm',
    area: 'Khe Cải',
    comboPrice: 1450000,
    originalPrice: 1750000,
    unit: 'cặp đôi (2 người lớn)',
    imageUrl: 'https://qtkjxyuzgrhngjyguzys.supabase.co/storage/v1/object/public/images/_v/homestays/1781170201336-644236.jpg.w1080.webp',
    summary:
      'Không gian nghỉ dưỡng lãng mạn tại bản Khe Cải với phòng kính Panorama hướng núi, bồn tắm gỗ ngâm thảo dược và bàn tiệc tối Lẩu Gà Đen H’Mông nóng hổi giữa sương mù.',
    includedItems: [
      '🏡 01 đêm Phòng Kính Panorama / Bungalow Gỗ tại Chillout Village (Khe Cải)',
      '🍲 01 Set Lẩu Gà Đen H’Mông + Rau rừng Tây Bắc + Rượu táo mèo cho 2 người',
      '🛁 Bồn tắm gỗ thảo dược người Dao & trà chiều ngắm hoàng hôn Khe Cải',
      '🚗 Hỗ trợ đón trả từ ngã ba Trung tâm Tà Xùa vào bản Khe Cải'
    ],
    linkedListingId: 'tx-stay-1',
    actionType: 'open_listing',
    priorityOrder: 4,
    isPinnedFeatured: true,
    isActive: true
  },
  {
    id: 'combo-admin-5',
    title: 'Combo Đoàn Đông & Gia Đình (4–8 Khách): Nguyên Căn Bungalow + Xe Limousine Đón Tận Cửa',
    badgeText: '👨‍👩‍👧‍👦 Đoàn 4–8 Khách · Ô Tô Vào Tận Sân',
    category: 'group_family',
    duration: '2 Ngày 1 Đêm',
    area: 'Đỉnh Gió',
    comboPrice: 1150000,
    originalPrice: 1380000,
    unit: 'người (nhóm từ 4 khách)',
    imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Thiết kế riêng cho gia đình có trẻ nhỏ/người lớn tuổi hoặc nhóm bạn cần chỗ đậu ô tô rộng rãi, phòng VIP khép kín ấm áp và lửa trại BBQ buổi tối.',
    includedItems: [
      '🚐 Xe Limousine 9–11 chỗ đón tận sảnh chung cư Hà Nội – trả tận sân Homestay Đỉnh Gió',
      '🏠 Phòng VIP Gia Đình / Bungalow Kính liên thông (Điều hòa 2 chiều + Đệm sưởi + Bồn tắm)',
      '🔥 Setup tiệc nướng BBQ tối tại sân mây & đốt lửa trại giao lưu',
      '🍵 Thưởng trà Shan Tuyết cổ thụ sáng sớm ngay tại ban công săn mây'
    ],
    linkedListingId: 'homestay-may',
    actionType: 'open_listing',
    priorityOrder: 5,
    isPinnedFeatured: false,
    isActive: true
  },
  {
    id: 'combo-admin-6',
    title: 'Tour Săn Mây & Chụp Ảnh Nàng Thơ: Thảo Nguyên – Mỏm Cá Heo – Cây Cô Đơn + Photographer',
    badgeText: '📸 Tour Chụp Ảnh + Váy Mông Hoa',
    category: 'trekking_tour',
    duration: 'Nửa Ngày (05:30 – 11:30 hoặc 14:00 – 18:00)',
    area: 'Thảo Nguyên',
    comboPrice: 590000,
    originalPrice: 750000,
    unit: 'khách (Bao gồm Thợ ảnh + Trang phục)',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    summary:
      'Combo trọn gói cho các tín đồ sống ảo: Thuê trang phục Mông Hoa / Boho, di chuyển dọc cung Thảo Nguyên – Cây Cô Đơn cùng Photographer chuyên nghiệp trả toàn bộ file gốc + 25 ảnh chỉnh màu.',
    includedItems: [
      '👗 01 Bộ trang phục Mông Hoa / Tây Tạng / Boho đầy đủ phụ kiện mũ, gùi hoa',
      '📷 Thợ ảnh bản địa đi cùng 4 tiếng qua 4 điểm: Đỉnh Gió – Thảo Nguyên – Cá Heo – Cây Cô Đơn',
      '✨ Trả toàn bộ file ảnh gốc trong ngày + 25 ảnh photoshop chỉnh màu trong trẻo',
      '🛵 Hỗ trợ xe di chuyển hoặc dẫn đoàn theo khung giờ nắng đẹp nhất'
    ],
    linkedListingId: 'coffee-mi-oi',
    actionType: 'open_ai_advisor',
    priorityOrder: 6,
    isPinnedFeatured: false,
    isActive: true
  }
];

export const INITIAL_SITE_CONTENT: SiteContentConfig = {
  heroBadge: '🏔️ Cổng đặt phòng & thông tin Tà Xùa',
  heroTitle: 'TÀ XÙA TRIP',
  heroSubtitle: 'Đi thật. Biết trước.',
  heroDescription: '179+ homestay kiểm duyệt thực tế, minh bạch giá phòng và liên hệ trực tiếp chủ nhà không qua trung gian.',
  heroBackgroundImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  heroOverlayOpacity: 75,
  alertEnabled: true,
  alertLevel: 'info',
  alertText: 'Mùa săn mây đẹp nhất năm (Tháng 10 - Tháng 3): Xác suất biển mây Đỉnh Gió & Sống Lưng đạt 85%. Lưu ý kiểm tra phanh xe khi đổ đèo Bắc Yên.',
  emergencyBanner: {
    enabled: true,
    severity: 'info',
    title: 'Cập nhật thời tiết & đèo Tà Xùa hôm nay',
    message: 'Đường lên Sống Lưng Khủng Long và Thảo Nguyên thông thoáng, biển mây dày từ 05:30 - 08:30 sáng.',
    actionUrl: '#weather'
  },
  heroBanners: [
    {
      id: 'hb-1',
      badgeText: '🔥 Điểm Săn Mây Đỉnh Nhất',
      title: 'Mùa Biển Mây Tà Xùa Đang Đạt Đỉnh 90%',
      subtitle: 'Trải nghiệm Đỉnh Gió - Sống Lưng Khủng Long - Thảo Nguyên',
      description: 'Đặt trực tiếp Homestay view mây tràn chân giường, combo xe Limousine + thuê xe máy nhận tại bản không qua cò mồi.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Xem Bản Đồ & Tọa Độ Săn Mây',
      targetTab: 'map',
      sortOrder: 1,
      isActive: true
    },
    {
      id: 'hb-2',
      badgeText: '🚌 Combo Tiết Kiệm',
      title: 'Vé Xe Cabin Đôi + Xe Máy Giao Tận Homestay',
      subtitle: 'Tiết kiệm 30.000đ/xe máy • Giữ chỗ ghế tầng 1 & tầng 2 trực quan',
      description: 'Lựa chọn vị trí giường nằm 2 tầng hoặc Limousine VIP, kết hợp thuê xe máy tính linh hoạt mốc 12h trưa nửa ngày.',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Xem Gói Combo & Đặt Xe',
      targetTab: 'combo_section',
      sortOrder: 2,
      isActive: true
    },
    {
      id: 'hb-3',
      badgeText: '🍲 Ẩm Thực & Cafe Đỉnh Gió',
      title: 'Lẩu Gà Đen H’Mông & Cafe Ngắm Hoàng Hôn',
      subtitle: 'Xem trước thực đơn niêm yết, giờ mở cửa & đặt bàn săn mây sớm',
      description: 'Không lo chặt chém với bảng giá thực đơn minh bạch từ các quán ăn bản địa và tiệm cafe view thung lũng.',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      ctaText: 'Xem Quán Ăn & Cafe Đỉnh Gió',
      targetTab: 'dining',
      sortOrder: 3,
      isActive: true
    }
  ],
  curatedCombos: INITIAL_CURATED_COMBOS,
  sectionBanners: [
    {
      id: 'sec-stay',
      sectionKey: 'stay',
      sectionName: 'Lưu Trú Homestay & Cloud Lounge',
      badgeText: '100% Thẩm Định Thực Tế',
      title: 'Homestay & Bungalow Săn Mây Tà Xùa',
      subtitle: 'Minh bạch view nhìn, bình nóng lạnh, điều hòa, đệm sưởi và số phòng trống theo thời gian thực.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1400&q=80',
      ctaText: 'Lọc phòng trống ngay',
      isActive: true
    },
    {
      id: 'sec-transport',
      sectionKey: 'transport',
      sectionName: 'Xe Khách, Xe Máy & Taxi Bản Địa',
      badgeText: 'Đặt Ghế & Combo Xe Máy',
      title: 'Di Chuyển Lên Tà Xùa An Toàn & Chủ Động',
      subtitle: 'Sơ đồ giường nằm 2 tầng, Cabin VIP, Limousine kèm thuê xe máy chính chủ (trả trước 12h trưa tính nửa ngày).',
      bannerImageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
      ctaText: 'Xem lịch xe chạy',
      isActive: true
    },
    {
      id: 'sec-services',
      sectionKey: 'services',
      sectionName: 'Tour Trekking, Photographer & Trang Phục',
      badgeText: 'Trải Nghiệm Bản Địa',
      title: 'Dịch Vụ Săn Mây, Chụp Ảnh & Thuê Đồ',
      subtitle: 'Poster dẫn tour Sống Lưng Khủng Long, thợ ảnh săn mây chuyên nghiệp, thuê váy Mông & máy ảnh Fujifilm/Sony.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
      ctaText: 'Đặt dịch vụ trải nghiệm',
      isActive: true
    },
    {
      id: 'sec-dining',
      sectionKey: 'dining',
      sectionName: 'Ẩm Thực Tây Bắc & Cafe Săn Mây',
      badgeText: 'Niêm Yết Thực Đơn',
      title: 'Quán Ăn Đặc Sản & Tiệm Cà Phê Đỉnh Gió',
      subtitle: 'Cập nhật giờ mở - đóng cửa thực tế, menu lẩu gà đen, cá tầm, đồ nướng và thức uống nóng giữa biển mây.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80',
      ctaText: 'Xem thực đơn & đặt bàn',
      isActive: true
    },
    {
      id: 'sec-verified',
      sectionKey: 'verified',
      sectionName: 'Phương Pháp Thẩm Định 3 Cấp',
      badgeText: 'Chống Lừa Đảo & Ảo Giá',
      title: 'Hệ Thống Chứng Nhận & Bảo Vệ Du Khách',
      subtitle: 'Mọi cơ sở đều được kiểm duyệt thực địa, lưu bằng chứng chuyển khoản (UNC) và đối soát minh bạch.',
      bannerImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
      ctaText: 'Tìm hiểu quy trình',
      isActive: true
    }
  ],
  socialChannels: [
    {
      id: 'soc-tiktok-official',
      platform: 'tiktok',
      title: 'TikTok Tà Xùa Trip Official',
      handleOrNumber: '@taxuatrip.official',
      url: 'https://www.tiktok.com/@taxuatrip.official',
      description: 'Cập nhật video biển mây thực địa 05:30 sáng hằng ngày tại Đỉnh Gió & Sống Lưng.',
      memberOrFollowerCount: '68.4K Followers',
      badgeText: 'Live Săn Mây 05:30',
      placements: ['header', 'footer', 'community_hub', 'floating_dock'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 1
    },
    {
      id: 'soc-fb-page',
      platform: 'facebook_page',
      title: 'Fanpage Tà Xùa Trip – Đi Thật Biết Trước',
      handleOrNumber: 'fb.com/taxuatrip.vn',
      url: 'https://www.facebook.com/taxuatrip.vn',
      description: 'Kênh thông tin chính thức, bảng giá niêm yết 179 cơ sở và cảnh báo thời tiết đèo Bắc Yên.',
      memberOrFollowerCount: '54.2K Theo dõi',
      badgeText: 'Tích Xanh Chính Chủ',
      placements: ['header', 'footer', 'community_hub'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 2
    },
    {
      id: 'soc-fb-group',
      platform: 'facebook_group',
      title: 'Group Cộng Đồng Săn Mây & Review Tà Xùa Thực Tế',
      handleOrNumber: 'Cộng Đồng Tà Xùa Trip',
      url: 'https://www.facebook.com/groups/taxuatrip.community',
      description: 'Nơi du khách đăng bài review thật 100%, hỏi đáp kinh nghiệm đi đèo và pass phòng có bảo lãnh.',
      memberOrFollowerCount: '42.8K Thành viên',
      badgeText: 'Kiểm duyệt chống cò',
      placements: ['footer', 'community_hub'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 3
    },
    {
      id: 'soc-zalo-oa',
      platform: 'zalo_oa',
      title: 'Zalo OA Tà Xùa Trip (Hỗ Trợ Đặt Chỗ & Bản Tin 6h Sáng)',
      handleOrNumber: '0981 234 567',
      url: 'https://zalo.me/0981234567',
      description: 'Nhận bản tin xác suất biển mây lúc 06:00 sáng và hỗ trợ đối soát giữ chỗ VietQR 24/7.',
      memberOrFollowerCount: '19.5K Quan tâm',
      badgeText: 'Zalo Official Account',
      placements: ['header', 'footer', 'community_hub', 'floating_dock'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 4
    },
    {
      id: 'soc-zalo-group',
      platform: 'zalo_group',
      title: 'Nhóm Zalo Săn Mây & Ghép Chuyến Cuối Tuần',
      handleOrNumber: 'zalo.me/g/taxuatrip247',
      url: 'https://zalo.me/g/taxuatrip247',
      description: 'Nhóm báo mây trực tiếp từ Thổ địa Đỉnh Gió và ghép xe Limousine/Taxi Bắc Yên nhanh trong ngày.',
      memberOrFollowerCount: '985/1.000 Thành viên',
      badgeText: 'Trực tuyến 24/7',
      placements: ['community_hub', 'footer'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 5
    },
    {
      id: 'soc-phone-hotline',
      platform: 'phone_hotline',
      title: 'Hotline Điều Phối & Xác Minh Đặt Phòng/Vé Xe',
      handleOrNumber: '0981 234 567',
      url: 'tel:0981234567',
      description: 'Tổng đài Admin kiểm tra phòng trống thực tế và xác minh chủ cơ sở trước khi đặt cọc.',
      memberOrFollowerCount: 'Hỗ trợ 06:00 - 23:00',
      badgeText: 'Hotline Chính Thức',
      placements: ['header', 'footer', 'community_hub', 'floating_dock'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 6
    },
    {
      id: 'soc-phone-sos',
      platform: 'phone_sos',
      title: 'Đường Dây Nóng Cứu Hộ Đèo Chẹn & Sương Mù 24/7',
      handleOrNumber: '0981 119 115',
      url: 'tel:0981119115',
      description: 'Hỗ trợ kéo xe, thủng lốp, hết xăng, sương mù dày đặc trên đèo Bắc Yên – Đỉnh Gió – Sống Lưng.',
      memberOrFollowerCount: 'Trực chiến 24/24',
      badgeText: 'SOS Khẩn Cấp',
      placements: ['header', 'footer', 'community_hub', 'sos_modal'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 7
    },
    {
      id: 'soc-youtube',
      platform: 'youtube',
      title: 'YouTube Tà Xùa Trip – Cẩm Nang Phượt & Flycam 4K',
      handleOrNumber: '@TaXuaTrip4K',
      url: 'https://www.youtube.com/@TaXuaTrip4K',
      description: 'Video quay thực tế toàn cảnh 179 Homestay bằng Flycam và hướng dẫn đổ đèo an toàn.',
      memberOrFollowerCount: '24.1K Subscribers',
      badgeText: 'Review 4K Thực Tế',
      placements: ['footer', 'community_hub'],
      isVerifiedOfficial: true,
      isActive: true,
      sortOrder: 8
    }
  ],
  footerConfig: {
    brandTagline: 'Đi thật. Biết trước. Nền tảng du lịch Tà Xùa minh bạch & chống lừa đảo.',
    description: 'Hệ sinh thái kết nối trực tiếp du khách với Chủ Homestay, Nhà xe, Quán ăn và Thổ địa Tà Xùa đã qua thẩm định thực địa.',
    rescueHotline: '0981 119 115',
    supportZalo: '0981 234 567',
    address: 'Trung tâm Xã Tà Xùa, Huyện Bắc Yên, Tỉnh Sơn La',
    copyrightText: '© 2026 Tà Xùa Trip – Hệ thống Quản trị & Thẩm định Dịch vụ Du lịch Tà Xùa.'
  }
};

// ===== DỮ LIỆU MẶC ĐỊNH HỆ THỐNG REVIDAPI GATEWAY (https://revidapi.com/dashboard/docs) =====

export const REVID_MODELS_CATALOG: RevidModelSpec[] = [
  // --- TIER L1: MICRO & FREE / ULTRA-LIGHT ---
  {
    id: 'google/gemini-flash-lite',
    name: 'Gemini Flash Lite (Free Tier)',
    provider: 'Google',
    category: 'llm',
    recommendedLevel: 'L1_micro',
    inputCreditsPer1M: 0,
    outputCreditsPer1M: 0,
    cacheReadCreditsPer1M: 0,
    avgLatencyMs: 380,
    supportsStreaming: true,
    supportsJson: true,
    isFree: true,
    isEnabled: true,
    description: 'Miễn phí 0 Credit/1M token. Phản hồi cực nhanh (< 400ms), lý tưởng cho kiểm duyệt tin nhắn lừa đảo trong 9 nhóm chat, che PII và phân loại ý định.'
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'DeepSeek',
    category: 'llm',
    recommendedLevel: 'L1_micro',
    inputCreditsPer1M: 38,
    outputCreditsPer1M: 38,
    cacheReadCreditsPer1M: 19,
    avgLatencyMs: 490,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Chi phí siêu rẻ (38 cr/1M, Cache Read chỉ 19 cr/1M). Tốc độ cao, phù hợp làm model dự phòng cấp L1 hoặc hội thoại ngắn L2.'
  },

  // --- TIER L2: FAST CONVERSATIONAL & FAQ ---
  {
    id: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    provider: 'OpenAI',
    category: 'llm',
    recommendedLevel: 'L2_fast',
    inputCreditsPer1M: 54,
    outputCreditsPer1M: 54,
    cacheReadCreditsPer1M: 27,
    avgLatencyMs: 620,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Model OpenAI tối ưu chi phí (54 cr/1M). Trả lời mượt mà các câu hỏi thời tiết săn mây, giờ xe chạy, giá phòng và tóm tắt đánh giá.'
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'DeepSeek',
    category: 'llm',
    recommendedLevel: 'L2_fast',
    inputCreditsPer1M: 64,
    outputCreditsPer1M: 64,
    cacheReadCreditsPer1M: 32,
    avgLatencyMs: 740,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Suy luận logic tốt với chi phí thấp (64 cr/1M). Phù hợp tính toán chi phí thuê xe máy nửa ngày và tra cứu danh sách cơ sở.'
  },
  {
    id: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    provider: 'OpenAI',
    category: 'llm',
    recommendedLevel: 'L2_fast',
    inputCreditsPer1M: 86,
    outputCreditsPer1M: 86,
    cacheReadCreditsPer1M: 43,
    avgLatencyMs: 690,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Dòng cân bằng tốc độ và độ chính xác định dạng JSON (86 cr/1M).'
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    category: 'llm',
    recommendedLevel: 'L2_fast',
    inputCreditsPer1M: 86,
    outputCreditsPer1M: 430,
    cacheReadCreditsPer1M: 9,
    avgLatencyMs: 580,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Giọng văn tự nhiên, lịch sự, tốc độ phản hồi nhanh và Cache Read siêu rẻ (chỉ 9 cr/1M).'
  },

  // --- TIER L3: MULTI-STEP REASONING, ITINERARY & RAG ---
  {
    id: 'grok-4.7',
    name: 'Grok 4.7 Reasoning',
    provider: 'xAI',
    category: 'llm',
    recommendedLevel: 'L3_reasoning',
    inputCreditsPer1M: 97,
    outputCreditsPer1M: 97,
    cacheReadCreditsPer1M: 48,
    avgLatencyMs: 920,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Phân tích nhanh dữ liệu thời gian thực và gợi ý điểm săn mây theo điều kiện gió/độ ẩm (97 cr/1M).'
  },
  {
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol (Structured Reasoning)',
    provider: 'OpenAI',
    category: 'llm',
    recommendedLevel: 'L3_reasoning',
    inputCreditsPer1M: 108,
    outputCreditsPer1M: 108,
    cacheReadCreditsPer1M: 54,
    avgLatencyMs: 980,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Khuyên dùng cho Lập lịch trình Tà Xùa 2N1Đ/3N2Đ và tính toán báo giá kết hợp Homestay + Nhà xe + Xe máy từ 179 cơ sở (108 cr/1M).'
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3 Long-Context',
    provider: 'Moonshot',
    category: 'llm',
    recommendedLevel: 'L3_reasoning',
    inputCreditsPer1M: 108,
    outputCreditsPer1M: 108,
    cacheReadCreditsPer1M: 54,
    avgLatencyMs: 1050,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Ngữ cảnh siêu dài, đọc trọn vẹn toàn bộ 179 hồ sơ cơ sở và các file kiến thức RAG trong 1 lần gọi.'
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    category: 'llm',
    recommendedLevel: 'L3_reasoning',
    inputCreditsPer1M: 258,
    outputCreditsPer1M: 1290,
    cacheReadCreditsPer1M: 26,
    avgLatencyMs: 1150,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Chuẩn mực tư vấn du lịch cá nhân hóa sâu sắc, lịch trình mạch lạc, tuân thủ tuyệt đối cấu trúc JSON báo giá.'
  },

  // --- TIER L4: DEEP AUDIT, ARBITRATION & FLAGSHIP ---
  {
    id: 'gpt-6-astra',
    name: 'GPT-6 Astra Flagship',
    provider: 'OpenAI',
    category: 'llm',
    recommendedLevel: 'L4_expert',
    inputCreditsPer1M: 215,
    outputCreditsPer1M: 215,
    cacheReadCreditsPer1M: 108,
    avgLatencyMs: 1380,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Mô hình suy luận cấp cao nhất của OpenAI trên RevidAPI (215 cr/1M). Chuyên phân tích vận hành, tối ưu giá và đối soát khiếu nại phức tạp.'
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'Anthropic',
    category: 'llm',
    recommendedLevel: 'L4_expert',
    inputCreditsPer1M: 430,
    outputCreditsPer1M: 2150,
    cacheReadCreditsPer1M: 43,
    avgLatencyMs: 1650,
    supportsStreaming: true,
    supportsJson: true,
    isEnabled: true,
    description: 'Trọng tài AI cấp cao: phân tích bằng chứng chuyển khoản VietQR, chuỗi hash #9-doi-soat-booking và biên tập chiến dịch CMS chuyên sâu.'
  },

  // --- TIER L5: MULTIMODAL MEDIA, VIDEO, TTS & SOCIAL SCRAPER ---
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro (Image Gen)',
    provider: 'Revid Studio',
    category: 'image',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '25 - 125 credits / job',
    avgLatencyMs: 6500,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tạo ảnh Banner CMS, ảnh biển mây Tà Xùa độ phân giải 2K (16:9) sắc nét qua POST /v1/generate.'
  },
  {
    id: 'flux',
    name: 'Flux Pro Realistic',
    provider: 'Black Forest Labs',
    category: 'image',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '38 - 63 credits / job',
    avgLatencyMs: 7200,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tạo ảnh phong cảnh núi rừng Tây Bắc, homestay gỗ và bàn trà săn mây chân thực.'
  },
  {
    id: 'gpt-image-2.5',
    name: 'GPT Image 2.5 (Flare / Sunburst)',
    provider: 'OpenAI',
    category: 'image',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '30 - 400 credits / job',
    avgLatencyMs: 8500,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tạo poster quảng bá tour trekking, ấn phẩm voucher có chữ tiếng Việt chuẩn xác.'
  },
  {
    id: 'muse-video',
    name: 'Muse Video 720p/1080p',
    provider: 'Revid Studio',
    category: 'video',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '15 - 225 credits / job (4s - 60s)',
    avgLatencyMs: 24000,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tạo video ngắn chuyển động mây luồn Đỉnh Gió từ ảnh tĩnh với chi phí tiết kiệm nhất (từ 15 credits).'
  },
  {
    id: 'kling-3.0',
    name: 'Kling 3.0 Cinema Motion',
    provider: 'Kuaishou',
    category: 'video',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '35 - 1150 credits / job',
    avgLatencyMs: 35000,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tạo video điện ảnh flycam Sống Lưng Khủng Long & Motion Control chất lượng cao.'
  },
  {
    id: 'revid-tts-vi-pro',
    name: 'Revid Vietnamese Neural TTS',
    provider: 'Revid Studio',
    category: 'tts',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '5 - 20 credits / audio',
    avgLatencyMs: 2200,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Chuyển văn bản/SRT thành giọng đọc thuyết minh tiếng Việt tự nhiên cho Bản đồ săn mây & Cảnh báo đèo (/v1/text-to-speech).'
  },
  {
    id: 'revid-tiktok-scraper',
    name: 'TikTok & Social Video Downloader',
    provider: 'Revid Media Tools',
    category: 'social_scraper',
    recommendedLevel: 'L5_media',
    creditsPerJobRange: '2 - 5 credits / request',
    avgLatencyMs: 1800,
    supportsStreaming: false,
    supportsJson: true,
    isEnabled: true,
    description: 'Tải video review Tà Xùa thực tế không logo và tìm kiếm xu hướng từ TikTok (/v1/tiktok/download & /v1/tiktok/search).'
  }
];

export const REVID_PRESET_PROFILES: RevidPresetProfile[] = [
  {
    id: 'ultra_saver',
    name: 'Mẫu 1: Tiết Kiệm Tối Đa (Ultra-Saver / Beta)',
    badge: 'Tiết kiệm ~85% Credit',
    description: 'Ưu tiên tối đa model miễn phí google/gemini-flash-lite (0 cr) và deepseek-v4-flash (38 cr/1M). Phù hợp giai đoạn thử nghiệm hoặc khi cần bảo toàn số dư ví.',
    estimatedCreditSavingPercent: 85,
    levelMapping: {
      L1_micro: {
        primaryModelId: 'google/gemini-flash-lite',
        fallbackModelId: 'deepseek-v4-flash',
        temperature: 0.1,
        maxTokens: 512,
        cacheReadEnabled: true
      },
      L2_fast: {
        primaryModelId: 'google/gemini-flash-lite',
        fallbackModelId: 'deepseek-v4-flash',
        temperature: 0.3,
        maxTokens: 1024,
        cacheReadEnabled: true
      },
      L3_reasoning: {
        primaryModelId: 'deepseek-v4-pro',
        fallbackModelId: 'gpt-5.6-luna',
        temperature: 0.4,
        maxTokens: 2048,
        cacheReadEnabled: true
      },
      L4_expert: {
        primaryModelId: 'gpt-5.6-sol',
        fallbackModelId: 'deepseek-v4-pro',
        temperature: 0.2,
        maxTokens: 2500,
        cacheReadEnabled: true
      },
      L5_media: {
        primaryModelId: 'nano-banana-pro',
        fallbackModelId: 'flux',
        temperature: 0.7,
        maxTokens: 1024,
        cacheReadEnabled: false
      }
    }
  },
  {
    id: 'balanced_ota',
    name: 'Mẫu 2: Cân Bằng Tối Ưu Cho OTA (Khuyên Dùng)',
    badge: 'Khuyên dùng · Tối ưu Giá/Chất lượng',
    description: 'Kết hợp hoàn hảo: Lọc chat miễn phí bằng Gemini Flash Lite, hỏi đáp nhanh bằng GPT-5.6 Luna, lập lịch trình & báo giá bằng GPT-5.6 Sol, đối soát cọc bằng Claude Sonnet 5.',
    estimatedCreditSavingPercent: 62,
    levelMapping: {
      L1_micro: {
        primaryModelId: 'google/gemini-flash-lite',
        fallbackModelId: 'deepseek-v4-flash',
        temperature: 0.1,
        maxTokens: 512,
        cacheReadEnabled: true
      },
      L2_fast: {
        primaryModelId: 'gpt-5.6-luna',
        fallbackModelId: 'deepseek-v4-pro',
        temperature: 0.35,
        maxTokens: 1200,
        cacheReadEnabled: true
      },
      L3_reasoning: {
        primaryModelId: 'gpt-5.6-sol',
        fallbackModelId: 'claude-sonnet-5',
        temperature: 0.4,
        maxTokens: 2800,
        cacheReadEnabled: true
      },
      L4_expert: {
        primaryModelId: 'claude-sonnet-5',
        fallbackModelId: 'gpt-6-astra',
        temperature: 0.2,
        maxTokens: 3500,
        cacheReadEnabled: true
      },
      L5_media: {
        primaryModelId: 'nano-banana-pro',
        fallbackModelId: 'muse-video',
        temperature: 0.7,
        maxTokens: 1024,
        cacheReadEnabled: false
      }
    }
  },
  {
    id: 'premium_concierge',
    name: 'Mẫu 3: Chất Lượng Cao Cấp (Premium AI Concierge)',
    badge: 'Trải nghiệm Flagship 5 Sao',
    description: 'Sử dụng dàn model mạnh nhất của Anthropic & OpenAI (Claude Sonnet 5, Claude Opus 5, GPT-6 Astra, Kling 3.0) cho chất lượng tư vấn và xử lý tranh chấp chuẩn xác tuyệt đối.',
    estimatedCreditSavingPercent: 25,
    levelMapping: {
      L1_micro: {
        primaryModelId: 'deepseek-v4-flash',
        fallbackModelId: 'google/gemini-flash-lite',
        temperature: 0.1,
        maxTokens: 600,
        cacheReadEnabled: true
      },
      L2_fast: {
        primaryModelId: 'claude-haiku-4-5',
        fallbackModelId: 'gpt-5.6-terra',
        temperature: 0.4,
        maxTokens: 1500,
        cacheReadEnabled: true
      },
      L3_reasoning: {
        primaryModelId: 'claude-sonnet-5',
        fallbackModelId: 'gpt-6-astra',
        temperature: 0.5,
        maxTokens: 4000,
        cacheReadEnabled: true
      },
      L4_expert: {
        primaryModelId: 'claude-opus-5',
        fallbackModelId: 'gpt-6-astra',
        temperature: 0.2,
        maxTokens: 4096,
        cacheReadEnabled: true
      },
      L5_media: {
        primaryModelId: 'gpt-image-2.5',
        fallbackModelId: 'kling-3.0',
        temperature: 0.8,
        maxTokens: 1024,
        cacheReadEnabled: false
      }
    }
  },
  {
    id: 'high_availability',
    name: 'Mẫu 4: Chịu Tải Mùa Cao Điểm Săn Mây (High-Speed)',
    badge: 'Độ trễ < 700ms · Chống nghẽn',
    description: 'Thiết kế riêng cho cuối tuần mùa mây (T10 - T3) khi lượng du khách truy cập tăng gấp 10 lần. Ưu tiên model tốc độ cực nhanh, bật Cache Read và xoay vòng đa khóa.',
    estimatedCreditSavingPercent: 70,
    levelMapping: {
      L1_micro: {
        primaryModelId: 'google/gemini-flash-lite',
        fallbackModelId: 'deepseek-v4-flash',
        temperature: 0.0,
        maxTokens: 400,
        cacheReadEnabled: true
      },
      L2_fast: {
        primaryModelId: 'deepseek-v4-flash',
        fallbackModelId: 'gpt-5.6-luna',
        temperature: 0.25,
        maxTokens: 1024,
        cacheReadEnabled: true
      },
      L3_reasoning: {
        primaryModelId: 'grok-4.7',
        fallbackModelId: 'gpt-5.6-sol',
        temperature: 0.35,
        maxTokens: 2200,
        cacheReadEnabled: true
      },
      L4_expert: {
        primaryModelId: 'gpt-6-astra',
        fallbackModelId: 'claude-sonnet-5',
        temperature: 0.2,
        maxTokens: 3000,
        cacheReadEnabled: true
      },
      L5_media: {
        primaryModelId: 'flux',
        fallbackModelId: 'nano-banana-pro',
        temperature: 0.6,
        maxTokens: 1024,
        cacheReadEnabled: false
      }
    }
  }
];

export const INITIAL_REVID_GATEWAY_CONFIG: RevidApiGatewayConfig = {
  enabled: true,
  baseUrl: 'https://ai.revidapi.com/v1',
  authHeaderMode: 'bearer',
  setupMode: 'preset',
  activePresetId: 'balanced_ota',
  autoComplexityRouting: true,
  autoKeyRotation: true,
  promptCachingEnabled: true,
  semanticCacheMinutes: 30,
  timeoutMs: 15000,
  maxRetries: 2,
  creditWallet: {
    balanceCredits: 4850,
    vndPer1500Credits: 99000,
    dailyCreditLimit: 600,
    usedCreditsToday: 142,
    lowBalanceAlertThreshold: 500,
    autoFallbackOnBudgetPercent: 85,
    rateLimitPerMinutePerUser: 12
  },
  apiKeys: [
    {
      id: 'key-primary-1',
      label: 'Primary Production Key (Tà Xùa Trip Web)',
      maskedKey: 'sk_live_98a7...4f21',
      rawKey: '',
      role: 'primary',
      status: 'active',
      requestsToday: 318,
      creditsUsedToday: 114,
      lastUsedAt: '2026-11-11 19:58:12'
    },
    {
      id: 'key-backup-2',
      label: 'Backup Failover Key (Chống 429 Giờ Cao Điểm)',
      maskedKey: 'sk_live_31c0...89b2',
      rawKey: '',
      role: 'backup',
      status: 'active',
      requestsToday: 24,
      creditsUsedToday: 8,
      lastUsedAt: '2026-11-11 18:15:04'
    },
    {
      id: 'key-media-3',
      label: 'CMS Media & Video Studio Key (/v1/generate)',
      maskedKey: 'sk_live_77e4...11d9',
      rawKey: '',
      role: 'media_studio',
      status: 'active',
      requestsToday: 4,
      creditsUsedToday: 20,
      lastUsedAt: '2026-11-11 16:40:00'
    }
  ],
  modelsCatalog: REVID_MODELS_CATALOG,
  featureRoutes: [
    {
      featureId: 'community_moderation_pii',
      featureName: 'Kiểm Duyệt AI Lớp 1 & Che PII (9 Phòng Chat Cộng Đồng)',
      featureDescription: 'Quét tin nhắn gạ cọc ngoài luồng, che số tài khoản/SĐT trái phép trong 9 không gian chat thời gian thực.',
      complexityLevel: 'L1_micro',
      endpointPath: '/v1/chat/completions',
      primaryModelId: 'google/gemini-flash-lite',
      fallbackModelId: 'deepseek-v4-flash',
      temperature: 0.1,
      maxTokens: 512,
      streamEnabled: false,
      cacheReadEnabled: true,
      isEnabled: true,
      avgCreditsPerCall: 0
    },
    {
      featureId: 'quick_faq_weather_transport',
      featureName: 'Hỏi Đáp Nhanh Thời Tiết Săn Mây, Giờ Xe & Giá Phòng',
      featureDescription: 'Trả lời tức thì các câu hỏi ngắn về xác suất mây Đỉnh Gió, điểm đón xe Limousine và tiện nghi phòng.',
      complexityLevel: 'L2_fast',
      endpointPath: '/v1/chat/completions',
      primaryModelId: 'gpt-5.6-luna',
      fallbackModelId: 'deepseek-v4-pro',
      temperature: 0.35,
      maxTokens: 1200,
      streamEnabled: true,
      cacheReadEnabled: true,
      isEnabled: true,
      avgCreditsPerCall: 0.18
    },
    {
      featureId: 'ai_travel_advisor_quote',
      featureName: 'Trợ Lý AI Tư Vấn Lịch Trình & Báo Giá 179 Cơ Sở',
      featureDescription: 'Phân tích ngân sách, lọc phòng trống trong 179 cơ sở, ghép Combo Xe khách + Xe máy và xuất JSON lịch trình chi tiết.',
      complexityLevel: 'L3_reasoning',
      endpointPath: '/v1/chat/completions',
      primaryModelId: 'gpt-5.6-sol',
      fallbackModelId: 'claude-sonnet-5',
      temperature: 0.4,
      maxTokens: 2800,
      streamEnabled: false,
      cacheReadEnabled: true,
      isEnabled: true,
      avgCreditsPerCall: 0.65
    },
    {
      featureId: 'dispute_evidence_arbitrator',
      featureName: 'Trọng Tài Đối Soát Khiếu Nại & Bằng Chứng Cọc VietQR',
      featureDescription: 'Phân tích ảnh chụp biên lai chuyển khoản, thẻ báo giá ràng buộc và chuỗi băm SHA-256 trong phòng #9-doi-soat-booking.',
      complexityLevel: 'L4_expert',
      endpointPath: '/v1/chat/completions',
      primaryModelId: 'claude-sonnet-5',
      fallbackModelId: 'claude-opus-5',
      temperature: 0.2,
      maxTokens: 3500,
      streamEnabled: false,
      cacheReadEnabled: true,
      isEnabled: true,
      avgCreditsPerCall: 1.85
    },
    {
      featureId: 'cms_banner_image_generator',
      featureName: 'Tạo Ảnh Banner CMS & Tọa Độ Săn Mây (Async Job)',
      featureDescription: 'Sinh ảnh nghệ thuật biển mây Tà Xùa 2K (16:9) qua POST /v1/generate & GET /v1/jobs/{job_id} để gắn trực tiếp vào CMS.',
      complexityLevel: 'L5_media',
      endpointPath: '/v1/generate',
      primaryModelId: 'nano-banana-pro',
      fallbackModelId: 'flux',
      temperature: 0.7,
      maxTokens: 1024,
      streamEnabled: false,
      cacheReadEnabled: false,
      mediaAspectRatio: '16:9',
      mediaResolution: '2k',
      isEnabled: true,
      avgCreditsPerCall: 25
    },
    {
      featureId: 'landmark_tts_audio_guide',
      featureName: 'Thuyết Minh Giọng Đọc Bản Địa Cho Điểm Săn Mây & Đèo',
      featureDescription: 'Chuyển đổi cẩm nang săn mây và cảnh báo sương mù đèo Bắc Yên thành file âm thanh tiếng Việt tự nhiên.',
      complexityLevel: 'L5_media',
      endpointPath: '/v1/text-to-speech',
      primaryModelId: 'revid-tts-vi-pro',
      fallbackModelId: 'revid-tts-vi-pro',
      temperature: 0.5,
      maxTokens: 1024,
      streamEnabled: false,
      cacheReadEnabled: false,
      isEnabled: true,
      avgCreditsPerCall: 8
    },
    {
      featureId: 'social_tiktok_review_sync',
      featureName: 'Đồng Bộ Video Review Thực Tế Từ TikTok Không Logo',
      featureDescription: 'Tải và trích xuất phụ đề các video review Tà Xùa thật từ TikTok để làm giàu nội dung Cộng đồng & Cơ sở.',
      complexityLevel: 'L5_media',
      endpointPath: '/v1/tiktok/download',
      primaryModelId: 'revid-tiktok-scraper',
      fallbackModelId: 'revid-tiktok-scraper',
      temperature: 0.0,
      maxTokens: 512,
      streamEnabled: false,
      cacheReadEnabled: false,
      isEnabled: true,
      avgCreditsPerCall: 3
    }
  ],
  asyncJobs: [
    {
      jobId: 'job_revid_99281a',
      modelId: 'nano-banana-pro',
      category: 'image',
      promptOrInput: 'Biển mây bình minh rực rỡ trên Đỉnh Gió Tà Xùa, homestay gỗ thông ấm áp, ánh nắng vàng xuyên qua mây, 2K cinematic',
      params: { aspect_ratio: '16:9', resolution: '2k' },
      status: 'completed',
      progressPercent: 100,
      creditsCost: 25,
      resultUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
      createdAt: '2026-11-11 16:39:10',
      completedAt: '2026-11-11 16:39:18'
    },
    {
      jobId: 'job_revid_99240b',
      modelId: 'muse-video',
      category: 'video',
      promptOrInput: 'Flycam lướt dọc Sống Lưng Khủng Long Tà Xùa trong biển mây cuồn cuộn lúc 6h sáng',
      params: { aspect_ratio: '16:9', resolution: '720p', duration: '6s' },
      status: 'completed',
      progressPercent: 100,
      creditsCost: 30,
      resultUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
      createdAt: '2026-11-11 14:20:05',
      completedAt: '2026-11-11 14:20:32'
    }
  ],
  callLogs: [
    {
      id: 'call-1001',
      timestamp: '2026-11-11 19:58:12',
      featureName: 'Kiểm Duyệt AI Lớp 1 (#2-ghep-xe-di-chung)',
      endpoint: 'POST /v1/chat/completions',
      complexityLevel: 'L1_micro',
      modelUsed: 'google/gemini-flash-lite',
      status: '200_ok',
      latencyMs: 340,
      inputTokens: 280,
      outputTokens: 45,
      cacheReadTokens: 180,
      creditsCharged: 0,
      keyLabel: 'Primary Production Key'
    },
    {
      id: 'call-1002',
      timestamp: '2026-11-11 19:52:40',
      featureName: 'Trợ Lý AI Tư Vấn Lịch Trình 2N1Đ (4 khách)',
      endpoint: 'POST /v1/chat/completions',
      complexityLevel: 'L3_reasoning',
      modelUsed: 'gpt-5.6-sol',
      status: '200_ok',
      latencyMs: 940,
      inputTokens: 3250,
      outputTokens: 1120,
      cacheReadTokens: 2400,
      creditsCharged: 0.62,
      keyLabel: 'Primary Production Key'
    },
    {
      id: 'call-1003',
      timestamp: '2026-11-11 19:35:19',
      featureName: 'Hỏi Đáp Nhanh Thời Tiết & Đèo Tà Xùa',
      endpoint: 'POST /v1/chat/completions',
      complexityLevel: 'L2_fast',
      modelUsed: 'gpt-5.6-luna',
      status: '200_ok',
      latencyMs: 590,
      inputTokens: 890,
      outputTokens: 260,
      cacheReadTokens: 600,
      creditsCharged: 0.14,
      keyLabel: 'Primary Production Key'
    },
    {
      id: 'call-1004',
      timestamp: '2026-11-11 18:15:04',
      featureName: 'Trọng Tài Đối Soát Khiếu Nại (Mã TK-409)',
      endpoint: 'POST /v1/chat/completions',
      complexityLevel: 'L4_expert',
      modelUsed: 'claude-sonnet-5',
      status: 'fallback_used',
      latencyMs: 1180,
      inputTokens: 4100,
      outputTokens: 980,
      cacheReadTokens: 3100,
      creditsCharged: 1.54,
      keyLabel: 'Backup Failover Key'
    }
  ]
};


