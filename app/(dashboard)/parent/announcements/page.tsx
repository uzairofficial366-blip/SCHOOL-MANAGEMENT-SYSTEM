import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import ParentModuleClient from "@/components/parent/ParentModuleClient";

export const metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function ParentAnnouncementsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  return (
    <>
      <Topbar title="School Announcements" breadcrumbs={[{ label: "Home" }, { label: "Parent", href: "/parent" }, { label: "Announcements" }]} />
      <div className="page-body fade-up">
        <ParentModuleClient endpoint="/api/parent/announcements" type="announcements" />
      </div>
    </>
  );
}
