"""Utilization Monitoring Module"""
from typing import List, Optional
from app.database.schemas import UtilizationCreate, UtilizationResponse
from app.core.constants import CRITICAL_UTILIZATION, WARNING_UTILIZATION, GOOD_UTILIZATION


class UtilizationRepository:
    """Repository for utilization data"""
    
    def __init__(self):
        self.records = []
        self.id_counter = 1
    
    def create_record(self, record: UtilizationCreate) -> dict:
        """Create a utilization record"""
        record_dict = {
            "id": self.id_counter,
            **record.model_dump()
        }
        self.records.append(record_dict)
        self.id_counter += 1
        return record_dict
    
    def get_latest_utilization(self, scheme_id: int, admin_level: str) -> Optional[dict]:
        """Get latest utilization record"""
        matching = [r for r in self.records 
                   if r.get("scheme_id") == scheme_id and r.get("admin_level") == admin_level]
        return max(matching, key=lambda x: x.get("report_date")) if matching else None


class UtilizationService:
    """Business logic for utilization monitoring"""
    
    def __init__(self):
        self.repository = UtilizationRepository()
    
    def record_utilization(self, record: UtilizationCreate) -> dict:
        """Record fund utilization"""
        return self.repository.create_record(record)
    
    def get_utilization_status(self, scheme_id: int, admin_level: str) -> dict:
        """Get utilization status for a scheme"""
        record = self.repository.get_latest_utilization(scheme_id, admin_level)
        if not record:
            return {"status": "no_data"}
        
        util_pct = record.get("utilization_percentage", 0)
        
        if util_pct <= CRITICAL_UTILIZATION:
            status = "critical"
        elif util_pct <= WARNING_UTILIZATION:
            status = "warning"
        else:
            status = "good"
        
        return {
            "status": status,
            "utilization_percentage": util_pct,
            "allocated": record.get("allocated_amount"),
            "spent": record.get("spent_amount"),
            "remaining": record.get("allocated_amount") - record.get("spent_amount")
        }
    
    def identify_underutilized_schemes(self, threshold: float = CRITICAL_UTILIZATION) -> List[dict]:
        """Find schemes with low utilization"""
        underutilized = []
        
        # Group by scheme_id and get latest record
        scheme_ids = set(r.get("scheme_id") for r in self.repository.records)
        
        for scheme_id in scheme_ids:
            scheme_records = [r for r in self.repository.records if r.get("scheme_id") == scheme_id]
            if scheme_records:
                latest = max(scheme_records, key=lambda x: x.get("report_date"))
                if latest.get("utilization_percentage", 0) <= threshold:
                    underutilized.append({
                        "scheme_id": scheme_id,
                        "admin_level": latest.get("admin_level"),
                        "utilization_percentage": latest.get("utilization_percentage"),
                        "unutilized_amount": latest.get("allocated_amount") - latest.get("spent_amount")
                    })
        
        return underutilized
    
    def project_fund_lapse(self, scheme_id: int, admin_level: str, days_remaining: int) -> dict:
        """Project fund lapse if spending pattern continues"""
        record = self.repository.get_latest_utilization(scheme_id, admin_level)
        if not record:
            return {"status": "no_data"}
        
        allocated = record.get("allocated_amount")
        spent = record.get("spent_amount")
        daily_spend = spent / (days_remaining + 1) if days_remaining >= 0 else 0
        
        projected_spending = spent + (daily_spend * days_remaining)
        projected_lapse = max(0, allocated - projected_spending)
        
        return {
            "allocated": allocated,
            "already_spent": spent,
            "projected_spending": projected_spending,
            "projected_lapse": projected_lapse,
            "lapse_percentage": (projected_lapse / allocated * 100) if allocated > 0 else 0
        }
