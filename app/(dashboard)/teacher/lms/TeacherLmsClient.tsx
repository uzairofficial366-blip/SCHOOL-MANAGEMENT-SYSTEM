"use client";

import { Eye, Share2, FileUp, Layers, Video, FileText, Calendar } from "lucide-react";

export default function TeacherLmsClient({ lmsContent }: any) {
  return (
    <div className="page-body fade-up" style={{ padding: "1.5rem 2rem" }}>
      <div className="card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Digital Library (LMS)</h3>
          <p style={{ color: "hsl(var(--text-muted))" }}>Modular Folders, Multimedia Support, Drip Content.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-ghost"><Eye size={18} /> Student View</button>
          <button className="btn btn-ghost"><Share2 size={18} /> Common Pool</button>
          <button className="btn btn-primary"><FileUp size={18} /> Upload Resource</button>
        </div>
      </div>

      <div className="grid-3">
        {/* Example Modular Folders */}
        <div className="card glass">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "1rem", background: "hsl(var(--accent)/0.1)", color: "hsl(var(--accent))", borderRadius: "1rem" }}>
              <Layers size={28} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Unit 1: Thermodynamics</h4>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>4 Resources • Drip: Active</div>
            </div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", padding: "0.5rem", background: "hsl(var(--bg))", borderRadius: "0.5rem" }}>
              <Video size={16} className="text-primary" /> Lecture 1 Recording
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", padding: "0.5rem", background: "hsl(var(--bg))", borderRadius: "0.5rem" }}>
              <FileText size={16} className="text-danger" /> Formula Sheet PDF
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", padding: "0.5rem", background: "hsl(var(--bg))", borderRadius: "0.5rem", opacity: 0.5 }}>
              <Calendar size={16} /> Quiz 1 (Unlocks Oct 15)
            </li>
          </ul>
        </div>

        {/* Render actual content */}
        {lmsContent?.map((content: any) => (
          <div key={content.id} className="card glass">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ padding: "1rem", background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", borderRadius: "1rem" }}>
                <FileText size={28} />
              </div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: "1.1rem" }}>{content.title}</h4>
                <div style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}>{content.type}</div>
              </div>
            </div>
            <p style={{ fontSize: "0.9rem", color: "hsl(var(--text-muted))", marginBottom: "1rem" }}>
              {content.description || "No description"}
            </p>
            <button className="btn btn-sm btn-ghost" style={{ width: "100%" }}>Manage Visibility</button>
          </div>
        ))}
      </div>
    </div>
  );
}
