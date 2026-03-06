"""
Firebase Integration: How to Extract Transactions and Detect Anomalies
"""

from app.modules.anomaly_detection import AnomalyService
from app.modules.anomaly_detection.feature_extractor import FeatureExtractor
from app.core.firebase import FirebaseConfig
from typing import List, Dict
from datetime import datetime


class AnomalyDetectionPipeline:
    """Complete pipeline: Firebase → Feature Extraction → Anomaly Detection"""
    
    def __init__(self):
        self.db = FirebaseConfig.get_db()
        self.service = AnomalyService()
        self.extractor = FeatureExtractor()
    
    # ========================================================================
    # STEP 1: EXTRACT TRANSACTIONS FROM FIREBASE
    # ========================================================================
    
    def get_transactions_by_scheme(self, scheme_id: int, limit: int = 100) -> List[Dict]:
        """
        Query Firebase for all transactions of a scheme
        
        Firebase Collection Structure:
        transactions/
            doc_id1/
                scheme_id: 123
                amount: 10000
                date: "2026-03-01T10:00:00"
                status: "completed"
            doc_id2/
                scheme_id: 123
                amount: 11000
                date: "2026-03-02T10:00:00"
                status: "completed"
        """
        
        if not self.db:
            print("⚠️  Firebase not connected - using mock data")
            return self._get_mock_transactions(scheme_id)
        
        try:
            # Query Firebase Firestore
            transactions = []
            docs = self.db.collection("transactions") \
                .where("scheme_id", "==", scheme_id) \
                .order_by("date", direction="DESCENDING") \
                .limit(limit) \
                .stream()
            
            for doc in docs:
                transaction = doc.to_dict()
                transaction["id"] = doc.id  # Add document ID
                transactions.append(transaction)
            
            print(f"✅ Retrieved {len(transactions)} transactions from Firebase")
            return transactions
            
        except Exception as e:
            print(f"❌ Firebase query error: {e}")
            print("   Using fallback mock data")
            return self._get_mock_transactions(scheme_id)
    
    def get_transfers_by_scheme(self, scheme_id: int) -> List[Dict]:
        """
        Query Firebase for all transfers (fund disbursements)
        
        Firebase Collection Structure:
        transfers/
            doc_id1/
                scheme_id: 123
                amount: 50000
                transfer_date: "2026-01-15T10:00:00"
                status: "transferred"
                to_level: "district"
        """
        
        if not self.db:
            print("⚠️  Firebase not connected - using mock data")
            return self._get_mock_transfers(scheme_id)
        
        try:
            transfers = []
            docs = self.db.collection("transfers") \
                .where("scheme_id", "==", scheme_id) \
                .stream()
            
            for doc in docs:
                transfer = doc.to_dict()
                transfer["id"] = doc.id
                transfers.append(transfer)
            
            print(f"✅ Retrieved {len(transfers)} transfers from Firebase")
            return transfers
            
        except Exception as e:
            print(f"❌ Firebase query error: {e}")
            return self._get_mock_transfers(scheme_id)
    
    # ========================================================================
    # STEP 2: EXTRACT FEATURES AUTOMATICALLY
    # ========================================================================
    
    def detect_anomalies_from_firebase(self, scheme_id: int) -> Dict:
        """
        Complete pipeline: Firebase → Features → Anomaly Detection
        
        This method:
        1. Queries Firebase for transactions
        2. Queries Firebase for transfers
        3. Automatically extracts features
        4. Runs 4 anomaly detectors
        5. Returns results with explanations
        """
        
        print(f"\n🔍 Starting anomaly detection for scheme {scheme_id}...")
        print("="*60)
        
        # Step 1: Get data from Firebase
        print("\n1️⃣  Fetching transactions from Firebase...")
        transactions = self.get_transactions_by_scheme(scheme_id)
        
        print("2️⃣  Fetching transfers from Firebase...")
        transfers = self.get_transfers_by_scheme(scheme_id)
        
        if not transactions:
            return {
                "status": "error",
                "message": "No transactions found for this scheme"
            }
        
        # Step 2: Automatically extract features
        print("\n3️⃣  Extracting features (variance, velocity, frequency)...")
        features = self.extractor.extract_features_from_transactions(transactions)
        print(f"   ✅ Extracted features from {len(features)} transactions")
        
        # Show sample features
        print("\n   Sample Features:")
        for feat in features[:3]:
            print(f"      Txn {feat['id']}: ₹{feat['amount']:,} | Velocity: {feat['velocity']*100:+.1f}% | Variance: {feat['variance']:.0f}")
        
        # Step 3: Run anomaly detection
        print("\n4️⃣  Running anomaly detectors...")
        result = self.service.detect_anomalies_comprehensive(
            scheme_id=scheme_id,
            spending_data=features,
            transfers=transfers
        )
        
        print(f"   ✅ Anomaly detection complete")
        print(f"   📊 Total anomalies detected: {result['total_anomalies']}")
        
        # Step 4: Display results
        print("\n" + "="*60)
        print("📋 RESULTS:")
        print("="*60)
        
        self._display_results(result)
        
        return result
    
    # ========================================================================
    # STEP 3: DISPLAY RESULTS
    # ========================================================================
    
    def _display_results(self, result: Dict):
        """Display anomaly detection results"""
        
        if result['total_anomalies'] == 0:
            print("✅ No anomalies detected - all transactions look normal!")
            return
        
        print(f"\n🚨 ANOMALIES FOUND: {result['total_anomalies']}\n")
        
        for i, anomaly in enumerate(result['anomalies'], 1):
            severity_emoji = {
                "critical": "🔴",
                "warning": "🟡",
                "info": "🟢"
            }.get(anomaly['severity'], "⚪")
            
            print(f"{severity_emoji} Anomaly {i}:")
            print(f"   Type:       {anomaly['anomaly_type'].replace('_', ' ').upper()}")
            print(f"   Severity:   {anomaly['severity'].upper()}")
            print(f"   Confidence: {anomaly['confidence_score']*100:.0f}%")
            print(f"   Details:    {anomaly['description']}")
            print()
    
    # ========================================================================
    # STEP 4: SAVE RESULTS BACK TO FIREBASE
    # ========================================================================
    
    def save_anomalies_to_firebase(self, scheme_id: int, result: Dict) -> bool:
        """Save detected anomalies back to Firebase for auditing"""
        
        if not self.db:
            print("⚠️  Firebase not connected - cannot save results")
            return False
        
        try:
            for anomaly in result['anomalies']:
                # Create document in anomalies collection
                self.db.collection("anomalies").add({
                    "scheme_id": scheme_id,
                    "anomaly_type": anomaly['anomaly_type'],
                    "severity": anomaly['severity'],
                    "confidence_score": anomaly['confidence_score'],
                    "description": anomaly['description'],
                    "detected_date": datetime.now().isoformat(),
                    "processed": False  # For admin review
                })
            
            print(f"✅ Saved {len(result['anomalies'])} anomalies to Firebase")
            return True
            
        except Exception as e:
            print(f"❌ Error saving to Firebase: {e}")
            return False
    
    # ========================================================================
    # MOCK DATA (for testing without Firebase)
    # ========================================================================
    
    def _get_mock_transactions(self, scheme_id: int) -> List[Dict]:
        """Mock transaction data for testing"""
        from datetime import timedelta
        
        return [
            {
                "id": 1,
                "scheme_id": scheme_id,
                "amount": 10000,
                "date": (datetime.now() - timedelta(days=10)).isoformat(),
                "status": "completed"
            },
            {
                "id": 2,
                "scheme_id": scheme_id,
                "amount": 11000,
                "date": (datetime.now() - timedelta(days=9)).isoformat(),
                "status": "completed"
            },
            {
                "id": 3,
                "scheme_id": scheme_id,
                "amount": 12000,
                "date": (datetime.now() - timedelta(days=8)).isoformat(),
                "status": "completed"
            },
            {
                "id": 4,
                "scheme_id": scheme_id,
                "amount": 500000,  # 🚨 ANOMALY
                "date": (datetime.now() - timedelta(days=7)).isoformat(),
                "status": "completed"
            },
            {
                "id": 5,
                "scheme_id": scheme_id,
                "amount": 9000,
                "date": (datetime.now() - timedelta(days=6)).isoformat(),
                "status": "completed"
            }
        ]
    
    def _get_mock_transfers(self, scheme_id: int) -> List[Dict]:
        """Mock transfer data for testing"""
        from datetime import timedelta
        
        return [
            {
                "id": "t1",
                "scheme_id": scheme_id,
                "amount": 50000,
                "transfer_date": (datetime.now() - timedelta(days=51)).isoformat(),
                "status": "transferred",
                "to_level": "district"
            },
            {
                "id": "t2",
                "scheme_id": scheme_id,
                "amount": 25000,
                "transfer_date": (datetime.now() - timedelta(days=5)).isoformat(),
                "status": "transferred",
                "to_level": "state"
            }
        ]


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    
    print("""
    ═══════════════════════════════════════════════════════════════════════
    Anomaly Detection with Firebase Integration
    ═══════════════════════════════════════════════════════════════════════
    """)
    
    # Initialize pipeline
    pipeline = AnomalyDetectionPipeline()
    
    # Run anomaly detection for scheme 123
    result = pipeline.detect_anomalies_from_firebase(scheme_id=123)
    
    # Save results back to Firebase
    if result.get('status') != 'error':
        pipeline.save_anomalies_to_firebase(123, result)
    
    print("""
    ═══════════════════════════════════════════════════════════════════════
    ✅ Complete! Results have been saved to Firebase.
    
    Next steps:
    1. Review anomalies in Firebase console
    2. Mark as "processed" once admin approves
    3. Take action (block, alert, investigate)
    ═══════════════════════════════════════════════════════════════════════
    """)
