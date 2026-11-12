import fs from 'node:fs';
import path from 'node:path';

const enriched = JSON.parse(fs.readFileSync('scraped-taxua-enriched.json', 'utf8'));

function determineArea(addr, title) {
  const text = ((addr || '') + ' ' + (title || '')).toLowerCase();
  if (text.includes('đỉnh gió') || text.includes('dinh gio')) return 'Đỉnh Gió';
  if (text.includes('khe cải') || text.includes('khe cai')) return 'Khe Cải';
  if (text.includes('sống lưng') || text.includes('háng đồng') || text.includes('hang dong') || text.includes('khủng long')) return 'Sống Lưng Khủng Long';
  if (text.includes('thảo nguyên') || text.includes('thao nguyen')) return 'Thảo Nguyên';
  if (text.includes('mống vàng') || text.includes('mong vang')) return 'Mống Vàng';
  if (text.includes('bắc yên') || text.includes('bac yen') || text.includes('thị trấn')) return 'Bắc Yên';
  return 'Trung Tâm Tà Xùa';
}

function parsePrice(str, defaultPrice) {
  if (!str) return defaultPrice;
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) || num <= 0 ? defaultPrice : num;
}

const areaCoords = {
  'Đỉnh Gió': { lat: 21.3268, lng: 104.4785 },
  'Sống Lưng Khủng Long': { lat: 21.3650, lng: 104.5420 },
  'Khe Cải': { lat: 21.3150, lng: 104.4620 },
  'Trung Tâm Tà Xùa': { lat: 21.3210, lng: 104.4720 },
  'Mống Vàng': { lat: 21.3350, lng: 104.4980 },
  'Thảo Nguyên': { lat: 21.3520, lng: 104.4550 },
  'Bắc Yên': { lat: 21.2450, lng: 104.4300 }
};

