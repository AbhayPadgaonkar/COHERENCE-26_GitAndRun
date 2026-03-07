#!/usr/bin/env python3
"""
Fetch fund flow data from Firebase and predict amounts & fund lapse
"""

import sys
from datetime import datetime, timedelta
from collections import defaultdict

# Add backend to path
sys.path.insert(0, '/backend')

from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.modules.prediction import MLPredictionService

def fetch_fund_flows():
    """Fetch all fund flow documents from Firebase"""
    try:
        db = FirebaseConfig.get_db()
        if not db:
            print("❌ Firebase not initialized")
            return {}
        
        docs = db.collection('fund_flows').stream()
        
        scheme_data = defaultdict(lambda: {
            'transactions': [],
            'total_amount': 0,
            'transaction_count': 0,
            'statuses': defaultdict(int),
            'last_transaction': None,
            'utilization_rate': 0
        })
        
        for doc in docs:
            data = doc.to_dict()
            scheme_id = data.get('scheme_id', 'UNKNOWN')
            
            scheme_data[scheme_id]['transactions'].append(data)
            scheme_data[scheme_id]['total_amount'] += data.get('amount_disbursed', 0)
            scheme_data[scheme_id]['transaction_count'] += 1
            
            status = data.get('status', 'unknown')
            scheme_data[scheme_id]['statuses'][status] += 1
            
            # Track last transaction
            if not scheme_data[scheme_id]['last_transaction']:
                scheme_data[scheme_id]['last_transaction'] = data.get('transaction_date')
            
            # Calculate utilization if allocated exists
            allocated = data.get('allocated_amount', 0)
            if allocated > 0:
                scheme_data[scheme_id]['utilization_rate'] = (scheme_data[scheme_id]['total_amount'] / allocated) * 100
        
        return dict(scheme_data)
    
    except Exception as e:
        logger.error(f"Error fetching fund flows: {e}")
        print(f"❌ Error fetching data: {e}")
        return {}


def predict_for_scheme(scheme_id, scheme_data, ml_service):
    """Predict amount and lapse for a scheme"""
    
    scheme_id_str = str(scheme_id)  # Convert to string for ML model
    
    print(f"\n{'='*75}")
    print(f"📊 SCHEME: {scheme_id_str}")
    print(f"{'='*75}")
    
    # Display current stats
    stats = scheme_data
    print(f"\n📈 Current Statistics:")
    print(f"   Total Transactions: {stats['transaction_count']}")
    print(f"   Total Disbursed: ₹{stats['total_amount']:,.0f}")
    print(f"   Utilization Rate: {stats['utilization_rate']:.1f}%")
    print(f"   Status Breakdown: {dict(stats['statuses'])}")
    
    if stats['last_transaction']:
        print(f"   Last Transaction: {stats['last_transaction']}")
    
    # Get predictions
    print(f"\n🔮 PREDICTIONS (30 days ahead):")
    
    # 1. Amount prediction
    amount_pred = ml_service.predict_future_amount(scheme_id_str, days_ahead=30)
    if amount_pred:
        print(f"\n   1️⃣ AMOUNT PREDICTION:")
        print(f"      Predicted Disbursement: ₹{amount_pred.predicted_amount:,.0f}")
        print(f"      Trend: {amount_pred.trend.upper()}")
        print(f"      Confidence: {amount_pred.confidence:.0%}")
    else:
        print(f"\n   1️⃣ AMOUNT PREDICTION: ⚠️ No model trained for this scheme")
    
    # 2. Lapse risk prediction
    lapse_pred = ml_service.predict_lapse_risk_ml(scheme_id_str)
    if lapse_pred:
        print(f"\n   2️⃣ LAPSE RISK PREDICTION:")
        print(f"      Risk Level: {lapse_pred['risk_level'].upper()}")
        print(f"      Lapse Probability: {lapse_pred['lapse_probability']:.0%}")
        print(f"      Recommendation: {lapse_pred['recommendation']}")
    else:
        print(f"\n   2️⃣ LAPSE RISK PREDICTION: ⚠️ No model available")
    
    # 3. Multi-period forecast
    print(f"\n   3️⃣ AMOUNT FORECAST (Multiple Periods):")
    for days in [7, 15, 30]:
        forecast_pred = ml_service.predict_future_amount(scheme_id_str, days)
        if forecast_pred:
            print(f"      {days:2d} days: ₹{forecast_pred.predicted_amount:>12,.0f} (confidence: {forecast_pred.confidence:.0%})")


def main():
    """Main execution"""
    
    print("\n" + "="*75)
    print("🚀 FUND FLOW DATA FETCHING & PREDICTION")
    print("="*75)
    
    # Initialize Firebase and ML service
    print("\n🔥 Initializing Firebase...")
    firebase = FirebaseConfig.get_db()
    if not firebase:
        print("❌ Failed to initialize Firebase")
        return
    print("✅ Firebase connected")
    
    print("🤖 Loading ML models...")
    ml_service = MLPredictionService()
    print("✅ ML models loaded")
    
    # Fetch data
    print("\n📥 Fetching fund flow data from Firebase...")
    scheme_data = fetch_fund_flows()
    
    if not scheme_data:
        print("❌ No fund flow data found in Firebase")
        return
    
    print(f"✅ Retrieved data for {len(scheme_data)} schemes")
    scheme_list = ', '.join(str(s) for s in list(scheme_data.keys())[:5])
    print(f"   Schemes: {scheme_list}" + 
          f"{'...' if len(scheme_data) > 5 else ''}")
    
    # Make predictions for each scheme
    print("\n" + "="*75)
    print("🎯 GENERATING PREDICTIONS")
    print("="*75)
    
    for scheme_id, data in scheme_data.items():
        predict_for_scheme(scheme_id, data, ml_service)
    
    # Summary
    print(f"\n\n{'='*75}")
    print("✅ PREDICTION COMPLETE")
    print(f"{'='*75}")
    print(f"Total Schemes Analyzed: {len(scheme_data)}")
    print(f"Total Transactions: {sum(d['transaction_count'] for d in scheme_data.values())}")
    print(f"Total Disbursed: ₹{sum(d['total_amount'] for d in scheme_data.values()):,.0f}")
    print("\n📊 Next Steps:")
    print("   1. Review predictions for each scheme")
    print("   2. Focus on HIGH RISK schemes for immediate action")
    print("   3. Validate predictions with actual outcomes")
    print("   4. Use API endpoints for real-time predictions")


if __name__ == "__main__":
    main()
