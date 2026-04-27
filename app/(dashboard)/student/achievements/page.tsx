import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import AchievementsClient from "./AchievementsClient";

export const metadata = { title: "Achievements & Awards" };

export default async function StudentAchievementsPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar 
        title="Achievements" 
        breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Achievements" }]} 
      />
      <div className="page-body fade-up">
        <AchievementsClient />
      </div>
    </>
  );
}
