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
    const userId = (session.user as any).id;

    // Find student
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        libraryCards: {
          where: { isActive: true },
          include: {
            issues: {
              where: { returnedAt: null },
              include: { book: true }
            }
          }
        }
      }
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // History (last 10 returned books)
    const history = await prisma.bookIssue.findMany({
      where: {
        card: { studentId: student.id },
        returnedAt: { not: null }
      },
      include: { book: true },
      orderBy: { returnedAt: 'desc' },
      take: 10
    });

    // Library Catalog
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || "";
    
    const catalog = await prisma.book.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      },
      take: 20
    });

    return NextResponse.json({ 
      myBooks: student.libraryCards?.[0]?.issues || [], 
      history,
      catalog,
      libraryCard: student.libraryCards?.[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
