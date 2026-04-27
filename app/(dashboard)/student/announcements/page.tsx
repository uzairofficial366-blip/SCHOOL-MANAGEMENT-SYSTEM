import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";

export const metadata = { title: "Announcements" };

export default async function StudentAnnouncementsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar title="School Announcements" breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Announcements" }]} />
      <div className="page-body fade-up">
        <AnnouncementsList />
      </div>
    </>
  );
}
