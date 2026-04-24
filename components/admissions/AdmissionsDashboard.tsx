"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AdmissionStats from "./AdmissionStats";
import CyclesTab from "./CyclesTab";
import ApplicationsTab from "./ApplicationsTab";
import ApplicationDetailModal from "./ApplicationDetailModal";
import NewApplicationModal from "./NewApplicationModal";
import NewCycleModal from "./NewCycleModal";

interface Props {
  cycles: any[];
  applications: any[];
  academicYears: any[];
  grades: any[];
  stats: {
    totalApplications: number;
    statusCounts: Record<string, number>;
    activeCycles: number;
    totalSeats: number;
    filledSeats: number;
    approvalRate: number;
  };
}

export default function AdmissionsDashboard({ cycles, applications, academicYears, grades, stats }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "cycles">("overview");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showNewApp, setShowNewApp] = useState(false);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewApp(true);
      // Clean up the URL so it doesn't stay open on refresh
      router.replace("/admin/admissions");
    }
  }, [searchParams, router]);

  const filteredApps = applications.filter((a: any) => {
    if (filterStatus !== "ALL" && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.studentName.toLowerCase().includes(q) ||
        a.applicationNo.toLowerCase().includes(q) ||
        a.parentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs = [
    { key: "overview", label: "📊 Overview", icon: "📊" },
    { key: "applications", label: "📝 Applications", icon: "📝" },
    { key: "cycles", label: "🔄 Cycles", icon: "🔄" },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800 }}>
            Admission Management 🎓
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Manage admission cycles, applications, and enrollment workflows.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowNewCycle(true)}>+ New Cycle</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewApp(true)}>+ New Application</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="fade-up fade-up-1" style={{ display: "flex", gap: "0.25rem", background: "hsl(var(--bg))", padding: "0.25rem", borderRadius: "10px", width: "fit-content", border: "1px solid hsl(var(--border))" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="btn btn-sm"
            style={{
              background: activeTab === t.key ? "hsl(var(--primary))" : "transparent",
              color: activeTab === t.key ? "white" : "hsl(var(--text-muted))",
              boxShadow: activeTab === t.key ? "0 2px 8px hsl(var(--primary)/0.3)" : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="fade-up">
          <AdmissionStats stats={stats} applications={applications} />
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === "applications" && (
        <div className="fade-up">
          <ApplicationsTab
            applications={filteredApps}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelect={setSelectedApp}
            statusCounts={stats.statusCounts}
          />
        </div>
      )}

      {/* Cycles Tab */}
      {activeTab === "cycles" && (
        <div className="fade-up">
          <CyclesTab cycles={cycles} onNewCycle={() => setShowNewCycle(true)} />
        </div>
      )}

      {/* Modals */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
      {showNewApp && (
        <NewApplicationModal
          cycles={cycles.filter((c: any) => c.status === "OPEN")}
          grades={grades}
          onClose={() => setShowNewApp(false)}
        />
      )}
      {showNewCycle && (
        <NewCycleModal
          academicYears={academicYears}
          onClose={() => setShowNewCycle(false)}
        />
      )}
    </div>
  );
}
