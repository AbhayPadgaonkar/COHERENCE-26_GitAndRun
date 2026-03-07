"""Blockchain Contract Integration - Connect Python backend to Solidity contract"""
from web3 import Web3
from eth_account import Account
from typing import Dict, Optional
from app.core.logger import logger
from app.config import settings


class BlockchainContractIntegration:
    """Handle interactions with the Solidity smart contract"""
    
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None,
        contract_abi: Optional[list] = None,
        private_key: Optional[str] = None
    ):
        """Initialize blockchain connection
        
        Args:
            rpc_url: Polygon RPC endpoint (Mumbai or Mainnet)
            contract_address: Deployed smart contract address
            contract_abi: Contract ABI (Application Binary Interface)
            private_key: Private key for signing transactions
        """
        
        # Use provided values or fall back to settings
        self.rpc_url = rpc_url or settings.POLYGON_RPC_URL or "https://rpc-amoy.maticvigil.com"
        self.contract_address = contract_address or settings.CONTRACT_ADDRESS
        self.contract_abi = contract_abi or self._get_default_abi()
        self.private_key = private_key or settings.PRIVATE_KEY
        
        # Initialize Web3
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            
            if not self.w3.is_connected():
                logger.warning(f"⚠️ Not connected to {self.rpc_url} - Running in OFFLINE mode (Firebase only)")
                self.is_connected = False
            else:
                logger.info(f"✅ Connected to blockchain: {self.rpc_url}")
                self.is_connected = True
        except Exception as e:
            logger.warning(f"⚠️ Blockchain connection failed: {e} - Running in OFFLINE mode (Firebase only)")
            self.w3 = None
            self.is_connected = False
        
        # Initialize contract
        if self.contract_address and self.contract_abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi
            )
        else:
            self.contract = None
            logger.warning("Contract not initialized - address or ABI missing")
    
    def _get_default_abi(self) -> list:
        """Get default contract ABI for BudgetTransactionChain"""
        return [
            {
                "inputs": [
                    {"internalType": "string", "name": "_txnId", "type": "string"},
                    {"internalType": "string", "name": "_senderDept", "type": "string"},
                    {"internalType": "string", "name": "_receiverDept", "type": "string"},
                    {"internalType": "uint256", "name": "_amount", "type": "uint256"},
                    {"internalType": "bytes32", "name": "_senderHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "_receiverHash", "type": "bytes32"}
                ],
                "name": "storeTransaction",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "string", "name": "_txnId", "type": "string"}],
                "name": "getTransaction",
                "outputs": [
                    {"internalType": "uint256", "name": "index", "type": "uint256"},
                    {"internalType": "string", "name": "txnId", "type": "string"},
                    {"internalType": "string", "name": "senderDept", "type": "string"},
                    {"internalType": "string", "name": "receiverDept", "type": "string"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"},
                    {"internalType": "bytes32", "name": "senderHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "receiverHash", "type": "bytes32"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "validateChain",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getChainLength",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    def store_transaction_on_chain(
        self,
        txn_id: str,
        sender_dept: str,
        receiver_dept: str,
        amount: int,
        sender_hash: str,
        receiver_hash: str
    ) -> Dict:
        """Store transaction on blockchain
        
        Returns:
            Dict with transaction hash and status
        """
        
        # If offline, generate mock hash
        if not self.is_connected:
            mock_hash = f"0x{''.join([c for c in sender_hash + receiver_hash if c in '0123456789abcdef'][:64])}"
            logger.info(f"⚠️ OFFLINE MODE: Generated mock blockchain hash: {mock_hash}")
            return {
                "success": True,
                "transaction_hash": mock_hash,
                "txn_id": txn_id,
                "offline_mode": True,
                "message": "Transaction recorded in OFFLINE mode (will sync when connected)"
            }
        
        if not self.contract or not self.private_key:
            return {
                "success": False,
                "error": "Contract or private key not configured",
                "message": "Cannot record on blockchain - missing configuration"
            }
        
        try:
            # Get account from private key
            account = Account.from_key(self.private_key)
            
            # Prepare transaction
            tx = self.contract.functions.storeTransaction(
                txn_id,
                sender_dept,
                receiver_dept,
                amount,
                bytes.fromhex(sender_hash.replace("0x", "")),
                bytes.fromhex(receiver_hash.replace("0x", ""))
            ).build_transaction({
                "from": account.address,
                "nonce": self.w3.eth.get_transaction_count(account.address),
                "gas": 500000,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": self.w3.eth.chain_id
            })
            
            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            logger.info(f"Transaction sent: {tx_hash.hex()}")
            
            return {
                "success": True,
                "transaction_hash": tx_hash.hex(),
                "txn_id": txn_id,
                "message": "Transaction successfully recorded on blockchain"
            }
            
        except Exception as e:
            logger.error(f"Failed to store transaction on blockchain: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to record transaction on blockchain"
            }
    
    def get_transaction_from_chain(self, txn_id: str) -> Dict:
        """Retrieve transaction from blockchain"""
        
        if not self.is_connected:
            return {
                "success": True,
                "transaction": {},
                "offline_mode": True,
                "message": "Transaction stored locally (offline mode)"
            }
        
        if not self.contract:
            return {
                "success": False,
                "error": "Contract not initialized",
                "message": "Cannot retrieve from blockchain - contract not initialized"
            }
        
        try:
            result = self.contract.functions.getTransaction(txn_id).call()
            
            return {
                "success": True,
                "transaction": {
                    "index": result[0],
                    "txnId": result[1],
                    "senderDept": result[2],
                    "receiverDept": result[3],
                    "amount": result[4],
                    "senderHash": "0x" + result[5].hex(),
                    "receiverHash": "0x" + result[6].hex(),
                    "timestamp": result[7]
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve transaction: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to retrieve transaction from blockchain"
            }
    
    def validate_chain(self) -> Dict:
        """Validate blockchain integrity"""
        
        if not self.is_connected:
            return {
                "success": True,
                "valid": True,
                "chain_length": 0,
                "offline_mode": True,
                "message": "Chain validation skipped (offline mode)"
            }
        
        if not self.contract:
            return {
                "success": False,
                "error": "Contract not initialized"
            }
        
        try:
            is_valid = self.contract.functions.validateChain().call()
            chain_length = self.contract.functions.getChainLength().call()
            
            return {
                "success": True,
                "valid": is_valid,
                "chain_length": chain_length,
                "message": "Chain is valid" if is_valid else "Chain validation failed - possible corruption"
            }
            
        except Exception as e:
            logger.error(f"Failed to validate chain: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to validate blockchain"
            }
    
    def get_chain_length(self) -> Dict:
        """Get total number of transactions on chain"""
        
        if not self.is_connected:
            return {
                "success": True,
                "chain_length": 0,
                "offline_mode": True,
                "message": "Running in offline mode"
            }
        
        if not self.contract:
            return {
                "success": False,
                "error": "Contract not initialized"
            }
        
        try:
            length = self.contract.functions.getChainLength().call()
            
            return {
                "success": True,
                "chain_length": length,
                "message": f"Total transactions on chain: {length}"
            }
            
        except Exception as e:
            logger.error(f"Failed to get chain length: {e}")
            return {
                "success": False,
                "error": str(e)
            }
