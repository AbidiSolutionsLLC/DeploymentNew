import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("themeMode") || "system"; // light, dark, system
  });

  // Resolved theme (what the `.dark` class actually is right now).
  // Needed by JS-driven animation because `system` mode also resolves to dark.
  const [isDark, setIsDark] = useState(
    () =>
      localStorage.getItem("themeMode") === "dark" ||
      (localStorage.getItem("themeMode") !== "light" && getSystemTheme() === "dark")
  );

  useEffect(() => {
    const root = document.documentElement;

    const applyThemeClass = (mode) => {
      if (mode === "dark") {
        root.classList.add("dark");
        setIsDark(true);
      } else if (mode === "light") {
        root.classList.remove("dark");
        setIsDark(false);
      } else if (mode === "system") {
        if (getSystemTheme() === "dark") {
          root.classList.add("dark");
          setIsDark(true);
        } else {
          root.classList.remove("dark");
          setIsDark(false);
        }
      }
    };

    applyThemeClass(themeMode);
    localStorage.setItem("themeMode", themeMode);

    // Listen for system changes if system mode is selected
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themeMode === "system") {
        applyThemeClass("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  const value = {
    themeMode,
    setThemeMode,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
