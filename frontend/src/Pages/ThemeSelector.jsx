import { useTheme } from "../context/ThemeContext";

const ThemeSelector = () => {
  const { themes, selectedTheme, setSelectedTheme, applyTheme } = useTheme();

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4 text-text">Select a Theme</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.name}
            className={`rounded-lg shadow-md p-4 border-2 ${
              selectedTheme.name === theme.name ? "border-primary" : "border-gray-300"
            }`}
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
            }}
          >
            <h3 className="text-lg font-bold">{theme.name}</h3>
            <div className="mt-2">
              <button
                style={{ backgroundColor: theme.colors.primary }}
                className="text-white px-3 py-1 rounded mr-2"
              >
                Primary
              </button>
              <button
                style={{ backgroundColor: theme.colors.secondary }}
                className="text-white px-3 py-1 rounded"
              >
                Secondary
              </button>
            </div>
            <button
              className="mt-4 px-3 py-1 border border-text rounded"
              onClick={() => {
                setSelectedTheme(theme);
                applyTheme(theme);
              }}
            >
              Apply Theme
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
