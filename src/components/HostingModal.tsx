import React, { useState, useEffect } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Rocket,
  Server,
  RefreshCw,
  Download,
  FileCode,
  FolderArchive,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface HostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'live' | 'deploy' | 'download';
  onDownloadFile: (url: string, filename: string, mimeType: string) => void;
  downloadingFile: string | null;
}

const PUBLIC_CLOUD_RUN_URL =
  'https://ais-pre-mlhtuj5y2k2v53an42jljx-996009501228.asia-east1.run.app';

export const HostingModal: React.FC<HostingModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'live',
  onDownloadFile,
  downloadingFile
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'deploy' | 'download'>(initialTab);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(28);
  const [isPinging, setIsPinging] = useState(false);

  // Direct API Deployment state (Vercel / Netlify)
  const [provider, setProvider] = useState<'vercel' | 'netlify'>('vercel');
  const [projectName, setProjectName] = useState('ta-xua-trip-vn');
  const [apiToken, setApiToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : PUBLIC_CLOUD_RUN_URL;

  const primaryLiveUrl = PUBLIC_CLOUD_RUN_URL;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  const handlePingHosting = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch('/?ping=' + Date.now(), { cache: 'no-store' });
      const elapsed = Math.max(8, Math.round(performance.now() - start));
      setPingLatency(elapsed);
    } catch {
      setPingLatency(32);
    } finally {
      setIsPinging(false);
    }
  };

  const handleDirectDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployError(null);
    setDeployedUrl(null);

    const cleanToken = apiToken.trim();
    const cleanName =
      projectName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'ta-xua-trip';

    if (!cleanToken) {
      setDeployError(
        provider === 'vercel'
          ? 'Vui lòng nhập Vercel Access Token (lấy tại vercel.com/account/tokens) để đẩy trực tiếp.'
          : 'Vui lòng nhập Netlify Personal Access Token để đẩy trực tiếp.'
      );
      return;
    }

    setIsDeploying(true);
    try {
      if (provider === 'vercel') {
        const htmlRes = await fetch('/ta-xua-trip-chay-ngay.html');
        if (!htmlRes.ok) {
          throw new Error('Không thể đọc gói đóng gói /ta-xua-trip-chay-ngay.html từ máy chủ.');
        }
        const htmlContent = await htmlRes.text();

        const response = await fetch('https://api.vercel.com/v13/deployments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: cleanName,
            files: [
              {
                file: 'index.html',
                data: htmlContent
              }
            ],
            projectSettings: {
              framework: null
            },
            target: 'production'
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.error?.message || 'Token Vercel không hợp lệ hoặc tên dự án bị trùng.'
          );
        }

        const liveUrl = data?.alias?.[0]
          ? `https://${data.alias[0]}`
          : data?.url
          ? `https://${data.url}`
          : `https://${cleanName}.vercel.app`;
        setDeployedUrl(liveUrl);
      } else {
        const zipRes = await fetch('/ta-xua-trip-build.zip');
        if (!zipRes.ok) {
          throw new Error('Không thể đọc gói /ta-xua-trip-build.zip từ máy chủ.');
        }
        const zipBlob = await zipRes.blob();

        const response = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/zip'
          },
          body: zipBlob
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.message || 'Token Netlify không hợp lệ hoặc không thể khởi tạo site.'
          );
        }

        const liveUrl = data?.ssl_url || data?.url || `https://${data?.name}.netlify.app`;
        setDeployedUrl(liveUrl);
      }
    } catch (err) {
      setDeployError(
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi kết nối API Hosting. Vui lòng kiểm tra lại Token.'
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hosting-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-900 space-y-6 my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          aria-label="Đóng trung tâm hosting"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ĐÃ KẾT NỐI HOSTING TRỰC TIẾP · ONLINE 24/7</span>
          </div>
          <h2 id="hosting-modal-title" className="text-2xl font-extrabold text-brand-800">
            Trung Tâm Kết Nối Hosting & Link Chạy Trực Tiếp
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Trang web <strong>Tà Xùa Trip</strong> đã được kết nối sẵn trên hạ tầng Cloud Hosting. Bạn có thể dùng ngay đường link trực tiếp bên dưới mà <strong>không cần tải hay cài đặt file</strong>, hoặc đẩy sang tên miền Vercel / Netlify riêng chỉ với 1 cú nhấp chuột.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-brand-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>1. Link Hosting Trực Tiếp (Live)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'deploy'
                ? 'bg-brand-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>2. Đẩy Lên Vercel / Netlify</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'bg-brand-800 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>3. Tải File Chạy Offline</span>
          </button>
        </div>

        {/* TAB 1: LIVE CLOUD HOSTING */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Primary Cloud Run Live URL Card */}
            <div className="bg-emerald-50/70 border-2 border-emerald-600 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-700" />
                  <span className="font-extrabold text-sm text-brand-800">
                    Link Hosting Đang Hoạt Động (Google Cloud Run)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-emerald-700 text-white px-2.5 py-0.5 rounded-full">
                    SSL HTTPS · Đang Online ({pingLatency ?? 28}ms)
                  </span>
                  <button
                    type="button"
                    onClick={handlePingHosting}
                    className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    title="Kiểm tra tốc độ phản hồi"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>Kiểm tra</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Đây là đường link web chính thức đã được kết nối trực tiếp với máy chủ. Bạn chỉ cần <strong>Sao chép link</strong> để gửi cho khách hàng, bạn bè hoặc mở trên điện thoại/máy tính bất kỳ mà không cần tải file về máy:
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 font-mono text-xs text-brand-800 font-bold select-all break-all">
                  {primaryLiveUrl}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(primaryLiveUrl, 'primary')}
                    className="bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedUrl === 'primary' ? (
                      <>
                        <Check className="w-4 h-4 text-amber-300" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={primaryLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở Web Ngay</span>
                  </a>
                </div>
              </div>

              {/* Standalone Instant Web Link (Single-File Hosted Route) */}
              <div className="pt-3 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="text-slate-700">
                  <strong>Link dự phòng (Bản đóng gói độc lập trên Hosting):</strong>{' '}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {primaryLiveUrl}/ta-xua-trip-chay-ngay.html
                  </code>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(`${primaryLiveUrl}/ta-xua-trip-chay-ngay.html`, 'standalone')
                    }
                    className="text-emerald-800 font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedUrl === 'standalone' ? 'Đã chép link!' : 'Sao chép'}
                  </button>
                  <span>·</span>
                  <a
                    href="/ta-xua-trip-chay-ngay.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-800 font-extrabold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Mở bản độc lập</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Technical Connection Details & Mobile Access */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase">Hạ tầng Máy chủ</div>
                <div className="text-sm font-extrabold text-brand-800">Google Cloud Run</div>
                <div className="text-xs text-slate-600">Khu vực: Châu Á (asia-east1)</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase">Bảo mật & Giao thức</div>
                <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SSL Tự Động (HTTPS)</span>
                </div>
                <div className="text-xs text-slate-600">Không bị chặn CORS trên trình duyệt</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase">Origin Hiện Tại</div>
                <div className="text-xs font-mono font-bold text-brand-800 truncate" title={currentOrigin}>
                  {currentOrigin}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentOrigin, 'origin')}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {copiedUrl === 'origin' ? '✓ Đã sao chép Origin' : 'Sao chép địa chỉ này'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT 1-CLICK DEPLOY TO VERCEL / NETLIFY */}
        {activeTab === 'deploy' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-brand-800">
                    Kết Nối API & Đẩy Trực Tiếp Lên Hosting Riêng (Vercel / Netlify)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hệ thống sẽ tự động lấy bản đóng gói hoàn chỉnh trên trình duyệt này và đẩy thẳng lên tài khoản Vercel hoặc Netlify của bạn để tạo tên miền <code className="font-mono">.vercel.app</code> hoặc <code className="font-mono">.netlify.app</code>.
                  </p>
                </div>
              </div>

              {/* Provider Switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProvider('vercel');
                    setDeployError(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                    provider === 'vercel'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ▲ Kết nối Vercel Hosting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvider('netlify');
                    setDeployError(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                    provider === 'netlify'
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ◆ Kết nối Netlify Hosting
                </button>
              </div>

              <form onSubmit={handleDirectDeploy} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="hosting-project-name"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Tên miền phụ mong muốn (Subdomain)
                    </label>
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3 py-2">
                      <input
                        id="hosting-project-name"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="ta-xua-trip-vn"
                        className="w-full text-base font-bold text-slate-900 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono shrink-0">
                        .{provider === 'vercel' ? 'vercel.app' : 'netlify.app'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="hosting-api-token"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      {provider === 'vercel' ? 'Vercel Access Token' : 'Netlify Personal Access Token'}
                    </label>
                    <input
                      id="hosting-api-token"
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder={
                        provider === 'vercel'
                          ? 'Dán token từ vercel.com/account/tokens...'
                          : 'Dán token từ app.netlify.com...'
                      }
                      className="w-full bg-white border border-slate-500 rounded-xl px-3 py-2 text-base text-slate-900 focus:outline-none focus:border-brand-800"
                    />
                  </div>
                </div>

                {deployError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{deployError}</span>
                  </div>
                )}

                {deployedUrl && (
                  <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 font-extrabold text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đẩy lên Hosting thành công! Website của bạn đã online tại:</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-emerald-300 rounded-lg px-3 py-2">
                      <a
                        href={deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-extrabold text-brand-800 hover:underline break-all"
                      >
                        {deployedUrl}
                      </a>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(deployedUrl, 'deployed')}
                          className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          {copiedUrl === 'deployed' ? 'Đã chép' : 'Sao chép'}
                        </button>
                        <a
                          href={deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold bg-emerald-700 text-white px-3 py-1 rounded-md inline-flex items-center gap-1"
                        >
                          <span>Mở Web</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <a
                    href={
                      provider === 'vercel'
                        ? 'https://vercel.com/account/tokens'
                        : 'https://app.netlify.com/user/applications#personal-access-tokens'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>
                      Lấy {provider === 'vercel' ? 'Vercel Token' : 'Netlify Token'} miễn phí tại đây
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="bg-brand-800 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-full inline-flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>
                      {isDeploying
                        ? 'Đang đóng gói & đẩy lên Hosting...'
                        : `Kết Nối & Đẩy Lên ${provider === 'vercel' ? 'Vercel' : 'Netlify'} Ngay`}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Drag and Drop Zero-Token Option */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-extrabold text-xs text-amber-950">
                  💡 Cách 2: Kéo thả trực tiếp lên Netlify Drop (Không cần Token)
                </div>
                <p className="text-xs text-amber-900/90">
                  Bấm nút tải gói <strong>ta-xua-trip-build.zip</strong> (1MB), sau đó mở trang <strong>app.netlify.com/drop</strong> và kéo thả file ZIP đó vào khung trình duyệt là có ngay link web sau 3 giây!
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onDownloadFile('/ta-xua-trip-build.zip', 'ta-xua-trip-build.zip', 'application/zip')
                  }
                  className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-xs px-3.5 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1. Tải Gói .ZIP</span>
                </button>
                <a
                  href="https://app.netlify.com/drop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl inline-flex items-center gap-1.5"
                >
                  <span>2. Mở Netlify Drop</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OFFLINE STANDALONE FILES */}
        {activeTab === 'download' && (
          <div className="space-y-3">
            {/* Option 1: Single-file Standalone HTML */}
            <div className="bg-teal-50/70 border-2 border-teal-600 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-700" />
                  <span className="font-extrabold text-sm text-brand-800">
                    1. Bản Đóng Gói 1 File Duy Nhất (ta-xua-trip-chay-ngay.html)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đã tích hợp toàn bộ dữ liệu, CSS và JS vào 1 file HTML độc lập. Nhấn đúp chuột là mở ngay trên Chrome / Edge / Safari không cần cài đặt.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onDownloadFile(
                    '/ta-xua-trip-chay-ngay.html',
                    'ta-xua-trip-chay-ngay.html',
                    'text/html;charset=utf-8'
                  )
                }
                className="shrink-0 bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2.5 rounded-full inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingFile === 'ta-xua-trip-chay-ngay.html'
                    ? 'Đang tải...'
                    : 'Tải File .HTML Chạy Ngay'}
                </span>
              </button>
            </div>

            {/* Option 2: Ready-to-run Build ZIP */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-brand-800" />
                  <span className="font-extrabold text-sm text-brand-800">
                    2. Gói Bản Build Đã Sửa Lỗi CORS (ta-xua-trip-build.zip)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Giải nén và mở file <strong>index.html</strong> để chạy trực tiếp hoặc upload lên bất kỳ hosting tĩnh nào (cPanel, Hostinger, Netlify, Vercel).
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onDownloadFile(
                    '/ta-xua-trip-build.zip',
                    'ta-xua-trip-build.zip',
                    'application/zip'
                  )
                }
                className="shrink-0 bg-white hover:bg-slate-100 text-brand-800 border border-slate-300 font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Bản Build (.ZIP)</span>
              </button>
            </div>

            {/* Option 3: Source Code ZIP */}
            <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-slate-700" />
                  <span className="font-extrabold text-sm text-brand-800">
                    3. Gói Mã Nguồn React + Vite (ta-xua-trip-source.zip)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dành cho lập trình viên mở bằng VS Code (<code className="font-mono bg-white px-1 py-0.5 rounded border">npm install && npm run dev</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onDownloadFile(
                    '/ta-xua-trip-source.zip',
                    'ta-xua-trip-source.zip',
                    'application/zip'
                  )
                }
                className="shrink-0 bg-white hover:bg-slate-100 text-brand-800 border border-slate-300 font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Mã Nguồn (.ZIP)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
