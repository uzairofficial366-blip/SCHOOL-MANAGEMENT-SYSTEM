"use client";

interface TopbarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function Topbar({ title, breadcrumbs, actions }: TopbarProps) {
  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.1rem" }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {i > 0 && <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>›</span>}
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{b.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h1>
      </div>
      {actions && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>{actions}</div>}
    </header>
  );
}
