"""Fund Flow Tracking Module"""
from typing import List, Optional
from app.database.schemas import FundFlowCreate, FundFlowResponse
from datetime import datetime


class FundFlowRepository:
    """Repository for fund flow operations"""
    
    def __init__(self):
        self.flows = []
        self.id_counter = 1
    
    def create_flow(self, flow: FundFlowCreate) -> dict:
        """Create a new fund flow record"""
        flow_dict = {
            "id": self.id_counter,
            "created_at": datetime.now(),
            **flow.model_dump()
        }
        self.flows.append(flow_dict)
        self.id_counter += 1
        return flow_dict
    
    def get_flow(self, flow_id: int) -> Optional[dict]:
        """Get flow by ID"""
        return next((f for f in self.flows if f["id"] == flow_id), None)
    
    def list_flows(self, scheme_id: Optional[int] = None) -> List[dict]:
        """List flows, optionally filtered by scheme"""
        if scheme_id:
            return [f for f in self.flows if f.get("scheme_id") == scheme_id]
        return self.flows
    
    def get_flows_by_level(self, level: str) -> List[dict]:
        """Get flows at a specific administrative level"""
        return [f for f in self.flows if f.get("from_level") == level or f.get("to_level") == level]


class FundFlowService:
    """Business logic for fund flow tracking"""
    
    def __init__(self):
        self.repository = FundFlowRepository()
    
    def track_fund_movement(self, flow: FundFlowCreate) -> dict:
        """Track a fund transfer"""
        return self.repository.create_flow(flow)
    
    def get_fund_flow_path(self, scheme_id: int) -> List[dict]:
        """Get the complete flow path for a scheme"""
        flows = self.repository.list_flows(scheme_id)
        return sorted(flows, key=lambda x: x.get("transfer_date"))
    
    def calculate_total_transferred(self, scheme_id: int) -> float:
        """Calculate total amount transferred for a scheme"""
        flows = self.repository.list_flows(scheme_id)
        return sum(f.get("amount", 0) for f in flows)
    
    def get_fund_status_distribution(self, scheme_id: int) -> dict:
        """Get distribution of funds by status"""
        flows = self.repository.list_flows(scheme_id)
        status_dist = {}
        for flow in flows:
            status = flow.get("status")
            status_dist[status] = status_dist.get(status, 0) + flow.get("amount", 0)
        return status_dist
    
    def detect_fund_bottlenecks(self, scheme_id: int) -> List[dict]:
        """Identify transfers taking longer than expected"""
        flows = self.repository.list_flows(scheme_id)
        bottlenecks = []
        
        for flow in flows:
            # Simple heuristic: if transfer date is old and status is still "transferred"
            days_since_transfer = (datetime.now() - flow.get("transfer_date")).days
            if days_since_transfer > 30 and flow.get("status") == "transferred":
                bottlenecks.append({
                    "flow_id": flow.get("id"),
                    "days_delayed": days_since_transfer,
                    "from_level": flow.get("from_level"),
                    "to_level": flow.get("to_level"),
                    "amount": flow.get("amount")
                })
        
        return bottlenecks
