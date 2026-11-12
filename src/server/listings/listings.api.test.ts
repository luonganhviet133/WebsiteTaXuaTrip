import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine, hashPassword } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';

const content = (over: Record<string, unknown> = {}) => ({
  title: 'Nhà Mây Thử',
  category: 'homestay',
  area: 'Đỉnh Gió',
  address: 'Đỉnh Gió, Tà Xùa',
  phone: '0981234567',
  zalo: '0981234567',
  description: 'Mô tả',
  images: ['https://img.example/1.webp'],
  tags: ['View mây'],
  minPrice: 500000,
  coordinates: null,
  ...over,
});

async function setup() {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = { db, clientIp: '127.0.0.1', revidBaseUrl: '', revidApiKey: '', runtime: 'node' };
  const tokenOf = async (email: string) => {
    const p = await db.findProfileByEmail(email);
    return (await db.createSession(p!.id, p!.role)).token;
  };
  const tokens = {
    admin: await tokenOf('admin@taxuatrip.vn'),
    partnerA: await tokenOf('partner.a@taxuatrip.vn'),
    partnerB: await tokenOf('partner.b@taxuatrip.vn'),
    traveler: await tokenOf('traveler.a@gmail.com'),
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(
      new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }),
      ctx
    );
    return { status: res.status, body: (await res.json()) as any };
  };
  return { db, call, tokens };
}

