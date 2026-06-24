"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Wallet, Search, Plus, Edit2, ArrowRight, X,
  TrendingDown, Calendar, ShieldAlert
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  createdAt: string;
  user: { name: string } | null;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

const EXPENSE_CATEGORIES: Record<string, string> = {
  rent: "إيجار",
  electricity: "كهرباء ومرافق",
  salaries: "مرتبات",
  tools: "أدوات ومعدات صيانة",
  marketing: "تسويق وإعلانات",
  other: "أخرى / نثرية"
};

export default function ExpensesPage() {
  const { user, isChecked } = useRequireAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل المصروفات");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) {
      toast.error("يرجى إدخال المبلغ وتحديد القسم");
      return;
    }

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          description: description || null,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingExpense ? "تم تعديل المصروف بنجاح" : "تم تسجيل المصروف بنجاح");
      setShowAddModal(false);
      setEditingExpense(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل المصروف");
    }
  };

  const resetForm = () => {
    setAmount("");
    setCategory("other");
    setDescription("");
  };

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setDescription(exp.description || "");
    setShowAddModal(true);
  };

  if (!isChecked) return <LoadingScreen />;

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesCategory = selectedCategoryFilter === "all" || exp.category === selectedCategoryFilter;
    return (searchQuery ? matchesSearch : true) && matchesCategory;
  });

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">سجل المصروفات</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div>
            <button onClick={() => { setEditingExpense(null); resetForm(); setShowAddModal(true); }} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> تسجيل مصروف
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="label">إجمالي المصروفات المسجلة</span>
              <p className="text-2xl font-black text-white">{fmt(totalExpenses)}</p>
            </div>
            <div className="stat-card">
              <span className="label">الإيجار والمرافق العامة</span>
              <p className="text-2xl font-black text-cyan-400">
                {fmt(expenses.filter(e => e.category === "rent" || e.category === "electricity").reduce((a, b) => a + b.amount, 0))}
              </p>
            </div>
            <div className="stat-card">
              <span className="label">المرتبات والأجور</span>
              <p className="text-2xl font-black text-amber-400">
                {fmt(expenses.filter(e => e.category === "salaries").reduce((a, b) => a + b.amount, 0))}
              </p>
            </div>
            <div className="stat-card">
              <span className="label">شراء أدوات صيانة</span>
              <p className="text-2xl font-black text-rose-400">
                {fmt(expenses.filter(e => e.category === "tools").reduce((a, b) => a + b.amount, 0))}
              </p>
            </div>
          </div>

          {/* Search bar and filter dropdown */}
          <div className="glass-card flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input-field pr-10"
                placeholder="ابحث بوصف المصروف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                className="input-field min-w-[150px]"
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
              >
                <option value="all">كل الأقسام</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([val, name]) => (
                  <option key={val} value={val}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses list */}
          <div className="glass-card overflow-x-auto p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>تاريخ المصروف</th>
                  <th>المبلغ</th>
                  <th>القسم</th>
                  <th>الوصف والبيان</th>
                  <th>المسؤول</th>
                  <th className="no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="animate-fade-in">
                    <td className="font-mono text-xs text-slate-400">
                      {new Date(exp.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="text-rose-400 font-black">{fmt(exp.amount)}</td>
                    <td>
                      <span className="badge badge-zinc">
                        {EXPENSE_CATEGORIES[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="text-slate-300">{exp.description || "—"}</td>
                    <td>{exp.user?.name || "مدير النظام"}</td>
                    <td className="no-print">
                      <button onClick={() => startEdit(exp)} className="p-2 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 font-bold">لا يوجد مصروفات مطابقة للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveExpense} className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-black text-slate-100">{editingExpense ? "تعديل المصروف" : "تسجيل مصروف جديد"}</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">قيمة المصروف *</label>
                <input type="number" step="0.01" className="input-field text-left" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>

              <div>
                <label className="label">القسم والنوع *</label>
                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                  {Object.entries(EXPENSE_CATEGORIES).map(([val, name]) => (
                    <option key={val} value={val}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">الوصف والبيان</label>
                <textarea className="input-field h-24 resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="تفاصيل المصروف، مثل: دفع فاتورة الكهرباء لشهر يونيو..." />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">إلغاء</button>
              <button type="submit" className="btn btn-primary">حفظ وتسجيل</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
