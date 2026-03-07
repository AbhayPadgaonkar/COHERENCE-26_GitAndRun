"""Example: Deploy Fund Transfer to Blockchain"""
import asyncio
from app.modules.transaction_processing import TransactionProcessingService
from app.modules.blockchain.contract_integration import BlockchainContractIntegration


async def deploy_fund_transfer_to_blockchain():
    """Example: Transfer from Central (Delhi) to State (Maharashtra)"""
    
    transaction_service = TransactionProcessingService()
    blockchain_integration = BlockchainContractIntegration(
        rpc_url="https://rpc.ankr.com/polygon_amoy",
        contract_address="0x73a92047623D2965809955dCFbdD620Ed8128160",  # Your deployed contract address
        private_key="e3f15f53cd8c88215692db01d216fb32fd95ec2798b9d6919cc463bd56713ef5"  # Your private key
    )
    
    # Step 1: Create transaction record
    print("Step 1: Creating transaction...")
    tx_result = transaction_service.process_transaction(
        sender_id="CENTRAL-001",
        sender_dept="Central Government (Delhi)",
        receiver_id="STATE-MH-001",
        receiver_dept="Maharashtra State Government",
        amount=1000000,  # ₹10 lakh
        fees=50000,  # ₹50,000 processing fee
        scheme_id="SCHEME-2024-001",
        fund_flow_reference="FUND-FLOW-2024-001"
    )
    
    if not tx_result.get("success"):
        print(f"Error creating transaction: {tx_result.get('error')}")
        return
    
    transaction_id = tx_result.get("transaction_id")
    transaction = tx_result.get("transaction")
    
    print(f"\n✅ Transaction Created:")
    print(f"  Transaction ID: {transaction_id}")
    print(f"  Sender: {transaction['sender_dept']}")
    print(f"  Receiver: {transaction['receiver_dept']}")
    print(f"  Amount Deducted: ₹{transaction['amount_deducted']}")
    print(f"  Amount Received: ₹{transaction['amount_received']}")
    print(f"  Fees: ₹{transaction['fees']}")
    print(f"  Sender Hash: {transaction['sender_hash'][:16]}...")
    print(f"  Receiver Hash: {transaction['receiver_hash'][:16]}...")
    
    # Step 2: Deploy to Blockchain
    print("\n\nStep 2: Recording on Blockchain...")
    bc_result = blockchain_integration.store_transaction_on_chain(
        txn_id=transaction_id,
        sender_dept=transaction['sender_dept'],
        receiver_dept=transaction['receiver_dept'],
        amount=int(transaction['amount_deducted']),
        sender_hash=transaction['sender_hash'],
        receiver_hash=transaction['receiver_hash']
    )
    
    if not bc_result.get("success"):
        print(f"Error recording on blockchain: {bc_result.get('error')}")
        return
    
    blockchain_tx_hash = bc_result.get("transaction_hash")
    print(f"✅ Transaction Recorded on Blockchain:")
    print(f"  Blockchain TX Hash: {blockchain_tx_hash}")
    
    # Step 3: Update transaction record with blockchain hash
    print("\n\nStep 3: Linking to Blockchain...")
    link_result = transaction_service.record_on_blockchain(
        transaction_id=transaction_id,
        blockchain_tx_hash=blockchain_tx_hash
    )
    
    print(f"✅ Transaction Linked: {link_result.get('message')}")
    
    # Step 4: Get complete audit trail
    print("\n\nStep 4: Retrieving Complete Audit Trail...")
    audit_trail = transaction_service.get_transaction_audit_trail(transaction_id)
    
    print(f"\n📋 COMPLETE AUDIT TRAIL:")
    print(f"  Transaction ID: {audit_trail['transaction_id']}")
    print(f"\n  Sender Side:")
    print(f"    ID: {audit_trail['sender']['id']}")
    print(f"    Department: {audit_trail['sender']['dept']}")
    print(f"    Amount Deducted: ₹{audit_trail['sender']['amount_deducted']}")
    print(f"    Hash: {audit_trail['sender']['hash']}")
    print(f"\n  Receiver Side:")
    print(f"    ID: {audit_trail['receiver']['id']}")
    print(f"    Department: {audit_trail['receiver']['dept']}")
    print(f"    Amount Received: ₹{audit_trail['receiver']['amount_received']}")
    print(f"    Hash: {audit_trail['receiver']['hash']}")
    print(f"\n  Blockchain:")
    print(f"    Recorded: {audit_trail['blockchain']['recorded']}")
    print(f"    TX Hash: {audit_trail['blockchain']['tx_hash']}")
    print(f"    Block Index: {audit_trail['blockchain']['block_index']}")
    
    # Step 5: Verify transaction integrity
    print("\n\nStep 5: Verifying Transaction Integrity...")
    verify_result = transaction_service.verify_transaction_integrity(transaction_id)
    
    print(f"✅ Verification Result: {verify_result['verified']}")
    print(f"  Sender Hash Valid: {verify_result['sender_hash_valid']}")
    print(f"  Receiver Hash Valid: {verify_result['receiver_hash_valid']}")
    print(f"  Message: {verify_result['message']}")
    
    # Step 6: Validate blockchain integrity
    print("\n\nStep 6: Validating Blockchain Chain...")
    chain_valid = blockchain_integration.validate_chain()
    
    print(f"✅ Chain Status: {chain_valid['message']}")
    print(f"  Valid: {chain_valid['valid']}")
    print(f"  Total Transactions: {chain_valid['chain_length']}")
    
    # Step 7: Get all transactions for sender
    print("\n\nStep 7: Getting All Sender Transactions...")
    sender_txns = transaction_service.get_sender_transactions("CENTRAL-001")
    
    print(f"✅ Sender Transactions:")
    print(f"  Total: {sender_txns['total_count']}")
    print(f"  Total Debited: ₹{sender_txns['total_amount_debited']}")
    
    # Step 8: Get all transactions for receiver
    print("\n\nStep 8: Getting All Receiver Transactions...")
    receiver_txns = transaction_service.get_receiver_transactions("STATE-MH-001")
    
    print(f"✅ Receiver Transactions:")
    print(f"  Total: {receiver_txns['total_count']}")
    print(f"  Total Received: ₹{receiver_txns['total_amount_received']}")
    
    # Step 9: Get sender-receiver pair transactions
    print("\n\nStep 9: Getting Sender-Receiver Pair Transactions...")
    pair_txns = transaction_service.get_sender_receiver_pair_transactions(
        "CENTRAL-001",
        "STATE-MH-001"
    )
    
    print(f"✅ Pair Transactions:")
    print(f"  Count: {pair_txns['transaction_count']}")
    print(f"  Total Transferred: ₹{pair_txns['total_amount_transferred']}")


if __name__ == "__main__":
    asyncio.run(deploy_fund_transfer_to_blockchain())
