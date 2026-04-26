import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.user?.tenantId as string;

    const { searchParams } = new URL(req.url);
    const gradeId = searchParams.get("gradeId");
    const academicYearId = searchParams.get("academicYearId");

    const sections = await prisma.section.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(gradeId ? { gradeId } : {}),
        ...(academicYearId ? { academicYearId } : {})
      },
      include: {
        grade: true,
        academicYear: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: [
        { grade: { level: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Also get teacher info - since classTeacherId stores staffId
    const teacherIds = sections.map(s => s.classTeacherId).filter(Boolean) as string[];
    const teachers = await prisma.staff.findMany({
      where: { id: { in: teacherIds } },
      include: { user: { select: { name: true } } }
    });

    const teacherMap = teachers.reduce((acc, t) => {
      acc[t.id] = t.user.name;
      return acc;
    }, {} as Record<string, string>);

    const enrichedSections = sections.map(s => ({
      ...s,
      classTeacherName: s.classTeacherId ? teacherMap[s.classTeacherId] : null
    }));

    return NextResponse.json({ sections: enrichedSections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { gradeId, academicYearId, name, capacity, classTeacherId, roomNumber } = body;

    if (!gradeId || !academicYearId || !name) {
      return NextResponse.json({ error: "gradeId, academicYearId, and name are required" }, { status: 400 });
    }

    // Check unique constraint manually to provide better error
    const existing = await prisma.section.findFirst({
      where: {
        tenantId,
        academicYearId,
        gradeId,
        name
      }
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json({ error: `Section ${name} already exists for this grade and academic year.` }, { status: 400 });
    } else if (existing && existing.deletedAt) {
        // Restore deleted if needed or just create a new one? Better to fail or restore
        return NextResponse.json({ error: `Section ${name} was previously deleted. Please restore or use a different name.` }, { status: 400 });
    }

    const section = await prisma.section.create({
      data: {
        tenantId,
        gradeId,
        academicYearId,
        name,
        capacity: capacity ? parseInt(capacity) : 40,
        classTeacherId,
        roomNumber
      }
    });

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
