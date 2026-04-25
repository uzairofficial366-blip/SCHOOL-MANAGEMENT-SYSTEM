import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user?.tenantId as string;
    const body = await req.json();

    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ error: "Missing required fields: name, email, role" }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({ where: { tenantId, email: body.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // Generate Employee ID
    const staffCount = await prisma.staff.count({ where: { tenantId } });
    const employeeId = `EMP-${new Date().getFullYear()}-${String(staffCount + 1).padStart(4, "0")}`;

    const defaultPassword = "password123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Extract role
    const role = body.role; // TEACHER, ACCOUNTANT, DRIVER, etc.

    // Pack the rest of the fields into customFields
    const { name, email, phone, role: _, joinDate, department, designation, salary, ...rest } = body;

    const customFields = rest;

    // Create User
    const user = await prisma.user.create({
      data: {
        tenantId,
        name,
        email,
        phone,
        passwordHash,
        role: role,
        customFields: customFields as any,
      }
    });

    // Create Staff Profile
    const staff = await prisma.staff.create({
      data: {
        tenantId,
        userId: user.id,
        employeeId,
        department: department || "General",
        designation: designation || role,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        salary: salary ? parseFloat(salary) : 0,
        qualifications: customFields.qualifications || []
      }
    });

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
