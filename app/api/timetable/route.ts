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
    const sectionId = searchParams.get('sectionId');
    const role = session.user?.role;

    let whereClause: any = { tenantId };

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    // Role-based filtering
    if (role === 'TEACHER') {
      const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
      if (staff) {
        whereClause.staffId = staff.id;
      }
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ 
        where: { userId: session.user.id },
        include: { enrollments: { where: { status: 'ACTIVE' } } }
      });
      if (student && student.enrollments.length > 0) {
        whereClause.sectionId = student.enrollments[0].sectionId;
      } else {
        return NextResponse.json({ slots: [] }); // Student with no active enrollment
      }
    }

    const slots = await prisma.timetableSlot.findMany({
      where: whereClause,
      include: {
        section: { 
          include: { 
            grade: true,
            classTeacher: { include: { user: { select: { name: true } } } }
          } 
        },
        subject: true,
        staff: { include: { user: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json({ slots });
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

    const { sectionId, subjectId, staffId, dayOfWeek, startTime, endTime, room } = body;

    if (!sectionId || !subjectId || !staffId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Optional: Check for conflicts (same teacher same time, or same room same time)
    const existingTeacherSlot = await prisma.timetableSlot.findFirst({
      where: {
        tenantId, staffId, dayOfWeek: Number(dayOfWeek),
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } }
        ]
      }
    });

    if (existingTeacherSlot) {
      return NextResponse.json({ error: "Teacher is already booked for this time slot" }, { status: 400 });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        tenantId,
        sectionId,
        subjectId,
        staffId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room
      },
      include: {
        section: { include: { grade: true } },
        subject: true,
        staff: { include: { user: true } }
      }
    });

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
