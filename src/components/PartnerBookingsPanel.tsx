/**
 * N05.3 — Đơn đặt phòng của cơ sở (đọc từ server, mọi thiết bị thấy như nhau), chuông thông báo (Q3)
 * và nhận phòng bằng mã QR. Chủ cơ sở không tự đổi trạng thái tùy ý: nút chỉ hiện đúng bảng chuyển trạng thái,
 * server kiểm lại quyền và trạng thái.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, Phone, QrCode, RefreshCw, XCircle } from 'lucide-react';
import { bookingsApi, ownerActions, parseCheckinInput, statusLabel, type OwnerAction, type ServerBooking } from '../api/bookingsApi.ts';
import { holdExpiryLabel } from '../api/holdsApi.ts';
import { formatVND } from '../utils/rules.ts';

type Notice = { type: 'ok' | 'error'; text: string } | null;
type NotificationList = { unread: number; items: { id: string; title: string; body: string; createdAt: string; read: boolean }[] };

const ACTION_TEXT: Record<OwnerAction, string> = { confirm: 'Đã nhận cọc', reject: 'Từ chối', complete: 'Hoàn tất (khách đã trả phòng)' };
const fmtDate = (d: string) => d.split('-').reverse().join('/');
const zaloLink = (phone: string) => `https://zalo.me/${phone.replace(/\D/g, '')}`;

const NotificationBell: React.FC<{ data: NotificationList | null; onOpen: () => void }> = ({ data, onOpen }) => {
  const [open, setOpen] = useState(false);
  const unread = data?.unread ?? 0;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) onOpen();
        }}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        className="relative w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center cursor-pointer"
      >
        <Bell className="w-5 h-5 text-amber-300" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-80 overflow-y-auto bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl z-30 p-2 space-y-1">
          {!data || data.items.length === 0 ? (
            <p className="text-xs text-slate-400 p-3">Chưa có thông báo.</p>
          ) : (
            data.items.map((n) => (
              <div key={n.id} className={`rounded-xl p-2.5 text-xs ${n.read ? 'text-slate-400' : 'bg-slate-800 text-white'}`}>
                <p className="font-bold">{n.title}</p>
                <p className="mt-0.5 leading-relaxed">{n.body}</p>
                <p className="mt-1 text-slate-500">{new Date(n.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const PartnerBookingsPanel: React.FC<{
  listingId: string;
  /** Mã từ đường dẫn QR (/doi-tac/nhan-phong?ma=…) */
  initialCheckinToken?: string;
  onCheckinFinished?: () => void;
}> = ({ listingId, initialCheckinToken, onCheckinFinished }) => {
  const [bookings, setBookings] = useState<ServerBooking[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationList | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [checkinInput, setCheckinInput] = useState(initialCheckinToken || '');
  const [checkinPreview, setCheckinPreview] = useState<{ token: string; booking: ServerBooking } | null>(null);
  const [checkinNotice, setCheckinNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    const [list, notes] = await Promise.all([bookingsApi.partnerList(listingId), bookingsApi.notifications()]);
    if (list.ok) {
      setBookings(list.data);
      setLoadError(null);
    } else setLoadError(list.message);
    if (notes.ok) setNotifications(notes.data);
  }, [listingId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const previewToken = async (raw: string) => {
    setCheckinNotice(null);
    setCheckinPreview(null);
    const token = parseCheckinInput(raw);
    if (!token) return setCheckinNotice({ type: 'error', text: 'Mã không đúng dạng. Hãy quét QR của khách hoặc dán đường dẫn trong QR.' });
    const r = await bookingsApi.checkinPreview(token);
    if (!r.ok) return setCheckinNotice({ type: 'error', text: r.message });
    setCheckinPreview({ token, booking: r.data });
  };

  useEffect(() => {
    if (initialCheckinToken) void previewToken(initialCheckinToken);
  }, [initialCheckinToken]);

  const confirmCheckin = async () => {
    if (!checkinPreview) return;
    const r = await bookingsApi.checkin(checkinPreview.token);
    if (!r.ok) return setCheckinNotice({ type: 'error', text: r.message });
    setCheckinNotice({ type: 'ok', text: r.already ? `Đơn ${r.data.bookingCode} đã nhận phòng trước đó.` : `Đã nhận phòng cho ${r.data.guestName} (đơn ${r.data.bookingCode}).` });
    setCheckinPreview(null);
    setCheckinInput('');
    await load();
    onCheckinFinished?.();
  };

  const runAction = async (b: ServerBooking, action: OwnerAction, reason?: string) => {
    setBusyId(b.id);
    setNotice(null);
    const r = await bookingsApi.act(b.id, action, reason);
    setBusyId(null);
    if (!r.ok) setNotice({ type: 'error', text: `Đơn ${b.bookingCode}: ${r.message}` });
    else setNotice({ type: 'ok', text: `Đơn ${b.bookingCode}: ${statusLabel(r.data.status, r.data.holdExpiresAt)}${r.already ? ' (đã làm trước đó)' : ''}.` });
    setRejecting(null);
    await load();
  };

  return (
    <section aria-labelledby="partner-bookings-title" className="bg-slate-850 border border-teal-500/30 rounded-3xl p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="partner-bookings-title" className="text-lg font-black text-white">Đơn đặt phòng</h2>
          <p className="text-xs text-slate-400 mt-0.5">Đơn lưu trên hệ thống, xem được từ mọi thiết bị. Tự cập nhật mỗi phút.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Tải lại đơn"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-200" />
          </button>
          <NotificationBell
            data={notifications}
            onOpen={() => {
              void bookingsApi.markAllRead().then(() => setNotifications((n) => (n ? { ...n, unread: 0 } : n)));
            }}
          />
        </div>
      </div>

      {/* Nhận phòng bằng mã QR */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-teal-300">
          <QrCode className="w-4 h-4" />
          <span>Nhận phòng</span>
        </div>
        <p className="text-xs text-slate-400">Mở camera điện thoại quét QR trong "Chuyến đi của tôi" của khách, hoặc dán đường dẫn/mã vào đây.</p>
        <form
          className="flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void previewToken(checkinInput);
          }}
        >
          <label htmlFor="checkin-code" className="sr-only">Mã hoặc đường dẫn nhận phòng</label>
          <input
            id="checkin-code"
            value={checkinInput}
            onChange={(e) => setCheckinInput(e.target.value)}
            placeholder="Dán đường dẫn trong QR của khách"
            className="flex-1 min-w-0 bg-slate-950 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold cursor-pointer">
            Kiểm tra mã
          </button>
        </form>
        {checkinPreview && (
          <div className="bg-teal-950/40 border border-teal-500/40 rounded-xl p-3 space-y-2 text-sm text-white">
            <p className="font-bold">
              {checkinPreview.booking.guestName} · {checkinPreview.booking.guestPhone}
            </p>
            <p className="text-xs text-slate-300">
              Đơn {checkinPreview.booking.bookingCode} · {checkinPreview.booking.roomName} × {checkinPreview.booking.rooms} ·{' '}
              {fmtDate(checkinPreview.booking.checkInDate)} → {fmtDate(checkinPreview.booking.checkOutDate)} · {statusLabel(checkinPreview.booking.status, checkinPreview.booking.holdExpiresAt)}
            </p>
            {checkinPreview.booking.status === 'confirmed' ? (
              <button type="button" onClick={() => void confirmCheckin()} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-black cursor-pointer">
                Xác nhận khách đã nhận phòng
              </button>
            ) : (
              <p className="text-xs font-bold text-amber-300">
                Đơn đang ở trạng thái "{statusLabel(checkinPreview.booking.status, checkinPreview.booking.holdExpiresAt)}", không nhận phòng bằng mã này được.
              </p>
            )}
          </div>
        )}
        {checkinNotice && (
          <p role="status" className={`text-xs font-bold ${checkinNotice.type === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {checkinNotice.text}
          </p>
        )}
      </div>

      {notice && (
        <p role="status" className={`text-xs font-bold ${notice.type === 'ok' ? 'text-emerald-300' : 'text-rose-300'}`}>
          {notice.text}
        </p>
      )}
      {loadError && <p className="text-xs font-bold text-rose-300">{loadError}</p>}
      {bookings && bookings.length === 0 && <p className="text-sm text-slate-400">Chưa có đơn nào cho cơ sở này.</p>}

      <ul className="space-y-3">
        {(bookings || []).map((b) => {
          const actions = ownerActions(b.status, b.holdExpiresAt);
          return (
            <li key={b.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black text-sky-300">{b.bookingCode}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-slate-100">
                  {statusLabel(b.status, b.holdExpiresAt)}
                </span>
                {b.status === 'pending_deposit' && b.holdExpiresAt && Date.parse(b.holdExpiresAt) > Date.now() && (
                  <span className="text-xs text-amber-300">giữ đến {holdExpiryLabel(b.holdExpiresAt)}</span>
                )}
              </div>
              <div className="text-sm text-white font-bold">
                {b.guestName} · <span className="text-teal-300">{b.guestPhone}</span>
              </div>
              <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                <span>{b.roomName} × {b.rooms ?? 1}</span>
                <span>{fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)}</span>
                <span>{(b.adults ?? 0) + (b.children ?? 0)} khách</span>
                <span>Tổng {formatVND(b.totalAmount)} · Cọc 30% {formatVND(b.depositAmount)}</span>
              </div>
              {b.guestNote && <p className="text-xs text-amber-200">Ghi chú: {b.guestNote}</p>}
              {b.cancelReason && <p className="text-xs text-slate-400">Lý do hủy: {b.cancelReason}</p>}

              <div className="flex flex-wrap gap-2">
                <a href={zaloLink(b.guestPhone)} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold">
                  Mở Zalo khách
                </a>
                <a href={`tel:${b.guestPhone}`} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Gọi
                </a>
                {actions.map((a) =>
                  a === 'reject' ? (
                    <button
                      key={a}
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => setRejecting({ id: b.id, reason: '' })}
                      className="px-3 py-2 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> {ACTION_TEXT[a]}
                    </button>
                  ) : (
                    <button
                      key={a}
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void runAction(b, a)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {ACTION_TEXT[a]}
                    </button>
                  )
                )}
              </div>
              {rejecting?.id === b.id && (
                <form
                  className="flex flex-col sm:flex-row gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runAction(b, 'reject', rejecting.reason);
                  }}
                >
                  <label htmlFor={`reject-${b.id}`} className="sr-only">Lý do từ chối</label>
                  <input
                    id={`reject-${b.id}`}
                    value={rejecting.reason}
                    onChange={(e) => setRejecting({ id: b.id, reason: e.target.value })}
                    placeholder="Lý do từ chối (khách sẽ thấy)"
                    className="flex-1 min-w-0 bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <button type="submit" disabled={rejecting.reason.trim().length < 3} className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                    Xác nhận từ chối
                  </button>
                  <button type="button" onClick={() => setRejecting(null)} className="px-3 py-2 rounded-xl bg-slate-700 text-white text-xs font-bold cursor-pointer">
                    Thôi
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
