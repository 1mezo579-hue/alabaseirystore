"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Truck, Search, Plus, Edit2, ArrowRight, X,
  BadgeAlert, Phone, ShieldCheck, FileText, Check
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface Trader {
  id: number;
  name: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  balance: number; // positive = we owe them, negative = they owe us
  notes: string | null;
}

interface TraderInvoice {
  id: number;
  invoiceNo: string;
  total: number;
  paid: number;
  remaining: number;
  status: string;
  createdAt: string;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

export default function TradersPage() {
  const { user, isChecked } = useRequireAuth();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);

  // Form states (Trader details)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [notes, setNotes] = useState("");

  // Trader Invoice Form states
  const [invoiceNo, setInvoiceNo] = useState("");
  const [total, setTotal] = useState("");
  const [paid, setPaid] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/traders");
      const data = await res.json();
      if (Array.isArray(data)) setTraders(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل بيانات الموردين");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTrader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("يرجى إدخال اسم المورد");
      return;
    }

    try {
      const url = editingTrader ? `/api/traders/${editingTrader.id}` : "/api/traders";
      const method = editingTrader ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone || null,
          company: company || null,
          address: address || null,
          balance: Number(balance) || 0,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingTrader ? "تم تحديث بيانات المورد" : "تم تسجيل المورد بنجاح");
      setShowAddModal(false);
      setEditingTrader(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل المورد");
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrader || !invoiceNo || !total) {
      toast.error("يرجى إدخال رقم الفاتورة وإجمالي المبلغ");
      return;
    }

