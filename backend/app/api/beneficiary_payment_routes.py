"""Beneficiary Payment (DBT) Routes"""
from fastapi import APIRouter, HTTPException, Query, Body
from app.database.schemas import (
    BeneficiaryPaymentCreate,
    BeneficiaryPaymentResponse,
    BeneficiaryPaymentSummary
)
from app.core.firebase import FirebaseConfig
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter(
    prefix="/beneficiaries",
    tags=["Beneficiary Payments (DBT)"],
    responses={404: {"description": "Not found"}}
)

BENEFICIARY_PAYMENTS_BETA = "beneficiary_payments-beta"

# Initialize service (TODO: Create BeneficiaryPaymentService)
# beneficiary_service = BeneficiaryPaymentService()


@router.post("/payment", response_model=BeneficiaryPaymentResponse, status_code=201)
async def record_beneficiary_payment(payment: BeneficiaryPaymentCreate):
    """Record a Direct Benefit Transfer payment"""
    # TODO: Implement service layer
    return {
        "message": "Beneficiary payment endpoint - implementation pending",
        "payment": payment.model_dump()
    }


@router.post("/payment-beta", status_code=201)
async def record_beneficiary_payment_beta(body: Dict[str, Any] = Body(...)):
    """Record a beneficiary/vendor payment into beneficiary_payments-beta. Same schema as seed for district-level disbursement."""
    db = FirebaseConfig.get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Firebase not connected")
    required = ["scheme_id", "beneficiary_id", "beneficiary_name", "payment_amount", "payment_date", "transaction_id", "state", "state_code", "district", "district_code"]
    for k in required:
        if k not in body:
            raise HTTPException(status_code=400, detail=f"Missing required field: {k}")
    try:
        data = dict(body)
        sid = data["scheme_id"]
        if isinstance(sid, str) and sid.isdigit():
            data["scheme_id"] = int(sid)
        elif not isinstance(sid, (int, float)):
            data["scheme_id"] = sid  # keep string (e.g. Firestore doc id) if not numeric
        data["payment_amount"] = float(data["payment_amount"])
        data.setdefault("aadhaar_masked", "XXXX-XXXX-0000")
        data.setdefault("mobile_number", "9999999999")
        data.setdefault("bank_account_number", "")
        data.setdefault("ifsc_code", "SBIN0001234")
        data.setdefault("bank_name", "State Bank of India")
        data.setdefault("payment_purpose", "Grant")
        data.setdefault("payment_status", "BANK_CREDITED")
        data.setdefault("created_by", "frontend")
        data["created_at"] = datetime.utcnow().isoformat()
        doc_ref = db.collection(BENEFICIARY_PAYMENTS_BETA).add(data)
        from app.core.logger import logger
        logger.info(f"Beneficiary payment saved to {BENEFICIARY_PAYMENTS_BETA}: {doc_ref[1].id}")
        return {"document_id": doc_ref[1].id, "message": "Payment recorded in beneficiary_payments-beta", "ok": True}
    except Exception as e:
        from app.core.logger import logger
        logger.exception("payment-beta error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scheme/{scheme_id}/payments", response_model=List[BeneficiaryPaymentResponse])
async def get_scheme_payments(
    scheme_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    status: Optional[str] = None
):
    """Get all beneficiary payments for a scheme"""
    # TODO: Implement service layer
    return []


@router.get("/scheme/{scheme_id}/summary")
async def get_payment_summary(scheme_id: int):
    """Get payment summary statistics for a scheme"""
    # TODO: Implement service layer
    return {
        "scheme_id": scheme_id,
        "total_beneficiaries": 0,
        "total_amount_disbursed": 0.0,
        "message": "Summary endpoint - implementation pending"
    }


@router.get("/duplicate-detection")
async def detect_duplicate_payments(
    scheme_id: Optional[int] = None,
    days: int = Query(30, ge=1, le=365)
):
    """Detect duplicate beneficiary payments"""
    # TODO: Implement duplicate detection logic
    return {
        "detection_period_days": days,
        "scheme_id": scheme_id,
        "duplicates_found": 0,
        "duplicates": [],
        "message": "Duplicate detection endpoint - implementation pending"
    }


@router.get("/failed-payments")
async def get_failed_payments(
    scheme_id: Optional[int] = None,
    days: int = Query(7, ge=1)
):
    """Get failed beneficiary payments"""
    # TODO: Implement service layer
    return {
        "period_days": days,
        "failed_count": 0,
        "payments": [],
        "message": "Failed payments endpoint - implementation pending"
    }


@router.get("/fraud-alerts")
async def get_fraud_alerts(
    scheme_id: Optional[int] = None,
    risk_threshold: float = Query(0.7, ge=0.0, le=1.0)
):
    """Get payments flagged for potential fraud"""
    # TODO: Implement fraud detection
    return {
        "risk_threshold": risk_threshold,
        "alerts_count": 0,
        "alerts": [],
        "message": "Fraud alerts endpoint - implementation pending"
    }


@router.get("/district/{state}/{district}/summary")
async def get_district_payment_summary(state: str, district: str):
    """Get payment summary for a specific district"""
    # TODO: Implement service layer
    return {
        "state": state,
        "district": district,
        "total_payments": 0,
        "total_amount": 0.0,
        "message": "District summary endpoint - implementation pending"
    }


@router.post("/bulk-upload")
async def bulk_upload_payments(payments: List[BeneficiaryPaymentCreate]):
    """Bulk upload beneficiary payments"""
    # TODO: Implement bulk upload logic
    return {
        "total_submitted": len(payments),
        "successful": 0,
        "failed": 0,
        "message": "Bulk upload endpoint - implementation pending"
    }


@router.get("/{beneficiary_id}/payment-history")
async def get_beneficiary_payment_history(beneficiary_id: str):
    """Get payment history for a specific beneficiary"""
    # TODO: Implement service layer
    return {
        "beneficiary_id": beneficiary_id,
        "payment_count": 0,
        "payments": [],
        "message": "Payment history endpoint - implementation pending"
    }


@router.get("/payment/{transaction_id}/status")
async def get_payment_status(transaction_id: str):
    """Check status of a specific payment transaction"""
    # TODO: Implement service layer
    return {
        "transaction_id": transaction_id,
        "status": "UNKNOWN",
        "message": "Payment status endpoint - implementation pending"
    }
