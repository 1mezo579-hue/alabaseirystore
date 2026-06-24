import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET: All Settings ────────────────────────────────────────────────────────
export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const obj: Record<string, string> = {};
    settings.forEach((s) => (obj[s.key] = s.value));
    return NextResponse.json(obj);
  } catch (e: any) {
    return NextResponse.json({ error: "فشل في جلب الإعدادات" }, { status: 500 });
  }
}

// ─── PUT: Update Settings ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = Object.entries(body) as [string, string][];

    for (const [key, value] of updates) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 });
  }
}
