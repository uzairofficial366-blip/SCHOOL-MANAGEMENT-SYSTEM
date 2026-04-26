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

    const { studentId, sectionId, academicYearId } = body;

    if (!studentId || !sectionId || !academicYearId) {
      return NextResponse.json({ error: "studentId, sectionId, and academicYearId are required" }, { status: 400 });
    }

    // Capacity Check
    const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: {
            _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } }
            }
        }
    });

    if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (section._count.enrollments >= section.capacity) {
        return NextResponse.json({ error: `Capacity limit reached. Cannot enroll student. This section is full (${section.capacity}/${section.capacity}).` }, { status: 400 });
    }

    // Check existing enrollment for this academic year
    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            tenantId_studentId_academicYearId: {
                tenantId,
                studentId,
                academicYearId
            }
        }
    });

    if (existingEnrollment) {
        return NextResponse.json({ error: "Student is already enrolled in a section for this academic year." }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        tenantId,
        studentId,
        sectionId,
        academicYearId,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
