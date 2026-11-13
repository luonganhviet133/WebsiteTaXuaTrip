/**
 * N06.1 — Kho file riêng tư (biên lai). Worker dùng R2 PRIVATE_BUCKET; Node dùng thư mục .data/private (dev)
 * hoặc bộ nhớ (test). Không có URL công khai: chỉ đọc qua API có kiểm quyền.
 */
export interface PrivateStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

export class MemoryStorage implements PrivateStorage {
  objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  async put(key: string, bytes: Uint8Array, contentType: string) {
    this.objects.set(key, { bytes: new Uint8Array(bytes), contentType });
  }
  async get(key: string) {
    return this.objects.get(key) ?? null;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
}

/** Bọc binding R2 của Worker. */
export class R2Storage implements PrivateStorage {
  constructor(private bucket: any) {}
  async put(key: string, bytes: Uint8Array, contentType: string) {
    await this.bucket.put(key, bytes, { httpMetadata: { contentType } });
  }
  async get(key: string) {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return { bytes: new Uint8Array(await obj.arrayBuffer()), contentType: obj.httpMetadata?.contentType || 'application/octet-stream' };
  }
  async delete(key: string) {
    await this.bucket.delete(key);
  }
}
