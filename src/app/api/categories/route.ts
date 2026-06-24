import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET all categories with product count ────────────────────────────────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e: any) {
    console.error("GET categories error:", e.message);
    return NextResponse.json({ error: "فشل في جلب الأقسام" }, { status: 500 });
  }
}

// ─── POST create category ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "هذا القسم موجود مسبقاً" }, { status: 400 });
    }
    console.error("POST category error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة القسم" }, { status: 500 });
  }
}
