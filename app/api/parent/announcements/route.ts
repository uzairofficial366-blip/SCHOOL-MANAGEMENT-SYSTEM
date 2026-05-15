import { NextResponse } from "next/server";
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
    return value.split(",").map((role) => role.trim());
  }
  return [];
}

function announcementMatchesChildScope(
  announcement: { gradeId: string | null; sectionId: string | null; targetRoles: unknown },
  gradeIds: Set<string>,
  sectionIds: Set<string>
) {
  const roles = parseRoles(announcement.targetRoles);
  const isSchoolWide = !announcement.gradeId && !announcement.sectionId;
  if (isSchoolWide) return roles.includes("PARENT") || roles.includes("ALL");

  const matchesSection = Boolean(announcement.sectionId && sectionIds.has(announcement.sectionId));
  const matchesGrade = Boolean(announcement.gradeId && gradeIds.has(announcement.gradeId));
  return (matchesSection || matchesGrade) && (roles.includes("PARENT") || roles.includes("STUDENT") || roles.includes("ALL"));
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = session.user?.id as string;
    const now = new Date();
    const guardians = await prisma.guardian.findMany({
      where: { tenantId, userId },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { section: true },
            },
          },
        },
      },
    });

    const gradeIds = new Set<string>();
    const sectionIds = new Set<string>();
    guardians.forEach((guardian) => {
      guardian.student.enrollments.forEach((enrollment) => {
        gradeIds.add(enrollment.section.gradeId);
        sectionIds.add(enrollment.sectionId);
      });
    });

    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      include: {
        grade: true,
        section: true,
        createdBy: { select: { name: true, role: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      announcements: announcements
        .filter((announcement) => announcementMatchesChildScope(announcement, gradeIds, sectionIds))
        .map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.content,
          date: announcement.publishedAt?.toISOString() ?? announcement.createdAt.toISOString(),
          createdBy: announcement.createdBy?.name ?? "School Administration",
          target: announcement.section
            ? `${announcement.grade?.name ?? "Class"} - ${announcement.section.name}`
            : announcement.grade
              ? announcement.grade.name
              : "Parents / Whole school",
        })),
    });
  } catch (error: any) {
    console.error("GET /api/parent/announcements error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
