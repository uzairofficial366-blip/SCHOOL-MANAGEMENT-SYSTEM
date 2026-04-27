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

    const messages = await prisma.message.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        deletedAt: null
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user?.tenantId as string;
    const senderId = (session.user as any).id;
    const { receiverId, body, subject } = await req.json();

    if (!receiverId || !body) {
      return NextResponse.json({ error: "Receiver and message body are required" }, { status: 400 });
    }

    // CHECK COMMUNICATION RULES: Students can only message Teachers or Admins
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { role: true }
    });

    if (!receiver || !["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(receiver.role)) {
      return NextResponse.json({ error: "Students can only initiate messages with teachers or administrators." }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        tenantId,
        senderId,
        receiverId,
        subject: subject || "No Subject",
        body
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
