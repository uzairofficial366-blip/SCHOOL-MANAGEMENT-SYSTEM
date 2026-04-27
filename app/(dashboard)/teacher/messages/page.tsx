import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import TeacherMessagesClient from "./TeacherMessagesClient";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Messages | Teacher" };

export default async function TeacherMessages() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const staff = await prisma.staff.findFirst({
    where: { userId: session.user.id },
    include: { user: true }
  });

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <Topbar title="Messages" />
      <TeacherMessagesClient currentUserId={session.user.id} currentUserName={session.user.name} />
    </div>
  );
}
