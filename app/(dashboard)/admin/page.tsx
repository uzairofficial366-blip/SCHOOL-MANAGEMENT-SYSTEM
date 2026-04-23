import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }
  return (
    <>
      <Topbar title="Admin Dashboard" breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]} />
      <div className="page-body">
        <AdminDashboard userName={session.user?.name ?? "Admin"} />
      </div>
    </>
  );
}
