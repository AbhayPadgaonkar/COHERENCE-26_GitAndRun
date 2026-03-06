"""
Example: How to get anomalies for a specific user from database
This shows the complete flow with mock data
"""

from datetime import datetime, timedelta
from app.modules.anomaly_detection import AnomalyService
import statistics


def get_user_anomalies_example(user_id: int):
    """
    Real-world example: Get anomalies for a specific user
    
    Flow:
    1. Query database for user's transactions
    2. Format data for anomaly detection
    3. Run comprehensive detection
    4. Return results with explanations
    """
    
    # STEP 1: Mock database query (in real app, query actual DB)
    # db.query(Transaction).filter(Transaction.user_id == user_id)
    mock_transactions = [
        {"id": 1, "amount": 10000, "date": datetime.now() - timedelta(days=5), "scheme_id": user_id},
        {"id": 2, "amount": 11000, "date": datetime.now() - timedelta(days=4), "scheme_id": user_id},
        {"id": 3, "amount": 12000, "date": datetime.now() - timedelta(days=3), "scheme_id": user_id},
        {"id": 4, "amount": 500000, "date": datetime.now() - timedelta(days=2), "scheme_id": user_id},  # SPIKE!
        {"id": 5, "amount": 9000, "date": datetime.now() - timedelta(days=1), "scheme_id": user_id},
    ]
    
    mock_transfers = [
        {
            "id": "t1",
            "amount": 50000,
            "transfer_date": datetime.now() - timedelta(days=51),  # Idle for 51 days
            "status": "transferred",
            "to_level": "district"
        },
        {
            "id": "t2",
            "amount": 25000,
            "transfer_date": datetime.now() - timedelta(days=5),  # Recent
            "status": "transferred",
            "to_level": "state"
        }
    ]
    
    # STEP 2: Transform into detection format
    amounts = [t["amount"] for t in mock_transactions]
    
    spending_data = []
    for i, t in enumerate(mock_transactions):
        # Calculate variance (volatility)
        if len(amounts) > 1:
            variance = statistics.variance(amounts)
        else:
            variance = 0
        
        # Calculate velocity (rate of change)
        if i > 0:
            velocity = (t["amount"] - mock_transactions[i-1]["amount"]) / (mock_transactions[i-1]["amount"] or 1)
        else:
            velocity = 0
        
        spending_data.append({
            "id": t["id"],
            "amount": t["amount"],
            "frequency": 1,
            "variance": variance,
            "velocity": velocity
        })
    
    # STEP 3: Run comprehensive anomaly detection
    service = AnomalyService()
    result = service.detect_anomalies_comprehensive(
        scheme_id=user_id,
        spending_data=spending_data,
        transfers=mock_transfers
    )
    
    # STEP 4: Format response with explanations
    return {
        "user_id": user_id,
        "total_transactions": len(mock_transactions),
        "anomalies_found": result["total_anomalies"],
        "detectors_used": result["detectors_used"],
        "anomaly_details": [
            {
                "anomaly_id": a.get("id"),
                "type": a.get("anomaly_type"),
                "severity": a.get("severity"),
                "confidence": a.get("confidence_score"),
                "explanation": a.get("description"),
                "action_required": _get_action(a.get("anomaly_type"), a.get("severity"))
            }
            for a in result["anomalies"]
        ],
        "detector_breakdown": {
            "z_score": _format_zscore_result(result["detector_results"]["z_score"]),
            "velocity": _format_velocity_result(result["detector_results"]["velocity_spike"]),
            "isolation_forest": len(result["detector_results"]["isolation_forest"]),
            "idle_funds": len(result["detector_results"]["idle_funds"])
        }
    }


def _format_zscore_result(result):
    """Format Z-score detector result"""
    if not result:
        return {"status": "No anomaly"}
    return {
        "status": "ANOMALY DETECTED" if result.get("is_anomaly") else "Normal",
        "z_score": round(result.get("z_score", 0), 2),
        "confidence": round(result.get("confidence_score", 0), 2),
        "explanation": f"Amount deviates {result.get('z_score', 0):.2f} standard deviations from mean"
    }


def _format_velocity_result(result):
    """Format velocity detector result"""
    if not result:
        return {"status": "No spike"}
    return {
        "status": "SPIKE DETECTED" if result.get("is_anomaly") else "Normal",
        "velocity_percent": round(result.get("velocity", 0) * 100, 1),
        "confidence": round(result.get("confidence_score", 0), 2),
        "explanation": f"Spending changed {result.get('velocity', 0)*100:.1f}% between transactions"
    }


def _get_action(anomaly_type: str, severity: str) -> str:
    """Get recommended action based on anomaly"""
    actions = {
        "sudden_spike": {
            "critical": "🔴 URGENT: Approve spike immediately. Request justification from user.",
            "warning": "🟡 Review spike. Request explanation before processing."
        },
        "velocity_spike": {
            "critical": "🔴 URGENT: Block transaction. Potential fraud detected.",
            "warning": "🟡 Flag for review. Requires manager approval."
        },
        "idle_funds": {
            "critical": "🔴 URGENT: Funds idle >90 days. Take action to utilize.",
            "warning": "🟡 Monitor: Funds idle 30-60 days. Encourage spending."
        },
        "multidimensional_outlier": {
            "critical": "🔴 URGENT: Statistical anomaly. Requires investigation.",
            "warning": "🟡 Note: Transaction is unusual but not critical."
        }
    }
    
    return actions.get(anomaly_type, {}).get(severity, "ℹ️ Monitor transaction")


# To use this:
if __name__ == "__main__":
    print("=" * 70)
    print("ANOMALY DETECTION FOR USER")
    print("=" * 70)
    
    result = get_user_anomalies_example(user_id=123)
    
    print(f"\n👤 User ID: {result['user_id']}")
    print(f"📊 Total Transactions: {result['total_transactions']}")
    print(f"🚨 Anomalies Found: {result['anomalies_found']}")
    print(f"🔍 Detectors Used: {', '.join(result['detectors_used'])}")
    
    if result['anomaly_details']:
        print(f"\n{'='*70}")
        print("DETECTED ANOMALIES")
        print(f"{'='*70}")
        
        for i, anomaly in enumerate(result['anomaly_details'], 1):
            severity_icon = "🔴" if anomaly['severity'] == "critical" else "🟡"
            print(f"\n{i}. {severity_icon} {anomaly['type'].upper()}")
            print(f"   Severity: {anomaly['severity']}")
            print(f"   Confidence: {anomaly['confidence']:.2f}/1.00")
            print(f"   Details: {anomaly['explanation']}")
            print(f"   Action: {anomaly['action_required']}")
    
    print(f"\n{'='*70}")
    print("DETECTOR BREAKDOWN")
    print(f"{'='*70}")
    for detector, result_val in result['detector_breakdown'].items():
        if isinstance(result_val, dict):
            print(f"\n🔬 {detector.upper()}: {result_val['status']}")
            if 'confidence' in result_val:
                print(f"   Confidence: {result_val['confidence']:.2f}")
            if 'explanation' in result_val:
                print(f"   {result_val['explanation']}")
        else:
            print(f"🔬 {detector.upper()}: {result_val} anomalies detected")
