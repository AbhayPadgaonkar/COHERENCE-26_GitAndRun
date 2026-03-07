"""
Integration example: How to record fund transfers on blockchain
This shows how to modify existing fund_flow_tracking module to use blockchain
"""

from typing import Optional, Dict
from app.modules.blockchain import Blockchain
from app.core.logger import logger


class BlockchainFundFlowIntegration:
    """
    Integrates blockchain recording with fund flow operations
    Records debit/credit transactions on blockchain when funds transfer
    """
    
    def __init__(self):
        self.blockchain = Blockchain(difficulty=2)
    
    def record_fund_debit(
        self,
        sender_id: str,
        sender_address: str,
        receiver_id: str,
        receiver_address: str,
        amount: float,
        scheme_id: str,
        description: str = "",
        metadata: Dict = None
    ) -> Dict:
        """
        Record fund debit on blockchain (money going OUT of sender account)
        Called when sender's account is debited
        
        Args:
            sender_id: Sender nodal agency ID
            sender_address: Ethereum wallet address of sender
            receiver_id: Receiver nodal agency ID
            receiver_address: Ethereum wallet address of receiver
            amount: Amount in rupees
            scheme_id: Scheme identifier
            description: Transaction description
            metadata: Additional metadata
        
        Returns:
            Dictionary with transaction details and hashes
        """
        try:
            logger.info(f"Recording blockchain debit: {sender_id} -> {receiver_id}, Amount: {amount}")
            
            # Add transaction to blockchain pending pool
            transaction = self.blockchain.add_transaction(
                sender=sender_address,
                receiver=receiver_address,
                amount=amount,
                scheme_id=scheme_id,
                transaction_type="debit",
                description=f"[{sender_id}] {description}",
                metadata=metadata
            )
            
            # Return transaction details
            return {
                "status": "debit_recorded",
                "transaction_id": transaction.transaction_id,
                "transaction_hash": transaction.transaction_hash,
                "sender_hash": transaction.transaction_hash,  # Sender side hash
                "amount": amount,
                "timestamp": transaction.timestamp,
                "schema_id": scheme_id,
                "description": description
            }
        
        except Exception as e:
            logger.error(f"Error recording blockchain debit: {str(e)}")
            raise
    
    def record_fund_credit(
        self,
        transaction_hash: str,
        receiver_id: str,
        receiver_address: str,
        sender_id: str,
        amount: float,
        description: str = "",
        metadata: Dict = None
    ) -> Dict:
        """
        Record fund credit on blockchain (money coming IN to receiver account)
        Called when receiver's account is credited
        
        Args:
            transaction_hash: Hash from corresponding debit transaction
            receiver_id: Receiver nodal agency ID
            receiver_address: Ethereum wallet address of receiver
            sender_id: Sender nodal agency ID
            amount: Amount in rupees
            description: Transaction description
            metadata: Additional metadata
        
        Returns:
            Dictionary with transaction details and hashes
        """
        try:
            logger.info(f"Recording blockchain credit: {sender_id} -> {receiver_id}, Amount: {amount}")
            
            # Find existing transaction in blockchain
            existing_tx = self.blockchain.get_transaction_by_id(transaction_hash)
            
            if not existing_tx:
                logger.error(f"Debit transaction not found: {transaction_hash}")
                raise ValueError("Corresponding debit transaction not found")
            
            # Verify amounts match
            if existing_tx["amount"] != amount:
                logger.error(f"Amount mismatch: {existing_tx['amount']} vs {amount}")
                raise ValueError("Amount mismatch between debit and credit")
            
            # Add credit transaction to blockchain
            credit_transaction = self.blockchain.add_transaction(
                sender=existing_tx["sender"],
                receiver=receiver_address,
                amount=amount,
                scheme_id=existing_tx["scheme_id"],
                transaction_type="credit",
                description=f"[{receiver_id}] {description}",
                metadata=metadata
            )
            
            # Return transaction details
            return {
                "status": "credit_recorded",
                "transaction_id": credit_transaction.transaction_id,
                "transaction_hash": credit_transaction.transaction_hash,
                "receiver_hash": credit_transaction.transaction_hash,  # Receiver side hash
                "debit_transaction_hash": transaction_hash,
                "amount": amount,
                "timestamp": credit_transaction.timestamp,
                "description": description
            }
        
        except Exception as e:
            logger.error(f"Error recording blockchain credit: {str(e)}")
            raise
    
    def mine_transactions(self, miner_address: str) -> Dict:
        """
        Mine all pending transactions into a new block
        Should be called periodically (e.g., every 10 transactions or every hour)
        
        Args:
            miner_address: Address of miner (can be government authority)
        
        Returns:
            Dictionary with mined block details
        """
        try:
            pending_count = len(self.blockchain.pending_transactions)
            logger.info(f"Mining {pending_count} pending transactions...")
            
            if pending_count == 0:
                logger.warning("No pending transactions to mine")
                return {
                    "status": "no_transactions",
                    "message": "No pending transactions to mine"
                }
            
            # Mine the block
            block = self.blockchain.mine_pending_transactions(miner_address)
            
            # Save to Firebase
            self.blockchain.save_to_firebase(block)
            
            return {
                "status": "mined_success",
                "block_index": block.block_index,
                "block_hash": block.block_hash,
                "previous_hash": block.previous_hash,
                "transactions_mined": len(block.transactions),
                "total_amount": sum(tx.amount for tx in block.transactions),
                "timestamp": block.timestamp
            }
        
        except Exception as e:
            logger.error(f"Error mining transactions: {str(e)}")
            raise
    
    def verify_transaction_chain(self, transaction_hash: str) -> Dict:
        """
        Verify that a transaction is properly recorded on blockchain
        and linked to all previous blocks
        
        Args:
            transaction_hash: Hash of transaction to verify
        
        Returns:
            Dictionary with verification status
        """
        try:
            transaction = self.blockchain.get_transaction_by_id(transaction_hash)
            
            if not transaction:
                return {
                    "status": "not_found",
                    "valid": False,
                    "message": "Transaction not found in blockchain"
                }
            
            # Validate entire blockchain
            is_valid = self.blockchain.validate_chain()
            
            return {
                "status": "found",
                "valid": is_valid,
                "transaction": transaction,
                "blockchain_integrity": "intact" if is_valid else "compromised",
                "details": {
                    "sender": transaction["sender"],
                    "receiver": transaction["receiver"],
                    "amount": transaction["amount"],
                    "transaction_hash": transaction["transaction_hash"],
                    "timestamp": transaction["timestamp"],
                    "scheme_id": transaction["scheme_id"]
                }
            }
        
        except Exception as e:
            logger.error(f"Error verifying transaction: {str(e)}")
            raise
    
    def get_audit_trail(self, address: str) -> Dict:
        """
        Get complete audit trail for a wallet address
        Shows all transactions (both sender and receiver)
        
        Args:
            address: Wallet address (ethereum address or agency ID)
        
        Returns:
            Dictionary with all transactions for the address
        """
        try:
            sender_txs = self.blockchain.get_sender_transactions(address)
            receiver_txs = self.blockchain.get_receiver_transactions(address)
            balance = self.blockchain.get_balance(address)
            
            return {
                "address": address,
                "balance": balance,
                "as_sender": {
                    "count": len(sender_txs),
                    "total_amount_out": sum(tx["amount"] for tx in sender_txs),
                    "transactions": sender_txs
                },
                "as_receiver": {
                    "count": len(receiver_txs),
                    "total_amount_in": sum(tx["amount"] for tx in receiver_txs),
                    "transactions": receiver_txs
                },
                "total_transactions": len(sender_txs) + len(receiver_txs)
            }
        
        except Exception as e:
            logger.error(f"Error getting audit trail: {str(e)}")
            raise


