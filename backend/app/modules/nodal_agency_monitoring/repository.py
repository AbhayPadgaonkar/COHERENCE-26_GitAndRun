"""Nodal Agency Repository - Database operations"""
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.database.schemas import NodalAgencyAccountCreate, NodalAgencyAccount
from typing import List, Optional, Dict
from datetime import datetime, timedelta


class NodalAgencyRepository:
    """Repository for nodal agency database operations"""
    
    COLLECTION_NAME = "nodal_agencies"
    
    def __init__(self):
        """Initialize repository with Firebase and fallback in-memory storage"""
        self.firebase = FirebaseConfig.get_db()
        self.agencies = []  # Fallback in-memory storage
        self.id_counter = 1
    
    async def create_agency(self, agency: NodalAgencyAccountCreate) -> dict:
        """Create a new nodal agency account"""
        agency_data = agency.model_dump()
        agency_data["created_at"] = datetime.utcnow().isoformat()
        agency_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Try to save to Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(agency_data)
                agency_data["document_id"] = doc_ref[1].id
                logger.info(f"Agency created in Firebase: {doc_ref[1].id}")
                return agency_data
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback in-memory storage")
        
        # Fallback: in-memory storage
        agency_data["agency_id"] = self.id_counter
        self.agencies.append(agency_data)
        self.id_counter += 1
        return agency_data
    
    async def get_agency_by_id(self, agency_id: int) -> Optional[dict]:
        """Get nodal agency by ID"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('agency_id', '==', agency_id).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((a for a in self.agencies if a.get("agency_id") == agency_id), None)
    
    async def get_agencies_by_scheme(self, scheme_id: int) -> List[NodalAgencyAccount]:
        """Get all nodal agencies for a scheme"""
        # TODO: Implement Firestore query
        raise NotImplementedError("Firestore query operation pending")
    
    async def update_agency_balance(
        self, 
        agency_id: int, 
        new_balance: float,
        last_transaction_date: datetime
    ) -> NodalAgencyAccount:
        """Update nodal agency balance after transaction"""
        # TODO: Implement Firestore update operation
        raise NotImplementedError("Firestore update operation pending")
    
    async def detect_idle_funds(
        self, 
        idle_days_threshold: int = 30,
        min_balance: float = 1000000
    ) -> List[NodalAgencyAccount]:
        """Detect agencies with idle funds"""
        # TODO: Implement Firestore query:
        # - current_balance >= min_balance
        # - last_transaction_date <= (today - idle_days_threshold)
        
        raise NotImplementedError("Idle fund detection query pending")
    
    async def get_flagged_agencies(self) -> List[NodalAgencyAccount]:
        """Get all flagged nodal agencies"""
        # TODO: Implement Firestore query filtering by flagged = True
        raise NotImplementedError("Firestore query operation pending")
    
    async def flag_agency(
        self, 
        agency_id: int, 
        reason: str,
        flagged_by: str
    ) -> NodalAgencyAccount:
        """Flag a nodal agency for investigation"""
        # TODO: Implement Firestore update operation
        # - Set flagged = True
        # - Set flag_reason = reason
        # - Set flagged_date = datetime.utcnow()
        
        raise NotImplementedError("Firestore update operation pending")
    
    async def get_agency_transactions(
        self, 
        agency_id: int,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Get transaction history for an agency"""
        # TODO: Query related fund_flows collection
        raise NotImplementedError("Transaction history query pending")
