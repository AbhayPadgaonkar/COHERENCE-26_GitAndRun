"""
Feature Extraction for Anomaly Detection
Automatically calculates variance, velocity, frequency from raw transactions
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import statistics


class FeatureExtractor:
    """Extract features from raw transaction data"""
    
    @staticmethod
    def calculate_variance(amounts: List[float]) -> float:
        """Calculate variance (standard deviation) of amounts"""
        if len(amounts) < 2:
            return 0.0
        try:
            return statistics.variance(amounts)
        except:
            return 0.0
    
    @staticmethod
    def calculate_stdev(amounts: List[float]) -> float:
        """Calculate standard deviation of amounts"""
        if len(amounts) < 2:
            return 0.0
        try:
            return statistics.stdev(amounts)
        except:
            return 0.0
    
    @staticmethod
    def calculate_velocity(current_amount: float, previous_amount: float) -> float:
        """
        Calculate velocity (rate of change)
        Velocity = (Current - Previous) / Previous
        
        Returns:
            float: Percentage change (-1.0 = dropped 100%, 1.0 = increased 100%)
        """
        if previous_amount == 0:
            return 0.0
        return (current_amount - previous_amount) / abs(previous_amount)
    
    @staticmethod
    def calculate_frequency(dates: List[datetime]) -> float:
        """
        Calculate transaction frequency (transactions per day)
        
        Returns:
            float: Average transactions per day
        """
        if len(dates) < 2:
            return 1.0
        
        oldest = min(dates)
        newest = max(dates)
        days_span = max((newest - oldest).days, 1)
        
        return len(dates) / days_span
    
    @staticmethod
    def extract_features_from_transactions(transactions: List[Dict]) -> List[Dict]:
        """
        Extract all features from raw transactions
        
        Input transaction format:
        {
            "id": int,
            "amount": float,
            "date": datetime or ISO string,
            "scheme_id": int,
            ...other fields
        }
        
        Output format:
        {
            "id": int,
            "amount": float,
            "variance": float,        # Std dev of last 10 amounts
            "velocity": float,        # % change from previous
            "frequency": float,       # Transactions per day
            "date": datetime,
            "scheme_id": int
        }
        """
        if not transactions:
            return []
        
        # Sort by date (oldest first)
        sorted_txns = sorted(
            transactions,
            key=lambda x: x.get("date") if isinstance(x.get("date"), datetime) else datetime.fromisoformat(str(x.get("date", datetime.now())))
        )
        
        features = []
        amounts = []
        dates = []
        
        for idx, txn in enumerate(sorted_txns):
            # Parse date
            date = txn.get("date")
            if isinstance(date, str):
                try:
                    date = datetime.fromisoformat(date)
                except:
                    date = datetime.now()
            elif not isinstance(date, datetime):
                date = datetime.now()
            
            amount = float(txn.get("amount", 0))
            amounts.append(amount)
            dates.append(date)
            
            # Calculate features
            # Variance: std dev of last 10 transactions
            window_amounts = amounts[-10:] if len(amounts) > 1 else amounts
            variance = FeatureExtractor.calculate_stdev(window_amounts)
            
            # Velocity: % change from previous transaction
            velocity = 0.0
            if idx > 0:
                previous_amount = float(sorted_txns[idx-1].get("amount", 0))
                velocity = FeatureExtractor.calculate_velocity(amount, previous_amount)
            
            # Frequency: transactions per day
            frequency = FeatureExtractor.calculate_frequency(dates)
            
            features.append({
                "id": txn.get("id", idx),
                "amount": amount,
                "variance": variance,
                "velocity": velocity,
                "frequency": frequency,
                "date": date,
                "scheme_id": txn.get("scheme_id"),
                "status": txn.get("status", "completed"),
                "description": txn.get("description", "")
            })
        
        return features
    
    @staticmethod
    def extract_idle_transfers(transfers: List[Dict], days_threshold: int = 30) -> List[Dict]:
        """
        Extract idle transfers (not yet spent)
        
        Input format:
        {
            "id": str,
            "amount": float,
            "transfer_date": datetime or ISO string,
            "status": str,  # "transferred", "spent", etc.
            "to_level": str,  # "district", "state", etc.
        }
        """
        idle = []
        
        for transfer in transfers:
            transfer_date = transfer.get("transfer_date")
            if isinstance(transfer_date, str):
                try:
                    transfer_date = datetime.fromisoformat(transfer_date)
                except:
                    continue
            elif not isinstance(transfer_date, datetime):
                continue
            
            status = transfer.get("status", "").lower()
            if status != "transferred":
                continue  # Only check transferred funds
            
            days_idle = (datetime.now() - transfer_date).days
            
            if days_idle > days_threshold:
                idle.append({
                    "id": transfer.get("id"),
                    "amount": transfer.get("amount"),
                    "transfer_date": transfer_date,
                    "days_idle": days_idle,
                    "to_level": transfer.get("to_level"),
                    "status": status
                })
        
        return idle


class AnomalyWindowAnalyzer:
    """Analyze anomalies over rolling time windows"""
    
    @staticmethod
    def get_window_transactions(transactions: List[Dict], days: int = 30) -> List[Dict]:
        """Get transactions from last N days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        return [
            t for t in transactions
            if (
                isinstance(t.get("date"), datetime) 
                and t["date"] > cutoff_date
            ) or (
                isinstance(t.get("date"), str)
                and datetime.fromisoformat(t["date"]) > cutoff_date
            )
        ]
    
    @staticmethod
    def compare_windows(
        current_window: List[Dict],
        previous_window: List[Dict]
    ) -> Dict:
        """
        Compare current vs previous period
        
        Returns anomaly indicators:
        - Volume spike: current volume >> previous volume
        - Frequency spike: more transactions in same period
        - Amount spike: higher average transaction amount
        """
        current_amounts = [float(t.get("amount", 0)) for t in current_window]
        previous_amounts = [float(t.get("amount", 0)) for t in previous_window]
        
        if not current_amounts or not previous_amounts:
            return {"anomaly": False}
        
        current_total = sum(current_amounts)
        previous_total = sum(previous_amounts)
        current_avg = statistics.mean(current_amounts)
        previous_avg = statistics.mean(previous_amounts)
        
        return {
            "current_period": {
                "transaction_count": len(current_window),
                "total_amount": current_total,
                "avg_amount": current_avg
            },
            "previous_period": {
                "transaction_count": len(previous_window),
                "total_amount": previous_total,
                "avg_amount": previous_avg
            },
            "changes": {
                "volume_change_percent": (current_total - previous_total) / max(previous_total, 1) * 100,
                "frequency_change_percent": (len(current_window) - len(previous_window)) / max(len(previous_window), 1) * 100,
                "avg_amount_change_percent": (current_avg - previous_avg) / max(previous_avg, 1) * 100
            },
            "anomaly_flags": {
                "volume_spike": (current_total - previous_total) / max(previous_total, 1) > 0.5,  # >50% increase
                "frequency_spike": len(current_window) > len(previous_window) * 1.5,  # 50% more transactions
                "avg_amount_spike": (current_avg - previous_avg) / max(previous_avg, 1) > 1.0  # Doubled avg
            }
        }
