import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AnnouncementsList from "@/components/announcements/AnnouncementsList";

export const metadata = { title: "Announcements" };

export default async function AccountantAnnouncementsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "ACCOUNTANT") redirect("/login");

  return (
    <>
      <Topbar title="School Announcements" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Announcements" }]} />
      <div className="page-body fade-up">
        <AnnouncementsList />
      </div>
    </>
  );
}
