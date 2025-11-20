from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import date, datetime, timedelta

# -----------------------------
# Pydantic schemas
# -----------------------------

class ModelInfo(BaseModel):
    name: str
    model_type: str
    auc: float
    description: str


class ServiceRecordOut(BaseModel):
    id: int
    service_date: date
    mileage: int
    component: str
    fault_code: str
    action: str
    cost: float
    is_warranty_claim: bool


class VehicleSummary(BaseModel):
    id: int
    vin: str
    model: str
    model_year: int
    mileage: int
    age_months: float
    dealership_name: str
    region: str
    supplier_code: str
    plant_code: str
    avg_engine_temp: float
    avg_vibration: float
    services_last_12m: int
    failure_label: bool
    risk_score: float
    risk_bucket: str


class VehicleDetail(BaseModel):
    summary: VehicleSummary
    service_history: List[ServiceRecordOut]