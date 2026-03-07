"""Anomaly Detection Module"""
from typing import List, Optional, Dict, Tuple
from app.database.schemas import AnomalyCreate, AnomalyResponse
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from datetime import datetime
import statistics
import math
import random


class AnomalyRepository:
    """Repository for anomaly records"""
    
    COLLECTION_NAME = "anomalies"
    
    def __init__(self):
        self.firebase = FirebaseConfig.get_db()
        self.anomalies = []
        self.id_counter = 1
    
    def create_anomaly(self, anomaly: AnomalyCreate) -> dict:
        """Record an anomaly"""
        anomaly_dict = {
            "created_at": datetime.now().isoformat(),
            **anomaly.model_dump()
        }
        
        # Try Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(anomaly_dict)
                anomaly_dict["document_id"] = doc_ref[1].id
                logger.info(f"Anomaly created in Firebase: {doc_ref[1].id}")
                return anomaly_dict
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback")
        
        # Fallback: in-memory
        anomaly_dict["id"] = self.id_counter
        self.anomalies.append(anomaly_dict)
        self.id_counter += 1
        return anomaly_dict
    
    def get_anomalies_by_scheme(self, scheme_id: int) -> List[dict]:
        """Get anomalies for a scheme"""
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where("scheme_id", "==", scheme_id).stream()
                anomalies = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    anomalies.append(data)
                if anomalies:
                    return anomalies
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory
        return [a for a in self.anomalies if a.get("scheme_id") == scheme_id]


class StatisticalDetector:
    """Statistical anomaly detection"""
    
    @staticmethod
    def detect_spending_anomalies(spending_history: List[float], current_spending: float) -> dict:
        """Detect anomalies in spending patterns using Z-score"""
        if len(spending_history) < 2:
            return {"is_anomaly": False, "score": 0}
        
        mean = statistics.mean(spending_history)
        stdev = statistics.stdev(spending_history)
        
        if stdev == 0:
            z_score = 0
        else:
            z_score = abs((current_spending - mean) / stdev)
        
        is_anomaly = z_score > 2.5  # 2.5 standard deviations
        
        return {
            "is_anomaly": is_anomaly,
            "z_score": z_score,
            "confidence_score": min(z_score / 5.0, 1.0),  # Normalize to 0-1
            "mean": mean,
            "stdev": stdev,
            "current": current_spending,
            "detector_type": "z_score"
        }
    
    @staticmethod
    def detect_velocity_spikes(spending_history: List[float]) -> dict:
        """Detect sudden changes in spending velocity (rate of change)"""
        if len(spending_history) < 2:
            return {"is_anomaly": False, "velocity": 0}
        
        current = spending_history[-1]
        previous = spending_history[-2]
        
        # Calculate percentage change
        velocity = (current - previous) / (abs(previous) + 1) if previous != 0 else 0
        
        # Anomaly if >100% change or <-50% drop
        is_anomaly = abs(velocity) > 1.0 or velocity < -0.5
        
        confidence = min(abs(velocity) / 3.0, 1.0)
        
        return {
            "is_anomaly": is_anomaly,
            "velocity": velocity,
            "confidence_score": confidence,
            "current": current,
            "previous": previous,
            "detector_type": "velocity_spike"
        }
    
    @staticmethod
    def detect_idle_funds(transfers: List[dict], days_threshold: int = 30) -> List[dict]:
        """Detect idle funds not being spent (enhanced with severity levels)"""
        idle_transfers = []
        
        for transfer in transfers:
            transfer_date = transfer.get("transfer_date")
            if isinstance(transfer_date, str):
                try:
                    transfer_date = datetime.fromisoformat(transfer_date)
                except:
                    continue
            
            if transfer_date is None:
                continue
                
            days_since_transfer = (datetime.now() - transfer_date).days
            
            if days_since_transfer > days_threshold and transfer.get("status") == "transferred":
                # Determine severity based on days idle
                if days_since_transfer > 90:
                    severity = "critical"
                elif days_since_transfer > 60:
                    severity = "high"
                else:
                    severity = "warning"
                
                idle_transfers.append({
                    "transfer_id": transfer.get("id"),
                    "amount": transfer.get("amount"),
                    "days_idle": days_since_transfer,
                    "to_level": transfer.get("to_level"),
                    "severity": severity,
                    "detector_type": "idle_funds"
                })
        
        return idle_transfers


