"""Prediction Module for fund lapse and spending forecasts"""
from typing import List, Optional, Dict
from app.database.schemas import FundLapsePredictionCreate, FundLapsePredictionResponse
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from datetime import datetime, timedelta


class FundLapsePredictionRepository:
    """Repository for predictions"""
    
    COLLECTION_NAME = "predictions"
    
    def __init__(self):
        self.firebase = FirebaseConfig.get_db()
        self.predictions = []
        self.id_counter = 1
    
    def create_prediction(self, prediction: FundLapsePredictionCreate) -> dict:
        """Store a prediction"""
        pred_dict = {
            "created_at": datetime.now().isoformat(),
            **prediction.model_dump()
        }
        
        # Try Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(pred_dict)
                pred_dict["document_id"] = doc_ref[1].id
                logger.info(f"Prediction created in Firebase: {doc_ref[1].id}")
                return pred_dict
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback")
        
        # Fallback: in-memory
        pred_dict["id"] = self.id_counter
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


# ============================================================================
# ML-BASED PREDICTION SERVICE (Trained Models)
# ============================================================================

import json
import os
from dataclasses import dataclass

@dataclass
class AmountPrediction:
    scheme_id: str
    predicted_amount: float
    days_ahead: int
    trend: str
    confidence: float

class MLPredictionService:
    """ML-based prediction service using trained models"""
    
    def __init__(self, model_file: str = "fund_prediction_models.json"):
        self.models = {}
        self.model_file = model_file
        self.load_models()
    
    def load_models(self):
        """Load trained models"""
        try:
            if os.path.exists(self.model_file):
                with open(self.model_file, 'r') as f:
                    self.models = json.load(f)
                print(f"✅ Loaded ML models from {self.model_file}")
            else:
                self.models = {'amount_trends': {}, 'lapse_patterns': {}, 'seasonal_factors': {}}
        except Exception as e:
            self.models = {'amount_trends': {}, 'lapse_patterns': {}, 'seasonal_factors': {}}
    
    def predict_future_amount(self, scheme_id: str, days_ahead: int = 30) -> Optional[AmountPrediction]:
        """Predict future disbursement amount using trained ML models"""
        if scheme_id not in self.models.get('amount_trends', {}):
            return None
        
        model = self.models['amount_trends'][scheme_id]
        
        # Linear prediction
        predicted_amount = model['intercept'] + model['slope'] * days_ahead
        
        # Apply seasonal factor
        future_month = (datetime.now() + timedelta(days=days_ahead)).month
        seasonal_data = self.models.get('seasonal_factors', {}).get(str(future_month), {'factor': 1.0})
        
        predicted_amount *= seasonal_data['factor']
        predicted_amount = max(predicted_amount, model['avg_amount'] * 0.1)
        
        confidence = 0.8 if model['trend'] != 'stable' else 0.6
        
        return AmountPrediction(
            scheme_id=scheme_id,
            predicted_amount=round(predicted_amount, 2),
            days_ahead=days_ahead,
            trend=model['trend'],
            confidence=confidence
        )
    
    def predict_lapse_risk_ml(self, scheme_id: str) -> Optional[Dict]:
        """Predict lapse risk using ML models"""
        if scheme_id not in self.models.get('lapse_patterns', {}):
            return None
        
        model = self.models['lapse_patterns'][scheme_id]
        risk_level = model['risk_level']
        avg_risk = model['avg_risk']
        
        return {
            "scheme_id": scheme_id,
            "lapse_probability": round(avg_risk, 2),
            "risk_level": risk_level,
            "recommendation": "Accelerate disbursements" if avg_risk > 0.5 else "Monitor regularly"
        }
    
    def get_seasonal_insights(self) -> Dict:
        """Get seasonal pattern insights"""
        seasonal_factors = self.models.get('seasonal_factors', {})
        current_month = datetime.now().month
        
        month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        peak_months = []
        for month_str, data in seasonal_factors.items():
            if data.get('factor', 1.0) > 1.2:
                peak_months.append(month_names[int(month_str)])
        
        return {
            "current_month": month_names[current_month],
            "peak_months": peak_months,
            "current_factor": seasonal_factors.get(str(current_month), {'factor': 1.0})['factor']
        }

# Create both services for different use cases
ml_prediction_service = MLPredictionService()  # ML-based predictions
