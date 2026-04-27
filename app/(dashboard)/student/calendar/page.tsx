import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import CalendarViewerClient from "@/components/calendar/CalendarViewerClient";

export const metadata = { title: "School Calendar" };

export default async function StudentCalendarPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar title="School Calendar" breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Calendar" }]} />
      <div className="page-body fade-up">
        <CalendarViewerClient />
      </div>
    </>
  );
}
