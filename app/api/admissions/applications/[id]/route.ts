import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const tenantId = session.user?.tenantId as string;

    const application = await prisma.admissionApplication.findFirst({
      where: { id, tenantId },
      include: {
        cycle: true,
        documents: { orderBy: { uploadedAt: "desc" } },
        reviews: { orderBy: { createdAt: "desc" } },
        fees: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/admissions/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    // Build update data
    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "SUBMITTED") updateData.submittedAt = new Date();
      if (body.status === "APPROVED") updateData.approvedAt = new Date();
      if (body.status === "REJECTED") updateData.rejectionReason = body.rejectionReason;
    }
    if (body.studentName) updateData.studentName = body.studentName;
    if (body.parentName) updateData.parentName = body.parentName;
    if (body.parentEmail) updateData.parentEmail = body.parentEmail;
    if (body.parentPhone) updateData.parentPhone = body.parentPhone;
    if (body.gradeAppliedFor) updateData.gradeAppliedFor = body.gradeAppliedFor;
    if (body.previousSchool !== undefined) updateData.previousSchool = body.previousSchool;
    if (body.formData) updateData.formData = body.formData;
    if (body.priorityScore !== undefined) updateData.priorityScore = body.priorityScore;
    if (body.waitlistPosition !== undefined) updateData.waitlistPosition = body.waitlistPosition;

    const currentApp = await prisma.admissionApplication.findUnique({ where: { id } });
    if (!currentApp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const application = await prisma.admissionApplication.update({
      where: { id },
      data: updateData,
    });

    // If approved, increment filled seats
    if (body.status === "APPROVED" && currentApp.status !== "APPROVED") {
      await prisma.admissionCycle.update({
        where: { id: application.cycleId },
        data: { filledSeats: { increment: 1 } },
      });
    }

    // Auto-enroll into People (Student) if transitioning to ENROLLED
    if (body.status === "ENROLLED" && currentApp.status !== "ENROLLED") {
      const studentCount = await prisma.student.count({ where: { tenantId } });
      const admissionNo = `STD-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, "0")}`;
      
      const user = await prisma.user.create({
        data: {
          tenantId,
          name: application.studentName,
          email: `${admissionNo.toLowerCase()}@school.edu`,
          role: "STUDENT",
        }
      });

      const student = await prisma.student.create({
        data: {
          tenantId,
          userId: user.id,
          admissionNo,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
        }
      });

      await prisma.guardian.create({
        data: {
          tenantId,
          studentId: student.id,
          name: application.parentName,
          relation: "Parent",
          phone: application.parentPhone,
          email: application.parentEmail,
        }
      });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("PATCH /api/admissions/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    await prisma.admissionApplication.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admissions/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
