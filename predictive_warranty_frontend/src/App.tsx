import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import "./App.css";

type Theme = "dark" | "light";

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  // remember theme across reloads
  useEffect(() => {
    const stored = window.localStorage.getItem("pw-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored as Theme);
    }
  }, []);

  useEffect(() => {
    // Apply theme class to <body> for page background
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
    // Persist
    window.localStorage.setItem("pw-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const isDark = theme === "dark";

  return (
    <div className={`app-root ${isDark ? "theme-dark" : "theme-light"}`}>
      <header className="app-header">
        <div>
          <h1>Predictive Warranty Risk (OEM PoC)</h1>
          <p className="subtitle">
            OEM-facing dashboard using production, sensor, service &amp; warranty
            data to forecast component failures.
          </p>
        </div>

        <div className="header-right">
          <div className="header-badges">
            <span className="chip">Demo only – synthetic data</span>
            <span className="chip chip-accent">Tradeshow-ready PoC</span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
          >
            {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </header>

      <Dashboard />
    </div>
  );
};

export default App;