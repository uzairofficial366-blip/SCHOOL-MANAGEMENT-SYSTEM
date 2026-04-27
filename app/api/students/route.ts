import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

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

    if (!body.name || !body.email || !body.gender || !body.dateOfBirth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({ where: { tenantId, email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const studentCount = await prisma.student.count({ where: { tenantId } });
    const admissionNo = `STD-${new Date().getFullYear()}-${String(studentCount + 1).padStart(4, "0")}`;

    const defaultPassword = "password123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: body.name,
        email: body.email,
        passwordHash,
        role: "STUDENT",
      }
    });

    const student = await prisma.student.create({
      data: {
        tenantId,
        userId: user.id,
        admissionNo,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
      }
    });

    if (body.parentName) {
      await prisma.guardian.create({
        data: {
          tenantId,
          studentId: student.id,
          name: body.parentName,
          relation: "Parent",
          phone: body.parentPhone || "000-000-0000",
          email: body.parentEmail || body.email,
        }
      });
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
