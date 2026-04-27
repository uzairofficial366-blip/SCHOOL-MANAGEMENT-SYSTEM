import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import CalendarViewerClient from "@/components/calendar/CalendarViewerClient";

export const metadata = { title: "School Calendar" };

export default async function TeacherCalendarPage() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  return (
    <>
      <Topbar title="School Calendar" breadcrumbs={[{ label: "Home" }, { label: "Teacher", href: "/teacher" }, { label: "Calendar" }]} />
      <div className="page-body fade-up">
        <CalendarViewerClient />
      </div>
    </>
  );
}
