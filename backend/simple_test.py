"""Simple deployment test - without emojis"""
from app.modules.transaction_processing import TransactionProcessingService
from app.modules.blockchain.contract_integration import BlockchainContractIntegration

transaction_service = TransactionProcessingService()
blockchain_integration = BlockchainContractIntegration(
    rpc_url="https://rpc-amoy.maticvigil.com",
    contract_address="0x73a92047623D2965809955dCFbdD620Ed8128160",
    private_key="e3f15f53cd8c88215692db01d216fb32fd95ec2798b9d6919cc463bd56713ef5"
)

print("Step 1: Creating transaction...")
tx_result = transaction_service.process_transaction(
    sender_id="CENTRAL-001",
    sender_dept="Central Government (Delhi)",
    receiver_id="STATE-MH-001",
    receiver_dept="Maharashtra State Government",
    amount=1000000,
    fees=50000,
    scheme_id="SCHEME-2024-001",
    fund_flow_reference="FUND-FLOW-2024-001"
)

if tx_result.get("success"):
    transaction_id = tx_result.get("transaction_id")
    transaction = tx_result.get("transaction")
    print("Transaction created: " + transaction_id)
    print("Sender hash: " + transaction['sender_hash'][:16] + "...")
    print("Receiver hash: " + transaction['receiver_hash'][:16] + "...")
    
    print("\nStep 2: Recording on Blockchain...")
    bc_result = blockchain_integration.store_transaction_on_chain(
        txn_id=transaction_id,
        sender_dept=transaction['sender_dept'],
        receiver_dept=transaction['receiver_dept'],
        amount=int(transaction['amount_deducted']),
        sender_hash=transaction['sender_hash'],
        receiver_hash=transaction['receiver_hash']
    )
    
    if bc_result.get("success"):
        print("Blockchain TX Hash: " + bc_result.get("transaction_hash"))
    else:
        print("Error: " + bc_result.get("error", "Unknown error"))
else:
    print("Error creating transaction: " + tx_result.get("error", "Unknown error"))
