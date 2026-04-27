import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AttendanceClient from "./AttendanceClient";

export const metadata = { title: "My Attendance" };

export default async function StudentAttendancePage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar 
        title="My Attendance" 
        breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Attendance" }]} 
      />
      <div className="page-body fade-up">
        <AttendanceClient />
      </div>
    </>
  );
}
