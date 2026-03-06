"""Utilization Certificate Service - Business logic"""
from .repository import UtilizationCertificateRepository
from app.database.schemas import (
    UtilizationCertificateCreate,
    UtilizationCertificate
)
from app.core.constants import UC_STATUS
from typing import List, Optional, Dict
from datetime import datetime, timedelta


class UtilizationCertificateService:
    """Service layer for utilization certificate operations"""
    
    def __init__(self):
        self.repository = UtilizationCertificateRepository()
    
    async def submit_uc(self, uc: UtilizationCertificateCreate) -> UtilizationCertificate:
        """Submit a new utilization certificate with validation"""
        # TODO: Add validation logic:
        # - Validate uc_status is in UC_STATUS
        # - Validate financial_year format (YYYY-YYYY)
        # - Validate quarter format (Q1-Q4)
        # - Check if UC already exists for the period
        # - Validate total_expenditure = capital + revenue + administrative + beneficiary
        # - Validate total_received >= total_expenditure
        
        if uc.uc_status not in UC_STATUS:
            raise ValueError(f"Invalid UC status: {uc.uc_status}")
        
        # Validate expenditure breakdown
        calculated_expenditure = (
            (uc.capital_expenditure or 0) +
            (uc.revenue_expenditure or 0) +
            (uc.administrative_cost or 0) +
            (uc.beneficiary_payment or 0)
        )
        
        if abs(calculated_expenditure - uc.total_expenditure) > 1:  # Allow 1 rupee difference for rounding
            raise ValueError(
                f"Expenditure breakdown mismatch: "
                f"Total={uc.total_expenditure}, Calculated={calculated_expenditure}"
            )
        
        if uc.total_expenditure > uc.total_received:
            raise ValueError(
                f"Total expenditure ({uc.total_expenditure}) exceeds "
                f"total received ({uc.total_received})"
            )
        
        return await self.repository.create_uc(uc)
    
    async def verify_uc(
        self, 
        uc_id: int,
        verified_by: str,
        approved: bool,
        verification_remarks: Optional[str] = None
    ) -> UtilizationCertificate:
        """Verify/Approve or Reject a UC"""
        new_status = "Verified" if approved else "Rejected"
        
        return await self.repository.update_uc_status(
            uc_id,
            new_status,
            verified_by,
            datetime.utcnow(),
            verification_remarks
        )
    
    async def get_overdue_ucs(self, days_threshold: int = 30) -> List[UtilizationCertificate]:
        """Get all overdue UCs"""
        return await self.repository.get_overdue_ucs(days_threshold)
    
    async def calculate_state_compliance(
        self, 
        state_code: str,
        financial_year: str
    ) -> Dict:
        """Calculate UC compliance rate for a state"""
        # TODO: Implement compliance calculation:
        # - Count total UCs due (based on number of fund releases)
        # - Count UCs submitted
        # - Count UCs verified
        # - Calculate compliance_rate = (verified / due) * 100
        
        stats = await self.repository.get_state_uc_statistics(state_code, financial_year)
        
        # Placeholder calculation
        total_due = stats.get("total_due", 0)
        submitted = stats.get("submitted", 0)
        verified = stats.get("verified", 0)
        
        compliance_rate = (verified / total_due * 100) if total_due > 0 else 0.0
        
        return {
            "state_code": state_code,
            "financial_year": financial_year,
            "total_ucs_due": total_due,
            "ucs_submitted": submitted,
            "ucs_verified": verified,
            "compliance_rate": compliance_rate
        }
    
    async def generate_uc_number(
        self, 
        scheme_code: str,
        state_code: str,
        financial_year: str,
        quarter: str
    ) -> str:
        """Generate a unique UC number"""
        # Format: UC/{SCHEME_CODE}/{STATE}/{FY}/{QUARTER}/{SEQUENCE}
        # Example: UC/PMAY/MH/2023-24/Q1/001
        
        # TODO: Implement sequence generation
        sequence = "001"  # Placeholder
        
        fy_short = financial_year.replace("-", "")[-2:]  # 2023-24 -> 24
        
        uc_number = f"UC/{scheme_code}/{state_code}/{financial_year}/P{quarter}/{sequence}"
        
        return uc_number
    
    async def validate_uc_expenditure(self, uc: UtilizationCertificateCreate) -> bool:
        """Validate UC expenditure against fund releases"""
        # TODO: Implement validation:
        # - Query fund_flows for the scheme/state/period
        # - Sum total fund releases
        # - Check if total_received matches fund releases
        # - Check if unspent_balance = total_received - total_expenditure
        
        raise NotImplementedError("UC expenditure validation pending")
