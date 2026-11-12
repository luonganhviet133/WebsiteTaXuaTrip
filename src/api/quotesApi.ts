/**
 * N04.2 — Gọi báo giá server. Trình duyệt chỉ hiển thị kết quả, không tự tính tổng tiền homestay.
 */
export interface QuoteNight {
  date: string;
  kind: 'weekday' | 'weekend' | 'holiday';
  pricePerRoom: number;
}

export interface QuoteResponse {
  id: string;
  listingId: string;
  roomTypeId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  nights: QuoteNight[];
  subtotal: number;
  discount: number;
  total: number;
  voucherCode: string | null;
  voucherError: { code: string; message: string } | null;
  expiresAt: string;
}

export type QuoteOutcome = { ok: true; quote: QuoteResponse } | { ok: false; code: string; message: string };

export interface QuoteRequestBody {
  listingId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  voucherCode?: string;
}

export async function requestQuote(body: QuoteRequestBody, signal?: AbortSignal): Promise<QuoteOutcome> {
  try {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    const data: any = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, quote: data.data as QuoteResponse };
    return { ok: false, code: data?.code || `HTTP_${res.status}`, message: data?.error || 'Không lấy được báo giá.' };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    return { ok: false, code: 'NETWORK', message: 'Không kết nối được máy chủ để báo giá. Kiểm tra mạng rồi thử lại.' };
  }
}

const KIND_LABEL: Record<QuoteNight['kind'], string> = { weekday: 'ngày thường', weekend: 'cuối tuần', holiday: 'ngày lễ' };
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "T6 20/11 · cuối tuần" */
export function nightLabel(n: QuoteNight): string {
  const dow = WD[new Date(`${n.date}T00:00:00Z`).getUTCDay()];
  return `${dow} ${n.date.slice(8, 10)}/${n.date.slice(5, 7)} · ${KIND_LABEL[n.kind]}`;
}
