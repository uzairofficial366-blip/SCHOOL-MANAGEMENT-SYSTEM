import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AnnouncementsAdminClient from "./AnnouncementsAdminClient";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Announcements Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Announcements" }]} />
      <div className="page-body fade-up">
        <AnnouncementsAdminClient />
      </div>
    </>
  );
}
