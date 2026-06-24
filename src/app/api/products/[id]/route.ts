import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── PUT: Update product ─────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) return NextResponse.json({ error: "معرّف المنتج غير صالح" }, { status: 400 });

    const body = await req.json();
    const { name, barcode, categoryId, priceType, price, costPrice, stock, minStock, unit, expiryDate } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم المنتج مطلوب" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
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

    return NextResponse.json(product);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "الباركود مستخدم لمنتج آخر" }, { status: 400 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    console.error("PUT product error:", e.message);
    return NextResponse.json({ error: "فشل في تحديث المنتج" }, { status: 500 });
  }
}

// ─── DELETE: Remove product ───────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) return NextResponse.json({ error: "معرّف المنتج غير صالح" }, { status: 400 });

    const [invoiceItems, traderItems] = await Promise.all([
      prisma.invoiceItem.count({ where: { productId: id } }),
      prisma.traderInvoiceItem.count({ where: { productId: id } }),
    ]);

    if (invoiceItems > 0 || traderItems > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف المنتج لوجود فواتير مرتبطة به. يمكنك تعديل المخزون إلى صفر بدلاً من الحذف." },
        { status: 409 }
      );
    }

    await prisma.stockLog.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    if (e.code === "P2003") {
      return NextResponse.json(
        { error: "لا يمكن حذف المنتج لوجود فواتير مرتبطة به" },
        { status: 409 }
      );
    }
    console.error("DELETE product error:", e.message);
    return NextResponse.json({ error: "فشل في حذف المنتج" }, { status: 500 });
  }
}