class SimpleIsolationForest:
    """Pure Python implementation of simplified Isolation Forest"""
    
    def __init__(self, contamination=0.1, n_trees=50):
        self.contamination = contamination
        self.n_trees = n_trees
        self.trees = []
        self.threshold = 0.5
    
    def _build_tree(self, data: List[List[float]], depth=0, max_depth=8):
        """Build isolation tree"""
        if depth >= max_depth or len(data) <= 1:
            return {"type": "leaf", "size": len(data), "depth": depth}
        
        # Select random feature
        n_features = len(data[0]) if data else 0
        if n_features == 0:
            return {"type": "leaf", "size": len(data), "depth": depth}
        
        feature_idx = random.randint(0, n_features - 1)
        feature_values = [row[feature_idx] for row in data if len(row) > feature_idx]
        
        if not feature_values:
            return {"type": "leaf", "size": len(data), "depth": depth}
        
        min_val, max_val = min(feature_values), max(feature_values)
        if min_val == max_val:
            return {"type": "leaf", "size": len(data), "depth": depth}
        
        # Random split
        split_point = random.uniform(min_val, max_val)
        
        left_data = [row for row in data if len(row) > feature_idx and row[feature_idx] < split_point]
        right_data = [row for row in data if len(row) > feature_idx and row[feature_idx] >= split_point]
        
        return {
            "type": "node",
            "feature": feature_idx,
            "split": split_point,
            "left": self._build_tree(left_data, depth + 1, max_depth),
            "right": self._build_tree(right_data, depth + 1, max_depth)
        }
    
    def _path_length(self, point: List[float], tree: dict) -> float:
        """Calculate path length for a point"""
        if tree["type"] == "leaf":
            # Add average BST depth for leaf size
            if tree["size"] <= 1:
                return tree["depth"]
            return tree["depth"] + math.log(tree["size"])
        
        feature_idx = tree["feature"]
        if len(point) <= feature_idx:
            return tree.get("depth", 0)
        
        if point[feature_idx] < tree["split"]:
            return self._path_length(point, tree["left"])
        else:
            return self._path_length(point, tree["right"])
    
    def fit_predict(self, data: List[List[float]]) -> List[int]:
        """Fit model and predict anomalies"""
        if len(data) < 3:
            return [1] * len(data)  # No anomalies
        
        # Build trees
        self.trees = []
        for _ in range(self.n_trees):
            # Sample subset
            sample_size = min(256, len(data))
            sample_data = random.sample(data, sample_size)
            tree = self._build_tree(sample_data)
            self.trees.append(tree)
        
        # Calculate anomaly scores
        scores = []
        for point in data:
            avg_path = sum(self._path_length(point, tree) for tree in self.trees) / len(self.trees)
            # Normalize score (lower path = more anomalous)
            score = 2 ** (-avg_path / 6.0)  # Magic number for reasonable scaling
            scores.append(score)
        
        # Determine threshold
        sorted_scores = sorted(scores, reverse=True)
        threshold_idx = int(len(scores) * self.contamination)
        threshold = sorted_scores[min(threshold_idx, len(sorted_scores) - 1)]
        
        # Predict: 1 = normal, -1 = anomaly
        predictions = [-1 if score > threshold else 1 for score in scores]
        return predictions


