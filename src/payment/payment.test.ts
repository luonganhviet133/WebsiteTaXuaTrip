import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEPOSIT_PERCENT, depositFor, balanceFor, checkInAt, balanceDueAt, reminderTimes, transferMemo, normalizeAccountName,
} from '../config/payment.ts';
import { BANKS, bankByBin, buildVietQr, crc16, isValidAccountNumber, verifyCrc } from './vietqr.ts';

test('Một tỉ lệ cọc dùng chung (D03: 30%), làm tròn lên tới đồng; 70% là phần còn lại', () => {
  assert.equal(DEPOSIT_PERCENT, 30);
  assert.equal(depositFor(1_000_000), 300_000);
  assert.equal(depositFor(1_000_005), 300_002);
  assert.equal(balanceFor(1_000_005), 700_003);
  // Đổi cấu hình (vd 50%) thì cọc và phần còn lại đổi theo cùng một công thức
  assert.equal(depositFor(1_000_005, 50), 500_003);
  assert.equal(balanceFor(1_000_005, 50), 500_002);
});

test('Không còn tỉ lệ cọc viết cứng trong giao diện (0.3, 50%)', () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../components');
  const offenders: string[] = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.tsx'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    src.split('\n').forEach((line, i) => {
      if (/\*\s*0\.3\b|Cọc[^\n]{0,20}50%|cọc[^\n]{0,20}50%|\(50%\)/.test(line)) offenders.push(`${f}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, []);
});

test('Hạn trả 70%: 24 giờ trước 14:00 ngày nhận phòng (giờ VN); nhắc ở mốc 48 giờ và 30 giờ', () => {
  assert.equal(checkInAt('2026-11-20').toISOString(), '2026-11-20T07:00:00.000Z');
  assert.equal(balanceDueAt('2026-11-20').toISOString(), '2026-11-19T07:00:00.000Z');
  assert.deepEqual(reminderTimes('2026-11-20').map((r) => [r.hours, r.at.toISOString()]), [
    [48, '2026-11-18T07:00:00.000Z'],
    [30, '2026-11-19T01:00:00.000Z'],
  ]);
});

test('Nội dung chuyển khoản và tên chủ tài khoản không dấu, in hoa', () => {
  assert.equal(transferMemo('TXAB12CD34', 'deposit'), 'TXAB12CD34 COC');
  assert.equal(transferMemo('TXAB12CD34', 'balance'), 'TXAB12CD34 CON LAI');
  assert.equal(normalizeAccountName('  Nguyễn Văn Đức  '), 'NGUYEN VAN DUC');
});

test('CRC16-CCITT đúng biến thể VietQR', () => {
  assert.equal(crc16('123456789'), '29B1');
  // Mã tĩnh công khai (Techcombank)
  assert.equal(verifyCrc('00020101021138540010A00000072701240006970407011096020919960208QRIBFTTA53037045802VN630434A0'), true);
  assert.equal(verifyCrc('00020101021138540010A00000072701240006970407011096020919960208QRIBFTTA53037045802VN630434A1'), false);
});

test('VietQR động khớp từng ký tự với chuỗi mẫu công bố', () => {
  const sample = '00020101021238530010A000000727012300069704230109mynamebvh0208QRIBFTTA53037045405500005802VN62080804test6304AB76';
  assert.equal(buildVietQr({ bin: '970423', accountNumber: 'mynamebvh', amount: 50000, memo: 'test' }), sample);
});

test('VietQR: số tiền là số nguyên dương; nội dung bỏ dấu, tối đa 25 ký tự', () => {
  const qr = buildVietQr({ bin: '970436', accountNumber: '0011004455667', amount: 300000, memo: 'TXAB12CD34 Cọc' });
  assert.ok(verifyCrc(qr));
  assert.match(qr, /5406300000/);
  assert.match(qr, /0814TXAB12CD34 Coc/);
  assert.throws(() => buildVietQr({ bin: '970436', accountNumber: '0011004455667', amount: 0 }));
  assert.throws(() => buildVietQr({ bin: '970436', accountNumber: '0011004455667', amount: 1.5 }));
  assert.equal(buildVietQr({ bin: '970436', accountNumber: '1', amount: 1000, memo: 'x'.repeat(40) }).includes('x'.repeat(26)), false);
});

test('Danh sách ngân hàng theo NHNN; số tài khoản 6–19 chữ số', () => {
  assert.equal(bankByBin('970436')?.short, 'Vietcombank');
  assert.equal(bankByBin('970422')?.short, 'MB');
  assert.equal(bankByBin('970415')?.short, 'VietinBank');
  assert.equal(bankByBin('970418')?.short, 'BIDV');
  assert.equal(bankByBin('970405')?.short, 'Agribank');
  assert.equal(bankByBin('999999'), undefined);
  assert.equal(new Set(BANKS.map((b) => b.bin)).size, BANKS.length, 'không trùng BIN');
  assert.equal(isValidAccountNumber('0011004455667'), true);
  assert.equal(isValidAccountNumber('12345'), false);
  assert.equal(isValidAccountNumber('12345abc'), false);
});
