import React, { useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('TURNSTILE_SCRIPT_FAILED'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  action: 'login' | 'register' | 'forgot';
  /** Nhận token khi xác minh xong; nhận chuỗi rỗng khi token hết hạn hoặc lỗi. */
  onToken: (token: string) => void;
  /** Tăng giá trị này để làm mới widget (token Turnstile chỉ dùng được một lần). */
  resetSignal: number;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ siteKey, action, onToken, resetSignal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          language: 'vi',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current('')
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, action]);

  useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current('');
    }
  }, [resetSignal]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={containerRef} className="min-h-[65px]" />
      {loadError && (
        <p className="text-xs text-rose-700">
          Không tải được bước xác minh chống bot. Kiểm tra kết nối mạng rồi mở lại cửa sổ này.
        </p>
      )}
    </div>
  );
};
