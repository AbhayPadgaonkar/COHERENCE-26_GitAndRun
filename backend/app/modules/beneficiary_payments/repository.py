"""Beneficiary Payment Repository - Database operations"""
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.database.schemas import BeneficiaryPaymentCreate, BeneficiaryPayment
from typing import List, Optional, Dict
from datetime import datetime


class BeneficiaryPaymentRepository:
    """Repository for beneficiary payment database operations"""
    
    COLLECTION_NAME = "beneficiary_payments"
    
    def __init__(self):
        """Initialize repository with Firebase and fallback in-memory storage"""
        self.firebase = FirebaseConfig.get_db()
        self.payments = []  # Fallback in-memory storage
        self.id_counter = 1
    
    async def create_payment(self, payment: BeneficiaryPaymentCreate) -> dict:
        """Create a new beneficiary payment record"""
        payment_data = payment.model_dump()
        payment_data["created_at"] = datetime.utcnow().isoformat()
        payment_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Try to save to Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(payment_data)
                payment_data["document_id"] = doc_ref[1].id
                logger.info(f"Payment created in Firebase: {doc_ref[1].id}")
                return payment_data
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback in-memory storage")
        
        # Fallback: in-memory storage
        payment_data["payment_id"] = self.id_counter
        self.payments.append(payment_data)
        self.id_counter += 1
        return payment_data
    
    async def get_payment_by_transaction_id(self, transaction_id: str) -> Optional[dict]:
        """Get payment by PFMS transaction ID"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('pfms_transaction_id', '==', transaction_id).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((p for p in self.payments if p.get("pfms_transaction_id") == transaction_id), None)
    
    async def get_scheme_payments(
        self, 
        scheme_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[dict]:
        """Get all payments for a scheme with pagination"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('scheme_id', '==', scheme_id).offset(skip).limit(limit).stream()
                payments = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    payments.append(data)
                if payments:
                    return payments
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        filtered = [p for p in self.payments if p.get("scheme_id") == scheme_id]
        return filtered[skip:skip + limit]
    
    async def get_failed_payments(
        self, 
        scheme_id: Optional[int] = None
    ) -> List[BeneficiaryPayment]:
        """Get all failed payments"""
        # TODO: Implement Firestore query filtering by payment_status = 'Failed'
        raise NotImplementedError("Firestore query operation pending")
    
    async def detect_duplicate_beneficiaries(
        self, 
        scheme_id: int
    ) -> List[Dict]:
        """Detect duplicate beneficiaries by aadhaar or account number"""
        # TODO: Implement duplicate detection logic
        raise NotImplementedError("Duplicate detection logic pending")
    
    async def get_high_fraud_risk_payments(
        self, 
        risk_threshold: float = 0.7
    ) -> List[BeneficiaryPayment]:
        """Get payments with high fraud risk scores"""
        # TODO: Implement Firestore query filtering by fraud_risk_score
        raise NotImplementedError("Firestore query operation pending")
    
    async def get_beneficiary_payment_history(
        self, 
        beneficiary_id: str
    ) -> List[BeneficiaryPayment]:
        """Get payment history for a beneficiary"""
        # TODO: Implement Firestore query by beneficiary_id
        raise NotImplementedError("Firestore query operation pending")
    
    async def update_payment_status(
        self, 
        transaction_id: str, 
        new_status: str
    ) -> BeneficiaryPayment:
        """Update payment status"""
        # TODO: Implement Firestore update operation
        raise NotImplementedError("Firestore update operation pending")
    
    async def get_district_payment_summary(
        self, 
        state_code: str, 
        district_code: str
    ) -> Dict:
        """Get payment summary for a district"""
        # TODO: Implement aggregation query
        raise NotImplementedError("Aggregation query pending")
