import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

// Redirect /dashboard to the correct role-based dashboard
export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user?.role as string;
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: "/super-admin",
    ADMIN: "/admin",
    TEACHER: "/teacher",
    STUDENT: "/student",
    PARENT: "/parent",
    ACCOUNTANT: "/accountant",
    RECEPTIONIST: "/receptionist",
    LIBRARIAN: "/librarian",
    EXAM_CONTROLLER: "/exam-controller",
    STORE_MANAGER: "/store",
    HOSTEL_WARDEN: "/hostel",
  };
  redirect(roleMap[role] ?? "/student");
}
