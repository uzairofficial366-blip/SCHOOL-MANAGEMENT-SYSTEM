import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const tenantId = session.user?.tenantId as string;
    const userRole = session.user?.role as string;

    const announcements = await prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    // Filter based on roles
    const filteredAnnouncements = announcements.filter(ann => {
      // Admins see everything
      if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

      if (!ann.targetRoles) return false;
      
      try {
        const targetRoles = typeof ann.targetRoles === 'string' && ann.targetRoles.startsWith('[')
          ? JSON.parse(ann.targetRoles)
          : (ann.targetRoles as string).split(',').map(r => r.trim());

        if (!Array.isArray(targetRoles)) return false;

        // Check specific roles
        if (userRole === "STUDENT" && targetRoles.includes("STUDENT")) return true;
        if (userRole === "TEACHER" && targetRoles.includes("TEACHER")) return true;
        
        // If the user is neither student nor teacher, they are considered "Other Staff"
        if (userRole !== "STUDENT" && userRole !== "TEACHER" && targetRoles.includes("STAFF")) return true;

        return false;
      } catch (e) {
        return false;
      }
    });

    return NextResponse.json({ announcements: filteredAnnouncements });
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

    const { title, content, targetRoles } = body;

    if (!title || !content || !Array.isArray(targetRoles)) {
      return NextResponse.json({ error: "Title, content, and valid targetRoles are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        title,
        content,
        targetRoles: JSON.stringify(targetRoles),
        publishedAt: new Date()
      }
    });

    // Parse back before sending response
    const responseData = { ...announcement, targetRoles: JSON.parse(announcement.targetRoles as string) };

    return NextResponse.json({ success: true, announcement: responseData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
