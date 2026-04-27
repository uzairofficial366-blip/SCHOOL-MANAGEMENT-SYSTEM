"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  DRAFT: [{ label: "Submit", next: "SUBMITTED", color: "hsl(var(--primary))" }],
  SUBMITTED: [
    { label: "Start Review", next: "UNDER_REVIEW", color: "hsl(var(--warning))" },
    { label: "Reject", next: "REJECTED", color: "hsl(var(--danger))" },
  ],
  UNDER_REVIEW: [
    { label: "Approve", next: "APPROVED", color: "hsl(var(--success))" },
    { label: "Waitlist", next: "WAITLISTED", color: "hsl(262 83% 62%)" },
    { label: "Reject", next: "REJECTED", color: "hsl(var(--danger))" },
  ],
  WAITLISTED: [
    { label: "Promote to Approved", next: "APPROVED", color: "hsl(var(--success))" },
    { label: "Reject", next: "REJECTED", color: "hsl(var(--danger))" },
  ],
  APPROVED: [{ label: "Enroll Student", next: "ENROLLED", color: "hsl(var(--info))" }],
};

const STATUS_FLOW = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ENROLLED"];

interface Props {
  application: any;
  sections: any[];
  onClose: () => void;
}

export default function ApplicationDetailModal({ application, sections, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showEnrollInput, setShowEnrollInput] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleStatusChange = async (newStatus: string) => {
    setErrorMsg("");
    if (newStatus === "REJECTED" && !showRejectInput) {
      setShowRejectInput(true);
      setShowEnrollInput(false);
      return;
    }
    if (newStatus === "ENROLLED" && !showEnrollInput) {
      setShowEnrollInput(true);
      setShowRejectInput(false);
      return;
    }
    
    if (newStatus === "ENROLLED" && !selectedSectionId) {
      setErrorMsg("Please select a section to enroll the student in.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admissions/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: newStatus === "REJECTED" ? rejectReason : undefined,
          sectionId: newStatus === "ENROLLED" ? selectedSectionId : undefined,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      router.refresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      console.error("Status update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const actions = STATUS_ACTIONS[application.status] || [];
  const currentStepIdx = STATUS_FLOW.indexOf(application.status);
  
  // Filter sections that belong to the academic year of the cycle
  const availableSections = sections.filter(s => s.academicYearId === application.cycle.academicYearId);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }} onClick={onClose}>
      <div className="card" style={{
        width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto",
        padding: "2rem", animation: "fadeUp 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>
        
        {errorMsg && (
          <div style={{ padding: "0.5rem 0.75rem", background: "hsl(var(--danger)/0.08)", border: "1px solid hsl(var(--danger)/0.2)", borderRadius: 8, color: "hsl(var(--danger))", fontSize: "0.82rem", marginBottom: "1rem" }}>
            {errorMsg}
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "hsl(var(--primary))", fontWeight: 600 }}>
                {application.applicationNo}
              </span>
              <span className={`badge badge-${application.status === "APPROVED" ? "success" : application.status === "REJECTED" ? "danger" : "primary"}`}>
                {application.status.replace("_", " ")}
              </span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", marginTop: "0.5rem" }}>
              {application.studentName}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "hsl(var(--text-muted))" }}>✕</button>
        </div>

        {/* Workflow Progress */}
        <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "hsl(var(--bg))", borderRadius: "10px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "hsl(var(--text-muted))", marginBottom: "0.75rem", letterSpacing: "0.04em" }}>
            Application Workflow
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {STATUS_FLOW.map((step, i) => {
              const isPast = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const isRejected = application.status === "REJECTED" || application.status === "WAITLISTED" || application.status === "WITHDRAWN";
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                    background: isPast ? "hsl(var(--success))" : isCurrent ? (isRejected ? "hsl(var(--danger))" : "hsl(var(--primary))") : "hsl(var(--border))",
                    color: isPast || isCurrent ? "white" : "hsl(var(--text-muted))",
                    transition: "all 0.3s",
                  }}>
                    {isPast ? "✓" : i + 1}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: "0 0.25rem", background: isPast ? "hsl(var(--success))" : "hsl(var(--border))", transition: "background 0.3s" }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
            {STATUS_FLOW.map((step) => (
              <div key={step} style={{ fontSize: "0.6rem", color: "hsl(var(--text-muted))", textAlign: "center", flex: 1 }}>
                {step.replace("_", " ")}
              </div>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Grade Applied", value: application.gradeAppliedFor },
            { label: "Gender", value: application.gender || "—" },
            { label: "Date of Birth", value: application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : "—" },
            { label: "Previous School", value: application.previousSchool || "—" },
            { label: "Parent Name", value: application.parentName },
            { label: "Parent Email", value: application.parentEmail },
            { label: "Parent Phone", value: application.parentPhone },
            { label: "Cycle", value: application.cycle?.name || "—" },
            { label: "Submitted", value: application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "Not yet" },
            { label: "Priority Score", value: application.priorityScore?.toString() || "0" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--text-muted))", textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Documents */}
        {application.documents && application.documents.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.5rem" }}>📎 Documents</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {application.documents.map((doc: any) => (
                <div key={doc.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.5rem 0.75rem", background: "hsl(var(--bg))", borderRadius: "8px",
                  fontSize: "0.82rem",
                }}>
                  <span>{doc.docType.replace(/_/g, " ")}</span>
                  <span className={`badge ${doc.status === "VERIFIED" ? "badge-success" : doc.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {application.rejectionReason && (
          <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", background: "hsl(var(--danger) / 0.08)", borderRadius: "8px", border: "1px solid hsl(var(--danger) / 0.2)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(var(--danger))", marginBottom: "0.25rem" }}>Rejection Reason</div>
            <div style={{ fontSize: "0.85rem" }}>{application.rejectionReason}</div>
          </div>
        )}

        {/* Reject Input */}
        {showRejectInput && (
          <div style={{ marginBottom: "1rem", padding: "1rem", background: "hsl(var(--danger)/0.05)", borderRadius: "8px", border: "1px solid hsl(var(--danger)/0.2)" }}>
            <label className="form-label" style={{ color: "hsl(var(--danger))" }}>Rejection Reason *</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              style={{ resize: "vertical", borderColor: "hsl(var(--danger)/0.3)" }}
            />
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button className="btn btn-danger btn-sm" disabled={!rejectReason || loading} onClick={() => handleStatusChange("REJECTED")}>
                {loading ? "Processing..." : "Confirm Rejection"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowRejectInput(false); setRejectReason(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Enroll Input */}
        {showEnrollInput && (
          <div style={{ marginBottom: "1rem", padding: "1rem", background: "hsl(var(--info)/0.05)", borderRadius: "8px", border: "1px solid hsl(var(--info)/0.2)" }}>
            <label className="form-label" style={{ color: "hsl(var(--info))" }}>Assign Section *</label>
            <select 
              className="form-input" 
              value={selectedSectionId} 
              onChange={(e) => setSelectedSectionId(e.target.value)}
              style={{ borderColor: "hsl(var(--info)/0.3)" }}
            >
              <option value="">Select a section...</option>
              {availableSections.map((s: any) => (
                <option key={s.id} value={s.id}>{s.grade.name} - {s.name}</option>
              ))}
            </select>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--text-muted))", marginTop: "0.4rem" }}>
              The student will be registered and enrolled into this section for {application.cycle.academicYear?.name || "the cycle's academic year"}.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button className="btn btn-info btn-sm" disabled={!selectedSectionId || loading} onClick={() => handleStatusChange("ENROLLED")} style={{ background: "hsl(var(--info))", color: "white", border: "none" }}>
                {loading ? "Processing..." : "Confirm Enrollment"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowEnrollInput(false); setSelectedSectionId(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && !showRejectInput && !showEnrollInput && (
          <div style={{ display: "flex", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid hsl(var(--border))" }}>
            {actions.map((action) => (
              <button
                key={action.next}
                className="btn btn-sm"
                disabled={loading}
                onClick={() => handleStatusChange(action.next)}
                style={{ background: action.color, color: "white" }}
              >
                {loading ? "Processing..." : action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
