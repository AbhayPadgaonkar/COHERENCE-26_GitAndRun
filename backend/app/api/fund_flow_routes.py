"""Fund Flow Tracking Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import FundFlowCreate, FundFlowResponse
from app.modules.fund_flow_tracking import FundFlowService
from typing import List

router = APIRouter(prefix="/funds", responses={404: {"description": "Not found"}})

# Initialize service
fund_flow_service = FundFlowService()


@router.post("/track", response_model=FundFlowResponse, status_code=201)
async def track_fund_movement(flow: FundFlowCreate):
    """Track a fund transfer between administrative levels"""
    result = fund_flow_service.track_fund_movement(flow)
    return result


@router.get("/scheme/{scheme_id}/flow", response_model=List[FundFlowResponse])
async def get_fund_flow_path(scheme_id: str):
    """Get the complete fund flow path for a scheme"""
    flows = fund_flow_service.get_fund_flow_path(scheme_id)
    if not flows:
        raise HTTPException(status_code=404, detail="No flows found for this scheme")
    return flows


@router.get("/scheme/{scheme_id}/total-transferred")
async def get_total_transferred(scheme_id: str):
    """Get total amount transferred for a scheme"""
    total = fund_flow_service.calculate_total_transferred(scheme_id)
    return {
        "scheme_id": scheme_id,
        "total_transferred": total,
        "currency": "INR"
    }


@router.get("/scheme/{scheme_id}/status-distribution")
async def get_status_distribution(scheme_id: str):
    """Get fund distribution by transfer status"""
    distribution = fund_flow_service.get_fund_status_distribution(scheme_id)
    return {
        "scheme_id": scheme_id,
        "status_distribution": distribution,
        "currency": "INR"
    }


@router.get("/scheme/{scheme_id}/bottlenecks")
async def detect_bottlenecks(scheme_id: str):
    """Detect fund transfer bottlenecks"""
    bottlenecks = fund_flow_service.detect_fund_bottlenecks(scheme_id)
    return {
        "scheme_id": scheme_id,
        "bottlenecks_count": len(bottlenecks),
        "bottlenecks": bottlenecks
    }
