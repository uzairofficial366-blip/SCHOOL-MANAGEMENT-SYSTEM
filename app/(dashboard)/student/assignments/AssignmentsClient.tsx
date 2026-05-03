/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Search,
  MessageSquare,
  GraduationCap
} from "lucide-react";

export default function AssignmentsClient() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, SUBMITTED, GRADED
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadUrl, setUploadUrl] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignments/student");
      const data = await res.json();
      if (res.ok) setAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return alert("Please provide a file URL or description");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submissions/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          fileUrl: uploadUrl,
          content: "Submitted via portal"
        })
      });
      if (res.ok) {
        alert("Assignment submitted successfully!");
        setSelectedAssignment(null);
        setUploadUrl("");
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter(asg => {
    const submission = asg.submissions?.[0];
    if (filter === "PENDING") return !submission;
    if (filter === "SUBMITTED") return submission && !submission.marksObtained;
    if (filter === "GRADED") return submission && submission.marksObtained;
    return true;
  });

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading assignments...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* FILTER BAR */}
      <div className="card glass no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["ALL", "PENDING", "SUBMITTED", "GRADED"].map(f => (
            <button 
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
              style={{ borderRadius: "2rem", textTransform: "capitalize" }}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Showing {filteredAssignments.length} assignments
        </div>
      </div>

      {/* ASSIGNMENTS GRID */}
      <div className="grid-2">
        {filteredAssignments.map((asg) => {
          const submission = asg.submissions?.[0];
          const isOverdue = !submission && new Date(asg.dueDate) < new Date();
          const isGraded = submission?.marksObtained !== null && submission?.marksObtained !== undefined;
          
          return (
            <div key={asg.id} className="card glass" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", padding: "0.5rem", borderRadius: "8px" }}>
                  <FileText size={24} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    fontWeight: 800, 
                    padding: "0.2rem 0.6rem", 
                    borderRadius: "4px",
                    background: isGraded ? "#dcfce7" : submission ? "#dbeafe" : isOverdue ? "#fee2e2" : "#f1f5f9",
                    color: isGraded ? "#16a34a" : submission ? "#2563eb" : isOverdue ? "#dc2626" : "#64748b",
                    textTransform: "uppercase"
                  }}>
                    {isGraded ? "Graded" : submission ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                  </span>
                </div>
              </div>

              <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{asg.title}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem", flex: 1 }}>
                {asg.instructions?.substring(0, 120)}...
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem 0", borderTop: "1px solid var(--border)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <BookOpen size={16} className="text-primary" />
                  <span>{asg.content?.subject?.name} ({asg.content?.subject?.code})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <Calendar size={16} className="text-primary" />
                  <span>Due: {new Date(asg.dueDate).toLocaleDateString()} at {new Date(asg.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <GraduationCap size={16} className="text-primary" />
                  <span>Points: {asg.totalMarks}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                {!submission ? (
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSelectedAssignment(asg)}>
                    <Upload size={18} /> Submit Now
                  </button>
                ) : (
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedAssignment(asg)}>
                    View Submission
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUBMISSION MODAL */}
      {selectedAssignment && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
            <button 
              onClick={() => setSelectedAssignment(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
            >
              &times;
            </button>

            <h3 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{selectedAssignment.title}</h3>
            <p style={{ color: "hsl(var(--primary))", fontWeight: 600, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {selectedAssignment.content?.subject?.name}
            </p>

            <div style={{ background: "hsl(var(--bg-muted))", padding: "1.25rem", borderRadius: "12px", marginBottom: "2rem" }}>
              <h4 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>Instructions</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{selectedAssignment.instructions}</p>
            </div>

            {selectedAssignment.submissions?.[0] ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ padding: "1.5rem", borderRadius: "12px", background: "hsl(var(--primary)/0.05)", border: "1px solid hsl(var(--primary)/0.1)" }}>
                  <h4 style={{ fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle size={18} className="text-primary" /> Submission Status
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Submitted On</div>
                      <div style={{ fontWeight: 600 }}>{new Date(selectedAssignment.submissions[0].submittedAt).toLocaleString()}</div>
                    </div>
                    {selectedAssignment.submissions[0].marksObtained !== null && (
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Grade / Marks</div>
                        <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "hsl(var(--primary))" }}>
                          {Number(selectedAssignment.submissions[0].marksObtained)} / {selectedAssignment.totalMarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAssignment.submissions[0].feedback && (
                  <div style={{ padding: "1.5rem", borderRadius: "12px", background: "#fffbeb", border: "1px solid #fef3c7" }}>
                    <h4 style={{ fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <MessageSquare size={18} className="text-warning" /> Teacher Feedback
                    </h4>
                    <p style={{ fontSize: "0.9rem", fontStyle: "italic" }}>"{selectedAssignment.submissions[0].feedback}"</p>
                  </div>
                )}

                <a 
                  href={selectedAssignment.submissions[0].fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ width: "100%" }}
                >
                  <ExternalLink size={18} /> View Submitted File
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmitAssignment}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>File URL (Cloud storage link or PDF link)</label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://example.com/my-assignment.pdf"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Please upload your file to Google Drive, Dropbox, or similar and paste the link here.
                  </p>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Upload & Submit Assignment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

