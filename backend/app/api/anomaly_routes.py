"""Anomaly Detection Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import AnomalyCreate, AnomalyResponse
from app.modules.anomaly_detection import AnomalyService
from typing import List, Optional

router = APIRouter(prefix="/anomalies", responses={404: {"description": "Not found"}})

# Initialize service
anomaly_service = AnomalyService()


@router.post("/record", response_model=AnomalyResponse, status_code=201)
async def record_anomaly(anomaly: AnomalyCreate):
    """Record a detected anomaly"""
    result = anomaly_service.record_anomaly(anomaly)
    return result


@router.post("/detect")
async def detect_anomalies(scheme_id: int, spending_data: List[dict]):
    """Detect anomalies in spending data"""
    anomalies = anomaly_service.detect_anomalies(scheme_id, spending_data)
    return {
        "scheme_id": scheme_id,
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies
    }


@router.get("/scheme/{scheme_id}", response_model=List[AnomalyResponse])
async def get_scheme_anomalies(scheme_id: int, severity: Optional[str] = Query(None)):
    """Get anomalies for a scheme"""
    anomalies = anomaly_service.get_scheme_anomalies(scheme_id, severity)
    if not anomalies:
        raise HTTPException(status_code=404, detail="No anomalies found for this scheme")
    return anomalies


@router.get("/scheme/{scheme_id}/summary")
async def get_anomaly_summary(scheme_id: int):
    """Get anomaly summary for a scheme"""
    all_anomalies = anomaly_service.get_scheme_anomalies(scheme_id)
    
    return {
        "scheme_id": scheme_id,
        "total_anomalies": len(all_anomalies),
        "by_severity": {
            "critical": len([a for a in all_anomalies if a.get("severity") == "critical"]),
            "warning": len([a for a in all_anomalies if a.get("severity") == "warning"]),
            "info": len([a for a in all_anomalies if a.get("severity") == "info"])
        },
        "by_type": {
            "sudden_spike": len([a for a in all_anomalies if a.get("anomaly_type") == "sudden_spike"]),
            "irregular_pattern": len([a for a in all_anomalies if a.get("anomaly_type") == "irregular_pattern"]),
            "fund_idle": len([a for a in all_anomalies if a.get("anomaly_type") == "fund_idle"]),
            "duplicate_payment": len([a for a in all_anomalies if a.get("anomaly_type") == "duplicate_payment"]),
            "fund_lapse": len([a for a in all_anomalies if a.get("anomaly_type") == "fund_lapse"])
        }
    }
