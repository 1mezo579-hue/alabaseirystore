import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: Retrieve maintenance orders with filters & statistics ───────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const query = searchParams.get("query")?.trim() || "";

    // Build filter
    const where: any = {};
    if (status) {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { orderNo: { contains: query, mode: 'insensitive' } },
        { customerName: { contains: query, mode: 'insensitive' } },
        { customerPhone: { contains: query, mode: 'insensitive' } },
        { deviceModel: { contains: query, mode: 'insensitive' } },
        { deviceBrand: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Fetch orders
    const orders = await prisma.maintenanceOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });

    // Calculate quick stats (total, pending, repairing, completed)
    const allStats = await prisma.maintenanceOrder.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: {
        cost: true,
        paid: true,
        remaining: true,
      },
    });

    const stats = {
      total: 0,
      pending: 0,
      checking: 0,
      repairing: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0, // Sum of paid amount for completed/delivered orders
    };

    allStats.forEach((group) => {
      const count = group._count.id;
      stats.total += count;
      if (group.status === "pending") stats.pending = count;
      if (group.status === "checking") stats.checking = count;
      if (group.status === "repairing") stats.repairing = count;
      if (group.status === "completed") stats.completed = count;
      if (group.status === "delivered") stats.delivered = count;
      if (group.status === "cancelled") stats.cancelled = count;
      
      // Revenue is actual cash collected from repairs
      stats.revenue += group._sum.paid || 0;
    });

    return NextResponse.json({ orders, stats });
  } catch (e: any) {
    console.error("GET maintenance error:", e.message);
    return NextResponse.json({ error: "فشل في جلب طلبات الصيانة" }, { status: 500 });
  }
}

// ─── POST: Create a new maintenance order ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      deviceType,
      deviceBrand,
      deviceModel,
      serialNo,
      problem,
      cost,
      paid,
      userId,
    } = body;

    if (!customerName?.trim() || !customerPhone?.trim() || !deviceModel?.trim() || !problem?.trim() || cost === undefined) {
      return NextResponse.json({ error: "جميع الحقول الأساسية مطلوبة (الاسم، الهاتف، موديل الجهاز، العطل، التكلفة)" }, { status: 400 });
    }

    const cleanPhone = customerPhone.trim();

    // 1. Upsert Customer in database to track loyalty / points
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName.trim(),
          phone: cleanPhone,
          address: "عميل صيانة",
        },
      });
    }

    // 2. Generate unique orderNo (e.g. MT-1001, MT-1002...)
    const lastOrder = await prisma.maintenanceOrder.findFirst({
      orderBy: { id: "desc" },
    });

    let nextNum = 1001;
    if (lastOrder && lastOrder.orderNo.startsWith("MT-")) {
      const lastNum = parseInt(lastOrder.orderNo.replace("MT-", ""), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const orderNo = `MT-${nextNum}`;

    // 3. Create Maintenance Order
    const costVal = Number(cost);
    const paidVal = Number(paid) || 0;
    const remainingVal = Math.max(0, costVal - paidVal);

    const order = await prisma.maintenanceOrder.create({
      data: {
        orderNo,
        customerId: customer.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deviceType: deviceType || "mobile",
        deviceBrand: deviceBrand?.trim() || "غير محدد",
        deviceModel: deviceModel.trim(),
        serialNo: serialNo?.trim() || null,
        problem: problem.trim(),
        cost: costVal,
        paid: paidVal,
        remaining: remainingVal,
        status: "pending",
        userId: Number(userId),
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e: any) {
    console.error("POST maintenance error:", e.message);
    return NextResponse.json({ error: "فشل في تسجيل طلب الصيانة" }, { status: 500 });
  }
}
