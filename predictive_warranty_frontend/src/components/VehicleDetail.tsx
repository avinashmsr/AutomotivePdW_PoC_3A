import React from "react";
import type { VehicleDetail as VehicleDetailType } from "../types";
import { riskBadgeClass } from "../utils/uihelper";

type DriverKind =
    | "mileage"
    | "age"
    | "engineTemp"
    | "vibration"
    | "services"
    | "supplierPlant";

const DriverIcon: React.FC<{ kind: DriverKind }> = ({ kind }) => {
    let symbol = "🚗";

    switch (kind) {
        case "mileage":
            // odometer / speedometer feel
            symbol = "🏎️";
            break;
        case "age":
            // time / age of vehicle
            symbol = "⏱️";
            break;
        case "engineTemp":
            // hot engine / temperature
            symbol = "🔥";
            break;
        case "vibration":
            // vibration / waveform
            symbol = "📈";
            break;
        case "services":
            // service / wrench
            symbol = "🛠️";
            break;
        case "supplierPlant":
            // factory / plant
            symbol = "🏭";
            break;
    }

    return (
        <span className="driver-icon" aria-hidden="true">
            {symbol}
        </span>
    );
};

interface VehicleDetailProps {
    vehicleDetail: VehicleDetailType | null;
    loading: boolean;
    selectedVehicleId: number | null;
}

const formatDate = (value: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
};

const formatCurrency = (value: number) =>
    `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const VehicleDetail: React.FC<VehicleDetailProps> = ({
    vehicleDetail,
    loading,
    selectedVehicleId,
}) => {
    return (
        <>
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

            {loading && selectedVehicleId && (
                <div className="loading">Loading vehicle details…</div>
            )}

            {vehicleDetail && !loading && (
                <div className="detail-layout">
                    <div className="detail-top">
                        {/* Risk gauge card */}
                        <div className="risk-gauge-card">
                            <div className="risk-gauge-circle">
                                <div className="risk-gauge-inner">
                                    <span className="risk-gauge-percentage">
                                        {Math.round(vehicleDetail.summary.risk_score * 100)}%
                                    </span>
                                    <span className="risk-gauge-label">Failure risk</span>
                                </div>
                            </div>
                            <div className="risk-gauge-meta">
                                <div className="risk-gauge-row">
                                    <span className="label">Risk bucket</span>
                                    <span
                                        className={riskBadgeClass(
                                            vehicleDetail.summary.risk_bucket
                                        )}
                                    >
                                        {vehicleDetail.summary.risk_bucket}
                                    </span>
                                </div>
                                <div className="risk-gauge-row">
                                    <span className="label">VIN</span>
                                    <span>{vehicleDetail.summary.vin}</span>
                                </div>
                                <div className="risk-gauge-row">
                                    <span className="label">Model / Year</span>
                                    <span>
                                        {vehicleDetail.summary.model} ·{" "}
                                        {vehicleDetail.summary.model_year}
                                    </span>
                                </div>
                                <div className="risk-gauge-row">
                                    <span className="label">OEM sale / region</span>
                                    <span>
                                        {vehicleDetail.summary.dealership_name} ·{" "}
                                        {vehicleDetail.summary.region}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Drivers card */}
                        <div className="drivers-card">
                            <h3>Key drivers (features)</h3>
                            <div className="drivers-grid">
                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="mileage" />
                                        <span className="label">Mileage</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.mileage.toLocaleString("en-US")} mi
                                    </span>
                                    <span className="hint">
                                        High mileage tends to increase warranty risk.
                                    </span>
                                </div>
                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="age" />
                                        <span className="label">Age</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.age_months.toFixed(1)} months
                                    </span>
                                    <span className="hint">
                                        Older vehicles naturally carry more failure risk.
                                    </span>
                                </div>

                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="engineTemp" />
                                        <span className="label">Engine temp</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.avg_engine_temp.toFixed(1)}°C
                                    </span>
                                    <span className="hint">
                                        Elevated operating temperatures are an early warning sign.
                                    </span>
                                </div>

                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="vibration" />
                                        <span className="label">Vibration index</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.avg_vibration.toFixed(2)}
                                    </span>
                                    <span className="hint">
                                        Higher vibration levels can indicate drivetrain wear.
                                    </span>
                                </div>

                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="services" />
                                        <span className="label">Services (12m)</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.services_last_12m}
                                    </span>
                                    <span className="hint">
                                        Frequent visits may signal unstable components.
                                    </span>
                                </div>

                                <div className="driver-item">
                                    <div className="driver-header">
                                        <DriverIcon kind="supplierPlant" />
                                        <span className="label">Supplier / Plant</span>
                                    </div>
                                    <span className="value">
                                        {vehicleDetail.summary.supplier_code} ·{" "}
                                        {vehicleDetail.summary.plant_code}
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
                        {vehicleDetail.service_history.length === 0 ? (
                            <div className="empty-state">
                                No service history recorded for this vehicle in the PoC dataset.
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
                                        {vehicleDetail.service_history.map((s) => (
                                            <tr key={s.id}>
                                                <td>{formatDate(s.service_date)}</td>
                                                <td>{s.component}</td>
                                                <td>{s.fault_code}</td>
                                                <td>{s.mileage.toLocaleString("en-US")} mi</td>
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
        </>
    );
};

export default VehicleDetail;