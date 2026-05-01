import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/Topbar";

export const metadata = { title: "Fee Concession Management" };

export default async function ConcessionPage() {
  const session = await auth();
  if (!session || !["ACCOUNTANT", "ADMIN", "SUPER_ADMIN"].includes(session.user?.role as string)) {
    redirect("/login");
  }

  return (
    <>
      <Topbar title="Fee Concession Management" breadcrumbs={[{ label: "Home" }, { label: "Accountant", href: "/accountant" }, { label: "Concession" }]} />
      <div className="page-body fade-up">
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem" }}>Fee Concessions</h3>
            <p style={{ marginTop: "0.35rem", color: "hsl(var(--text-muted))" }}>
              Manage fee concessions for students.
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "2rem", color: "hsl(var(--text-muted))" }}>
            Concession management feature coming soon.
          </div>
        </div>
      </div>
    </>
  );
}