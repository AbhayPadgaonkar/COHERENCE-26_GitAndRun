"""
Blockchain API Routes
Handles blockchain transactions and queries
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from app.modules.blockchain import Blockchain, Transaction
from app.core.logger import logger

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])

# Global blockchain instance
_blockchain = None

def get_blockchain():
    """Get or create blockchain instance"""
    global _blockchain
    if _blockchain is None:
        _blockchain = Blockchain(difficulty=2)
    return _blockchain


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class TransactionRequest(BaseModel):
    """Request model for creating a transaction"""
    sender: str
    receiver: str
    amount: float
    scheme_id: str
    transaction_type: str = "transfer"  # debit, credit, or transfer
    description: str = ""
    metadata: Dict = None


class TransactionResponse(BaseModel):
    """Response model for transaction"""
    transaction_id: str
    sender: str
    receiver: str
    amount: float
    scheme_id: str
    transaction_type: str
    timestamp: str
    transaction_hash: str
    description: str


class BlockResponse(BaseModel):
    """Response model for block"""
    block_index: int
    timestamp: str
    previous_hash: str
    block_hash: str
    nonce: int
    transactions: List[Dict]
    transaction_count: int
    total_amount: float


# ============================================================================
# TRANSACTION ENDPOINTS
# ============================================================================

@router.post("/transaction/add", response_model=TransactionResponse)
async def add_transaction(request: TransactionRequest):
    """
    Add a new transaction to the pending transaction pool
    
    This creates a transaction record that will be included in the next mined block.
    The transaction includes:
    - Sender and receiver addresses (wallet or agency ID)
    - Amount being transferred
    - Scheme ID for fund tracking
    - Transaction type (debit, credit, or transfer)
    - Timestamp and unique transaction hash
    """
    try:
        blockchain = get_blockchain()
        
        transaction = blockchain.add_transaction(
            sender=request.sender,
            receiver=request.receiver,
            amount=request.amount,
            scheme_id=request.scheme_id,
            transaction_type=request.transaction_type,
            description=request.description,
            metadata=request.metadata
        )
        
        return TransactionResponse(
            transaction_id=transaction.transaction_id,
            sender=transaction.sender,
            receiver=transaction.receiver,
            amount=transaction.amount,
            scheme_id=transaction.scheme_id,
            transaction_type=transaction.transaction_type,
            timestamp=transaction.timestamp,
            transaction_hash=transaction.transaction_hash,
            description=transaction.description
        )
    
    except Exception as e:
        logger.error(f"Error adding transaction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/mine", response_model=BlockResponse)
async def mine_block(miner_address: str = Body(..., embed=True)):
    """
    Mine pending transactions into a new block
    
    This performs Proof of Work by finding a nonce that produces a hash
    with the required number of leading zeros. Once mined, the block is
    permanently added to the chain.
    """
    try:
        blockchain = get_blockchain()
        
        if not blockchain.pending_transactions:
            raise HTTPException(
                status_code=400,
                detail="No pending transactions to mine"
            )
        
        block = blockchain.mine_pending_transactions(miner_address)
        
        # Save to Firebase for permanent storage
        blockchain.save_to_firebase(block)
        
        return BlockResponse(
            block_index=block.block_index,
            timestamp=block.timestamp,
            previous_hash=block.previous_hash,
            block_hash=block.block_hash,
            nonce=block.nonce,
            transactions=block.to_dict()["transactions"],
            transaction_count=block.to_dict()["transaction_count"],
            total_amount=block.to_dict()["total_amount"]
        )
    
    except Exception as e:
        logger.error(f"Error mining block: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transaction/{transaction_id}")
async def get_transaction(transaction_id: str):
    """Get transaction details by ID"""
    try:
        blockchain = get_blockchain()
        transaction = blockchain.get_transaction_by_id(transaction_id)
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return transaction
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving transaction: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions/sender/{sender}")
async def get_sender_transactions(sender: str):
    """Get all transactions by sender"""
    try:
        blockchain = get_blockchain()
        transactions = blockchain.get_sender_transactions(sender)
        return {
            "sender": sender,
            "transaction_count": len(transactions),
            "transactions": transactions
        }
    
    except Exception as e:
        logger.error(f"Error retrieving sender transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions/receiver/{receiver}")
async def get_receiver_transactions(receiver: str):
    """Get all transactions by receiver"""
    try:
        blockchain = get_blockchain()
        transactions = blockchain.get_receiver_transactions(receiver)
        return {
            "receiver": receiver,
            "transaction_count": len(transactions),
            "transactions": transactions
        }
    
    except Exception as e:
        logger.error(f"Error retrieving receiver transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions/scheme/{scheme_id}")
async def get_scheme_transactions(scheme_id: str):
    """Get all transactions for a specific scheme"""
    try:
        blockchain = get_blockchain()
        transactions = blockchain.get_scheme_transactions(scheme_id)
        return {
            "scheme_id": scheme_id,
            "transaction_count": len(transactions),
            "transactions": transactions,
            "total_amount": sum(tx["amount"] for tx in transactions)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving scheme transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# BLOCK ENDPOINTS
# ============================================================================

@router.get("/blocks", response_model=List[BlockResponse])
async def get_all_blocks():
    """Get all blocks in the blockchain"""
    try:
        blockchain = get_blockchain()
        blocks = blockchain.get_all_blocks()
        return blocks
    
    except Exception as e:
        logger.error(f"Error retrieving blocks: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/block/{block_index}", response_model=BlockResponse)
async def get_block(block_index: int):
    """Get a specific block by index"""
    try:
        blockchain = get_blockchain()
        block = blockchain.get_block_by_index(block_index)
        
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        return block
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving block: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/block/latest")
async def get_latest_block():
    """Get the most recent block"""
    try:
        blockchain = get_blockchain()
        block = blockchain.get_latest_block()
        return block
    
    except Exception as e:
        logger.error(f"Error retrieving latest block: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# WALLET ENDPOINTS
# ============================================================================

@router.get("/balance/{address}")
async def get_balance(address: str):
    """Get wallet balance for an address"""
    try:
        blockchain = get_blockchain()
        balance = blockchain.get_balance(address)
        return {
            "address": address,
            "balance": balance
        }
    
    except Exception as e:
        logger.error(f"Error calculating balance: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# BLOCKCHAIN HEALTH ENDPOINTS
# ============================================================================

@router.get("/validate")
async def validate_blockchain():
    """Validate blockchain integrity"""
    try:
        blockchain = get_blockchain()
        is_valid = blockchain.validate_chain()
        return {
            "valid": is_valid,
            "message": "Blockchain is valid" if is_valid else "Blockchain is corrupted"
        }
    
    except Exception as e:
        logger.error(f"Error validating blockchain: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
async def get_blockchain_summary():
    """Get blockchain summary statistics"""
    try:
        blockchain = get_blockchain()
        summary = blockchain.get_chain_summary()
        return summary
    
    except Exception as e:
        logger.error(f"Error retrieving blockchain summary: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pending-transactions")
async def get_pending_transactions():
    """Get pending transactions waiting to be mined"""
    try:
        blockchain = get_blockchain()
        pending = [tx.to_dict() for tx in blockchain.pending_transactions]
        return {
            "pending_count": len(pending),
            "transactions": pending
        }
    
    except Exception as e:
        logger.error(f"Error retrieving pending transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
