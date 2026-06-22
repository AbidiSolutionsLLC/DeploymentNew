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

  useEffect(() => {
    const root = document.documentElement;
    
    const applyThemeClass = (mode) => {
      if (mode === "dark") {
        root.classList.add("dark");
      } else if (mode === "light") {
        root.classList.remove("dark");
      } else if (mode === "system") {
        if (getSystemTheme() === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
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
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
