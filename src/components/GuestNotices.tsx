/**
 * N06.1 — Thông báo cho khách trong "Chuyến đi của tôi": nhắc trả 70% (48 giờ, 30 giờ), cơ sở đã nhận đủ,
 * đơn bị từ chối/nhả phòng. Đọc từ server (cùng bảng thông báo với chuông của chủ cơ sở).
 */
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { bookingsApi, formatCreatedAt } from '../api/bookingsApi.ts';

type Item = { id: string; title: string; body: string; createdAt: string; read: boolean };

export const GuestNotices: React.FC<{ reloadKey?: number }> = ({ reloadKey }) => {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let alive = true;
    bookingsApi.notifications().then((r) => alive && r.ok && setItems(r.data.items.filter((x) => !x.read).slice(0, 5)));
    return () => {
      alive = false;
    };
  }, [reloadKey]);
  if (items.length === 0) return null;
  return (
    <section aria-label="Thông báo mới" className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
          <Bell className="w-4 h-4" /> Thông báo mới ({items.length})
        </p>
        <button
          type="button"
          onClick={() => void bookingsApi.markAllRead().then(() => setItems([]))}
          className="text-xs font-bold text-amber-900 underline cursor-pointer"
        >
          Đánh dấu đã đọc
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.map((n) => (
          <li key={n.id} className="text-xs text-slate-800">
            <span className="font-bold">{n.title}.</span> {n.body} <span className="text-slate-600">({formatCreatedAt(n.createdAt)})</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
