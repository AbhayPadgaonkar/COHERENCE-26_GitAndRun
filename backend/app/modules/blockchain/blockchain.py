"""
Blockchain manager - manages the entire blockchain chain
Stores blocks and validates transaction integrity
"""

from typing import List, Dict, Optional
import json
from datetime import datetime
from app.modules.blockchain.block import Block, Transaction
from app.core.firebase import FirebaseConfig
from app.core.logger import logger


class Blockchain:
    """Manages the cryptocurrency blockchain"""
    
    def __init__(self, difficulty: int = 2):
        """
        Initialize blockchain
        
        Args:
            difficulty: Number of leading zeros required for Proof of Work
        """
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.difficulty = difficulty
        self.firebase = FirebaseConfig()
        self.db = self.firebase.get_db()
        self.mining_reward = 1.0
        
        # Create genesis block
        self._create_genesis_block()
    
    def _create_genesis_block(self) -> None:
        """Create the first block in the blockchain"""
        genesis_block = Block(
            block_index=0,
            transactions=[],
            previous_hash="0" * 64
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        logger.info("Genesis block created")
    
    def add_transaction(
        self,
        sender: str,
        receiver: str,
        amount: float,
        scheme_id: str,
        transaction_type: str = "transfer",
        description: str = "",
        metadata: Dict = None
    ) -> Transaction:
        """
        Add transaction to pending transactions pool
        
        Args:
            sender: Sender wallet address or ID
            receiver: Receiver wallet address or ID
            amount: Transaction amount
            scheme_id: Scheme ID for fund transfer
            transaction_type: "debit", "credit", or "transfer"
            description: Transaction description
            metadata: Additional metadata
        
        Returns:
            Transaction object
        """
        # Generate transaction ID
        transaction_id = f"{sender}_{receiver}_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # Create transaction object
        transaction = Transaction(
            transaction_id=transaction_id,
            sender=sender,
            receiver=receiver,
            amount=amount,
            scheme_id=scheme_id,
            transaction_type=transaction_type,
            description=description,
            metadata=metadata or {}
        )
        
        # Add to pending transactions
        self.pending_transactions.append(transaction)
        
        logger.info(f"Transaction added: {transaction_id} | Sender: {sender} | Receiver: {receiver} | Amount: {amount}")
        
        return transaction
    
    def mine_pending_transactions(self, miner_address: str) -> Optional[Block]:
        """
        Mine pending transactions into a new block
        
        Args:
            miner_address: Address of miner creating the block
        
        Returns:
            Newly mined block or None if no pending transactions
        """
        if not self.pending_transactions:
            logger.warning("No pending transactions to mine")
            return None
        
        # Create new block
        new_block = Block(
            block_index=len(self.chain),
            transactions=self.pending_transactions,
            previous_hash=self.chain[-1].block_hash
        )
        
        # Mine the block (Proof of Work)
        logger.info(f"Mining block {new_block.block_index}...")
        new_block.mine_block(self.difficulty)
        
        # Add to chain
        self.chain.append(new_block)
        
        # Add mining reward transaction
        mining_reward_tx = Transaction(
            transaction_id=f"reward_{miner_address}_{int(datetime.utcnow().timestamp() * 1000)}",
            sender="system",
            receiver=miner_address,
            amount=self.mining_reward,
            scheme_id="mining_reward",
            transaction_type="credit",
            description="Mining reward"
        )
        
        # Clear pending transactions
        self.pending_transactions = [mining_reward_tx]
        
        logger.info(f"Block {new_block.block_index} mined successfully!")
        logger.info(f"Block Hash: {new_block.block_hash}")
        logger.info(f"Previous Hash: {new_block.previous_hash}")
        
        return new_block
    
    def validate_chain(self) -> bool:
        """
        Validate entire blockchain integrity
        Checks if all blocks are properly linked and hashes are correct
        
        Returns:
            True if blockchain is valid, False otherwise
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Verify current block hash
            if current_block.block_hash != current_block._calculate_hash():
                logger.error(f"Block {i} has invalid hash")
                return False
            
            # Verify chain link
            if current_block.previous_hash != previous_block.block_hash:
                logger.error(f"Block {i} is not linked to block {i-1}")
                return False
        
        logger.info("Blockchain validation successful")
        return True
    
    def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict]:
        """Get transaction details by ID"""
        for block in self.chain:
            for tx in block.transactions:
                if tx.transaction_id == transaction_id:
                    return tx.to_dict()
        return None
    
    def get_sender_transactions(self, sender: str) -> List[Dict]:
        """Get all transactions by sender"""
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.sender == sender:
                    transactions.append(tx.to_dict())
        return transactions
    
    def get_receiver_transactions(self, receiver: str) -> List[Dict]:
        """Get all transactions by receiver"""
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.receiver == receiver:
                    transactions.append(tx.to_dict())
        return transactions
    
    def get_scheme_transactions(self, scheme_id: str) -> List[Dict]:
        """Get all transactions for a specific scheme"""
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.scheme_id == scheme_id:
                    transactions.append(tx.to_dict())
        return transactions
    
    def get_latest_block(self) -> Dict:
        """Get the most recent block"""
        return self.chain[-1].to_dict()
    
    def get_block_by_index(self, index: int) -> Optional[Dict]:
        """Get block by index"""
        if 0 <= index < len(self.chain):
            return self.chain[index].to_dict()
        return None
    
    def get_chain_length(self) -> int:
        """Get total number of blocks"""
        return len(self.chain)
    
    def get_all_blocks(self) -> List[Dict]:
        """Get all blocks in the chain"""
        return [block.to_dict() for block in self.chain]
    
    def get_balance(self, address: str) -> float:
        """Calculate wallet balance"""
        balance = 0.0
        
        for block in self.chain:
            for tx in block.transactions:
                if tx.receiver == address and tx.transaction_type in ["credit", "transfer"]:
                    balance += tx.amount
                elif tx.sender == address and tx.transaction_type in ["debit", "transfer"]:
                    balance -= tx.amount
        
        return balance
    
    def save_to_firebase(self, block: Block) -> bool:
        """Save block to Firebase for permanent storage"""
        try:
            block_data = block.to_dict()
            self.db.collection("blockchain").document(f"block_{block.block_index}").set(block_data)
            logger.info(f"Block {block.block_index} saved to Firebase")
            return True
        except Exception as e:
            logger.error(f"Failed to save block to Firebase: {str(e)}")
            return False
    
    def get_chain_summary(self) -> Dict:
        """Get summary of blockchain"""
        total_transactions = sum(len(block.transactions) for block in self.chain)
        total_amount = sum(
            tx.amount
            for block in self.chain
            for tx in block.transactions
        )
        
        return {
            "total_blocks": len(self.chain),
            "total_transactions": total_transactions,
            "total_amount_transferred": total_amount,
            "difficulty": self.difficulty,
            "latest_block_hash": self.chain[-1].block_hash,
            "is_valid": self.validate_chain(),
            "pending_transactions": len(self.pending_transactions)
        }
