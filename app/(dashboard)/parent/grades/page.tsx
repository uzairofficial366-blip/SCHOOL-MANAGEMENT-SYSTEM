import Topbar from "@/components/layout/Topbar";
import ParentModuleClient from "@/components/parent/ParentModuleClient";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Grades" };
export const dynamic = "force-dynamic";

export default async function ParentGradesPage() {
  const session = await auth();
  if (!session || session.user?.role !== "PARENT") redirect("/login");

  return (
    <>
      <Topbar title="Grades" breadcrumbs={[{ label: "Home" }, { label: "Parent", href: "/parent" }, { label: "Grades" }]} />
      <div className="page-body fade-up">
        <ParentModuleClient endpoint="/api/parent/grades" type="grades" />
      </div>
    </>
  );
}
