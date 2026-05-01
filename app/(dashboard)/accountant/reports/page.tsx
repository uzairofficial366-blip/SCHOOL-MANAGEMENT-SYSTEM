import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";

export const metadata = { title: "Financial Reports" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Financial Reports" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Reports" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Financial Reports</h3>
            <p style={{ marginTop: "0.35rem", color: "hsl(var(--text-muted))" }}>
              Generate and view financial reports.
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
            Reports feature coming soon.
          </div>
        </div>
      </div>
    </>
  );
}