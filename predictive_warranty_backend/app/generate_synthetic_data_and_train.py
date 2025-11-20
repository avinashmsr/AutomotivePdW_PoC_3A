from sqlalchemy.orm import Session
from app import models
import random
import numpy as np
from app.database import SessionLocal, engine
from typing import List
from datetime import date, datetime, timedelta

models.Base.metadata.create_all(bind=engine)

# -----------------------------
# Synthetic data seeding
# -----------------------------


def us_region_from_state(state: str) -> str:
    west = {"CA", "WA", "OR", "NV", "AZ", "CO", "UT"}
    midwest = {"IL", "MI", "OH", "WI", "MN", "IN"}
    south = {"TX", "FL", "GA", "NC", "SC", "AL", "TN"}
    northeast = {"NY", "MA", "PA", "NJ"}

    if state in west:
        return "US-West"
    if state in midwest:
        return "US-Midwest"
    if state in south:
        return "US-South"
    if state in northeast:
        return "US-Northeast"
    return "US-Other"


def seed_database(db: Session, n_vehicles: int = 250) -> None:
    if db.query(models.Vehicle).count() > 0:
        return

    random.seed(42)
    np.random.seed(42)

    dealerships_data = [
        ("Cochran Auto - Pittsburgh", "Pittsburgh", "PA"),
        ("Sunset Motors", "Los Angeles", "CA"),
        ("Lone Star Auto", "Dallas", "TX"),
        ("Great Lakes Motors", "Chicago", "IL"),
        ("Bay Area Auto", "San Jose", "CA"),
    ]

    dealerships: List[models.Dealership] = []
    for name, city, state in dealerships_data:
        d = models.Dealership(name=name, city=city, state=state)
        db.add(d)
        dealerships.append(d)
    db.flush()

    model_choices = [
        "Sedan-A",
        "SUV-B",
        "Truck-C",
        "EV-D",
        "Hybrid-E",
    ]
    suppliers = ["SUP-A", "SUP-B", "SUP-C", "SUP-X"]  # SUP-X is risky supplier
    plants = ["PLANT-1", "PLANT-2", "PLANT-3"]
    components = ["Engine", "Transmission", "HVAC", "Brakes", "Infotainment"]
    fault_codes = ["P0300", "P0420", "U0100", "C0035", "B0020"]

    today = date.today()

    for i in range(n_vehicles):
        dealer = random.choice(dealerships)
        model = random.choice(model_choices)
        model_year = random.randint(2018, 2025)
        sale_year = random.randint(model_year, 2025)
        sale_month = random.randint(1, 12)
        sale_day = random.randint(1, 28)
        sale_date = date(sale_year, sale_month, sale_day)
        if sale_date > today:
            sale_date = today - timedelta(days=random.randint(30, 365))

        age_days = (today - sale_date).days
        age_months = max(age_days / 30.0, 1.0)

        base_mileage = age_months * random.uniform(800, 1400)
        mileage = int(np.clip(np.random.normal(base_mileage, base_mileage * 0.2), 5000, 240000))

        avg_engine_temp = float(np.random.normal(90, 10))
        avg_vibration = float(np.random.normal(3.5, 1.0))

        services_last_12m = int(max(0, np.random.poisson(1 + (mileage / 50000.0))))

        supplier_code = random.choice(suppliers)
        plant_code = random.choice(plants)
        region = us_region_from_state(dealer.state)

        # Risk signal engineering
        base_risk = 0.03
        if mileage > 120_000:
            base_risk += 0.25
        elif mileage > 90_000:
            base_risk += 0.15

        if avg_engine_temp > 100:
            base_risk += 0.15
        if avg_vibration > 4.5:
            base_risk += 0.1
        if services_last_12m >= 3:
            base_risk += 0.1
        if supplier_code == "SUP-X":
            base_risk += 0.12

        failure_label = random.random() < min(max(base_risk, 0.02), 0.9)

        vin = f"VIN{i:06d}"

        vehicle = models.Vehicle(
            vin=vin,
            model=model,
            model_year=model_year,
            oem="Demo OEM",
            dealership=dealer,
            sale_date=sale_date,
            mileage=mileage,
            age_months=age_months,
            avg_engine_temp=avg_engine_temp,
            avg_vibration=avg_vibration,
            services_last_12m=services_last_12m,
            supplier_code=supplier_code,
            plant_code=plant_code,
            region=region,
            failure_label=failure_label,
        )
        db.add(vehicle)
        db.flush()

        # Production log
        prod_log = models.ProductionLog(
            vehicle_id=vehicle.id,
            plant_code=plant_code,
            line=f"L-{random.randint(1,3)}",
            shift=random.choice(["A", "B", "C"]),
            batch_no=f"{supplier_code}-{random.randint(100,999)}",
            supplier_code=supplier_code,
            ambient_temp=float(np.random.normal(80, 15)),
            assembly_date=sale_date - timedelta(days=random.randint(7, 60)),
        )
        db.add(prod_log)

        # Service records
        num_services = max(
            0,
            int(
                np.random.poisson(1 + (mileage / 60000.0))
            ),
        )
        for _ in range(num_services):
            days_ago = random.randint(30, max(60, age_days + 30))
            service_date = today - timedelta(days=days_ago)
            sr = models.ServiceRecord(
                vehicle_id=vehicle.id,
                service_date=service_date,
                mileage=max(5000, int(mileage - random.uniform(0, mileage * 0.3))),
                component=random.choice(components),
                fault_code=random.choice(fault_codes),
                action=random.choice(
                    ["Replaced", "Repaired", "Software update", "Inspect & clean"]
                ),
                cost=float(np.random.uniform(80, 1800)),
                is_warranty_claim=bool(
                    failure_label and random.random() < 0.7
                    or random.random() < 0.2
                ),
            )
            db.add(sr)

        # Sensor readings (short time history)
        for _ in range(20):
            ts = datetime.now() - timedelta(hours=random.randint(1, 72))
            sensor = models.SensorReading(
                vehicle_id=vehicle.id,
                timestamp=ts,
                component=random.choice(components),
                temperature=float(np.random.normal(avg_engine_temp, 5)),
                vibration=float(np.random.normal(avg_vibration, 0.5)),
                pressure=float(np.random.normal(30, 3)),
            )
            db.add(sensor)

    db.commit()