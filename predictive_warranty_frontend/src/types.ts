export interface ModelInfo {
  name: string;
  model_type: string;
  auc: number;
  description: string;
}

export interface VehicleSummary {
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
}

export interface ServiceRecord {
  id: number;
  service_date: string;
  mileage: number;
  component: string;
  fault_code: string;
  action: string;
  cost: number;
  is_warranty_claim: boolean;
}

export interface VehicleDetail {
  summary: VehicleSummary;
  service_history: ServiceRecord[];
}