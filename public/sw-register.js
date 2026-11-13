// Đăng ký service worker (tách khỏi index.html để chính sách nội dung không cần cho phép script nội tuyến).
if ('serviceWorker' in navigator) {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}
