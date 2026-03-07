"""Fund Flow Tracking Routes"""
from fastapi import APIRouter, HTTPException, Query, Header, Body
from app.database.schemas import FundFlowCreate, FundFlowResponse
from app.modules.fund_flow_tracking import FundFlowService
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from typing import List, Optional, Any, Dict
from datetime import datetime

router = APIRouter(prefix="/funds", responses={404: {"description": "Not found"}})

# Beta collection name for frontend/manual disbursement (same as seed script)
FUND_FLOWS_BETA = "fund_flows-beta"

# Required keys for beta fund flow (flexible for frontend)
FUND_FLOW_BETA_REQUIRED = {"scheme_id", "fund_flow_reference", "from_level", "to_level", "from_entity_code", "to_entity_code", "from_entity_name", "to_entity_name", "amount", "payment_mode", "sanction_date", "transfer_date", "status"}

# Initialize service
fund_flow_service = FundFlowService()


@router.post("/track", response_model=FundFlowResponse, status_code=201)
async def track_fund_movement(flow: FundFlowCreate):
    """Track a fund transfer between administrative levels"""
    result = fund_flow_service.track_fund_movement(flow)
    return result


@router.post("/track-beta", status_code=201)
async def track_fund_movement_beta(body: Dict[str, Any] = Body(...)):
    """Track a fund transfer into -beta collection. Accepts flexible JSON (same shape as seed)."""
    db = FirebaseConfig.get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Firebase not connected")
    missing = FUND_FLOW_BETA_REQUIRED - set(body.keys())
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {list(missing)}")
    try:
        # Normalize: ensure scheme_id is string, amounts float, dates as ISO strings
        flow_dict = dict(body)
        flow_dict["scheme_id"] = str(flow_dict["scheme_id"])
        flow_dict["amount"] = float(flow_dict["amount"])
        for key in ("sanction_date", "transfer_date", "credited_date"):
            if key in flow_dict and flow_dict[key] and hasattr(flow_dict[key], "isoformat"):
                flow_dict[key] = flow_dict[key].isoformat()
            elif key in flow_dict and flow_dict[key] and isinstance(flow_dict[key], str) and "T" in flow_dict[key]:
                pass  # already ISO string
        flow_dict["created_at"] = datetime.utcnow().isoformat()
        doc_ref = db.collection(FUND_FLOWS_BETA).add(flow_dict)
        logger.info(f"Fund flow saved to {FUND_FLOWS_BETA}: {doc_ref[1].id}")
        return {"document_id": doc_ref[1].id, "message": "Fund flow recorded in fund_flows-beta", "ok": True}
    except Exception as e:
        logger.exception("track-beta error")
        raise HTTPException(status_code=500, detail=str(e))


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
