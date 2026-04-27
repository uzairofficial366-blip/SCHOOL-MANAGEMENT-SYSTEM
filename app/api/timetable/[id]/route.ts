import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const tenantId = session.user?.tenantId as string;
    const { id } = await props.params;
    
    // Ensure the slot exists and belongs to the tenant
    const slot = await prisma.timetableSlot.findUnique({ where: { id } });
    
    if (!slot || slot.tenantId !== tenantId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    await prisma.timetableSlot.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
