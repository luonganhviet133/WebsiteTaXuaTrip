/**
 * N05.3 — Mã QR nhận phòng của khách. Ảnh QR tạo ngay trong trình duyệt (không gửi mã ra dịch vụ ngoài).
 * Mã chỉ server trả cho khách chủ đơn khi đơn đã được cơ sở xác nhận.
 */
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { bookingsApi, checkinUrl } from '../api/bookingsApi.ts';

export const CheckinQr: React.FC<{ bookingId: string }> = ({ bookingId }) => {
  const [state, setState] = useState<{ kind: 'loading' } | { kind: 'none'; message: string } | { kind: 'ok'; src: string }>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' });
    bookingsApi.detail(bookingId).then(async (r) => {
      if (!alive) return;
      if (!r.ok) return setState({ kind: 'none', message: r.message });
      if (!r.data.checkinToken) {
        return setState({ kind: 'none', message: 'Mã QR có sau khi cơ sở xác nhận đã nhận cọc.' });
      }
      const src = await QRCode.toDataURL(checkinUrl(window.location.origin, r.data.checkinToken), { margin: 1, width: 220 });
      if (alive) setState({ kind: 'ok', src });
    });
    return () => {
      alive = false;
    };
  }, [bookingId]);

  if (state.kind === 'loading') return <div className="w-[160px] h-[160px] rounded-xl bg-slate-100 animate-pulse" aria-label="Đang tải mã QR" />;
  if (state.kind === 'none') return <p className="text-xs text-slate-600 max-w-[180px]">{state.message}</p>;
  return <img src={state.src} alt="Mã QR nhận phòng" className="w-[160px] h-[160px] rounded-xl" />;
};
