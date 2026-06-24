import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DELETED_PRODUCT = { name: "منتج محذوف", costPrice: 0, category: null as { name: string } | null };

// ─── GET: All Invoices ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        discount: true,
        finalTotal: true,
        paymentType: true,
        orderType: true,
        deliveryFee: true,
        createdAt: true,
        user: { select: { name: true } },
        customer: { select: { name: true, phone: true, address: true, points: true, balance: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            productId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const productIds = Array.from(new Set(invoices.flatMap((inv) => inv.items.map((it) => it.productId))));
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            costPrice: true,
            category: { select: { name: true } },
          },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const enriched = invoices.map((inv) => ({
      ...inv,
      items: inv.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: productMap.get(item.productId) ?? DELETED_PRODUCT,
      })),
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    console.error("GET invoices error:", e.message, e.code);
    return NextResponse.json({ error: "فشل تحميل الفواتير" }, { status: 500 });
  }
}

// ─── POST: Create Invoice ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceNo, userId, customerId, total, discount, finalTotal, paymentType, orderType, deliveryFee, items } = body;

    if (!invoiceNo || !userId || !items?.length) {
      return NextResponse.json({ error: "بيانات الفاتورة غير مكتملة" }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        userId: Number(userId),
        customerId: customerId ? Number(customerId) : null,
        total: Number(total),
        discount: Number(discount) || 0,
        finalTotal: Number(finalTotal),
        paymentType: paymentType || "cash",
        orderType: orderType || "shop",
        deliveryFee: Number(deliveryFee) || 0,
        items: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            total: Number(item.total),
          })),
        },
      },
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        discount: true,
        finalTotal: true,
        paymentType: true,
        orderType: true,
        deliveryFee: true,
        createdAt: true,
        customer: { select: { name: true, phone: true, points: true, address: true, balance: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: { name: true, costPrice: true, category: { select: { name: true } } } },
          },
        },
      },
    });

    // Run stock logs and updates in background to keep POS fast
    setImmediate(async () => {
      try {
        const stockUpdates = items.map((item: any) =>
          prisma.product.update({
            where: { id: Number(item.productId) },
            data: { stock: { decrement: Number(item.quantity) } },
          })
        );
        const logInsert = prisma.stockLog.createMany({
          data: items.map((item: any) => ({
            productId: Number(item.productId),
            type: "out",
            quantity: Number(item.quantity),
            reason: "sale",
            notes: `فاتورة #${invoiceNo}`,
          })),
        });
        const customerUpdate = customerId
          ? prisma.customer.update({
              where: { id: Number(customerId) },
              data: {
                points: { increment: Math.floor(Number(finalTotal) / 10) },
                totalSpent: { increment: Number(finalTotal) },
                ...(paymentType === "credit" && { balance: { increment: Number(finalTotal) } }),
              },
            })
          : null;
        await Promise.all([...stockUpdates, logInsert, ...(customerUpdate ? [customerUpdate] : [])]);
      } catch (bgErr: any) {
        console.error("Background invoice update error:", bgErr.message);
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e: any) {
    console.error("Invoice creation error:", e.message);
    return NextResponse.json(
      { error: e.code === "P2002" ? "رقم الفاتورة مكرر، حاول مرة أخرى" : `فشل إنشاء الفاتورة: ${e.message}` },
      { status: 500 }
    );
  }
}
