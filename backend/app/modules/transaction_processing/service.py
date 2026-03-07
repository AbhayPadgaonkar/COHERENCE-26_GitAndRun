"""Transaction Processing Service - Business logic with Blockchain Integration"""
from .repository import TransactionRepository
from app.core.logger import logger
from typing import Dict, Optional, Tuple
from hashlib import sha256
import json
import uuid
from datetime import datetime


class TransactionProcessingService:
    """Service for handling transactions with blockchain integration"""
    
    def __init__(self):
        self.repository = TransactionRepository()
        self.blockchain_contract = None  # Will be set when deploying
    
    def generate_sender_hash(
        self, 
        transaction_id: str, 
        sender_id: str, 
        amount_deducted: float
    ) -> str:
        """Generate sender hash: hash of (txnId + senderId + amountDeducted + DEBIT)"""
        hash_input = f"{transaction_id}#{sender_id}#{amount_deducted}#DEBIT"
        return sha256(hash_input.encode()).hexdigest()
    
    def generate_receiver_hash(
        self, 
        transaction_id: str, 
        receiver_id: str, 
        amount_received: float
    ) -> str:
        """Generate receiver hash: hash of (txnId + receiverId + amountReceived + CREDIT)"""
        hash_input = f"{transaction_id}#{receiver_id}#{amount_received}#CREDIT"
        return sha256(hash_input.encode()).hexdigest()
    
    def process_transaction(
        self,
        sender_id: str,
        sender_dept: str,
        receiver_id: str,
        receiver_dept: str,
        amount: float,
        fees: float = 0.0,
        scheme_id: Optional[str] = None,
        fund_flow_reference: Optional[str] = None
    ) -> Dict:
        """Process a transaction with debit/credit and blockchain recording"""
        
        try:
            transaction_id = str(uuid.uuid4())
            
            # Calculate actual amounts
            amount_deducted = amount
            amount_received = amount - fees
            
            # Generate hashes for sender and receiver
            sender_hash = self.generate_sender_hash(
                transaction_id, 
                sender_id, 
                amount_deducted
            )
            receiver_hash = self.generate_receiver_hash(
                transaction_id, 
                receiver_id, 
                amount_received
            )
            
            # Create transaction record
            transaction_data = {
                "transaction_id": transaction_id,
                "sender_id": sender_id,
                "sender_dept": sender_dept,
                "receiver_id": receiver_id,
                "receiver_dept": receiver_dept,
                "amount_original": amount,
                "amount_deducted": amount_deducted,
                "amount_received": amount_received,
                "fees": fees,
                "sender_hash": sender_hash,
                "receiver_hash": receiver_hash,
                "status": "pending",
                "scheme_id": scheme_id,
                "fund_flow_reference": fund_flow_reference,
                "blockchain_recorded": False,
                "blockchain_tx_hash": None,
                "created_at": datetime.now().isoformat(),
                "timestamp": datetime.now().timestamp()
            }
            
            # Store transaction in database
            stored_transaction = self.repository.create_transaction(transaction_data)
            logger.info(f"Transaction created: {transaction_id}")
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "transaction": stored_transaction,
                "message": "Transaction created and ready for blockchain recording"
            }
            
        except Exception as e:
            logger.error(f"Transaction processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to process transaction"
            }
    
    def record_on_blockchain(
        self,
        transaction_id: str,
        blockchain_tx_hash: str,
        block_index: Optional[int] = None
    ) -> Dict:
        """Record transaction on blockchain"""
        
        try:
            transaction = self.repository.get_transaction(transaction_id)
            
            if not transaction:
                return {
                    "success": False,
                    "error": "Transaction not found",
                    "message": "Cannot record non-existent transaction on blockchain"
                }
            
            # Update transaction with blockchain details
            update_data = {
                "status": "recorded",
                "blockchain_recorded": True,
                "blockchain_tx_hash": blockchain_tx_hash,
                "block_index": block_index,
                "blockchain_recorded_at": datetime.now().isoformat()
            }
            
            updated = self.repository.update_transaction(transaction_id, update_data)
            
            logger.info(f"Transaction {transaction_id} recorded on blockchain: {blockchain_tx_hash}")
            
            return {
                "success": True,
                "transaction_id": transaction_id,
                "blockchain_tx_hash": blockchain_tx_hash,
                "message": "Transaction successfully recorded on blockchain"
            }
            
        except Exception as e:
            logger.error(f"Blockchain recording failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to record transaction on blockchain"
            }
    
    def get_transaction_audit_trail(self, transaction_id: str) -> Dict:
        """Get complete audit trail for a transaction"""
        
        transaction = self.repository.get_transaction(transaction_id)
        
        if not transaction:
            return {
                "success": False,
                "error": "Transaction not found"
            }
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "sender": {
                "id": transaction.get("sender_id"),
                "dept": transaction.get("sender_dept"),
                "amount_deducted": transaction.get("amount_deducted"),
                "hash": transaction.get("sender_hash")
            },
            "receiver": {
                "id": transaction.get("receiver_id"),
                "dept": transaction.get("receiver_dept"),
                "amount_received": transaction.get("amount_received"),
                "hash": transaction.get("receiver_hash")
            },
            "fees": transaction.get("fees"),
            "status": transaction.get("status"),
            "blockchain": {
                "recorded": transaction.get("blockchain_recorded", False),
                "tx_hash": transaction.get("blockchain_tx_hash"),
                "block_index": transaction.get("block_index"),
                "recorded_at": transaction.get("blockchain_recorded_at")
            },
            "timestamps": {
                "created_at": transaction.get("created_at"),
                "blockchain_recorded_at": transaction.get("blockchain_recorded_at")
            },
            "scheme_reference": transaction.get("scheme_id"),
            "fund_flow_reference": transaction.get("fund_flow_reference")
        }
    
    def verify_transaction_integrity(self, transaction_id: str) -> Dict:
        """Verify transaction hasn't been tampered with"""
        
        transaction = self.repository.get_transaction(transaction_id)
        
        if not transaction:
            return {
                "success": False,
                "verified": False,
                "error": "Transaction not found"
            }
        
        # Recalculate hashes to verify integrity
        recalc_sender_hash = self.generate_sender_hash(
            transaction["transaction_id"],
            transaction["sender_id"],
            transaction["amount_deducted"]
        )
        
        recalc_receiver_hash = self.generate_receiver_hash(
            transaction["transaction_id"],
            transaction["receiver_id"],
            transaction["amount_received"]
        )
        
        sender_matches = recalc_sender_hash == transaction.get("sender_hash")
        receiver_matches = recalc_receiver_hash == transaction.get("receiver_hash")
        
        return {
            "success": True,
            "verified": sender_matches and receiver_matches,
            "transaction_id": transaction_id,
            "sender_hash_valid": sender_matches,
            "receiver_hash_valid": receiver_matches,
            "message": "Transaction integrity verified" if (sender_matches and receiver_matches) else "Transaction integrity compromised!"
        }
    
    def get_sender_transactions(self, sender_id: str) -> Dict:
        """Get all transactions for a sender"""
        
        transactions = self.repository.get_by_sender(sender_id)
        
        return {
            "success": True,
            "sender_id": sender_id,
            "total_count": len(transactions),
            "total_amount_debited": sum(t.get("amount_deducted", 0) for t in transactions),
            "transactions": transactions
        }
    
    def get_receiver_transactions(self, receiver_id: str) -> Dict:
        """Get all transactions for a receiver"""
        
        transactions = self.repository.get_by_receiver(receiver_id)
        
        return {
            "success": True,
            "receiver_id": receiver_id,
            "total_count": len(transactions),
            "total_amount_received": sum(t.get("amount_received", 0) for t in transactions),
            "transactions": transactions
        }
    
    def get_sender_receiver_pair_transactions(self, sender_id: str, receiver_id: str) -> Dict:
        """Get all transactions between a specific sender-receiver pair"""
        
        all_transactions = self.repository.list_transactions(sender_id=sender_id)
        pair_transactions = [
            t for t in all_transactions 
            if t.get("receiver_id") == receiver_id
        ]
        
        return {
            "success": True,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "transaction_count": len(pair_transactions),
            "total_amount_transferred": sum(t.get("amount_deducted", 0) for t in pair_transactions),
            "transactions": pair_transactions
        }
