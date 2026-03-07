#!/usr/bin/env python3
"""
Test Script: Push Firebase Transactions & Test Predictions
Tests if prediction models are working properly
"""

import sys
sys.path.insert(0, 'd:\\myenv\\coherence\\COHERENCE-26_GitAndRun\\backend')

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from app.modules.prediction import ml_prediction_service
import json

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

print("✅ Connected to Firebase\n")

# Sample transactions to push
sample_transactions = [
    # Scheme 1: WOMEN-SHG-EMPOWERMENT (stable, medium risk)
    {
        "scheme_id": "WOMEN-SHG-EMPOWERMENT",
        "amount": 50000,
        "transfer_date": (datetime.now() - timedelta(days=30)).isoformat(),
        "from_entity_type": "central",
        "to_entity_type": "state",
        "from_entity_name": "Ministry of Finance",
        "to_entity_name": "State Finance Department - Maharashtra",
        "status": "completed",
        "processing_days": 5,
        "fund_utilization_rate": 0.65,
        "seasonal_factor": 1.02
    },
    {
        "scheme_id": "WOMEN-SHG-EMPOWERMENT",
        "amount": 48000,
        "transfer_date": (datetime.now() - timedelta(days=20)).isoformat(),
        "from_entity_type": "state",
        "to_entity_type": "district",
        "from_entity_name": "State Finance Department - Maharashtra",
        "to_entity_name": "District Office - Pune",
        "status": "completed",
        "processing_days": 6,
        "fund_utilization_rate": 0.72,
        "seasonal_factor": 1.01
    },
    {
        "scheme_id": "WOMEN-SHG-EMPOWERMENT",
        "amount": 45000,
        "transfer_date": (datetime.now() - timedelta(days=10)).isoformat(),
        "from_entity_type": "district",
        "to_entity_type": "beneficiary",
        "from_entity_name": "District Office - Pune",
        "to_entity_name": "SHG Groups - Pune Region",
        "status": "completed",
        "processing_days": 12,
        "fund_utilization_rate": 0.80,
        "seasonal_factor": 1.03
    },
    
    # Scheme 2: SMART-CITY-MISSION (large amounts, increasing)
    {
        "scheme_id": "SMART-CITY-MISSION",
        "amount": 5000000,
        "transfer_date": (datetime.now() - timedelta(days=25)).isoformat(),
        "from_entity_type": "central",
        "to_entity_type": "state",
        "from_entity_name": "Ministry of Urban Development",
        "to_entity_name": "State Nodal Agency - Gujarat",
        "status": "completed",
        "processing_days": 3,
        "fund_utilization_rate": 0.55,
        "seasonal_factor": 0.98
    },
    {
        "scheme_id": "SMART-CITY-MISSION",
        "amount": 5500000,
        "transfer_date": (datetime.now() - timedelta(days=15)).isoformat(),
        "from_entity_type": "state",
        "to_entity_type": "district",
        "from_entity_name": "State Nodal Agency - Gujarat",
        "to_entity_name": "Smart City Implementation Cell - Ahmedabad",
        "status": "completed",
        "processing_days": 4,
        "fund_utilization_rate": 0.62,
        "seasonal_factor": 1.00
    },
    {
        "scheme_id": "SMART-CITY-MISSION",
        "amount": 6000000,  # Increasing trend
        "transfer_date": datetime.now().isoformat(),
        "from_entity_type": "state",
        "to_entity_type": "district",
        "from_entity_name": "State Nodal Agency - Gujarat",
        "to_entity_name": "Smart City Implementation Cell - Ahmedabad",
        "status": "processing",
        "processing_days": 2,
        "fund_utilization_rate": 0.70,
        "seasonal_factor": 1.04
    },
    
    # Scheme 3: SWACHH-BHARAT-GRAMIN (low utilization - HIGH RISK)
    {
        "scheme_id": "SWACHH-BHARAT-GRAMIN",
        "amount": 80000,
        "transfer_date": (datetime.now() - timedelta(days=90)).isoformat(),  # Old
        "from_entity_type": "central",
        "to_entity_type": "state",
        "from_entity_name": "Ministry of Jal Shakti",
        "to_entity_name": "State Water Resources Department - UP",
        "status": "completed",
        "processing_days": 4,
        "fund_utilization_rate": 0.30,  # LOW UTILIZATION
        "seasonal_factor": 0.95
    },
    {
        "scheme_id": "SWACHH-BHARAT-GRAMIN",
        "amount": 75000,
        "transfer_date": (datetime.now() - timedelta(days=75)).isoformat(),
        "from_entity_type": "state",
        "to_entity_type": "district",
        "from_entity_name": "State Water Resources Department - UP",
        "to_entity_name": "District Rural Development Agency - Agra",
        "status": "completed",
        "processing_days": 8,
        "fund_utilization_rate": 0.25,  # LOW UTILIZATION
        "seasonal_factor": 0.96
    },
    {
        "scheme_id": "SWACHH-BHARAT-GRAMIN",
        "amount": 70000,
        "transfer_date": (datetime.now() - timedelta(days=60)).isoformat(),
        "from_entity_type": "district",
        "to_entity_type": "beneficiary",
        "from_entity_name": "District Rural Development Agency - Agra",
        "to_entity_name": "Village Committees - Agra",
        "status": "pending",  # STILL PENDING
        "processing_days": 15,
        "fund_utilization_rate": 0.20,  # VERY LOW
        "seasonal_factor": 0.94
    },
]

