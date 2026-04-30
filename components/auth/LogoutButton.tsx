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
      // 1. Clear any localStorage / sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      // 2. Perform signOut without automatic redirect
      // This clears the session cookies
      await signOut({ redirect: false });

      // 3. Manual redirect to login page (relative path)
      // This avoids issues with NEXTAUTH_URL being set to localhost in production
      window.location.href = "/login";
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
