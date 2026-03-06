"""
═══════════════════════════════════════════════════════════════════════════════
🎯 SWAGGER UI TEST GUIDE - Anomaly Detection
═══════════════════════════════════════════════════════════════════════════════

⚠️  IMPORTANT: The new endpoint is now available in Swagger UI!

📍 ENDPOINT: POST /api/v1/anomalies/detect/from-transactions/{scheme_id}

This is the MAIN endpoint for production use. It:
✅ Takes raw transaction data from your database
✅ Automatically calculates variance, velocity, frequency
✅ Detects 4 types of anomalies
✅ Returns detailed explanations

═══════════════════════════════════════════════════════════════════════════════
📋 STEP-BY-STEP SWAGGER TEST
═══════════════════════════════════════════════════════════════════════════════

1. Go to: http://localhost:8000/docs (Swagger UI)

2. Find the section: "Anomaly Detection"

3. Click: POST /api/v1/anomalies/detect/from-transactions/{scheme_id}

4. Click "Try it out"

5. Enter scheme_id: 123 (any integer)

6. Copy-paste the complete request body below into the textarea

═══════════════════════════════════════════════════════════════════════════════
📝 REQUEST BODY - COPY THIS EXACTLY
═══════════════════════════════════════════════════════════════════════════════
"""

test_data = {
    "transactions": [
        {
            "id": 1,
            "amount": 10000,
            "date": "2026-02-25T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Regular salary disbursement"
        },
        {
            "id": 2,
            "amount": 11000,
            "date": "2026-02-26T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Regular salary disbursement"
        },
        {
            "id": 3,
            "amount": 12000,
            "date": "2026-02-27T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Regular salary disbursement"
        },
        {
            "id": 4,
            "amount": 500000,
            "date": "2026-02-28T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Large unexpected disbursement"
        },
        {
            "id": 5,
            "amount": 9000,
            "date": "2026-03-01T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Recovery disbursement"
        },
        {
            "id": 6,
            "amount": 10500,
            "date": "2026-03-02T10:00:00",
            "scheme_id": 123,
            "status": "completed",
            "description": "Regular salary disbursement"
        }
    ],
    "transfers": [
        {
            "id": "t1",
            "amount": 50000,
            "transfer_date": "2026-01-15T10:00:00",
            "status": "transferred",
            "to_level": "district",
            "description": "Fund transfer to district"
        },
        {
            "id": "t2",
            "amount": 25000,
            "transfer_date": "2026-02-28T10:00:00",
            "status": "transferred",
            "to_level": "state",
            "description": "Fund transfer to state"
        }
    ]
}

import json
print(json.dumps(test_data, indent=2))

