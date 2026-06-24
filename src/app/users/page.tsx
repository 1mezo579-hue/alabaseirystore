"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Settings, UserPlus, Search, Edit2, ArrowRight, X,
  Shield, Key, Lock, Users
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  cashier: "كاشير",
  technician: "فني صيانة"
};

const ROLE_COLORS: Record<string, string> = {
  admin: "badge-violet",
  manager: "badge-cyan",
  cashier: "badge-emerald",
  technician: "badge-amber"
};

export default function UsersPage() {
  const { user: currentUser, isChecked } = useRequireAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل المستخدمين");
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchData();
    }
  }, [currentUser]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || (!editingUser && !password)) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password: password || undefined,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingUser ? "تم تحديث بيانات المستخدم" : "تم إنشاء المستخدم الجديد");
      setShowAddModal(false);
      setEditingUser(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ بيانات المستخدم");
    }
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setRole("cashier");
  };

  const startEdit = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword("");
    setRole(u.role);
    setShowAddModal(true);
  };

  if (!isChecked) return <LoadingScreen />;

  // Restrict access to admin only
  if (currentUser?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080f" }}>
        <div className="glass-card text-center p-8 max-w-sm space-y-4">
          <Lock className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-black text-slate-100">غير مصرح بالدخول</h2>
          <p className="text-sm text-slate-400">هذه الصفحة مخصصة لمدير النظام فقط للتحكم بالحسابات والصلاحيات.</p>
          <Link href="/" className="btn btn-primary w-full btn-sm">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">المستخدمين والصلاحيات</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div>
            <button onClick={() => { setEditingUser(null); resetForm(); setShowAddModal(true); }} className="btn btn-primary btn-sm">
              <UserPlus className="w-4 h-4" /> إضافة مستخدم
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="label">إجمالي الحسابات</span>
              <p className="text-2xl font-black text-white">{users.length}</p>
            </div>
            <div className="stat-card">
              <span className="label">مدراء النظام</span>
              <p className="text-2xl font-black text-violet-400">{users.filter(u => u.role === "admin").length}</p>
            </div>
            <div className="stat-card">
              <span className="label">فنيين وكاشير</span>
              <p className="text-2xl font-black text-emerald-400">
                {users.filter(u => u.role === "cashier" || u.role === "technician").length}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-card">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input-field pr-10"
                placeholder="ابحث باسم الموظف أو اسم المستخدم..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Users List */}
          <div className="glass-card overflow-x-auto p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم الكامل</th>
                  <th>اسم المستخدم</th>
                  <th>دور المستخدم / الصلاحية</th>
                  <th>تاريخ التعيين</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="animate-fade-in">
                    <td className="font-bold text-slate-200">{u.name}</td>
                    <td className="font-mono text-xs text-slate-400">{u.username}</td>
                    <td>
                      <span className={`badge ${ROLE_COLORS[u.role] || "badge-zinc"}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td>
                      <button onClick={() => startEdit(u)} className="p-2 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveUser} className="modal-content max-w-md space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-black text-slate-100">{editingUser ? "تعديل الموظف" : "إضافة موظف جديد"}</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">اسم الموظف الكامل *</label>
                <input className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أحمد الأباصيري" />
              </div>

              <div>
                <label className="label">اسم المستخدم للدخول *</label>
                <input className="input-field font-mono" required value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
              </div>

              <div>
                <label className="label">كلمة المرور {editingUser && "(اتركه فارغاً لعدم التعديل)"}</label>
                <input type="password" className="input-field" required={!editingUser} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
              </div>

              <div>
                <label className="label">دور الموظف والصلاحية *</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  {Object.entries(ROLE_LABELS).map(([val, name]) => (
                    <option key={val} value={val}>{name}</option>
                  ))}
                </select>
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
