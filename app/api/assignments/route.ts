import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { sectionId, classTeacherId, allocations } = body;

    if (!sectionId) {
      return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
    }

    // 1. Update Section Class Teacher
    await prisma.section.update({
      where: { id: sectionId, tenantId },
      data: { classTeacherId: classTeacherId || null }
    });

    // 2. Update Subject Allocations
    if (allocations && Array.isArray(allocations)) {
      // Delete existing allocations for this section
      await prisma.subjectAllocation.deleteMany({
        where: { sectionId, tenantId }
      });

      // Create new allocations
      if (allocations.length > 0) {
        await prisma.subjectAllocation.createMany({
          data: allocations.filter((a: any) => a.subjectId && a.staffId).map((alloc: any) => ({
            tenantId,
            sectionId,
            subjectId: alloc.subjectId,
            staffId: alloc.staffId
          }))
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
