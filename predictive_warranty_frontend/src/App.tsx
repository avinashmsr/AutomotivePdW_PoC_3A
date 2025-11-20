import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

type ModelInfo = {
  name: string;
  model_type: string;
  auc: number;
  description: string;
};

type VehicleSummary = {
  id: number;
  vin: string;
  model: string;
  model_year: number;
  mileage: number;
  age_months: number;
  dealership_name: string;
  region: string;
  supplier_code: string;
  plant_code: string;
  avg_engine_temp: number;
  avg_vibration: number;
  services_last_12m: number;
  failure_label: boolean;
  risk_score: number;
  risk_bucket: string;
};

type ServiceRecord = {
  id: number;
  service_date: string;
  mileage: number;
  component: string;
  fault_code: string;
  action: string;
  cost: number;
  is_warranty_claim: boolean;
};

type VehicleDetail = {
  summary: VehicleSummary;
  service_history: ServiceRecord[];
};

const riskBadgeClass = (bucket: string) => {
  switch (bucket) {
    case "High":
      return "risk-badge risk-high";
    case "Medium":
      return "risk-badge risk-medium";
    default:
      return "risk-badge risk-low";
  }
};

const formatDate = (value: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
};

const formatCurrency = (value: number) =>
  `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

function App() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("decision_tree");

  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );
  const [selectedVehicleDetail, setSelectedVehicleDetail] =
    useState<VehicleDetail | null>(null);

  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load models once
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_BASE}/models`);
        const data: ModelInfo[] = await res.json();
        setModels(data);
        if (data.length > 0 && !data.find((m) => m.name === selectedModel)) {
          setSelectedModel(data[0].name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load models.");
      }
    };
    fetchModels();
  }, []);

  // Load vehicle list when model changes
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/vehicles?model_name=${encodeURIComponent(
            selectedModel
          )}&limit=100`
        );
        const data: VehicleSummary[] = await res.json();
        setVehicles(data);
        setSelectedVehicleId(null);
        setSelectedVehicleDetail(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load vehicles.");
      } finally {
        setLoadingVehicles(false);
      }
    };

    if (selectedModel) {
      fetchVehicles();
    }
  }, [selectedModel]);

  // Load vehicle detail when selection changes
  useEffect(() => {
    if (selectedVehicleId == null) return;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/vehicles/${selectedVehicleId}?model_name=${encodeURIComponent(
            selectedModel
          )}`
        );
        const data: VehicleDetail = await res.json();
        setSelectedVehicleDetail(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load vehicle details.");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedVehicleId, selectedModel]);

  const currentModelInfo = models.find((m) => m.name === selectedModel);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>Predictive Warranty Risk (OEM PoC)</h1>
          <p className="subtitle">
            OEM-facing dashboard using production, sensor, service & warranty
            data to forecast component failures.
          </p>
        </div>
        <div className="header-badges">
          <span className="chip">Demo only – synthetic data</span>
          <span className="chip chip-accent">Tradeshow-ready PoC</span>
        </div>
      </header>

      <section className="control-bar">
        <div className="model-select">
          <label htmlFor="model-select">ML model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.model_type})
              </option>
            ))}
          </select>
        </div>
        {currentModelInfo && (
          <div className="model-metadata">
            <span className="model-auc">
              AUC: <strong>{currentModelInfo.auc.toFixed(3)}</strong>
            </span>
            <span className="model-desc">{currentModelInfo.description}</span>
          </div>
        )}
      </section>

      {error && <div className="error-banner">{error}</div>}

      <main className="layout">
        <section className="panel panel-left">
          <div className="panel-header">
            <h2>Vehicle risk overview</h2>
            <span className="panel-subtitle">
              Sorted by VIN; click a row to drill into warranty risk drivers.
            </span>
          </div>

          {loadingVehicles ? (
            <div className="loading">Loading vehicles…</div>
          ) : (
            <div className="table-wrapper">
              <table className="vehicle-table">
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>Mileage</th>
                    <th>Region</th>
                    <th>Supplier</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr
                      key={v.id}
                      className={
                        v.id === selectedVehicleId ? "row-selected" : ""
                      }
                      onClick={() => setSelectedVehicleId(v.id)}
                    >
                      <td>{v.vin}</td>
                      <td>{v.model}</td>
                      <td>{v.model_year}</td>
                      <td>
                        {v.mileage.toLocaleString("en-US")} mi
                      </td>
                      <td>{v.region}</td>
                      <td>{v.supplier_code}</td>
                      <td>
                        <span className={riskBadgeClass(v.risk_bucket)}>
                          {v.risk_bucket} ({Math.round(v.risk_score * 100)}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        No vehicles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel-right">
          <div className="panel-header">
            <h2>Risk details</h2>
            <span className="panel-subtitle">
              Warranty risk profile and recent service history for the selected
              vehicle.
            </span>
          </div>

          {!selectedVehicleId && (
            <div className="placeholder">
              Select a vehicle on the left to inspect its warranty risk.
            </div>
          )}

          {loadingDetail && selectedVehicleId && (
            <div className="loading">Loading vehicle details…</div>
          )}

          {selectedVehicleDetail && (
            <div className="detail-layout">
              <div className="detail-top">
                {/* Risk gauge */}
                <div className="risk-gauge-card">
                  <div className="risk-gauge-circle">
                    <div className="risk-gauge-inner">
                      <span className="risk-gauge-percentage">
                        {Math.round(
                          selectedVehicleDetail.summary.risk_score * 100
                        )}
                        %
                      </span>
                      <span className="risk-gauge-label">Failure risk</span>
                    </div>
                  </div>
                  <div className="risk-gauge-meta">
                    <div className="risk-gauge-row">
                      <span className="label">Risk bucket</span>
                      <span
                        className={riskBadgeClass(
                          selectedVehicleDetail.summary.risk_bucket
                        )}
                      >
                        {selectedVehicleDetail.summary.risk_bucket}
                      </span>
                    </div>
                    <div className="risk-gauge-row">
                      <span className="label">VIN</span>
                      <span>{selectedVehicleDetail.summary.vin}</span>
                    </div>
                    <div className="risk-gauge-row">
                      <span className="label">Model / Year</span>
                      <span>
                        {selectedVehicleDetail.summary.model} ·{" "}
                        {selectedVehicleDetail.summary.model_year}
                      </span>
                    </div>
                    <div className="risk-gauge-row">
                      <span className="label">OEM sale / region</span>
                      <span>
                        {selectedVehicleDetail.summary.dealership_name} ·{" "}
                        {selectedVehicleDetail.summary.region}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key drivers */}
                <div className="drivers-card">
                  <h3>Key drivers (features)</h3>
                  <div className="drivers-grid">
                    <div className="driver-item">
                      <span className="label">Mileage</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.mileage.toLocaleString(
                          "en-US"
                        )}{" "}
                        mi
                      </span>
                      <span className="hint">
                        High mileage tends to increase warranty risk.
                      </span>
                    </div>
                    <div className="driver-item">
                      <span className="label">Age</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.age_months.toFixed(1)}{" "}
                        months
                      </span>
                      <span className="hint">
                        Older vehicles naturally carry more failure risk.
                      </span>
                    </div>
                    <div className="driver-item">
                      <span className="label">Engine temp</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.avg_engine_temp.toFixed(
                          1
                        )}
                        °C
                      </span>
                      <span className="hint">
                        Elevated operating temperatures are an early warning
                        sign.
                      </span>
                    </div>
                    <div className="driver-item">
                      <span className="label">Vibration index</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.avg_vibration.toFixed(2)}
                      </span>
                      <span className="hint">
                        Higher vibration levels can indicate drivetrain wear.
                      </span>
                    </div>
                    <div className="driver-item">
                      <span className="label">Services (12m)</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.services_last_12m}
                      </span>
                      <span className="hint">
                        Frequent visits may signal unstable components.
                      </span>
                    </div>
                    <div className="driver-item">
                      <span className="label">Supplier / Plant</span>
                      <span className="value">
                        {selectedVehicleDetail.summary.supplier_code} ·{" "}
                        {selectedVehicleDetail.summary.plant_code}
                      </span>
                      <span className="hint">
                        OEMs can act on supplier/plant-level patterns.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service history */}
              <div className="service-card">
                <h3>Recent service & warranty history</h3>
                {selectedVehicleDetail.service_history.length === 0 ? (
                  <div className="empty-state">
                    No service history recorded for this vehicle in the PoC
                    dataset.
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="service-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Component</th>
                          <th>Fault code</th>
                          <th>Mileage</th>
                          <th>Action</th>
                          <th>Cost</th>
                          <th>Warranty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVehicleDetail.service_history.map((s) => (
                          <tr key={s.id}>
                            <td>{formatDate(s.service_date)}</td>
                            <td>{s.component}</td>
                            <td>{s.fault_code}</td>
                            <td>
                              {s.mileage.toLocaleString("en-US")} mi
                            </td>
                            <td>{s.action}</td>
                            <td>{formatCurrency(s.cost)}</td>
                            <td>
                              {s.is_warranty_claim ? (
                                <span className="badge badge-warranty">
                                  Warranty
                                </span>
                              ) : (
                                <span className="badge badge-nonwarranty">
                                  Customer pay
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;