import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import TimetableViewerClient from "@/components/timetable/TimetableViewerClient";

export const metadata = { title: "My Timetable" };

export default async function TeacherTimetablePage() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="My Timetable" breadcrumbs={[{ label: "Home" }, { label: "Teacher", href: "/teacher" }, { label: "Timetable" }]} />
      <div className="page-body fade-up">
        <TimetableViewerClient />
      </div>
    </>
  );
}
