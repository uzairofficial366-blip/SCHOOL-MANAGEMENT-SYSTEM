"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface LogoutButtonProps {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ style, className, children }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Keep localStorage preferences such as theme, but clear tab-scoped data.
      try {
        sessionStorage.clear();
      } catch {}

      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      console.error("Logout error:", err);
      // Fallback: hard-redirect to login
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      title="Sign out"
      style={{
        background: "none",
        border: "none",
        cursor: isLoggingOut ? "not-allowed" : "pointer",
        opacity: isLoggingOut ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children ?? (isLoggingOut ? "⏳" : "🔓")}
    </button>
  );
}
