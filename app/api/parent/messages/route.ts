import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const userId = session.user?.id as string;

    const messages = await prisma.message.findMany({
      where: { tenantId, receiverId: userId, deletedAt: null },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      messages: messages.map((message) => ({
        id: message.id,
        sender: message.sender.name,
        senderRole: message.sender.role,
        subject: message.subject ?? "Message",
        message: message.body,
        date: message.createdAt.toISOString(),
        isRead: message.isRead,
        relatedStudent: null,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/parent/messages error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
