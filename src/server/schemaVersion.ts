/**
 * R3 — Phiên bản cấu trúc D1 mà mã này cần. Test so với migration mới nhất trong migrations_d1/,
 * nên thêm migration mới mà quên cập nhật ở đây thì test báo.
 * /api/health so với bảng d1_migrations: thiếu migration thì báo "degraded" để phát hiện sớm khi deploy lệch.
 */
export const EXPECTED_MIGRATION = '0014_itinerary_seed.sql';

export async function schemaStatus(d1: { prepare(sql: string): any }) {
  try {
    const row = await d1.prepare("SELECT name FROM d1_migrations ORDER BY name DESC LIMIT 1").first();
    const applied = (row?.name as string | undefined) ?? null;
    return { expected: EXPECTED_MIGRATION, applied, ok: applied === null || applied >= EXPECTED_MIGRATION };
  } catch {
    // Cơ sở dữ liệu không do wrangler quản lý migration (Express/dev/test trong bộ nhớ): không đánh giá.
    return { expected: EXPECTED_MIGRATION, applied: null, ok: true };
  }
}
