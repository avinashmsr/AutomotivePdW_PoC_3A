import React from "react";
import Dashboard from "./pages/Dashboard";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>Predictive Warranty Risk (OEM PoC)</h1>
          <p className="subtitle">
            OEM-facing dashboard using production, sensor, service &amp; warranty
            data to forecast component failures.
          </p>
        </div>
        <div className="header-badges">
          <span className="chip">Demo only – synthetic data</span>
          <span className="chip chip-accent">Tradeshow-ready PoC</span>
        </div>
      </header>

      <Dashboard />
    </div>
  );
};

export default App;