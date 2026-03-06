"""Prediction Routes"""
from fastapi import APIRouter, HTTPException
from app.database.schemas import FundLapsePredictionResponse
from app.modules.prediction import PredictionService
from typing import List

router = APIRouter(prefix="/predictions", responses={404: {"description": "Not found"}})

# Initialize service
prediction_service = PredictionService()


@router.post("/fund-lapse", response_model=FundLapsePredictionResponse, status_code=201)
async def predict_fund_lapse(scheme_id: int, allocated: float, spent: float, 
                             days_elapsed: int, days_remaining: int):
    """Predict fund lapse probability for a scheme"""
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
    # In production, this would query the repository
    return {
        "scheme_id": scheme_id,
        "message": "Use predict-fund-lapse endpoint to generate predictions"
    }
