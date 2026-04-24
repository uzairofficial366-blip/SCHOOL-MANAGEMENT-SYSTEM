import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = { tenantId };
    if (cycleId) where.cycleId = cycleId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { applicationNo: { contains: search, mode: "insensitive" } },
        { parentName: { contains: search, mode: "insensitive" } },
        { parentEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.admissionApplication.findMany({
      where,
      include: {
        cycle: { select: { name: true } },
        documents: { select: { id: true, docType: true, status: true } },
        reviews: {
          select: { id: true, decision: true, reviewerId: true, completedAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { documents: true, reviews: true, fees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("GET /api/admissions/applications error:", error);
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

    // Generate unique application number
    const year = new Date().getFullYear();
    const count = await prisma.admissionApplication.count({
      where: { tenantId, cycleId: body.cycleId },
    });
    const applicationNo = `APP-${year}-${String(count + 1).padStart(4, "0")}`;

    const application = await prisma.admissionApplication.create({
      data: {
        tenantId,
        cycleId: body.cycleId,
        applicationNo,
        studentName: body.studentName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        parentName: body.parentName,
        parentEmail: body.parentEmail,
        parentPhone: body.parentPhone,
        gradeAppliedFor: body.gradeAppliedFor,
        previousSchool: body.previousSchool,
        formData: body.formData || {},
        status: body.status || "DRAFT",
        siblingInfo: body.siblingInfo,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("POST /api/admissions/applications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
