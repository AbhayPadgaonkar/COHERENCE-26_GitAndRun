"""Transaction Processing API Routes"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.modules.transaction_processing import TransactionProcessingService
from typing import Optional

router = APIRouter(prefix="/transactions", responses={404: {"description": "Not found"}})

transaction_service = TransactionProcessingService()


class TransactionCreateRequest(BaseModel):
    sender_id: str
    sender_dept: str
    receiver_id: str
    receiver_dept: str
    amount: float
    fees: float = 0.0
    scheme_id: Optional[str] = None
    fund_flow_reference: Optional[str] = None


class BlockchainRecordRequest(BaseModel):
    transaction_id: str
    blockchain_tx_hash: str
    block_index: Optional[int] = None


@router.post("/create", status_code=201)
async def create_transaction(request: TransactionCreateRequest):
    """Create a new transaction with sender and receiver hashes"""
    result = transaction_service.process_transaction(
        sender_id=request.sender_id,
        sender_dept=request.sender_dept,
        receiver_id=request.receiver_id,
        receiver_dept=request.receiver_dept,
        amount=request.amount,
        fees=request.fees,
        scheme_id=request.scheme_id,
        fund_flow_reference=request.fund_flow_reference
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.post("/record-blockchain")
async def record_transaction_on_blockchain(request: BlockchainRecordRequest):
    """Record a transaction on blockchain after it's deployed"""
    result = transaction_service.record_on_blockchain(
        transaction_id=request.transaction_id,
        blockchain_tx_hash=request.blockchain_tx_hash,
        block_index=request.block_index
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    
    return result


@router.get("/{transaction_id}")
async def get_transaction_details(transaction_id: str):
    """Get complete transaction details with audit trail"""
    result = transaction_service.get_transaction_audit_trail(transaction_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return result


@router.get("/{transaction_id}/verify")
async def verify_transaction(transaction_id: str):
    """Verify transaction integrity (check if hashes match)"""
    result = transaction_service.verify_transaction_integrity(transaction_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return result


@router.get("/sender/{sender_id}/all")
async def get_sender_transactions(sender_id: str):
    """Get all transactions where sender_id is the sender"""
    result = transaction_service.get_sender_transactions(sender_id)
    return result


@router.get("/receiver/{receiver_id}/all")
async def get_receiver_transactions(receiver_id: str):
    """Get all transactions where receiver_id is the receiver"""
    result = transaction_service.get_receiver_transactions(receiver_id)
    return result


@router.get("/pair/{sender_id}/{receiver_id}")
async def get_pair_transactions(sender_id: str, receiver_id: str):
    """Get all transactions between a sender-receiver pair"""
    result = transaction_service.get_sender_receiver_pair_transactions(sender_id, receiver_id)
    return result
