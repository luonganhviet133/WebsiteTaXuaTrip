import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSWORD_MIN, LOCKOUT, CODE_POLICY, TERMS_VERSION, checkPassword, normalizeEmail, normalizeVnPhone, lockoutAfterFailure, isLockedOut,
  maskEmail, deviceLabel,
} from './rules.ts';

test('Mật khẩu: tối thiểu 8 ký tự, không trùng email, không thuộc danh sách quá phổ biến', () => {
  assert.equal(PASSWORD_MIN, 8);
  assert.equal(checkPassword('MayTaXua26', 'khach@gmail.com'), null);
  assert.match(checkPassword('Abc12345', 'khach@gmail.com')!, /quá dễ đoán/);
  assert.match(checkPassword('Abc1234', 'khach@gmail.com')!, /8 ký tự/);
  assert.match(checkPassword('12345678', 'a@b.vn')!, /quá dễ đoán/);
  assert.match(checkPassword('password', 'a@b.vn')!, /quá dễ đoán/);
  assert.match(checkPassword('khachhang1', 'khachhang1@gmail.com')!, /email/);
  assert.match(checkPassword('x'.repeat(129), 'a@b.vn')!, /128/);
});

test('Chuẩn hóa email và số điện thoại Việt Nam', () => {
  assert.equal(normalizeEmail('  Khach.Hang@Gmail.COM '), 'khach.hang@gmail.com');
  assert.equal(normalizeEmail('khong-phai-email'), null);
  assert.equal(normalizeEmail('a@b'), null);
  assert.equal(normalizeVnPhone('0912 345 678'), '0912345678');
  assert.equal(normalizeVnPhone('+84912345678'), '0912345678');
  assert.equal(normalizeVnPhone('84912345678'), '0912345678');
  assert.equal(normalizeVnPhone('091234'), null);
  assert.equal(normalizeVnPhone('0112345678'), null, 'đầu số không hợp lệ');
});

test('Khóa tạm: sai 5 lần liên tiếp thì khóa 15 phút; đăng nhập đúng sau khi hết hạn thì mở', () => {
  assert.deepEqual(LOCKOUT, { maxFailures: 5, minutes: 15 });
  const now = Date.parse('2026-11-13T10:00:00Z');
  let s = { failures: 0, lockedUntil: null as string | null };
  for (let i = 1; i <= 4; i++) {
    s = lockoutAfterFailure(s, now);
    assert.equal(s.failures, i);
    assert.equal(s.lockedUntil, null);
  }
  s = lockoutAfterFailure(s, now);
  assert.equal(s.failures, 0, 'đếm lại từ đầu sau khi khóa');
  assert.equal(s.lockedUntil, '2026-11-13T10:15:00.000Z');
  assert.equal(isLockedOut(s.lockedUntil, now + 14 * 60_000), true);
  assert.equal(isLockedOut(s.lockedUntil, now + 15 * 60_000), false);
  assert.equal(isLockedOut(null, now), false);
});

test('Mã email: 6 chữ số, hạn 15 phút, tối đa 5 lần nhập, gửi lại sau 60 giây, tối đa 5 mã mỗi giờ', () => {
  assert.deepEqual(CODE_POLICY, { digits: 6, ttlMinutes: 15, maxAttempts: 5, resendSeconds: 60, maxPerHour: 5 });
});

test('Điều khoản có phiên bản để lưu khi người dùng đồng ý', () => {
  assert.match(TERMS_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test('Hiển thị: che bớt email, nhãn thiết bị từ User-Agent', () => {
  assert.equal(maskEmail('khachhang@gmail.com'), 'kh•••••••@gmail.com');
  assert.equal(maskEmail('ab@x.vn'), 'a•@x.vn');
  assert.equal(deviceLabel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari'), 'iPhone · Safari');
  assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36'), 'Windows · Chrome');
  assert.equal(deviceLabel('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36'), 'Android · Chrome');
  assert.equal(deviceLabel(''), 'Thiết bị không rõ');
});
