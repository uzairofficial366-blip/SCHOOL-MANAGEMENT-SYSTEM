import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { findTimetableConflicts, isValidTimeRange, timetableConflictMessage } from "@/lib/timetable-conflicts";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSlotSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  staffId: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().trim().optional().nullable(),
});

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const { id } = await props.params;
    const existing = await prisma.timetableSlot.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    const parsed = updateSlotSchema.safeParse(await req.json());
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
      excludeSlotId: id,
    }));
    if (conflictMessage) {
      return NextResponse.json({ error: conflictMessage }, { status: 409 });
    }

    const slot = await prisma.timetableSlot.update({
      where: { id },
      data: {
        sectionId,
        subjectId,
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        room: room?.trim() || null,
      },
      include: {
        section: { include: { grade: true, classTeacher: { include: { user: { select: { name: true } } } } } },
        subject: true,
        staff: { include: { user: true } },
      },
    });

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
