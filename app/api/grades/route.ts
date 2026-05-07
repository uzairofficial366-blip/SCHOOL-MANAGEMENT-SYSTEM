import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.user?.tenantId as string;

    const grades = await prisma.grade.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { level: 'asc' }
    });

    return NextResponse.json({ grades });
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

    const { name, level, description } = body;

    if (!name || level === undefined) {
      return NextResponse.json({ error: "Name and Level are required" }, { status: 400 });
    }

    const numericLevel = parseInt(level.toString(), 10);
    if (isNaN(numericLevel)) {
      return NextResponse.json({ error: "Level must be a valid number" }, { status: 400 });
    }

    // Check unique constraint on [tenantId, level]
    const existing = await prisma.grade.findUnique({
      where: {
        tenantId_level: {
          tenantId,
          level: numericLevel
        }
      }
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json({ error: `A grade with level ${numericLevel} already exists.` }, { status: 400 });
    } else if (existing && existing.deletedAt) {
      // Restore deleted
      const grade = await prisma.grade.update({
        where: { id: existing.id },
        data: { name, description, deletedAt: null }
      });
      return NextResponse.json({ success: true, grade });
    }

    const grade = await prisma.grade.create({
      data: {
        tenantId,
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
