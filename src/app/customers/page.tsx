"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Users, Search, Plus, Edit2, ArrowRight, UserPlus,
  Coins, Wallet, X, UserCheck, ShieldAlert
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  points: number;
  totalSpent: number;
  balance: number;
  notes: string | null;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

export default function CustomersPage() {
  const { user, isChecked } = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [points, setPoints] = useState("0");
  const [balance, setBalance] = useState("0");

  // Payment states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل بيانات العملاء");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("الاسم ورقم الهاتف مطلوبين");
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address: address || null,
          points: Number(points) || 0,
          balance: Number(balance) || 0,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingCustomer ? "تم تحديث بيانات العميل" : "تم تسجيل العميل الجديد بنجاح");
      setShowAddModal(false);
      setEditingCustomer(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ العميل");
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || !paymentAmount) return;

    try {
      // Deduct from customer credit balance
      const newBalance = Math.max(0, selectedCustomerForPayment.balance - Number(paymentAmount));
      
      const res = await fetch(`/api/customers/${selectedCustomerForPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedCustomerForPayment.name,
          phone: selectedCustomerForPayment.phone,
          balance: newBalance,
          points: selectedCustomerForPayment.points,
          address: selectedCustomerForPayment.address,
          notes: `تم سداد مبلغ ${paymentAmount} ج. ${paymentNotes || ""}`,
        }),
      });

      // Also record payment in expenses/receipts as revenue or cash transaction if needed,
      // but simply updating the balance here is the main transaction.
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("تم تسجيل السداد وتحديث المديونية");
      setShowPayModal(false);
      setSelectedCustomerForPayment(null);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل معالجة الدفعة");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setPoints("0");
    setBalance("0");
    setNotes("");
  };

  const startEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || "");
    setPoints(String(c.points));
    setBalance(String(c.balance));
    setNotes(c.notes || "");
    setShowAddModal(true);
  };

  const startPayment = (c: Customer) => {
    setSelectedCustomerForPayment(c);
    setPaymentAmount(String(c.balance));
    setShowPayModal(true);
  };

  if (!isChecked) return <LoadingScreen />;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const totalOutstandingCredit = customers.reduce((acc, c) => acc + c.balance, 0);

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22d3ee, #0284c7)" }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">إدارة العملاء</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div>
            <button onClick={() => { setEditingCustomer(null); resetForm(); setShowAddModal(true); }} className="btn btn-primary btn-sm">
              <UserPlus className="w-4 h-4" /> عميل جديد
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="label">إجمالي العملاء المسجلين</span>
              <p className="text-2xl font-black text-white">{customers.length}</p>
            </div>
            <div className="stat-card">
              <span className="label">إجمالي المديونيات المعلقة (الآجل)</span>
              <p className="text-2xl font-black text-rose-400">{fmt(totalOutstandingCredit)}</p>
            </div>
            <div className="stat-card">
              <span className="label">نقاط الولاء الموزعة</span>
              <p className="text-2xl font-black text-amber-400">
                {customers.reduce((acc, c) => acc + c.points, 0)} <span className="text-sm font-bold text-slate-500">نقطة</span>
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-card">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input-field pr-10"
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Customers list */}
          <div className="glass-card overflow-x-auto p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>رقم الهاتف</th>
                  <th>العنوان</th>
                  <th>النقاط</th>
                  <th>المديونية</th>
                  <th>إجمالي المشتريات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="animate-fade-in">
                    <td>
                      <div>
                        <p className="font-bold text-slate-200">{c.name}</p>
                        {c.notes && <p className="text-xs text-slate-500 font-medium">{c.notes}</p>}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{c.phone}</td>
                    <td className="text-slate-400">{c.address || "—"}</td>
                    <td className="text-amber-400 font-bold">{c.points} نقطة</td>
                    <td>
                      {c.balance > 0 ? (
                        <span className="text-rose-400 font-black">{fmt(c.balance)}</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">لا يوجد</span>
                      )}
                    </td>
                    <td className="text-slate-300 font-semibold">{fmt(c.totalSpent)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {c.balance > 0 && (
                          <button onClick={() => startPayment(c)} className="btn btn-ghost btn-sm text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10">
                            <Wallet className="w-3.5 h-3.5" /> سداد
                          </button>
                        )}
                        <button onClick={() => startEdit(c)} className="p-2 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 font-bold">لا يوجد عملاء مطابقتهم للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveCustomer} className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-black text-slate-100">{editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">اسم العميل *</label>
                <input className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل للعميل" />
              </div>

              <div>
                <label className="label">رقم الهاتف *</label>
                <input className="input-field font-mono" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
              </div>

              <div>
                <label className="label">العنوان</label>
                <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="المدينة، الشارع" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">نقاط الولاء الافتتاحية</label>
                  <input type="number" className="input-field" value={points} onChange={e => setPoints(e.target.value)} />
                </div>
                <div>
                  <label className="label">المديونية الافتتاحية (الآجل)</label>
                  <input type="number" className="input-field" value={balance} onChange={e => setBalance(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">ملاحظات</label>
                <textarea className="input-field h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات حول العميل..." />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">إلغاء</button>
              <button type="submit" className="btn btn-primary">حفظ العميل</button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedCustomerForPayment && (
        <div className="modal-overlay">
          <form onSubmit={handleReceivePayment} className="modal-content max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-base font-black text-slate-100">سداد مديونية عميل</h3>
              <button type="button" onClick={() => { setShowPayModal(false); setSelectedCustomerForPayment(null); }} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ background: "rgba(244,63,94,0.08)" }}>
                <p className="text-xs text-slate-400 font-bold">العميل:</p>
                <p className="text-sm font-black text-slate-200">{selectedCustomerForPayment.name}</p>
                <p className="text-xs font-mono text-slate-400 mt-1">{selectedCustomerForPayment.phone}</p>
                <p className="text-sm font-black text-rose-400 mt-2">المديونية الحالية: {fmt(selectedCustomerForPayment.balance)}</p>
              </div>

              <div>
                <label className="label">المبلغ المدفوع للسداد *</label>
                <input type="number" step="0.01" className="input-field text-left" required max={selectedCustomerForPayment.balance}
                  value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
              </div>

              <div>
                <label className="label">ملاحظات الدفع</label>
                <input className="input-field" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="مثل: دفع نقدي للمحل" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => { setShowPayModal(false); setSelectedCustomerForPayment(null); }} className="btn btn-ghost btn-sm">إلغاء</button>
              <button type="submit" className="btn btn-success btn-sm">تأكيد سداد المبلغ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
