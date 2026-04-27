"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, 
  Award, 
  Medal, 
  Star, 
  Download, 
  Calendar, 
  User, 
  Info,
  Filter
} from "lucide-react";

const CATEGORY_CONFIG: any = {
  ACADEMIC: { icon: Award, color: "#3b82f6", bg: "#dbeafe", label: "Academic" },
  SPORTS: { icon: Trophy, color: "#f59e0b", bg: "#fef3c7", label: "Sports" },
  EXTRACURRICULAR: { icon: Medal, color: "#10b981", bg: "#d1fae5", label: "Extracurricular" },
  BEHAVIORAL: { icon: Star, color: "#8b5cf6", bg: "#ede9fe", label: "Behavioral" },
};

export default function AchievementsClient() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const res = await fetch("/api/achievements/student");
      const data = await res.json();
      if (res.ok) setAchievements(data.achievements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(ach => 
    filter === "ALL" || ach.category === filter
  );

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading achievements...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* HEADER & FILTER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["ALL", "ACADEMIC", "SPORTS", "EXTRACURRICULAR", "BEHAVIORAL"].map(f => (
            <button 
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
              style={{ borderRadius: "2rem" }}
            >
              {f === "ALL" ? "All Records" : CATEGORY_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="card glass" style={{ padding: "5rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.5 }}>🏆</div>
          <h3 style={{ fontWeight: 800, fontSize: "1.5rem" }}>No Achievements Yet</h3>
          <p style={{ color: "var(--text-muted)" }}>Your awards and recognitions will appear here as they are granted.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {filteredAchievements.map((ach) => {
            const config = CATEGORY_CONFIG[ach.category] || CATEGORY_CONFIG.ACADEMIC;
            const Icon = config.icon;

            return (
              <div key={ach.id} className="card glass hover-lift" style={{ display: "flex", gap: "2rem", padding: "1.5rem" }}>
                <div style={{ 
                  width: "80px", height: "80px", borderRadius: "16px", 
                  background: config.bg, color: config.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Icon size={40} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ 
                        fontSize: "0.7rem", fontWeight: 800, padding: "0.2rem 0.6rem", 
                        borderRadius: "4px", background: config.bg, color: config.color,
                        textTransform: "uppercase", marginBottom: "0.5rem", display: "inline-block"
                      }}>
                        {config.label}
                      </span>
                      <h3 style={{ fontWeight: 800, fontSize: "1.25rem" }}>{ach.title}</h3>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        <Calendar size={14} /> {new Date(ach.awardedDate).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    {ach.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <User size={16} className="text-primary" />
                      <span style={{ fontWeight: 600 }}>{ach.issuingAuthority}</span>
                    </div>
                    
                    {ach.certificateUrl && (
                      <a href={ach.certificateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                        <Download size={16} /> Certificate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
