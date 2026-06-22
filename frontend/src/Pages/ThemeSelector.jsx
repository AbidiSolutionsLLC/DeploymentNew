import { useTheme } from "../context/ThemeContext";

const ThemeSelector = () => {
  const { themeMode, setThemeMode } = useTheme();

  const themes = [
    { id: "light", label: "Light Mode", icon: "☀️" },
    { id: "dark", label: "Dark Mode", icon: "🌙" },
    { id: "system", label: "System Preference", icon: "💻" }
  ];

  return (
    <div className="p-8 bg-surface rounded-lg shadow-sm border border-subtle">
      <h2 className="text-2xl font-bold mb-6 text-main">Appearance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setThemeMode(t.id)}
            className={`
              flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all duration-200
              ${themeMode === t.id 
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' 
                : 'border-subtle bg-surface text-main hover:border-brand-sec'
              }
            `}
          >
            <span className="text-4xl mb-3">{t.icon}</span>
            <span className="font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
