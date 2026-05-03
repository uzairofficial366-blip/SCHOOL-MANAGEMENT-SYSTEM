import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = session.user?.tenantId as string;
    const role = session.user?.role as string;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-04"
    const year = searchParams.get("year");

    const whereClause: any = { tenantId };

    // Date range filtering
    if (month) {
      const [y, m] = month.split("-").map(Number);
      whereClause.startDate = { gte: new Date(y, m - 1, 1) };
      whereClause.endDate = { lte: new Date(y, m, 0, 23, 59, 59) };
    } else if (year) {
      whereClause.startDate = { gte: new Date(Number(year), 0, 1) };
      whereClause.endDate = { lte: new Date(Number(year), 11, 31, 23, 59, 59) };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: { startDate: "asc" },
    });

    // Filter events based on role for non-admins
    const filteredEvents = events.filter((ev) => {
      if (role === "ADMIN" || role === "SUPER_ADMIN") return true;

      let targetRoles: string[] = [];
      try {
        targetRoles = typeof ev.targetRoles === "string" ? JSON.parse(ev.targetRoles) : (ev.targetRoles as string[]);
      } catch { targetRoles = []; }

      if (!Array.isArray(targetRoles) || targetRoles.length === 0 || targetRoles.includes("ALL")) return true;

      if (role === "STUDENT" && targetRoles.includes("STUDENT")) return true;
      if (role === "TEACHER" && targetRoles.includes("TEACHER")) return true;
      if (role !== "STUDENT" && role !== "TEACHER" && targetRoles.includes("STAFF")) return true;

      return false;
    });

    return NextResponse.json({ events: filteredEvents });
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

    const { title, description, eventType, startDate, endDate, allDay, targetRoles } = body;

    if (!title || !eventType || !startDate || !endDate) {
      return NextResponse.json({ error: "Title, event type, start date, and end date are required" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        tenantId,
        title,
        description: description || null,
        eventType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay !== undefined ? allDay : true,
        targetRoles: JSON.stringify(targetRoles || ["ALL"]),
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
