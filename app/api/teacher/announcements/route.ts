import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function serializeAnnouncement(announcement: any) {
  return {
    ...announcement,
    targetRoles:
      typeof announcement.targetRoles === "string"
        ? JSON.parse(announcement.targetRoles)
        : announcement.targetRoles,
  };
}

async function getTeacherContext() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const tenantId = session.user.tenantId as string;
  const userId = session.user.id as string;
  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) {
    return { error: NextResponse.json({ error: "Teacher profile not found" }, { status: 404 }) };
  }

  return { session, tenantId, userId, staff };
}

async function getAssignedSections(tenantId: string, staffId: string) {
  return prisma.section.findMany({
    where: {
      tenantId,
      deletedAt: null,
      OR: [
        { classTeacherId: staffId },
        { subjectAllocations: { some: { tenantId, staffId } } },
      ],
    },
    include: { grade: true },
    orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
  });
}

export async function GET() {
  try {
    const context = await getTeacherContext();
    if (context.error) return context.error;

    const { tenantId, userId, staff } = context;
    const [assignedSections, announcements] = await Promise.all([
      getAssignedSections(tenantId, staff.id),
      prisma.announcement.findMany({
        where: { tenantId, createdById: userId },
        include: { grade: true, section: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      assignedSections: assignedSections.map((section) => ({
        id: section.id,
        name: section.name,
        gradeId: section.gradeId,
        gradeName: section.grade.name,
        label: `${section.grade.name} - ${section.name}`,
      })),
      announcements: announcements.map(serializeAnnouncement),
    });
  } catch (error: any) {
    console.error("GET /api/teacher/announcements error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getTeacherContext();
    if (context.error) return context.error;

    const { session, tenantId, userId, staff } = context;
    const body = await req.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || body.message || "").trim();
    const sectionId = String(body.sectionId || "").trim();
    const gradeId = String(body.gradeId || "").trim();

    if (!title || !content || !sectionId || !gradeId) {
      return NextResponse.json(
        { error: "Title, message, class, and section are required" },
        { status: 400 }
      );
    }

    const assignedSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
        gradeId,
        tenantId,
        deletedAt: null,
        OR: [
          { classTeacherId: staff.id },
          { subjectAllocations: { some: { tenantId, staffId: staff.id } } },
        ],
      },
      include: { grade: true },
    });

    if (!assignedSection) {
      return NextResponse.json(
        { error: "You can only create announcements for your assigned classes/sections" },
        { status: 403 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        title,
        content,
        gradeId: assignedSection.gradeId,
        sectionId: assignedSection.id,
        targetRoles: JSON.stringify(["STUDENT", "PARENT"]),
        createdById: userId,
        createdByRole: session.user.role as string,
        publishedAt: new Date(),
      },
      include: { grade: true, section: true },
    });

    return NextResponse.json({
      success: true,
      announcement: serializeAnnouncement(announcement),
    });
  } catch (error: any) {
    console.error("POST /api/teacher/announcements error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
