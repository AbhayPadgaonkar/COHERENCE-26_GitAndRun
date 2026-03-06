"""Utilization Certificate Repository - Database operations"""
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.database.schemas import UtilizationCertificateCreate, UtilizationCertificate
from typing import List, Optional, Dict
from datetime import datetime


class UtilizationCertificateRepository:
    """Repository for utilization certificate database operations"""
    
    COLLECTION_NAME = "utilization_certificates"
    
    def __init__(self):
        """Initialize repository with Firebase and fallback in-memory storage"""
        self.firebase = FirebaseConfig.get_db()
        self.certificates = []  # Fallback in-memory storage
        self.id_counter = 1
    
    async def create_uc(self, uc: UtilizationCertificateCreate) -> dict:
        """Create a new utilization certificate"""
        uc_data = uc.model_dump()
        uc_data["created_at"] = datetime.utcnow().isoformat()
        uc_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Try to save to Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(uc_data)
                uc_data["document_id"] = doc_ref[1].id
                logger.info(f"UC created in Firebase: {doc_ref[1].id}")
                return uc_data
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback in-memory storage")
        
        # Fallback: in-memory storage
        uc_data["uc_id"] = self.id_counter
        self.certificates.append(uc_data)
        self.id_counter += 1
        return uc_data
    
    async def get_uc_by_id(self, uc_id: int) -> Optional[dict]:
        """Get utilization certificate by ID"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('uc_id', '==', uc_id).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((uc for uc in self.certificates if uc.get("uc_id") == uc_id), None)
    
    async def get_uc_by_number(self, uc_number: str) -> Optional[UtilizationCertificate]:
        """Get utilization certificate by UC number"""
        # TODO: Implement Firestore query
        raise NotImplementedError("Firestore query operation pending")
    
    async def get_scheme_ucs(
        self, 
        scheme_id: int,
        status: Optional[str] = None,
        financial_year: Optional[str] = None
    ) -> List[UtilizationCertificate]:
        """Get all UCs for a scheme with optional filters"""
        # TODO: Implement Firestore query with filters
        raise NotImplementedError("Firestore query operation pending")
    
    async def get_pending_verification_ucs(self) -> List[UtilizationCertificate]:
        """Get all UCs pending verification"""
        # TODO: Implement Firestore query filtering by uc_status = 'Pending Verification'
        raise NotImplementedError("Firestore query operation pending")
    
    async def update_uc_status(
        self, 
        uc_id: int,
        new_status: str,
        verified_by: Optional[str] = None,
        verified_date: Optional[datetime] = None,
        verification_remarks: Optional[str] = None
    ) -> UtilizationCertificate:
        """Update UC status and verification details"""
        # TODO: Implement Firestore update operation
        raise NotImplementedError("Firestore update operation pending")
    
    async def get_overdue_ucs(self, days_threshold: int = 30) -> List[UtilizationCertificate]:
        """Get overdue utilization certificates"""
        # TODO: Implement Firestore query:
        # - submitted_date + days_threshold < datetime.utcnow()
        # - uc_status = 'Submitted' or 'Pending Verification'
        
        raise NotImplementedError("Overdue UC query pending")
    
    async def get_state_uc_statistics(
        self, 
        state_code: str,
        financial_year: str
    ) -> Dict:
        """Get UC statistics for a state"""
        # TODO: Implement aggregation query
        raise NotImplementedError("State UC statistics query pending")
    
    async def get_district_uc_summary(
        self, 
        state_code: str,
        district_code: str,
        quarter: Optional[str] = None
    ) -> Dict:
        """Get UC summary for a district"""
        # TODO: Implement aggregation query
        raise NotImplementedError("District UC summary query pending")
