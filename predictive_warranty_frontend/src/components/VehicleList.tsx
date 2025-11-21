import React from "react";
import type { VehicleSummary } from "../types";
import { riskBadgeClass } from "../utils/uihelper";

interface VehicleListProps {
  vehicles: VehicleSummary[];
  selectedVehicleId: number | null;
  loading: boolean;
  onSelectVehicle: (id: number) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({
  vehicles,
  selectedVehicleId,
  loading,
  onSelectVehicle,
}) => {
  return (
    <>
      <div className="panel-header">
        <h2>Vehicle risk overview</h2>
        <span className="panel-subtitle">
          Sorted by VIN; click a row to drill into warranty risk drivers.
        </span>
      </div>

      {loading ? (
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
                  className={v.id === selectedVehicleId ? "row-selected" : ""}
                  onClick={() => onSelectVehicle(v.id)}
                >
                  <td>{v.vin}</td>
                  <td>{v.model}</td>
                  <td>{v.model_year}</td>
                  <td>{v.mileage.toLocaleString("en-US")} mi</td>
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
    </>
  );
};

export default VehicleList;