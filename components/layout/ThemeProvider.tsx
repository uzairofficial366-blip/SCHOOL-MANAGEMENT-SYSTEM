"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeCtx = createContext<{ theme: Theme; mounted: boolean; toggle: () => void }>({
  theme: "light",
  mounted: false,
  toggle: () => {},
});

function applyTheme(t: Theme) {
  const html = document.documentElement;
  if (t === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("eduerp-theme") as Theme | null;
    const resolved = saved ?? "light";
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("eduerp-theme", next);
      applyTheme(next);
      return next;
    });
  }

  return (
    <ThemeCtx.Provider value={{ theme, mounted, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
