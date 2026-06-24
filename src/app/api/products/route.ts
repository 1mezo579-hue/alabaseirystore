import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET all products ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
        costPrice: true,
        stock: true,
        minStock: true,
        priceType: true,
        unit: true,
        expiryDate: true,
        categoryId: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (e: any) {
    console.error("GET products error:", e.message);
    return NextResponse.json({ error: "فشل في جلب المنتجات" }, { status: 500 });
  }
}

// ─── POST create product ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, barcode, categoryId, priceType, price, costPrice, stock, minStock, unit, expiryDate } = body;

    if (!name?.trim() || price === undefined) {
      return NextResponse.json({ error: "الاسم والسعر مطلوبان" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        barcode: barcode?.trim() || null,
        categoryId: categoryId ? Number(categoryId) : null,
        priceType: priceType || "unit",
        price: Number(price),
        costPrice: Number(costPrice) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        unit: unit || "piece",
        expiryDate: expiryDate || null,
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "الباركود مستخدم لمنتج آخر" }, { status: 400 });
    }
    console.error("POST product error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة المنتج" }, { status: 500 });
  }
}
