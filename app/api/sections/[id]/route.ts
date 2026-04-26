import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { id: sectionId } = await params;
    const { gradeId, academicYearId, name, capacity, classTeacherId, roomNumber } = body;

    // Check existing
    const existing = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!existing || existing.tenantId !== tenantId || existing.deletedAt) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (name && (name !== existing.name || gradeId !== existing.gradeId || academicYearId !== existing.academicYearId)) {
        const dup = await prisma.section.findFirst({
            where: {
                tenantId,
                academicYearId: academicYearId || existing.academicYearId,
                gradeId: gradeId || existing.gradeId,
                name: name
            }
        });
        if (dup && dup.id !== sectionId && !dup.deletedAt) {
            return NextResponse.json({ error: `Section ${name} already exists for this grade and academic year.` }, { status: 400 });
        }
    }

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        gradeId,
        academicYearId,
        name,
        capacity: capacity ? parseInt(capacity.toString()) : undefined,
        classTeacherId,
        roomNumber
      }
    });

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const { id: sectionId } = await params;

    // Check if there are active enrollments
    const enrollmentsCount = await prisma.enrollment.count({
        where: {
            sectionId: sectionId,
            status: "ACTIVE"
        }
    });

    if (enrollmentsCount > 0) {
        return NextResponse.json({ error: "Cannot delete section with active enrollments" }, { status: 400 });
    }

    await prisma.section.update({
      where: { id: sectionId, tenantId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
