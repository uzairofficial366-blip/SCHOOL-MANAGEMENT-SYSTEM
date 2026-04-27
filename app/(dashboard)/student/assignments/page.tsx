import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AssignmentsClient from "./AssignmentsClient";

export const metadata = { title: "My Assignments" };

export default async function StudentAssignmentsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar 
        title="My Assignments" 
        breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Assignments" }]} 
      />
      <div className="page-body fade-up">
        <AssignmentsClient />
      </div>
    </>
  );
}
