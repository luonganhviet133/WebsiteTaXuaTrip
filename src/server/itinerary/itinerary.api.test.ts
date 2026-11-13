import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseEngine } from '../db.ts';
import { handleApiRequest, type ApiContext } from '../api.ts';
import { featureForApi } from '../../config/features.ts';
import { TURNSTILE_TEST_SECRET } from '../antiAbuse.ts';

const START = (() => {
  const d = new Date(Date.now() + 20 * 86400_000);
  return d.toISOString().slice(0, 10);
})();
const BODY = { duration: '3N2D', styles: ['san-may', 'chup-anh'], groupSize: 4, budget: 'vua', startDate: START, transport: 'xe-khach', seed: 3 };

type FakeFetch = (url: string, init: any) => Promise<Response>;

async function setup(over: Partial<ApiContext> = {}) {
  const db = new DatabaseEngine({ inMemoryOnly: true, isTest: true });
  await db.seedTestFixtures();
  const ctx: ApiContext = {
    db, clientIp: `10.5.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, revidBaseUrl: 'https://ai.revidapi.com/v1', revidApiKey: '', runtime: 'node', turnstileSecret: TURNSTILE_TEST_SECRET, ...over,
  };
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await handleApiRequest(new Request(`http://local${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), ctx);
    return { status: res.status, body: (await res.json()) as any };
  };
  const login = async (identifier: string, password: string) =>
    (await call('POST', '/api/auth/login', undefined, { identifier, password, turnstileToken: '1x0000000000000000000000000000000AA' })).body.token as string;
  return { db, ctx, call, admin: await login('admin@taxuatrip.vn', 'admin123'), traveler: await login('traveler.a@gmail.com', 'traveler123') };
}

async function approveAll(call: any, admin: string) {
  const list = (await call('GET', '/api/admin/itinerary-data?status=pending', admin)).body.data;
  const p = await call('POST', '/api/admin/itinerary-data/review', admin, { type: 'place', decision: 'approve', ids: list.places.map((x: any) => x.id) });
  const f = await call('POST', '/api/admin/itinerary-data/review', admin, { type: 'fact', decision: 'approve', ids: list.facts.map((x: any) => x.id) });
  assert.equal(p.status, 200, JSON.stringify(p.body));
  assert.equal(f.status, 200, JSON.stringify(f.body));
  return list;
}

test('API lịch trình thuộc tính năng itineraryPlanner (đã mở)', () => {
  assert.equal(featureForApi('POST', '/api/itinerary/plan'), 'itineraryPlanner');
});

test('Dữ liệu tra cứu chưa duyệt thì không dùng: lịch vẫn dựng từ danh bạ, ghi rõ phần thiếu', async () => {
  const { call } = await setup();
  const meta = await call('GET', '/api/itinerary/meta');
  assert.equal(meta.status, 200);
  assert.equal(meta.body.data.counts.places, 0);
  assert.equal(meta.body.data.counts.busesWithTimes, 0);
  assert.ok(meta.body.data.counts.homestays >= 80);
  assert.equal(meta.body.data.aiAvailable, false, 'không có khóa AI');

  const r = await call('POST', '/api/itinerary/plan', undefined, BODY);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const { plan, refs } = r.body.data;
  assert.equal(plan.days.length, 3);
  assert.ok(plan.stay.listingId && refs.listings[plan.stay.listingId], 'homestay thật từ danh bạ');
  assert.ok(plan.dataGaps.some((g: string) => /điểm tham quan/.test(g)));
  assert.ok(!plan.days.flatMap((d: any) => d.items).some((i: any) => i.kind === 'place'));
  assert.ok(plan.cost.unknown.length > 0);
});

test('Kiểm tra đầu vào trả 400 kèm trường lỗi', async () => {
  const { call } = await setup();
  const r = await call('POST', '/api/itinerary/plan', undefined, { ...BODY, groupSize: 99 });
  assert.equal(r.status, 400);
  assert.equal(r.body.field, 'groupSize');
});

