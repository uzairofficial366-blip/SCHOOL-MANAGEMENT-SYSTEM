import Topbar from "@/components/layout/Topbar";
import ParentModuleClient from "@/components/parent/ParentModuleClient";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

export default async function ParentAttendancePage() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  return (
    <>
      <Topbar title="Attendance" breadcrumbs={[{ label: "Home" }, { label: "Parent", href: "/parent" }, { label: "Attendance" }]} />
      <div className="page-body fade-up">
        <ParentModuleClient endpoint="/api/parent/attendance" type="attendance" />
      </div>
    </>
  );
}
