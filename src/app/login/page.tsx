'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Eye, EyeOff, LogIn, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/hooks/useAuthStore';
import PageBackground from '@/components/PageBackground';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn, loadFromStorage, isChecked } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load auth state on mount, redirect if already logged in
  useEffect(() => {
    loadFromStorage();
    // Silently initialize database in the background
    fetch('/api/init-db').catch((e) => console.error("Database initialization failed:", e));
  }, []);

  useEffect(() => {
    if (isChecked && isLoggedIn) {
      router.replace('/');
    }
  }, [isChecked, isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'بيانات الدخول غير صحيحة');
        return;
      }
      login(data.user);
      toast.success(`أهلاً ${data.user.name} 👋`);
      router.replace('/');
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden" dir="rtl">
      <PageBackground />

      {/* ─── Left Panel – Branding (hidden on mobile) ─── */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative z-10 p-12">
        {/* Decorative glow blobs */}
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative flex flex-col items-center gap-8 animate-fade-in">
          {/* Store logo */}
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl relative"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)' }}>
            <Smartphone size={56} color="white" strokeWidth={1.5} />
            {/* Ping effect */}
            <div className="absolute inset-0 rounded-3xl opacity-40 animate-ping"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', animationDuration: '2.5s' }} />
          </div>

          {/* Store name */}
          <div className="text-center">
            <h1 className="text-5xl font-black mb-3 gradient-text">الأباصيري ستور</h1>
            <p className="text-slate-400 text-lg font-medium tracking-wide">
              بيع هواتف • إكسسوارات • صيانة متكاملة
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
            {[
              { icon: '📱', label: 'إدارة مبيعات الهواتف' },
              { icon: '🔧', label: 'نظام صيانة متكامل' },
              { icon: '📦', label: 'تتبع المخزون في الوقت الفعلي' },
              { icon: '📊', label: 'تقارير وتحليلات ذكية' },
            ].map((f) => (
              <div key={f.label}
                className="flex items-center gap-3 px-5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">{f.icon}</span>
                <span className="text-slate-300 font-semibold text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div className="hidden lg:block w-px my-12 relative z-10"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }} />

      {/* ─── Right Panel – Login Form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo (only on small screens) */}
          <div className="flex lg:hidden flex-col items-center mb-8 gap-3">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Smartphone size={36} color="white" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black gradient-text">الأباصيري ستور</h1>
          </div>

          {/* Card */}
          <div className="glass-card p-8 shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-1">تسجيل الدخول</h2>
              <p className="text-slate-400 text-sm font-medium">مرحباً بك، يرجى إدخال بيانات حسابك</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Username */}
              <div>
                <label className="label">اسم المستخدم</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    className="input-field pr-10"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-10 pl-10"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs text-slate-500 font-semibold"
                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <span>💡</span>
                <span>البيانات الافتراضية: admin / 123456</span>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full mt-2 gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>جاري الدخول...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs font-medium mt-6">
            الأباصيري ستور — ALABASSIRY STORE © 2025
          </p>
        </div>
      </div>
    </div>
  );
}
