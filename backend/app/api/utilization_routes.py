"""Utilization Monitoring Routes"""
from fastapi import APIRouter, HTTPException
from app.database.schemas import UtilizationCreate, UtilizationResponse
from app.modules.utilization_monitoring import UtilizationService
from typing import List

router = APIRouter(prefix="/utilization", responses={404: {"description": "Not found"}})

# Initialize service
utilization_service = UtilizationService()


@router.post("/record", response_model=UtilizationResponse, status_code=201)
async def record_utilization(record: UtilizationCreate):
    """Record fund utilization"""
    result = utilization_service.record_utilization(record)
    return result


@router.get("/scheme/{scheme_id}/{admin_level}")
async def get_utilization_status(scheme_id: int, admin_level: str):
    """Get utilization status for a scheme"""
    result = utilization_service.get_utilization_status(scheme_id, admin_level)
    if result.get("status") == "no_data":
        raise HTTPException(status_code=404, detail="No utilization data found")
    return {
        "scheme_id": scheme_id,
        "admin_level": admin_level,
        **result
    }


@router.get("/underutilized")
async def get_underutilized_schemes(threshold: float = 0.25):
    """Get schemes with utilization below threshold"""
    underutilized = utilization_service.identify_underutilized_schemes(threshold)
    return {
        "threshold_percentage": threshold * 100,
        "count": len(underutilized),
        "schemes": underutilized
    }


@router.get("/scheme/{scheme_id}/{admin_level}/lapse-projection")
async def project_fund_lapse(scheme_id: int, admin_level: str, days_remaining: int = 30):
    """Project potential fund lapse"""
    projection = utilization_service.project_fund_lapse(scheme_id, admin_level, days_remaining)
    if projection.get("status") == "no_data":
        raise HTTPException(status_code=404, detail="No utilization data found")
    return {
        "scheme_id": scheme_id,
        "admin_level": admin_level,
        "days_remaining": days_remaining,
        **projection
    }