print("📤 Pushing sample transactions to Firebase...\n")

try:
    pushed_count = 0
    for txn in sample_transactions:
        doc_ref = db.collection("fund_flows").add(txn)
        pushed_count += 1
        doc_id = doc_ref[1].id
        print(f"✅ {txn['scheme_id']}: ₹{txn['amount']:,} → {doc_id[:8]}...")
    
    print(f"\n✅ Successfully pushed {pushed_count} transactions\n")
    
except Exception as e:
    print(f"❌ Error pushing transactions: {e}")
    sys.exit(1)

# Test predictions
print("="*70)
print("🎯 TESTING PREDICTIONS")
print("="*70 + "\n")

schemes = ["WOMEN-SHG-EMPOWERMENT", "SMART-CITY-MISSION", "SWACHH-BHARAT-GRAMIN"]

for scheme_id in schemes:
    print(f"\n📊 PREDICTIONS FOR: {scheme_id}")
    print("-" * 70)
    
    # 1. Amount prediction
    print("\n1️⃣ AMOUNT PREDICTION (30 days ahead):")
    amount_pred = ml_prediction_service.predict_future_amount(scheme_id, 30)
    
    if amount_pred:
        print(f"   Predicted Amount: ₹{amount_pred.predicted_amount:,.0f}")
        print(f"   Trend: {amount_pred.trend.upper()}")
        print(f"   Confidence: {amount_pred.confidence:.0%}")
    else:
        print(f"   ⚠️ No model trained for this scheme")
    
    # 2. Lapse risk prediction
    print(f"\n2️⃣ LAPSE RISK PREDICTION:")
    lapse_pred = ml_prediction_service.predict_lapse_risk_ml(scheme_id)
    
    if lapse_pred:
        print(f"   Risk Level: {lapse_pred['risk_level'].upper()}")
        print(f"   Lapse Probability: {lapse_pred['lapse_probability']:.0%}")
        print(f"   Recommendation: {lapse_pred['recommendation']}")
    else:
        print(f"   ⚠️ No model trained for this scheme")
    
    # 3. Comprehensive forecast
    print(f"\n3️⃣ MULTI-PERIOD FORECAST:")
    for days in [7, 15, 30]:
        forecast_pred = ml_prediction_service.predict_future_amount(scheme_id, days)
        if forecast_pred:
            print(f"   {days} days ahead: ₹{forecast_pred.predicted_amount:,.0f} (confidence: {forecast_pred.confidence:.0%})")

# Seasonal insights
print(f"\n\n🌞 SEASONAL INSIGHTS")
print("="*70)
seasonal = ml_prediction_service.get_seasonal_insights()
print(f"Current Month: {seasonal['current_month']}")
print(f"Peak Months: {', '.join(seasonal['peak_months'])}")
print(f"Seasonal Factor: {seasonal['current_factor']:.2f}x")

# Summary
print(f"\n\n✅ PREDICTION TEST COMPLETE")
print("="*70)
print(f"Models Status: {'✅ Ready' if ml_prediction_service.models.get('amount_trends') else '❌ No models'}")
print(f"Firebase Status: ✅ Connected")
print(f"Test Transactions: ✅ {pushed_count} pushed")
print("\n📋 Next Steps:")
print("   1. Check Firebase console for 'fund_flows' collection")
print("   2. Start FastAPI server: python -m uvicorn app.main:app --reload")
print("   3. Test endpoints via Swagger UI: http://localhost:8000/docs")
print("   4. Try: GET /predictions/schemes/WOMEN-SHG-EMPOWERMENT/amount?days_ahead=30\n")
