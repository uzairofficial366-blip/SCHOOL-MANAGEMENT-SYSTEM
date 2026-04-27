import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import LibraryClient from "./LibraryClient";

export const metadata = { title: "School Library" };

export default async function StudentLibraryPage() {
  const session = await auth();
  if (!session || session.user?.role !== "STUDENT") redirect("/login");

  return (
    <>
      <Topbar 
        title="Library" 
        breadcrumbs={[{ label: "Home" }, { label: "Student", href: "/student" }, { label: "Library" }]} 
      />
      <div className="page-body fade-up">
        <LibraryClient />
      </div>
    </>
  );
}