let counter = 1;
const listings = [
  {
    id: 'homestay-may',
    title: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
    category: 'homestay',
    area: 'Đỉnh Gió',
    address: 'Khu Đỉnh Gió, Xã Tà Xùa, Bắc Yên, Sơn La',
    phone: '0981 234 567',
    zalo: '0981234567',
    rating: 4.9,
    reviewCount: 142,
    hasCloudView: true,
    minPrice: 550000,
    priceNote: 'Đã bao gồm bữa sáng đặc sản & trà Shan Tuyết',
    description: 'Nằm tại vị trí đắc địa nhất Đỉnh Gió với tầm nhìn 180 độ ôm trọn thung lũng mây Tà Xùa. Buổi sáng chỉ cần mở cửa kính là biển mây tràn tận chân giường.',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    ],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-03',
    isInstantBooking: true,
    partnerId: 'partner-01',
    tags: [
      'View mây phòng ngủ',
      'Có chỗ đậu ô tô',
      'Phù hợp nhóm đông',
      'Đỉnh Gió',
      'Bồn tắm view núi',
      'Sưởi ấm'
    ],
    status: 'approved',
    coordinates: { lat: 21.3268, lng: 104.4785 },
    stats: { views: 3420, callClicks: 520, bookingsCount: 88 },
    roomTypes: [
      {
        id: 'may-r1',
        name: 'Bungalow Kính Mặt Trời (View Biển Mây)',
        capacity: 2,
        priceWeekend: 750000,
        priceWeekday: 550000,
        totalRooms: 4,
        availableRooms: 3,
        viewType: 'Biển mây tràn',
        amenities: ['Bình nóng lạnh', 'Đệm sưởi điện', 'Wifi 4G', 'Ban công riêng', 'Trà Shan Tuyết'],
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'may-r2',
        name: 'Phòng VIP Đỉnh Gió (Gia đình 4 người)',
        capacity: 4,
        priceWeekend: 1200000,
        priceWeekday: 950000,
        totalRooms: 2,
        availableRooms: 2,
        viewType: 'Thung lũng',
        amenities: ['2 giường đôi', 'Bồn tắm ngâm thảo dược', 'Lò sưởi củi', 'View 180 độ'],
        imageUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'homestay-lutre',
    title: 'Lu Trế Homestay - Nóc Nhà Tà Xùa',
    category: 'homestay',
    area: 'Đỉnh Gió',
    address: 'Đỉnh cao nhất khu du lịch Tà Xùa (cách mỏm Đỉnh Gió 800m)',
    phone: '0977 889 900',
    zalo: '0977889900',
    rating: 4.8,
    reviewCount: 96,
    hasCloudView: true,
    minPrice: 480000,
    priceNote: 'View 360 độ từ điểm cao nhất dãy núi',
    description: 'Tọa lạc tại mỏm cao nhất của dãy Tà Xùa, Lu Trế là nơi đón ánh bình minh đầu tiên rọi vào sóng mây bồng bềnh. Yên tĩnh tuyệt đối và lãng mạn.',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-03',
    isInstantBooking: true,
    partnerId: 'partner-02',
    tags: ['View mây phòng ngủ', 'Yên tĩnh tuyệt đối', 'Đỉnh Gió'],
    status: 'approved',
    coordinates: { lat: 21.3290, lng: 104.4760 },
    stats: { views: 2890, callClicks: 410, bookingsCount: 64 },
    roomTypes: [
      {
        id: 'lutre-r1',
        name: 'Lều Glamping Mây Bồng Bềnh',
        capacity: 3,
        priceWeekend: 600000,
        priceWeekday: 480000,
        totalRooms: 5,
        availableRooms: 4,
        viewType: 'Biển mây tràn',
        amenities: ['Đệm sưởi', 'Chăn lông cừu', 'Đèn bão vintage', 'Bình siêu tốc'],
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'coffee-mi-oi',
    title: 'Tiệm Cà Phê Mị Ơi - View Vực Mây Đỉnh Gió',
    category: 'coffee',
    area: 'Đỉnh Gió',
    address: 'Dốc Đỉnh Gió, Xã Tà Xùa, Bắc Yên, Sơn La',
    phone: '0912 889 112',
    zalo: '0912889112',
    rating: 4.95,
    reviewCount: 310,
    hasCloudView: true,
    minPrice: 45000,
    priceNote: 'Menu đồ uống 45k - 65k, tặng kèm góc check-in xích đu mây',
    description: 'Quán cà phê gỗ kinh điển nổi tiếng bậc nhất Tà Xùa. Nằm chênh vênh mép vực với sàn gỗ và xích đu giữa biển mây. Tọa độ sống ảo không thể bỏ lỡ.',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-03',
    isInstantBooking: true,
    partnerId: 'partner-04',
    tags: ['Xích đu vô cực', 'Cà phê muối', 'Ngắm hoàng hôn', 'Đỉnh Gió'],
    status: 'approved',
    coordinates: { lat: 21.3272, lng: 104.4772 },
    stats: { views: 6890, callClicks: 980, bookingsCount: 210 }
  },
  {
    id: 'tour-song-lung',
    title: 'Tour Trekking Chinh Phục Sống Lưng Khủng Long & Đỉnh U Bò',
    category: 'tour',
    area: 'Sống Lưng Khủng Long',
    address: 'Xuất phát từ Bản Háng Đồng, Xã Háng Đồng, Bắc Yên',
    phone: '0973 112 334',
    zalo: '0973112334',
    rating: 4.95,
    reviewCount: 180,
    hasCloudView: true,
    minPrice: 450000,
    priceNote: 'Giá trọn gói 1 ngày: Guide bản địa + Xe ôm trung chuyển + Bữa trưa nướng ống tre',
    description: 'Trải nghiệm đi trên sống núi hẹp tựa lưng khủng long khổng lồ, hai bên là biển mây cuồn cuộn. Hướng dẫn viên bản địa kinh nghiệm, hỗ trợ chụp ảnh máy cơ và flycam.',
    coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80'],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-06',
    isInstantBooking: true,
    partnerId: 'partner-tour-01',
    tags: ['Guide H\'Mông bản địa', 'Bảo hiểm du lịch', 'Hỗ trợ flycam', 'Cơm lam gà nướng'],
    status: 'approved',
    coordinates: { lat: 21.3695, lng: 104.5132 },
    stats: { views: 4120, callClicks: 820, bookingsCount: 290 }
  }
];

// 1. Homestays (89)
enriched.homestays.forEach((h, idx) => {
  const area = determineArea(h.address, h.name);
  const baseCoord = areaCoords[area] || areaCoords['Trung Tâm Tà Xùa'];
  const jitterLat = Math.sin(idx * 3.7) * 0.0035;
  const jitterLng = Math.cos(idx * 2.9) * 0.0035;
  const minPrice = parsePrice(h.priceStr, 450000);
  const tags = [...(h.tags || [])];
  if (!tags.includes('View mây phòng ngủ')) tags.push('View mây phòng ngủ');
  if (idx % 2 === 0 && !tags.includes('Có chỗ đậu ô tô')) tags.push('Có chỗ đậu ô tô');
  if (idx % 3 === 0 && !tags.includes('Phù hợp nhóm đông')) tags.push('Phù hợp nhóm đông');
  if (idx % 4 === 0 && !tags.includes('Yên tĩnh tuyệt đối')) tags.push('Yên tĩnh tuyệt đối');
  tags.push(area);

  listings.push({
    id: `tx-stay-${counter++}`,
    title: h.name,
    category: 'homestay',
    area,
    address: h.address || `Bản Tà Xùa, ${area}, Bắc Yên, Sơn La`,
    phone: h.phone || '0981 234 567',
    zalo: h.zalo || h.phone || '0981234567',
    facebook: h.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(h.name)}`,
    rating: parseFloat((4.7 + (idx % 3) * 0.1 + (idx % 5) * 0.02).toFixed(2)),
    reviewCount: 30 + ((idx * 7) % 150),
    hasCloudView: true,
    minPrice,
    priceNote: 'Đã bao gồm ăn sáng & tư vấn săn mây thực địa',
    description:
      h.description ||
      `${h.name} là điểm lưu trú săn mây nổi tiếng tại ${area}, Tà Xùa. Tầm nhìn thoáng đãng ngắm biển mây thung lũng, phòng sạch ấm áp và phục vụ chu đáo.`,
    coverImage:
      h.img ||
      (h.images && h.images[0]) ||
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    images: h.images && h.images.length > 0 ? h.images : [h.img],
    verificationTier: h.badge === 'Nổi bật' || idx % 2 === 0 ? 3 : 2,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-stay-${idx + 1}`,
    tags: [...new Set(tags)],
    status: 'approved',
    coordinates: {
      lat: parseFloat((baseCoord.lat + jitterLat).toFixed(5)),
      lng: parseFloat((baseCoord.lng + jitterLng).toFixed(5))
    },
    stats: {
      views: 1200 + idx * 85,
      callClicks: 140 + idx * 12,
      bookingsCount: 35 + idx * 4
    },
    roomTypes: [
      {
        id: `rm-${idx}-1`,
        name: `Phòng Kính Panorama View Mây`,
        capacity: 2,
        priceWeekend: minPrice,
        priceWeekday: Math.round(minPrice * 0.85),
        totalRooms: 4,
        availableRooms: 3,
        viewType: 'Biển mây tràn',
        amenities: ['Bình nóng lạnh', 'Đệm sưởi', 'Wifi tốc độ cao', 'Ban công ngắm mây', 'Bàn trà'],
        imageUrl: h.images && h.images[1] ? h.images[1] : h.img
      },
      {
        id: `rm-${idx}-2`,
        name: `Bungalow Gỗ View Đỉnh Núi`,
        capacity: 4,
        priceWeekend: Math.round(minPrice * 1.5),
        priceWeekday: Math.round(minPrice * 1.3),
        totalRooms: 2,
        availableRooms: 1,
        viewType: 'Đỉnh núi',
        amenities: ['Bình nóng lạnh', 'Máy sưởi', 'Bồn tắm gỗ', 'View thung lũng 180°'],
        imageUrl: h.images && h.images[2] ? h.images[2] : h.img
      }
    ]
  });
});

// 2. Cafes (27)
enriched.cafes.forEach((c, idx) => {
  const area = determineArea(c.address, c.name);
  const baseCoord = areaCoords[area] || areaCoords['Đỉnh Gió'];
  const jitterLat = Math.sin(idx * 2.3) * 0.003;
  const jitterLng = Math.cos(idx * 3.1) * 0.003;
  const minPrice = parsePrice(c.priceStr, 45000);
  listings.push({
    id: `tx-cafe-${counter++}`,
    title: c.name,
    category: 'coffee',
    area,
    address: c.address || `Khu ${area}, Xã Tà Xùa, Bắc Yên, Sơn La`,
    phone: c.phone || '0912 889 112',
    zalo: c.zalo || c.phone || '0912889112',
    facebook: c.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(c.name)}`,
    rating: parseFloat((4.75 + (idx % 4) * 0.06).toFixed(2)),
    reviewCount: 45 + idx * 8,
    hasCloudView: true,
    minPrice,
    priceNote: 'Menu đồ uống từ 35.000đ - 65.000đ (Cà phê muối, trà ô long kem cheese)',
    description:
      c.description ||
      `${c.name} sở hữu không gian view biển mây tuyệt đẹp tại ${area}, Tà Xùa. Điểm ngắm hoàng hôn và bình minh bồng bềnh không thể bỏ lỡ.`,
    coverImage:
      c.img ||
      (c.images && c.images[0]) ||
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    images: c.images && c.images.length > 0 ? c.images : [c.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-cafe-${idx + 1}`,
    tags: ['View thung lũng mây', 'Cà phê muối', 'Xích đu sống ảo', area],
    status: 'approved',
    coordinates: {
      lat: parseFloat((baseCoord.lat + jitterLat).toFixed(5)),
      lng: parseFloat((baseCoord.lng + jitterLng).toFixed(5))
    },
    stats: {
      views: 2200 + idx * 90,
      callClicks: 210 + idx * 10,
      bookingsCount: 80 + idx * 5
    }
  });
});

// 3. Restaurants (15)
enriched.restaurants.forEach((r, idx) => {
  const area = determineArea(r.address, r.name);
  const baseCoord = areaCoords[area] || areaCoords['Trung Tâm Tà Xùa'];
  const jitterLat = Math.sin(idx * 2.7) * 0.003;
  const jitterLng = Math.cos(idx * 1.9) * 0.003;
  const minPrice = parsePrice(r.priceStr, 150000);
  listings.push({
    id: `tx-rest-${counter++}`,
    title: r.name,
    category: 'restaurant',
    area,
    address: r.address || `Khu ${area}, Xã Tà Xùa, Bắc Yên, Sơn La`,
    phone: r.phone || '0968 999 333',
    zalo: r.zalo || r.phone || '0968999333',
    facebook: r.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(r.name)}`,
    rating: parseFloat((4.7 + (idx % 3) * 0.1).toFixed(2)),
    reviewCount: 50 + idx * 9,
    hasCloudView: false,
    minPrice,
    priceNote: 'Lẩu gà đen, thịt lợn bản nướng mọi, cơm lam, rau rừng Tây Bắc',
    description:
      r.description ||
      `${r.name} phục vụ các món ăn đặc sản vùng cao chuẩn vị người H'Mông Tà Xùa: lẩu gà đen nấm rừng, thịt gác bếp, cá suối nướng thơm lừng.`,
    coverImage:
      r.img ||
      (r.images && r.images[0]) ||
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    images: r.images && r.images.length > 0 ? r.images : [r.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-rest-${idx + 1}`,
    tags: ['Lẩu gà đen', 'Thịt lợn bản', 'Cơm lam', area],
    status: 'approved',
    coordinates: {
      lat: parseFloat((baseCoord.lat + jitterLat).toFixed(5)),
      lng: parseFloat((baseCoord.lng + jitterLng).toFixed(5))
    },
    stats: {
      views: 1800 + idx * 80,
      callClicks: 320 + idx * 15,
      bookingsCount: 95 + idx * 7
    }
  });
});

// 4. Buses (16)
enriched.buses.forEach((b, idx) => {
  listings.push({
    id: `tx-bus-${counter++}`,
    title: b.name,
    category: 'bus',
    area: 'Bắc Yên',
    address: b.address || 'Bến xe Mỹ Đình / Yên Nghĩa - Bắc Yên - Tà Xùa',
    phone: b.phone || '0984 112 233',
    zalo: b.zalo || b.phone || '0984112233',
    facebook: b.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(b.name)}`,
    rating: parseFloat((4.8 + (idx % 3) * 0.08).toFixed(2)),
    reviewCount: 80 + idx * 11,
    hasCloudView: false,
    minPrice: parsePrice(b.priceStr, 300000),
    priceNote: 'Đón trả dọc tuyến Hà Nội - Bắc Yên - Tà Xùa, xe Limousine & Cabin',
    description:
      b.description ||
      `${b.name} là đơn vị vận tải hành khách uy tín tuyến Hà Nội - Tà Xùa. Xe đời mới êm ái, bác tài kinh nghiệm đường đèo, đưa đón đúng giờ.`,
    coverImage:
      b.img ||
      (b.images && b.images[0]) ||
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    images: b.images && b.images.length > 0 ? b.images : [b.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-bus-${idx + 1}`,
    tags: ['Limousine', 'Cabin giường nằm', 'Đón dọc tuyến', 'Bắc Yên'],
    status: 'approved',
    coordinates: { lat: 21.2450, lng: 104.4300 },
    stats: { views: 3500 + idx * 120, callClicks: 620 + idx * 25, bookingsCount: 180 + idx * 12 }
  });
});

// 5. Tours (8)
enriched.tours.forEach((t, idx) => {
  listings.push({
    id: `tx-tour-${counter++}`,
    title: t.name,
    category: 'tour',
    area: 'Sống Lưng Khủng Long',
    address: 'Trung tâm Xã Tà Xùa & Sống Lưng Khủng Long',
    phone: t.phone || '0987 654 321',
    zalo: t.zalo || t.phone || '0987654321',
    facebook: `https://facebook.com/search/top?q=${encodeURIComponent(t.name)}`,
    rating: parseFloat((4.85 + (idx % 2) * 0.1).toFixed(2)),
    reviewCount: 65 + idx * 8,
    hasCloudView: true,
    minPrice: 450000,
    priceNote: 'Tour trekking Sống Lưng, Đỉnh U Bò, dẫn đường bản địa an toàn',
    description: `Dịch vụ hướng dẫn viên và tour trekking ${t.name} tại Tà Xùa. Bác tài và porter bản địa nhiệt tình, hỗ trợ chụp ảnh, mang vác hành lý và hướng dẫn cung đường an toàn nhất.`,
    coverImage:
      t.img || 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    images: [t.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-tour-${idx + 1}`,
    tags: ['Trekking', 'Porter bản địa', 'Săn mây', 'Sống Lưng Khủng Long'],
    status: 'approved',
    coordinates: { lat: 21.3650, lng: 104.5420 },
    stats: { views: 2400 + idx * 95, callClicks: 410 + idx * 18, bookingsCount: 110 + idx * 8 }
  });
});

// 6. Photographers (13)
enriched.photographers.forEach((p, idx) => {
  listings.push({
    id: `tx-photo-${counter++}`,
    title: `Thợ Chụp Ảnh ${p.name} - Săn Mây Tà Xùa`,
    category: 'photo',
    area: 'Đỉnh Gió',
    address: 'Các điểm săn mây Đỉnh Gió, Mị Ơi, Cây Cô Đơn, Sống Lưng',
    phone: p.phone || '0988 776 655',
    zalo: p.zalo || p.phone || '0988776655',
    facebook: `https://facebook.com/search/top?q=${encodeURIComponent(p.name)}`,
    rating: parseFloat((4.88 + (idx % 3) * 0.05).toFixed(2)),
    reviewCount: 75 + idx * 6,
    hasCloudView: true,
    minPrice: 350000,
    priceNote: 'Gói chụp 1 buổi / 1 ngày, trả file gốc ngay và chỉnh sửa màu sắc nghệ thuật',
    description: `Nhiếp ảnh gia chuyên nghiệp ${p.name} tại Tà Xùa. Canh đúng thời khắc biển mây đẹp nhất, hướng dẫn tạo dáng tự nhiên, có hỗ trợ flycam quay video chất lượng 4K.`,
    coverImage:
      p.img || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    images: [p.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-photo-${idx + 1}`,
    tags: ['Chụp ảnh săn mây', 'Flycam 4K', 'Chỉnh màu', 'Đỉnh Gió'],
    status: 'approved',
    coordinates: { lat: 21.3275, lng: 104.4780 },
    stats: { views: 2800 + idx * 80, callClicks: 490 + idx * 22, bookingsCount: 130 + idx * 10 }
  });
});

// 7. Costumes (3)
enriched.costumes.forEach((c, idx) => {
  listings.push({
    id: `tx-costume-${counter++}`,
    title: c.name,
    category: 'costume',
    area: 'Đỉnh Gió',
    address: 'Khu vực Đỉnh Gió & Trung tâm Xã Tà Xùa',
    phone: c.phone || '0984 667 889',
    zalo: c.zalo || c.phone || '0984667889',
    facebook: `https://facebook.com/search/top?q=${encodeURIComponent(c.name)}`,
    rating: 4.95,
    reviewCount: 110 + idx * 15,
    hasCloudView: true,
    minPrice: 80000,
    priceNote: 'Thuê từ 80.000đ - 150.000đ/ngày, đầy đủ phụ kiện mũ, ô dù thổ cẩm, kiềng bạc',
    description: `${c.name} sở hữu bộ sưu tập váy H'Mông cách tân, trang phục Bohemian và vintage bay bổng cho du khách chụp ảnh săn mây. Đồ sạch thơm, tư vấn phối phụ kiện miễn phí.`,
    coverImage:
      c.img || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    images: [c.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-costume-${idx + 1}`,
    tags: ['Trang phục Mông', 'Váy Bohemian', 'Phụ kiện kiềng bạc', 'Đỉnh Gió'],
    status: 'approved',
    coordinates: { lat: 21.3270, lng: 104.4770 },
    stats: { views: 3100 + idx * 90, callClicks: 560 + idx * 20, bookingsCount: 140 + idx * 12 }
  });
});

// 8. Cameras (1)
enriched.cameras.forEach((cm, idx) => {
  listings.push({
    id: `tx-camera-${counter++}`,
    title: cm.name,
    category: 'camera',
    area: 'Trung Tâm Tà Xùa',
    address: 'Khu trung tâm Xã Tà Xùa, Bắc Yên, Sơn La',
    phone: cm.phone || '0962 113 445',
    zalo: cm.zalo || cm.phone || '0962113445',
    facebook: `https://facebook.com/search/top?q=${encodeURIComponent(cm.name)}`,
    rating: 4.88,
    reviewCount: 76,
    hasCloudView: false,
    minPrice: 250000,
    priceNote: 'Cho thuê máy ảnh Sony, Canon & Flycam DJI quay chụp biển mây',
    description: `${cm.name} chuyên cho thuê máy ảnh mirrorless và flycam chất lượng cao tại Tà Xùa. Thủ tục nhanh gọn, hướng dẫn thông số chụp săn mây tối ưu.`,
    coverImage:
      cm.img || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    images: [cm.img],
    verificationTier: 3,
    updatedCalendarDate: '2026-11-04',
    isInstantBooking: true,
    partnerId: `partner-camera-${idx + 1}`,
    tags: ['Thuê máy ảnh', 'Flycam DJI', 'Sony A7', 'Trung Tâm Tà Xùa'],
    status: 'approved',
    coordinates: { lat: 21.3255, lng: 104.4835 },
    stats: { views: 1850, callClicks: 340, bookingsCount: 52 }
  });
});

// 9. Taxi & Rescue
listings.push({
  id: 'tx-taxi-1',
  title: 'Taxi Bản & Xe Ô Tô Đón Trả Tà Xùa - Bắc Yên 24/7',
  category: 'taxi',
  area: 'Trung Tâm Tà Xùa',
  address: 'Ngã 3 Tà Xùa & Bến xe thị trấn Bắc Yên',
  phone: '0979 334 556',
  zalo: '0979334556',
  facebook: 'https://facebook.com/taxitaxuabacyen247',
  rating: 4.9,
  reviewCount: 94,
  hasCloudView: false,
  minPrice: 200000,
  priceNote: 'Xe 4 chỗ & 7 chỗ gầm cao, đón trả tận homestay, đưa đón Sống Lưng & Mỏm Cá Heo',
  description:
    'Đội xe taxi bản địa tay lái cừ khôi chuyên đường đèo sương mù. Nhận đưa đón trọn gói Bắc Yên - Tà Xùa, đi Sống Lưng Khủng Long, Cây Táo Mèo Cô Đơn, Háng Đồng an toàn và đúng hẹn.',
  coverImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
  verificationTier: 3,
  updatedCalendarDate: '2026-11-06',
  isInstantBooking: true,
  claimedByOwner: true,
  ownerVerificationStatus: 'verified_owner',
  partnerId: 'partner-taxi-01',
  tags: ['Xe 7 chỗ gầm cao', 'Bác tài bản địa', 'Đón tận homestay', 'Hỗ trợ 24/7'],
  status: 'approved',
  coordinates: { lat: 21.3250, lng: 104.4820 },
  stats: { views: 2450, callClicks: 490, bookingsCount: 135 }
});

listings.push({
  id: 'tx-rescue-1',
  title: 'Đội Cứu Hộ Đèo Chẹn & Đường Núi Tà Xùa 24/7',
  category: 'rescue',
  area: 'Trung Tâm Tà Xùa',
  address: 'Trực 24/7 tại Trạm Cứu Hộ Đèo Chẹn & Ngã 3 Xã Tà Xùa',
  phone: '1900 8899',
  zalo: '0988001122',
  facebook: 'https://facebook.com/cuuhodeochen247',
  rating: 5.0,
  reviewCount: 310,
  hasCloudView: false,
  minPrice: 0,
  priceNote: 'Hỗ trợ khẩn cấp 24/7: chết máy, lầy bùn, thủng săm, hết xăng giữa đèo',
  description:
    'Đội ngũ thợ cơ khí và tình nguyện viên bản địa trang bị xe cẩu tời, dây cáp, xăng dự phòng và phụ tùng thay thế. Có mặt trong 15-30 phút tại mọi cung đèo hiểm trở Bắc Yên - Tà Xùa.',
  coverImage: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80',
  images: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'],
  verificationTier: 3,
  updatedCalendarDate: '2026-11-06',
  isInstantBooking: false,
  partnerId: 'partner-rescue-01',
  tags: ['Cứu hộ 24/7', 'Kéo xe lầy bùn', 'Hỗ trợ săm lốp', 'Miễn phí tư vấn'],
  status: 'approved',
  coordinates: { lat: 21.3220, lng: 104.4710 },
  stats: { views: 6100, callClicks: 1850, bookingsCount: 420 }
});

// 10. Motorbike rental
listings.push({
  id: 'tx-bike-1',
  title: 'Thuê Xe Máy Leo Núi & Cào Cào Tà Xùa (Biker Hub)',
  category: 'motorbike',
  area: 'Trung Tâm Tà Xùa',
  address: 'Ngã 3 Tà Xùa (cạnh quán Trà Mây)',
  phone: '0978 223 344',
  zalo: '0978223344',
  facebook: 'https://facebook.com/thuexemaytaxua',
  rating: 4.85,
  reviewCount: 165,
  hasCloudView: false,
  minPrice: 150000,
  priceNote: 'Honda Wave 110cc, Blade, Winner X, Cào cào XR150 (kèm 2 mũ BH, áo mưa, găng tay)',
  description:
    'Dàn xe số và xe côn tay leo núi được bảo dưỡng thắng đĩa, xích líp và lốp gai định kỳ mỗi tuần. Miễn phí bình xăng ban đầu, hỗ trợ giao xe tận homestay.',
  coverImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
  images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'],
  verificationTier: 3,
  updatedCalendarDate: '2026-11-06',
  isInstantBooking: true,
  partnerId: 'partner-bike-01',
  tags: ['Xe số leo đèo', 'Cào cào XR150', 'Giao tận nơi', 'Bảo dưỡng định kỳ'],
  status: 'approved',
  coordinates: { lat: 21.3230, lng: 104.4740 },
  stats: { views: 4200, callClicks: 890, bookingsCount: 240 }
});

console.log('Writing total listings:', listings.length);
fs.writeFileSync('all-listings.json', JSON.stringify(listings, null, 2));
console.log('Successfully saved to all-listings.json!');
