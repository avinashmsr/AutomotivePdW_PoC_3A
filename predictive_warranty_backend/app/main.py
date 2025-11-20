from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .database import SessionLocal, engine, Base, get_db
from .generate_synthetic_data_and_train import (
    initialize_models,
    DEFAULT_MODEL_NAME,
    MODEL_REGISTRY,
    predict_vehicle_risk,
    bucket_from_risk,
)
from .schemas import ModelInfo, VehicleSummary, VehicleDetail, ServiceRecordOut
from .models import Vehicle
from sqlalchemy.orm import Session

# -----------------------------
# FastAPI app & routes
# -----------------------------

app = FastAPI(
    title="Predictive Warranty PoC",
    description="Predictive warranty risk scoring for OEMs using synthetic data.",
)

origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # initialize_models() will create tables, seed DB, and train models
    initialize_models()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models", response_model=List[ModelInfo])
def list_models():
    return [
        ModelInfo(
            name=name,
            model_type=info["type"],
            auc=info["auc"],
            description=info["description"],
        )
        for name, info in MODEL_REGISTRY.items()
    ]


@app.get("/vehicles", response_model=List[VehicleSummary])
def list_vehicles(
    model_name: str = Query(DEFAULT_MODEL_NAME),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).limit(limit).all()
    summaries: List[VehicleSummary] = []

    for v in vehicles:
        risk = predict_vehicle_risk(v, model_name)
        risk_bucket = bucket_from_risk(risk)
        summaries.append(
            VehicleSummary(
                id=v.id,
                vin=v.vin,
                model=v.model,
                model_year=v.model_year,
                mileage=v.mileage,
                age_months=round(v.age_months, 1),
                dealership_name=v.dealership.name if v.dealership else "N/A",
                region=v.region,
                supplier_code=v.supplier_code,
                plant_code=v.plant_code,
                avg_engine_temp=round(v.avg_engine_temp, 1),
                avg_vibration=round(v.avg_vibration, 2),
                services_last_12m=v.services_last_12m,
                failure_label=v.failure_label,
                risk_score=round(risk, 3),
                risk_bucket=risk_bucket,
            )
        )
    return summaries


@app.get("/vehicles/{vehicle_id}", response_model=VehicleDetail)
def get_vehicle_detail(
    vehicle_id: int,
    model_name: str = Query(DEFAULT_MODEL_NAME),
    db: Session = Depends(get_db),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    risk = predict_vehicle_risk(v, model_name)
    risk_bucket = bucket_from_risk(risk)

    summary = VehicleSummary(
        id=v.id,
        vin=v.vin,
        model=v.model,
        model_year=v.model_year,
        mileage=v.mileage,
        age_months=round(v.age_months, 1),
        dealership_name=v.dealership.name if v.dealership else "N/A",
        region=v.region,
        supplier_code=v.supplier_code,
        plant_code=v.plant_code,
        avg_engine_temp=round(v.avg_engine_temp, 1),
        avg_vibration=round(v.avg_vibration, 2),
        services_last_12m=v.services_last_12m,
        failure_label=v.failure_label,
        risk_score=round(risk, 3),
        risk_bucket=risk_bucket,
    )

    history = sorted(
        v.service_records, key=lambda s: s.service_date, reverse=True
    )
    service_history = [
        ServiceRecordOut(
            id=s.id,
            service_date=s.service_date,
            mileage=s.mileage,
            component=s.component,
            fault_code=s.fault_code,
            action=s.action,
            cost=s.cost,
            is_warranty_claim=s.is_warranty_claim,
        )
        for s in history
    ]

    return VehicleDetail(summary=summary, service_history=service_history)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)