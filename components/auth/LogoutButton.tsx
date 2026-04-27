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
      // 1. Hit server-side cookie-clearing endpoint first
      await fetch("/api/auth/logout", { method: "POST" });

      // 2. Clear any localStorage / sessionStorage keys used by the app
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}

      // 3. Let NextAuth complete the signOut — clears JWT cookie & redirects
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (err) {
      console.error("Logout error:", err);
      // Fallback: hard-redirect to login even if something failed
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
        ...style,
      }}
    >
      {children ?? (isLoggingOut ? "⏳" : "🔓")}
    </button>
  );
}
