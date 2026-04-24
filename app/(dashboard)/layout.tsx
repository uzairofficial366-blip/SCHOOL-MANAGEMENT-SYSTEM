import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const initials = (user.name ?? "U")
    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar
        role={user.role as string}
        userName={user.name ?? "User"}
        userEmail={user.email ?? ""}
        avatarInitials={initials}
        tenantName={(user as any).tenantSlug ?? "Institution"}
      />
      <div className="main-content">{children}</div>
    </div>
  );
}
