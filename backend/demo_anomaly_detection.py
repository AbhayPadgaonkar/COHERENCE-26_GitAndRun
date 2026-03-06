#!/usr/bin/env python3
"""
DEMO: How Anomaly Detection Works with Raw Transaction Data
Shows the complete flow from database transactions → feature extraction → anomaly detection
"""

from datetime import datetime, timedelta
from app.modules.anomaly_detection.feature_extractor import FeatureExtractor, AnomalyWindowAnalyzer
from app.modules.anomaly_detection import AnomalyService

# ============================================================================
# STEP 1: RAW TRANSACTION DATA (from your database)
# ============================================================================
print("=" * 80)
print("STEP 1: RAW TRANSACTION DATA (from database)")
print("=" * 80)

transactions = [
    {
        "id": 1,
        "amount": 10000,
        "date": (datetime.now() - timedelta(days=10)).isoformat(),
        "scheme_id": 123,
        "status": "completed",
        "description": "Regular disbursement"
    },
    {
        "id": 2,
        "amount": 11000,
        "date": (datetime.now() - timedelta(days=9)).isoformat(),
        "scheme_id": 123,
        "status": "completed",
        "description": "Regular disbursement"
    },
    {
        "id": 3,
        "amount": 12000,
        "date": (datetime.now() - timedelta(days=8)).isoformat(),
        "scheme_id": 123,
        "status": "completed",
        "description": "Regular disbursement"
    },
    {
        "id": 4,
        "amount": 500000,  # 🚨 ANOMALY!
        "date": (datetime.now() - timedelta(days=7)).isoformat(),
        "scheme_id": 123,
        "status": "completed",
        "description": "Large disbursement"
    },
    {
        "id": 5,
        "amount": 9000,
        "date": (datetime.now() - timedelta(days=6)).isoformat(),
        "scheme_id": 123,
        "status": "completed",
        "description": "Recovery disbursement"
    }
]

print(f"Total transactions: {len(transactions)}\n")
for txn in transactions:
    marker = "🚨" if txn["amount"] > 100000 else "✓"
    print(f"{marker} Transaction {txn['id']}: ₹{txn['amount']:,} on {txn['date'][:10]}")

# ============================================================================
# STEP 2: AUTOMATIC FEATURE EXTRACTION
# ============================================================================
print("\n" + "=" * 80)
print("STEP 2: AUTOMATIC FEATURE EXTRACTION")
print("=" * 80)
print("\nExtracting: variance, velocity, frequency...")

extractor = FeatureExtractor()
features = extractor.extract_features_from_transactions(transactions)

print(f"\nExtracted {len(features)} feature sets:\n")
for feat in features:
    print(f"Transaction {feat['id']}:")
    print(f"  Amount:    ₹{feat['amount']:,.0f}")
    print(f"  Variance:  {feat['variance']:.2f} (std deviation of last txns)")
    print(f"  Velocity:  {feat['velocity']*100:.1f}% (change from previous)")
    print(f"  Frequency: {feat['frequency']:.2f} txns/day")
    print()

# ============================================================================
# STEP 3: MATHEMATICAL CALCULATIONS (How anomalies are detected)
# ============================================================================
print("=" * 80)
print("STEP 3: HOW ANOMALIES ARE DETECTED (The Math)")
print("=" * 80)

amounts = [float(t["amount"]) for t in transactions]
import statistics

mean_amount = statistics.mean(amounts)
stdev_amount = statistics.stdev(amounts)

print(f"\n1️⃣  Z-SCORE DETECTOR:")
print(f"   Mean amount: ₹{mean_amount:,.0f}")
print(f"   Std Dev:     ₹{stdev_amount:,.0f}")
print(f"\n   For each transaction:")
for i, amt in enumerate(amounts):
    z_score = abs((amt - mean_amount) / stdev_amount) if stdev_amount > 0 else 0
    is_anomaly = "🚨 ANOMALY!" if z_score > 2.5 else "✓ Normal"
    print(f"      txn {i+1}: z-score = {z_score:.2f}  →  {is_anomaly}")

