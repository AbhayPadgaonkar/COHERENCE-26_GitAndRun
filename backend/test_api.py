#!/usr/bin/env python3
"""
Test prediction API with valid scheme IDs
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Valid trained scheme IDs
VALID_SCHEMES = [
    "WOMEN-SHG-EMPOWERMENT",
    "SMART-CITY-MISSION",
    "SWACHH-BHARAT-GRAMIN",
    "SWACHH-BHARAT-URBAN",
    "NATIONAL-HEALTH-MISSION",
    "PM-FASAL-BIMA"
]

def test_amount_prediction():
    """Test amount prediction endpoint"""
    print("\n" + "="*75)
    print("🎯 TESTING AMOUNT PREDICTIONS")
    print("="*75)
    
    for scheme_id in VALID_SCHEMES[:3]:  # Test first 3
        url = f"{BASE_URL}/predictions/schemes/{scheme_id}/amount?days_ahead=30"
        print(f"\n📊 Testing: {scheme_id}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if response.status_code == 200:
                print(f"   ✅ Status: {response.status_code}")
                print(f"   Predicted Amount: ₹{data.get('predicted_amount', 'N/A'):,}")
                print(f"   Trend: {data.get('trend', 'N/A').upper()}")
                print(f"   Confidence: {data.get('confidence', 0):.0%}")
            else:
                print(f"   ❌ Status: {response.status_code}")
                print(f"   Error: {data.get('error', 'Unknown error')}")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")


def test_lapse_risk():
    """Test lapse risk prediction endpoint"""
    print("\n" + "="*75)
    print("🚨 TESTING LAPSE RISK PREDICTIONS")
    print("="*75)
    
    for scheme_id in VALID_SCHEMES[:3]:  # Test first 3
        url = f"{BASE_URL}/predictions/schemes/{scheme_id}/lapse-risk-ml"
        print(f"\n📊 Testing: {scheme_id}")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if response.status_code == 200:
                print(f"   ✅ Status: {response.status_code}")
                print(f"   Risk Level: {data.get('risk_level', 'N/A').upper()}")
                print(f"   Lapse Probability: {data.get('lapse_probability', 0):.0%}")
                print(f"   Recommendation: {data.get('recommendation', 'N/A')}")
            else:
                print(f"   ❌ Status: {response.status_code}")
                print(f"   Error: {data.get('error', 'Unknown error')}")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")


def test_forecast():
    """Test comprehensive forecast endpoint"""
    print("\n" + "="*75)
    print("📈 TESTING COMPREHENSIVE FORECASTS")
    print("="*75)
    
    scheme_id = "SMART-CITY-MISSION"
    url = f"{BASE_URL}/predictions/schemes/{scheme_id}/forecast"
    print(f"\n📊 Testing: {scheme_id}")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            print(f"   Forecast:")
            for period, details in data.get('forecasts', {}).items():
                if isinstance(details, dict):
                    amount = details.get('amount', 'N/A')
                    print(f"      {period}: ₹{amount:,.0f}")
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {data.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")


def test_seasonal_insights():
    """Test seasonal insights endpoint"""
    print("\n" + "="*75)
    print("🌞 TESTING SEASONAL INSIGHTS")
    print("="*75)
    
    url = f"{BASE_URL}/predictions/seasonal-insights"
    print(f"\n📊 Testing Seasonal Insights")
    print(f"   URL: {url}")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            print(f"   Current Month: {data.get('current_month', 'N/A')}")
            print(f"   Peak Months: {', '.join(data.get('peak_months', []))}")
            print(f"   Seasonal Factor: {data.get('seasonal_factor', 1.0):.2f}x")
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   Error: {data.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")


def main():
    print("\n" + "="*75)
    print("🚀 PREDICTION API TEST SUITE")
    print("="*75)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Valid Scheme IDs: {', '.join(VALID_SCHEMES[:3])} ...")
    
    test_amount_prediction()
    test_lapse_risk()
    test_forecast()
    test_seasonal_insights()
    
    print("\n" + "="*75)
    print("✅ API TEST COMPLETE")
    print("="*75)
    print("\n📝 Notes:")
    print("   - Use valid scheme IDs from the trained models")
    print("   - Check the API is running: python -m uvicorn app.main:app --reload")
    print("   - View Swagger UI: http://127.0.0.1:8000/docs")


if __name__ == "__main__":
    main()
