'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import LoadingScreen from '@/components/LoadingScreen';
import PageBackground from '@/components/PageBackground';
import {
  ShoppingCart, Wrench, Package, BarChart3, Users,
  Truck, Wallet, Settings, LogOut, Smartphone, ChevronLeft,
  Sun, Moon,
} from 'lucide-react';

// ─── Module definitions ────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'cashier',
    title: 'كاشير البيع',
    desc: 'نقطة بيع متكاملة لتسجيل الفواتير والمدفوعات',
    icon: ShoppingCart,
    gradient: 'from-violet-500 to-indigo-600',
    glow: 'rgba(99,102,241,0.3)',
    href: '/cashier',
    roles: ['admin', 'manager', 'cashier'],
  },
  {
    id: 'maintenance',
    title: 'الصيانة الفنية',
    desc: 'إدارة طلبات الصيانة وتتبع الأجهزة والحالات',
    icon: Wrench,
    gradient: 'from-cyan-400 to-teal-600',
    glow: 'rgba(34,211,238,0.25)',
    href: '/maintenance',
    roles: ['admin', 'manager', 'cashier', 'technician'],
  },
  {
    id: 'inventory',
    title: 'المخزن',
    desc: 'تتبع المخزون وإدارة المنتجات والكميات',
    icon: Package,
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
    href: '/inventory',
    roles: ['admin', 'manager'],
  },
  {
    id: 'reports',
    title: 'التقارير',
    desc: 'تحليلات مفصّلة وتقارير المبيعات والأرباح',
    icon: BarChart3,
    gradient: 'from-amber-400 to-orange-500',
    glow: 'rgba(245,158,11,0.25)',
    href: '/reports',
    roles: ['admin', 'manager'],
  },
  {
    id: 'customers',
    title: 'العملاء',
    desc: 'إدارة بيانات العملاء وسجل المشتريات والنقاط',
    icon: Users,
    gradient: 'from-cyan-400 to-blue-600',
    glow: 'rgba(34,211,238,0.2)',
    href: '/customers',
    roles: ['admin', 'manager'],
  },
  {
    id: 'traders',
    title: 'الموردون',
    desc: 'إدارة الموردين والمشتريات والديون',
    icon: Truck,
    gradient: 'from-zinc-500 to-zinc-700',
    glow: 'rgba(113,113,122,0.2)',
    href: '/traders',
    roles: ['admin', 'manager'],
  },
  {
    id: 'expenses',
    title: 'المصروفات',
    desc: 'تتبع مصروفات المحل والنفقات اليومية',
    icon: Wallet,
    gradient: 'from-red-500 to-rose-600',
    glow: 'rgba(244,63,94,0.25)',
    href: '/expenses',
    roles: ['admin', 'manager'],
  },
  {
    id: 'users',
    title: 'الإعدادات',
    desc: 'إدارة المستخدمين والصلاحيات وإعدادات النظام',
    icon: Settings,
    gradient: 'from-purple-500 to-violet-600',
    glow: 'rgba(139,92,246,0.25)',
    href: '/users',
    roles: ['admin'],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  cashier: 'كاشير',
  technician: 'فني صيانة',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-violet',
  manager: 'badge-cyan',
  cashier: 'badge-emerald',
  technician: 'badge-amber',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '☀️ صباح الخير';
  if (h >= 12 && h < 18) return '🌤️ مساء الخير';
  return '🌙 مساء النور';
}

export default function Dashboard() {
  const { user, isChecked } = useRequireAuth();
  const { logout } = useAuthStore();
  const router = useRouter();

  if (!isChecked || !user) return <LoadingScreen />;

  const visibleModules = MODULES.filter((m) => m.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ─── Header ─── */}
        <header className="glass-header sticky top-0 z-20 no-print">
          {/* Right: logo + store name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Smartphone size={18} color="white" strokeWidth={2} />
            </div>
            <div>
              <div className="font-black text-base leading-none gradient-text">الأباصيري ستور</div>
              <div className="text-xs text-slate-500 font-semibold leading-none mt-0.5">ALABASSIRY STORE</div>
            </div>
          </div>

          {/* Left: user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-white leading-none">{user.name}</span>
              <span className={`badge ${ROLE_BADGE[user.role] || 'badge-zinc'} mt-1`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}>
              {user.name.charAt(0)}
            </div>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm gap-2"
              title="تسجيل الخروج"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Greeting */}
          <div className="animate-fade-in mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-1">
              {getGreeting()}، <span className="gradient-text">{user.name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-400 font-medium">
              مرحباً بك في نظام إدارة الأباصيري ستور
            </p>
          </div>

          {/* Module Bento Grid */}
          <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleModules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  id={`module-${mod.id}`}
                  onClick={() => router.push(mod.href)}
                  className="bento-tile text-right group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                      style={{ boxShadow: `0 8px 24px ${mod.glow}` }}>
                      <Icon size={22} color="white" strokeWidth={2} />
                    </div>
                    <ChevronLeft size={18} className="text-slate-600 group-hover:text-slate-400 group-hover:-translate-x-1 transition-all" />
                  </div>

                  {/* Title + desc */}
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight mb-1">{mod.title}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed">{mod.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </main>

        {/* ─── Footer ─── */}
        <footer className="py-6 text-center text-slate-600 text-xs font-semibold no-print">
          الأباصيري ستور - ALABASSIRY STORE © 2025
        </footer>
      </div>
    </div>
  );
}
