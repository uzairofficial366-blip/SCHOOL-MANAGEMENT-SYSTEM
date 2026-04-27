import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;

    // Get Teachers and Admins for this tenant
    const contacts = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ["TEACHER", "ADMIN", "SUPER_ADMIN"] },
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
