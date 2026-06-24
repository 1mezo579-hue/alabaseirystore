"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BarChart3, Calendar, Search, ArrowRight, Printer,
  DollarSign, ShoppingCart, Wrench, Wallet, TrendingUp
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import PageBackground from "@/components/PageBackground";

interface ReportData {
  salesTotal: number;
  salesCount: number;
  costTotal: number;
  netProfit: number;
  maintenanceTotal: number;
  maintenanceCount: number;
  expensesTotal: number;
  netIncome: number;
}

const fmt = (n: number) => n.toFixed(2) + " ج";

export default function ReportsPage() {
  const { user, isChecked } = useRequireAuth();
  const [reportRange, setReportRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportData>({
    salesTotal: 0,
    salesCount: 0,
    costTotal: 0,
    netProfit: 0,
    maintenanceTotal: 0,
    maintenanceCount: 0,
    expensesTotal: 0,
    netIncome: 0,
  });

  const fetchReport = async () => {
    try {
      const url = `/api/reports?range=${reportRange}&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "فشل تحميل تقرير الأرباح والمبيعات");
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportRange, startDate, endDate]);

  if (!isChecked) return <LoadingScreen />;

  return (
    <div className="relative min-h-screen" dir="rtl">
      <PageBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="glass-header sticky top-0 z-20 no-print">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-btn"><ArrowRight className="w-4 h-4" /></Link>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-100">التقارير والإحصائيات</h1>
              <p className="text-xs font-bold" style={{ color: "#475569" }}>الأباصيري ستور</p>
            </div>
          </div>
          <div>
            <button onClick={() => window.print()} className="btn btn-ghost btn-sm">
              <Printer className="w-4 h-4" /> طباعة التقرير
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Print Only Title */}
          <div className="hidden print:block text-center space-y-2 mb-6" style={{ color: "#000" }}>
            <h1 className="text-3xl font-black">الأباصيري ستور - تقرير الأرباح والمبيعات</h1>
            <p className="text-sm">تقرير مفصل للفترة المحددة</p>
            <p className="text-xs font-mono">تاريخ الطباعة: {new Date().toLocaleString("ar-EG")}</p>
            <hr className="border-t-2 border-dashed border-gray-300 mt-4" />
          </div>

          {/* Date range filter */}
          <div className="glass-card flex flex-col md:flex-row gap-4 items-center justify-between no-print">
            <div className="flex gap-2">
              {[
                { val: "today", name: "اليوم" },
                { val: "yesterday", name: "أمس" },
                { val: "week", name: "آخر 7 أيام" },
                { val: "month", name: "هذا الشهر" },
                { val: "custom", name: "فترة مخصصة" },
              ].map(({ val, name }) => (
                <button
                  key={val}
                  onClick={() => setReportRange(val)}
                  className={`btn btn-sm ${reportRange === val ? "btn-primary" : "btn-ghost"}`}
                >
                  {name}
                </button>
              ))}
            </div>

            {reportRange === "custom" && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="input-field max-w-[150px]"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 font-bold">إلى</span>
                <input
                  type="date"
                  className="input-field max-w-[150px]"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Financial summary blocks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card" style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}>
              <span className="label">صافي الدخل النهائي</span>
              <p className="text-3xl font-black text-emerald-400">{fmt(report.netIncome)}</p>
              <span className="text-xs text-slate-400 font-medium">مبيعات + صيانة - مصروفات</span>
            </div>

            <div className="stat-card">
              <span className="label">إجمالي إيرادات المبيعات</span>
              <p className="text-2xl font-black text-white">{fmt(report.salesTotal)}</p>
              <span className="text-xs text-slate-500 font-semibold">{report.salesCount} فاتورة بيع</span>
            </div>

            <div className="stat-card">
              <span className="label">إيرادات الصيانة الفنية</span>
              <p className="text-2xl font-black text-cyan-400">{fmt(report.maintenanceTotal)}</p>
              <span className="text-xs text-slate-500 font-semibold">{report.maintenanceCount} جهاز مستلم</span>
            </div>

            <div className="stat-card">
              <span className="label">إجمالي المصروفات والنفقات</span>
              <p className="text-2xl font-black text-rose-400">{fmt(report.expensesTotal)}</p>
              <span className="text-xs text-slate-500 font-semibold">تأجير، مرافق، أجور، صيانة</span>
            </div>
          </div>

          {/* Detailed breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales breakdown card */}
            <div className="glass-card space-y-4">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-violet-400" /> تحليل المبيعات
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-slate-400">إجمالي المبيعات (سعر البيع)</span>
                  <span className="font-bold text-slate-200">{fmt(report.salesTotal)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-slate-400">تكلفة البضاعة المباعة (سعر الشراء)</span>
                  <span className="font-bold text-rose-400">{fmt(report.costTotal)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-300 font-bold">صافي أرباح البضاعة</span>
                  <span className="font-black text-emerald-400">{fmt(report.netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Performance breakdown card */}
            <div className="glass-card space-y-4">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" /> أداء الصيانة والأجهزة
              </h3>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-slate-400">إجمالي أجهزة الصيانة المستلمة</span>
                  <span className="font-bold text-slate-200">{report.maintenanceCount} أجهزة</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="text-slate-400">المبالغ المحصلة كإيراد صيانة</span>
                  <span className="font-bold text-cyan-400">{fmt(report.maintenanceTotal)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-300 font-bold">متوسط تكلفة إصلاح الجهاز</span>
                  <span className="font-black text-amber-400">
                    {fmt(report.maintenanceCount > 0 ? report.maintenanceTotal / report.maintenanceCount : 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
