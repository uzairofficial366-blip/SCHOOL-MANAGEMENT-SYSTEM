import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

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

    const currentApp = await prisma.admissionApplication.findUnique({ 
      where: { id },
      include: { cycle: true }
    });
    if (!currentApp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.admissionApplication.update({
        where: { id },
        data: updateData,
      });

      // If approved, increment filled seats
      if (body.status === "APPROVED" && currentApp.status !== "APPROVED") {
        await tx.admissionCycle.update({
          where: { id: application.cycleId },
          data: { filledSeats: { increment: 1 } },
        });
      }

      let parentLogin: null | { parentId: string; email: string; password: string; childId: string } = null;

      // Auto-enroll into People (Student) if transitioning to ENROLLED
      if (body.status === "ENROLLED" && currentApp.status !== "ENROLLED") {
        const studentCount = await tx.student.count({ where: { tenantId } });
        const admissionNo = `STD-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, "0")}`;
        const studentPasswordHash = await bcrypt.hash("password123", 10);
        const parentEmail = application.parentEmail.trim().toLowerCase();
        const parentDefaultPassword = "Parent@1234";
        const formData = (application.formData ?? {}) as Record<string, unknown>;
        const storedParentPasswordHash = typeof formData.parentPasswordHash === "string" ? formData.parentPasswordHash : null;
        const parentPasswordHash = storedParentPasswordHash ?? await bcrypt.hash(parentDefaultPassword, 10);

        const conflictingUser = await tx.user.findFirst({
          where: { tenantId, email: parentEmail, deletedAt: null },
          select: { id: true, role: true, name: true, email: true, phone: true },
        });

        if (conflictingUser && conflictingUser.role !== "PARENT") {
          throw new ResponseError("Parent email/login ID is already used by another role", 409);
        }

        const parentUser = conflictingUser ?? await tx.user.create({
          data: {
            tenantId,
            name: application.parentName,
            email: parentEmail,
            phone: application.parentPhone,
            passwordHash: parentPasswordHash,
            role: "PARENT",
          },
          select: { id: true, name: true, email: true, phone: true, role: true },
        });

        if (conflictingUser && !conflictingUser.phone && application.parentPhone) {
          await tx.user.update({
            where: { id: conflictingUser.id },
            data: { phone: application.parentPhone },
          });
        }

        const studentUser = await tx.user.create({
          data: {
            tenantId,
            name: application.studentName,
            email: `${admissionNo.toLowerCase()}@school.edu`,
            passwordHash: studentPasswordHash,
            role: "STUDENT",
          }
        });

        const student = await tx.student.create({
          data: {
            tenantId,
            userId: studentUser.id,
            admissionNo,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
          }
        });

        if (body.sectionId) {
          await tx.enrollment.create({
            data: {
              tenantId,
              studentId: student.id,
              sectionId: body.sectionId,
              academicYearId: currentApp.cycle.academicYearId,
              status: "ACTIVE"
            }
          });
        }

        const guardian = await tx.guardian.create({
          data: {
            tenantId,
            studentId: student.id,
            name: application.parentName,
            relation: "Parent",
            phone: application.parentPhone,
            email: parentEmail,
            isEmergency: true,
            userId: parentUser.id,
          }
        });

        parentLogin = {
          parentId: guardian.id,
          email: parentUser.email,
          password: conflictingUser ? "existing password" : (storedParentPasswordHash ? "password entered on application" : parentDefaultPassword),
          childId: student.id,
        };
      }

      return { application, parentLogin };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A student or user with these details already exists" }, { status: 409 });
    }
    console.error("PATCH /api/admissions/applications/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

class ResponseError extends Error {
  constructor(message: string, public status: number) {
    super(message);
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
