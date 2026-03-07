"""
MetaMask Wallet Authentication Routes
Handles message generation and signature verification
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from eth_keys import keys
from eth_utils import decode_hex, to_checksum_address
from datetime import datetime, timedelta
import secrets
import json

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Simple in-memory cache for nonces (in production, use Redis or database)
nonce_cache = {}


class SigningMessageResponse(BaseModel):
    message: str
    nonce: str


class VerifySignatureRequest(BaseModel):
    address: str
    message: str
    signature: str
    nonce: str


class AuthResponse(BaseModel):
    authenticated: bool
    token: str
    user: dict


# ============================================================================
# METAMASK AUTHENTICATION ENDPOINTS
# ============================================================================


@router.get("/metamask/message", response_model=SigningMessageResponse)
async def get_signing_message():
    """
    Generate a random message for user to sign
    Each call generates a unique nonce to prevent replay attacks
    """
    nonce = secrets.token_hex(16)  # 32-character random hex string
    
    # Create signing message
    message = f"""Welcome to LokNidhi!

Sign this message to authenticate with your MetaMask wallet.

Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}

This request will not trigger a blockchain transaction or cost any gas fees."""
    
    # Store nonce with expiration (10 minutes)
    nonce_cache[nonce] = {
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "used": False
    }
    
    return SigningMessageResponse(message=message, nonce=nonce)


@router.post("/metamask/verify", response_model=AuthResponse)
async def verify_signature(request: VerifySignatureRequest):
    """
    Verify MetaMask signature and authenticate user
    
    Process:
    1. Validate nonce hasn't been used and isn't expired
    2. Recover address from signature
    3. Compare with provided address
    4. Create session token
    """
    
    try:
        # Step 1: Validate nonce
        if request.nonce not in nonce_cache:
            raise HTTPException(
                status_code=400,
                detail="Invalid nonce. Please request a new signing message."
            )
        
        nonce_data = nonce_cache[request.nonce]
        
        if nonce_data["used"]:
            raise HTTPException(
                status_code=400,
                detail="This nonce has already been used. Please request a new signing message."
            )
        
        if datetime.utcnow() > nonce_data["expires_at"]:
            raise HTTPException(
                status_code=400,
                detail="Nonce has expired. Please request a new signing message."
            )
        
        # Step 2: Recover address from signature
        recovered_address = recover_address(request.message, request.signature)
        
        # Step 3: Compare addresses (case-insensitive)
        provided_address = to_checksum_address(request.address)
        recovered_address_checksum = to_checksum_address(recovered_address)
        
        if recovered_address_checksum != provided_address:
            raise HTTPException(
                status_code=401,
                detail="Signature verification failed. Address mismatch."
            )
        
        # Step 4: Mark nonce as used
        nonce_cache[request.nonce]["used"] = True
        
        # Step 5: Generate session token (in production, use JWT)
        session_token = secrets.token_urlsafe(32)
        
        # Return success
        return AuthResponse(
            authenticated=True,
            token=session_token,
            user={
                "wallet_address": provided_address,
                "authenticated_at": datetime.utcnow().isoformat(),
                "authentication_method": "metamask_signature"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Signature verification error: {str(e)}"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def recover_address(message: str, signature: str) -> str:
    """
    Recover Ethereum address from signed message and signature
    
    Process:
    1. Create message hash using Ethereum's signing standard
    2. Extract r, s, v from signature
    3. Recover public key from signature
    4. Derive address from public key
    """
    from eth_account.messages import encode_defunct
    from eth_account import Account
    
    try:
        # Encode message using Ethereum standard
        message_hash = encode_defunct(text=message)
        
        # Recover address from signature
        recovered = Account.recover_message(message_hash, signature=signature)
        
        return recovered
    
    except Exception as e:
        raise ValueError(f"Failed to recover address from signature: {str(e)}")


@router.get("/metamask/status")
async def check_metamask_status():
    """Check MetaMask authentication status (for debugging)"""
    return {
        "status": "The backend is ready to accept MetaMask signatures",
        "endpoints": {
            "get_signing_message": "/auth/metamask/message",
            "verify_signature": "/auth/metamask/verify"
        },
        "nonce_cache_size": len(nonce_cache)
    }


# ============================================================================
# CLEANUP OLD NONCES (Optional background task)
# ============================================================================


def cleanup_expired_nonces():
    """Remove expired nonces from cache"""
    now = datetime.utcnow()
    expired_nonces = [
        nonce for nonce, data in nonce_cache.items()
        if now > data["expires_at"]
    ]
    
    for nonce in expired_nonces:
        del nonce_cache[nonce]
    
    return len(expired_nonces)
