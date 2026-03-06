#!/usr/bin/env python3
"""
Quick Script: Fetch transactions from Firebase → Detect Anomalies
"""
import sys
sys.path.insert(0, 'd:\\myenv\\coherence\\COHERENCE-26_GitAndRun\\backend')

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from app.modules.anomaly_detection import AnomalyService

load_dotenv()

# Initialize Firebase
cred_path = 'serviceAccountKey.json'
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print(f"❌ Firebase credentials not found at {cred_path}")
    sys.exit(1)

print("\nConnected to Firebase\n")

# Get scheme ID
try:
    scheme_id = int(sys.argv[1])
except:
    scheme_id = str(sys.argv[1]) if len(sys.argv) > 1 else "3"

print(f"Fetching fund flows for scheme {scheme_id}...")

# Query fund_flows (real transaction data)
try:
    transactions = []
    docs = db.collection("fund_flows").where("scheme_id", "==", str(scheme_id)).limit(100).stream()
    
    for doc in docs:
        tx_data = doc.to_dict()
        tx_data['id'] = doc.id
        
        # Normalize data for anomaly detection
        # Convert amount to float
        if 'amount' in tx_data and tx_data['amount']:
            try:
                tx_data['amount'] = float(str(tx_data['amount']))
            except:
                tx_data['amount'] = 0
        
        transactions.append(tx_data)
    
    if not transactions:
        print(f"NO fund flows found for scheme {scheme_id}")
        
        # Show available schemes
        print("\nAvailable scheme_ids in fund_flows:")
        schemes = db.collection("fund_flows").limit(100).stream()
        scheme_ids = set()
        for doc in schemes:
            sid = doc.to_dict().get('scheme_id')
            if sid:
                scheme_ids.add(sid)
        
        for sid in sorted(scheme_ids)[:20]:
            print(f"   - {sid}")
        sys.exit(1)
    
    print(f"GOT {len(transactions)} fund flows\n")
    
    # Show transactions
    print("="*70)
    print(f"FUND FLOWS FOR SCHEME {scheme_id}")
    print("="*70)
    for i, tx in enumerate(transactions[:10], 1):
        amount = tx.get('amount', 0)
        date = tx.get('transfer_date', tx.get('created_at', 'N/A'))
        status = tx.get('status', 'unknown')
        entity = tx.get('to_entity_name', 'Unknown')[:30]
        print(f"{i}. ₹{amount:>12,.0f} | {date} | {status} | {entity}")
    
    if len(transactions) > 10:
        print(f"... and {len(transactions) - 10} more")
    
    # Detect anomalies
    print(f"\n{'='*70}")
    print("RUNNING ANOMALY DETECTION")
    print("="*70 + "\n")
    
    service = AnomalyService()
    result = service.detect_anomalies_comprehensive(scheme_id, transactions)
    
    # Print results
    print(f"Total Anomalies Found: {result['total_anomalies']}")
    
    if result['total_anomalies'] > 0:
        print(f"\nANOMALIES DETECTED:")
        print("-"*70)
        
        for i, anomaly in enumerate(result['anomalies'], 1):
            print(f"\n{i}. Transaction: {anomaly['id']}")
            print(f"   Amount: ₹{anomaly.get('amount', 'N/A'):,}")
            print(f"   Type: {anomaly['anomaly_type']}")
            print(f"   Severity: {anomaly['severity'].upper()}")
            print(f"   Confidence: {anomaly.get('confidence_score', 0):.0%}")
            print(f"   Reason: {anomaly.get('description', 'N/A')}")
    else:
        print("NO anomalies detected!")
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
