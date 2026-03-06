"""
📊 STEP-BY-STEP EXECUTION FLOW - What Happens When You Call the API
"""

print("""

═══════════════════════════════════════════════════════════════════════════════
SCENARIO: User calls POST /api/v1/anomalies/detect/from-transactions/123
═══════════════════════════════════════════════════════════════════════════════

TIME: T=0ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ REQUEST RECEIVED                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ curl -X POST \\                                                              │
│   http://localhost:8000/api/v1/anomalies/detect/from-transactions/123 \\    │
│   -H "Content-Type: application/json" \\                                    │
│   -d '{"transactions": [...], "transfers": [...]}'                         │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=10ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: VALIDATE INPUT & QUERY FIREBASE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/api/anomaly_routes.py                                            │
│ Function: detect_from_transactions_endpoint()                              │
│                                                                             │
│ Code:                                                                       │
│   scheme_id = 123                                                           │
│   db = FirebaseConfig.get_db()                                             │
│                                                                             │
│   transactions = db.collection("transactions") \\                          │
│       .where("scheme_id", "==", 123) \\                                    │
│       .order_by("date", direction="DESCENDING") \\                         │
│       .stream()                                                             │
│                                                                             │
│ Firebase Returns:                                                           │
│   [                                                                         │
│     {"id": "txn001", "scheme_id": 123, "amount": 10000, "date": "..."},   │
│     {"id": "txn002", "scheme_id": 123, "amount": 12000, "date": "..."},   │
│     {"id": "txn003", "scheme_id": 123, "amount": 500000, "date": "..."},  │
│     ... (100 transactions)                                                 │
│   ]                                                                         │
│                                                                             │
│ Status: ✅ Got 100 transactions from Firebase                              │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=50ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: EXTRACT FEATURES AUTOMATICALLY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/feature_extractor.py                  │
│ Function: extract_features_from_transactions()                             │
│                                                                             │
│ Processing each transaction:                                               │
│                                                                             │
│ Transaction #1: amount=10000                                               │
│   ├─ Variance: collect all amounts in last 10 txns                        │
│   │  [10000, ...] → calculate std deviation = 195066.42                   │
│   ├─ Velocity: (10000 - previous) / previous = not enough data yet        │
│   └─ Frequency: 1 txn on this date = 1.0 txns/day                        │
│                                                                             │
│ Transaction #2: amount=12000                                               │
│   ├─ Variance: [10000, 12000, ...] → std = 195201.15                     │
│   ├─ Velocity: (12000 - 10000) / 10000 = 0.20 (20% increase) ✓            │
│   └─ Frequency: 2 txns over 1 day = 2.0 txns/day                         │
│                                                                             │
│ Transaction #3: amount=500000 ⚠️ THE BIG ONE                               │
│   ├─ Variance: [10000, 12000, ..., 500000] → std = 245123.89             │
│   ├─ Velocity: (500000 - 12000) / 12000 = 40.67 (4067% increase!) 🚨     │
│   └─ Frequency: 3 txns over 2 days = 1.5 txns/day                        │
│                                                                             │
│ Output: Array of 100 features with calculated:                             │
│   [{                                                                        │
│     "id": "txn001",                                                        │
│     "amount": 10000,                                                       │
│     "variance": 195066.42,                                                 │
│     "velocity": 0.0,    (first txn, no previous)                          │
│     "frequency": 1.0                                                       │
│   }, {                                                                      │
│     "id": "txn002",                                                        │
│     "amount": 12000,                                                       │
│     "variance": 195201.15,                                                 │
│     "velocity": 0.20,                                                      │
│     "frequency": 2.0                                                       │
│   }, {                                                                      │
│     "id": "txn003",                                                        │
│     "amount": 500000,                                                      │
│     "variance": 245123.89,                                                 │
│     "velocity": 40.67,  ← ANOMALY! (4067% increase)                      │
│     "frequency": 1.5                                                       │
│   }, ...]                                                                   │
│                                                                             │
│ Status: ✅ Extracted features from 100 transactions                        │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=80ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: RUN ANOMALY DETECTOR #1 - STATISTICAL (Z-SCORE)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/__init__.py                           │
│ Class: StatisticalDetector                                                 │
│ Method: detect_anomalies()                                                 │
│                                                                             │
│ For each transaction:                                                       │
│                                                                             │
│ Transaction #3 (amount=500000):                                            │
│   ├─ Z-Score = |500000 - mean| / std_dev                                  │
│   │           = |500000 - 10500| / 195066.42                              │
│   │           = 489500 / 195066.42                                         │
│   │           = 2.51 ← This is Z-score (how many std devs away)           │
│   │                                                                         │
│   ├─ Threshold = 2.5                                                       │
│   ├─ Check: 2.51 > 2.5? YES ✅                                            │
│   └─ Result: ANOMALY DETECTED                                              │
│       {                                                                     │
│         "anomaly_type": "sudden_spike",                                   │
│         "severity": "critical",                                            │
│         "confidence": 0.95,                                                │
│         "reason": "Amount 500000 deviates 2.51σ from average 10500"       │
│       }                                                                     │
│                                                                             │
│ Idle Funds Check:                                                          │
│   ├─ Last transfer: Jan 15                                                 │
│   ├─ Today: Mar 7                                                          │
│   ├─ Days idle: 51 days                                                    │
│   ├─ Threshold: 30 days                                                    │
│   ├─ Check: 51 > 30? YES ✅                                               │
│   └─ Result: ANOMALY DETECTED                                              │
│       {                                                                     │
│         "anomaly_type": "idle_funds",                                     │
│         "severity": "warning",                                             │
│         "confidence": 0.6,                                                 │
│         "reason": "Transfer idle for 51 days (threshold: 30)"             │
│       }                                                                     │
│                                                                             │
│ Status: ✅ Found 2 anomalies (sudden spike + idle funds)                 │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=100ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: RUN ANOMALY DETECTOR #2 - VELOCITY SPIKE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/__init__.py                           │
│ Class: StatisticalDetector                                                 │
│ Method: detect_velocity_spikes()                                           │
│                                                                             │
│ Transaction #3 (amount=500000):                                            │
│   ├─ Previous amount: 12000                                                │
│   ├─ Current amount: 500000                                                │
│   │                                                                         │
│   ├─ Velocity = (500000 - 12000) / 12000                                   │
│   │            = 488000 / 12000                                            │
│   │            = 40.67 (4067% increase in one transaction!)               │
│   │                                                                         │
│   ├─ Threshold = 1.0 (100% change)                                        │
│   ├─ Check: 40.67 > 1.0? YES ✅✅✅                                       │
│   └─ Result: CRITICAL ANOMALY                                              │
│       {                                                                     │
│         "anomaly_type": "velocity_spike",                                 │
│         "severity": "critical",                                            │
│         "confidence": 0.85,                                                │
│         "reason": "Spending changed by +4067% from 12000 to 500000"       │
│       }                                                                     │
│                                                                             │
│ Status: ✅ Found 1 anomaly (velocity spike)                              │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=120ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: RUN ANOMALY DETECTOR #3 - ISOLATION FOREST (PURE PYTHON)          │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/__init__.py                           │
│ Class: SimpleIsolationForest                                               │
│ Method: fit_predict()                                                      │
│                                                                             │
│ Input: All 100 feature vectors [variance, velocity, frequency, amount]   │
│                                                                             │
│ Algorithm: Build random trees to isolate outliers                          │
│   ├─ Build 100 random decision trees                                       │
│   ├─ Each tree randomly splits features                                    │
│   ├─ Outliers are isolated faster (shorter path)                          │
│   ├─ Normal points need deeper paths                                       │
│   │                                                                         │
│   ├─ For Transaction #3 [variance=245123, velocity=40.67, freq=1.5]:     │
│   │   ├─ Tree 1: Split on velocity → 40.67 goes left (path_length=1)     │
│   │   ├─ Tree 2: Split on amount → 500000 goes left (path_length=1)      │
│   │   ├─ Tree 3-100: Similar short paths                                  │
│   │   └─ Avg path_length = 2.1 (very short = anomaly!)                   │
│   │                                                                         │
│   └─ Anomaly Score = 2.1 / 8.2 (avg normal path) = 0.25 (anomaly!)       │
│                                                                             │
│ Result: -1 (ANOMALY) for Transaction #3                                    │
│   {                                                                         │
│     "anomaly_type": "multidimensional_outlier",                           │
│     "severity": "medium",                                                  │
│     "confidence": 0.72,                                                    │
│     "reason": "Multidimensional pattern isolation score = 0.25"           │
│   }                                                                         │
│                                                                             │
│ Status: ✅ Found 1 anomaly (isolation forest)                            │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=145ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: RUN ANOMALY DETECTOR #4 - IDLE FUNDS (already in step 3)         │
├─────────────────────────────────────────────────────────────────────────────┤
│ (Already computed in Statistical Detector)                                  │
│ Status: ✅ Idle funds check complete                                      │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=150ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: CONSOLIDATE RESULTS FROM ALL DETECTORS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/__init__.py                           │
│ Class: AnomalyService                                                      │
│ Method: detect_anomalies_comprehensive()                                   │
│                                                                             │
│ Combine results:                                                            │
│                                                                             │
│ Transaction #3 (500000):                                                   │
│   ├─ Detector 1 (Z-Score): ANOMALY (spike)                                │
│   ├─ Detector 2 (Velocity): ANOMALY (4067% spike)                        │
│   ├─ Detector 3 (Isolation): ANOMALY (outlier)                            │
│   ├─ Detector 4 (Idle): N/A (not applicable to monthly amount)            │
│   │                                                                         │
│   └─ FINAL RESULT:                                                         │
│       {                                                                     │
│         "transaction_id": "txn003",                                        │
│         "amount": 500000,                                                  │
│         "is_anomaly": true,                                               │
│         "anomalies": [                                                     │
│           {                                                                │
│             "type": "sudden_spike",                                       │
│             "detector": "z_score",                                        │
│             "severity": "critical",                                       │
│             "confidence": 0.95,                                           │
│             "description": "Amount 500000 deviates 2.51σ from avg 10500"  │
│           },                                                               │
│           {                                                                │
│             "type": "velocity_spike",                                     │
│             "detector": "velocity",                                       │
│             "severity": "critical",                                       │
│             "confidence": 0.85,                                           │
│             "description": "Spending +4067% from 12000 to 500000"        │
│           },                                                               │
│           {                                                                │
│             "type": "multidimensional_outlier",                           │
│             "detector": "isolation_forest",                               │
│             "severity": "medium",                                         │
│             "confidence": 0.72,                                           │
│             "description": "Multidimensional pattern isolation score=0.25" │
│           }                                                                │
│         ]                                                                  │
│       }                                                                     │
│                                                                             │
│ Status: ✅ Consolidated results from 4 detectors                         │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=160ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: SAVE TO FIREBASE                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ File: app/modules/anomaly_detection/__init__.py                           │
│ Class: AnomalyRepository                                                   │
│ Method: save_anomalies()                                                   │
│                                                                             │
│ Code:                                                                       │
│   db.collection("anomalies").add({                                        │
│     "scheme_id": 123,                                                      │
│     "timestamp": datetime.now().isoformat(),                              │
│     "detected_anomalies": [...],                                          │
│     "total_count": 3,                                                      │
│     "severity_distribution": {                                            │
│       "critical": 2,  ← 2 anomalies are critical!                        │
│       "medium": 1,                                                         │
│       "warning": 0                                                         │
│     },                                                                      │
│     "average_confidence": 0.84,                                            │
│     "status": "pending_review"                                            │
│   })                                                                        │
│                                                                             │
│ Firebase Response: Document "anomalies/doc_xyz" created                    │
│ Status: ✅ Saved to Firebase                                              │
└─────────────────────────────────────────────────────────────────────────────┘

TIME: T=170ms
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: RETURN RESPONSE TO CLIENT                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ HTTP Response (200 OK):                                                     │
│                                                                             │
│ {                                                                           │
│   "status": "success",                                                      │
│   "scheme_id": 123,                                                        │
│   "timestamp": "2026-03-07T15:30:45.123456",                              │
│   "summary": {                                                              │
│     "total_transactions_analyzed": 100,                                   │
│     "total_anomalies_detected": 3,                                        │
│     "critical_count": 2,                                                   │
│     "medium_count": 1,                                                      │
│     "warning_count": 0,                                                    │
│     "average_confidence": 0.84                                             │
│   },                                                                        │
│   "anomalies": [                                                            │
│     {                                                                       │
│       "transaction_id": "txn003",                                          │
│       "amount": 500000,                                                    │
│       "date": "2026-03-03",                                               │
│       "is_anomaly": true,                                                 │
│       "severity": "critical",                                              │
│       "detectors_triggered": 3,                                            │
│       "reasons": [                                                         │
│         "Amount 500000 deviates 2.51σ from average 10500",                │
│         "Spending changed by +4067% from 12000 to 500000",                │
│         "Multidimensional pattern isolation score = 0.25"                │
│       ]                                                                     │
│     },                                                                      │
│     ... more anomalies ...                                                │
│   ]                                                                         │
│ }                                                                           │
│                                                                             │
│ Total Time: 170ms ⚡                                                        │
│ Status: ✅ Response sent to client                                        │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
EXAMPLE FLOW USING PYTHON
═══════════════════════════════════════════════════════════════════════════════

from firebase_anomaly_integration import AnomalyDetectionPipeline
import time

pipeline = AnomalyDetectionPipeline()
start = time.time()

print("📊 Starting Anomaly Detection for Scheme 123...")

# Step 1: Get transactions
print("\\n1️⃣  Querying Firebase for transactions...")
transactions = pipeline.get_transactions_by_scheme(123)
print(f"   ✅ Got {len(transactions)} transactions")

# Step 2: Get transfers
print("\\n2️⃣  Querying Firebase for transfers...")
transfers = pipeline.get_transfers_by_scheme(123)
print(f"   ✅ Got {len(transfers)} transfers")

# Step 3: Run detectors
print("\\n3️⃣  Running anomaly detectors...")
from app.modules.anomaly_detection import AnomalyService
service = AnomalyService()
result = service.detect_anomalies_comprehensive(transactions)
print(f"   ✅ Found {result['total_anomalies']} anomalies")

# Step 4: Save to Firebase
print("\\n4️⃣  Saving results to Firebase...")
pipeline.db.collection("anomalies").add(result)
print("   ✅ Saved to Firebase")

elapsed = time.time() - start
print(f"\\n✨ Complete! Took {elapsed:.2f} seconds")

# Step 5: Display results
print(f"\\n📋 Results Summary:")
print(f"   Critical: {result['critical_count']} anomalies")
print(f"   Medium: {result['medium_count']} anomalies")
print(f"   Warning: {result['warning_count']} anomalies")
print(f"   Average Confidence: {result['avg_confidence']:.1%}")

═══════════════════════════════════════════════════════════════════════════════
KEY TAKEAWAYS
═══════════════════════════════════════════════════════════════════════════════

✅ The entire flow from API request → Firebase query → feature extraction → 
   4 detectors → consolidation → save → response takes ~170ms

✅ No manual steps needed - features are auto-extracted

✅ 4 different perspectives (Z-Score, Velocity, Isolation Forest, Idle Funds)
   caught this anomaly from multiple angles

✅ Results are immediately saved to Firebase for persistence

✅ Response includes:
   - Which detectors triggered (3 out of 4)
   - Severity score
   - Confidence score
   - Human-readable reasons

═══════════════════════════════════════════════════════════════════════════════
""")