import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId");

    let studentIds: string[] | undefined;
    if (sectionId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { tenantId, sectionId, status: "ACTIVE" },
        select: { studentId: true },
      });
      studentIds = enrollments.map((e) => e.studentId);
    }

    const students = await prisma.student.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(studentIds !== undefined ? { id: { in: studentIds } } : {}),
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { admissionNo: "asc" },
    });

    return NextResponse.json({ students });
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
    const studentInput = body.student ?? body;
    const parentMode = body.parentMode as "create" | "existing" | undefined;
    const parentInput = body.parent ?? {};

    if (!studentInput.name || !studentInput.email || !studentInput.gender || !studentInput.dateOfBirth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (parentMode === "create") {
      if (!parentInput.name?.trim() || !parentInput.email?.trim() || !parentInput.password) {
        return NextResponse.json({ error: "Parent name, email/login ID, and password are required" }, { status: 400 });
      }
    }

    if (parentMode === "existing" && !body.existingParentId) {
      return NextResponse.json({ error: "Existing parent is required" }, { status: 400 });
    }

    const studentEmail = String(studentInput.email).trim().toLowerCase();

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({ where: { tenantId, email: studentEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let parentUserId: string | null = null;
      let parentProfile: {
        name: string;
        relation: string;
        phone: string;
        email: string | null;
      } | null = null;

      if (parentMode === "create") {
        const parentEmail = String(parentInput.email).trim().toLowerCase();
        const duplicateParent = await tx.user.findFirst({
          where: { tenantId, email: parentEmail, deletedAt: null },
          select: { id: true },
        });

        if (duplicateParent) {
          throw new ResponseError("Parent email/login ID is already registered", 409);
        }

        const parentPasswordHash = await bcrypt.hash(String(parentInput.password), 10);
        const parentUser = await tx.user.create({
          data: {
            tenantId,
            name: String(parentInput.name).trim(),
            email: parentEmail,
            phone: parentInput.phone?.trim() || null,
            passwordHash: parentPasswordHash,
            role: "PARENT",
          },
        });

        parentUserId = parentUser.id;
        parentProfile = {
          name: parentUser.name,
          relation: parentInput.relationship?.trim() || "Parent",
          phone: parentInput.phone?.trim() || "000-000-0000",
          email: parentUser.email,
        };
      }

      if (parentMode === "existing") {
        const existingParent = await tx.guardian.findFirst({
          where: {
            id: body.existingParentId,
            tenantId,
            userId: { not: null },
            user: { role: "PARENT", isActive: true, deletedAt: null },
          },
          include: { user: { select: { id: true, email: true, name: true, phone: true } } },
        });

        if (!existingParent || !existingParent.user) {
          throw new ResponseError("Parent account not found in this school", 400);
        }

        parentUserId = existingParent.user.id;
        parentProfile = {
          name: existingParent.name || existingParent.user.name,
          relation: existingParent.relation || "Parent",
          phone: existingParent.phone || existingParent.user.phone || "000-000-0000",
          email: existingParent.email || existingParent.user.email,
        };
      }

      const studentCount = await tx.student.count({ where: { tenantId } });
      const admissionNo = `STD-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, "0")}`;

      const defaultPassword = "password123";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      const user = await tx.user.create({
        data: {
          tenantId,
          name: String(studentInput.name).trim(),
          email: studentEmail,
          passwordHash,
          role: "STUDENT",
        }
      });

      const student = await tx.student.create({
        data: {
          tenantId,
          userId: user.id,
          admissionNo,
          dateOfBirth: new Date(studentInput.dateOfBirth),
          gender: studentInput.gender,
        }
      });

      let guardian = null;
      if (parentProfile) {
        guardian = await tx.guardian.create({
          data: {
            tenantId,
            studentId: student.id,
            name: parentProfile.name,
            relation: parentProfile.relation,
            phone: parentProfile.phone,
            email: parentProfile.email,
            isEmergency: true,
            userId: parentUserId,
          },
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        });
      } else if (studentInput.parentName) {
        guardian = await tx.guardian.create({
          data: {
            tenantId,
            studentId: student.id,
            name: studentInput.parentName,
            relation: "Parent",
            phone: studentInput.parentPhone || "000-000-0000",
            email: studentInput.parentEmail || studentEmail,
          }
        });
      }

      if (studentInput.sectionId && studentInput.academicYearId) {
        await tx.enrollment.create({
          data: {
            tenantId,
            studentId: student.id,
            sectionId: studentInput.sectionId,
            academicYearId: studentInput.academicYearId,
          },
        });
      }

      return {
        student: {
          id: student.id,
          admissionNo: student.admissionNo,
          user: { id: user.id, name: user.name, email: user.email },
        },
        parent: guardian
          ? {
              id: guardian.id,
              name: guardian.name,
              email: guardian.email,
              phone: guardian.phone,
              relationship: guardian.relation,
              userId: guardian.userId,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof ResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A record with these unique details already exists" }, { status: 409 });
    }
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

class ResponseError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
