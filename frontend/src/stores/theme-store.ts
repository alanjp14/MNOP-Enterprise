import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function applyThemeToDOM(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",

      toggleTheme: () => {
        const currentTheme = get().theme;
        const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
        applyThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },

      setTheme: (newTheme: Theme) => {
        applyThemeToDOM(newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: "mnop-theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme);
        } else {
          applyThemeToDOM("light");
        }
      },
    }
  )
);

// Immediately apply theme on module script load
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("mnop-theme-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        applyThemeToDOM(parsed.state.theme);
      }
    }
  } catch (e) {
    console.error("Failed to parse theme storage:", e);
  }
}
