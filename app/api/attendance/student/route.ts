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

    const userId = (session.user as any).id;
    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let whereClause: any = { studentId: student.id };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        takenBy: { include: { user: { select: { name: true } } } }
      }
    });

    // Monthly summary
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        date: { gte: currentMonthStart, lte: currentMonthEnd }
      }
    });

    const monthlySummary = {
      present: monthlyRecords.filter(r => r.status === 'PRESENT').length,
      absent: monthlyRecords.filter(r => r.status === 'ABSENT').length,
      late: monthlyRecords.filter(r => r.status === 'LATE').length,
      excused: monthlyRecords.filter(r => r.status === 'EXCUSED').length,
      total: monthlyRecords.length
    };

    // Overall percentage (Academic Year)
    const overallRecords = await prisma.attendanceRecord.count({ where: { studentId: student.id } });
    const presentRecords = await prisma.attendanceRecord.count({ 
      where: { 
        studentId: student.id, 
        status: { in: ['PRESENT', 'LATE', 'EXCUSED'] } 
      } 
    });

    const overallPercentage = overallRecords > 0 ? (presentRecords / overallRecords) * 100 : 100;

    return NextResponse.json({ 
      records, 
      monthlySummary, 
      overallPercentage: overallPercentage.toFixed(1) 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
