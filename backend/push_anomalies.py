#!/usr/bin/env python3
"""
Push anomalous transactions directly to Firestore for anomaly detection testing
"""

from datetime import datetime, timedelta
from app.core.firebase import FirebaseConfig
import json

# Initialize Firebase
db = FirebaseConfig.get_db()

if not db:
    print("ERROR: Could not connect to Firebase")
    exit(1)

print("\n" + "="*60)
print("PUSHING ANOMALOUS TRANSACTIONS TO FIRESTORE")
print("="*60 + "\n")

# Get the first scheme
schemes_ref = db.collection("schemes")
schemes = list(schemes_ref.stream())

if not schemes:
    print("ERROR: No schemes found in Firestore")
    exit(1)

scheme_doc = schemes[0].to_dict()
scheme_id = schemes[0].id
scheme_name = scheme_doc.get("name", "Unknown")

print(f"[1] Using Scheme:")
print(f"    Name: {scheme_name}")
print(f"    ID: {scheme_id}\n")

# Create a collection for test transactions
print(f"[2] Creating test transactions collection...\n")

# Normal spending transactions (baseline)
normal_transactions = [
    {
        "scheme_id": scheme_id,
        "amount": 50000000,  # 50 Crore
        "date": (datetime.now() - timedelta(days=30)).isoformat(),
        "type": "spending",
        "entity": "District-1",
        "status": "completed"
    },
    {
        "scheme_id": scheme_id,
        "amount": 52000000,  # 52 Crore
        "date": (datetime.now() - timedelta(days=25)).isoformat(),
        "type": "spending",
        "entity": "District-1",
        "status": "completed"
    },
    {
        "scheme_id": scheme_id,
        "amount": 51000000,  # 51 Crore
        "date": (datetime.now() - timedelta(days=20)).isoformat(),
        "type": "spending",
        "entity": "District-2",
        "status": "completed"
    },
    {
        "scheme_id": scheme_id,
        "amount": 54000000,  # 54 Crore
        "date": (datetime.now() - timedelta(days=15)).isoformat(),
        "type": "spending",
        "entity": "District-2",
        "status": "completed"
    },
]

# ANOMALOUS transactions
anomalous_transactions = [
    {
        "scheme_id": scheme_id,
        "amount": 500000000,  # 500 Crore - SPIKE ANOMALY (10x normal)
        "date": (datetime.now() - timedelta(days=10)).isoformat(),
        "type": "spending",
        "entity": "District-3",
        "status": "completed",
        "anomaly_flag": "spike"
    },
    {
        "scheme_id": scheme_id,
        "amount": 5000000,  # 5 Crore - DROP ANOMALY (10x below normal)
        "date": (datetime.now() - timedelta(days=5)).isoformat(),
        "type": "spending",
        "entity": "District-3",
        "status": "completed",
        "anomaly_flag": "drop"
    },
    {
        "scheme_id": scheme_id,
        "amount": 50000000,  # Duplicate payment same day
        "date": (datetime.now() - timedelta(days=1)).isoformat(),
        "type": "spending",
        "entity": "District-1",
        "status": "completed",
        "anomaly_flag": "duplicate"
    },
    {
        "scheme_id": scheme_id,
        "amount": 50000000,  # Duplicate payment same day
        "date": (datetime.now() - timedelta(days=1)).isoformat(),
        "type": "spending",
        "entity": "District-1",
        "status": "completed",
        "anomaly_flag": "duplicate"
    }
]

# Push normal transactions
print("[3] Pushing NORMAL transactions:")
normal_ids = []
for i, txn in enumerate(normal_transactions, 1):
    doc_ref = db.collection("test_transactions").add(txn)
    normal_ids.append(doc_ref[1].id)
    amount_cr = txn['amount']/10000000
    print(f"    [{i}] Amount: {amount_cr:.0f} Crore | Status: OK Stored")

print(f"\n    Total normal transactions: {len(normal_transactions)}\n")

# Push anomalous transactions
print("[4] Pushing ANOMALOUS transactions:")
anomaly_ids = []
for i, txn in enumerate(anomalous_transactions, 1):
    doc_ref = db.collection("test_transactions").add(txn)
    anomaly_ids.append(doc_ref[1].id)
    flag = txn.get("anomaly_flag", "unknown").upper()
    amount_cr = txn['amount']/10000000
    print(f"    [{i}] Amount: {amount_cr:.0f} Crore | Flag: {flag} | OK Stored")

print(f"\n    Total anomalous transactions: {len(anomalous_transactions)}\n")

# Verify what we stored
print("[5] Verifying stored transactions:")
all_txns = list(db.collection("test_transactions").where("scheme_id", "==", scheme_id).stream())
print(f"    Total in Firestore: {len(all_txns)}\n")

# Display summary
print("[6] SUMMARY OF STORED ANOMALIES:\n")
print("    NORMAL TRANSACTIONS (Baseline):")
print("    +- 50, 52, 51, 54 Crore spending")
print("    +- Average: ~51-52 Crore\n")

print("    ANOMALOUS TRANSACTIONS:")
print("    +- 500 Crore (SPIKE - 10x above average)")
print("    +- 5 Crore (DROP - 10x below average)")
print("    +- Duplicate 50 Crore payments on same day\n")

print("[7] Retrieving raw transaction data:\n")
all_docs = list(db.collection("test_transactions").where("scheme_id", "==", scheme_id).stream())
for i, doc in enumerate(all_docs, 1):
    data = doc.to_dict()
    flag = data.get("anomaly_flag", "NORMAL")
    amount = data.get("amount", 0) / 10000000
    date = data.get("date", "N/A")[:10]
    print(f"    [{i}] {flag:10} | {amount:6.1f} Crore | {date}")

print("\n" + "="*60)
print("OK TRANSACTIONS PUSHED TO FIRESTORE")
print("="*60)
print("\nNext: Run anomaly detection to identify these anomalies")
print("Command: python -m pytest tests/test_anomalies.py -v")
print("Or use API: POST /api/v1/anomalies/detect?scheme_id={scheme_id}")
print("\n")
