"""Prediction API Routes - Enhanced with ML Models"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import FundLapsePredictionResponse
from app.modules.prediction import PredictionService, ml_prediction_service
from typing import List
from datetime import datetime

router = APIRouter(prefix="/predictions", responses={404: {"description": "Not found"}})

# Initialize services
prediction_service = PredictionService()

# ============================================================================
# ML-BASED PREDICTION ENDPOINTS
# ============================================================================

@router.get("/schemes/{scheme_id}/amount")
async def predict_disbursement_amount(
    scheme_id: str, 
    days_ahead: int = Query(30, description="Days ahead to predict")
):
    """🎯 Predict future disbursement amount using ML models"""
    try:
        ml_prediction = ml_prediction_service.predict_future_amount(scheme_id, days_ahead)
        
        if ml_prediction:
            return {
                "scheme_id": scheme_id,
                "days_ahead": days_ahead,
                "predicted_amount": ml_prediction.predicted_amount,
                "trend": ml_prediction.trend,
                "confidence": ml_prediction.confidence,
                "method": "ml_trained_model",
                "generated_at": datetime.now().isoformat()
            }
        else:
            return {
                "scheme_id": scheme_id,
                "error": "No trained model found",
                "message": "Train models using train_prediction_model.py first"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/schemes/{scheme_id}/lapse-risk-ml")
async def predict_fund_lapse_risk_ml(scheme_id: str):
    """🚨 Predict fund lapse risk using ML models"""
    try:
        ml_risk = ml_prediction_service.predict_lapse_risk_ml(scheme_id)
        
        if ml_risk:
            return {
                **ml_risk,
                "method": "ml_trained_model",
                "generated_at": datetime.now().isoformat()
            }
        else:
            return {
                "scheme_id": scheme_id,
                "error": "No trained model found",
                "message": "Train models using train_prediction_model.py first"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction error: {str(e)}")

@router.get("/schemes/{scheme_id}/forecast")
async def get_comprehensive_forecast(scheme_id: str):
    """📊 Get comprehensive 7/15/30/60 day forecast"""
    try:
        forecasts = {}
        forecast_days = [7, 15, 30, 60]
        
        for days in forecast_days:
            prediction = ml_prediction_service.predict_future_amount(scheme_id, days)
            if prediction:
                forecasts[f"day_{days}"] = {
                    "amount": prediction.predicted_amount,
                    "trend": prediction.trend,
                    "confidence": prediction.confidence
                }
        
        lapse_risk = ml_prediction_service.predict_lapse_risk_ml(scheme_id)
        
        return {
            "scheme_id": scheme_id,
            "forecasts": forecasts,
            "lapse_risk": lapse_risk,
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@router.get("/seasonal-insights")
async def get_seasonal_insights():
    """🌞 Get seasonal disbursement pattern insights"""
    try:
        insights = ml_prediction_service.get_seasonal_insights()
        return {
            **insights,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seasonal analysis error: {str(e)}")

# ============================================================================
# LEGACY/SIMPLE PREDICTION ENDPOINTS
# ============================================================================

@router.post("/fund-lapse", response_model=FundLapsePredictionResponse, status_code=201)
async def predict_fund_lapse(scheme_id: int, allocated: float, spent: float, 
                             days_elapsed: int, days_remaining: int):
    """Predict fund lapse probability using simple mathematical model"""
    prediction = prediction_service.predict_fund_lapse(
        scheme_id, allocated, spent, days_elapsed, days_remaining
    )
    return prediction

@router.post("/spending-forecast")
async def forecast_spending(spending_history: List[float], periods: int = 3):
    """Forecast spending for next periods"""
    forecast = prediction_service.forecast_spending(spending_history, periods)
    return forecast

@router.get("/at-risk-schemes")
async def get_at_risk_schemes(threshold: float = 0.3):
    """Get schemes at risk of fund lapse"""
    at_risk = prediction_service.identify_at_risk_schemes(threshold)
    return {
        "lapse_probability_threshold": threshold,
        "at_risk_count": len(at_risk),
        "schemes": at_risk
    }

@router.get("/scheme/{scheme_id}/lapse-risk")
async def get_scheme_lapse_risk(scheme_id: int):
    """Get latest lapse prediction for a scheme"""
    return {
        "scheme_id": scheme_id,
        "message": "Use /schemes/{scheme_id}/lapse-risk-ml for ML predictions or /fund-lapse for simple calculation"
    }

# ============================================================================
# MODEL STATUS AND UTILITIES
# ============================================================================

@router.get("/models/status")
async def get_model_status():
    """Get status of trained prediction models"""
    try:
        amount_models = len(ml_prediction_service.models.get('amount_trends', {}))
        lapse_models = len(ml_prediction_service.models.get('lapse_patterns', {}))
        seasonal_data = len(ml_prediction_service.models.get('seasonal_factors', {}))
        
        return {
            "models_loaded": True,
            "amount_prediction_models": amount_models,
            "lapse_risk_models": lapse_models,
            "seasonal_data_months": seasonal_data,
            "model_file": ml_prediction_service.model_file,
            "status": "ready" if amount_models > 0 else "needs_training",
            "recommendation": "Models ready for predictions" if amount_models > 0 else "Run train_prediction_model.py to train models"
        }
    
    except Exception as e:
        return {
            "models_loaded": False,
            "error": str(e),
            "status": "error",
            "recommendation": "Run train_prediction_model.py to train models"
        }
