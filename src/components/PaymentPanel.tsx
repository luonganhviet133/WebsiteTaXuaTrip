/**
 * N06.1 — Thanh toán của khách (D03): đọc điều khoản và tick → thấy tài khoản của cơ sở, mã VietQR
 * (tạo trong trình duyệt), gửi ảnh biên lai. Gửi biên lai KHÔNG phải đã trả: chỉ khi cơ sở xác nhận.
 * Mọi số liệu lấy từ snapshot của server, không tự tính lại ở đây.
 */
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, UploadCloud } from 'lucide-react';
import { bookingsApi, formatCreatedAt, type PaymentView } from '../api/bookingsApi.ts';
import { DEPOSIT_PERCENT } from '../config/payment.ts';
import { formatVND } from '../utils/rules.ts';

const MAX_BYTES = 5 * 1024 * 1024;
const fmtDue = (iso: string) => formatCreatedAt(iso);

const TransferBlock: React.FC<{
  title: string;
  amount: number;
  memo: string;
  qr: string;
  bank: string;
  account: string;
  name: string;
}> = ({ title, amount, memo, qr, bank, account, name }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(qr, { margin: 1, width: 220 }).then((u) => alive && setSrc(u));
    return () => {
      alive = false;
    };
  }, [qr]);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* trình duyệt chặn clipboard: người dùng vẫn tự chép được */
    }
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  };
  const Row: React.FC<{ label: string; value: string; copyKey?: string }> = ({ label, value, copyKey }) => (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-600 shrink-0">{label}</span>
      <span className="text-sm font-bold text-slate-900 text-right break-words min-w-0 flex items-center gap-1.5">
        {value}
        {copyKey && (
          <button type="button" onClick={() => void copy(value, copyKey)} aria-label={`Chép ${label.toLowerCase()}`} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            {copied === copyKey ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        )}
      </span>
    </div>
  );
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 grid gap-4 sm:grid-cols-[180px_1fr] items-start">
      <div className="flex flex-col items-center">
        {src ? <img src={src} alt={`Mã VietQR ${title}`} className="w-[160px] h-[160px]" /> : <div className="w-[160px] h-[160px] bg-slate-100 rounded-xl animate-pulse" />}
        <p className="text-xs text-slate-600 text-center mt-1">Quét bằng app ngân hàng</p>
      </div>
      <div>
        <p className="text-sm font-extrabold text-brand-800 mb-1">{title}</p>
        <Row label="Số tiền" value={formatVND(amount)} />
        <Row label="Ngân hàng" value={bank} />
        <Row label="Số tài khoản" value={account} copyKey="acc" />
        <Row label="Chủ tài khoản" value={name} />
        <Row label="Nội dung" value={memo} copyKey="memo" />
      </div>
    </div>
  );
};

