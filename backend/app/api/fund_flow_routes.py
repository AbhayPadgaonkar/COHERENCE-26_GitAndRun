"""Fund Flow Tracking Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import FundFlowCreate, FundFlowResponse
from app.modules.fund_flow_tracking import FundFlowService
from app.modules.transaction_processing import TransactionProcessingService
from app.modules.blockchain.contract_integration import BlockchainContractIntegration
from typing import List

router = APIRouter(prefix="/funds", responses={404: {"description": "Not found"}})

# Initialize services
fund_flow_service = FundFlowService()
transaction_service = TransactionProcessingService()
blockchain_integration = BlockchainContractIntegration()


@router.post("/track", response_model=FundFlowResponse, status_code=201)
async def track_fund_movement(flow: FundFlowCreate):
    """Track a fund transfer between administrative levels and record on blockchain"""
    
    # Track the fund movement
    result = fund_flow_service.track_fund_movement(flow)
    
    # Also create a transaction with blockchain recording
    try:
        tx_result = transaction_service.process_transaction(
            sender_id=flow.from_entity_code,
            sender_dept=flow.from_entity_name,
            receiver_id=flow.to_entity_code,
            receiver_dept=flow.to_entity_name,
            amount=flow.amount,
            fees=0.0,
            scheme_id=flow.scheme_id,
            fund_flow_reference=flow.fund_flow_reference
        )
        
        if tx_result.get("success"):
            transaction_id = tx_result.get("transaction_id")
            transaction = tx_result.get("transaction")
            
            # Try to record on blockchain
            bc_result = blockchain_integration.store_transaction_on_chain(
                txn_id=transaction_id,
                sender_dept=flow.from_entity_name,
                receiver_dept=flow.to_entity_name,
                amount=int(flow.amount),
                sender_hash=transaction.get("sender_hash"),
                receiver_hash=transaction.get("receiver_hash")
            )
            
            if bc_result.get("success"):
                # Update transaction with blockchain hash
                transaction_service.record_on_blockchain(
                    transaction_id=transaction_id,
                    blockchain_tx_hash=bc_result.get("transaction_hash")
                )
                
                result["blockchain_recorded"] = True
                result["blockchain_tx_hash"] = bc_result.get("transaction_hash")
                result["transaction_id"] = transaction_id
            else:
                result["blockchain_warning"] = bc_result.get("error")
    
    except Exception as e:
        # Log error but don't fail - fund flow is still tracked
        result["blockchain_error"] = str(e)
    
    return result


@router.get("/scheme/{scheme_id}/flow", response_model=List[FundFlowResponse])
async def get_fund_flow_path(scheme_id: str):
    """Get the complete fund flow path for a scheme"""
    flows = fund_flow_service.get_fund_flow_path(scheme_id)
    if not flows:
        raise HTTPException(status_code=404, detail="No flows found for this scheme")
    return flows


@router.get("/scheme/{scheme_id}/total-transferred")
async def get_total_transferred(scheme_id: str):
    """Get total amount transferred for a scheme"""
    total = fund_flow_service.calculate_total_transferred(scheme_id)
    return {
        "scheme_id": scheme_id,
        "total_transferred": total,
        "currency": "INR"
    }


@router.get("/scheme/{scheme_id}/status-distribution")
async def get_status_distribution(scheme_id: str):
    """Get fund distribution by transfer status"""
    distribution = fund_flow_service.get_fund_status_distribution(scheme_id)
    return {
        "scheme_id": scheme_id,
        "status_distribution": distribution,
        "currency": "INR"
    }


@router.get("/scheme/{scheme_id}/bottlenecks")
async def detect_bottlenecks(scheme_id: str):
    """Detect fund transfer bottlenecks"""
    bottlenecks = fund_flow_service.detect_fund_bottlenecks(scheme_id)
    return {
        "scheme_id": scheme_id,
        "bottlenecks_count": len(bottlenecks),
        "bottlenecks": bottlenecks
    }
