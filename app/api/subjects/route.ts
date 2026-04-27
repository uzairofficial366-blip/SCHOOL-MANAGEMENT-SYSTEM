import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.user?.tenantId as string;

    const subjects = await prisma.subject.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        allocations: {
          include: {
            section: {
              include: { grade: true }
            },
            staff: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ subjects });
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

    const { name, code, creditHours, description, allocations } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Name and Code are required" }, { status: 400 });
    }

    // Upsert Subject
    let subject = await prisma.subject.findFirst({
      where: { tenantId, code, deletedAt: null }
    });

    if (subject) {
      subject = await prisma.subject.update({
        where: { id: subject.id },
        data: { name, creditHours: Number(creditHours || 1), description }
      });
    } else {
      subject = await prisma.subject.create({
        data: {
          tenantId,
          name,
          code,
          creditHours: Number(creditHours || 1),
          description
        }
      });
    }

    // Handle Allocations
    if (allocations && Array.isArray(allocations)) {
      // Clear existing allocations for this subject (or do a smarter diff)
      await prisma.subjectAllocation.deleteMany({
        where: { subjectId: subject.id, tenantId }
      });

      if (allocations.length > 0) {
        await prisma.subjectAllocation.createMany({
          data: allocations.map((alloc: any) => ({
            tenantId,
            subjectId: subject.id,
            sectionId: alloc.sectionId,
            staffId: alloc.staffId
          }))
        });
      }
    }

    return NextResponse.json({ success: true, subject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
