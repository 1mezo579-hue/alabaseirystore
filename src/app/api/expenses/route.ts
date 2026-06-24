import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: All expenses ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });
    return NextResponse.json(expenses);
  } catch (e: any) {
    console.error("GET expenses error:", e.message);
    return NextResponse.json({ error: "فشل في جلب المصروفات" }, { status: 500 });
  }
}

// ─── POST: Create expense ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, category, description, userId } = body;

    if (!amount || !category?.trim() || !userId) {
      return NextResponse.json({ error: "المبلغ والبيان والمستخدم مطلوبون" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        category: category.trim(),
        description: description?.trim() || null,
        userId: Number(userId),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    console.error("POST expense error:", e.message);
    return NextResponse.json({ error: "فشل في إضافة المصروف" }, { status: 500 });
  }
}