print("""
═══════════════════════════════════════════════════════════════════════════════
✅ WHAT TO EXPECT IN RESPONSE
═══════════════════════════════════════════════════════════════════════════════

The API will return something like this:

{
  "scheme_id": 123,
  "status": "success",
  "summary": {
    "total_transactions": 6,
    "total_anomalies_detected": 3,
    "detectors_used": ["z_score", "velocity_spike", "isolation_forest", "idle_funds"]
  },
  "extracted_features": {
    "transaction_count": 6,
    "features_sample": [
      {
        "id": 1,
        "amount": 10000,
        "variance": 0,
        "velocity": 0,
        "frequency": 0.83
      },
      ... more features ...
    ]
  },
  "anomalies": [
    {
      "id": 1,
      "scheme_id": 123,
      "anomaly_type": "sudden_spike",         ← Type of anomaly
      "severity": "critical",                 ← 🔴 Critical!
      "confidence_score": 0.95,               ← 95% confident
      "description": "[Z-Score] Amount 500000.00 deviates 4.50σ from average 10500.00",
      "detected_date": "2026-03-07T12:30:00"
    },
    {
      "anomaly_type": "velocity_spike",       ← Sudden velocity change
      "severity": "critical",
      "confidence_score": 0.85,
      "description": "[Velocity Spike] Spending changed by 4050.0% from 12000 to 500000"
    },
    {
      "anomaly_type": "idle_funds",           ← Transfer not spent
      "severity": "warning",
      "confidence_score": 0.6,
      "description": "[Idle Funds] Transfer t1 (₹50000.00) idle for 51 days to district"
    }
  ],
  "detector_details": {
    "z_score": {
      "is_anomaly": true,
      "z_score": 4.5,
      "confidence_score": 0.95
    },
    "velocity_spike": {
      "is_anomaly": true,
      "velocity": 40.5
    },
    "isolation_forest": [],
    "idle_funds": [
      {
        "transfer_id": "t1",
        "amount": 50000,
        "days_idle": 51,
        "severity": "warning"
      }
    ]
  },
  "idle_funds": [...],
  "explanations": {
    "z_score": "Detects spending amounts that deviate significantly from average (statistical outliers)",
    "velocity_spike": "Detects sudden changes in transaction amounts (% change > 100%)",
    "isolation_forest": "Detects multidimensional outliers across amount, frequency, variance, velocity",
    "idle_funds": "Detects funds transferred but not spent within 30 days"
  }
}

═══════════════════════════════════════════════════════════════════════════════
🔍 HOW TO INTERPRET RESULTS
═══════════════════════════════════════════════════════════════════════════════

Severity Levels:
🔴 CRITICAL   - Immediate action needed, confidence > 0.8
🟡 WARNING    - Monitor closely, confidence 0.5-0.8
🟢 INFO       - For reference, confidence < 0.5

Confidence Score:
0.95 = Very confident this is an anomaly (95% sure)
0.5  = Moderate confidence (50% sure)
0.1  = Low confidence (just a flag)

Anomaly Types Explained:

1. "sudden_spike" 
   → Spending jumped unexpectedly
   → Caused by Z-Score detector
   → Check: Is this legitimate purchase?

2. "velocity_spike"
   → Rate of spending changed dramatically
   → Caused by Velocity detector
   → Check: Why did spending rate increase?

3. "multidimensional_outlier"
   → Unusual pattern across multiple features
   → Caused by Isolation Forest detector
   → Check: Does this transaction fit normal behavior?

4. "idle_funds"
   → Money transferred but hasn't been spent
   → Caused by Idle Funds detector
   → Check: Why hasn't this money been used?

═══════════════════════════════════════════════════════════════════════════════
💡 REAL WORLD EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Example 1: Usual Spending Pattern (NO ANOMALIES)
Regular disbursements: 10k → 11k → 12k → 11k → 10k → 9k
Result: All detectors return FALSE
Status: ✅ Normal operation

Example 2: Sudden Spike (ALL DETECTORS ALERT)
Regular: 10k → 11k → 12k → [500k] → 9k
Z-Score:        Detects 500k is 4.5σ away ✅
Velocity:       Detects +4050% change ✅
Isolation Forest: Detects outlier in feature space ✅
Result: 🚨 CRITICAL - Investigate immediately!

Example 3: Idle Funds (IDLE FUNDS DETECTOR)
Transfer on Jan 15: 50k
Current date: Mar 7 (51 days later)
Result: 🟡 WARNING - Fund not spent, possible misuse

Example 4: Fraud Pattern (MIGHT NOT trigger single detector)
Series of small txns: 1k, 0.9k, 1.1k, [100k], 1k
Isolation Forest detects this unusual pattern ✅
Result: 🟡 WARNING - Suspicious pattern detected

═══════════════════════════════════════════════════════════════════════════════
🚀 PRODUCTION INTEGRATION
═══════════════════════════════════════════════════════════════════════════════

Use this endpoint like this in production:

```python
from fastapi import FastAPI
import httpx

app = FastAPI()

# After a user makes a payment/transfer:
@app.post("/api/payments")
def process_payment(payment_data):
    # Save payment
    payment = db.save_payment(payment_data)
    
    # Get all user transactions (for context)
    user_transactions = db.query(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 100",
        payment_data.user_id
    )
    
    # Call anomaly detection
    response = httpx.post(
        "http://localhost:8000/api/v1/anomalies/detect/from-transactions/123",
        json={
            "transactions": user_transactions,
            "transfers": get_user_transfers(payment_data.user_id)
        }
    )
    
    result = response.json()
    
    # Action based on anomalies
    if result['total_anomalies_detected'] > 2:
        # Critical anomaly - block and alert
        send_alert_to_admin(f"CRITICAL: {result['anomalies'][0]['description']}")
        return {"status": "blocked", "reason": "Suspicious pattern detected"}
    
    elif any(a['severity'] == 'critical' for a in result['anomalies']):
        # Requires manual review
        send_alert_to_compliance_team(result)
        return {"status": "pending_review"}
    
    else:
        # All good
        return {"status": "approved", "transaction_id": payment.id}
```

═══════════════════════════════════════════════════════════════════════════════
✅ YOU'RE READY!
═══════════════════════════════════════════════════════════════════════════════

Now go to http://localhost:8000/docs and test the endpoint!

Need help?
- Check the response examples above
- Look at the detector explanations
- Adjust the test data to see different behaviors
- Monitor the confidence scores

Happy testing! 🎉
""")
