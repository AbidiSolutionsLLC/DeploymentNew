import React, { createContext, useContext, useEffect, useState } from "react";
import { predefinedThemes } from "../styles/theme";

const ThemeContext = createContext();
function safeJSONParse(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Couldn’t parse "${key}" from localStorage:`, err);
    return fallback;
  }
}

export const ThemeProvider = ({ children }) => {
 const [themes] = useState(() => {
  // Try to load an array; if missing or empty, use predefinedThemes
  const parsed = safeJSONParse("themes", []);
  return Array.isArray(parsed) && parsed.length 
    ? parsed 
    : predefinedThemes;
});

const [selectedTheme, setSelectedTheme] = useState(() => {
  // Default to the first theme if nothing saved
  return safeJSONParse("selectedTheme", themes[0]);
});
  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    for (let key in theme.colors) {
      root.style.setProperty(`--color-${key}`, theme.colors[key]);
  
      // Add RGB version if hex
      if (theme.colors[key].startsWith("#")) {
        const hex = theme.colors[key].replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        root.style.setProperty(`--color-${key}-rgb`, `${r}, ${g}, ${b}`);
      }
    }
    localStorage.setItem("selectedTheme", JSON.stringify(theme));
  };
  

  const value = {
    themes,
    selectedTheme,
    setSelectedTheme,
    applyTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
