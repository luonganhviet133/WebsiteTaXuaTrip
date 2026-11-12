import type { UserRole } from './index.ts';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleName?: string;
  facilityName?: string;
  avatar: string;
  partnerListingId?: string;
  partnerListingTitle?: string;
  ownedListingIds?: string[];
  membershipTier?: string;
  cloudPoints?: number;
  createdAt: string;
}

export interface DemoAccount {
  role: UserRole;
  roleLabel: string;
  roleDescription: string;
  email: string;
  password: string;
  user: AuthUser;
  badges: string[];
}

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccount> = {
  admin: {
    role: 'admin',
    roleLabel: 'Quản trị viên (Admin)',
    roleDescription: 'Thẩm định hồ sơ thực địa, cấp huy hiệu Cấp 1-3, kiểm tra chuỗi bằng chứng & đối soát.',
    email: 'admin@taxuatrip.vn',
    password: 'admin123',
    badges: ['Toàn quyền kiểm duyệt', 'Ký số bằng chứng', 'Quản trị viên Tà Xùa Trip'],
    user: {
      id: 'usr_admin_01',
      name: 'Nguyễn Văn Hùng',
      email: 'admin@taxuatrip.vn',
      phone: '0988 888 999',
      role: 'admin',
      roleName: 'Quản trị viên',
      facilityName: 'Ban Quản Trị Tà Xùa Trip',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01'
    }
  },
  partner: {
    role: 'partner',
    roleLabel: 'Chủ cơ sở (Homestay Owner)',
    roleDescription: 'Quản lý 179 phòng trống, cập nhật giá niêm yết, duyệt đặt phòng & quản lý số dư VietQR.',
    email: 'chuhome.may@taxuatrip.vn',
    password: 'chuhome123',
    badges: ['Chủ Mẩy Tà Xùa Homestay', 'Cấp 3 Xác Minh', 'Tọa độ Đỉnh Gió'],
    user: {
      id: 'usr_partner_01',
      name: 'Vàng A Mẩy',
      email: 'chuhome.may@taxuatrip.vn',
      phone: '0981 234 567',
      role: 'partner',
      roleName: 'Chủ cơ sở',
      facilityName: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
      partnerListingId: 'homestay-may',
      partnerListingTitle: 'Mẩy Tà Xùa Homestay & Cloud Lounge',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15'
    }
  },
  traveler: {
    role: 'traveler',
    roleLabel: 'Khách hàng (Traveler)',
    roleDescription: 'Đặt phòng trực tiếp không sợ lừa cọc, tích lũy Điểm Mây, quản lý danh sách yêu thích & gửi đánh giá.',
    email: 'khachhang@gmail.com',
    password: 'khach123',
    badges: ['Thợ Săn Mây Bạc', '180 Điểm Mây', '4 Đơn Hoàn Tất'],
    user: {
      id: 'usr_traveler_01',
      name: 'Lê Thành Đạt',
      email: 'khachhang@gmail.com',
      phone: '0912 345 678',
      role: 'traveler',
      roleName: 'Khách hàng',
      membershipTier: 'Thợ Săn Mây Bạc',
      cloudPoints: 180,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-03-10'
    }
  }
};
