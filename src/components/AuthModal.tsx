import React, { useState } from 'react';
import { TurnstileWidget } from './TurnstileWidget';
import { TURNSTILE_SITE_KEY } from '../config/turnstile';
import {
  X,
  Shield,
  Home,
  User,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Building2
} from 'lucide-react';
import { UserRole } from '../types/index.ts';
import { AuthUser, DEMO_ACCOUNTS } from '../types/auth.ts';
import { validateLoginCredentials, validateRegisterForm } from '../utils/rules.ts';
import { accountApi, type AuthConfig } from '../api/accountApi.ts';
import { TERMS_VERSION } from '../server/accounts/rules.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'traveler',
  initialMode = 'login',
  onLoginSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  // R2: mã đặt lại do Tà Xùa Trip cấp qua điện thoại (khi chưa có email, hoặc tài khoản cũ chỉ có SĐT)
  const [codeFromAdmin, setCodeFromAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync initialRole and initialMode when reopened (Fix Audit 20 / N02.2)
  React.useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setMode(initialMode);
      setFormError(null);
      setSuccessNotice(null);
      void accountApi.config().then((r) => r.ok && setAuthConfig(r.data));
    }
  }, [isOpen, initialRole, initialMode]);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  // R1: quên mật khẩu (mã 6 số qua email)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileReset, setTurnstileReset] = useState(0);

  // Token Turnstile gắn với action (login/register) nên đổi chế độ thì bỏ token cũ.
  React.useEffect(() => {
    setTurnstileToken('');
  }, [mode]);

  // Register form states
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [facilityName, setFacilityName] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const isProduction = Boolean(import.meta.env.PROD);

  if (!isOpen) return null;

  const currentDemo = DEMO_ACCOUNTS[selectedRole];

  // Quick 1-click Demo Login with Real Server Session (N02.2)
  const handleQuickDemoLogin = async (role: UserRole) => {
    const demo = DEMO_ACCOUNTS[role];
    setFormError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demo.email, password: demo.password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }
      localStorage.setItem('taxua_session_token', data.token);
      setSuccessNotice(`Đăng nhập thành công với vai trò ${demo.roleLabel}!`);
      setTimeout(() => {
        onLoginSuccess({
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          roleName: data.user.role === 'admin' ? 'Quản trị viên' : data.user.role === 'partner' ? 'Chủ cơ sở' : 'Khách hàng',
          facilityName: data.user.businessName,
          partnerListingTitle: data.user.businessName,
          partnerListingId: data.user.ownedListingIds?.[0],
          ownedListingIds: data.user.ownedListingIds || [],
          avatar: data.user.avatarUrl || demo.user.avatar,
          createdAt: new Date().toISOString()
        });
        onClose();
      }, 400);
    } catch (err: any) {
      setFormError(String(err.message).replace(/^[A-Z_]+: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Submit standard login with Real Server Authentication (N02.2)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateLoginCredentials(identifier, password, selectedRole);
    if (!validation.isValid) {
      setFormError(validation.error || 'Thông tin đăng nhập không hợp lệ.');
      return;
    }

    if (!turnstileToken) {
      setFormError('Vui lòng hoàn tất bước xác minh chống bot bên dưới trước khi tiếp tục.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanIdentifier = identifier.trim();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
          turnstileToken: turnstileToken || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Email hoặc mật khẩu không chính xác.');
      }

      localStorage.setItem('taxua_session_token', data.token);
      setSuccessNotice('Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        onLoginSuccess({
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          roleName: data.user.role === 'admin' ? 'Quản trị viên' : data.user.role === 'partner' ? 'Chủ cơ sở' : 'Khách hàng',
          facilityName: data.user.businessName,
          partnerListingTitle: data.user.businessName,
          partnerListingId: data.user.ownedListingIds?.[0],
          ownedListingIds: data.user.ownedListingIds || [],
          avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          createdAt: new Date().toISOString()
        });
        onClose();
      }, 400);
    } catch (err: any) {
      setFormError(String(err.message).replace(/^[A-Z_]+: /, ''));
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Register with Real Server API (N02.2 - rejects self-appointed admin)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedRole === 'admin') {
      setFormError('Không được phép tự đăng ký tài khoản Quản trị viên.');
      return;
    }

    const validation = validateRegisterForm({
      fullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      confirmPassword: regConfirmPassword,
      role: selectedRole,
      facilityName,
      termsAccepted
    });

    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0];
      setFormError(firstErr);
      return;
    }

    if (!turnstileToken) {
      setFormError('Vui lòng hoàn tất bước xác minh chống bot bên dưới trước khi tiếp tục.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          phone: regPhone.trim() || undefined,
          termsAccepted,
          termsVersion: TERMS_VERSION,
          password: regPassword,
          fullName: fullName.trim(),
          role: selectedRole,
          facilityName: facilityName.trim(),
          turnstileToken: turnstileToken || undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng ký không thành công.');
      }

      localStorage.setItem('taxua_session_token', data.token);
      setSuccessNotice(
        data.emailVerificationSent
          ? 'Đăng ký thành công! Đã gửi mã xác minh đến email; bạn nhập mã trong mục Tài khoản của tôi.'
          : 'Đăng ký tài khoản thành công! Tự động đăng nhập...'
      );
      setTimeout(() => {
        onLoginSuccess({
          id: data.user.id,
          name: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          roleName: data.user.role === 'admin' ? 'Quản trị viên' : data.user.role === 'partner' ? 'Chủ cơ sở' : 'Khách hàng',
          facilityName: data.user.businessName,
          partnerListingTitle: data.user.businessName,
          partnerListingId: data.user.ownedListingIds?.[0],
          ownedListingIds: data.user.ownedListingIds || [],
          avatar: data.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          createdAt: new Date().toISOString()
        });
        onClose();
      }, data.emailVerificationSent ? 1800 : 450);
    } catch (err: any) {
      setFormError(String(err.message).replace(/^[A-Z_]+: /, ''));
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
    } finally {
      setIsLoading(false);
    }
  };

  // R1: quên mật khẩu — bước 1 gửi mã về email, bước 2 nhập mã + mật khẩu mới
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);
    if (forgotStep === 'email') {
      if (authConfig?.emailEnabled && !turnstileToken) {
        setFormError('Vui lòng hoàn tất bước xác minh chống bot bên dưới trước khi tiếp tục.');
        return;
      }
      setIsLoading(true);
      const r = await accountApi.forgot(forgotEmail.trim(), turnstileToken || undefined);
      setIsLoading(false);
      setTurnstileToken('');
      setTurnstileReset((n) => n + 1);
      if (!r.ok) return setFormError(r.message);
      setSuccessNotice(r.data.message);
      setForgotStep('code');
      return;
    }
    setIsLoading(true);
    const r = await accountApi.reset(forgotEmail.trim(), forgotCode.trim(), forgotNewPassword);
    setIsLoading(false);
    if (!r.ok) return setFormError(r.message);
    setSuccessNotice(r.data.message);
    setIdentifier(forgotEmail.trim());
    setPassword('');
    setForgotCode('');
    setForgotNewPassword('');
    setForgotStep('email');
    setCodeFromAdmin(false);
    setMode('login');
  };

  const getRoleTheme = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          icon: Shield,
          badgeText: 'Quản Trị Viên',
          activeBg: 'bg-rose-900 text-white border-rose-700 shadow-md',
          colorAccent: 'text-rose-700',
          gradientBg: 'from-slate-900 via-rose-950 to-slate-900',
          buttonBg: 'bg-rose-700 hover:bg-rose-800'
        };
      case 'partner':
        return {
          icon: Home,
          badgeText: 'Chủ Cơ Sở',
          activeBg: 'bg-amber-800 text-white border-amber-600 shadow-md',
          colorAccent: 'text-amber-800',
          gradientBg: 'from-slate-900 via-amber-950 to-brand-800',
          buttonBg: 'bg-amber-700 hover:bg-amber-800'
        };
      case 'traveler':
      default:
        return {
          icon: User,
          badgeText: 'Khách Hàng',
          activeBg: 'bg-brand-800 text-white border-teal-500 shadow-md',
          colorAccent: 'text-teal-700',
          gradientBg: 'from-brand-800 via-[#0b4382] to-teal-900',
          buttonBg: 'bg-brand-800 hover:bg-brand-700'
        };
    }
  };

  const currentTheme = getRoleTheme(selectedRole);
  const CurrentIcon = currentTheme.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200/90 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar with Atmospheric Gradient */}
        <div className={`p-5 sm:p-6 text-white bg-gradient-to-r ${currentTheme.gradientBg} relative overflow-hidden`}>
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <CurrentIcon className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-1">
                  <span>{currentTheme.badgeText}</span>
                </div>
                <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Đăng Nhập & Phân Quyền
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ đăng nhập"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-200 mt-2.5 relative z-10 leading-relaxed">
            Hệ thống quản trị và đặt phòng minh bạch Tà Xùa. Vui lòng chọn vai trò để đăng nhập với đúng quyền hạn.
          </p>
        </div>

        {/* 3-Role Switcher Tabs */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: 'traveler' as UserRole, label: 'Khách hàng', icon: User },
              { id: 'partner' as UserRole, label: 'Chủ cơ sở', icon: Home },
              { id: 'admin' as UserRole, label: 'Quản trị viên', icon: Shield }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(tab.id);
                    setFormError(null);
                    setSuccessNotice(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? tab.id === 'admin'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : tab.id === 'partner'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-brand-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thẻ tài khoản mẫu: chỉ hiện khi chạy dev; production không có các tài khoản này và đăng nhập cần Turnstile */}
        {!isProduction && (
          <div className="p-4 sm:p-5 pt-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Tài khoản mẫu: {currentDemo.roleLabel}</span>
                </div>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  Sẵn sàng đăng nhập
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                {currentDemo.roleDescription}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {currentDemo.badges.map((b, idx) => (
                  <span key={idx} className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    ✓ {b}
                  </span>
                ))}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-3 text-xs">
                <div className="min-w-0">
                  <span className="text-xs text-slate-600 font-extrabold uppercase block">Email đăng nhập:</span>
                  <span className="font-mono text-slate-800 font-semibold truncate block">{currentDemo.email}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-600 font-extrabold uppercase block">Mật khẩu:</span>
                  <span className="font-mono text-slate-800 font-semibold">{currentDemo.password}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(selectedRole)}
                className={`w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer ${currentTheme.buttonBg}`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Đăng nhập 1-chạm với tài khoản mẫu {currentTheme.badgeText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-5 pt-0">

          {/* Mode Switcher: Login vs Register */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                }}
                className={`text-xs sm:text-sm font-extrabold pb-1 border-b-2 cursor-pointer transition-colors ${
                  mode === 'login'
                    ? 'text-brand-800 border-brand-800'
                    : 'text-slate-600 hover:text-slate-800 border-transparent'
                }`}
              >
                Đăng nhập thủ công
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                }}
                className={`text-xs sm:text-sm font-extrabold pb-1 border-b-2 cursor-pointer transition-colors ${
                  mode === 'register'
                    ? 'text-brand-800 border-brand-800'
                    : 'text-slate-600 hover:text-slate-800 border-transparent'
                }`}
              >
                Tạo tài khoản mới
              </button>
            </div>

            <span className="text-xs text-slate-600 hidden sm:inline">
              Vai trò: <strong className="text-slate-700">{currentTheme.badgeText}</strong>
            </span>
          </div>

          {/* Error & Success Messages */}
          {formError && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-3.5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* R1: Quên mật khẩu */}
          {mode === 'forgot' ? (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <p className="text-sm font-extrabold text-brand-800">Lấy lại mật khẩu</p>
              {authConfig && !authConfig.emailEnabled && !codeFromAdmin ? (
                <>
                  <p className="text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Đặt lại mật khẩu qua email sẽ hoạt động sau khi Tà Xùa Trip bật dịch vụ email (sắp ra mắt). Hiện tại vui lòng liên hệ Tà Xùa Trip: sau khi xác nhận bạn là chủ tài khoản, chúng tôi sẽ đọc cho bạn một mã 6 số.
                  </p>
                  <button type="button" onClick={() => { setCodeFromAdmin(true); setForgotStep('code'); setFormError(null); }} className={`w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs cursor-pointer ${currentTheme.buttonBg}`}>
                    Tôi đã có mã từ Tà Xùa Trip
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1">{codeFromAdmin ? 'Email hoặc số điện thoại đã đăng ký:' : 'Email đã đăng ký:'}</label>
                    <input
                      id="forgot-email"
                      type={codeFromAdmin ? 'text' : 'email'}
                      autoComplete={codeFromAdmin ? 'username' : 'email'}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotStep === 'code' && !codeFromAdmin}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl disabled:bg-slate-50"
                      required
                    />
                  </div>
                  {forgotStep === 'code' ? (
                    <>
                      <div>
                        <label htmlFor="forgot-code" className="block text-xs font-bold text-slate-700 mb-1">{codeFromAdmin ? 'Mã 6 số Tà Xùa Trip cung cấp:' : 'Mã 6 số trong email:'}</label>
                        <input
                          id="forgot-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 text-sm tracking-[0.4em] font-bold border border-slate-200 rounded-xl"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="forgot-new" className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới (tối thiểu 8 ký tự):</label>
                        <input
                          id="forgot-new"
                          type="password"
                          autoComplete="new-password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} action="forgot" onToken={setTurnstileToken} resetSignal={turnstileReset} />
                  )}
                  <button type="submit" disabled={isLoading} className={`w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs cursor-pointer disabled:opacity-60 ${currentTheme.buttonBg}`}>
                    {forgotStep === 'email' ? 'Gửi mã về email' : 'Đặt mật khẩu mới'}
                  </button>
                  {forgotStep === 'code' && !codeFromAdmin && (
                    <button type="button" onClick={() => { setForgotStep('email'); setSuccessNotice(null); }} className="w-full text-xs text-slate-600 hover:text-brand-800 cursor-pointer">
                      Chưa nhận được mã? Gửi lại
                    </button>
                  )}
                  {forgotStep === 'email' && (
                    <button type="button" onClick={() => { setCodeFromAdmin(true); setForgotStep('code'); setFormError(null); }} className="w-full text-xs text-slate-600 hover:text-brand-800 cursor-pointer">
                      Tôi đã có mã từ Tà Xùa Trip
                    </button>
                  )}
                </>
              )}
              <button type="button" onClick={() => { setMode('login'); setFormError(null); setCodeFromAdmin(false); setForgotStep('email'); }} className="w-full text-xs font-bold text-brand-800 cursor-pointer">
                ← Quay lại đăng nhập
              </button>
            </form>
          ) : mode === 'login' ? (

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email hoặc Số điện thoại:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'admin'
                        ? 'admin@taxuatrip.vn'
                        : selectedRole === 'partner'
                        ? 'chuhome.may@taxuatrip.vn hoặc SĐT'
                        : 'khachhang@gmail.com hoặc SĐT'
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu:</label>
                  {!isProduction && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier(currentDemo.email);
                        setPassword(currentDemo.password);
                      }}
                      className="text-xs text-teal-700 hover:underline cursor-pointer"
                    >
                      Điền nhanh tài khoản mẫu
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-9 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-brand-800 focus:ring-0"
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep('email');
                    setForgotEmail(identifier.includes('@') ? identifier.trim() : '');
                    setFormError(null);
                    setSuccessNotice(null);
                  }}
                  className="text-slate-600 hover:text-brand-800 text-xs font-semibold cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                action="login"
                onToken={setTurnstileToken}
                resetSignal={turnstileReset}
              />

              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-md transition-all cursor-pointer ${currentTheme.buttonBg}`}
              >
                Đăng Nhập Với Tư Cách {currentTheme.badgeText}
              </button>
            </form>
          ) : (
            /* Form Content: Register */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên của bạn:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Vàng A Tủa / Nguyễn Thùy Linh"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email (dùng để đăng nhập và lấy lại mật khẩu):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ban@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại{selectedRole === 'partner' ? ' (bắt buộc, Tà Xùa Trip gọi xác minh):' : ' (không bắt buộc):'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required={selectedRole === 'partner'}
                  />
                </div>
              </div>

              {selectedRole === 'partner' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Homestay hoặc Dịch vụ bạn phụ trách:
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      placeholder="Ví dụ: A Lầu Homestay / Xe ghép Bắc Yên - Tà Xùa"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu:
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận mật khẩu:
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-800/20 focus:border-brand-800"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  Tôi đã đọc và đồng ý{' '}
                  <a href="/dieu-khoan" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-800 underline">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="/chinh-sach-du-lieu" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-800 underline">
                    Chính sách dữ liệu cá nhân
                  </a>
                  .
                </span>
              </label>

              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                action="register"
                onToken={setTurnstileToken}
                resetSignal={turnstileReset}
              />

              <button
                type="submit"
                className={`w-full py-2.5 px-4 rounded-xl text-white font-extrabold text-xs shadow-md transition-all cursor-pointer mt-2 ${currentTheme.buttonBg}`}
              >
                Tạo Tài Khoản & Đăng Nhập Ngay
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
