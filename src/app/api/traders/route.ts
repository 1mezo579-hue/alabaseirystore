import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: All suppliers (traders) ─────────────────────────────────────────────
export async function GET() {
  try {
    const traders = await prisma.trader.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { invoices: true } },
      },
    });
    return NextResponse.json(traders);
  } catch (e: any) {
    console.error("GET traders error:", e.message);
    return NextResponse.json({ error: "فشل في جلب الموردين" }, { status: 500 });
  }
}

// ─── POST: Create supplier (trader) ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, company, address, notes, balance } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم المورد مطلوب" }, { status: 400 });
    }

    const trader = await prisma.trader.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        balance: Number(balance) || 0,
      },
    });

    return NextResponse.json(trader, { status: 201 });
  } catch (e: any) {
    console.error("POST trader error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة المورد" }, { status: 500 });
  }
}
