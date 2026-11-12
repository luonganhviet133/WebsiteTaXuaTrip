/**
 * N03 — Nội dung hồ sơ cơ sở mà chủ cơ sở/admin được sửa, và quy tắc kiểm tra.
 * Các trường do hệ thống quyết định (điểm sao, số đánh giá, huy hiệu, trạng thái duyệt, thống kê)
 * KHÔNG nằm trong nội dung này nên không thể tự khai qua form sửa.
 * File thuần TypeScript, dùng được cả ở Worker, Node và trình duyệt.
 */
import type {
  LocationArea,
  ServiceCategory,
  RoomType,
  MenuItem,
  ServicePackageItem,
  OpeningHours,
  MotorbikeFleet,
  PartnerBankAccount,
} from '../../types/index.ts';

export const LISTING_CATEGORIES: ServiceCategory[] = [
  'homestay', 'coffee', 'restaurant', 'bus', 'taxi', 'motorbike', 'tour', 'photo', 'costume', 'camera', 'rescue',
];

export const LISTING_AREAS: LocationArea[] = [
  'Đỉnh Gió', 'Sống Lưng Khủng Long', 'Khe Cải', 'Trung Tâm Tà Xùa', 'Mống Vàng', 'Thảo Nguyên', 'Háng Đồng', 'Bắc Yên',
];

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ListingContent {
  title: string;
  category: ServiceCategory;
  area: LocationArea;
  address: string;
  phone: string;
  zalo: string;
  facebook?: string;
  description: string;
  coverImage: string;
  images: string[];
  tags: string[];
  minPrice: number;
  priceNote?: string;
  /** null = chưa có tọa độ thật; không suy tọa độ từ khu vực. */
  coordinates: Coordinates | null;
  isInstantBooking: boolean;
  roomTypes?: RoomType[];
  menuItems?: MenuItem[];
  servicePackages?: ServicePackageItem[];
  openingHours?: OpeningHours;
  motorbikeFleet?: MotorbikeFleet;
  bankAccount?: PartnerBankAccount;
}

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult = { ok: true; content: ListingContent } | { ok: false; errors: FieldError[] };

const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])$/;

export function isValidListingId(id: string): boolean {
  return ID_RE.test(id) && !id.includes('--');
}

export function slugifyVi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

/** Tách chuỗi số điện thoại (có thể dính liền nhiều số) thành các số di động/cố định VN 10 chữ số. */
export function splitVnPhones(raw: string | undefined | null): string[] {
  if (!raw) return [];
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('84') && (digits.length === 11 || digits.length === 12)) digits = `0${digits.slice(2)}`;
  const out: string[] = [];
  while (digits.length >= 10) {
    const chunk = digits.slice(0, 10);
    if (!/^0[35789]\d{8}$/.test(chunk) && !/^02\d{8}$/.test(chunk)) return out;
    out.push(chunk);
    digits = digits.slice(10);
  }
  return out;
}

const AREA_KEYWORDS: Array<[LocationArea, string[]]> = [
  ['Đỉnh Gió', ['đỉnh gió', 'dinh gio']],
  ['Khe Cải', ['khe cải', 'khe cai']],
  ['Sống Lưng Khủng Long', ['sống lưng', 'khủng long']],
  ['Háng Đồng', ['háng đồng', 'hang dong']],
  ['Thảo Nguyên', ['thảo nguyên', 'thao nguyen']],
  ['Mống Vàng', ['mống vàng', 'mong vang']],
  ['Bắc Yên', ['thị trấn bắc yên', 'tt bắc yên']],
];

export function areaFromAddress(address: string): LocationArea {
  const text = (address || '').toLowerCase();
  for (const [area, keys] of AREA_KEYWORDS) {
    if (keys.some((k) => text.includes(k))) return area;
  }
  return 'Trung Tâm Tà Xùa';
}

const isHttpUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\/[^\s]+$/i.test(v) && v.length <= 1000;
const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Kiểm tra và chuẩn hóa nội dung gửi lên. Trường không có trong ListingContent bị bỏ. */
export function validateListingContent(input: unknown): ValidationResult {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  const errors: FieldError[] = [];
  const fail = (field: string, message: string) => errors.push({ field, message });

  const title = str(src.title, 150);
  if (title.length < 2) fail('title', 'Tên cơ sở cần ít nhất 2 ký tự.');
  if (!LISTING_CATEGORIES.includes(src.category)) fail('category', 'Loại cơ sở không hợp lệ.');
  if (!LISTING_AREAS.includes(src.area)) fail('area', 'Khu vực không hợp lệ.');

  const minPrice = src.minPrice ?? 0;
  if (!isInt(minPrice, 0, 100_000_000)) fail('minPrice', 'Giá thấp nhất phải là số nguyên VND từ 0.');

  let coordinates: Coordinates | null = null;
  if (src.coordinates != null) {
    const { lat, lng } = src.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < 8 || lat > 24 || lng < 102 || lng > 110) {
      fail('coordinates', 'Tọa độ phải nằm trong lãnh thổ Việt Nam.');
    } else {
      coordinates = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  const images = Array.isArray(src.images) ? src.images : [];
  if (images.length > 30 || !images.every(isHttpUrl)) fail('images', 'Ảnh phải là tối đa 30 đường dẫn http(s).');
  const coverImage = src.coverImage ? src.coverImage : images[0] || '';
  if (coverImage && !isHttpUrl(coverImage)) fail('coverImage', 'Ảnh bìa phải là đường dẫn http(s).');
  if (src.facebook && !isHttpUrl(src.facebook)) fail('facebook', 'Facebook phải là đường dẫn http(s).');

  const tags = Array.isArray(src.tags) ? src.tags.filter((t: unknown) => typeof t === 'string').map((t: string) => t.trim().slice(0, 60)).filter(Boolean) : [];
  if (tags.length > 20) fail('tags', 'Tối đa 20 thẻ.');

  if (src.roomTypes !== undefined) {
    const rooms = src.roomTypes;
    const roomOk =
      Array.isArray(rooms) &&
      rooms.length <= 30 &&
      rooms.every(
        (r: any) =>
          r && typeof r.id === 'string' && str(r.name, 100).length >= 2 && isInt(r.capacity, 1, 50) &&
          isInt(r.priceWeekday, 0, 100_000_000) && isInt(r.priceWeekend, 0, 100_000_000) && isInt(r.totalRooms, 0, 500)
      );
    if (!roomOk) fail('roomTypes', 'Hạng phòng cần tên, sức chứa 1–50, giá và số phòng là số nguyên không âm.');
  }

  for (const key of ['menuItems', 'servicePackages'] as const) {
    if (src[key] !== undefined && (!Array.isArray(src[key]) || src[key].length > 200)) fail(key, 'Danh sách không hợp lệ (tối đa 200 mục).');
  }

  if (errors.length) return { ok: false, errors };

  const content: ListingContent = {
    title,
    category: src.category,
    area: src.area,
    address: str(src.address, 300),
    phone: str(src.phone, 40),
    zalo: str(src.zalo, 40),
    description: str(src.description, 5000),
    coverImage,
    images,
    tags,
    minPrice,
    coordinates,
    isInstantBooking: Boolean(src.isInstantBooking),
  };
  if (src.facebook) content.facebook = src.facebook;
  const priceNote = str(src.priceNote, 300);
  if (priceNote) content.priceNote = priceNote;
  for (const key of ['roomTypes', 'menuItems', 'servicePackages'] as const) {
    if (src[key] !== undefined) (content as any)[key] = src[key];
  }
  for (const key of ['openingHours', 'motorbikeFleet', 'bankAccount'] as const) {
    if (src[key] && typeof src[key] === 'object') (content as any)[key] = src[key];
  }
  return { ok: true, content };
}
