import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { findTimetableConflicts, isValidTimeRange, timetableConflictMessage } from "@/lib/timetable-conflicts";
import { z } from "zod";

export const dynamic = "force-dynamic";

const slotSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  staffId: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const role = session.user?.role;

    const whereClause: any = { tenantId };

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    // Role-based filtering
    if (role === 'TEACHER') {
      const userId = (session.user as any)?.id;
      if (!userId) return NextResponse.json({ error: "Missing User ID in session" }, { status: 401 });
      
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) {
        whereClause.staffId = staff.id;
      } else {
        return NextResponse.json({ slots: [] });
      }
    } else if (role === 'STUDENT') {
      const userId = (session.user as any)?.id;
      if (!userId) return NextResponse.json({ error: "Missing User ID in session" }, { status: 401 });

      const student = await prisma.student.findUnique({ 
        where: { userId },
        include: { enrollments: { where: { status: 'ACTIVE' } } }
      });
      if (student && student.enrollments.length > 0) {
        whereClause.sectionId = student.enrollments[0].sectionId;
      } else {
        return NextResponse.json({ slots: [] });
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
    const parsed = slotSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid timetable slot details" }, { status: 400 });
    }

    const { sectionId, subjectId, staffId, dayOfWeek, startTime, endTime, room } = parsed.data;
    if (!isValidTimeRange(startTime, endTime)) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const [section, subject, staffMember] = await Promise.all([
      prisma.section.findFirst({ where: { id: sectionId, tenantId, deletedAt: null } }),
      prisma.subject.findFirst({ where: { id: subjectId, tenantId, deletedAt: null } }),
      prisma.staff.findFirst({ where: { id: staffId, tenantId, deletedAt: null } }),
    ]);
    if (!section || !subject || !staffMember) {
      return NextResponse.json({ error: "Selected section, subject, or teacher was not found." }, { status: 404 });
    }

    const conflictMessage = timetableConflictMessage(await findTimetableConflicts({
      tenantId,
      sectionId,
      staffId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    }));
    if (conflictMessage) {
      return NextResponse.json({ error: conflictMessage }, { status: 409 });
    }

    const slot = await prisma.timetableSlot.create({
      data: {
        tenantId,
        sectionId,
        subjectId,
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        room: room?.trim() || null
      },
      include: {
        section: { 
          include: { 
            grade: true,
            classTeacher: { include: { user: { select: { name: true } } } }
          } 
        },
        subject: true,
        staff: { include: { user: true } }
      }
    });

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
