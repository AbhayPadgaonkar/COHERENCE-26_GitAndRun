"""Nodal Agency Monitoring Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import (
    NodalAgencyAccountCreate,
    NodalAgencyAccountResponse,
    NodalAgencyIdleFundAlert
)
from typing import List, Optional

router = APIRouter(
    prefix="/nodal-agencies",
    tags=["Nodal Agency Monitoring"],
    responses={404: {"description": "Not found"}}
)

# Initialize service (TODO: Create NodalAgencyService)
# nodal_service = NodalAgencyService()


@router.post("/register", response_model=NodalAgencyAccountResponse, status_code=201)
async def register_nodal_agency(agency: NodalAgencyAccountCreate):
    """Register a new nodal agency account"""
    # TODO: Implement service layer
    return {
        "message": "Nodal agency registration endpoint - implementation pending",
        "agency": agency.model_dump()
    }


@router.get("/{agency_id}", response_model=NodalAgencyAccountResponse)
async def get_nodal_agency(agency_id: int):
    """Get nodal agency details"""
    # TODO: Implement service layer
    raise HTTPException(status_code=404, detail="Nodal agency not found - service layer pending")


@router.get("/scheme/{scheme_id}/agencies", response_model=List[NodalAgencyAccountResponse])
async def get_scheme_nodal_agencies(scheme_id: int):
    """Get all nodal agencies for a scheme"""
    # TODO: Implement service layer
    return []


@router.get("/idle-funds", response_model=List[NodalAgencyIdleFundAlert])
async def detect_idle_funds(
    idle_days_threshold: int = Query(30, ge=1),
    min_balance: float = Query(1000000, ge=0)
):
    """Detect nodal agencies with idle funds"""
    # TODO: Implement idle fund detection logic
    return []


@router.put("/{agency_id}/update-balance")
async def update_agency_balance(
    agency_id: int,
    new_balance: float,
    transaction_type: str,
    transaction_amount: float,
    transaction_reference: str,
    utr_number: Optional[str] = None
):
    """Update nodal agency balance after transaction"""
    # TODO: Implement service layer
    return {
        "agency_id": agency_id,
        "new_balance": new_balance,
        "transaction_type": transaction_type,
        "message": "Balance update endpoint - implementation pending"
    }


@router.get("/{agency_id}/transactions")
async def get_agency_transactions(
    agency_id: int,
    days: int = Query(30, ge=1, le=365)
):
    """Get transaction history for a nodal agency"""
    # TODO: Implement service layer
    return {
        "agency_id": agency_id,
        "period_days": days,
        "transaction_count": 0,
        "transactions": [],
        "message": "Transaction history endpoint - implementation pending"
    }


@router.get("/flagged-accounts")
async def get_flagged_accounts():
    """Get all flagged nodal agency accounts"""
    # TODO: Implement service layer
    return {
        "flagged_count": 0,
        "accounts": [],
        "message": "Flagged accounts endpoint - implementation pending"
    }


@router.post("/{agency_id}/flag")
async def flag_agency(
    agency_id: int,
    reason: str,
    flagged_by: str
):
    """Flag a nodal agency account for investigation"""
    # TODO: Implement service layer
    return {
        "agency_id": agency_id,
        "flagged": True,
        "reason": reason,
        "flagged_by": flagged_by,
        "message": "Agency flagging endpoint - implementation pending"
    }