# ============================================================================
# USAGE EXAMPLE - How to integrate with existing fund flow code
# ============================================================================

"""
BEFORE (without blockchain):
─────────────────────────────

def transfer_funds(sender, receiver, amount, scheme_id):
    # Debit sender account
    db.update_account(sender, {"balance": balance - amount})
    
    # Credit receiver account
    db.update_account(receiver, {"balance": balance + amount})
    
    return {"status": "success"}


AFTER (with blockchain):
─────────────────────────────

def transfer_funds_with_blockchain(sender, receiver, amount, scheme_id):
    blockchain_integration = BlockchainFundFlowIntegration()
    
    # Step 1: Record debit on blockchain
    debit_result = blockchain_integration.record_fund_debit(
        sender_id=sender["id"],
        sender_address=sender["wallet_address"],  # From MetaMask auth
        receiver_id=receiver["id"],
        receiver_address=receiver["wallet_address"],
        amount=amount,
        scheme_id=scheme_id,
        description=f"Fund transfer from {sender['id']} to {receiver['id']}"
    )
    
    transaction_hash = debit_result["transaction_hash"]
    
    # Step 2: Debit sender account in Firebase
    db.update_account(sender["id"], {
        "balance": balance - amount,
        "blockchain_transaction": transaction_hash
    })
    
    # Step 3: Record credit on blockchain
    credit_result = blockchain_integration.record_fund_credit(
        transaction_hash=transaction_hash,
        receiver_id=receiver["id"],
        receiver_address=receiver["wallet_address"],
        sender_id=sender["id"],
        amount=amount,
        description=f"Fund received by {receiver['id']}"
    )
    
    # Step 4: Credit receiver account in Firebase
    db.update_account(receiver["id"], {
        "balance": balance + amount,
        "blockchain_transaction": credit_result["transaction_hash"]
    })
    
    # Step 5: Mine transactions periodically (every 10 or after timeout)
    # This creates immutable blocks linked to previous ones
    if should_mine():  # e.g., pending > 10 or timeout
        mining_result = blockchain_integration.mine_transactions(
            miner_address="government_authority_wallet"
        )
        logger.info(f"Mined block: {mining_result['block_hash']}")
    
    return {
        "status": "success",
        "debit_transaction": debit_result,
        "credit_transaction": credit_result,
        "immutable_record": True
    }


VERIFICATION (Anti-Corruption Check):
─────────────────────────────────────

def audit_transfer(transaction_hash):
    blockchain_integration = BlockchainFundFlowIntegration()
    
    # Verify transaction is on blockchain
    verification = blockchain_integration.verify_transaction_chain(transaction_hash)
    
    if not verification["valid"]:
        raise Exception("Blockchain corrupted! Transaction record tampered!")
    
    return verification


AUDIT TRAIL (For Investigation):
─────────────────────────────────

def get_agency_audit_trail(agency_id):
    blockchain_integration = BlockchainFundFlowIntegration()
    
    # Get complete fund transfer history
    audit_trail = blockchain_integration.get_audit_trail(agency_id)
    
    return {
        "agency": agency_id,
        "fund_received": audit_trail["as_receiver"]["total_amount_in"],
        "fund_sent": audit_trail["as_sender"]["total_amount_out"],
        "current_balance": audit_trail["balance"],
        "all_transactions": audit_trail,  # Complete immutable history
        "integrity_check": "passed"
    }
"""
