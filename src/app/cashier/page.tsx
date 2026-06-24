"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/hooks/useAuthStore";
import LoadingScreen from "@/components/LoadingScreen";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ShoppingCart, Search, X, Plus, Minus, Trash2, CreditCard,
  Banknote, ArrowRight, UserCircle, Tag, ChevronDown, Printer,
  Package, CheckCircle2
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string | null;
  price: number;
  costPrice: number;
  stock: number;
  priceType: string;
  unit: string;
  categoryId: number | null;
  category: { name: string } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  balance: number;
  points: number;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

export default function CashierPage() {
  const { user, isChecked } = useRequireAuth();
  const { } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState<"cash" | "card" | "credit">("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setProducts(data);
    });
    fetch("/api/customers").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCustomers(data);
    });
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.name.includes(customerQuery) || c.phone.includes(customerQuery)
  );

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      products.filter(p =>
        p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
      ).slice(0, 8)
    );
  }, [searchQuery, products]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0 && product.priceType !== "service") {
      toast.error(`${product.name} - المخزون نفد!`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, { product, quantity: 1, price: product.price }];
    });
    setSearchQuery("");
    setSearchResults([]);
    searchRef.current?.focus();
    toast.success(`تم إضافة ${product.name}`, { duration: 1000 });
  }, []);

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== id) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null : { ...i, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const updatePrice = (id: number, price: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, price } : i));
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(i => i.product.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount);
  const change = cashReceived ? Math.max(0, Number(cashReceived) - finalTotal) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("السلة فارغة"); return; }
    if (paymentType === "credit" && !selectedCustomer) {
      toast.error("يجب اختيار عميل للبيع الآجل");
      return;
    }
    setIsSubmitting(true);
    try {
      const invoiceNo = `INV-${Date.now()}`;
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNo,
          userId: user?.id,
          customerId: selectedCustomer?.id || null,
          total: subtotal,
          discount,
          finalTotal,
          paymentType,
          orderType: "shop",
          deliveryFee: 0,
          items: cart.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: i.price,
            total: i.price * i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastInvoice({ ...data, cashReceived: Number(cashReceived), change });
      setShowReceipt(true);
      setCart([]);
      setDiscount(0);
      setCashReceived("");
      setSelectedCustomer(null);
      setCustomerQuery("");
      setPaymentType("cash");
      // Refresh products to update stock
      fetch("/api/products").then(r => r.json()).then(d => { if (Array.isArray(d)) setProducts(d); });
      toast.success(`تم إنشاء الفاتورة ${invoiceNo}`);
    } catch (e: any) {
      toast.error(e.message || "فشل إنشاء الفاتورة");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isChecked) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07080f" }}>
      {/* Header */}
      <header className="glass-header no-print">
        <div className="flex items-center gap-3">
          <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-100">كاشير البيع</h1>
            <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-300">{user?.name}</span>
          <span className="badge badge-violet">{user?.role === "admin" ? "مدير" : "كاشير"}</span>
        </div>
      </header>

      <div className="flex flex-1 gap-0 lg:gap-4 p-3 lg:p-4 overflow-hidden" style={{ maxHeight: "calc(100vh - 60px)" }}>
        {/* Left: Product Search */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }} />
            <input
              ref={searchRef}
              className="input-field pr-10"
              placeholder="ابحث بالاسم أو الباركود..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4" style={{ color: "#475569" }} />
              </button>
            )}
            {/* Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-1 rounded-xl border z-30 overflow-hidden"
                style={{ background: "#0f1018", borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-4 py-3 text-right transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseOut={e => (e.currentTarget.style.background = "")}>
                    <div>
                      <p className="text-sm font-black text-slate-200">{p.name}</p>
                      <p className="text-xs font-bold" style={{ color: "#475569" }}>{p.category?.name} • مخزون: {p.stock}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black" style={{ color: "#6366f1" }}>{fmt(p.price)}</p>
                      {p.stock <= 0 && p.priceType !== "service" && <span className="text-xs text-rose-400 font-bold">نفد</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="glass-card flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                <Package className="w-12 h-12" style={{ color: "#1e1e2e" }} />
                <p className="text-sm font-bold" style={{ color: "#475569" }}>ابدأ بالبحث وإضافة المنتجات</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-200 truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag className="w-3 h-3" style={{ color: "#475569" }} />
                        <input type="number" value={item.price} onChange={e => updatePrice(item.product.id, Number(e.target.value))}
                          className="w-24 bg-transparent text-xs font-black text-violet-400 outline-none border-b"
                          style={{ borderColor: "rgba(99,102,241,0.3)" }} />
                        <span className="text-xs font-bold" style={{ color: "#475569" }}>ج</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Minus className="w-3 h-3 text-slate-400" />
                      </button>
                      <span className="w-8 text-center text-sm font-black text-slate-200">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Plus className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                    <div className="text-left min-w-[70px]">
                      <p className="text-sm font-black" style={{ color: "#10b981" }}>{fmt(item.price * item.quantity)}</p>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Checkout Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-3">
          {/* Customer */}
          <div className="glass-card">
            <label className="label">العميل</label>
            <div className="relative">
              <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }} />
              <input className="input-field pr-10"
                placeholder="بحث عن عميل..."
                value={selectedCustomer ? selectedCustomer.name : customerQuery}
                onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomer(null); setShowCustomerSearch(true); }}
                onFocus={() => setShowCustomerSearch(true)}
              />
              {selectedCustomer && (
                <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); }} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-rose-400" />
                </button>
              )}
              {showCustomerSearch && !selectedCustomer && customerQuery && (
                <div className="absolute top-full right-0 left-0 mt-1 rounded-xl border z-20 overflow-hidden"
                  style={{ background: "#0f1018", borderColor: "rgba(255,255,255,0.12)" }}>
                  {filteredCustomers.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerQuery(c.name); setShowCustomerSearch(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-white/5 transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <p className="text-sm font-black text-slate-200">{c.name}</p>
                        <p className="text-xs font-bold" style={{ color: "#475569" }}>{c.phone}</p>
                      </div>
                      <div className="text-left">
                        {c.balance > 0 && <p className="text-xs text-rose-400 font-bold">مديونية: {fmt(c.balance)}</p>}
                        <p className="text-xs text-amber-400 font-bold">{c.points} نقطة</p>
                      </div>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">لا نتائج</p>}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div className="mt-2 p-2 rounded-lg flex items-center justify-between" style={{ background: "rgba(99,102,241,0.08)" }}>
                <span className="text-xs font-bold text-violet-400">✓ {selectedCustomer.name}</span>
                <span className="text-xs font-bold text-amber-400">{selectedCustomer.points} نقطة</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="glass-card space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-bold" style={{ color: "#475569" }}>المجموع</span>
              <span className="text-sm font-black text-slate-200">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "#475569" }}>خصم (ج)</span>
              <input type="number" value={discount || ""} onChange={e => setDiscount(Number(e.target.value) || 0)}
                className="input-field w-24 text-left" placeholder="0" />
            </div>
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <span className="text-base font-black text-slate-100">الإجمالي</span>
              <span className="text-base font-black" style={{ color: "#10b981" }}>{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="glass-card space-y-3">
            <label className="label">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "cash", label: "كاش", icon: Banknote, color: "#10b981" },
                { type: "card", label: "فيزا", icon: CreditCard, color: "#6366f1" },
                { type: "credit", label: "آجل", icon: ChevronDown, color: "#f59e0b" },
              ].map(({ type, label, icon: Icon, color }) => (
                <button key={type} onClick={() => setPaymentType(type as any)}
                  className="py-2 rounded-xl text-sm font-black flex flex-col items-center gap-1 transition-all"
                  style={{
                    background: paymentType === type ? `${color}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${paymentType === type ? color : "rgba(255,255,255,0.08)"}`,
                    color: paymentType === type ? color : "#475569"
                  }}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            {paymentType === "cash" && (
              <div>
                <label className="label">المبلغ المدفوع</label>
                <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                  className="input-field" placeholder="أدخل المبلغ..." />
                {change > 0 && (
                  <div className="mt-2 p-2 rounded-lg flex items-center justify-between" style={{ background: "rgba(16,185,129,0.1)" }}>
                    <span className="text-sm font-black text-emerald-400">الباقي للعميل</span>
                    <span className="text-sm font-black text-emerald-400">{fmt(change)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout Button */}
          <button onClick={handleCheckout} disabled={isSubmitting || cart.length === 0}
            className="btn btn-success btn-lg w-full text-base">
            {isSubmitting ? "جاري الإنشاء..." : <>
              <CheckCircle2 className="w-5 h-5" />
              إتمام البيع {cart.length > 0 && `(${cart.length} صنف)`}
            </>}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastInvoice && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm">
            {/* Printable Receipt */}
            <div id="receipt-print" className="text-center" style={{ fontFamily: "Tajawal, sans-serif", color: "#111" }}>
              <div style={{ padding: "16px", background: "white", borderRadius: "12px" }}>
                <img src="/logo.png" alt="الأباصيري ستور" style={{ height: "60px", margin: "0 auto 8px", display: "block", objectFit: "contain" }} />
                <div style={{ borderTop: "2px dashed #ccc", borderBottom: "2px dashed #ccc", padding: "8px 0", marginBottom: "12px" }}>
                  <p style={{ fontSize: "11px", color: "#666", margin: "2px 0" }}>رقم الفاتورة: {lastInvoice.invoiceNo}</p>
                  <p style={{ fontSize: "11px", color: "#666", margin: "2px 0" }}>{new Date(lastInvoice.createdAt).toLocaleString("ar-EG")}</p>
                  {lastInvoice.customer && <p style={{ fontSize: "12px", fontWeight: "bold", margin: "4px 0" }}>العميل: {lastInvoice.customer.name}</p>}
                </div>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px dashed #ccc" }}>
                      <th style={{ textAlign: "right", padding: "4px" }}>الصنف</th>
                      <th style={{ padding: "4px" }}>ك</th>
                      <th style={{ padding: "4px" }}>سعر</th>
                      <th style={{ textAlign: "left", padding: "4px" }}>اجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastInvoice.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td style={{ textAlign: "right", padding: "3px 4px", fontSize: "11px" }}>{item.product?.name}</td>
                        <td style={{ textAlign: "center", padding: "3px 4px" }}>{item.quantity}</td>
                        <td style={{ textAlign: "center", padding: "3px 4px" }}>{item.price}</td>
                        <td style={{ textAlign: "left", padding: "3px 4px" }}>{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: "1px dashed #ccc", marginTop: "8px", paddingTop: "8px" }}>
                  {lastInvoice.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span>خصم:</span><span>-{fmt(lastInvoice.discount)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "14px", borderTop: "1px solid #ccc", marginTop: "4px", paddingTop: "4px" }}><span>الإجمالي:</span><span>{fmt(lastInvoice.finalTotal)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "4px" }}><span>الدفع:</span><span>{lastInvoice.paymentType === "card" ? "فيزا" : lastInvoice.paymentType === "credit" ? "آجل" : "كاش"}</span></div>
                  {lastInvoice.change > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}><span>الباقي:</span><span>{fmt(lastInvoice.change)}</span></div>}
                </div>
                <div style={{ marginTop: "12px", borderTop: "2px dashed #ccc", paddingTop: "8px", fontSize: "10px", color: "#666" }}>
                  شكراً لتعاملكم مع الأباصيري ستور<br />ALABASSIRY STORE
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 no-print">
              <button onClick={() => {
                const w = window.open("", "_blank");
                if (w) {
                  w.document.write(`<html><head><title>فاتورة</title><style>body{direction:rtl;font-family:'Tajawal',sans-serif;}</style></head><body>${document.getElementById("receipt-print")?.innerHTML}</body></html>`);
                  w.document.close();
                  w.print();
                  w.close();
                }
              }} className="btn btn-ghost flex-1">
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button onClick={() => setShowReceipt(false)} className="btn btn-primary flex-1">
                <ShoppingCart className="w-4 h-4" /> فاتورة جديدة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
