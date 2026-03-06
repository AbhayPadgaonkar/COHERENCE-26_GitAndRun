"""Nodal Agency Service - Business logic"""
from .repository import NodalAgencyRepository
from app.database.schemas import (
    NodalAgencyAccountCreate,
    NodalAgencyAccountResponse,
    NodalAgencyIdleFundAlert
)
from app.core.constants import NODAL_AGENCY_TYPES
from app.core.logger import logger
from typing import List, Optional, Dict
from datetime import datetime, timedelta


class NodalAgencyService:
    """Service layer for nodal agency operations"""
    
    def __init__(self):
        self.repository = NodalAgencyRepository()
    
    async def register_agency(self, agency: NodalAgencyAccountCreate) -> dict:
        """Register a new nodal agency with validation"""
        # TODO: Add validation logic:
        # - Validate agency_type is in NODAL_AGENCY_TYPES
        # - Validate account_number format
        # - Validate IFSC code
        # - Check for duplicate agency_code
        
        if agency.agency_type not in NODAL_AGENCY_TYPES:
            raise ValueError(f"Invalid agency type: {agency.agency_type}")
        
        if not agency.account_number or len(agency.account_number) < 9:
            raise ValueError("Invalid account number")
        
        return await self.repository.create_agency(agency)
    
    async def detect_idle_funds(
        self, 
        idle_days_threshold: int = 30,
        min_balance: float = 1000000
    ) -> List[NodalAgencyIdleFundAlert]:
        """Detect nodal agencies with idle funds"""
        # TODO: Implement idle fund detection:
        # - Get agencies with high balance and no recent transactions
        # - Calculate days_idle
        # - Generate alerts
        
        agencies = await self.repository.detect_idle_funds(
            idle_days_threshold, 
            min_balance
        )
        
        alerts = []
        for agency in agencies:
            days_idle = (datetime.utcnow() - agency.last_transaction_date).days
            
            alert = NodalAgencyIdleFundAlert(
                agency_id=agency.agency_id,
                agency_name=agency.agency_name,
                scheme_id=agency.scheme_id,
                idle_amount=agency.current_balance,
                days_idle=days_idle,
                last_transaction_date=agency.last_transaction_date,
                alert_severity="High" if days_idle > 60 else "Medium"
            )
            alerts.append(alert)
        
        return alerts
    
    def update_balance(
        self, 
        agency_id: int,
        transaction_type: str,
        transaction_amount: float,
        transaction_reference: str
    ) -> dict:
        """Update nodal agency balance after transaction"""
        # Get current agency
        agency = self.repository.get_agency_by_id(agency_id)
        
        if not agency:
            raise ValueError(f"Agency {agency_id} not found")
        
        # Calculate new balance based on transaction_type
        current_bal = agency.get("current_balance", 0.0)
        
        if transaction_type.lower() == "credit":
            new_balance = current_bal + transaction_amount
        elif transaction_type.lower() == "debit":
            new_balance = current_bal - transaction_amount
        else:
            raise ValueError(f"Invalid transaction type: {transaction_type}")
        
        # Update balance in repository
        updated = self.repository.update_agency_balance(
            agency_id=agency_id,
            new_balance=new_balance,
            last_transaction_date=datetime.utcnow(),
            transaction_type=transaction_type,
            transaction_amount=transaction_amount
        )
        
        logger.info(f"Updated agency {agency_id}: {transaction_type} \u20b9{transaction_amount}, new balance: \u20b9{new_balance}")
        return updated
    
    async def flag_agency_for_investigation(
        self, 
        agency_id: int,
        reason: str,
        flagged_by: str
    ) -> dict:
        """Flag an agency for investigation"""
        return await self.repository.flag_agency(agency_id, reason, flagged_by)
    
    async def get_agency_utilization_rate(self, agency_id: int) -> float:
        """Calculate fund utilization rate for an agency"""
        # TODO: Implement utilization calculation:
        # - total_credited / (current_balance + total_debited)
        
        raise NotImplementedError("Utilization rate calculation pending")
