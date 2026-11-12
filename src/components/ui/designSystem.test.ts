import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button } from './Button.tsx';
import { Badge } from './Badge.tsx';
import { Card } from './Card.tsx';
import { Input } from './Input.tsx';
import { Select } from './Select.tsx';
import { Modal } from './Modal.tsx';
import { Sheet } from './Sheet.tsx';
import { Skeleton } from './Skeleton.tsx';
import { EmptyState } from './EmptyState.tsx';
import { ErrorState } from './ErrorState.tsx';
import { toastReducer, MAX_TOASTS } from './toastStore.ts';
import { buildLandmarkTooltipHtml, buildListingTooltipHtml } from '../../utils/mapTooltipHtml.ts';

const SRC = join(process.cwd(), 'src');

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

const render = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);

test('U1: không còn lớp chữ dưới 12px trong mã giao diện', () => {
  const offenders: string[] = [];
  for (const file of listSourceFiles(SRC)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) {
        if (Number(m[1]) < 12) offenders.push(`${relative(SRC, file)}:${i + 1} ${m[0]}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `Còn chữ dưới 12px:\n${offenders.slice(0, 20).join('\n')}`);
});

test('U1: tooltip bản đồ không có chữ dưới 12px', () => {
  const html =
    buildLandmarkTooltipHtml({ name: 'A', altitude: '2.000m', cloudProbability: 90, bestTime: '5h' }) +
    buildListingTooltipHtml(
      { title: 'B', area: 'Tà Xùa', rating: 4.8, reviewCount: 10, hasCloudView: true, minPrice: 500000 },
      '🏡',
      { km: 1.2, area: 'Sống lưng khủng long' }
    );
  const sizes = [...html.matchAll(/font-size:\s*(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length > 0);
  assert.ok(sizes.every((s) => s >= 12), `Có cỡ chữ < 12px: ${sizes.join(',')}`);
});

test('U1: token màu, chữ, bo góc được khai báo trong @theme', () => {
  const css = readFileSync(join(SRC, 'index.css'), 'utf8');
  assert.match(css, /@theme/);
  for (const token of [
    '--color-brand-700: #0a3f7c',
    '--color-brand-800: #073161',
    '--color-brand-900: #04244d',
    '--color-accent-600',
    '--color-success-600',
    '--color-warning-600',
    '--color-danger-600',
    '--color-info-600',
    '--font-sans',
    '--radius-control',
    '--radius-card',
    '--radius-modal',
  ]) {
    assert.ok(css.includes(token), `Thiếu token ${token}`);
  }
});

test('U1: màu thương hiệu trong className dùng token, không dùng mã hex rời', () => {
  const offenders: string[] = [];
  for (const file of listSourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/[a-z-]+-\[#(?:073161|0a3f7c|04244d)\]/gi)) offenders.push(`${relative(SRC, file)} ${m[0]}`);
  }
  assert.deepEqual(offenders, []);
});

test('Button: biến thể dùng token và trạng thái đang xử lý khóa nút', () => {
  const primary = render(createElement(Button, null, 'Đặt phòng'));
  assert.match(primary, /<button[^>]*type="button"/);
  assert.match(primary, /bg-brand-800/);
  assert.match(primary, /min-h-11/, 'nút cao tối thiểu 44px để bấm bằng ngón tay');

  const loading = render(createElement(Button, { variant: 'danger', loading: true }, 'Xóa'));
  assert.match(loading, /disabled=""/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /bg-danger-600/);
});

test('Input/Select: nhãn gắn với ô, lỗi được đọc bởi trình đọc màn hình', () => {
  const input = render(createElement(Input, { id: 'phone', label: 'Số điện thoại', error: 'Sai định dạng' }));
  assert.match(input, /<label[^>]*for="phone"/);
  assert.match(input, /aria-invalid="true"/);
  assert.match(input, /aria-describedby="phone-error"/);
  assert.match(input, /id="phone-error"[^>]*role="alert"|role="alert"[^>]*id="phone-error"/);
  assert.match(input, /text-base/, 'chữ trong ô ≥16px để iOS không tự phóng to');

  const select = render(
    createElement(Select, { id: 'guests', label: 'Số khách', options: [{ value: '2', label: '2 khách' }] })
  );
  assert.match(select, /<label[^>]*for="guests"/);
  assert.match(select, /<option value="2">2 khách<\/option>/);
});

test('Modal/Sheet: đóng thì không render, mở thì là hộp thoại có tiêu đề', () => {
  assert.equal(render(createElement(Modal, { open: false, onClose: () => {}, title: 'X' }, 'nội dung')), '');
  const modal = render(createElement(Modal, { open: true, onClose: () => {}, title: 'Xác nhận' }, 'nội dung'));
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  const labelId = modal.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(labelId && modal.includes(`id="${labelId}"`));
  assert.match(modal, /aria-label="Đóng"/);

  assert.equal(render(createElement(Sheet, { open: false, onClose: () => {}, title: 'X' }, 'a')), '');
  const sheet = render(createElement(Sheet, { open: true, onClose: () => {}, title: 'Bộ lọc' }, 'a'));
  assert.match(sheet, /role="dialog"/);
  assert.match(sheet, /rounded-t-modal/);
});

test('Card, Badge, Skeleton, EmptyState, ErrorState', () => {
  assert.match(render(createElement(Card, null, 'x')), /rounded-card/);
  assert.match(render(createElement(Badge, { tone: 'success' }, 'Đã xác minh')), /bg-success-50/);
  assert.match(render(createElement(Badge, { tone: 'warning' }, 'Chờ duyệt')), /text-warning-700/);

  const sk = render(createElement(Skeleton, { className: 'h-4' }));
  assert.match(sk, /aria-hidden="true"/);
  assert.match(sk, /animate-pulse/);

  const empty = render(createElement(EmptyState, { title: 'Chưa có chuyến đi', description: 'Đặt phòng để bắt đầu' }));
  assert.match(empty, /Chưa có chuyến đi/);
  assert.match(empty, /role="status"/);

  const err = render(createElement(ErrorState, { message: 'Không tải được', onRetry: () => {} }));
  assert.match(err, /role="alert"/);
  assert.match(err, /Thử lại/);
  assert.doesNotMatch(render(createElement(ErrorState, { message: 'x' })), /Thử lại/);
});

test('Toast: thêm, xóa, giới hạn số lượng', () => {
  let s = toastReducer([], { type: 'add', toast: { id: 'a', tone: 'success', message: 'Đã lưu' } });
  assert.equal(s.length, 1);
  for (let i = 0; i < MAX_TOASTS + 2; i++) {
    s = toastReducer(s, { type: 'add', toast: { id: `t${i}`, tone: 'info', message: String(i) } });
  }
  assert.equal(s.length, MAX_TOASTS);
  assert.equal(s[s.length - 1].id, `t${MAX_TOASTS + 1}`, 'giữ thông báo mới nhất');
  s = toastReducer(s, { type: 'remove', id: `t${MAX_TOASTS + 1}` });
  assert.equal(s.length, MAX_TOASTS - 1);
});
