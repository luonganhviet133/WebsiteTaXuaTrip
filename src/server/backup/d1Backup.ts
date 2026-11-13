/**
 * R3 — Sao lưu D1 ngay trong Cloudflare: không cần API token hay secret nào.
 * Worker đọc từng bảng qua binding D1 và ghi vào bucket R2 RIÊNG TƯ (PRIVATE_BUCKET) dưới `backups/d1/`.
 *
 * Gói Workers Free giới hạn 10 ms CPU mỗi lần chạy, nên bản sao lưu chia thành nhiều bước nhỏ:
 * - start(): ghi cấu trúc (CREATE …) và trạng thái chạy dở;
 * - step(): mỗi lần đọc tối đa ROWS_PER_STEP dòng, ghi thành tệp JSONL; cron 5 phút gọi tiếp tới khi xong;
 * - xong: ghi manifest.json, LATEST.json; giữ KEEP_RUNS bản gần nhất.
 * Bản sao lưu đọc trong nhiều phút nên không phải ảnh chụp đúng một thời điểm; cần khôi phục chính xác
 * một thời điểm thì dùng Time Travel của D1 (gói Free giữ 7 ngày).
 * Khôi phục: scripts/d1-backup-to-sql.mjs đổi thư mục sao lưu thành tệp .sql để `wrangler d1 execute`.
 */
import type { D1Database } from '../d1.ts';

export const BACKUP_ROOT = 'backups/d1/';
const STATE_KEY = `${BACKUP_ROOT}_state.json`;
const LATEST_KEY = `${BACKUP_ROOT}LATEST.json`;
export const ROWS_PER_FILE = 500;
export const ROWS_PER_STEP = 1500;
export const KEEP_RUNS = 12;
/** Bản chạy dở quá lâu (ví dụ lỗi lặp lại) thì bỏ, cho phép bắt đầu bản mới. */
const STALE_MS = 6 * 3600_000;

export interface BackupBucket {
  put(key: string, value: string, options?: any): Promise<unknown>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  delete(keys: string | string[]): Promise<unknown>;
  list(options: { prefix: string; delimiter?: string; cursor?: string; limit?: number }): Promise<{
    objects: { key: string }[];
    delimitedPrefixes?: string[];
    truncated?: boolean;
    cursor?: string;
  }>;
}

interface RunState {
  runId: string;
  reason: string;
  startedAt: string;
  tables: string[];
  tableIdx: number;
  offset: number;
  part: number;
  rows: Record<string, number>;
  files: string[];
}

export interface BackupSummary {
  runId: string;
  reason: string;
  startedAt: string;
  finishedAt: string;
  tables: Record<string, number>;
  totalRows: number;
  files: number;
}

const json = (v: unknown) => JSON.stringify(v);
const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** Giá trị nhị phân (BLOB) mã hóa base64 để giữ đúng byte khi khôi phục. */
function encodeValue(v: unknown): unknown {
  if (v instanceof ArrayBuffer) v = new Uint8Array(v);
  if (v instanceof Uint8Array) {
    let s = '';
    for (const b of v) s += String.fromCharCode(b);
    return { $b64: btoa(s) };
  }
  if (typeof v === 'bigint') return Number(v);
  return v;
}

export class D1Backup {
  constructor(private d1: D1Database, private bucket: BackupBucket) {}