    try {
      const remaining = Math.max(0, Number(total) - (Number(paid) || 0));
      const res = await fetch(`/api/traders/${selectedTrader.id}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          total: Number(total),
          paid: Number(paid) || 0,
          remaining,
          status: remaining === 0 ? "paid" : (Number(paid) > 0 ? "partial" : "pending"),
          notes: invoiceNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("تم تسجيل الفاتورة للمورد وتحديث حسابه");
      setShowInvoiceModal(false);
      setSelectedTrader(null);
      resetInvoiceForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل فاتورة الشراء");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setCompany("");
    setAddress("");
    setBalance("0");
    setNotes("");
  };

  const resetInvoiceForm = () => {
    setInvoiceNo("");
    setTotal("");
    setPaid("");
    setInvoiceNotes("");
  };

  const startEdit = (t: Trader) => {
    setEditingTrader(t);
    setName(t.name);
    setPhone(t.phone || "");
    setCompany(t.company || "");
    setAddress(t.address || "");
    setBalance(String(t.balance));
    setNotes(t.notes || "");
    setShowAddModal(true);
  };

  const startInvoice = (t: Trader) => {
    setSelectedTrader(t);
    setInvoiceNo(`TR-${Date.now().toString().slice(-6)}`);
    setShowInvoiceModal(true);
  };

  if (!isChecked) return <LoadingScreen />;

  const filteredTraders = traders.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.company && t.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSupplierDebts = traders.reduce((acc, t) => acc + (t.balance > 0 ? t.balance : 0), 0);

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #71717a, #3f3f46)" }}>
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">الموردون والشركات</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div>
            <button onClick={() => { setEditingTrader(null); resetForm(); setShowAddModal(true); }} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> مورد جديد
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="label">إجمالي الموردين والشركات</span>
              <p className="text-2xl font-black text-white">{traders.length}</p>
            </div>
            <div className="stat-card">
              <span className="label">إجمالي الديون للموردين (حسابنا)</span>
              <p className="text-2xl font-black text-rose-400">{fmt(totalSupplierDebts)}</p>
            </div>
            <div className="stat-card">
              <span className="label">موردون لهم مستحقات</span>
              <p className="text-2xl font-black text-amber-400">
                {traders.filter(t => t.balance > 0).length} <span className="text-sm font-bold text-slate-500">موردين</span>
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-card">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input-field pr-10"
                placeholder="ابحث بالاسم أو الشركة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Traders list */}
          <div className="glass-card overflow-x-auto p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المورد / الشركة</th>
                  <th>رقم الهاتف</th>
                  <th>العنوان</th>
                  <th>الحساب المالي</th>
                  <th>ملاحظات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraders.map(t => (
                  <tr key={t.id} className="animate-fade-in">
                    <td>
                      <div>
                        <p className="font-bold text-slate-200">{t.name}</p>
                        {t.company && <p className="text-xs text-cyan-400 font-bold">{t.company}</p>}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{t.phone || "—"}</td>
                    <td className="text-slate-400">{t.address || "—"}</td>
                    <td>
                      {t.balance > 0 ? (
                        <span className="text-rose-400 font-black">نطالبه بـ: {fmt(t.balance)}</span>
                      ) : t.balance < 0 ? (
                        <span className="text-emerald-400 font-black">يطالبنا بـ: {fmt(Math.abs(t.balance))}</span>
                      ) : (
                        <span className="text-slate-500 font-bold">خالص</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500">{t.notes || "—"}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startInvoice(t)} className="btn btn-ghost btn-sm text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/10">
                          <FileText className="w-3.5 h-3.5" /> فاتورة شراء
                        </button>
                        <button onClick={() => startEdit(t)} className="p-2 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTraders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">لا يوجد موردون مطابقتهم للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Trader Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveTrader} className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-black text-slate-100">{editingTrader ? "تعديل بيانات المورد" : "إضافة مورد جديد"}</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">اسم المورد الكامل *</label>
                <input className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: شركة النيل للتوزيع" />
              </div>

              <div>
                <label className="label">اسم الشركة / المصنع</label>
                <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="مثال: شركة آبل مصر" />
              </div>

              <div>
                <label className="label">رقم الهاتف</label>
                <input className="input-field font-mono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>

              <div>
                <label className="label">العنوان</label>
                <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="المدينة، الشارع" />
              </div>

              <div>
                <label className="label">المديونية الافتتاحية للمورد (إن وجد)</label>
                <input type="number" className="input-field" value={balance} onChange={e => setBalance(e.target.value)} placeholder="المبلغ الذي نطالب به المورد" />
              </div>

              <div>
                <label className="label">ملاحظات</label>
                <textarea className="input-field h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="تفاصيل إضافية حول المورد..." />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">إلغاء</button>
              <button type="submit" className="btn btn-primary">حفظ المورد</button>
            </div>
          </form>
        </div>
      )}

      {/* Trader Invoice Modal */}
      {showInvoiceModal && selectedTrader && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveInvoice} className="modal-content max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-base font-black text-slate-100">تسجيل فاتورة شراء بضاعة</h3>
              <button type="button" onClick={() => { setShowInvoiceModal(false); setSelectedTrader(null); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-400 font-bold">المورد الحالي:</p>
                <p className="text-sm font-black text-slate-200">{selectedTrader.name}</p>
                {selectedTrader.company && <p className="text-xs text-cyan-400 font-bold">{selectedTrader.company}</p>}
              </div>

              <div>
                <label className="label">رقم الفاتورة *</label>
                <input className="input-field font-mono" required value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
              </div>

              <div>
                <label className="label">إجمالي قيمة الفاتورة *</label>
                <input type="number" step="0.01" className="input-field text-left" required value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" />
              </div>

              <div>
                <label className="label">المبلغ المدفوع</label>
                <input type="number" step="0.01" className="input-field text-left" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0.00" />
              </div>

              <div>
                <label className="label">ملاحظات الفاتورة</label>
                <input className="input-field" value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="مثل: كرتونة سكرينات وشواحن" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => { setShowInvoiceModal(false); setSelectedTrader(null); }} className="btn btn-ghost btn-sm">إلغاء</button>
              <button type="submit" className="btn btn-primary btn-sm">تسجيل الفاتورة</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
