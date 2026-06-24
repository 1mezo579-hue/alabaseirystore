import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: All customers ──────────────────────────────────────────────────────
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (e: any) {
    console.error("GET customers error:", e.message);
    return NextResponse.json({ error: "فشل في جلب العملاء" }, { status: 500 });
  }
}

// ─── POST: Create customer ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, address, notes, balance } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "الاسم والهاتف مطلوبان" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        balance: Number(balance) || 0,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "رقم الهاتف مسجل لعميل آخر" }, { status: 400 });
    }
    console.error("POST customer error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة العميل" }, { status: 500 });
  }
}
