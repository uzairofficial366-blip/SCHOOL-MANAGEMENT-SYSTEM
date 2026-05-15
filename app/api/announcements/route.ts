import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function parseRoles(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return value.split(",").map((role) => role.trim()).filter(Boolean);
  }
  return [];
}

function serializeAnnouncement(announcement: any) {
  return {
    ...announcement,
    targetRoles: parseRoles(announcement.targetRoles),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const tenantId = session.user?.tenantId as string;
    const userRole = session.user?.role as string;
    const now = new Date();

    let studentScope: { gradeIds: Set<string>; sectionIds: Set<string> } | null = null;
    if (userRole === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { tenantId, userId: session.user?.id as string, deletedAt: null },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { section: true },
          },
        },
      });

      studentScope = {
        gradeIds: new Set(student?.enrollments.map((e) => e.section.gradeId) ?? []),
        sectionIds: new Set(student?.enrollments.map((e) => e.sectionId) ?? []),
      };
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      include: { grade: true, section: true, createdBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Filter based on roles
    const filteredAnnouncements = announcements.filter(ann => {
      // Admins see everything
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

      const targetRoles = parseRoles(ann.targetRoles);
      const targetsRole = targetRoles.includes("ALL") || targetRoles.includes(userRole);

      if (userRole === "STUDENT") {
        if (!targetsRole || !studentScope) return false;
        const isSchoolWide = !ann.gradeId && !ann.sectionId;
        const matchesSection = Boolean(ann.sectionId && studentScope.sectionIds.has(ann.sectionId));
        const matchesGrade = Boolean(ann.gradeId && studentScope.gradeIds.has(ann.gradeId));
        return isSchoolWide || matchesSection || matchesGrade;
      }

      if (userRole === "TEACHER" && targetsRole) return true;

      // If the user is neither student nor teacher, they are considered "Other Staff"
      if (userRole !== "STUDENT" && userRole !== "TEACHER" && targetRoles.includes("STAFF")) return true;

      return false;
    });

    return NextResponse.json({ announcements: filteredAnnouncements.map(serializeAnnouncement) });
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

    const { title, content, targetRoles } = body;

    if (!title || !content || !Array.isArray(targetRoles)) {
      return NextResponse.json({ error: "Title, content, and valid targetRoles are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        title,
        content,
        targetRoles: JSON.stringify(targetRoles),
        createdById: session.user?.id as string,
        createdByRole: session.user?.role as string,
        publishedAt: new Date()
      },
      include: { grade: true, section: true, createdBy: { select: { name: true, role: true } } },
    });

    // Parse back before sending response
    const responseData = serializeAnnouncement(announcement);

    return NextResponse.json({ success: true, announcement: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
