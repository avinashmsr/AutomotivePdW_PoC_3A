import React, { useEffect, useState } from "react";
import {
  ModelInfo,
  VehicleSummary,
  VehicleDetail as VehicleDetailType,
} from "../types";
import VehicleList from "../components/VehicleList";
import VehicleDetail from "../components/VehicleDetail";

const API_BASE = "http://localhost:8000";

const Dashboard: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("decision_tree");

  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  );
  const [selectedVehicleDetail, setSelectedVehicleDetail] =
    useState<VehicleDetailType | null>(null);

  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_BASE}/models`);
        const data: ModelInfo[] = await res.json();
        setModels(data);
        if (
          data.length > 0 &&
          !data.find((m) => m.name === selectedModel)
        ) {
          setSelectedModel(data[0].name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load models.");
      }
    };

    fetchModels();
  }, []);

  // Load vehicles whenever model changes
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
        const data: VehicleDetailType = await res.json();
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
    <>
      {/* Control bar with model selector */}
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
            <span className="model-desc">
              {currentModelInfo.description}
            </span>
          </div>
        )}
      </section>

      {error && <div className="error-banner">{error}</div>}

      <main className="layout">
        <section className="panel panel-left">
          <VehicleList
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            loading={loadingVehicles}
            onSelectVehicle={setSelectedVehicleId}
          />
        </section>

        <section className="panel panel-right">
          <VehicleDetail
            vehicleDetail={selectedVehicleDetail}
            loading={loadingDetail}
            selectedVehicleId={selectedVehicleId}
          />
        </section>
      </main>
    </>
  );
};

export default Dashboard;