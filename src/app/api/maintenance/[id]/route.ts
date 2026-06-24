import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── PUT: Update maintenance order (status, payments, tech notes) ──────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) return NextResponse.json({ error: "معرّف طلب الصيانة غير صالح" }, { status: 400 });

    const body = await req.json();
    const { status, cost, paid, techNotes, deviceBrand, deviceModel, serialNo, problem } = body;

    // Fetch existing order first
    const existingOrder = await prisma.maintenanceOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "طلب الصيانة غير موجود" }, { status: 404 });
    }

    // Calculations for values
    const finalCost = cost !== undefined ? Number(cost) : existingOrder.cost;
    const finalPaid = paid !== undefined ? Number(paid) : existingOrder.paid;
    const finalRemaining = Math.max(0, finalCost - finalPaid);

    // Update DB
    const updatedOrder = await prisma.maintenanceOrder.update({
      where: { id },
      data: {
        status: status || existingOrder.status,
        cost: finalCost,
        paid: finalPaid,
        remaining: finalRemaining,
        techNotes: techNotes !== undefined ? techNotes : existingOrder.techNotes,
        deviceBrand: deviceBrand !== undefined ? deviceBrand.trim() : existingOrder.deviceBrand,
        deviceModel: deviceModel !== undefined ? deviceModel.trim() : existingOrder.deviceModel,
        serialNo: serialNo !== undefined ? serialNo.trim() || null : existingOrder.serialNo,
        problem: problem !== undefined ? problem.trim() : existingOrder.problem,
      },
    });

    // If order status changes to delivered, update customer's total spent to reward them
    if (status === "delivered" && existingOrder.status !== "delivered" && updatedOrder.customerId) {
      await prisma.customer.update({
        where: { id: updatedOrder.customerId },
        data: {
          totalSpent: { increment: updatedOrder.cost },
          points: { increment: Math.floor(updatedOrder.cost / 10) }, // 1 point for every 10 EGP spent
        },
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (e: any) {
    console.error("PUT maintenance order error:", e.message);
    return NextResponse.json({ error: "فشل في تحديث طلب الصيانة" }, { status: 500 });
  }
}

// ─── DELETE: Delete maintenance order ──────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) return NextResponse.json({ error: "معرّف طلب الصيانة غير صالح" }, { status: 400 });

    await prisma.maintenanceOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "طلب الصيانة غير موجود" }, { status: 404 });
    }
    console.error("DELETE maintenance order error:", e.message);
    return NextResponse.json({ error: "فشل في حذف طلب الصيانة" }, { status: 500 });
  }
}
