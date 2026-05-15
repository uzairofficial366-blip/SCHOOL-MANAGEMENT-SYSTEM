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
    const search = searchParams.get("search")?.trim() ?? "";

    const guardians = await prisma.guardian.findMany({
      where: {
        tenantId,
        userId: { not: null },
        user: { role: "PARENT", isActive: true, deletedAt: null },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { name: "asc" },
      take: 25,
    });

    const seen = new Set<string>();
    const parents = guardians
      .filter((guardian) => {
        if (!guardian.userId || seen.has(guardian.userId)) return false;
        seen.add(guardian.userId);
        return true;
      })
      .map((guardian) => ({
        parentId: guardian.id,
        userId: guardian.userId,
        name: guardian.name || guardian.user?.name,
        email: guardian.email || guardian.user?.email,
        phone: guardian.phone || guardian.user?.phone,
        relationship: guardian.relation,
      }));

    return NextResponse.json({ parents });
  } catch (error: any) {
    console.error("GET /api/parents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
