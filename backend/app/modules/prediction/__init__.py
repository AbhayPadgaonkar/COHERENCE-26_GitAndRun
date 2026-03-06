"""Prediction Module for fund lapse and spending forecasts"""
from typing import List, Optional
from app.database.schemas import FundLapsePredictionCreate, FundLapsePredictionResponse
from datetime import datetime, timedelta


class FundLapsePredictionRepository:
    """Repository for predictions"""
    
    def __init__(self):
        self.predictions = []
        self.id_counter = 1
    
    def create_prediction(self, prediction: FundLapsePredictionCreate) -> dict:
        """Store a prediction"""
        pred_dict = {
            "id": self.id_counter,
            **prediction.model_dump()
        }
        self.predictions.append(pred_dict)
        self.id_counter += 1
        return pred_dict
    
    def get_latest_prediction(self, scheme_id: int) -> Optional[dict]:
        """Get latest prediction for scheme"""
        scheme_preds = [p for p in self.predictions if p.get("scheme_id") == scheme_id]
        return max(scheme_preds, key=lambda x: x.get("prediction_date")) if scheme_preds else None


class FundLapsePredictor:
    """Predict fund lapse risks"""
    
    @staticmethod
    def predict_lapse(allocated: float, spent: float, days_elapsed: int, days_remaining: int) -> dict:
        """Predict fund lapse probability"""
        if days_elapsed == 0:
            daily_rate = 0
        else:
            daily_rate = spent / days_elapsed
        
        projected_total = spent + (daily_rate * days_remaining)
        lapse_amount = max(0, allocated - projected_total)
        lapse_probability = min(lapse_amount / allocated, 1.0) if allocated > 0 else 0
        
        return {
            "projected_total_spending": projected_total,
            "predicted_lapse_amount": lapse_amount,
            "lapse_probability": lapse_probability,
            "days_to_lapse": days_remaining,
            "daily_burn_rate": daily_rate
        }


class SpendingForecaster:
    """Forecast spending patterns"""
    
    @staticmethod
    def forecast_next_period(spending_history: List[float], periods: int = 3) -> List[float]:
        """Simple linear regression based forecast"""
        if len(spending_history) < 2:
            return [spending_history[-1] if spending_history else 0] * periods
        
        # Calculate trend
        trend = (spending_history[-1] - spending_history[0]) / (len(spending_history) - 1)
        
        # Forecast next periods
        forecast = []
        for i in range(1, periods + 1):
            predicted = spending_history[-1] + (trend * i)
            forecast.append(max(0, predicted))
        
        return forecast


class PredictionService:
    """Business logic for predictions"""
    
    def __init__(self):
        self.repository = FundLapsePredictionRepository()
        self.lapse_predictor = FundLapsePredictor()
        self.forecaster = SpendingForecaster()
    
    def predict_fund_lapse(self, scheme_id: int, allocated: float, spent: float, 
                          days_elapsed: int, days_remaining: int) -> dict:
        """Predict fund lapse for a scheme"""
        
        result = self.lapse_predictor.predict_lapse(allocated, spent, days_elapsed, days_remaining)
        
        prediction = FundLapsePredictionCreate(
            scheme_id=scheme_id,
            predicted_lapse_amount=result["predicted_lapse_amount"],
            lapse_probability=result["lapse_probability"],
            days_to_lapse=days_remaining,
            prediction_date=datetime.now()
        )
        
        return self.repository.create_prediction(prediction)
    
    def forecast_spending(self, spending_history: List[float], periods: int = 3) -> dict:
        """Forecast spending for next periods"""
        forecast = self.forecaster.forecast_next_period(spending_history, periods)
        
        return {
            "forecast": forecast,
            "forecast_periods": periods,
            "current_trend": "increasing" if forecast[0] > spending_history[-1] else "decreasing"
        }
    
    def identify_at_risk_schemes(self, lapse_probability_threshold: float = 0.3) -> List[dict]:
        """Find schemes at risk of lapse"""
        at_risk = []
        
        scheme_ids = set(p.get("scheme_id") for p in self.repository.predictions)
        
        for scheme_id in scheme_ids:
            latest_pred = self.repository.get_latest_prediction(scheme_id)
            if latest_pred and latest_pred.get("lapse_probability", 0) >= lapse_probability_threshold:
                at_risk.append({
                    "scheme_id": scheme_id,
                    "predicted_lapse_amount": latest_pred.get("predicted_lapse_amount"),
                    "lapse_probability": latest_pred.get("lapse_probability"),
                    "days_to_lapse": latest_pred.get("days_to_lapse"),
                    "risk_level": "high" if latest_pred.get("lapse_probability") > 0.6 else "medium"
                })
        
        return sorted(at_risk, key=lambda x: x.get("lapse_probability"), reverse=True)
