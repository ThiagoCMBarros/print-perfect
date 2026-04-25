import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = "site-theme";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = t;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default sempre claro; usuário pode trocar manualmente.
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "dark" || saved === "light") {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        applyTheme("light");
      }
    } catch {
      applyTheme("light");
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
