"""Frontend Integration - Fund Transfer with Auto-Blockchain Recording"""

import json
from typing import Optional, Dict

class BlockchainTransactionAPI:
    """Helper to call backend transaction APIs from frontend"""
    
    BACKEND_URL = "http://localhost:8000/api/v1"
    
    @staticmethod
    async def create_fund_transfer(
        sender_id: str,
        sender_dept: str,
        receiver_id: str,
        receiver_dept: str,
        amount: float,
        fees: float = 0.0,
        scheme_id: Optional[str] = None
    ) -> Dict:
        """
        Create a fund transfer that auto-records to blockchain
        
        This calls the backend which:
        1. Creates transaction in Firebase
        2. Generates sender & receiver hashes
        3. Records on blockchain (if RPC available)
        4. Returns complete audit trail
        """
        
        try:
            response = await fetch(
                f"{BlockchainTransactionAPI.BACKEND_URL}/transactions/create",
                method="POST",
                headers={"Content-Type": "application/json"},
                body=json.dumps({
                    "sender_id": sender_id,
                    "sender_dept": sender_dept,
                    "receiver_id": receiver_id,
                    "receiver_dept": receiver_dept,
                    "amount": amount,
                    "fees": fees,
                    "scheme_id": scheme_id,
                    "fund_flow_reference": f"FF-{sender_id}-{receiver_id}"
                })
            )
            
            return await response.json()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def get_transaction_audit_trail(transaction_id: str) -> Dict:
        """Get complete transaction audit trail with blockchain details"""
        
        try:
            response = await fetch(
                f"{BlockchainTransactionAPI.BACKEND_URL}/transactions/{transaction_id}",
                method="GET"
            )
            
            return await response.json()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def verify_transaction(transaction_id: str) -> Dict:
        """Verify transaction integrity"""
        
        try:
            response = await fetch(
                f"{BlockchainTransactionAPI.BACKEND_URL}/transactions/{transaction_id}/verify",
                method="GET"
            )
            
            return await response.json()
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
