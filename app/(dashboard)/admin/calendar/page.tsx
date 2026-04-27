import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import CalendarAdminClient from "./CalendarAdminClient";

export const metadata = { title: "Calendar & Events" };

export default async function AdminCalendarPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Calendar & Events" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Calendar" }]} />
      <div className="page-body fade-up">
        <CalendarAdminClient />
      </div>
    </>
  );
}