test('Chỉ admin xem/duyệt dữ liệu; từ chối phải có lý do; duyệt ghi nhật ký; sau duyệt lịch có điểm tham quan, giờ xe và giá', async () => {
  const { db, call, admin, traveler } = await setup();
  assert.equal((await call('GET', '/api/admin/itinerary-data', traveler)).status, 403);
  assert.equal((await call('GET', '/api/admin/itinerary-data')).status, 401);

  const pending = (await call('GET', '/api/admin/itinerary-data', admin)).body.data;
  assert.equal(pending.places.length, 10);
  assert.equal(pending.facts.filter((f: any) => f.kind === 'bus_route').length, 4);
  assert.equal(pending.facts.filter((f: any) => f.kind === 'price_from').length, 25);
  assert.ok(pending.places.every((p: any) => p.sources.length >= 1 && p.sources[0].accessed === '2026-11-14'), 'mỗi điểm có nguồn');
  assert.ok(pending.facts.find((f: any) => f.listingId === 'tx-bus-134')?.listingTitle?.includes('Hiền Hựu'));

  const noReason = await call('POST', '/api/admin/itinerary-data/review', admin, { type: 'place', decision: 'reject', ids: ['pl-thac-khong-ten'] });
  assert.equal(noReason.status, 400);
  assert.equal(noReason.body.code, 'REASON_REQUIRED');
  assert.equal((await call('POST', '/api/admin/itinerary-data/review', admin, { type: 'place', decision: 'approve', ids: ['khong-co'] })).status, 404);

  await approveAll(call, admin);
  const audits = await db.d1.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'itinerary_%_approve'").first<any>();
  assert.equal(audits.n, 39);

  const meta = (await call('GET', '/api/itinerary/meta')).body.data.counts;
  assert.equal(meta.places, 10);
  assert.equal(meta.placesScheduled, 6);
  assert.equal(meta.busesWithTimes, 4);
  assert.equal(meta.prices, 25);

  const r = await call('POST', '/api/itinerary/plan', undefined, BODY);
  const { plan, refs } = r.body.data;
  const items = plan.days.flatMap((d: any) => d.items);
  const placeItems = items.filter((i: any) => i.kind === 'place');
  assert.ok(placeItems.length >= 4, `có điểm tham quan: ${placeItems.map((i: any) => i.title).join(', ')}`);
  assert.ok(placeItems.every((i: any) => refs.places[i.ref.id]), 'chi tiết điểm có trong refs');
  assert.ok(!placeItems.some((i: any) => ['pl-doi-che-shan-tuyet', 'pl-khe-cai', 'pl-ho-mat-ngoc', 'pl-thac-khong-ten'].includes(i.ref.id)), 'điểm chưa có thời gian đi không xếp giờ');
  assert.ok(plan.extras.includes('pl-doi-che-shan-tuyet'));
  const busOut = items.find((i: any) => i.slotKey === 'bus-out');
  assert.ok(busOut && busOut.previousNight && busOut.start >= '19:00', 'săn mây → đi xe đêm');
  assert.equal(busOut.ref.id, 'tx-bus-134', 'ưu tiên nhà xe có giờ cả hai chiều');
  assert.equal(items.find((i: any) => i.slotKey === 'bus-in')?.ref.id, 'tx-bus-134', 'về cùng nhà xe');
  assert.ok(plan.cost.lines.some((l: any) => l.label.startsWith('Xe')));
  assert.ok(!plan.dataGaps.some((g: string) => /điểm tham quan/.test(g)));
});

test('Duyệt bản giá mới thì bản cũ chuyển "superseded"; sửa giá chuyển về chờ duyệt và ghi nhật ký', async () => {
  const { db, call, admin } = await setup();
  await approveAll(call, admin);
  const id = 'rf-price-tx-stay-1';
  const before = await db.d1.prepare('SELECT status, value_json FROM reference_facts WHERE id = ?').bind(id).first<any>();
  assert.equal(before.status, 'approved');

  const edit = await call('POST', `/api/admin/itinerary-data/fact/${id}`, admin, { amountVnd: 450000, unit: 'phòng/đêm' });
  assert.equal(edit.status, 200, JSON.stringify(edit.body));
  assert.equal((await db.d1.prepare('SELECT status FROM reference_facts WHERE id = ?').bind(id).first<any>()).status, 'pending');
  assert.equal((await call('POST', '/api/admin/itinerary-data/fact/rf-bus-tx-bus-134', admin, { amountVnd: 1 })).body.code, 'NOT_EDITABLE');

  await db.d1.prepare(`INSERT INTO reference_facts (id, listing_id, kind, value_json, sources_json, status, created_at) VALUES ('rf-new', 'tx-stay-1', 'price_from', '{"amountVnd":500000,"unit":"phòng/đêm"}', '[]', 'approved', '2026-11-14')`).run();
  const ok = await call('POST', '/api/admin/itinerary-data/review', admin, { type: 'fact', decision: 'approve', ids: [id] });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal((await db.d1.prepare("SELECT status FROM reference_facts WHERE id = 'rf-new'").first<any>()).status, 'superseded');
  assert.equal(JSON.parse((await db.d1.prepare('SELECT value_json FROM reference_facts WHERE id = ?').bind(id).first<any>()).value_json).amountVnd, 450000);
  const audit = await db.d1.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'itinerary_fact_update' AND entity_id = ?").bind(id).first<any>();
  assert.equal(audit.n, 1);

  const editPlace = await call('POST', '/api/admin/itinerary-data/place/pl-khe-cai', admin, { travelMinutes: 15 });
  assert.equal(editPlace.status, 200);
  assert.equal((await call('POST', '/api/admin/itinerary-data/place/pl-khe-cai', admin, { visitMinutes: null })).status, 400);
});

