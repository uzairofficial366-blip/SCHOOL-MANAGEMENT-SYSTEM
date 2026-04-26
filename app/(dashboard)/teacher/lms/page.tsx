import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Topbar from "@/components/layout/Topbar";
import TeacherLmsClient from "./TeacherLmsClient";

export const metadata = { title: "LMS Content | Teacher" };

export default async function TeacherLms() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;

  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId, deletedAt: null },
  });

  if (!staff) redirect("/login");

  const lmsContent = await prisma.lmsContent.findMany({
    where: { tenantId, uploadedById: userId },
    include: { subject: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <>
      <Topbar title="LMS Content" />
      <TeacherLmsClient lmsContent={lmsContent} />
    </>
  );
}
