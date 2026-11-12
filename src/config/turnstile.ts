// Site key Turnstile là khóa công khai (nằm trong HTML), không phải bí mật.
// Bản build production dùng key thật của widget gắn hostname websitetaxuatrip.vanhuy171099.workers.dev.
// Chạy dev trên localhost dùng site key test của Cloudflare (luôn cho qua), đi cùng secret test ở server.
// Có thể ghi đè bằng biến build VITE_TURNSTILE_SITE_KEY khi đổi tên miền.
const PRODUCTION_SITE_KEY = '0x4AAAAAAF995HW0Zkab9OTs';
const TEST_SITE_KEY = '1x00000000000000000000AA';

export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.PROD ? PRODUCTION_SITE_KEY : TEST_SITE_KEY);
