import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  Eye, 
  PhoneCall, 
  CheckCircle2, 
  QrCode, 
  AlertCircle, 
  Plus, 
  Trash2,
  Save, 
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  Bus,
  Utensils,
  Coffee,
  Bike,
  Layers,
  MapPin,
  Image as ImageIcon,
  Check,
  X,
  CreditCard,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  Listing, 
  Booking, 
  PartnerWallet, 
  RoomType, 
  BusTrip, 
  BusType, 
  MotorbikeFleet, 
  MenuItem, 
  OpeningHours, 
  RouteStop,
  PartnerBankAccount,
  ServiceCategory,
  ServicePackageItem
} from '../types/index.ts';
import { 
  formatVND, 
  parseZaloAvailabilityCommand,
  calculateMotorbikeRentalCost,
  calculateRemainingMotorbikes,
  generateVehicleSeatLayout,
  getHomestayRoomSummary,
  verifyPaymentProofStatus,
  calculateBusAndMotorbikeCombo
} from '../utils/rules.ts';

interface PartnerDashboardProps {
  partnerListing: Listing;
  ownedListings?: Listing[];
  allListings?: Listing[];
  onSelectPartnerListing?: (listingId: string) => void;
  bookings: Booking[];
  wallet: PartnerWallet;
  onUpdateAvailability: (roomId: string, newAvailable: number) => void;
  onConfirmBooking: (bookingId: string) => void;
  onCheckInBooking: (bookingId: string) => void;
  onCompleteBooking: (bookingId: string) => void;
  billingEnabled: boolean;
  onUpdateListing?: (updated: Listing) => void | Promise<boolean>;
  onConfirmPaymentProof?: (bookingId: string) => void;
}

type PartnerModuleType =
  | 'homestay'
  | 'bus'
  | 'restaurant_coffee'
  | 'other_service'
  | 'profile_media'
  | 'payments_proof'
  | 'bank_vietqr'
  | 'wallet_analytics';

const getPrimaryModuleByCategory = (cat: ServiceCategory): 'homestay' | 'bus' | 'restaurant_coffee' | 'other_service' => {
  if (cat === 'homestay') return 'homestay';
  if (cat === 'bus') return 'bus';
  if (cat === 'restaurant' || cat === 'coffee') return 'restaurant_coffee';
  return 'other_service';
};

