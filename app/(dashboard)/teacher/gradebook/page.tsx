import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import TeacherGradebookClient from "./TeacherGradebookClient";
import { getTeacherGradebookScope } from "@/lib/teacher-gradebook";

export const metadata = { title: "Gradebook | Teacher" };

export default async function TeacherGradebook() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;
  const { staff, sections, examSchedules } = await getTeacherGradebookScope(tenantId, userId);

  if (!staff) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Gradebook" />
      <TeacherGradebookClient
        initialSections={JSON.parse(JSON.stringify(sections))}
        initialExamSchedules={JSON.parse(JSON.stringify(examSchedules))}
      />
    </>
  );
}