function geminiReply(obj: unknown) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
}

test('AI: hiểu ghi chú (chỉ nhận điểm có thật), viết lời dẫn hợp lệ; định tuyến model theo độ khó; không gửi email/SĐT', async () => {
  const calls: Array<{ url: string; body: any; headers: any }> = [];
  const fake: FakeFetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body, headers: init.headers });
    const sys = body.systemInstruction.parts[0].text as string;
    if (sys.includes('trích xuất sở thích')) return geminiReply({ styles: ['kham-pha', 'bay-lượn'], budget: 'tiet-kiem', avoid: ['Sống lưng khủng long (Háng Đồng)', 'Hồ Gươm'], prefer: ['mâm xôi xím vàng'] });
    const days = JSON.parse(body.contents[0].parts[0].text) as any[];
    return geminiReply({ days: days.map((d) => `Ngày ${d.ngay} thong thả, nhớ mang áo ấm.`) });
  };
  const { call, admin } = await setup({ geminiApiKey: 'test-key', aiFetch: fake as any });
  await approveAll(call, admin);
  const r = await call('POST', '/api/itinerary/plan', undefined, { ...BODY, note: 'Nhóm sinh viên, không đi sống lưng khủng long, muốn xem mâm xôi', narrate: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const { plan, ai } = r.body.data;
  assert.equal(ai.available, true);
  assert.deepEqual(ai.hints.styles, ['kham-pha'], 'bỏ giá trị lạ');
  assert.deepEqual(ai.hints.avoidPlaceIds, ['pl-song-lung-khung-long'], 'chỉ nhận tên điểm có thật');
  assert.deepEqual(ai.hints.preferPlaceIds, ['pl-mam-xoi-xim-vang'], 'khớp không dấu, không phân biệt hoa thường');
  const used = plan.days.flatMap((d: any) => d.items).map((i: any) => i.ref?.id);
  assert.ok(!used.includes('pl-song-lung-khung-long'));
  assert.ok(used.includes('pl-mam-xoi-xim-vang'));
  assert.equal(ai.narrated, true);
  assert.ok(plan.days.every((d: any) => /thong thả/.test(d.intro)));
  assert.ok(calls.every((c) => c.url.startsWith('https://generativelanguage.googleapis.com/')));
  assert.ok(calls[0].url.includes('gemini-flash-lite-latest'), 'việc đơn giản dùng model nhẹ');
  assert.ok(calls[1].url.includes('gemini-flash-latest'), 'việc vừa dùng model vừa');
  const sent = JSON.stringify(calls.map((c) => c.body));
  assert.ok(!/@|\b0\d{9}\b/.test(sent), 'không gửi email/số điện thoại cho nhà cung cấp AI');
});

test('AI: lời dẫn có giá tiền hoặc nhắc nơi ngoài lịch bị loại; Gemini lỗi thì chuyển RevidAPI; hết hạn mức thì bỏ qua AI', async () => {
  let mode: 'price' | 'fail-gemini' = 'price';
  const urls: string[] = [];
  const fake: FakeFetch = async (url, init) => {
    urls.push(url);
    const body = JSON.parse(init.body);
    if (url.includes('generativelanguage')) {
      if (mode === 'fail-gemini') return new Response('quota', { status: 429 });
      const days = JSON.parse(body.contents[0].parts[0].text) as any[];
      return geminiReply({ days: days.map(() => 'Phòng chỉ 300.000đ một đêm!') });
    }
    assert.equal(init.headers.Authorization, 'Bearer revid-key');
    const n = JSON.parse(body.messages[1].content).length;
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ days: Array.from({ length: n }, () => 'Một ngày nhẹ nhàng.') }) } }] }), { status: 200 });
  };
  const { call, admin } = await setup({ geminiApiKey: 'g', revidApiKey: 'revid-key', aiFetch: fake as any, aiDailyLimit: 3 });
  await approveAll(call, admin);

  const bad = (await call('POST', '/api/itinerary/plan', undefined, { ...BODY, narrate: true })).body.data;
  assert.equal(bad.ai.narrated, false);
  assert.ok(bad.plan.days.every((d: any) => d.intro === null), 'lời dẫn có giá bị loại');

  mode = 'fail-gemini';
  const fb = (await call('POST', '/api/itinerary/plan', undefined, { ...BODY, narrate: true })).body.data;
  assert.equal(fb.ai.narrated, true);
  assert.ok(urls.some((u) => u === 'https://ai.revidapi.com/v1/chat/completions'));

  const n = urls.length;
  const capped = (await call('POST', '/api/itinerary/plan', undefined, { ...BODY, narrate: true })).body.data;
  assert.equal(capped.ai.narrated, false);
  assert.equal(urls.length, n, 'hết hạn mức (3 lượt/ngày) thì không gọi nữa');
  assert.ok(capped.plan.days.length === 3, 'lịch vẫn dựng bình thường');
});