class AnomalyService:
    """Business logic for anomaly detection"""
    
    def __init__(self):
        self.repository = AnomalyRepository()
        self.detector = StatisticalDetector()
        self.iso_forest = SimpleIsolationForest(contamination=0.1)
    
    def record_anomaly(self, anomaly: AnomalyCreate) -> dict:
        """Record detected anomaly"""
        return self.repository.create_anomaly(anomaly)
    
    def detect_anomalies(self, scheme_id: int, spending_data: List[dict]) -> List[dict]:
        """Run anomaly detection on scheme spending (keeps original behavior)"""
        detected_anomalies = []
        
        if not spending_data:
            return detected_anomalies
        
        # Get spending amounts
        amounts = [d.get("amount", 0) for d in spending_data]
        current = amounts[-1] if amounts else 0
        history = amounts[:-1] if len(amounts) > 1 else amounts
        
        # Statistical anomaly detection
        if history:
            result = self.detector.detect_spending_anomalies(history, current)
            if result.get("is_anomaly"):
                anomaly = AnomalyCreate(
                    scheme_id=scheme_id,
                    anomaly_type="sudden_spike" if current > result.get("mean") else "unusual_drop",
                    severity="critical" if result.get("confidence_score") > 0.9 else "warning",
                    confidence_score=result.get("confidence_score"),
                    description=f"Spending amount {current} deviates significantly from average {result.get('mean')}",
                    detected_date=datetime.now()
                )
                detected_anomalies.append(self.record_anomaly(anomaly))
        
        return detected_anomalies
    
    def detect_anomalies_comprehensive(self, scheme_id: int, spending_data: List[dict], transfers: List[dict] = None) -> dict:
        """
        Run all 4 anomaly detectors for comprehensive detection
        
        Returns:
            {
                "scheme_id": int,
                "total_anomalies": int,
                "anomalies": List[dict],
                "detector_results": {
                    "z_score": [...],
                    "velocity_spike": [...],
                    "isolation_forest": [...],
                    "idle_funds": [...]
                }
            }
        """
        anomalies = []
        detector_results = {
            "z_score": [],
            "velocity_spike": [],
            "isolation_forest": [],
            "idle_funds": []
        }
        
        if not spending_data:
            return {
                "scheme_id": scheme_id,
                "total_anomalies": 0,
                "anomalies": [],
                "detector_results": detector_results
            }
        
        amounts = [d.get("amount", 0) for d in spending_data]
        
        # 1️⃣ Z-SCORE DETECTION
        if len(amounts) >= 2:
            current = amounts[-1]
            history = amounts[:-1]
            zscore_result = self.detector.detect_spending_anomalies(history, current)
            detector_results["z_score"] = zscore_result
            
            if zscore_result.get("is_anomaly"):
                anomaly = AnomalyCreate(
                    scheme_id=scheme_id,
                    anomaly_type="sudden_spike" if current > zscore_result.get("mean") else "unusual_drop",
                    severity="critical" if zscore_result.get("confidence_score") > 0.9 else "warning",
                    confidence_score=zscore_result.get("confidence_score"),
                    description=f"[Z-Score] Amount {current:.2f} deviates {zscore_result.get('z_score'):.2f}σ from average {zscore_result.get('mean'):.2f}",
                    detected_date=datetime.now()
                )
                recorded = self.record_anomaly(anomaly)
                anomalies.append(recorded)
        
        # 2️⃣ VELOCITY SPIKE DETECTION
        if len(amounts) >= 2:
            velocity_result = self.detector.detect_velocity_spikes(amounts)
            detector_results["velocity_spike"] = velocity_result
            
            if velocity_result.get("is_anomaly"):
                severity = "critical" if abs(velocity_result.get("velocity", 0)) > 2.0 else "warning"
                anomaly = AnomalyCreate(
                    scheme_id=scheme_id,
                    anomaly_type="velocity_spike",
                    severity=severity,
                    confidence_score=velocity_result.get("confidence_score"),
                    description=f"[Velocity Spike] Spending changed by {velocity_result.get('velocity')*100:.1f}% from {velocity_result.get('previous'):.2f} to {velocity_result.get('current'):.2f}",
                    detected_date=datetime.now()
                )
                recorded = self.record_anomaly(anomaly)
                anomalies.append(recorded)
        
        # 3️⃣ ISOLATION FOREST DETECTION
        if len(spending_data) >= 3:
            try:
                # Prepare features
                features = []
                for d in spending_data:
                    amount = float(d.get("amount", 0))
                    frequency = float(d.get("frequency", 1))
                    variance = float(d.get("variance", statistics.variance(amounts) if len(amounts) > 1 else 0))
                    velocity = float(d.get("velocity", 0))
                    features.append([amount, frequency, variance, velocity])
                
                # Detect anomalies
                predictions = self.iso_forest.fit_predict(features)
                
                iso_results = []
                for i, pred in enumerate(predictions):
                    if pred == -1:  # Anomaly
                        iso_results.append({
                            "index": i,
                            "transaction_id": spending_data[i].get("id"),
                            "is_anomaly": True,
                            "confidence_score": 0.75,
                            "amount": spending_data[i].get("amount"),
                            "detector_type": "isolation_forest"
                        })
                
                detector_results["isolation_forest"] = iso_results
                
                for iso_anomaly in iso_results:
                    anomaly = AnomalyCreate(
                        scheme_id=scheme_id,
                        anomaly_type="multidimensional_outlier",
                        severity="warning",
                        confidence_score=iso_anomaly.get("confidence_score", 0.75),
                        description=f"[Isolation Forest] Transaction {iso_anomaly.get('index')} is a statistical outlier (amount: {iso_anomaly.get('amount'):.2f})",
                        detected_date=datetime.now()
                    )
                    recorded = self.record_anomaly(anomaly)
                    anomalies.append(recorded)
            except Exception as e:
                logger.warning(f"Isolation Forest detection error: {e}")
        
        # 4️⃣ IDLE FUNDS DETECTION
        if transfers:
            idle_results = self.detector.detect_idle_funds(transfers, days_threshold=30)
            detector_results["idle_funds"] = idle_results
            
            for idle in idle_results:
                anomaly = AnomalyCreate(
                    scheme_id=scheme_id,
                    anomaly_type="idle_funds",
                    severity=idle.get("severity", "warning"),
                    confidence_score=0.85 if idle.get("severity") == "critical" else 0.6,
                    description=f"[Idle Funds] Transfer {idle.get('transfer_id')} (₹{idle.get('amount'):.2f}) idle for {idle.get('days_idle')} days to {idle.get('to_level')}",
                    detected_date=datetime.now()
                )
                recorded = self.record_anomaly(anomaly)
                anomalies.append(recorded)
        
        return {
            "scheme_id": scheme_id,
            "total_anomalies": len(anomalies),
            "anomalies": anomalies,
            "detector_results": detector_results,
            "detectors_used": ["z_score", "velocity_spike", "isolation_forest", "idle_funds"]
        }
    
    def get_scheme_anomalies(self, scheme_id: int, severity: Optional[str] = None) -> List[dict]:
        """Get anomalies for a scheme"""
        anomalies = self.repository.get_anomalies_by_scheme(scheme_id)
        if severity:
            anomalies = [a for a in anomalies if a.get("severity") == severity]
        return anomalies
