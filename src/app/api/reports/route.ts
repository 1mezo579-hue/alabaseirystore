import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: Sales & Financial Reports ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // today, week, month, year, custom
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === "today") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === "custom" && from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = { createdAt: { gte: startDate, lte: endDate } };

    // ── 1. Invoices in period ──
    const invoices = await prisma.invoice.findMany({
      where: dateFilter,
      select: {
        finalTotal: true,
        paymentType: true,
        orderType: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            price: true,
            total: true,
            product: {
              select: {
                costPrice: true,
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // ── 2. Maintenance revenue in period ──
    const maintenanceOrders = await prisma.maintenanceOrder.findMany({
      where: { ...dateFilter, status: { in: ["completed", "delivered"] } },
      select: { cost: true, paid: true, remaining: true, status: true },
    });

    // ── 3. Expenses in period ──
    const expenses = await prisma.expense.findMany({
      where: dateFilter,
      select: { amount: true, category: true },
    });

    // ── 4. All-time quick counts ──
    const [totalCustomers, totalProducts, pendingMaintenance, totalOrders] =
      await Promise.all([
        prisma.customer.count(),
        prisma.product.count(),
        prisma.maintenanceOrder.count({
          where: { status: { in: ["pending", "checking", "repairing"] } },
        }),
        prisma.invoice.count(),
      ]);

    // ── Calculations ──
    let salesRevenue = 0;
    let salesCost = 0;
    const paymentBreakdown: Record<string, number> = {
      cash: 0,
      card: 0,
      credit: 0,
    };
    const categoryRevenue: Record<string, number> = {};
    const topProducts: Record<string, { qty: number; revenue: number }> = {};

    for (const inv of invoices) {
      salesRevenue += inv.finalTotal;
      paymentBreakdown[inv.paymentType] =
        (paymentBreakdown[inv.paymentType] || 0) + inv.finalTotal;

      for (const item of inv.items) {
        const costPrice = item.product?.costPrice || 0;
        salesCost += costPrice * item.quantity;

        const catName = item.product?.category?.name || "غير مصنف";
        categoryRevenue[catName] = (categoryRevenue[catName] || 0) + item.total;

        const prodName = item.product?.name || "منتج محذوف";
        if (!topProducts[prodName])
          topProducts[prodName] = { qty: 0, revenue: 0 };
        topProducts[prodName].qty += item.quantity;
        topProducts[prodName].revenue += item.total;
      }
    }

    const salesProfit = salesRevenue - salesCost;
    const maintenanceRevenue = maintenanceOrders.reduce(
      (s, o) => s + o.paid,
      0
    );
    const maintenancePending = maintenanceOrders.reduce(
      (s, o) => s + o.remaining,
      0
    );
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const expenseBreakdown: Record<string, number> = {};
    for (const e of expenses) {
      expenseBreakdown[e.category] =
        (expenseBreakdown[e.category] || 0) + e.amount;
    }

    const netProfit = salesProfit + maintenanceRevenue - totalExpenses;

    // Sort top products
    const topProductsList = Object.entries(topProducts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category revenue list
    const categoryList = Object.entries(categoryRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Daily chart data (last 30 days for month, last 7 for week, etc.)
    const dailyMap: Record<string, number> = {};
    for (const inv of invoices) {
      const day = inv.createdAt.toISOString().split("T")[0];
      dailyMap[day] = (dailyMap[day] || 0) + inv.finalTotal;
    }
    const dailyChart = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      period,
      startDate,
      endDate,
      summary: {
        salesRevenue,
        salesCost,
        salesProfit,
        maintenanceRevenue,
        maintenancePending,
        totalExpenses,
        netProfit,
        invoiceCount: invoices.length,
        maintenanceCount: maintenanceOrders.length,
      },
      paymentBreakdown,
      expenseBreakdown,
      categoryRevenue: categoryList,
      topProducts: topProductsList,
      dailyChart,
      allTime: {
        totalCustomers,
        totalProducts,
        pendingMaintenance,
        totalOrders,
      },
    });
  } catch (e: any) {
    console.error("GET reports error:", e.message);
    return NextResponse.json(
      { error: "فشل في جلب بيانات التقارير" },
      { status: 500 }
    );
  }
}
