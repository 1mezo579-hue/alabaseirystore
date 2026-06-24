'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench, ChevronRight, Plus, Search, Smartphone, Laptop, Monitor,
  Clock, X, Printer, RefreshCw, AlertCircle, CheckCircle2,
  PackageCheck, XCircle, ScanSearch, Edit3, ArrowRightLeft,
  Phone, User as UserIcon, Hash, FileText, DollarSign, CreditCard,
  Banknote, CalendarDays, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import LoadingScreen from '@/components/LoadingScreen';
import PageBackground from '@/components/PageBackground';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MaintenanceOrder {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  serialNo: string | null;
  problem: string;
  techNotes: string | null;
  status: string;
  cost: number;
  paid: number;
  remaining: number;
  createdAt: string;
  user?: { name: string };
}

interface Stats {
  total: number;
  pending: number;
  checking: number;
  repairing: number;
  completed: number;
  delivered: number;
  cancelled: number;
  revenue: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '', label: 'الكل', icon: null },
  { key: 'pending', label: 'في الانتظار', icon: Clock },
  { key: 'checking', label: 'تحت الفحص', icon: ScanSearch },
  { key: 'repairing', label: 'قيد الإصلاح', icon: Wrench },
  { key: 'completed', label: 'جاهز للتسليم', icon: CheckCircle2 },
  { key: 'delivered', label: 'تم التسليم', icon: PackageCheck },
  { key: 'cancelled', label: 'ملغي', icon: XCircle },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'في الانتظار',
  checking: 'تحت الفحص',
  repairing: 'قيد الإصلاح',
  completed: 'جاهز للتسليم',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const STATUS_CSS: Record<string, string> = {
  pending: 'status-pending',
  checking: 'status-checking',
  repairing: 'status-repairing',
  completed: 'status-completed',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

const DEVICE_TYPES = [
  { value: 'mobile', label: 'موبايل', icon: Smartphone },
  { value: 'laptop', label: 'لابتوب', icon: Laptop },
  { value: 'desktop', label: 'كمبيوتر', icon: Monitor },
  { value: 'other', label: 'أخرى', icon: Wrench },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function DeviceIcon({ type, size = 16 }: { type: string; size?: number }) {
  const map: Record<string, typeof Smartphone> = {
    mobile: Smartphone,
    laptop: Laptop,
    desktop: Monitor,
    other: Wrench,
  };
  const Icon = map[type] || Smartphone;
  return <Icon size={size} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatCurrency(n: number) {
  return n.toLocaleString('ar-EG') + ' ج.م';
}

// ─── Print Receipt ─────────────────────────────────────────────────────────────
function printReceipt(order: MaintenanceOrder) {
  const win = window.open('', '_blank', 'width=400,height=700');
  if (!win) return;
  win.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>وصل صيانة ${order.orderNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; background: #fff; color: #111; font-size: 13px; padding: 16px; max-width: 320px; margin: auto; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .heavy { font-weight: 900; }
    h1 { font-size: 20px; font-weight: 900; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #555; margin-bottom: 4px; }
    .divider { border-top: 1px dashed #aaa; margin: 10px 0; }
    .double-divider { border-top: 3px double #111; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
    .label { color: #555; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #f0f0f0; border: 1px solid #ccc; }
    .order-no { font-size: 22px; font-weight: 900; text-align: center; letter-spacing: 2px; padding: 8px; background: #f9f9f9; border: 2px solid #222; border-radius: 8px; margin: 8px 0; }
    .section-title { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #eee; }
    .cost-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; font-weight: 900; border-top: 2px solid #111; margin-top: 4px; }
    .remaining-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 700; color: #c00; }
    .terms { font-size: 10px; color: #666; line-height: 1.8; }
    .terms li { margin-bottom: 2px; }
    .footer { text-align: center; font-size: 10px; color: #999; margin-top: 12px; }
    .problem-box { background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; padding: 8px; font-size: 12px; line-height: 1.6; margin-bottom: 4px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="center">
    <h1>الأباصيري ستور</h1>
    <div class="sub">ALABASSIRY STORE</div>
    <div class="sub">بيع هواتف • إكسسوارات • صيانة متكاملة</div>
  </div>
  <div class="divider"></div>
  <div class="center sub bold">وصل استلام جهاز للصيانة</div>
  <div class="order-no">${order.orderNo}</div>
  <div class="row"><span class="label">تاريخ الاستلام:</span><span class="bold">${formatDate(order.createdAt)}</span></div>
  <div class="divider"></div>

  <div class="section-title">بيانات العميل</div>
  <div class="row"><span class="label">الاسم:</span><span class="bold">${order.customerName}</span></div>
  <div class="row"><span class="label">الهاتف:</span><span class="bold">${order.customerPhone}</span></div>
  <div class="divider"></div>

  <div class="section-title">بيانات الجهاز</div>
  <div class="row"><span class="label">النوع:</span><span class="bold">${DEVICE_TYPES.find(d => d.value === order.deviceType)?.label || order.deviceType}</span></div>
  <div class="row"><span class="label">الماركة:</span><span class="bold">${order.deviceBrand}</span></div>
  <div class="row"><span class="label">الموديل:</span><span class="bold">${order.deviceModel}</span></div>
  ${order.serialNo ? `<div class="row"><span class="label">الرقم التسلسلي:</span><span class="bold">${order.serialNo}</span></div>` : ''}
  <div class="divider"></div>

  <div class="section-title">وصف العطل</div>
  <div class="problem-box">${order.problem}</div>
  <div class="divider"></div>

  <div class="section-title">التكاليف</div>
  <div class="cost-row"><span>التكلفة المقدرة:</span><span class="bold">${formatCurrency(order.cost)}</span></div>
  <div class="cost-row"><span>المدفوع مقدماً:</span><span class="bold">${formatCurrency(order.paid)}</span></div>
  <div class="remaining-row"><span>المتبقي عند الاستلام:</span><span>${formatCurrency(order.remaining)}</span></div>
  <div class="divider"></div>

  <div class="section-title">شروط الصيانة</div>
  <ul class="terms">
    <li>• البيانات المحفوظة على الجهاز مسؤولية العميل بالكامل.</li>
    <li>• ضمان الإصلاح لمدة 3 أشهر على نفس العطل.</li>
    <li>• يُرجى استلام الجهاز خلال 90 يوماً من تاريخ الإشعار.</li>
    <li>• المحل غير مسؤول عن أي أعطال إضافية لم تُذكر عند الاستلام.</li>
    <li>• الأسعار قابلة للتعديل بعد الفحص الدقيق.</li>
  </ul>
  <div class="divider"></div>

  <div class="footer">
    شكراً لثقتكم في الأباصيري ستور<br/>
    نتمنى لكم تجربة ممتازة ✦
  </div>
  <script>window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`);
  win.document.close();
}

// ─── New Order Form State ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  deviceType: 'mobile',
  deviceBrand: '',
  deviceModel: '',
  serialNo: '',
  problem: '',
  cost: '',
  paid: '',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const { user, isChecked } = useRequireAuth(['admin', 'manager', 'cashier', 'technician']);
  const router = useRouter();

  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, checking: 0, repairing: 0, completed: 0, delivered: 0, cancelled: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

  // New order form
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  // Status change
  const [newStatus, setNewStatus] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    deviceBrand: '', deviceModel: '', serialNo: '', problem: '', cost: '', paid: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // ─── Fetch orders ─────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab) params.set('status', activeTab);
      if (search) params.set('query', search);
      const res = await fetch(`/api/maintenance?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders);
      setStats(data.stats);
    } catch (e: any) {
      toast.error(e.message || 'فشل في جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    if (isChecked && user) fetchOrders();
  }, [fetchOrders, isChecked, user]);

  // ─── Search debounce ──────────────────────────────────────────────────────
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v.trim()), 500);
  };

  // ─── Create new order ─────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.deviceModel || !form.problem || !form.cost) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost: Number(form.cost), paid: Number(form.paid) || 0, userId: user!.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`تم تسجيل طلب الصيانة ${data.orderNo} بنجاح ✅`);
      setShowNewModal(false);
      setForm(EMPTY_FORM);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || 'فشل في تسجيل الطلب');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Change status ────────────────────────────────────────────────────────
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, techNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم تحديث حالة الطلب ✅');
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || 'فشل في تحديث الحالة');
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── Edit order ───────────────────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          cost: Number(editForm.cost),
          paid: Number(editForm.paid) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم تحديث بيانات الطلب ✅');
      setShowEditModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || 'فشل في تحديث الطلب');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Open modals ──────────────────────────────────────────────────────────
  const openStatusModal = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTechNotes(order.techNotes || '');
    setShowStatusModal(true);
  };

  const openEditModal = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setEditForm({
      deviceBrand: order.deviceBrand,
      deviceModel: order.deviceModel,
      serialNo: order.serialNo || '',
      problem: order.problem,
      cost: String(order.cost),
      paid: String(order.paid),
    });
    setShowEditModal(true);
  };

  if (!isChecked || !user) return <LoadingScreen />;

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      {/* ─── Cyan glow accent ─── */}
      <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ─── Header ─── */}
        <header className="glass-header sticky top-0 z-20 no-print">
          <div className="flex items-center gap-3">
            <button id="back-home" onClick={() => router.push('/')} className="back-btn">
              <ChevronRight size={18} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #0d9488)' }}>
              <Wrench size={17} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-black text-base text-white leading-none">الصيانة الفنية</div>
              <div className="text-xs text-slate-500 font-semibold leading-none mt-0.5">إدارة طلبات الصيانة</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="back-btn" title="تحديث">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              id="new-order-btn"
              onClick={() => { setShowNewModal(true); setForm(EMPTY_FORM); }}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">طلب جديد</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {/* ─── Stat Cards ─── */}
          <div className="animate-fade-in grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Total */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">إجمالي الطلبات</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <FileText size={14} color="#a5b4fc" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">{stats.total}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">طلب صيانة مسجّل</div>
            </div>

            {/* Repairing */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">قيد الإصلاح</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <Wrench size={14} color="#c4b5fd" />
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: '#c4b5fd' }}>{stats.repairing + stats.checking}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">جهاز تحت العمل</div>
            </div>

            {/* Ready */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">جاهز للتسليم</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle2 size={14} color="#6ee7b7" />
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: '#6ee7b7' }}>{stats.completed}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">جهاز جاهز</div>
            </div>

            {/* Revenue */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">إجمالي الإيرادات</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Banknote size={14} color="#fcd34d" />
                </div>
              </div>
              <div className="text-xl font-black" style={{ color: '#fcd34d' }}>
                {stats.revenue.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">إجمالي المحصّل</div>
            </div>
          </div>

          {/* ─── Filters: Tabs + Search ─── */}
          <div className="animate-fade-in glass-card mb-5 p-0 overflow-hidden">
            {/* Status Tabs */}
            <div className="flex overflow-x-auto gap-0 border-b border-white/5 scrollbar-hide">
              {STATUS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    id={`tab-${tab.key || 'all'}`}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      color: isActive ? '#22d3ee' : '#475569',
                      borderBottom: isActive ? '2px solid #22d3ee' : '2px solid transparent',
                      background: isActive ? 'rgba(34,211,238,0.06)' : 'transparent',
                    }}
                  >
                    {Icon && <Icon size={13} />}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="search-orders"
                  type="text"
                  className="input-field pr-9"
                  placeholder="بحث بالاسم، الهاتف، الموديل..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ─── Orders List ─── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
              <p className="text-slate-500 font-semibold text-sm">جاري التحميل...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <Wrench size={28} color="#22d3ee" strokeWidth={1.5} />
              </div>
              <p className="text-slate-400 font-bold text-lg">لا توجد طلبات صيانة</p>
              <p className="text-slate-600 text-sm font-medium">اضغط "طلب جديد" لإضافة طلب صيانة</p>
            </div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={() => openStatusModal(order)}
                  onEdit={() => openEditModal(order)}
                  onPrint={() => printReceipt(order)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ─── New Order Modal ─── */}
      {showNewModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNewModal(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: 620 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #22d3ee, #0d9488)' }}>
                  <Plus size={18} color="white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">طلب صيانة جديد</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">تسجيل جهاز للصيانة</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="back-btn"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              {/* Customer info */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">بيانات العميل</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">اسم العميل *</label>
                    <input className="input-field" placeholder="محمد أحمد" value={form.customerName}
                      onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">رقم الهاتف *</label>
                    <input className="input-field" placeholder="01xxxxxxxxx" value={form.customerPhone}
                      onChange={(e) => setForm(f => ({ ...f, customerPhone: e.target.value }))} required />
                  </div>
                </div>
              </div>

              {/* Device info */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">بيانات الجهاز</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">نوع الجهاز *</label>
                    <select className="input-field" value={form.deviceType}
                      onChange={(e) => setForm(f => ({ ...f, deviceType: e.target.value }))}>
                      {DEVICE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">ماركة الجهاز *</label>
                    <input className="input-field" placeholder="Samsung / Apple / Huawei" value={form.deviceBrand}
                      onChange={(e) => setForm(f => ({ ...f, deviceBrand: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">موديل الجهاز *</label>
                    <input className="input-field" placeholder="Galaxy S24 / iPhone 15" value={form.deviceModel}
                      onChange={(e) => setForm(f => ({ ...f, deviceModel: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">الرقم التسلسلي (اختياري)</label>
                    <input className="input-field" placeholder="IMEI / S/N" value={form.serialNo}
                      onChange={(e) => setForm(f => ({ ...f, serialNo: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Problem */}
              <div>
                <label className="label">وصف العطل *</label>
                <textarea className="input-field" rows={3} placeholder="اشرح العطل بالتفصيل..." value={form.problem}
                  onChange={(e) => setForm(f => ({ ...f, problem: e.target.value }))} required
                  style={{ resize: 'vertical' }} />
              </div>

              {/* Costs */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">التكاليف</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">التكلفة المتوقعة (ج.م) *</label>
                    <input className="input-field" type="number" min="0" placeholder="0" value={form.cost}
                      onChange={(e) => setForm(f => ({ ...f, cost: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">المدفوع مقدماً (ج.م)</label>
                    <input className="input-field" type="number" min="0" placeholder="0" value={form.paid}
                      onChange={(e) => setForm(f => ({ ...f, paid: e.target.value }))} />
                  </div>
                </div>
                {(form.cost || form.paid) && (
                  <div className="mt-3 flex justify-between items-center px-3 py-2 rounded-lg text-sm font-bold"
                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <span className="text-slate-400">المتبقي:</span>
                    <span style={{ color: '#fda4af' }}>
                      {Math.max(0, (Number(form.cost) || 0) - (Number(form.paid) || 0)).toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="btn btn-ghost flex-1">إلغاء</button>
                <button type="submit" disabled={formLoading} className="btn btn-primary flex-1 gap-2">
                  {formLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Plus size={16} />}
                  {formLoading ? 'جاري الحفظ...' : 'حفظ الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Status Change Modal ─── */}
      {showStatusModal && selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowStatusModal(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: 480 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  <ArrowRightLeft size={17} color="white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">تغيير الحالة</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedOrder.orderNo} — {selectedOrder.customerName}</p>
                </div>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="back-btn"><X size={16} /></button>
            </div>

            <form onSubmit={handleStatusChange} className="flex flex-col gap-4">
              <div>
                <label className="label">الحالة الجديدة</label>
                <select className="input-field" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">ملاحظات الفني (اختياري)</label>
                <textarea className="input-field" rows={4} placeholder="سبب التأخر، قطع مطلوبة، ملاحظات إضافية..."
                  value={techNotes} onChange={(e) => setTechNotes(e.target.value)}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-ghost flex-1">إلغاء</button>
                <button type="submit" disabled={statusLoading} className="btn btn-primary flex-1 gap-2">
                  {statusLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <CheckCircle2 size={16} />}
                  {statusLoading ? 'جاري الحفظ...' : 'تأكيد التغيير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {showEditModal && selectedOrder && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: 560 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                  <Edit3 size={17} color="white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">تعديل الطلب</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedOrder.orderNo}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="back-btn"><X size={16} /></button>
            </div>

            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ماركة الجهاز</label>
                  <input className="input-field" value={editForm.deviceBrand}
                    onChange={(e) => setEditForm(f => ({ ...f, deviceBrand: e.target.value }))} />
                </div>
                <div>
                  <label className="label">موديل الجهاز</label>
                  <input className="input-field" value={editForm.deviceModel}
                    onChange={(e) => setEditForm(f => ({ ...f, deviceModel: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">الرقم التسلسلي</label>
                  <input className="input-field" value={editForm.serialNo}
                    onChange={(e) => setEditForm(f => ({ ...f, serialNo: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="label">وصف العطل</label>
                  <textarea className="input-field" rows={3} value={editForm.problem}
                    onChange={(e) => setEditForm(f => ({ ...f, problem: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className="label">التكلفة (ج.م)</label>
                  <input className="input-field" type="number" min="0" value={editForm.cost}
                    onChange={(e) => setEditForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
                <div>
                  <label className="label">المدفوع (ج.م)</label>
                  <input className="input-field" type="number" min="0" value={editForm.paid}
                    onChange={(e) => setEditForm(f => ({ ...f, paid: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-ghost flex-1">إلغاء</button>
                <button type="submit" disabled={editLoading} className="btn btn-success flex-1 gap-2">
                  {editLoading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <CheckCircle2 size={16} />}
                  {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Card Component ──────────────────────────────────────────────────────
function OrderCard({
  order,
  onStatusChange,
  onEdit,
  onPrint,
}: {
  order: MaintenanceOrder;
  onStatusChange: () => void;
  onEdit: () => void;
  onPrint: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card animate-fade-in flex flex-col gap-3 hover:border-white/20 transition-all"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* ── Row 1: Order No + Status ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="badge badge-violet font-mono text-sm">{order.orderNo}</span>
          <span className={`badge ${STATUS_CSS[order.status] || 'badge-zinc'}`}>
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
          <CalendarDays size={11} />
          {formatDate(order.createdAt)}
        </span>
      </div>

      {/* ── Row 2: Customer ── */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <UserIcon size={14} color="#a5b4fc" />
        </div>
        <div>
          <div className="font-black text-white text-sm leading-none">{order.customerName}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
            <Phone size={10} />
            {order.customerPhone}
          </div>
        </div>
      </div>

      {/* ── Row 3: Device ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.1)' }}>
        <div className="text-cyan-400 flex-shrink-0">
          <DeviceIcon type={order.deviceType} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-black text-white">
            {order.deviceBrand} {order.deviceModel}
          </span>
          {order.serialNo && (
            <span className="text-xs text-slate-500 font-semibold ml-2">S/N: {order.serialNo}</span>
          )}
        </div>
        <span className="text-xs text-slate-600 font-semibold flex-shrink-0">
          {DEVICE_TYPES.find(d => d.value === order.deviceType)?.label}
        </span>
      </div>

      {/* ── Problem (truncated) ── */}
      <div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-right flex items-start gap-2 group"
        >
          <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className={`text-sm text-slate-400 font-medium flex-1 ${expanded ? '' : 'line-clamp-2'}`}>
            {order.problem}
          </p>
          <ChevronDown size={14} className={`text-slate-600 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {order.techNotes && expanded && (
          <div className="mt-2 px-3 py-2 rounded-lg text-xs text-slate-400 font-medium"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <span className="font-black text-violet-400">ملاحظات الفني: </span>
            {order.techNotes}
          </div>
        )}
      </div>

      {/* ── Costs ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-xs text-slate-500 font-bold mb-1">التكلفة</span>
          <span className="text-sm font-black text-white">{formatCurrency(order.cost)}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <span className="text-xs text-slate-500 font-bold mb-1">المدفوع</span>
          <span className="text-sm font-black" style={{ color: '#6ee7b7' }}>{formatCurrency(order.paid)}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-xl"
          style={{ background: order.remaining > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${order.remaining > 0 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
          <span className="text-xs text-slate-500 font-bold mb-1">المتبقي</span>
          <span className="text-sm font-black" style={{ color: order.remaining > 0 ? '#fda4af' : '#94a3b8' }}>
            {formatCurrency(order.remaining)}
          </span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 pt-1">
        <button id={`print-${order.id}`} onClick={onPrint} className="btn btn-ghost btn-sm flex-shrink-0" title="طباعة وصل">
          <Printer size={14} />
        </button>
        <button id={`edit-${order.id}`} onClick={onEdit} className="btn btn-ghost btn-sm gap-1.5 flex-1">
          <Edit3 size={13} />
          تعديل
        </button>
        <button id={`status-${order.id}`} onClick={onStatusChange} className="btn btn-primary btn-sm gap-1.5 flex-1">
          <ArrowRightLeft size={13} />
          تغيير الحالة
        </button>
      </div>
    </div>
  );
}
