/**
 * N06.1 — Tạo chuỗi VietQR (chuẩn NAPAS 247 theo EMVCo) ngay trong mã, không gọi dịch vụ ngoài.
 * Kiểm bằng chuỗi mẫu công khai (payment.test.ts). Ứng dụng ngân hàng đọc chuỗi này và điền sẵn
 * ngân hàng, số tài khoản, số tiền, nội dung; người chuyển vẫn tự bấm xác nhận trong app ngân hàng.
 */
import { stripVietnamese } from '../config/payment.ts';

/** Mã BIN theo danh sách Ngân hàng Nhà nước công bố (cấp đến 31/12/2023). */
export const BANKS: { bin: string; short: string; name: string }[] = [
  { bin: '970436', short: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam' },
  { bin: '970415', short: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { bin: '970418', short: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', short: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
  { bin: '970422', short: 'MB', name: 'Ngân hàng TMCP Quân đội' },
  { bin: '970407', short: 'Techcombank', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
  { bin: '970416', short: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', short: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', short: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', short: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970437', short: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { bin: '970441', short: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970443', short: 'SHB', name: 'Ngân hàng TMCP Sài Gòn – Hà Nội' },
  { bin: '970448', short: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970426', short: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
  { bin: '970440', short: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '970431', short: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { bin: '970449', short: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam (LienVietPostBank)' },
  { bin: '970428', short: 'Nam A Bank', name: 'Ngân hàng TMCP Nam Á' },
  { bin: '970409', short: 'Bac A Bank', name: 'Ngân hàng TMCP Bắc Á' },
  { bin: '970406', short: 'DongA Bank', name: 'Ngân hàng TMCP Đông Á' },
  { bin: '970438', short: 'BaoViet Bank', name: 'Ngân hàng TMCP Bảo Việt' },
  { bin: '970452', short: 'KienlongBank', name: 'Ngân hàng TMCP Kiên Long' },
  { bin: '970425', short: 'ABBank', name: 'Ngân hàng TMCP An Bình' },
  { bin: '970412', short: 'PVcomBank', name: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  { bin: '970419', short: 'NCB', name: 'Ngân hàng TMCP Quốc Dân' },
  { bin: '970433', short: 'VietBank', name: 'Ngân hàng TMCP Việt Nam Thương Tín' },
  { bin: '970454', short: 'BVBank', name: 'Ngân hàng TMCP Bản Việt (Viet Capital Bank)' },
  { bin: '970427', short: 'VietABank', name: 'Ngân hàng TMCP Việt Á' },
  { bin: '970429', short: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  { bin: '970400', short: 'Saigonbank', name: 'Ngân hàng TMCP Sài Gòn Công Thương' },
  { bin: '970430', short: 'PGBank', name: 'Ngân hàng TMCP Thịnh vượng và Phát triển (PG Bank)' },
  { bin: '970446', short: 'Co-opBank', name: 'Ngân hàng Hợp tác xã Việt Nam' },
];

export const bankByBin = (bin: string) => BANKS.find((b) => b.bin === bin);

export const isValidAccountNumber = (s: string) => /^\d{6,19}$/.test(s);

/** CRC-16/CCITT-FALSE (đa thức 0x1021, khởi tạo 0xFFFF), 4 ký tự hex in hoa. */
export function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function verifyCrc(payload: string): boolean {
  const body = payload.slice(0, -4);
  return body.endsWith('6304') && crc16(body) === payload.slice(-4).toUpperCase();
}

function tlv(id: string, value: string): string {
  if (value.length > 99) throw new Error(`Trường ${id} quá dài`);
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Nội dung chuyển khoản: chỉ ký tự ASCII in được, tối đa 25 ký tự (giới hạn trường 62.08). */
function cleanMemo(memo: string): string {
  return stripVietnamese(memo).replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim().slice(0, 25);
}

export function buildVietQr(opts: { bin: string; accountNumber: string; amount?: number; memo?: string }): string {
  if (opts.amount !== undefined && !(Number.isInteger(opts.amount) && opts.amount > 0)) {
    throw new Error('Số tiền phải là số nguyên dương (đồng).');
  }
  const beneficiary = tlv('00', opts.bin) + tlv('01', opts.accountNumber);
  const merchant = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const memo = opts.memo ? cleanMemo(opts.memo) : '';
  let payload =
    tlv('00', '01') +
    tlv('01', opts.amount !== undefined ? '12' : '11') +
    tlv('38', merchant) +
    tlv('53', '704') +
    (opts.amount !== undefined ? tlv('54', String(opts.amount)) : '') +
    tlv('58', 'VN') +
    (memo ? tlv('62', tlv('08', memo)) : '') +
    '6304';
  payload += crc16(payload);
  return payload;
}
