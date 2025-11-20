from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from .database import Base

# -----------------------------
# ORM models
# -----------------------------


class Dealership(Base):
    __tablename__ = "dealerships"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)

    vehicles = relationship("Vehicle", back_populates="dealership")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True, nullable=False)
    model = Column(String, index=True, nullable=False)
    model_year = Column(Integer, nullable=False)
    oem = Column(String, nullable=False)

    dealership_id = Column(Integer, ForeignKey("dealerships.id"))
    sale_date = Column(Date, nullable=False)
    mileage = Column(Integer, nullable=False)
    age_months = Column(Float, nullable=False)

    avg_engine_temp = Column(Float, nullable=False)
    avg_vibration = Column(Float, nullable=False)
    services_last_12m = Column(Integer, nullable=False)

    supplier_code = Column(String, nullable=False)
    plant_code = Column(String, nullable=False)
    region = Column(String, nullable=False)

    failure_label = Column(Boolean, nullable=False)  # target y

    dealership = relationship("Dealership", back_populates="vehicles")
    service_records = relationship(
        "ServiceRecord", back_populates="vehicle", cascade="all, delete-orphan"
    )
    sensor_readings = relationship(
        "SensorReading", back_populates="vehicle", cascade="all, delete-orphan"
    )
    production_logs = relationship(
        "ProductionLog", back_populates="vehicle", cascade="all, delete-orphan"
    )


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    service_date = Column(Date, nullable=False)
    mileage = Column(Integer, nullable=False)
    component = Column(String, nullable=False)
    fault_code = Column(String, nullable=False)
    action = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    is_warranty_claim = Column(Boolean, nullable=False)

    vehicle = relationship("Vehicle", back_populates="service_records")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    timestamp = Column(DateTime, nullable=False)
    component = Column(String, nullable=False)
    temperature = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)

    vehicle = relationship("Vehicle", back_populates="sensor_readings")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    plant_code = Column(String, nullable=False)
    line = Column(String, nullable=False)
    shift = Column(String, nullable=False)
    batch_no = Column(String, nullable=False)
    supplier_code = Column(String, nullable=False)
    ambient_temp = Column(Float, nullable=False)
    assembly_date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle", back_populates="production_logs")