export const PaymentPanel: React.FC<{ bookingId: string; onChanged?: () => void }> = ({ bookingId, onChanged }) => {
  const [view, setView] = useState<PaymentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const load = async () => {
    const r = await bookingsApi.payment(bookingId);
    if (r.ok) {
      setView(r.data);
      setError(null);
    } else setError(r.message);
  };
  useEffect(() => {
    void load();
  }, [bookingId]);

  useEffect(() => {
    if (!view) return;
    let alive = true;
    const created: string[] = [];
    Promise.all(view.receipts.map(async (r) => [r.id, await bookingsApi.receiptObjectUrl(bookingId, r.id)] as const)).then((pairs) => {
      if (!alive) return;
      const next: Record<string, string> = {};
      for (const [id, url] of pairs) {
        if (!url) continue;
        next[id] = url;
        created.push(url);
      }
      setThumbs(next);
    });
    return () => {
      alive = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [view?.receipts.length, bookingId]);

  if (error) return <p className="text-xs font-bold text-rose-700">{error}</p>;
  if (!view) return <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" aria-label="Đang tải thông tin thanh toán" />;

  const s = view.snapshot;
  const holding = view.status === 'pending_deposit';
  const confirmed = view.status === 'confirmed';
  const kindNow: 'deposit' | 'balance' | null = holding ? 'deposit' : confirmed && !view.balanceConfirmedAt ? 'balance' : null;

  const accept = async () => {
    setBusy(true);
    const r = await bookingsApi.acceptTerms(bookingId, view.termsVersion);
    setBusy(false);
    if (r.ok) setView(r.data);
    else setNotice(r.message);
  };

  const upload = async (file: File | undefined) => {
    if (!file || !kindNow) return;
    setNotice(null);
    if (file.size > MAX_BYTES) return setNotice('Ảnh tối đa 5 MB.');
    setBusy(true);
    const r = await bookingsApi.uploadReceipt(bookingId, kindNow, file);
    setBusy(false);
    if (!r.ok) return setNotice(r.message);
    setNotice('Đã gửi ảnh. Đơn chỉ được tính là đã trả khi cơ sở kiểm tra tài khoản và bấm xác nhận.');
    await load();
    onChanged?.();
  };

  return (
    <section className="bg-[#f8fafc] border border-teal-200 rounded-2xl p-4 sm:p-5 space-y-4" aria-label="Thanh toán">
      {/* Trạng thái tiền do cơ sở xác nhận */}
      <ul className="space-y-1 text-sm">
        <li className={view.depositConfirmedAt ? 'text-emerald-800 font-bold' : 'text-slate-700'}>
          {view.depositConfirmedAt ? `✓ Cơ sở đã xác nhận nhận cọc lúc ${formatCreatedAt(view.depositConfirmedAt)}` : `Cọc ${DEPOSIT_PERCENT}%: chờ cơ sở xác nhận đã nhận.`}
        </li>
        {(confirmed || view.status === 'checked_in' || view.status === 'completed') && (
          <li className={view.balanceConfirmedAt ? 'text-emerald-800 font-bold' : view.balanceOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
            {view.balanceConfirmedAt
              ? `✓ Cơ sở đã xác nhận nhận đủ ${100 - DEPOSIT_PERCENT}% lúc ${formatCreatedAt(view.balanceConfirmedAt)}`
              : view.balanceOverdue
                ? `Đã quá hạn trả ${100 - DEPOSIT_PERCENT}% (${fmtDue(view.balanceDueAt)}). Cơ sở có thể nhả phòng, cọc không hoàn. Liên hệ cơ sở ngay.`
                : `Trả ${100 - DEPOSIT_PERCENT}% còn lại trước ${fmtDue(view.balanceDueAt)}.`}
          </li>
        )}
      </ul>

      {!view.termsAccepted ? (
        kindNow ? (
          <div className="space-y-3">
            <p className="text-sm font-extrabold text-brand-800">Điều khoản đặt cọc</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
              {view.termsPoints.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {!view.payoutReady ? (
              <p className="text-sm font-bold text-amber-800">Cơ sở chưa cập nhật tài khoản nhận cọc. Vui lòng gọi cơ sở theo số trên trang chi tiết.</p>
            ) : (
              <>
                <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4" />
                  <span>Tôi đã đọc và đồng ý các điều khoản trên.</span>
                </label>
                <button
                  type="button"
                  disabled={!agreed || busy}
                  onClick={() => void accept()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-brand-800 hover:bg-brand-700 text-white text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xem thông tin chuyển cọc
                </button>
              </>
            )}
          </div>
        ) : null
      ) : (
        s &&
        kindNow && (
          <div className="space-y-3">
            {kindNow === 'deposit' ? (
              <TransferBlock
                title={`Chuyển cọc ${DEPOSIT_PERCENT}%`}
                amount={s.depositAmount}
                memo={s.depositMemo}
                qr={s.vietQrDeposit}
                bank={s.payeeBankName}
                account={s.payeeAccountNumber}
                name={s.payeeAccountName}
              />
            ) : (
              <TransferBlock
                title={`Chuyển ${100 - DEPOSIT_PERCENT}% còn lại`}
                amount={s.balanceAmount}
                memo={s.balanceMemo}
                qr={s.vietQrBalance}
                bank={s.payeeBankName}
                account={s.payeeAccountNumber}
                name={s.payeeAccountName}
              />
            )}
            <p className="text-xs text-slate-600">Tiền chuyển thẳng vào tài khoản của cơ sở. Tổng đơn {formatVND(s.totalAmount)}.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              <span>{busy ? 'Đang gửi…' : 'Gửi ảnh biên lai'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        )
      )}

      {notice && <p role="status" className="text-xs font-bold text-slate-800">{notice}</p>}

      {view.receipts.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-700 mb-2">Biên lai đã gửi (chưa phải xác nhận đã nhận tiền)</p>
          <div className="flex flex-wrap gap-2">
            {view.receipts.map((r) => (
              <a key={r.id} href={thumbs[r.id]} target="_blank" rel="noopener noreferrer" className="block">
                {thumbs[r.id] ? (
                  <img src={thumbs[r.id]} alt={`Biên lai ${r.kind === 'deposit' ? 'cọc' : '70%'} ${formatCreatedAt(r.createdAt)}`} className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                ) : (
                  <span className="block w-16 h-16 rounded-xl bg-slate-100" />
                )}
                <span className="block text-xs text-slate-600 text-center mt-0.5">{r.kind === 'deposit' ? 'Cọc' : `${100 - DEPOSIT_PERCENT}%`}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