const getCategoryDisplayLabel = (cat: ServiceCategory): string => {
  const map: Record<ServiceCategory, string> = {
    homestay: 'Chủ Homestay & Lưu Trú',
    bus: 'Nhà Xe Khách & Xe Máy Kèm',
    restaurant: 'Nhà Hàng / Quán Ăn Bản Địa',
    coffee: 'Tiệm Cà Phê Săn Mây',
    motorbike: 'Cơ Sở Cho Thuê Xe Máy',
    taxi: 'Nhà Xe Taxi / Xe Hợp Đồng Nội Khu',
    tour: 'Đơn Vị Tổ Chức Tour & Trekking',
    photo: 'Thợ Ảnh (Photographer) Săn Mây',
    costume: 'Tiệm Thuê Trang Phục Dân Tộc',
    camera: 'Tiệm Cho Thuê Máy Ảnh / Flycam',
    rescue: 'Đội Cứu Hộ Đèo Dốc 24/7'
  };
  return map[cat] || cat;
};

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  partnerListing,
  ownedListings,
  allListings = [],
  onSelectPartnerListing,
  bookings,
  wallet,
  onUpdateAvailability,
  onConfirmBooking,
  onCheckInBooking,
  onCompleteBooking,
  billingEnabled,
  onUpdateListing,
  onConfirmPaymentProof
}) => {
  const primaryCategoryModule = getPrimaryModuleByCategory(partnerListing.category);

  // Main module switcher - Khóa chặt theo đúng dịch vụ của đối tác đang đăng nhập
  const [activeModule, setActiveModule] = useState<PartnerModuleType>(primaryCategoryModule);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'wallet' | 'analytics'>('calendar');
  const [qrScanInput, setQrScanInput] = useState('');
  const [qrScanFeedback, setQrScanFeedback] = useState<string | null>(null);
  const [zaloCommandInput, setZaloCommandInput] = useState('Cuối tuần còn 3 phòng đôi');
  const [zaloCommandFeedback, setZaloCommandFeedback] = useState<string | null>(null);
  const [icalSyncedAt, setIcalSyncedAt] = useState<string>('Vừa đồng bộ 5 phút trước');
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState<boolean>(false);

  // Modal preview image
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // --- PROFILE & MEDIA STATE (Dành riêng cho cơ sở đang đăng nhập) ---
  const [profileForm, setProfileForm] = useState({
    title: partnerListing.title,
    address: partnerListing.address,
    phone: partnerListing.phone,
    zalo: partnerListing.zalo,
    minPrice: partnerListing.minPrice,
    priceNote: partnerListing.priceNote || '',
    description: partnerListing.description,
    coverImage: partnerListing.coverImage,
    images: partnerListing.images || [partnerListing.coverImage]
  });
  const [newGalleryImageUrl, setNewGalleryImageUrl] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // --- OTHER SERVICE PACKAGES STATE (Cho Xe máy, Tour, Photo, Trang phục, Máy ảnh, Taxi) ---
  const getDefaultServicePackages = (listing: Listing): ServicePackageItem[] => {
    if (listing.servicePackages && listing.servicePackages.length > 0) {
      return listing.servicePackages;
    }
    if (listing.category === 'motorbike') {
      return [
        {
          id: 'pkg-mb-1',
          name: 'Xe số Honda Wave Alpha / RSX 110cc (Leo đèo khỏe)',
          price: 150000,
          halfDayPrice: 75000,
          unit: 'ngày',
          totalQuantity: 15,
          availableQuantity: 11,
          description: 'Kèm 2 mũ bảo hiểm chuẩn, 2 áo mưa, dây buộc đồ. Trả trước 12h trưa hôm sau tính nửa ngày.',
          isAvailable: true
        },
        {
          id: 'pkg-mb-2',
          name: 'Xe tay ga Honda Vision / AirBlade (Đường nhựa trung tâm)',
          price: 180000,
          halfDayPrice: 90000,
          unit: 'ngày',
          totalQuantity: 8,
          availableQuantity: 5,
          description: 'Cốp rộng để đồ thoải mái, phanh CBS an toàn. Trả trước 12h trưa hôm sau tính nửa ngày.',
          isAvailable: true
        }
      ];
    }
    return [
      {
        id: `pkg-${listing.id}-1`,
        name: `Gói Tiêu Chuẩn - ${listing.title}`,
        price: listing.minPrice || 300000,
        unit: listing.category === 'tour' ? 'người' : listing.category === 'taxi' ? 'chuyến' : 'gói',
        totalQuantity: 10,
        availableQuantity: 8,
        description: listing.priceNote || 'Cam kết đúng giá niêm yết, không phát sinh phụ phí ẩn.',
        isAvailable: true
      }
    ];
  };

  const [servicePackages, setServicePackages] = useState<ServicePackageItem[]>(() =>
    getDefaultServicePackages(partnerListing)
  );
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [newPackageData, setNewPackageData] = useState<Partial<ServicePackageItem>>({
    name: '',
    price: partnerListing.minPrice || 200000,
    halfDayPrice: Math.round((partnerListing.minPrice || 200000) / 2),
    unit: partnerListing.category === 'motorbike' ? 'ngày' : partnerListing.category === 'tour' ? 'người' : 'gói',
    totalQuantity: 10,
    availableQuantity: 10,
    description: '',
    isAvailable: true
  });

  // --- HOMESTAY STATE ---
  const [rooms, setRooms] = useState<RoomType[]>(partnerListing.roomTypes || [
    {
      id: 'r-sample-1',
      name: 'Phòng Mây Mù Ban Công Vip',
      price: 850000,
      priceWeekday: 850000,
      priceWeekend: 1050000,
      capacity: 2,
      totalRooms: 4,
      availableRooms: 2,
      viewType: 'cloud_view',
      viewDescription: 'View thung lũng mây Tà Xùa đón bình minh và hoàng hôn',
      hasWaterHeater: true,
      hasAirConditioner: true,
      hasHeaterMattress: true,
      hasPrivateBathroom: true,
      amenities: ['Máy sấy tóc', 'Ban công săn mây riêng', 'Ấm siêu tốc']
    },
    {
      id: 'r-sample-2',
      name: 'Phòng Gia Đình Ngắm Đỉnh Gió',
      price: 1200000,
      priceWeekday: 1200000,
      priceWeekend: 1450000,
      capacity: 4,
      totalRooms: 3,
      availableRooms: 1,
      viewType: 'valley_view',
      viewDescription: 'View rừng nguyên sinh và biển mây buổi sáng',
      hasWaterHeater: true,
      hasAirConditioner: true,
      hasHeaterMattress: true,
      hasPrivateBathroom: true,
      amenities: ['2 giường đôi 1m8', 'Bình nóng lạnh 30L', 'Ban công rộng']
    }
  ]);

  // Form thêm hạng phòng mới
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState<Partial<RoomType>>({
    name: '',
    price: 600000,
    priceWeekday: 600000,
    priceWeekend: 800000,
    capacity: 2,
    totalRooms: 3,
    availableRooms: 3,
    viewType: 'cloud_view',
    viewDescription: 'View nhìn ra thung lũng biển mây Tà Xùa',
    hasWaterHeater: true,
    hasAirConditioner: true,
    hasHeaterMattress: true,
    hasPrivateBathroom: true
  });

  // --- BUS FLEET STATE ---
  interface BusVehicle {
    id: string;
    vehicleName: string;
    busType: BusType;
    licensePlate: string;
    totalSeats: number;
    bookedSeats: string[]; // ['A01', 'B02', ...]
    baseFare: number;
    departureTime: string;
    stops: RouteStop[];
  }

  const [vehicles, setVehicles] = useState<BusVehicle[]>([
    {
      id: 'veh-1',
      vehicleName: 'Tà Xùa Express Limousine VIP',
      busType: 'limousine_9',
      licensePlate: '29B-889.91',
      totalSeats: 9,
      bookedSeats: ['VIP-01', 'VIP-02', 'VIP-05'],
      baseFare: 350000,
      departureTime: '06:30',
      stops: [
        { id: 's1', name: 'Bến xe Mỹ Đình (Cổng sau)', type: 'pickup', minuteOffset: 0, fareModifier: 0, pickupNote: 'Cây xăng đối diện' },
        { id: 's2', name: 'Sân bay Nội Bài (Sảnh E)', type: 'pickup', minuteOffset: 35, fareModifier: 40000, pickupNote: 'Cột số 9 sảnh tầng 2' },
        { id: 's3', name: 'Bắc Yên (Chân đèo)', type: 'both', minuteOffset: 240, fareModifier: -50000 },
        { id: 's4', name: 'Trung tâm xã Tà Xùa', type: 'dropoff', minuteOffset: 300, fareModifier: 0 }
      ]
    },
    {
      id: 'veh-2',
      vehicleName: 'Cabin Đôi Cung Điện Di Động',
      busType: 'cabin_double_deck',
      licensePlate: '26B-015.68',
      totalSeats: 24,
      bookedSeats: ['C1-01', 'C1-02', 'C2-05', 'C2-06'],
      baseFare: 420000,
      departureTime: '22:00',
      stops: [
        { id: 'sb-1', name: 'Bến xe Yên Nghĩa', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
        { id: 'sb-2', name: 'Công viên Cầu Giấy', type: 'pickup', minuteOffset: 30, fareModifier: 0 },
        { id: 'sb-3', name: 'Đỉnh Gió Tà Xùa (04:30 sáng)', type: 'dropoff', minuteOffset: 360, fareModifier: 0, pickupNote: 'Đón bình minh' }
      ]
    }
  ]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('veh-1');
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  // Motorbike Fleet đi kèm nhà xe
  const [motorbikeFleet, setMotorbikeFleet] = useState<MotorbikeFleet>({
    enabled: true,
    totalBikes: 12,
    dailyPrice: 150000,
    pricePerDay: 150000,
    comboDiscountPerBike: 20000,
    rentedOfflineCount: 4,
    notes: 'Xe số Wave Alpha và Honda Vision leo đèo khỏe, có mũ bảo hiểm và áo mưa'
  });

  // Modal thêm xe khách mới
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    vehicleName: '',
    busType: 'sleeper_double_deck' as BusType,
    licensePlate: '',
    totalSeats: 34,
    baseFare: 360000,
    departureTime: '07:00'
  });

  // Modal thêm điểm đón
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [newStopData, setNewStopData] = useState<Partial<RouteStop>>({
    name: '',
    type: 'pickup',
    minuteOffset: 30,
    fareModifier: 0,
    pickupNote: ''
  });

  // --- RESTAURANT & COFFEE STATE ---
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    partnerListing.openingHours || {
      openTime: '06:30',
      closeTime: '22:30',
      closedDaysNote: 'Mở cửa tất cả các ngày trong tuần (cả ngày lễ tết)',
      serviceNote: 'Phục vụ lẩu gà đen H’Mông, nướng than hoa Tây Bắc & Cà phê trứng ngắm biển mây sớm'
    }
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    partnerListing.menuItems || [
      {
        id: 'menu-1',
        name: 'Lẩu Gà Đen H’Mông Thảo Dược Tây Bắc',
        category: 'Lẩu nướng',
        price: 450000,
        unit: 'Nồi (3-4 người)',
        description: 'Gà đen thả đồi Tà Xùa hầm cùng sâm đương quy, táo mèo, nấm hương rừng',
        isBestSeller: true,
        isAvailable: true
      },
      {
        id: 'menu-2',
        name: 'Thịt Lợn Bản Nướng Mắc Khén Hạt Dổi',
        category: 'Món nướng',
        price: 180000,
        unit: 'Đĩa',
        description: 'Lợn cắp nách ướp gia vị người Mông nướng than hoa thơm lừng',
        isBestSeller: true,
        isAvailable: true
      },
      {
        id: 'menu-3',
        name: 'Cà Phê Trứng Bồng Bềnh Săn Mây',
        category: 'Cà phê & Đồ uống',
        price: 45000,
        unit: 'Cốc',
        description: 'Lớp kem trứng thơm ngậy đánh bông cùng cà phê hạt Robusta đậm đà',
        isBestSeller: true,
        isAvailable: true
      },
      {
        id: 'menu-4',
        name: 'Trà Táo Mèo Quế Gừng Nóng Giữ Ấm',
        category: 'Cà phê & Đồ uống',
        price: 35000,
        unit: 'Cốc',
        description: 'Trà thảo mộc thơm ấm giữa không khí se lạnh Tà Xùa',
        isBestSeller: false,
        isAvailable: true
      }
    ]
  );

  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({
    name: '',
    category: 'Món chính',
    price: 150000,
    unit: 'Đĩa',
    description: '',
    isBestSeller: false,
    isAvailable: true
  });

  // --- BANK & VIETQR CONFIG ---
  const [bankAccount, setBankAccount] = useState<PartnerBankAccount>(
    partnerListing.bankAccount || {
      bankCode: 'MB',
      bankName: 'MB Bank (Quân Đội)',
      accountNumber: '999988886666',
      accountName: 'NGUYEN VAN A - TA XUA HOST',
      accountHolder: 'NGUYEN VAN A - TA XUA HOST',
      qrPromptMessage: 'Thanh toán cọc phòng/dịch vụ Tà Xùa'
    }
  );
  const [bankSavedFeedback, setBankSavedFeedback] = useState<string | null>(null);

  // Filter bookings for this partner
  const [partnerBookingsState, setPartnerBookingsState] = useState<Booking[]>(bookings);

  // Đồng bộ toàn bộ dữ liệu và khóa chặt module khi chuyển tài khoản cơ sở đối tác
  React.useEffect(() => {
    const nextPrimary = getPrimaryModuleByCategory(partnerListing.category);
    setActiveModule(nextPrimary);
    if (partnerListing.roomTypes && partnerListing.roomTypes.length > 0) {
      setRooms(partnerListing.roomTypes);
    }
    if (partnerListing.openingHours) {
      setOpeningHours(partnerListing.openingHours);
    }
    if (partnerListing.menuItems && partnerListing.menuItems.length > 0) {
      setMenuItems(partnerListing.menuItems);
    }
    setServicePackages(getDefaultServicePackages(partnerListing));
    if (partnerListing.motorbikeFleet) {
      setMotorbikeFleet(partnerListing.motorbikeFleet);
    }
    if (partnerListing.bankAccount) {
      setBankAccount(partnerListing.bankAccount);
    }
    setProfileForm({
      title: partnerListing.title,
      address: partnerListing.address,
      phone: partnerListing.phone,
      zalo: partnerListing.zalo,
      minPrice: partnerListing.minPrice,
      priceNote: partnerListing.priceNote || '',
      description: partnerListing.description,
      coverImage: partnerListing.coverImage,
      images: partnerListing.images && partnerListing.images.length > 0 ? partnerListing.images : [partnerListing.coverImage]
    });
  }, [partnerListing.id, partnerListing.category]);

  React.useEffect(() => {
    setPartnerBookingsState(bookings);
  }, [bookings]);

  const syncListingUp = (patch: Partial<Listing>) => {
    if (onUpdateListing) {
      onUpdateListing({
        ...partnerListing,
        ...patch,
        updatedCalendarDate: new Date().toISOString().slice(0, 10)
      });
    }
  };

  // Local helper: toggle seat booked status in current vehicle
  const handleToggleSeat = (seatCode: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== currentVehicle.id) return v;
        const exists = v.bookedSeats.includes(seatCode);
        const updatedSeats = exists
          ? v.bookedSeats.filter((s) => s !== seatCode)
          : [...v.bookedSeats, seatCode];
        return { ...v, bookedSeats: updatedSeats };
      })
    );
  };

  // Local helper: update offline rented motorbikes
  const handleAdjustOfflineBikes = (delta: number) => {
    setMotorbikeFleet((prev) => {
      const nextOffline = Math.max(0, Math.min(prev.totalBikes, prev.rentedOfflineCount + delta));
      const next = { ...prev, rentedOfflineCount: nextOffline };
      syncListingUp({ motorbikeFleet: next });
      return next;
    });
  };

  // Local helper: add vehicle
  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleData.vehicleName.trim()) return;

    const newId = `veh-${Date.now()}`;
    const newVeh: BusVehicle = {
      id: newId,
      vehicleName: newVehicleData.vehicleName.trim(),
      busType: newVehicleData.busType,
      licensePlate: newVehicleData.licensePlate || '26B-999.99',
      totalSeats: Number(newVehicleData.totalSeats) || 34,
      bookedSeats: [],
      baseFare: Number(newVehicleData.baseFare) || 350000,
      departureTime: newVehicleData.departureTime || '07:00',
      stops: [
        { id: `s-${Date.now()}-1`, name: 'Hà Nội (Điểm khởi hành)', type: 'pickup', minuteOffset: 0, fareModifier: 0 },
        { id: `s-${Date.now()}-2`, name: 'Thị trấn Bắc Yên', type: 'both', minuteOffset: 240, fareModifier: -50000 },
        { id: `s-${Date.now()}-3`, name: 'Trung tâm xã Tà Xùa', type: 'dropoff', minuteOffset: 300, fareModifier: 0 }
      ]
    };

    setVehicles((prev) => [...prev, newVeh]);
    setSelectedVehicleId(newId);
    setIsAddingVehicle(false);
    setNewVehicleData({
      vehicleName: '',
      busType: 'sleeper_double_deck',
      licensePlate: '',
      totalSeats: 34,
      baseFare: 360000,
      departureTime: '07:00'
    });
  };

  // Local helper: add route stop
  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopData.name?.trim()) return;

    const createdStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: newStopData.name.trim(),
      type: newStopData.type || 'pickup',
      minuteOffset: Number(newStopData.minuteOffset) || 0,
      fareModifier: Number(newStopData.fareModifier) || 0,
      pickupNote: newStopData.pickupNote
    };

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== currentVehicle.id) return v;
        return { ...v, stops: [...v.stops, createdStop] };
      })
    );

    setIsAddingStop(false);
    setNewStopData({
      name: '',
      type: 'pickup',
      minuteOffset: 30,
      fareModifier: 0,
      pickupNote: ''
    });
  };

  // Local helper: delete route stop
  const handleDeleteStop = (stopId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== currentVehicle.id) return v;
        return { ...v, stops: v.stops.filter((s) => s.id !== stopId) };
      })
    );
  };

  // Local helper: confirm payment proof
  const handleConfirmProof = (bookingId: string) => {
    setPartnerBookingsState((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          paymentStatus: 'partner_confirmed',
          paymentProof: b.paymentProof
            ? {
                ...b.paymentProof,
                partnerConfirmedAt: new Date().toISOString()
              }
            : undefined
        };
      })
    );

    if (onConfirmPaymentProof) {
      onConfirmPaymentProof(bookingId);
    }
  };

  // Local helper: add homestay room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.name?.trim()) return;

    const createdRoom: RoomType = {
      id: `room-${Date.now()}`,
      name: newRoomData.name.trim(),
      price: Number(newRoomData.price || newRoomData.priceWeekday) || 600000,
      priceWeekday: Number(newRoomData.priceWeekday || newRoomData.price) || 600000,
      priceWeekend: Number(newRoomData.priceWeekend) || 800000,
      capacity: Number(newRoomData.capacity) || 2,
      totalRooms: Number(newRoomData.totalRooms) || 3,
      availableRooms: Number(newRoomData.availableRooms) || 3,
      viewType: newRoomData.viewType || 'cloud_view',
      viewDescription: newRoomData.viewDescription || 'View nhìn ra thung lũng mây Tà Xùa',
      hasWaterHeater: Boolean(newRoomData.hasWaterHeater),
      hasAirConditioner: Boolean(newRoomData.hasAirConditioner),
      hasHeaterMattress: Boolean(newRoomData.hasHeaterMattress),
      hasPrivateBathroom: Boolean(newRoomData.hasPrivateBathroom),
      amenities: ['Bình nóng lạnh', 'Khăn tắm', 'Trà Shan Tuyết']
    };

    const nextRooms = [...rooms, createdRoom];
    setRooms(nextRooms);
    syncListingUp({ roomTypes: nextRooms });
    setIsAddingRoom(false);
    setNewRoomData({
      name: '',
      price: 600000,
      priceWeekend: 800000,
      capacity: 2,
      totalRooms: 3,
      availableRooms: 3,
      viewType: 'cloud_view',
      viewDescription: 'View nhìn ra thung lũng biển mây Tà Xùa',
      hasWaterHeater: true,
      hasAirConditioner: true,
      hasHeaterMattress: true,
      hasPrivateBathroom: true
    });
  };

  // Local helper: add menu item
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuItem.name?.trim()) return;

    const createdItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: newMenuItem.name.trim(),
      category: newMenuItem.category || 'Món chính',
      price: Number(newMenuItem.price) || 100000,
      unit: newMenuItem.unit || 'Đĩa',
      description: newMenuItem.description,
      isBestSeller: Boolean(newMenuItem.isBestSeller),
      isAvailable: true
    };

    const nextMenu = [...menuItems, createdItem];
    setMenuItems(nextMenu);
    syncListingUp({ menuItems: nextMenu, openingHours });
    setIsAddingMenuItem(false);
    setNewMenuItem({
      name: '',
      category: 'Món chính',
      price: 150000,
      unit: 'Đĩa',
      description: '',
      isBestSeller: false,
      isAvailable: true
    });
  };

  // Local helper: add service package (cho xe máy, tour, photo, trang phục, máy ảnh, taxi)
  const handleAddServicePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackageData.name?.trim()) return;
    const createdPkg: ServicePackageItem = {
      id: `pkg-${Date.now()}`,
      name: newPackageData.name.trim(),
      price: Number(newPackageData.price) || 150000,
      halfDayPrice: partnerListing.category === 'motorbike' ? Number(newPackageData.halfDayPrice) || 75000 : undefined,
      unit: newPackageData.unit || 'ngày',
      totalQuantity: Number(newPackageData.totalQuantity) || 10,
      availableQuantity: Number(newPackageData.availableQuantity) || 10,
      description: newPackageData.description || '',
      isAvailable: true
    };
    const nextPackages = [...servicePackages, createdPkg];
    setServicePackages(nextPackages);
    syncListingUp({ servicePackages: nextPackages });
    setIsAddingPackage(false);
    setNewPackageData({
      name: '',
      price: partnerListing.minPrice || 150000,
      halfDayPrice: Math.round((partnerListing.minPrice || 150000) / 2),
      unit: partnerListing.category === 'motorbike' ? 'ngày' : 'gói',
      totalQuantity: 10,
      availableQuantity: 10,
      description: '',
      isAvailable: true
    });
  };

  // Calculate current vehicle seat layout
  const seatLayout = generateVehicleSeatLayout(
    currentVehicle.busType,
    currentVehicle.totalSeats,
    currentVehicle.bookedSeats
  );

  // Calculate motorbike stats
  const activeWebBikesBooked = partnerBookingsState.filter(
    (b) => b.status !== 'cancelled' && b.notes?.includes('xe máy')
  ).length;
  const motorbikeStats = calculateRemainingMotorbikes(motorbikeFleet, activeWebBikesBooked);

  // QR Scan
  const handleScanQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrScanInput.trim()) return;

    const matchedBooking = partnerBookingsState.find(
      (b) =>
        b.id.toLowerCase() === qrScanInput.trim().toLowerCase() ||
        b.id.includes(qrScanInput.trim())
    );

    if (matchedBooking) {
      if (matchedBooking.status === 'confirmed') {
        onCheckInBooking(matchedBooking.id);
        setQrScanFeedback(`✅ Quét thành công! Khách ${matchedBooking.guestName} đã được Check-in.`);
      } else if (matchedBooking.status === 'checked_in') {
        onCompleteBooking(matchedBooking.id);
        setQrScanFeedback(`🎉 Khách đã trả phòng & Hoàn tất! Phí 50.000đ được ghi nhận vào ví.`);
      } else {
        setQrScanFeedback(`Thông báo: Booking này đang ở trạng thái "${matchedBooking.status}".`);
      }
    } else {
      setQrScanFeedback('❌ Không tìm thấy mã booking. Vui lòng kiểm tra lại!');
    }

    setQrScanInput('');
    setTimeout(() => setQrScanFeedback(null), 5000);
  };

  // Danh sách các module được phép hiển thị cho ĐÚNG LOẠI HÌNH ĐỐI TÁC đang đăng nhập
  const allowedModules = React.useMemo(() => {
    const primaryItem =
      partnerListing.category === 'homestay'
        ? {
            id: 'homestay' as PartnerModuleType,
            label: '1. Quản Lý Homestay & Phòng Ốc',
            icon: Building2,
            desc: 'Hạng phòng, view, điều hòa, nóng lạnh'
          }
        : partnerListing.category === 'bus'
        ? {
            id: 'bus' as PartnerModuleType,
            label: '1. Quản Lý Nhà Xe & Xe Máy Kèm',
            icon: Bus,
            desc: 'Sơ đồ ghế 2 tầng, limousine, điểm đón, kho xe máy'
          }
        : partnerListing.category === 'restaurant' || partnerListing.category === 'coffee'
        ? {
            id: 'restaurant_coffee' as PartnerModuleType,
            label: `1. Quản Lý ${partnerListing.category === 'coffee' ? 'Quán Cafe' : 'Nhà Hàng / Quán Ăn'} & Menu`,
            icon: partnerListing.category === 'coffee' ? Coffee : Utensils,
            desc: 'Giờ mở/đóng cửa, thực đơn món & giá'
          }
        : {
            id: 'other_service' as PartnerModuleType,
            label: `1. Quản Lý ${getCategoryDisplayLabel(partnerListing.category)}`,
            icon: partnerListing.category === 'motorbike' ? Bike : Layers,
            desc: 'Bảng giá, số lượng trống & gói dịch vụ'
          };

    return [
      primaryItem,
      {
        id: 'profile_media' as PartnerModuleType,
        label: '2. Hồ Sơ & Hình Ảnh Cơ Sở',
        icon: ImageIcon,
        desc: 'Cập nhật thông tin, ảnh đại diện & thư viện ảnh'
      },
      {
        id: 'payments_proof' as PartnerModuleType,
        label: '3. Bằng Chứng Chuyển Khoản & Đơn',
        icon: ShieldCheck,
        desc: 'Xem biên lai khách tải lên, xác nhận tiền'
      },
      {
        id: 'bank_vietqr' as PartnerModuleType,
        label: '4. Ngân Hàng & VietQR',
        icon: CreditCard,
        desc: 'Tài khoản nhận tiền cọc của cơ sở'
      },
      {
        id: 'wallet_analytics' as PartnerModuleType,
        label: '5. Ví Cọc & Hiệu Quả',
        icon: TrendingUp,
        desc: 'Thống kê & phí 50k'
      }
    ];
  }, [partnerListing.category]);

  // Danh sách các cơ sở thuộc quyền sở hữu của đối tác hiện tại (R7: không cho phép chọn bừa cơ sở của đối tác khác)
  const accessibleListings = React.useMemo(() => {
    if (ownedListings && ownedListings.length > 0) return ownedListings;
    return [partnerListing];
  }, [ownedListings, partnerListing]);

  return (
    <div className="bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-white min-h-[800px]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Thanh chuyển đổi giữa các cơ sở sở hữu (chỉ hiển thị khi đối tác sở hữu từ 2 cơ sở trở lên) */}
        {accessibleListings.length > 1 && onSelectPartnerListing && (
          <div className="bg-slate-850/90 border border-teal-500/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-teal-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Cơ Sở Của Bạn: Chuyển Đổi Quản Trị Giữa Các Điểm Kinh Doanh Sở Hữu</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bạn sở hữu {accessibleListings.length} cơ sở đã được hệ thống phê duyệt. Chọn cơ sở cần quản trị bên cạnh:
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-300 whitespace-nowrap">Cơ sở đang chọn:</label>
              <select
                value={partnerListing.id}
                onChange={(e) => onSelectPartnerListing(e.target.value)}
                className="bg-slate-900 border border-teal-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {accessibleListings.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{getCategoryDisplayLabel(item.category)}] {item.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Host Header */}
        <div className="bg-gradient-to-r from-slate-850 via-slate-800 to-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={partnerListing.coverImage}
              alt={partnerListing.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-teal-400">
                  {getCategoryDisplayLabel(partnerListing.category)}
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  Huy hiệu Cấp {partnerListing.verificationTier} (Đã xác minh)
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Khóa quyền ngành: {partnerListing.category.toUpperCase()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {partnerListing.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Khu vực: {partnerListing.area}</span>
                <span>• Hotline: {partnerListing.phone}</span>
                <span>• Cập nhật: {partnerListing.updatedCalendarDate}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-750 p-3.5 rounded-2xl shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Số dư ví trả trước:</span>
              <span className="text-lg font-black text-teal-400">
                {formatVND(wallet.balance)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CỤM ĐIỀU HƯỚNG PHÂN HỆ CHUYÊN BIỆT (CHỈ HIỂN THỊ ĐÚNG DỊCH VỤ CỦA ĐỐI TÁC ĐANG ĐĂNG NHẬP) */}
        <div className="bg-slate-850 border border-slate-750 p-2 rounded-2xl flex flex-wrap gap-2">
          {allowedModules.map((mod) => {
            const Icon = mod.icon;
            const isSelected = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-teal-400'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================
            MODULE 1: HOMESTAY (CHỈ DÀNH CHO ĐỐI TÁC HOMESTAY)
           ======================================================== */}
        {activeModule === 'homestay' && partnerListing.category === 'homestay' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    <span>Cấu Hình Chi Tiết Các Hạng Phòng Homestay</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cập nhật chính xác số lượng phòng, view nhìn (thung lũng, mây, hoàng hôn), trang bị nóng lạnh, điều hòa, đệm sưởi và số người ở.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingRoom(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Hạng Phòng Mới</span>
                </button>
              </div>

              {/* Form thêm phòng mới nếu đang bật */}
              {isAddingRoom && (
                <form onSubmit={handleAddRoom} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                      Thêm Hạng Phòng Mới Cho Homestay
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Tên hạng phòng *</label>
                      <input
                        type="text"
                        value={newRoomData.name}
                        onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                        placeholder="Ví dụ: Phòng Đôi View Thung Lũng Mây Sớm"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Sức chứa tối đa (người) *</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={newRoomData.capacity}
                        onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Giá ngày thường (VNĐ) *</label>
                      <input
                        type="number"
                        step="50000"
                        value={newRoomData.price}
                        onChange={(e) => setNewRoomData({ ...newRoomData, price: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Giá cuối tuần T6-CN (VNĐ) *</label>
                      <input
                        type="number"
                        step="50000"
                        value={newRoomData.priceWeekend}
                        onChange={(e) => setNewRoomData({ ...newRoomData, priceWeekend: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Tổng số phòng loại này *</label>
                      <input
                        type="number"
                        min="1"
                        value={newRoomData.totalRooms}
                        onChange={(e) => setNewRoomData({ ...newRoomData, totalRooms: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Số phòng đang còn trống *</label>
                      <input
                        type="number"
                        min="0"
                        value={newRoomData.availableRooms}
                        onChange={(e) => setNewRoomData({ ...newRoomData, availableRooms: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Mô tả View nhìn tới đâu *</label>
                    <input
                      type="text"
                      value={newRoomData.viewDescription}
                      onChange={(e) => setNewRoomData({ ...newRoomData, viewDescription: e.target.value })}
                      placeholder="Ví dụ: View ngắm trọn biển mây thung lũng Tà Xùa và sống lưng khủng long"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Checklist Trang bị trong phòng (Theo đúng yêu cầu của user) */}
                  <div className="bg-slate-800/80 p-3.5 rounded-xl space-y-2 border border-slate-700">
                    <span className="text-xs font-bold text-slate-200 block">
                      Trang bị & Tiện nghi cốt lõi trong phòng:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRoomData.hasWaterHeater}
                          onChange={(e) => setNewRoomData({ ...newRoomData, hasWaterHeater: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Có bình nóng lạnh 24/7</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRoomData.hasAirConditioner}
                          onChange={(e) => setNewRoomData({ ...newRoomData, hasAirConditioner: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Có điều hòa 2 chiều</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRoomData.hasHeaterMattress}
                          onChange={(e) => setNewRoomData({ ...newRoomData, hasHeaterMattress: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Có đệm điện sưởi ấm</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRoomData.hasPrivateBathroom}
                          onChange={(e) => setNewRoomData({ ...newRoomData, hasPrivateBathroom: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Vệ sinh khép kín riêng</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
                    >
                      Lưu Hạng Phòng
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách các phòng hiện có */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => {
                  const summary = getHomestayRoomSummary(room);
                  return (
                    <div
                      key={room.id}
                      className="bg-slate-900 border border-slate-750 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-white text-base">{room.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {summary.capacityText} • Tổng cơ sở: {room.totalRooms} phòng
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                room.availableRooms > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {room.availableRooms > 0 ? `Còn ${room.availableRooms} phòng` : 'HẾT PHÒNG'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextRooms = rooms.filter((r) => r.id !== room.id);
                                setRooms(nextRooms);
                                syncListingUp({ roomTypes: nextRooms });
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg"
                              title="Xóa hạng phòng này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* View Description */}
                        <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 text-xs">
                          <span className="text-slate-400 block text-xs">Hướng nhìn (View):</span>
                          <span className="text-sky-300 font-semibold">{summary.viewText}</span>
                        </div>

                        {/* Badges trang bị */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {summary.features.map((feat, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-800 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-md font-medium"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>

                        <div className="text-xs pt-1 flex items-center justify-between text-slate-300">
                          <span>Ngày thường: <strong className="text-white">{formatVND(room.priceWeekday || room.price || 0)}</strong></span>
                          <span>Cuối tuần: <strong className="text-amber-400">{formatVND(room.priceWeekend || room.price || 0)}</strong></span>
                        </div>
                      </div>

                      {/* Nút điều chỉnh số phòng trống nhanh 1 chạm */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">
                          Phòng trống hôm nay:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = Math.max(0, room.availableRooms - 1);
                              setRooms((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, availableRooms: nextVal } : r))
                              );
                              onUpdateAvailability(room.id, nextVal);
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-black text-teal-300">
                            {room.availableRooms}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = Math.min(room.totalRooms, room.availableRooms + 1);
                              setRooms((prev) =>
                                prev.map((r) => (r.id === room.id ? { ...r, availableRooms: nextVal } : r))
                              );
                              onUpdateAvailability(room.id, nextVal);
                            }}
                            className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-base flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bot Zalo OA & iCal Sync */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-sky-950/40 border border-sky-800/60 rounded-2xl p-4 text-xs text-sky-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sky-300 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>Cập Nhật Lịch Qua Tin Nhắn Zalo OA</span>
                    </span>
                    <span className="text-xs bg-sky-500/20 px-2 py-0.5 rounded-full text-sky-300 font-bold">
                      Không cần mở web
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Chủ cơ sở chỉ cần gửi tin nhắn câu tự nhiên cho Zalo OA, bot tự động nhận diện và cập nhật:
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const parsed = parseZaloAvailabilityCommand(zaloCommandInput);
                      if (parsed.matched && parsed.availableCount !== null && rooms[0]) {
                        const targetRoom = rooms[0];
                        setRooms((prev) =>
                          prev.map((r) => (r.id === targetRoom.id ? { ...r, availableRooms: parsed.availableCount! } : r))
                        );
                        onUpdateAvailability(targetRoom.id, parsed.availableCount);
                        setZaloCommandFeedback(
                          `✅ Bot Zalo OA đã ghi nhận: Cập nhật "${targetRoom.name}" thành CÒN ${parsed.availableCount} PHÒNG.`
                        );
                      } else {
                        setZaloCommandFeedback(
                          '💡 Gợi ý cú pháp: "Cuối tuần còn 2 phòng" hoặc "Hôm nay hết phòng".'
                        );
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={zaloCommandInput}
                      onChange={(e) => setZaloCommandInput(e.target.value)}
                      placeholder="Ví dụ: Cuối tuần còn 2 phòng đôi"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs cursor-pointer shrink-0"
                    >
                      Gửi Zalo OA
                    </button>
                  </form>
                  {zaloCommandFeedback && (
                    <div className="text-xs font-bold text-emerald-300 bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/30">
                      {zaloCommandFeedback}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-4 text-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-300">
                        Đồng Bộ iCal 2 Chiều & Giữ Chỗ 30 Phút
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">{icalSyncedAt}</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Chống trùng phòng chéo giữa nền tảng và Booking.com / Airbnb. Khi bật chế độ tự động, AI tự giữ chỗ 30 phút chờ cọc.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIcalSyncedAt('Vừa đồng bộ tức thì (' + new Date().toTimeString().slice(0, 5) + ')')}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      🔄 Đồng bộ iCal ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoConfirmEnabled(!autoConfirmEnabled)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer ${
                        autoConfirmEnabled
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {autoConfirmEnabled
                        ? '🤖 AI Tự Xác Nhận: ĐANG BẬT'
                        : '✋ Xác Nhận Thủ Công (An toàn)'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE 2: NHÀ XE KHÁCH & KÈM THUÊ XE MÁY (CHỈ DÀNH CHO ĐỐI TÁC NHÀ XE)
           ======================================================== */}
        {activeModule === 'bus' && partnerListing.category === 'bus' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Header & Bộ chọn xe */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bus className="w-5 h-5 text-teal-400" />
                    <span>Quản Lý Xe Khách & Sơ Đồ Vị Trí Ghế Ngồi</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ xe 2 tầng (giường nằm, cabin), xe Limousine VIP, cấu hình điểm đón và kho xe máy cho thuê đi kèm.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingVehicle(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Xe Mới</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các xe đang vận hành */}
              <div className="flex flex-wrap gap-2">
                {vehicles.map((veh) => {
                  const isSel = veh.id === currentVehicle.id;
                  const layout = generateVehicleSeatLayout(veh.busType, veh.totalSeats, veh.bookedSeats);
                  return (
                    <button
                      key={veh.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`px-4 py-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500'
                          : 'bg-slate-900 border-slate-750 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{veh.vehicleName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-750 text-sky-300">
                          {veh.licensePlate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Loại: <span className="text-teal-300 font-medium">
                          {veh.busType === 'cabin_double_deck' ? 'Cabin Đôi 2 Tầng' : veh.busType === 'sleeper_double_deck' ? 'Giường Nằm 2 Tầng' : 'Limousine VIP'}
                        </span> • Còn trống: <span className="text-emerald-400 font-bold">{layout.availableSeatsCount}/{veh.totalSeats} chỗ</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form Thêm Xe Mới */}
              {isAddingVehicle && (
                <form onSubmit={handleCreateVehicle} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                      Thêm Phương Tiện / Xe Mới Vào Hệ Thống
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingVehicle(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Tên xe / Chuyến xe *</label>
                      <input
                        type="text"
                        value={newVehicleData.vehicleName}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, vehicleName: e.target.value })}
                        placeholder="Ví dụ: Xe Giường Nằm Chuyên Tuyến Đêm"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Loại xe (Dòng xe) *</label>
                      <select
                        value={newVehicleData.busType}
                        onChange={(e) => {
                          const val = e.target.value as BusType;
                          let defaultSeats = 34;
                          if (val === 'limousine_9') defaultSeats = 9;
                          else if (val === 'limousine_11') defaultSeats = 11;
                          else if (val === 'cabin_double_deck') defaultSeats = 24;
                          setNewVehicleData({ ...newVehicleData, busType: val, totalSeats: defaultSeats });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="sleeper_double_deck">Xe Giường Nằm 2 Tầng (34 - 40 chỗ)</option>
                        <option value="cabin_double_deck">Xe Cabin Đôi Cung Điện 2 Tầng (22 - 24 cabin)</option>
                        <option value="limousine_9">Xe Limousine 9 Chỗ VIP</option>
                        <option value="limousine_11">Xe Limousine 11 Chỗ VIP</option>
                        <option value="standard_seater">Xe Ghế Ngồi 16 - 29 Chỗ</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Biển số xe *</label>
                      <input
                        type="text"
                        value={newVehicleData.licensePlate}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, licensePlate: e.target.value })}
                        placeholder="Ví dụ: 29B-123.45"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Số lượng chỗ ngồi *</label>
                      <input
                        type="number"
                        min="7"
                        max="50"
                        value={newVehicleData.totalSeats}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, totalSeats: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Giá vé cơ bản (VNĐ) *</label>
                      <input
                        type="number"
                        step="10000"
                        value={newVehicleData.baseFare}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, baseFare: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Giờ xuất phát dự kiến *</label>
                      <input
                        type="time"
                        value={newVehicleData.departureTime}
                        onChange={(e) => setNewVehicleData({ ...newVehicleData, departureTime: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingVehicle(false)}
                      className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
                    >
                      Thêm Xe Vào Đội
                    </button>
                  </div>
                </form>
              )}

              {/* SƠ ĐỒ GHẾ NGỒI TRỰC QUAN (VỊ TRÍ CÒN TRỐNG / ĐÃ ĐẶT) */}
              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Sơ Đồ Ghế Xe: {currentVehicle.vehicleName} ({currentVehicle.licensePlate})</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Chạm vào từng vị trí để đổi nhanh trạng thái: <span className="text-emerald-400 font-bold">Còn trống</span> (xanh) hoặc <span className="text-rose-400 font-bold">Đã giữ chỗ</span> (đỏ).
                    </p>
                  </div>

                  {/* Chú giải màu sắc */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-teal-500/50 inline-block" />
                      <span className="text-slate-300">Trống ({seatLayout.availableSeatsCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-rose-600 inline-block" />
                      <span className="text-slate-300">Đã đặt ({seatLayout.bookedSeatsCount})</span>
                    </div>
                    {seatLayout.busType.includes('limousine') && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-amber-500/30 border border-amber-400 inline-block" />
                        <span className="text-slate-300">VIP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hiển thị tầng 1 và tầng 2 nếu là xe 2 tầng */}
                {seatLayout.isTwoFloors ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tầng 1 */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                        <span>TẦNG 1 (DƯỚI) - Thuận tiện lên xuống</span>
                        <span className="text-xs text-slate-400">{seatLayout.floor1.length} vị trí</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {seatLayout.floor1.map((seat) => (
                          <button
                            key={seat.code}
                            type="button"
                            onClick={() => handleToggleSeat(seat.code)}
                            className={`p-2 rounded-xl text-center text-xs font-black transition-all cursor-pointer border ${
                              seat.isBooked
                                ? 'bg-rose-900/60 border-rose-600 text-rose-200'
                                : 'bg-slate-800 hover:bg-slate-750 border-teal-500/40 text-teal-300 hover:border-teal-400'
                            }`}
                            title={seat.isBooked ? 'Bấm để mở trống' : 'Bấm để đánh dấu đã đặt'}
                          >
                            <span className="block">{seat.code}</span>
                            <span className="text-xs font-normal block opacity-75">
                              {seat.isBooked ? 'Đã đặt' : 'Trống'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tầng 2 */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span>TẦNG 2 (TRÊN) - Ngắm cảnh thoáng mát</span>
                        <span className="text-xs text-slate-400">{seatLayout.floor2.length} vị trí</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {seatLayout.floor2.map((seat) => (
                          <button
                            key={seat.code}
                            type="button"
                            onClick={() => handleToggleSeat(seat.code)}
                            className={`p-2 rounded-xl text-center text-xs font-black transition-all cursor-pointer border ${
                              seat.isBooked
                                ? 'bg-rose-900/60 border-rose-600 text-rose-200'
                                : 'bg-slate-800 hover:bg-slate-750 border-teal-500/40 text-teal-300 hover:border-teal-400'
                            }`}
                            title={seat.isBooked ? 'Bấm để mở trống' : 'Bấm để đánh dấu đã đặt'}
                          >
                            <span className="block">{seat.code}</span>
                            <span className="text-xs font-normal block opacity-75">
                              {seat.isBooked ? 'Đã đặt' : 'Trống'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Xe 1 tầng Limousine */
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-teal-300">
                      <span>KHOANG HÀNH KHÁCH LIMOUSINE VIP</span>
                      <span className="text-xs text-slate-400">{seatLayout.floor1.length} ghế</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-2xl mx-auto py-2">
                      {seatLayout.floor1.map((seat) => (
                        <button
                          key={seat.code}
                          type="button"
                          onClick={() => handleToggleSeat(seat.code)}
                          className={`p-3 rounded-2xl text-center text-xs font-black transition-all cursor-pointer border ${
                            seat.isBooked
                              ? 'bg-rose-900/60 border-rose-600 text-rose-200'
                              : seat.isVip
                              ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 hover:border-amber-400'
                              : 'bg-slate-800 hover:bg-slate-750 border-teal-500/40 text-teal-300'
                          }`}
                        >
                          <span className="block text-sm">{seat.code}</span>
                          <span className="text-xs font-medium block mt-0.5">
                            {seat.isBooked ? 'Đã đặt' : seat.isVip ? 'Ghế VIP' : 'Trống'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LỘ TRÌNH & ĐIỂM ĐÓN TRÊN ĐƯỜNG */}
              <div className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>Lộ Trình & Điểm Đón/Trả Khách Của Chuyến Xe</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Thêm các điểm đón trên lộ trình giúp khách hàng chọn trạm gần nhất và tính phụ thu tự động.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingStop(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    + Thêm Điểm Đón
                  </button>
                </div>

                {/* Form thêm điểm đón */}
                {isAddingStop && (
                  <form onSubmit={handleAddStop} className="bg-slate-850 p-4 rounded-xl border border-teal-500/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300 block mb-1">Tên điểm đón/trả *</label>
                        <input
                          type="text"
                          value={newStopData.name}
                          onChange={(e) => setNewStopData({ ...newStopData, name: e.target.value })}
                          placeholder="Ví dụ: Ngã 3 Phù Yên / Cổng Sân bay Nội Bài"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Phút sau khi xe chạy</label>
                        <input
                          type="number"
                          value={newStopData.minuteOffset}
                          onChange={(e) => setNewStopData({ ...newStopData, minuteOffset: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Phụ thu (nếu có, VNĐ)</label>
                        <input
                          type="number"
                          value={newStopData.fareModifier}
                          onChange={(e) => setNewStopData({ ...newStopData, fareModifier: Number(e.target.value) })}
                          placeholder="0 hoặc 40000"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Ghi chú đón khách</label>
                      <input
                        type="text"
                        value={newStopData.pickupNote}
                        onChange={(e) => setNewStopData({ ...newStopData, pickupNote: e.target.value })}
                        placeholder="Ví dụ: Đón tại cột số 9 tầng 2 sảnh quốc nội"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingStop(false)}
                        className="px-3 py-1.5 rounded-xl text-xs bg-slate-800 text-slate-300"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl text-xs bg-teal-600 text-white font-bold cursor-pointer"
                      >
                        Lưu Điểm Đón
                      </button>
                    </div>
                  </form>
                )}

                {/* Danh sách các điểm đón */}
                <div className="space-y-2">
                  {currentVehicle.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="bg-slate-850 p-3 rounded-xl border border-slate-750 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white text-sm">{stop.name}</span>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Loại: {stop.type === 'pickup' ? 'Đón khách' : stop.type === 'dropoff' ? 'Trả khách' : 'Đón & Trả'} • Sau {stop.minuteOffset} phút
                            {stop.fareModifier !== 0 && (
                              <span className="ml-2 text-amber-300 font-semibold">
                                ({stop.fareModifier > 0 ? `+${formatVND(stop.fareModifier)}` : formatVND(stop.fareModifier)})
                              </span>
                            )}
                          </div>
                          {stop.pickupNote && (
                            <div className="text-xs text-sky-300 italic mt-0.5">* {stop.pickupNote}</div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteStop(stop.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Xóa điểm đón này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* QUẢN LÝ DỊCH VỤ XE MÁY ĐI KÈM (COMBO XE KHÁCH + THUÊ XE MÁY) */}
              <div className="bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Bike className="w-4 h-4 text-sky-400" />
                      <span>Kho Xe Máy Đi Kèm & Cấu Hình Combo Tiết Kiệm</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Tự động trừ số lượng khi khách đặt combo trên website. Nhà xe cập nhật số lượng cho thuê bên ngoài để đồng bộ chính xác.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-sky-300 cursor-pointer self-start sm:self-auto bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      checked={motorbikeFleet.enabled}
                      onChange={(e) => setMotorbikeFleet({ ...motorbikeFleet, enabled: e.target.checked })}
                      className="rounded text-teal-600"
                    />
                    <span>{motorbikeFleet.enabled ? 'Đang Mở Thuê Xe Máy' : 'Đang Tạm Khóa'}</span>
                  </label>
                </div>

                {motorbikeFleet.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Thẻ 1: Cấu hình ban đầu */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                      <span className="text-xs text-slate-400 block">Cấu hình kho xe ban đầu:</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Tổng xe hiện có:</span>
                        <input
                          type="number"
                          min="0"
                          value={motorbikeFleet.totalBikes}
                          onChange={(e) => setMotorbikeFleet({ ...motorbikeFleet, totalBikes: Number(e.target.value) })}
                          className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-right font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">Giá thuê/ngày (VNĐ):</span>
                        <input
                          type="number"
                          step="10000"
                          value={motorbikeFleet.dailyPrice}
                          onChange={(e) => setMotorbikeFleet({ ...motorbikeFleet, dailyPrice: Number(e.target.value) })}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-teal-300 text-right font-bold"
                        />
                      </div>
                    </div>

                    {/* Thẻ 2: Cụm xác nhận cho thuê thêm bên ngoài (Theo đúng yêu cầu) */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                      <span className="text-xs text-slate-400 block">Xe đã cho thuê trực tiếp bên ngoài:</span>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-black text-amber-400">
                          {motorbikeFleet.rentedOfflineCount} xe
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustOfflineBikes(-1)}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 cursor-pointer"
                            title="Khách ngoài trả xe (-1)"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustOfflineBikes(1)}
                            className="w-8 h-8 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center cursor-pointer shadow-sm"
                            title="Cho thuê khách ngoài (+1)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        Bấm (+) khi có khách thuê vãng lai, (-) khi nhận lại xe.
                      </p>
                    </div>

                    {/* Thẻ 3: Tình trạng khả dụng cho khách trên web */}
                    <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Số xe còn lại cho khách đặt Web:</span>
                        <div className="text-2xl font-black text-emerald-400 mt-1">
                          {motorbikeStats.availableBikes} xe trống
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 border-t border-slate-800 pt-1.5 space-y-0.5">
                        <div>Đã đặt qua web: <strong className="text-sky-300">{motorbikeStats.activeWebBookingsCount} xe</strong></div>
                        <div>Tỷ lệ thuê: <strong className="text-slate-200">{motorbikeFleet.totalBikes > 0 ? Math.round(((motorbikeFleet.totalBikes - motorbikeStats.availableBikes) / motorbikeFleet.totalBikes) * 100) : 0}%</strong></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE 3: QUÁN ĂN & CAFE (CHỈ DÀNH CHO ĐỐI TÁC QUÁN ĂN / CAFE)
           ======================================================== */}
        {activeModule === 'restaurant_coffee' &&
          (partnerListing.category === 'restaurant' || partnerListing.category === 'coffee') && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-teal-400" />
                    <span>Quản Lý Giờ Hoạt Động & Thực Đơn Món Ăn / Đồ Uống</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cập nhật giờ mở - đóng cửa chính xác, danh sách món lẩu nướng đặc sản, cà phê săn mây và đơn giá phục vụ khách du lịch.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingMenuItem(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Món Vào Menu</span>
                </button>
              </div>

              {/* Giờ mở - đóng cửa */}
              <div className="bg-slate-900 border border-slate-750 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span>Thời Gian Mở Cửa & Đóng Cửa Cơ Sở</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Đang mở cửa đón khách
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Giờ mở cửa buổi sáng</label>
                    <input
                      type="time"
                      value={openingHours.openTime}
                      onChange={(e) => setOpeningHours({ ...openingHours, openTime: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Giờ đóng cửa buổi tối</label>
                    <input
                      type="time"
                      value={openingHours.closeTime}
                      onChange={(e) => setOpeningHours({ ...openingHours, closeTime: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Lịch nghỉ (nếu có)</label>
                    <input
                      type="text"
                      value={openingHours.closedDaysNote || ''}
                      onChange={(e) => setOpeningHours({ ...openingHours, closedDaysNote: e.target.value })}
                      placeholder="Mở cả tuần hoặc nghỉ thứ 2"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ghi chú dịch vụ ẩm thực (Hiển thị cho khách & AI)</label>
                  <input
                    type="text"
                    value={openingHours.serviceNote || ''}
                    onChange={(e) => setOpeningHours({ ...openingHours, serviceNote: e.target.value })}
                    placeholder="Ví dụ: Đặt lẩu trước 30 phút để nhà bếp ướp gà đen tươi ngon nhất"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Form thêm món mới */}
              {isAddingMenuItem && (
                <form onSubmit={handleAddMenuItem} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                      Thêm Món Ăn / Đồ Uống Mới Vào Thực Đơn
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingMenuItem(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Tên món ăn / đồ uống *</label>
                      <input
                        type="text"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                        placeholder="Ví dụ: Lẩu cá hồi Tây Bắc"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Phân loại món *</label>
                      <select
                        value={newMenuItem.category}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="Lẩu nướng">Lẩu & Nướng Tây Bắc</option>
                        <option value="Món chính">Món chính / Cơm bản</option>
                        <option value="Cà phê & Đồ uống">Cà phê & Trà săn mây</option>
                        <option value="Đặc sản mang về">Đặc sản mua về</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Đơn vị tính *</label>
                      <input
                        type="text"
                        value={newMenuItem.unit}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, unit: e.target.value })}
                        placeholder="Nồi, Bát, Đĩa, Cốc, Ly"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Đơn giá (VNĐ) *</label>
                      <input
                        type="number"
                        step="5000"
                        value={newMenuItem.price}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, price: Number(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-slate-300 block mb-1">Mô tả nguyên liệu / hương vị</label>
                      <input
                        type="text"
                        value={newMenuItem.description || ''}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                        placeholder="Ví dụ: Ướp hạt dổi mắc khén nướng trên than củi"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMenuItem.isBestSeller}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, isBestSeller: e.target.checked })}
                        className="rounded text-amber-500"
                      />
                      <span>Đánh dấu là món Đặc Sản / Bán Chạy Nhất (Best Seller)</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingMenuItem(false)}
                      className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer"
                    >
                      Lưu Món Vào Menu
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách các món trong Menu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-750 p-4 rounded-2xl flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{item.name}</span>
                        {item.isBestSeller && (
                          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            ⭐ Best Seller
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Nhóm: {item.category} • Đơn vị: {item.unit}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-300 italic">{item.description}</p>
                      )}
                      <div className="text-sm font-black text-teal-400 pt-1">
                        {formatVND(item.price)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuItems((prev) =>
                            prev.map((m) => (m.id === item.id ? { ...m, isAvailable: !m.isAvailable } : m))
                          );
                        }}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          item.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.isAvailable ? 'Đang phục vụ' : 'Tạm hết món'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const nextMenu = menuItems.filter((m) => m.id !== item.id);
                          setMenuItems(nextMenu);
                          syncListingUp({ menuItems: nextMenu });
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE CHUYÊN BIỆT CHO ĐỐI TÁC XE MÁY, TOUR, PHOTO, TRANG PHỤC, MÁY ẢNH, TAXI
           ======================================================== */}
        {activeModule === 'other_service' &&
          !['homestay', 'bus', 'restaurant', 'coffee'].includes(partnerListing.category) && (
            <div className="space-y-6">
              <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {partnerListing.category === 'motorbike' ? (
                        <Bike className="w-5 h-5 text-teal-400" />
                      ) : (
                        <Layers className="w-5 h-5 text-teal-400" />
                      )}
                      <span>Quản Lý Gói Dịch Vụ & Bảng Giá ({getCategoryDisplayLabel(partnerListing.category)})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {partnerListing.category === 'motorbike'
                        ? 'Cập nhật các dòng xe máy cho thuê, số lượng xe còn trống, đơn giá theo ngày và mốc trả xe trước 12h trưa hôm sau tính nửa ngày.'
                        : 'Cập nhật danh mục gói dịch vụ, đơn giá niêm yết và số lượng suất / thiết bị còn trống trong ngày.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingPackage(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Gói / Dòng Xe Mới</span>
                  </button>
                </div>

                {partnerListing.category === 'motorbike' && (
                  <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-amber-300 block">
                        Quy tắc tính giá thuê xe máy chuẩn Tà Xùa Trip:
                      </span>
                      <span>
                        Khách thuê tính theo ngày. Nếu khách trả xe <strong>trước 12:00 trưa ngày hôm sau</strong> thì phần ngày hôm sau chỉ tính <strong>nửa ngày (0.5 ngày)</strong>; trả từ sau 12:00 trưa tính tròn 1 ngày.
                      </span>
                    </div>
                  </div>
                )}

                {isAddingPackage && (
                  <form onSubmit={handleAddServicePackage} className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                        Thêm Gói Dịch Vụ / Phương Tiện Mới
                      </span>
                      <button type="button" onClick={() => setIsAddingPackage(false)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300 block mb-1">Tên gói dịch vụ / dòng xe *</label>
                        <input
                          type="text"
                          value={newPackageData.name || ''}
                          onChange={(e) => setNewPackageData({ ...newPackageData, name: e.target.value })}
                          placeholder="VD: Xe số Honda Wave RSX / Gói chụp ảnh bình minh Đỉnh Gió"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Đơn vị tính *</label>
                        <input
                          type="text"
                          value={newPackageData.unit || ''}
                          onChange={(e) => setNewPackageData({ ...newPackageData, unit: e.target.value })}
                          placeholder="ngày, người, gói, chuyến, bộ/ngày"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Đơn giá (VNĐ) *</label>
                        <input
                          type="number"
                          step="10000"
                          value={newPackageData.price || 0}
                          onChange={(e) => setNewPackageData({ ...newPackageData, price: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      {partnerListing.category === 'motorbike' && (
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">Giá nửa ngày (&lt;12h trưa)</label>
                          <input
                            type="number"
                            step="5000"
                            value={newPackageData.halfDayPrice || 0}
                            onChange={(e) => setNewPackageData({ ...newPackageData, halfDayPrice: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Tổng số lượng</label>
                        <input
                          type="number"
                          min="1"
                          value={newPackageData.totalQuantity || 1}
                          onChange={(e) => setNewPackageData({ ...newPackageData, totalQuantity: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-300 block mb-1">Đang còn trống</label>
                        <input
                          type="number"
                          min="0"
                          value={newPackageData.availableQuantity || 0}
                          onChange={(e) => setNewPackageData({ ...newPackageData, availableQuantity: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Mô tả chi tiết gói / quyền lợi đi kèm</label>
                      <input
                        type="text"
                        value={newPackageData.description || ''}
                        onChange={(e) => setNewPackageData({ ...newPackageData, description: e.target.value })}
                        placeholder="VD: Đã bao gồm mũ bảo hiểm, áo mưa / Bao gồm 50 ảnh chỉnh màu..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAddingPackage(false)} className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300">
                        Hủy
                      </button>
                      <button type="submit" className="px-5 py-2 rounded-xl text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer">
                        Lưu Gói Dịch Vụ
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servicePackages.map((pkg) => (
                    <div key={pkg.id} className="bg-slate-900 border border-slate-750 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-base">{pkg.name}</h4>
                            <p className="text-xs text-slate-400">
                              Đơn vị: {pkg.unit} • Tổng: {pkg.totalQuantity || 10}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = servicePackages.filter((p) => p.id !== pkg.id);
                              setServicePackages(next);
                              syncListingUp({ servicePackages: next });
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Xóa gói dịch vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {pkg.description && (
                          <p className="text-xs text-slate-300 bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                            {pkg.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span>
                            Giá chuẩn: <strong className="text-teal-400 text-sm">{formatVND(pkg.price)}/{pkg.unit}</strong>
                          </span>
                          {pkg.halfDayPrice && (
                            <span>
                              Nửa ngày (&lt;12h): <strong className="text-amber-300">{formatVND(pkg.halfDayPrice)}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300">Số lượng còn trống hôm nay:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = servicePackages.map((p) =>
                                p.id === pkg.id ? { ...p, availableQuantity: Math.max(0, (p.availableQuantity ?? 0) - 1) } : p
                              );
                              setServicePackages(next);
                              syncListingUp({ servicePackages: next });
                            }}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-black text-emerald-400">
                            {pkg.availableQuantity ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = servicePackages.map((p) =>
                                p.id === pkg.id
                                  ? { ...p, availableQuantity: Math.min(p.totalQuantity || 50, (p.availableQuantity ?? 0) + 1) }
                                  : p
                              );
                              setServicePackages(next);
                              syncListingUp({ servicePackages: next });
                            }}
                            className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* ========================================================
            MODULE HỒ SƠ & HÌNH ẢNH CƠ SỞ (DÀNH RIÊNG CHO ĐỐI TÁC ĐANG ĐĂNG NHẬP)
           ======================================================== */}
        {activeModule === 'profile_media' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-teal-400" />
                    <span>Hồ Sơ Thông Tin & Thư Viện Ảnh Của Cơ Sở</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Cập nhật mô tả, giá từ, hotline/Zalo, ảnh đại diện và thêm/xóa hình ảnh thực tế của cơ sở hiển thị ngoài trang chủ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    syncListingUp({
                      title: profileForm.title,
                      address: profileForm.address,
                      phone: profileForm.phone,
                      zalo: profileForm.zalo,
                      minPrice: Number(profileForm.minPrice) || partnerListing.minPrice,
                      priceNote: profileForm.priceNote,
                      description: profileForm.description,
                      coverImage: profileForm.coverImage,
                      images: profileForm.images
                    });
                    setProfileSavedMsg('✅ Đã lưu và đồng bộ thông tin & hình ảnh cơ sở ra trang chủ!');
                    setTimeout(() => setProfileSavedMsg(null), 3500);
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Hồ Sơ & Ảnh Cơ Sở</span>
                </button>
              </div>

              {profileSavedMsg && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3 rounded-xl">
                  {profileSavedMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Tên cơ sở hiển thị *</label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Số điện thoại / Zalo liên hệ *</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value, zalo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Giá thấp nhất hiển thị (VNĐ) *</label>
                  <input
                    type="number"
                    step="10000"
                    value={profileForm.minPrice}
                    onChange={(e) => setProfileForm({ ...profileForm, minPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Ghi chú giá & ưu đãi đi kèm</label>
                <input
                  type="text"
                  value={profileForm.priceNote}
                  onChange={(e) => setProfileForm({ ...profileForm, priceNote: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Mô tả chi tiết cơ sở</label>
                <textarea
                  rows={3}
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-teal-300 block">Ảnh đại diện chính (Cover Image URL)</label>
                <div className="flex gap-3 items-center">
                  <img src={profileForm.coverImage} alt="Cover" className="w-20 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
                  <input
                    type="text"
                    value={profileForm.coverImage}
                    onChange={(e) => setProfileForm({ ...profileForm, coverImage: e.target.value })}
                    placeholder="Dán link ảnh đại diện..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-teal-300">
                    Thư viện ảnh thực tế của cơ sở ({profileForm.images.length} ảnh)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGalleryImageUrl}
                      onChange={(e) => setNewGalleryImageUrl(e.target.value)}
                      placeholder="Dán URL ảnh mới..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white w-64"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newGalleryImageUrl.trim()) return;
                        setProfileForm({
                          ...profileForm,
                          images: [...profileForm.images, newGalleryImageUrl.trim()]
                        });
                        setNewGalleryImageUrl('');
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      + Thêm Ảnh
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {profileForm.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-750 bg-slate-900">
                      <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-28 object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            images: profileForm.images.filter((_, i) => i !== idx)
                          })
                        }
                        className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-500 text-white p-1 rounded-lg text-xs font-bold cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE 4: BẰNG CHỨNG CHUYỂN KHOẢN & ĐƠN ĐẶT (THEO YÊU CẦU 1)
           ======================================================== */}
        {activeModule === 'payments_proof' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-400" />
                    <span>Đối Soát Bằng Chứng Chuyển Khoản & Giải Quyết Khiếu Nại</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Khách hàng nộp ảnh biên lai chuyển khoản cọc. Đối tác kiểm tra hình ảnh và xác nhận đã nhận tiền làm căn cứ pháp lý minh bạch.
                  </p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cơ chế bảo vệ 2 chiều</span>
                </div>
              </div>

              {/* Danh sách các đơn đặt phòng/xe kèm bằng chứng chuyển khoản */}
              <div className="space-y-4">
                {partnerBookingsState.map((b) => {
                  const proofStatus = verifyPaymentProofStatus(b);
                  return (
                    <div
                      key={b.id}
                      className="bg-slate-900 border border-slate-750 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-sky-400">{b.id}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${proofStatus.statusBadgeColor}`}>
                            {proofStatus.statusLabel}
                          </span>
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Tạo: {new Date(b.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {b.guestName} • <span className="text-teal-300">{b.guestPhone}</span>
                        </h4>

                        <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Dịch vụ: <strong>{b.listingTitle}</strong> ({b.roomName || 'Ghế xe / Tiêu chuẩn'})</span>
                          <span>Số khách: <strong>{b.guestsCount} người</strong></span>
                          <span>Thời gian: <strong>{b.checkInDate} → {b.checkOutDate}</strong></span>
                        </div>

                        {b.notes && (
                          <p className="text-xs text-amber-300 italic bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                            * Ghi chú khách: {b.notes}
                          </p>
                        )}
                      </div>

                      {/* Khung bằng chứng thanh toán (Payment Proof Photo) */}
                      <div className="flex items-center gap-4 bg-slate-850 p-3.5 rounded-2xl border border-slate-750 shrink-0">
                        {proofStatus.hasProof && proofStatus.proofImageUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer" onClick={() => setPreviewImageUrl(proofStatus.proofImageUrl!)}>
                              <img
                                src={proofStatus.proofImageUrl}
                                alt="Biên lai chuyển khoản"
                                className="w-16 h-16 rounded-xl object-cover border border-slate-700 group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>

                            <div className="text-xs">
                              <span className="text-slate-400 block text-xs">Ảnh biên lai khách nộp:</span>
                              <span className="text-emerald-400 font-bold block">
                                Đã chuyển cọc {formatVND(b.totalAmount * 0.3)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(proofStatus.proofImageUrl!)}
                                className="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <span>Phóng to xem ảnh</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 text-xs text-slate-400 px-3 py-2">
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                            <span>Khách chưa nộp ảnh chuyển khoản</span>
                          </div>
                        )}

                        {/* Nút hành động xác nhận tiền */}
                        <div className="border-l border-slate-750 pl-3 flex flex-col gap-1.5">
                          {b.paymentStatus === 'partner_confirmed' ? (
                            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              <Check className="w-4 h-4" />
                              <span>Đã Nhận Tiền</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConfirmProof(b.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Xác Nhận Đã Nhận Tiền</span>
                            </button>
                          )}

                          <div className="text-right text-xs text-slate-400">
                            Tổng bill: <strong className="text-teal-300">{formatVND(b.totalAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE 5: TÀI KHOẢN NGÂN HÀNG & VIETQR (ĐỀ XUẤT NÂNG CẤP)
           ======================================================== */}
        {activeModule === 'bank_vietqr' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    <span>Cấu Hình Tài Khoản Nhận Cọc & VietQR Trực Tiếp Cơ Sở</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Khách hàng quét mã VietQR chuyển khoản cọc thẳng vào tài khoản của bạn. Không qua bên thứ ba giam giữ tiền.
                  </p>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Tiền về tài khoản ngay lập tức</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form cấu hình tài khoản */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBankSavedFeedback('✅ Đã lưu cấu hình tài khoản VietQR thành công!');
                    setTimeout(() => setBankSavedFeedback(null), 4000);
                  }}
                  className="bg-slate-900 border border-slate-750 rounded-2xl p-5 space-y-4"
                >
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wide block">
                    Thông Tin Tài Khoản Ngân Hàng Thụ Hưởng
                  </span>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Ngân hàng thụ hưởng *</label>
                    <select
                      value={bankAccount.bankName}
                      onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="MB Bank (Quân Đội)">MB Bank - Ngân hàng Quân Đội</option>
                      <option value="Vietcombank">Vietcombank - Ngân hàng Ngoại Thương</option>
                      <option value="Techcombank">Techcombank - Ngân hàng Kỹ Thương</option>
                      <option value="BIDV">BIDV - Ngân hàng Đầu Tư và Phát Triển</option>
                      <option value="Agribank">Agribank - Ngân hàng Nông Nghiệp</option>
                      <option value="VPBank">VPBank - Ngân hàng Việt Nam Thịnh Vượng</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Số tài khoản ngân hàng *</label>
                    <input
                      type="text"
                      value={bankAccount.accountNumber}
                      onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Tên chủ tài khoản (In hoa không dấu) *</label>
                    <input
                      type="text"
                      value={bankAccount.accountHolder}
                      onChange={(e) => setBankAccount({ ...bankAccount, accountHolder: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Lời nhắn thanh toán gợi ý</label>
                    <input
                      type="text"
                      value={bankAccount.qrPromptMessage || ''}
                      onChange={(e) => setBankAccount({ ...bankAccount, qrPromptMessage: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Cấu Hình VietQR</span>
                  </button>

                  {bankSavedFeedback && (
                    <div className="text-xs font-bold text-emerald-400 bg-slate-800 p-2.5 rounded-xl border border-emerald-500/30 text-center">
                      {bankSavedFeedback}
                    </div>
                  )}
                </form>

                {/* Bản xem trước VietQR thực tế */}
                <div className="bg-slate-900 border border-slate-750 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-xs font-bold text-slate-400">Mã VietQR Động Hiển Thị Cho Khách:</span>
                  <div className="bg-white p-4 rounded-2xl shadow-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=247000${bankAccount.accountNumber}`}
                      alt="VietQR Demo"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-white text-sm">{bankAccount.accountHolder}</div>
                    <div className="text-teal-400 font-mono font-bold">{bankAccount.accountNumber} ({bankAccount.bankName})</div>
                    <div className="text-xs text-slate-400">Nội dung chuyển khoản tự động gắn mã Booking: <strong>TX-XXXX</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODULE 6: VÍ TRẢ TRƯỚC, PHÍ SÀN 50K & HIỆU QUẢ
           ======================================================== */}
        {activeModule === 'wallet_analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-850 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-750">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-teal-400" />
                    <span>Ví Trả Trước Đối Tác & Đối Soát Phí Sàn 50.000đ</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Minh bạch tuyệt đối: Hệ thống chỉ trừ 50.000đ khi khách thực tế đến và check-in thành công.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Chính sách thu phí hiện hành:</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      billingEnabled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {billingEnabled ? 'Đang bật thu phí (50k/booking)' : 'Miễn phí hoàn toàn (Giai đoạn Beta)'}
                  </span>
                </div>
              </div>

              {/* Wallet cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400">Số dư khả dụng ví:</span>
                  <div className="text-xl font-black text-teal-400 mt-1">{formatVND(wallet.balance)}</div>
                  <button className="mt-3 text-xs bg-teal-600/30 hover:bg-teal-600/40 text-teal-300 font-bold px-3 py-1.5 rounded-xl border border-teal-500/30 cursor-pointer">
                    Nạp thêm qua QR payOS
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400">Số đơn hoàn tất thành công:</span>
                  <div className="text-xl font-black text-white mt-1">{wallet.completedBookingsCount} đơn</div>
                  <span className="text-xs text-emerald-400">Khách đã đến & check-in thực tế</span>
                </div>

                <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl">
                  <span className="text-xs text-slate-400">Tổng phí sàn ghi nhận:</span>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {formatVND(wallet.completedBookingsCount * 50000)}
                  </div>
                  <span className="text-xs text-slate-400">Chỉ trừ tiền thực tế khi bật cờ thu</span>
                </div>
              </div>

              {/* Hiệu quả & Thống kê */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-900 border border-slate-750 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                    <span>Lượt xem cơ sở trên bản đồ mây</span>
                    <Eye className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{partnerListing.stats.views.toLocaleString()}</div>
                  <span className="text-xs text-emerald-400 mt-1 block">Tăng 38% trong mùa săn mây</span>
                </div>

                <div className="bg-slate-900 border border-slate-750 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                    <span>Lượt bấm gọi Hotline & Zalo</span>
                    <PhoneCall className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-teal-400">{partnerListing.stats.callClicks} lượt</div>
                  <span className="text-xs text-slate-400 mt-1 block">Liên hệ trực tiếp không qua trung gian</span>
                </div>

                <div className="bg-slate-900 border border-slate-750 p-5 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                    <span>Tổng booking tiếp nhận</span>
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-300">{partnerListing.stats.bookingsCount} đơn</div>
                  <span className="text-xs text-slate-400 mt-1 block">Tỷ lệ hài lòng 98%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PHÓNG TO BIÊN LAI CHUYỂN KHOẢN */}
        {previewImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-400" />
                  <span>Bằng Chứng Thanh Toán Khách Hàng Tải Lên</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center max-h-[70vh]">
                <img
                  src={previewImageUrl}
                  alt="Biên lai chuyển khoản phóng to"
                  className="w-full h-auto object-contain max-h-[65vh]"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">Hình ảnh được lưu trữ làm bằng chứng giải quyết khiếu nại</span>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
