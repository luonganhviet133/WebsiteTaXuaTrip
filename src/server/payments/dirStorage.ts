/** N06.1 — Kho biên lai cho Express (dev): thư mục trên đĩa. Tách riêng để Worker không nạp node:fs. */
import fs from 'node:fs';
import path from 'node:path';
import type { PrivateStorage } from './storage.ts';

/** Dev bằng Express: lưu trong thư mục, tên file là khóa đã kiểm (chỉ chữ, số, _, -, /). */
export class DirStorage implements PrivateStorage {
  constructor(private root: string) {}
  private file(key: string) {
    if (!/^[A-Za-z0-9_\-/]+$/.test(key) || key.includes('..')) throw new Error('Khóa không hợp lệ');
    return path.join(this.root, key);
  }
  async put(key: string, bytes: Uint8Array, contentType: string) {
    const f = this.file(key);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, bytes);
    fs.writeFileSync(`${f}.type`, contentType);
  }
  async get(key: string) {
    const f = this.file(key);
    if (!fs.existsSync(f)) return null;
    return { bytes: new Uint8Array(fs.readFileSync(f)), contentType: fs.readFileSync(`${f}.type`, 'utf8') };
  }
  async delete(key: string) {
    const f = this.file(key);
    fs.rmSync(f, { force: true });
    fs.rmSync(`${f}.type`, { force: true });
  }
}