print(f"\n2️⃣  VELOCITY DETECTOR:")
print(f"   Threshold: 100% change (velocity > 1.0)")
print(f"\n   Velocity between consecutive transactions:")
for i in range(1, len(amounts)):
    prev = amounts[i-1]
    curr = amounts[i]
    velocity = (curr - prev) / prev if prev > 0 else 0
    is_anomaly = "🚨 ANOMALY!" if abs(velocity) > 1.0 else "✓ Normal"
    print(f"      txn {i} → txn {i+1}: {velocity*100:+.1f}% change  →  {is_anomaly}")

print(f"\n3️⃣  IDLE FUNDS DETECTOR:")
transfers = [
    {
        "id": "t1",
        "amount": 50000,
        "transfer_date": (datetime.now() - timedelta(days=51)).isoformat(),
        "status": "transferred",
        "to_level": "district"
    },
    {
        "id": "t2",
        "amount": 25000,
        "transfer_date": (datetime.now() - timedelta(days=5)).isoformat(),
        "status": "transferred",
        "to_level": "state"
    }
]

idle_transfers = extractor.extract_idle_transfers(transfers, days_threshold=30)
for txfer in transfers:
    transfer_date = datetime.fromisoformat(txfer["transfer_date"])
    days_idle = (datetime.now() - transfer_date).days
    is_anomaly = "🚨 ANOMALY!" if days_idle > 30 else "✓ Normal"
    print(f"   Transfer {txfer['id']}: {days_idle} days idle  →  {is_anomaly}")

# ============================================================================
# STEP 4: RUN COMPREHENSIVE ANOMALY DETECTION
# ============================================================================
print("\n" + "=" * 80)
print("STEP 4: RUN COMPREHENSIVE ANOMALY DETECTION")
print("=" * 80)

service = AnomalyService()
result = service.detect_anomalies_comprehensive(
    scheme_id=123,
    spending_data=features,
    transfers=transfers
)

print(f"\n✅ RESULTS:")
print(f"   Scheme ID: {result['scheme_id']}")
print(f"   Total Anomalies Detected: {result['total_anomalies']}")
print(f"   Detectors Used: {', '.join(result['detectors_used'])}")

if result['anomalies']:
    print(f"\n🚨 ANOMALIES FOUND:\n")
    for i, anomaly in enumerate(result['anomalies'], 1):
        severity_emoji = "🔴" if anomaly['severity'] == "critical" else "🟡"
        print(f"{severity_emoji} Anomaly {i}: {anomaly['anomaly_type'].upper()}")
        print(f"   Severity:   {anomaly['severity'].upper()}")
        print(f"   Confidence: {anomaly['confidence_score']*100:.0f}%")
        print(f"   Details:    {anomaly['description']}")
        print()
else:
    print("\n✅ No anomalies detected")

# ============================================================================
# STEP 5: DETECTION SUMMARY
# ============================================================================
print("=" * 80)
print("STEP 5: HOW EACH DETECTOR PERFORMED")
print("=" * 80)

detector_results = result['detector_results']

print(f"\n1️⃣  Z-SCORE:")
if detector_results['z_score'].get('is_anomaly'):
    print(f"   ✅ DETECTED ANOMALY")
    print(f"      Z-score of largest deviation: {detector_results['z_score']['z_score']:.2f}σ")
else:
    print(f"   ✅ No significant deviation")

print(f"\n2️⃣  VELOCITY SPIKE:")
if detector_results['velocity_spike'].get('is_anomaly'):
    print(f"   ✅ DETECTED ANOMALY")
    print(f"      Velocity: {detector_results['velocity_spike']['velocity']*100:.1f}% change")
else:
    print(f"   ✅ No unusual velocity")

print(f"\n3️⃣  ISOLATION FOREST:")
iso_anomalies = detector_results.get('isolation_forest', [])
if iso_anomalies:
    print(f"   ✅ DETECTED {len(iso_anomalies)} ANOMALIES")
else:
    print(f"   ✅ No multidimensional outliers")

print(f"\n4️⃣  IDLE FUNDS:")
idle_anomalies = detector_results.get('idle_funds', [])
if idle_anomalies:
    print(f"   ✅ DETECTED {len(idle_anomalies)} IDLE TRANSFERS")
    for idle in idle_anomalies:
        print(f"      Transfer {idle['transfer_id']}: ₹{idle['amount']:,} idle for {idle['days_idle']} days")
else:
    print(f"   ✅ No idle funds")

print("\n" + "=" * 80)
print("✅ COMPLETE! Ready for production use")
print("=" * 80)
