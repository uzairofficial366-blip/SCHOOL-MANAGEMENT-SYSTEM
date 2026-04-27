import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = (session.user as any).id;

    // Find student and their section
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { enrollments: { where: { status: 'ACTIVE' } } }
    });

    if (!student || student.enrollments.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    const sectionId = student.enrollments[0].sectionId;

    // Fetch assignments for the subjects allocated to this section
    // We'll fetch all assignments for now, and filter by subject allocations
    const subjectAllocations = await prisma.subjectAllocation.findMany({
      where: { sectionId },
      select: { subjectId: true }
    });

    const subjectIds = subjectAllocations.map(s => s.subjectId);

    const assignments = await prisma.assignment.findMany({
      where: {
        tenantId,
        content: {
          subjectId: { in: subjectIds }
        },
        deletedAt: null
      },
      include: {
        content: {
          include: {
            subject: true
          }
        },
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
