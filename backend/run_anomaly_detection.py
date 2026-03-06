#!/usr/bin/env python3
"""
Simple script: Get transactions from Firebase and detect anomalies
"""

import sys
sys.path.insert(0, 'd:\\myenv\\coherence\\COHERENCE-26_GitAndRun\\backend')

from app.modules.anomaly_detection import AnomalyService

# Get scheme ID from command line or use default
scheme_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1

print(f"\n📊 Detecting anomalies for scheme {scheme_id}...")

try:
    # Sample transactions (in production, these would come from Firebase)
    transactions = [
        {"id": "txn001", "scheme_id": scheme_id, "amount": 10000, "date": "2026-03-01T10:00:00", "status": "completed"},
        {"id": "txn002", "scheme_id": scheme_id, "amount": 12000, "date": "2026-03-02T10:00:00", "status": "completed"},
        {"id": "txn003", "scheme_id": scheme_id, "amount": 11500, "date": "2026-03-03T10:00:00", "status": "completed"},
        {"id": "txn004", "scheme_id": scheme_id, "amount": 9800, "date": "2026-03-04T10:00:00", "status": "completed"},
        {"id": "txn005", "scheme_id": scheme_id, "amount": 13200, "date": "2026-03-05T10:00:00", "status": "completed"},
        {"id": "txn006", "scheme_id": scheme_id, "amount": 500000, "date": "2026-03-06T10:00:00", "status": "completed"},  # ANOMALY
        {"id": "txn007", "scheme_id": scheme_id, "amount": 10500, "date": "2026-03-07T10:00:00", "status": "completed"},
    ]
    
    print(f"✅ Got {len(transactions)} transactions")
    
    # Show sample
    print(f"\n📋 Transactions:")
    for txn in transactions:
        marker = " ⚠️ SPIKE" if txn['amount'] > 50000 else ""
        print(f"   • {txn['id']}: ₹{txn['amount']:,}{marker}")
    
    # Detect anomalies
    print(f"\n🎯 Running anomaly detection (4 detectors)...\n")
    service = AnomalyService()
    result = service.detect_anomalies_comprehensive(scheme_id, transactions)
    
    # Show results
    print(f"{'='*70}")
    print(f"RESULTS FOR SCHEME {scheme_id}")
    print(f"{'='*70}")
    print(f"Total Anomalies: {result['total_anomalies']}")
    
    # Count by severity
    critical = len([a for a in result['anomalies'] if a.get('severity') == 'critical'])
    medium = len([a for a in result['anomalies'] if a.get('severity') == 'medium'])
    warning = len([a for a in result['anomalies'] if a.get('severity') == 'warning'])
    
    print(f"Critical: {critical}")
    print(f"Medium: {medium}")
    print(f"Warning: {warning}")
    
    if result['total_anomalies'] > 0:
        print(f"\n{'DETAILED ANOMALIES:'}")
        print(f"{'─'*70}")
        for i, anom in enumerate(result['anomalies'], 1):
            print(f"\n{i}. Transaction: {anom.get('id', 'N/A')}")
            print(f"   Amount: ₹{anom.get('amount', 0):,}")
            print(f"   Severity: {anom.get('severity', 'unknown').upper()}")
            print(f"   Confidence: {anom.get('confidence', 0):.0%}")
            print(f"   Reasons:")
            for reason in anom.get('reasons', []):
                print(f"      • {reason}")
    else:
        print(f"\n✅ No anomalies detected")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
