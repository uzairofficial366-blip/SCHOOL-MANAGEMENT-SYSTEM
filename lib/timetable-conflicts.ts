import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type TimetableConflictInput = {
  tenantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  staffId?: string;
  sectionId?: string;
  room?: string | null;
  excludeSlotId?: string;
};

export function isValidTimeRange(startTime: string, endTime: string) {
  return /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime < endTime;
}

export async function findTimetableConflicts(input: TimetableConflictInput) {
  const overlap: Prisma.TimetableSlotWhereInput = {
    dayOfWeek: input.dayOfWeek,
    startTime: { lt: input.endTime },
    endTime: { gt: input.startTime },
  };

  const baseWhere: Prisma.TimetableSlotWhereInput = {
    tenantId: input.tenantId,
    ...(input.excludeSlotId ? { id: { not: input.excludeSlotId } } : {}),
    ...overlap,
  };

  const [teacherSlot, sectionSlot, roomSlot] = await Promise.all([
    input.staffId
      ? prisma.timetableSlot.findFirst({
          where: { ...baseWhere, staffId: input.staffId },
          include: { staff: { include: { user: { select: { name: true } } } } },
        })
      : null,
    input.sectionId
      ? prisma.timetableSlot.findFirst({
          where: { ...baseWhere, sectionId: input.sectionId },
          include: { section: { include: { grade: true } } },
        })
      : null,
    input.room?.trim()
      ? prisma.timetableSlot.findFirst({
          where: { ...baseWhere, room: { equals: input.room.trim(), mode: "insensitive" } },
        })
      : null,
  ]);

  return { teacherSlot, sectionSlot, roomSlot };
}

export function timetableConflictMessage(conflicts: Awaited<ReturnType<typeof findTimetableConflicts>>) {
  if (conflicts.teacherSlot) return "This teacher is already assigned in this time slot.";
  if (conflicts.sectionSlot) return "This section already has a class during this time.";
  if (conflicts.roomSlot) return "This room is already occupied.";
  return null;
}
