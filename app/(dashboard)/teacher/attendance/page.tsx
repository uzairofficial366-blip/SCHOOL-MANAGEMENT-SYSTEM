import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import TeacherAttendanceClient from "./TeacherAttendanceClient";
import { getTeacherAttendanceScope } from "@/lib/teacher-attendance";

export const metadata = { title: "Attendance | Teacher" };

export default async function TeacherAttendance({
  searchParams,
}: {
  searchParams?: Promise<{ sectionId?: string }>;
}) {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  const tenantId = session.user?.tenantId as string;
  const userId = session.user?.id as string;
  const resolvedSearchParams = (await searchParams) ?? {};

  const { staff, sections, tenant } = await getTeacherAttendanceScope(tenantId, userId);
  if (!staff) redirect("/login");

  const requestedSectionId = resolvedSearchParams.sectionId;
  const initialSelectedSectionId = sections.some((section) => section.sectionId === requestedSectionId)
    ? requestedSectionId || ""
    : sections.length === 1
      ? sections[0].sectionId
      : "";

  return (
    <>
      <Topbar title="Attendance" />
      <TeacherAttendanceClient
        initialSections={sections}
        initialSelectedSectionId={initialSelectedSectionId}
        tenantTimeZone={tenant?.timezone || "UTC"}
      />
    </>
  );
}
