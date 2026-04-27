import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import StudentResultsClient from "@/components/results/StudentResultsClient";

export const metadata = { title: "My Results" };

export default async function StudentResultsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar title="My Results" breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Results" }]} />
      <div className="page-body fade-up">
        <StudentResultsClient />
      </div>
    </>
  );
}
