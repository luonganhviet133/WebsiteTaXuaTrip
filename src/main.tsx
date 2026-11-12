import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import {captureAttribution} from './search/attribution.ts';
import './index.css';

// N04.1: ghi nguồn khách (utm_*, ref) trước khi router viết lại URL.
try {
  captureAttribution(window.location.search, document.referrer, window.localStorage, new Date(), window.location.pathname);
} catch {
  /* trình duyệt chặn localStorage: bỏ qua */
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