  private async readJson<T>(key: string): Promise<T | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    try {
      return JSON.parse(await obj.text()) as T;
    } catch {
      return null;
    }
  }

  async status() {
    const [latest, running] = await Promise.all([this.readJson<BackupSummary>(LATEST_KEY), this.readJson<RunState>(STATE_KEY)]);
    return {
      latest,
      running: running
        ? { runId: running.runId, startedAt: running.startedAt, tablesDone: running.tableIdx, tablesTotal: running.tables.length }
        : null,
    };
  }

  /** Bắt đầu bản mới; đang có bản chạy dở (chưa quá hạn) thì giữ bản đó. */
  async start(reason: string, now = new Date()): Promise<{ started: boolean; runId: string }> {
    const cur = await this.readJson<RunState>(STATE_KEY);
    if (cur && now.getTime() - Date.parse(cur.startedAt) < STALE_MS) return { started: false, runId: cur.runId };

    const master = await this.d1
      .prepare(
        "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END, rowid"
      )
      .all<any>();
    const items = master.results || [];
    const tables = items.filter((r: any) => r.type === 'table').map((r: any) => String(r.name));
    const runId = now.toISOString().replace(/[:.]/g, '-');
    const schema = items.map((r: any) => `${String(r.sql).trim()};`).join('\n');
    await this.bucket.put(`${BACKUP_ROOT}${runId}/schema.sql`, schema + '\n', { httpMetadata: { contentType: 'application/sql' } });
    const state: RunState = { runId, reason, startedAt: now.toISOString(), tables, tableIdx: 0, offset: 0, part: 0, rows: {}, files: [] };
    await this.bucket.put(STATE_KEY, json(state));
    return { started: true, runId };
  }

  /** Một bước: đọc tối đa ROWS_PER_STEP dòng. Trả 'idle' khi không có bản nào chạy, 'done' khi vừa xong. */
  async step(now = new Date()): Promise<'idle' | 'progress' | 'done'> {
    const state = await this.readJson<RunState>(STATE_KEY);
    if (!state) return 'idle';
    let budget = ROWS_PER_STEP;
    while (state.tableIdx < state.tables.length && budget > 0) {
      const table = state.tables[state.tableIdx];
      const take = Math.min(ROWS_PER_FILE, budget);
      const r = await this.d1.prepare(`SELECT * FROM ${quoteIdent(table)} ORDER BY rowid LIMIT ? OFFSET ?`).bind(take, state.offset).all<any>();
      const rows = r.results || [];
      if (rows.length) {
        const body = rows.map((row: any) => json(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, encodeValue(v)])))).join('\n') + '\n';
        const key = `${BACKUP_ROOT}${state.runId}/data/${table}.${String(state.part).padStart(4, '0')}.jsonl`;
        await this.bucket.put(key, body, { httpMetadata: { contentType: 'application/x-ndjson' } });
        state.files.push(key.slice(BACKUP_ROOT.length + state.runId.length + 1));
        state.part++;
        state.offset += rows.length;
        state.rows[table] = (state.rows[table] || 0) + rows.length;
        budget -= rows.length;
      }
      if (rows.length < take) {
        state.rows[table] = state.rows[table] || 0;
        state.tableIdx++;
        state.offset = 0;
        state.part = 0;
      }
    }
    if (state.tableIdx < state.tables.length) {
      await this.bucket.put(STATE_KEY, json(state));
      return 'progress';
    }
    const summary: BackupSummary = {
      runId: state.runId,
      reason: state.reason,
      startedAt: state.startedAt,
      finishedAt: now.toISOString(),
      tables: state.rows,
      totalRows: Object.values(state.rows).reduce((a, b) => a + b, 0),
      files: state.files.length,
    };
    await this.bucket.put(`${BACKUP_ROOT}${state.runId}/manifest.json`, json({ ...summary, tableOrder: state.tables, fileList: state.files }));
    await this.bucket.put(LATEST_KEY, json(summary));
    await this.bucket.delete(STATE_KEY);
    await this.prune();
    return 'done';
  }

  /** Giữ KEEP_RUNS bản mới nhất (tên bản theo thời gian nên sắp xếp chữ = sắp xếp thời gian). */
  async prune(): Promise<number> {
    const listed = await this.bucket.list({ prefix: BACKUP_ROOT, delimiter: '/' });
    const runs = (listed.delimitedPrefixes || []).filter((p) => /^\d{4}-/.test(p.slice(BACKUP_ROOT.length))).sort();
    const old = runs.slice(0, Math.max(0, runs.length - KEEP_RUNS));
    for (const prefix of old) {
      let cursor: string | undefined;
      do {
        const page = await this.bucket.list({ prefix, cursor, limit: 1000 });
        const keys = page.objects.map((o) => o.key);
        if (keys.length) await this.bucket.delete(keys);
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
    }
    return old.length;
  }
}

/** Đổi tệp sao lưu thành câu lệnh SQL (dùng chung cho script khôi phục và test). */
export function rowsToInsertSql(table: string, jsonl: string): string {
  const out: string[] = [];
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Record<string, unknown>;
    const cols = Object.keys(row);
    const vals = cols.map((c) => sqlLiteral(row[c]));
    out.push(`INSERT INTO ${quoteIdent(table)} (${cols.map(quoteIdent).join(', ')}) VALUES (${vals.join(', ')});`);
  }
  return out.join('\n');
}

function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'object' && v && '$b64' in (v as any)) {
    const bin = atob(String((v as any).$b64));
    let hex = '';
    for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
    return `X'${hex}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}
