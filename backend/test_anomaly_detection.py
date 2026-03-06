#!/usr/bin/env python3
"""
Test Comprehensive Anomaly Detection System
Tests all 4 detectors: Z-Score, Velocity Spike, Isolation Forest, Idle Funds
"""

import requests
import json
from datetime import datetime, timedelta

# API endpoint
BASE_URL = "http://localhost:8000"

def test_comprehensive_anomaly_detection():
    """Test the comprehensive anomaly detection API"""
    
    # Test data with clear anomalies
    test_data = {
        "spending_data": [
            {"id": 1, "amount": 10000, "frequency": 1, "variance": 1000, "velocity": 0},
            {"id": 2, "amount": 12000, "frequency": 1, "variance": 1200, "velocity": 0.2},
            {"id": 3, "amount": 11000, "frequency": 1, "variance": 1100, "velocity": -0.08},
            {"id": 4, "amount": 500000, "frequency": 1, "variance": 50000, "velocity": 44.5},  # 🚨 ANOMALY: Huge spike
            {"id": 5, "amount": 9000, "frequency": 1, "variance": 900, "velocity": -48.2}      # 🚨 ANOMALY: Massive drop
        ],
        "transfers": [
            {
                "id": "t1", 
                "amount": 50000, 
                "transfer_date": (datetime.now() - timedelta(days=45)).isoformat(),  # 🚨 ANOMALY: 45 days idle
                "status": "transferred", 
                "to_level": "district"
            },
            {
                "id": "t2", 
                "amount": 25000, 
                "transfer_date": (datetime.now() - timedelta(days=10)).isoformat(),  # Normal: recent
                "status": "transferred", 
                "to_level": "state"
            }
        ]
    }
    
    # Call comprehensive detection API
    try:
        print("🔍 Testing Comprehensive Anomaly Detection...")
        response = requests.post(
            f"{BASE_URL}/api/anomalies/detect/comprehensive/123", 
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ API Call Successful!")
            print(f"📊 Results Summary:")
            print(f"   Scheme ID: {result['scheme_id']}")
            print(f"   Total Anomalies: {result['total_anomalies']}")
            print(f"   Detectors Used: {result['detectors_used']}")
            print()
            
            # Display each anomaly
            if result['anomalies']:
                print("🚨 Detected Anomalies:")
                for i, anomaly in enumerate(result['anomalies'], 1):
                    severity_icon = "🔴" if anomaly['severity'] == "critical" else "🟡"
                    print(f"   {severity_icon} Anomaly {i}:")
                    print(f"      Type: {anomaly['anomaly_type']}")
                    print(f"      Severity: {anomaly['severity']}")
                    print(f"      Confidence: {anomaly['confidence_score']:.2f}")
                    print(f"      Description: {anomaly['description']}")
                    print()
                
                # Show detector breakdown
                if 'detector_results' in result:
                    print("🔬 Detector Performance:")
                    detectors = result['detector_results']
                    
                    if detectors.get('z_score', {}).get('is_anomaly'):
                        print(f"   ✅ Z-Score: Detected deviation (z={detectors['z_score']['z_score']:.2f})")
                    else:
                        print(f"   ❌ Z-Score: No anomaly detected")
                    
                    if detectors.get('velocity_spike', {}).get('is_anomaly'):
                        print(f"   ✅ Velocity: Detected spike ({detectors['velocity_spike']['velocity']*100:.1f}% change)")
                    else:
                        print(f"   ❌ Velocity: No spike detected")
                    
                    isolation_count = len(detectors.get('isolation_forest', []))
                    if isolation_count > 0:
                        print(f"   ✅ Isolation Forest: {isolation_count} outliers detected")
                    else:
                        print(f"   ❌ Isolation Forest: No outliers detected")
                    
                    idle_count = len(detectors.get('idle_funds', []))
                    if idle_count > 0:
                        print(f"   ✅ Idle Funds: {idle_count} idle transfers detected")
                    else:
                        print(f"   ❌ Idle Funds: No idle transfers detected")
            else:
                print("✅ No anomalies detected")
            
            return True
            
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Is the server running on localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_individual_detectors():
    """Test individual detector functionality"""
    print("\n🧪 Testing Individual Detectors...")
    
    from app.modules.anomaly_detection import StatisticalDetector, SimpleIsolationForest
    
    # Test Z-Score detector
    print("   Testing Z-Score detector...")
    spending_history = [10000, 11000, 12000, 9000, 10500]
    current_spending = 500000  # Obvious anomaly
    
    detector = StatisticalDetector()
    result = detector.detect_spending_anomalies(spending_history, current_spending)
    
    if result['is_anomaly']:
        print(f"   ✅ Z-Score: Detected anomaly (z={result['z_score']:.2f})")
    else:
        print(f"   ❌ Z-Score: Failed to detect obvious anomaly")
    
    # Test Isolation Forest
    print("   Testing Isolation Forest...")
    features = [
        [10000, 1, 1000, 0],      # Normal
        [11000, 1, 1100, 0.1],    # Normal  
        [500000, 1, 50000, 44.5], # Anomaly
        [12000, 1, 1200, 0.09]    # Normal
    ]
    
    iso_forest = SimpleIsolationForest(contamination=0.25)  # Expect 25% anomalies
    predictions = iso_forest.fit_predict(features)
    
    anomaly_count = sum(1 for p in predictions if p == -1)
    if anomaly_count > 0:
        print(f"   ✅ Isolation Forest: Detected {anomaly_count} anomalies")
    else:
        print(f"   ❌ Isolation Forest: No anomalies detected")
    

if __name__ == "__main__":
    print("🚀 Anomaly Detection System Test")
    print("="*50)
    
    # Test comprehensive system
    success = test_comprehensive_anomaly_detection()
    
    # Test individual detectors
    test_individual_detectors()
    
    print("\n" + "="*50)
    if success:
        print("🎉 All tests completed successfully!")
        print("💡 Your hackathon anomaly detection system is ready!")
    else:
        print("⚠️  Some tests failed. Check the server status.")