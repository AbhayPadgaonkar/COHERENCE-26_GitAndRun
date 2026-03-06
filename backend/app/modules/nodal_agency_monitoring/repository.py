"""Nodal Agency Repository - Database operations"""
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.database.schemas import NodalAgencyAccountCreate, NodalAgencyAccountResponse
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
    
    def create_agency(self, agency: NodalAgencyAccountCreate) -> dict:
        """Create a new nodal agency account"""
        agency_data = agency.model_dump()
        agency_data["created_at"] = datetime.utcnow().isoformat()
        agency_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Try to save to Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(agency_data)
                agency_data["document_id"] = doc_ref[1].id
                agency_data["id"] = self.id_counter
                self.id_counter += 1
                logger.info(f"Agency created in Firebase: {doc_ref[1].id}")
                return agency_data
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback in-memory storage")
        
        # Fallback: in-memory storage
        agency_data["id"] = self.id_counter
        self.agencies.append(agency_data)
        self.id_counter += 1
        return agency_data
    
    def get_agency_by_id(self, agency_id: int) -> Optional[dict]:
        """Get nodal agency by ID"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('id', '==', agency_id).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((a for a in self.agencies if a.get("id") == agency_id), None)
    
    def get_agencies_by_scheme(self, scheme_id: int) -> List[dict]:
        """Get all nodal agencies for a scheme"""
        # Try Firebase
        if self.firebase:
            try:
                query = self.firebase.collection(self.COLLECTION_NAME).where('scheme_id', '==', scheme_id)
                docs = query.stream()
                agencies = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    agencies.append(data)
                if agencies:
                    return agencies
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return [a for a in self.agencies if a.get("scheme_id") == scheme_id]
    
    def update_agency_balance(
        self, 
        agency_id: int, 
        new_balance: float,
        last_transaction_date: datetime,
        transaction_type: str = "credit",
        transaction_amount: float = 0.0
    ) -> dict:
        """Update nodal agency balance after transaction"""
        # Try Firebase
        if self.firebase:
            try:
                # Find document by agency_id
                docs = self.firebase.collection(self.COLLECTION_NAME).where('id', '==', agency_id).stream()
                for doc in docs:
                    doc_ref = self.firebase.collection(self.COLLECTION_NAME).document(doc.id)
                    update_data = {
                        "current_balance": new_balance,
                        "last_transaction_date": last_transaction_date.isoformat(),
                        "last_transaction_type": transaction_type.upper(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    
                    if transaction_type.lower() == "credit":
                        update_data["last_credit_amount"] = transaction_amount
                    else:
                        update_data["last_debit_amount"] = transaction_amount
                    
                    doc_ref.update(update_data)
                    logger.info(f"Updated agency {agency_id} balance to ₹{new_balance}")
                    
                    # Return updated data
                    updated = doc_ref.get().to_dict()
                    updated["document_id"] = doc.id
                    return updated
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback")
        
        # Fallback: in-memory storage
        for agency in self.agencies:
            if agency.get("id") == agency_id:
                agency["current_balance"] = new_balance
                agency["last_transaction_date"] = last_transaction_date.isoformat()
                agency["last_transaction_type"] = transaction_type.upper()
                agency["updated_at"] = datetime.utcnow().isoformat()
                
                if transaction_type.lower() == "credit":
                    agency["last_credit_amount"] = transaction_amount
                else:
                    agency["last_debit_amount"] = transaction_amount
                    
                return agency
        
        raise ValueError(f"Agency {agency_id} not found")
    
    async def detect_idle_funds(
        self, 
        idle_days_threshold: int = 30,
        min_balance: float = 1000000
    ) -> List[dict]:
        """Detect agencies with idle funds"""
        # TODO: Implement Firestore query:
        # - current_balance >= min_balance
        # - last_transaction_date <= (today - idle_days_threshold)
        
        raise NotImplementedError("Idle fund detection query pending")
    
    async def get_flagged_agencies(self) -> List[dict]:
        """Get all flagged nodal agencies"""
        # TODO: Implement Firestore query filtering by flagged = True
        raise NotImplementedError("Firestore query operation pending")
    
    async def flag_agency(
        self, 
        agency_id: int, 
        reason: str,
        flagged_by: str
    ) -> dict:
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
