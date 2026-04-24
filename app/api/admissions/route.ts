import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;

    const cycles = await prisma.admissionCycle.findMany({
      where: { tenantId },
      include: {
        academicYear: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error("GET /api/admissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

    const cycle = await prisma.admissionCycle.create({
      data: {
        tenantId,
        academicYearId: body.academicYearId,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        totalSeats: parseInt(body.totalSeats) || 0,
        status: body.status || "DRAFT",
        eligibilityRules: body.eligibilityRules || {},
        formConfig: body.formConfig || [],
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error("POST /api/admissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
