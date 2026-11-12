/**
 * G0.6 — Trên Worker, schema D1 do `wrangler d1 migrations apply` tạo khi deploy.
 * DatabaseEngine dùng D1 binding không được tự gửi CREATE TABLE ở mỗi request.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from './db.ts';

test('DatabaseEngine dùng D1 binding không gửi lệnh tạo bảng khi khởi tạo', () => {
  const execCalls: string[] = [];
  const fakeD1 = {
    exec: (sql: string) => {
      execCalls.push(sql);
      return Promise.resolve({ count: 0, duration: 0 });
    },
    prepare: () => {
      throw new Error('không dùng trong test này');
    },
    batch: () => Promise.resolve([])
  } as any;

  new DatabaseEngine({ d1: fakeD1 });
  assert.equal(execCalls.length, 0, `Đã gửi ${execCalls.length} lệnh exec tới D1 khi khởi tạo`);
});

test('DatabaseEngine trên Node (SQLite trong bộ nhớ) vẫn tự tạo bảng cho dev/test', async () => {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  const row = await db.d1
    .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name IN ('profiles','providers','provider_listings','user_sessions','bookings')")
    .first<{ n: number }>();
  assert.equal(row?.n, 5);
});
