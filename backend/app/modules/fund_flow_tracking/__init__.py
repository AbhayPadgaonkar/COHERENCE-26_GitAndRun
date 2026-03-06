"""Fund Flow Tracking Module"""
from typing import List, Optional
from app.database.schemas import FundFlowCreate, FundFlowResponse, NodalAgencyAccountCreate
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from datetime import datetime


class FundFlowRepository:
    """Repository for fund flow operations"""
    
    COLLECTION_NAME = "fund_flows"
    
    def __init__(self):
        self.firebase = FirebaseConfig.get_db()
        self.flows = []
        self.id_counter = 1
    
    def create_flow(self, flow: FundFlowCreate) -> dict:
        """Create a new fund flow record"""
        flow_dict = {
            "created_at": datetime.now().isoformat(),
            **flow.model_dump()
        }
        
        # Try Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(flow_dict)
                flow_dict["document_id"] = doc_ref[1].id
                logger.info(f"Fund flow created in Firebase: {doc_ref[1].id}")
                return flow_dict
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback")
        
        # Fallback: in-memory
        flow_dict["id"] = self.id_counter
        self.flows.append(flow_dict)
        self.id_counter += 1
        return flow_dict
    
    def get_flow(self, flow_id: int) -> Optional[dict]:
        """Get flow by ID"""
        return next((f for f in self.flows if f["id"] == flow_id), None)
    
    def list_flows(self, scheme_id: Optional[int] = None) -> List[dict]:
        """List flows, optionally filtered by scheme"""
        # Try Firebase
        if self.firebase:
            try:
                query = self.firebase.collection(self.COLLECTION_NAME)
                if scheme_id:
                    query = query.where("scheme_id", "==", scheme_id)
                docs = query.stream()
                flows = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    flows.append(data)
                if flows:
                    return flows
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory
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
        # Import here to avoid circular dependency
        from app.modules.nodal_agency_monitoring import NodalAgencyService
        self.nodal_service = NodalAgencyService()
    
    def track_fund_movement(self, flow: FundFlowCreate) -> dict:
        """Track a fund transfer and auto-update nodal agency if credited"""
        # Create the fund flow record
        flow_record = self.repository.create_flow(flow)
        
        # Auto-update nodal agency when funds are credited to State level
        if flow.status == "credited" and flow.to_level == "State":
            try:
                # Find or create nodal agency for the state
                agency = self._get_or_create_nodal_agency(flow)
                
                if agency:
                    # Update agency balance with credited amount
                    self.nodal_service.update_balance(
                        agency_id=agency["id"],
                        transaction_type="credit",
                        transaction_amount=flow.amount,
                        transaction_reference=flow.fund_flow_reference
                    )
                    logger.info(f"Auto-updated nodal agency {agency['id']} with ₹{flow.amount}")
                    flow_record["nodal_agency_updated"] = True
                    flow_record["nodal_agency_id"] = agency["id"]
            except Exception as e:
                logger.error(f"Failed to auto-update nodal agency: {e}")
                flow_record["nodal_agency_updated"] = False
                flow_record["nodal_agency_error"] = str(e)
        
        return flow_record
    
    def _get_or_create_nodal_agency(self, flow: FundFlowCreate) -> Optional[dict]:
        """Get existing nodal agency or create new one for the receiving state"""
        try:
            # Try to find existing nodal agency by state code and scheme
            agencies = self.nodal_service.repository.get_agencies_by_scheme(flow.scheme_id)
            
            # Search for matching state agency
            for agency in agencies:
                if (agency.get("state_code") == flow.to_entity_code or 
                    agency.get("agency_name") == flow.to_entity_name):
                    return agency
            
            # If not found, create new nodal agency account
            logger.info(f"Creating new nodal agency for {flow.to_entity_name}")
            
            new_agency = NodalAgencyAccountCreate(
                agency_name=f"{flow.to_entity_name} - Nodal Agency",
                agency_type="State Nodal Agency",
                account_number=f"NA-{flow.to_entity_code}-{flow.scheme_id}",
                bank_name=flow.to_account_number or "State Treasury",
                branch_name="Main Branch",
                ifsc_code=flow.to_ifsc_code or "UNKNOWN",
                scheme_id=flow.scheme_id,
                scheme_code=flow.fund_flow_reference.split("-")[1] if "-" in flow.fund_flow_reference else "UNKNOWN",
                state_code=flow.to_entity_code,
                opening_balance=0.0,
                current_balance=0.0,
                balance_threshold=1000000000.0,  # ₹100 Crore threshold
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by="system_auto_created"
            )
            
            created_agency = self.nodal_service.repository.create_agency(new_agency)
            return created_agency
            
        except Exception as e:
            logger.error(f"Error in _get_or_create_nodal_agency: {e}")
            return None
    
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
