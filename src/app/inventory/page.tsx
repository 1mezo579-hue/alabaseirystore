"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Package, Search, Plus, Edit2, ArrowRight, FolderPlus,
  AlertTriangle, Check, X, ShieldAlert, ArrowDownUp
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  categoryId: number | null;
  category: Category | null;
  priceType: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

export default function InventoryPage() {
  const { user, isChecked } = useRequireAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceType, setPriceType] = useState("unit");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [unit, setUnit] = useState("piece");
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    try {
      const prodRes = await fetch("/api/products");
      const prodData = await prodRes.json();
      if (Array.isArray(prodData)) setProducts(prodData);

      const catRes = await fetch("/api/categories");
      const catData = await catRes.json();
      if (Array.isArray(catData)) setCategories(catData);
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل البيانات");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("يرجى ملء الحقول الإجبارية");
      return;
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          barcode: barcode || null,
          categoryId: categoryId ? Number(categoryId) : null,
          priceType,
          price: Number(price),
          costPrice: Number(costPrice) || 0,
          stock: Number(stock) || 0,
          minStock: Number(minStock) || 0,
          unit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(editingProduct ? "تم تحديث المنتج بنجاح" : "تم إضافة المنتج بنجاح");
      setShowAddProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ المنتج");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("تم إضافة القسم بنجاح");
      setNewCategoryName("");
      setShowAddCategoryModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "فشل إضافة القسم");
    }
  };

  const resetProductForm = () => {
    setName("");
    setBarcode("");
    setCategoryId("");
    setPriceType("unit");
    setPrice("");
    setCostPrice("");
    setStock("");
    setMinStock("5");
    setUnit("piece");
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBarcode(p.barcode || "");
    setCategoryId(p.categoryId ? String(p.categoryId) : "");
    setPriceType(p.priceType);
    setPrice(String(p.price));
    setCostPrice(String(p.costPrice));
    setStock(String(p.stock));
    setMinStock(String(p.minStock));
    setUnit(p.unit);
    setShowAddProductModal(true);
  };

  if (!isChecked) return <LoadingScreen />;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === "all" || p.categoryId === Number(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.priceType !== "service").length;

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">المخزن وإدارة المنتجات</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddCategoryModal(true)} className="btn btn-ghost btn-sm">
              <FolderPlus className="w-4 h-4" /> إضافة قسم
            </button>
            <button onClick={() => { setEditingProduct(null); resetProductForm(); setShowAddProductModal(true); }} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> منتج جديد
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Low Stock Alert Banner */}
          {lowStockCount > 0 && (
            <div className="glass-card flex items-center justify-between p-4" style={{ background: "rgba(244,63,94,0.06)", borderColor: "rgba(244,63,94,0.2)" }}>
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
                <div>
                  <h4 className="text-sm font-black text-rose-200">تنبيه المخزون المنخفض</h4>
                  <p className="text-xs font-bold text-slate-400">يوجد عدد ({lowStockCount}) منتجات وصلت للحد الأدنى من الكمية أو نفدت.</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="label">إجمالي المنتجات</span>
              <p className="text-2xl font-black text-white">{products.length}</p>
            </div>
            <div className="stat-card">
              <span className="label">الأقسام الرئيسية</span>
              <p className="text-2xl font-black text-cyan-400">{categories.length}</p>
            </div>
            <div className="stat-card">
              <span className="label">منتجات نفدت</span>
              <p className="text-2xl font-black text-rose-400">{products.filter(p => p.stock === 0 && p.priceType !== "service").length}</p>
            </div>
            <div className="stat-card">
              <span className="label">قيمة المخزون بسعر التكلفة</span>
              <p className="text-2xl font-black text-emerald-400">
                {fmt(products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0))}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input-field pr-10"
                placeholder="البحث بالاسم أو الباركود..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                className="input-field min-w-[150px]"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                <option value="all">كل الأقسام</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="glass-card overflow-x-auto p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المنتج</th>
                  <th>القسم</th>
                  <th>الباركود</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>المخزون</th>
                  <th>الحالة</th>
                  <th className="no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLow = p.stock <= p.minStock && p.priceType !== "service";
                  const outOfStock = p.stock <= 0 && p.priceType !== "service";

                  return (
                    <tr key={p.id} className="animate-fade-in">
                      <td className="font-bold text-slate-200">{p.name}</td>
                      <td>{p.category?.name || "بدون قسم"}</td>
                      <td className="font-mono text-xs text-slate-500">{p.barcode || "—"}</td>
                      <td className="text-rose-400 font-bold">{fmt(p.costPrice)}</td>
                      <td className="text-emerald-400 font-bold">{fmt(p.price)}</td>
                      <td className="font-mono font-black">{p.priceType === "service" ? "خدمة صيانة" : `${p.stock} ${p.unit === "piece" ? "قطعة" : "وحدة"}`}</td>
                      <td>
                        {p.priceType === "service" ? (
                          <span className="badge badge-cyan">صيانة</span>
                        ) : outOfStock ? (
                          <span className="badge badge-rose">نفد</span>
                        ) : isLow ? (
                          <span className="badge badge-amber">منخفض</span>
                        ) : (
                          <span className="badge badge-emerald">متوفر</span>
                        )}
                      </td>
                      <td className="no-print">
                        <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-violet-400 hover:bg-violet-500/10 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 font-bold">لا توجد منتجات مطابقة للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay">
          <form onSubmit={handleAddProduct} className="modal-content max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-lg font-black text-slate-100">{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>
              <button type="button" onClick={() => setShowAddProductModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">اسم المنتج *</label>
                <input className="input-field" required value={name} onChange={e => setName(e.target.value)} placeholder="مثال: شاحن أصلي آيفون 20 واط" />
              </div>

              <div>
                <label className="label">الباركود (إن وجد)</label>
                <input className="input-field" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="أو امسح الباركود..." />
              </div>

              <div>
                <label className="label">القسم</label>
                <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">اختر القسم...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">نوع المنتج</label>
                <select className="input-field" value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="unit">سلعة / إكسسوار</option>
                  <option value="service">خدمة صيانة</option>
                </select>
              </div>

              <div>
                <label className="label">الوحدة</label>
                <input className="input-field" value={unit} onChange={e => setUnit(e.target.value)} placeholder="مثال: قطعة" />
              </div>

              <div>
                <label className="label">سعر البيع *</label>
                <input type="number" step="0.01" className="input-field" required value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>

              <div>
                <label className="label">سعر الشراء / التكلفة</label>
                <input type="number" step="0.01" className="input-field" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
              </div>

              {priceType !== "service" && (
                <>
                  <div>
                    <label className="label">الكمية الحالية في المخزن</label>
                    <input type="number" className="input-field" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
                  </div>

                  <div>
                    <label className="label">حد التنبيه (المخزون المنخفض)</label>
                    <input type="number" className="input-field" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="5" />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button type="button" onClick={() => setShowAddProductModal(false)} className="btn btn-ghost">إلغاء</button>
              <button type="submit" className="btn btn-primary">حفظ المنتج</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay">
          <form onSubmit={handleAddCategory} className="modal-content max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 className="text-base font-black text-slate-100">إضافة قسم جديد</h3>
              <button type="button" onClick={() => setShowAddCategoryModal(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label">اسم القسم *</label>
              <input className="input-field" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="مثال: سكرينات حماية" />
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowAddCategoryModal(false)} className="btn btn-ghost btn-sm">إلغاء</button>
              <button type="submit" className="btn btn-primary btn-sm">إضافة القسم</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
