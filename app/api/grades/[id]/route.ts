import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    const { id: gradeId } = await params;
    const { name, level, description } = body;

    const existing = await prisma.grade.findUnique({ where: { id: gradeId } });

    if (!existing || existing.tenantId !== tenantId || existing.deletedAt) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    const numericLevel = level !== undefined ? parseInt(level.toString(), 10) : existing.level;

    if (numericLevel !== existing.level) {
      const dup = await prisma.grade.findUnique({
        where: {
          tenantId_level: {
            tenantId,
            level: numericLevel
          }
        }
      });
      if (dup && dup.id !== gradeId && !dup.deletedAt) {
        return NextResponse.json({ error: `A grade with level ${numericLevel} already exists.` }, { status: 400 });
      }
    }

    const grade = await prisma.grade.update({
      where: { id: gradeId },
      data: {
        name,
        level: numericLevel,
        description
      }
    });

    return NextResponse.json({ success: true, grade });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const { id: gradeId } = await params;

    // Check if there are active sections
    const sectionsCount = await prisma.section.count({
      where: {
        gradeId,
        deletedAt: null
      }
    });

    if (sectionsCount > 0) {
      return NextResponse.json({ error: "Cannot delete grade with active sections. Delete or move the sections first." }, { status: 400 });
    }

    await prisma.grade.update({
      where: { id: gradeId, tenantId },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
