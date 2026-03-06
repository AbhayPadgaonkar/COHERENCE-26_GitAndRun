"""Utilization Certificate (UC) Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import (
    UtilizationCertificateCreate,
    UtilizationCertificateResponse
)
from typing import List, Optional
from datetime import date

router = APIRouter(
    prefix="/utilization-certificates",
    tags=["Utilization Certificates"],
    responses={404: {"description": "Not found"}}
)

# Initialize service (TODO: Create UtilizationCertificateService)
# uc_service = UtilizationCertificateService()


@router.post("/submit", response_model=UtilizationCertificateResponse, status_code=201)
async def submit_utilization_certificate(uc: UtilizationCertificateCreate):
    """Submit a new utilization certificate"""
    # TODO: Implement service layer with validation
    return {
        "message": "UC submission endpoint - implementation pending",
        "uc": uc.model_dump()
    }


@router.get("/{uc_id}", response_model=UtilizationCertificateResponse)
async def get_utilization_certificate(uc_id: int):
    """Get utilization certificate details"""
    # TODO: Implement service layer
    raise HTTPException(status_code=404, detail="UC not found - service layer pending")


@router.get("/scheme/{scheme_id}/ucs", response_model=List[UtilizationCertificateResponse])
async def get_scheme_utilization_certificates(
    scheme_id: int,
    status: Optional[str] = None,
    financial_year: Optional[str] = None
):
    """Get all utilization certificates for a scheme"""
    # TODO: Implement service layer
    return []


@router.get("/pending-verification")
async def get_pending_verification_ucs():
    """Get all UCs pending verification"""
    # TODO: Implement service layer
    return {
        "pending_count": 0,
        "ucs": [],
        "message": "Pending verification endpoint - implementation pending"
    }


@router.put("/{uc_id}/verify")
async def verify_utilization_certificate(
    uc_id: int,
    verified_by: str,
    verified_date: date,
    verification_remarks: Optional[str] = None,
    approved: bool = True
):
    """Verify/Approve or Reject a utilization certificate"""
    # TODO: Implement service layer
    return {
        "uc_id": uc_id,
        "status": "Verified" if approved else "Rejected",
        "verified_by": verified_by,
        "verified_date": verified_date,
        "message": "UC verification endpoint - implementation pending"
    }


@router.get("/overdue")
async def get_overdue_utilization_certificates(
    days_overdue: int = Query(30, ge=1)
):
    """Get all overdue utilization certificates"""
    # TODO: Implement service layer with due date calculation
    return {
        "overdue_count": 0,
        "days_threshold": days_overdue,
        "ucs": [],
        "message": "Overdue UCs endpoint - implementation pending"
    }


@router.get("/state/{state_code}/compliance-report")
async def get_state_uc_compliance(
    state_code: str,
    financial_year: str = Query(..., regex=r"^\d{4}-\d{4}$")
):
    """Get UC compliance report for a state"""
    # TODO: Implement compliance calculation
    return {
        "state_code": state_code,
        "financial_year": financial_year,
        "total_ucs_due": 0,
        "ucs_submitted": 0,
        "ucs_verified": 0,
        "compliance_rate": 0.0,
        "message": "State UC compliance endpoint - implementation pending"
    }


@router.get("/district/{state_code}/{district_code}/summary")
async def get_district_uc_summary(
    state_code: str,
    district_code: str,
    quarter: Optional[str] = Query(None, regex=r"^Q[1-4]$")
):
    """Get UC summary for a specific district"""
    # TODO: Implement district-level UC summary
    return {
        "state_code": state_code,
        "district_code": district_code,
        "quarter": quarter,
        "ucs_submitted": 0,
        "total_expenditure": 0.0,
        "message": "District UC summary endpoint - implementation pending"
    }
