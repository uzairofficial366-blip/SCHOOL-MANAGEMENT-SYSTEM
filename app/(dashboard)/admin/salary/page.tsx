import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import SalaryManagementClient from "./SalaryManagementClient";

export const metadata = { title: "Staff Salary Management" };

export default async function SalaryAdminPage() {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Salary Management" breadcrumbs={[{ label: "Home" }, { label: "Admin", href: "/admin" }, { label: "Salary" }]} />
      <div className="page-body fade-up">
        <SalaryManagementClient />
      </div>
    </>
  );
}
