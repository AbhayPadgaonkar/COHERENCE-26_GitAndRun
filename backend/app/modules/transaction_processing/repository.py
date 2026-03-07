"""Transaction Processing Repository"""
from typing import List, Optional, Dict
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from datetime import datetime
import uuid


class TransactionRepository:
    """Repository for transaction operations"""
    
    COLLECTION_NAME = "transactions"
    
    def __init__(self):
        self.firebase = FirebaseConfig.get_db()
        self.transactions = []
        self.id_counter = 1
    
    def create_transaction(self, transaction_data: Dict) -> Dict:
        """Create a new transaction record"""
        transaction_data["created_at"] = datetime.now().isoformat()
        transaction_data["id"] = self.id_counter
        self.id_counter += 1
        
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(transaction_data)
                transaction_data["document_id"] = doc_ref[1].id
                logger.info(f"Transaction created in Firebase: {doc_ref[1].id}")
                return transaction_data
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback")
        
        self.transactions.append(transaction_data)
        return transaction_data
    
    def get_transaction(self, transaction_id: str) -> Optional[Dict]:
        """Get transaction by ID"""
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where(
                    "transaction_id", "==", transaction_id
                ).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase query error: {e}")
        
        return next(
            (t for t in self.transactions if t.get("transaction_id") == transaction_id),
            None
        )
    
    def get_by_sender(self, sender_id: str) -> List[Dict]:
        """Get all transactions by sender"""
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where(
                    "sender_id", "==", sender_id
                ).stream()
                transactions = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    transactions.append(data)
                return transactions
            except Exception as e:
                logger.warning(f"Firebase query error: {e}")
        
        return [t for t in self.transactions if t.get("sender_id") == sender_id]
    
    def get_by_receiver(self, receiver_id: str) -> List[Dict]:
        """Get all transactions by receiver"""
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where(
                    "receiver_id", "==", receiver_id
                ).stream()
                transactions = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    transactions.append(data)
                return transactions
            except Exception as e:
                logger.warning(f"Firebase query error: {e}")
        
        return [t for t in self.transactions if t.get("receiver_id") == receiver_id]
    
    def update_transaction(self, transaction_id: str, update_data: Dict) -> Optional[Dict]:
        """Update transaction with blockchain hash"""
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where(
                    "transaction_id", "==", transaction_id
                ).stream()
                for doc in docs:
                    doc.reference.update(update_data)
                    data = doc.to_dict()
                    data.update(update_data)
                    logger.info(f"Transaction updated in Firebase: {transaction_id}")
                    return data
            except Exception as e:
                logger.warning(f"Firebase update error: {e}")
        
        for txn in self.transactions:
            if txn.get("transaction_id") == transaction_id:
                txn.update(update_data)
                return txn
        
        return None
    
    def list_transactions(self, sender_id: Optional[str] = None, receiver_id: Optional[str] = None) -> List[Dict]:
        """List transactions with optional filters"""
        if self.firebase:
            try:
                query = self.firebase.collection(self.COLLECTION_NAME)
                
                if sender_id:
                    query = query.where("sender_id", "==", sender_id)
                if receiver_id:
                    query = query.where("receiver_id", "==", receiver_id)
                
                docs = query.stream()
                transactions = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    transactions.append(data)
                
                if transactions:
                    return transactions
            except Exception as e:
                logger.warning(f"Firebase query error: {e}")
        
        transactions = self.transactions
        
        if sender_id:
            transactions = [t for t in transactions if t.get("sender_id") == sender_id]
        if receiver_id:
            transactions = [t for t in transactions if t.get("receiver_id") == receiver_id]
        
        return transactions
