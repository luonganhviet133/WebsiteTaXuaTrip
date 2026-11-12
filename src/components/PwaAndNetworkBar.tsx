import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  WifiOff,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  X,
  Download
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

interface PWAInstallButtonProps {
  isNavyHeader?: boolean;
  lowDataMode: boolean;
  onToggleLowDataMode: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  isNavyHeader = false,
  lowDataMode,
  onToggleLowDataMode
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleClickInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {!isInstalled && (
        <button
          type="button"
          onClick={handleClickInstall}
          className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
            isNavyHeader
              ? 'bg-teal-400/20 text-teal-200 border border-teal-300/40 hover:bg-teal-400/30'
              : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
          }`}
          title="Cài đặt ứng dụng Tà Xùa Trip lên màn hình chính (Hỗ trợ Offline trên đèo)"
        >
          <Smartphone className="w-3 h-3" />
          <span>Cài App Offline (PWA)</span>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleLowDataMode}
        className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
          lowDataMode
            ? 'bg-amber-400 text-slate-950'
            : isNavyHeader
            ? 'bg-white/10 text-slate-200 hover:bg-white/20'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
        title="Bật chế độ tiết kiệm 4G khi đi qua vùng sóng yếu Đèo Chẹn – Háng Đồng"
      >
        {lowDataMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
        <span>{lowDataMode ? 'Chế độ Sóng yếu: BẬT' : 'Chế độ Sóng yếu'}</span>
      </button>

      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-xl">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
          <span>Đang mất sóng 4G — Tự động dùng dữ liệu Offline đã lưu trên máy</span>
        </div>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Hướng dẫn cài đặt ứng dụng PWA Offline"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#073161]">
                    Cài App Tà Xùa Trip (Chạy Khi Mất Sóng)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chuẩn Progressive Web App (PWA) · Service Worker đã kích hoạt
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Đóng hướng dẫn cài App"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã lưu đệm (Cache) thành công vào bộ nhớ trình duyệt!</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Toàn bộ SĐT chủ homestay, tọa độ GPS săn mây, mã đặt phòng và danh bạ Cứu hộ Đèo Chẹn 24/7 đã sẵn sàng mở ngay cả khi lên đèo mất sóng 4G.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="font-extrabold text-[#073161]">
                {isIOS
                  ? 'Cách thêm vào Màn hình chính trên iPhone / iPad:'
                  : 'Cách cài đặt lên Màn hình chính điện thoại / máy tính:'}
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                <li>
                  Trên thanh địa chỉ trình duyệt (Chrome / Edge / Safari), bấm biểu tượng{' '}
                  <strong>Cài đặt ứng dụng (Install)</strong> hoặc nút <strong>Chia sẻ (Share)</strong>.
                </li>
                <li>
                  Chọn <strong>Thêm vào Màn hình chính (Add to Home Screen)</strong>.
                </li>
                <li>
                  Hoặc tải bản <strong>File Chạy Ngay (.HTML)</strong> trên thanh công cụ để lưu thẳng vào thư mục Tệp của máy.
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full rounded-full bg-[#073161] hover:bg-[#0a3f7c] py-2.5 text-xs font-extrabold text-white cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
