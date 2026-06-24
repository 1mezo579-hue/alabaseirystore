import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// ─── GET: All Users ───────────────────────────────────────────────────────────
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: { invoices: true, maintenanceOrders: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (e: any) {
    console.error("GET users error:", e.message);
    return NextResponse.json({ error: "فشل في جلب المستخدمين" }, { status: 500 });
  }
}

// ─── POST: Create New User ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, name, role } = body;

    if (!username?.trim() || !password?.trim() || !name?.trim() || !role) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة (اسم المستخدم، كلمة المرور، الاسم، الدور)" },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "اسم المستخدم موجود بالفعل" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { invoices: true, maintenanceOrders: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    console.error("POST user error:", e.message);
    return NextResponse.json({ error: "فشل في إنشاء المستخدم" }, { status: 500 });
  }
}
