import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import TeacherAnnouncementsClient from "./TeacherAnnouncementsClient";

export const metadata = { title: "Announcements" };

export default async function TeacherAnnouncementsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "TEACHER") redirect("/login");

  return (
    <>
      <Topbar title="School Announcements" breadcrumbs={[{ label: "Home" }, { label: "Teacher", href: "/teacher" }, { label: "Announcements" }]} />
      <div className="page-body fade-up">
        <TeacherAnnouncementsClient />
      </div>
    </>
  );
}
