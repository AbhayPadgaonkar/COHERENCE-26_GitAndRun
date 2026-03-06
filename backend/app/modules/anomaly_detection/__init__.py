"""Anomaly Detection Module"""
from typing import List, Optional
from app.database.schemas import AnomalyCreate, AnomalyResponse
from datetime import datetime
import statistics


class AnomalyRepository:
    """Repository for anomaly records"""
    
    def __init__(self):
        self.anomalies = []
        self.id_counter = 1
    
    def create_anomaly(self, anomaly: AnomalyCreate) -> dict:
        """Record an anomaly"""
        anomaly_dict = {
            "id": self.id_counter,
            **anomaly.model_dump()
        }
        self.anomalies.append(anomaly_dict)
        self.id_counter += 1
        return anomaly_dict
    
    def get_anomalies_by_scheme(self, scheme_id: int) -> List[dict]:
        """Get anomalies for a scheme"""
        return [a for a in self.anomalies if a.get("scheme_id") == scheme_id]


class StatisticalDetector:
    """Statistical anomaly detection"""
    
    @staticmethod
    def detect_spending_anomalies(spending_history: List[float], current_spending: float) -> dict:
        """Detect anomalies in spending patterns"""
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
            "current": current_spending
        }
    
    @staticmethod
    def detect_idle_funds(transfers: List[dict], days_threshold: int = 45) -> List[dict]:
        """Detect idle funds not being spent"""
        idle_transfers = []
        
        for transfer in transfers:
            days_since_transfer = (datetime.now() - transfer.get("transfer_date")).days
            if days_since_transfer > days_threshold and transfer.get("status") == "transferred":
                idle_transfers.append({
                    "transfer_id": transfer.get("id"),
                    "amount": transfer.get("amount"),
                    "days_idle": days_since_transfer,
                    "to_level": transfer.get("to_level")
                })
        
        return idle_transfers


class AnomalyService:
    """Business logic for anomaly detection"""
    
    def __init__(self):
        self.repository = AnomalyRepository()
        self.detector = StatisticalDetector()
    
    def record_anomaly(self, anomaly: AnomalyCreate) -> dict:
        """Record detected anomaly"""
        return self.repository.create_anomaly(anomaly)
    
    def detect_anomalies(self, scheme_id: int, spending_data: List[dict]) -> List[dict]:
        """Run anomaly detection on scheme spending"""
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
    
    def get_scheme_anomalies(self, scheme_id: int, severity: Optional[str] = None) -> List[dict]:
        """Get anomalies for a scheme"""
        anomalies = self.repository.get_anomalies_by_scheme(scheme_id)
        if severity:
            anomalies = [a for a in anomalies if a.get("severity") == severity]
        return anomalies
