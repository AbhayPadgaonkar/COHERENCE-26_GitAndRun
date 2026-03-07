"""
Block class for blockchain implementation
Each block contains transactions and links to previous block
"""

import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import json
import time


class Transaction:
    """Represents a single transaction in the blockchain"""
    
    def __init__(
        self,
        transaction_id: str,
        sender: str,
        receiver: str,
        amount: float,
        scheme_id: str,
        transaction_type: str,  # "debit" or "credit"
        description: str = "",
        metadata: Dict = None
    ):
        self.transaction_id = transaction_id
        self.sender = sender  # Wallet address or nodal agency ID
        self.receiver = receiver  # Wallet address or nodal agency ID
        self.amount = amount
        self.scheme_id = scheme_id
        self.transaction_type = transaction_type  # debit or credit
        self.description = description
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()
        self.transaction_hash = self._calculate_hash()
    
    def _calculate_hash(self) -> str:
        """Generate SHA-256 hash of transaction"""
        transaction_data = {
            "transaction_id": self.transaction_id,
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "scheme_id": self.scheme_id,
            "transaction_type": self.transaction_type,
            "timestamp": self.timestamp,
            "description": self.description
        }
        transaction_string = json.dumps(transaction_data, sort_keys=True)
        return hashlib.sha256(transaction_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict:
        """Convert transaction to dictionary"""
        return {
            "transaction_id": self.transaction_id,
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "scheme_id": self.scheme_id,
            "transaction_type": self.transaction_type,
            "description": self.description,
            "timestamp": self.timestamp,
            "transaction_hash": self.transaction_hash,
            "metadata": self.metadata
        }


class Block:
    """Represents a block in the blockchain"""
    
    def __init__(
        self,
        block_index: int,
        transactions: List[Transaction],
        previous_hash: str = "0" * 64,  # Genesis block has previous_hash as zeros
        nonce: int = 0
    ):
        self.block_index = block_index
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.timestamp = datetime.utcnow().isoformat()
        self.nonce = nonce
        self.block_hash = self._calculate_hash()
    
    def _calculate_hash(self) -> str:
        """Generate SHA-256 hash of block (Proof of Work)"""
        transactions_data = [tx.to_dict() for tx in self.transactions]
        
        block_data = {
            "block_index": self.block_index,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "transactions": transactions_data,
            "nonce": self.nonce
        }
        
        block_string = json.dumps(block_data, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int = 2) -> None:
        """
        Mine block using Proof of Work
        Find nonce value such that block hash starts with 'difficulty' zeros
        """
        target = "0" * difficulty
        
        while not self.block_hash.startswith(target):
            self.nonce += 1
            self.block_hash = self._calculate_hash()
    
    def to_dict(self) -> Dict:
        """Convert block to dictionary"""
        return {
            "block_index": self.block_index,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "block_hash": self.block_hash,
            "nonce": self.nonce,
            "transactions": [tx.to_dict() for tx in self.transactions],
            "transaction_count": len(self.transactions),
            "total_amount": sum(tx.amount for tx in self.transactions)
        }
