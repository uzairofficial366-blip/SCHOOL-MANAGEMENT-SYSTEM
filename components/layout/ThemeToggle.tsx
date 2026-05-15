"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, mounted, toggle } = useTheme();

  if (!mounted) return null;

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        cursor: "pointer",
        color: "var(--text-secondary)",
        fontSize: "1rem",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-card)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--indigo)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      {theme === "dark" ? (
        /* Sun icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