test('N03.2 danh bạ: quyền, vòng đời duyệt, phiên bản, claim, huy hiệu, audit, CMS', async (t) => {
  const { db, call, tokens } = await setup();
  // Fixture: partner A sở hữu homestay-may (demo, đã duyệt), partner B sở hữu homestay-lutre.

  await t.test('Công khai: chỉ trả cơ sở đã duyệt, kèm nguồn và cấp xác minh, không tự có điểm sao', async () => {
    const list = await call('GET', '/api/listings');
    assert.equal(list.status, 200);
    const ids = list.body.data.map((l: any) => l.id);
    assert.ok(ids.includes('homestay-may'));
    const may = list.body.data.find((l: any) => l.id === 'homestay-may');
    assert.equal(may.rating, 0);
    assert.equal(may.reviewCount, 0);
    assert.equal(may.verificationTier, 1);
    assert.equal(may.verification.tier, 1);
    assert.equal(may.dataOrigin, 'demo');
    assert.equal(may.status, 'approved');
    assert.ok(list.body.data.length >= 170, 'có dữ liệu thu thập đã nhập');
  });

  await t.test('Sửa của người không có quyền bị chặn', async () => {
    assert.equal((await call('PUT', '/api/partner/listings/homestay-lutre', tokens.partnerA, { content: content() })).status, 403);
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may', tokens.traveler, { content: content() })).status, 403);
    assert.equal((await call('PUT', '/api/partner/listings/homestay-may', undefined, { content: content() })).status, 401);
  });

  await t.test('Nội dung sai trả 400 kèm lỗi từng trường', async () => {
    const res = await call('PUT', '/api/partner/listings/homestay-may', tokens.partnerA, { content: content({ title: '', minPrice: -5 }) });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some((e: any) => e.field === 'title'));
  });

  await t.test('Bản nháp không đè bản đã duyệt; gửi duyệt rồi admin duyệt mới công khai', async () => {
    const before = (await call('GET', '/api/listings/homestay-may')).body.data.title;

    const draft = await call('PUT', '/api/partner/listings/homestay-may', tokens.partnerA, {
      content: content({ title: 'Mẩy Bản Mới', verificationTier: 3, rating: 5 }),
    });
    assert.equal(draft.status, 200);
    assert.equal(draft.body.data.openVersion.status, 'draft');
    assert.equal((await call('GET', '/api/listings/homestay-may')).body.data.title, before);

    const sub = await call('POST', '/api/partner/listings/homestay-may/submit', tokens.partnerA);
    assert.equal(sub.status, 200);
    assert.equal(sub.body.data.openVersion.status, 'pending');
    assert.equal((await call('GET', '/api/listings/homestay-may')).body.data.title, before);

    const queue = await call('GET', '/api/admin/listings?pending=1', tokens.admin);
    assert.ok(queue.body.data.some((l: any) => l.id === 'homestay-may' && l.openVersion?.status === 'pending'));

    const ok = await call('POST', '/api/admin/listings/homestay-may/review', tokens.admin, { decision: 'approve' });
    assert.equal(ok.status, 200);
    const pub = (await call('GET', '/api/listings/homestay-may')).body.data;
    assert.equal(pub.title, 'Mẩy Bản Mới');
    assert.equal(pub.verificationTier, 1, 'tự khai cấp 3 trong nội dung không có tác dụng');
    assert.equal(pub.rating, 0);
  });

  await t.test('Admin từ chối bản sửa: bản công khai giữ nguyên, chủ cơ sở thấy lý do', async () => {
    await call('PUT', '/api/partner/listings/homestay-may', tokens.partnerA, { content: content({ title: 'Tên Lừa Đảo' }) });
    await call('POST', '/api/partner/listings/homestay-may/submit', tokens.partnerA);
    const rej = await call('POST', '/api/admin/listings/homestay-may/review', tokens.admin, { decision: 'reject', note: 'Ảnh không đúng thực tế' });
    assert.equal(rej.status, 200);
    assert.equal((await call('GET', '/api/listings/homestay-may')).body.data.title, 'Mẩy Bản Mới');
    const mine = await call('GET', '/api/partner/listings', tokens.partnerA);
    const item = mine.body.data.find((l: any) => l.id === 'homestay-may');
    assert.equal(item.latestReview.status, 'rejected');
    assert.equal(item.latestReview.note, 'Ảnh không đúng thực tế');
  });

  await t.test('Chủ cơ sở tạo cơ sở mới: nháp không công khai cho tới khi admin duyệt', async () => {
    const created = await call('POST', '/api/partner/listings', tokens.partnerA, { content: content({ title: 'Homestay Mới Toanh' }) });
    assert.equal(created.status, 201);
    const id = created.body.data.id;
    assert.match(id, /^homestay-moi-toanh/);
    assert.equal((await call('GET', `/api/listings/${id}`)).status, 404);
    await call('POST', `/api/partner/listings/${id}/submit`, tokens.partnerA);
    assert.equal((await call('GET', `/api/listings/${id}`)).status, 404, 'chờ duyệt vẫn chưa công khai');
    await call('POST', `/api/admin/listings/${id}/review`, tokens.admin, { decision: 'approve' });
    const pub = await call('GET', `/api/listings/${id}`);
    assert.equal(pub.status, 200);
    assert.equal(pub.body.data.dataOrigin, 'partner');
  });

  await t.test('Cơ sở bị từ chối biến mất khỏi danh sách và trang chi tiết công khai', async () => {
    const res = await call('POST', '/api/admin/listings/tx-stay-4/status', tokens.admin, { status: 'rejected', note: 'Không tồn tại' });
    assert.equal(res.status, 200);
    assert.equal((await call('GET', '/api/listings/tx-stay-4')).status, 404);
    const ids = (await call('GET', '/api/listings')).body.data.map((l: any) => l.id);
    assert.ok(!ids.includes('tx-stay-4'));
    assert.equal((await call('POST', '/api/admin/listings/tx-stay-4/status', tokens.partnerA, { status: 'approved' })).status, 403);
  });

  await t.test('Nhận chính chủ có bằng chứng; duyệt chỉ gắn quyền, không nâng huy hiệu', async () => {
    assert.equal((await call('POST', '/api/listings/tx-stay-5/claims', tokens.partnerB, { ownerName: 'B', ownerPhone: '0987654321' })).status, 400, 'thiếu bằng chứng');
    const claim = await call('POST', '/api/listings/tx-stay-5/claims', tokens.partnerB, {
      ownerName: 'Mùa A Lử', ownerPhone: '0987654321', evidenceNote: 'GPKD số 123, ảnh biển hiệu',
    });
    assert.equal(claim.status, 201);
    assert.equal((await call('POST', '/api/listings/tx-stay-5/claims', tokens.traveler, { ownerName: 'x', ownerPhone: '0912345678', evidenceNote: 'y' })).status, 403);

    const ok = await call('POST', `/api/admin/claims/${claim.body.data.id}/review`, tokens.admin, { decision: 'approve' });
    assert.equal(ok.status, 200);
    const mine = await call('GET', '/api/partner/listings', tokens.partnerB);
    assert.ok(mine.body.data.some((l: any) => l.id === 'tx-stay-5'));
    const pub = (await call('GET', '/api/listings/tx-stay-5')).body.data;
    assert.equal(pub.verificationTier, 1);
    assert.equal(pub.claimedByOwner, true);
  });

  await t.test('Huy hiệu cần nguồn; cấp 2–3 hết hạn sau 12 tháng', async () => {
    assert.equal((await call('POST', '/api/admin/listings/tx-stay-6/verification', tokens.admin, { tier: 3 })).status, 400);
    const ok = await call('POST', '/api/admin/listings/tx-stay-6/verification', tokens.admin, { tier: 3, source: 'Thẩm định thực địa 12/11/2026' });
    assert.equal(ok.status, 200);
    let pub = (await call('GET', '/api/listings/tx-stay-6')).body.data;
    assert.equal(pub.verificationTier, 3);
    assert.equal(pub.verification.source, 'Thẩm định thực địa 12/11/2026');
    assert.ok(pub.verification.verifiedAt && pub.verification.expiresAt);

    await db.d1.prepare("UPDATE listings SET verified_at = '2025-01-01T00:00:00.000Z' WHERE id = 'tx-stay-6'").run();
    pub = (await call('GET', '/api/listings/tx-stay-6')).body.data;
    assert.equal(pub.verificationTier, 1, 'quá 12 tháng thì về cấp 1');
    assert.equal(pub.verification.expired, true);
  });

  await t.test('Admin sửa trực tiếp được công khai ngay và ghi log', async () => {
    const res = await call('PUT', '/api/admin/listings/tx-stay-7', tokens.admin, { content: content({ title: 'Admin Sửa', coordinates: { lat: 21.32, lng: 104.47 } }) });
    assert.equal(res.status, 200);
    const pub = (await call('GET', '/api/listings/tx-stay-7')).body.data;
    assert.equal(pub.title, 'Admin Sửa');
    assert.deepEqual(pub.coordinates, { lat: 21.32, lng: 104.47 });
    const audit = await call('GET', '/api/admin/audit?entityId=tx-stay-7', tokens.admin);
    assert.ok(audit.body.data.some((a: any) => a.action === 'listing.admin_publish'));
    assert.equal((await call('GET', '/api/admin/audit?entityId=tx-stay-7', tokens.partnerA)).status, 403);
  });

  await t.test('Ghim ưu tiên do admin đặt', async () => {
    await call('POST', '/api/admin/listings/tx-stay-8/featured', tokens.admin, { isAdminFeatured: true, adminPriorityRank: 90, adminFeaturedLabel: 'Đề xuất' });
    const pub = (await call('GET', '/api/listings/tx-stay-8')).body.data;
    assert.equal(pub.isAdminFeatured, true);
    assert.equal(pub.adminPriorityRank, 90);
  });

  await t.test('Nội dung trang (CMS): ai cũng đọc, chỉ admin lưu; lưu xong thiết bị khác thấy', async () => {
    assert.equal((await call('GET', '/api/site-content')).body.data, null);
    assert.equal((await call('PUT', '/api/admin/site-content', tokens.partnerA, { content: { heroTitle: 'X' } })).status, 403);
    assert.equal((await call('PUT', '/api/admin/site-content', tokens.admin, { content: { heroTitle: 'Săn mây' } })).status, 200);
    assert.deepEqual((await call('GET', '/api/site-content')).body.data, { heroTitle: 'Săn mây' });
  });
});
