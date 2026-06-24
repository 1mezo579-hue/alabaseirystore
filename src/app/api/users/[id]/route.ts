import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// ─── GET: Single User ─────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: "فشل في جلب المستخدم" }, { status: 500 });
  }
}

// ─── PUT: Update User ─────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, role, password } = body;

    const updateData: any = {};
    if (name?.trim()) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: "فشل في تعديل المستخدم" }, { status: 500 });
  }
}

// ─── DELETE: Delete User ──────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    // Prevent deleting the last admin
    const admins = await prisma.user.count({ where: { role: "admin" } });
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === "admin" && admins <= 1) {
      return NextResponse.json(
        { error: "لا يمكن حذف آخر مدير في النظام" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "فشل في حذف المستخدم" }, { status: 500 });
  }
}
