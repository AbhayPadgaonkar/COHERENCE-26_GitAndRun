"""Anomaly Detection Routes with Explainable AI Layer"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import AnomalyCreate, AnomalyResponse
from app.modules.anomaly_detection import AnomalyService
from app.modules.anomaly_detection.feature_extractor import FeatureExtractor, AnomalyWindowAnalyzer
from app.modules.llm.integration_helpers import add_explanations_to_anomalies, check_llm_availability
from typing import List, Optional

router = APIRouter(prefix="/anomalies", responses={404: {"description": "Not found"}})

# Initialize service
anomaly_service = AnomalyService()
feature_extractor = FeatureExtractor()
window_analyzer = AnomalyWindowAnalyzer()


@router.post("/record", response_model=AnomalyResponse, status_code=201)
async def record_anomaly(anomaly: AnomalyCreate):
    """Record a detected anomaly"""
    result = anomaly_service.record_anomaly(anomaly)
    return result


@router.post("/detect")
async def detect_anomalies(scheme_id: str, spending_data: List[dict]):
    """
    Detect anomalies in spending data with Explainable AI Layer
    
    This endpoint automatically includes natural language explanations for each anomaly
    to help government employees understand WHY something was flagged.
    
    Returns:
    - scheme_id: The scheme identifier
    - anomalies_detected: Count of anomalies found
    - anomalies: List of anomalies with 'ai_explanation' field
    - overall_summary: Executive summary of all anomalies
    - severity_breakdown: Count by severity level
    - explainable_ai: AI layer status information
    """
    # Convert scheme_id to int if possible, otherwise keep as string
    try:
        scheme_id_int = int(scheme_id)
    except ValueError:
        scheme_id_int = 1  # Default to 1 for string IDs
    
    # Step 1: ML Anomaly Detection
    anomalies = anomaly_service.detect_anomalies(scheme_id_int, spending_data)
    
    if not anomalies:
        return {
            "scheme_id": scheme_id,
            "anomalies_detected": 0,
            "anomalies": [],
            "overall_summary": None,
            "severity_breakdown": {},
            "explainable_ai": {
                "enabled": False,
                "reason": "no_anomalies"
            }
        }
    
    # Step 2: Add Explainable AI Layer (Natural Language Explanations)
    result = await add_explanations_to_anomalies(
        anomalies=anomalies,
        batch=True,  # Use batch mode for efficiency
        graceful_degradation=True  # Return anomalies even if LLM fails
    )
    
    return {
        "scheme_id": scheme_id,
        "anomalies_detected": len(anomalies),
        **result  # Includes: anomalies, overall_summary, severity_breakdown, explainable_ai
    }


@router.post("/detect/comprehensive/{scheme_id}")
async def detect_anomalies_comprehensive(scheme_id: int, spending_data: List[dict], transfers: Optional[List[dict]] = None):
    """
    Run comprehensive anomaly detection using all 4 detectors:
    1. Z-Score (statistical deviation)
    2. Velocity Spike (rate of change)
    3. Isolation Forest (multidimensional outliers)
    4. Idle Funds (funds not being spent)
    
    Example request:
    {
        "spending_data": [
            {"id": 1, "amount": 10000, "frequency": 1, "variance": 2000, "velocity": 0},
            {"id": 2, "amount": 11000, "frequency": 1, "variance": 2100, "velocity": 0.1},
            {"id": 3, "amount": 500000, "frequency": 1, "variance": 2500, "velocity": 44.5}
        ],
        "transfers": [
            {
                "id": "t1",
                "amount": 50000,
                "transfer_date": "2026-02-01T10:00:00",
                "status": "transferred",
                "to_level": "district"
            }
        ]
    }
    """
    result = anomaly_service.detect_anomalies_comprehensive(scheme_id, spending_data, transfers)
    return result


@router.get("/scheme/{scheme_id}")
async def get_scheme_anomalies(scheme_id: str, severity: Optional[str] = Query(None)):
    """
    Get anomalies for a scheme with Explainable AI Layer
    
    Returns historical anomalies with natural language explanations
    to help government employees understand each issue.
    """
    try:
        scheme_id_int = int(scheme_id)
    except ValueError:
        scheme_id_int = 1  # Default to 1 for string IDs
    
    anomalies = anomaly_service.get_scheme_anomalies(scheme_id_int, severity)
    if not anomalies:
        raise HTTPException(status_code=404, detail="No anomalies found for this scheme")
    
    # Add Explainable AI Layer
    result = await add_explanations_to_anomalies(
        anomalies=anomalies,
        batch=True,
        graceful_degradation=True
    )
    
    return {
        "scheme_id": scheme_id,
        "severity_filter": severity,
        "anomaly_count": len(anomalies),
        **result
    }


@router.get("/scheme/{scheme_id}/summary")
async def get_scheme_anomaly_summary(scheme_id: str):
    """
    Get anomaly summary for a scheme with executive overview
    
    Provides statistical breakdown plus AI-generated executive summary
    for government officials to quickly understand the situation.
    """
    try:
        scheme_id_int = int(scheme_id)
    except ValueError:
        scheme_id_int = 1  # Default to 1 for string IDs
    
    all_anomalies = anomaly_service.get_scheme_anomalies(scheme_id_int)
    
    # Statistical breakdown
    summary_data = {
        "scheme_id": scheme_id,
        "total_anomalies": len(all_anomalies),
        "by_severity": {
            "critical": len([a for a in all_anomalies if a.get("severity") == "critical"]),
            "warning": len([a for a in all_anomalies if a.get("severity") == "warning"]),
            "info": len([a for a in all_anomalies if a.get("severity") == "info"])
        },
        "by_type": {
            "sudden_spike": len([a for a in all_anomalies if a.get("anomaly_type") == "sudden_spike"]),
            "irregular_pattern": len([a for a in all_anomalies if a.get("anomaly_type") == "irregular_pattern"]),
            "fund_idle": len([a for a in all_anomalies if a.get("anomaly_type") == "fund_idle"]),
            "duplicate_payment": len([a for a in all_anomalies if a.get("anomaly_type") == "duplicate_payment"]),
            "fund_lapse": len([a for a in all_anomalies if a.get("anomaly_type") == "fund_lapse"])
        }
    }
    
    # Add AI-generated executive summary if anomalies exist
    if all_anomalies:
        result = await add_explanations_to_anomalies(
            anomalies=all_anomalies[:10],  # Top 10 for summary
            batch=True,
            graceful_degradation=True
        )
        summary_data["executive_summary"] = result.get("overall_summary")
        summary_data["explainable_ai"] = result.get("explainable_ai")
    
    return summary_data


@router.post("/detect/from-transactions/{scheme_id}")
async def detect_from_raw_transactions(
    scheme_id: int,
    transactions: List[dict],
    transfers: Optional[List[dict]] = None
):
    """
    🚀 MAIN ENDPOINT: Auto-extract features from raw transactions and detect anomalies
    
    This endpoint AUTOMATICALLY:
    1. Calculates variance from transaction amounts
    2. Calculates velocity (% change between transactions)
    3. Calculates frequency (transactions per day)
    4. Runs all 4 anomaly detectors
    
    Input: Just raw transactions from database!
    
    Example:
    {
        "transactions": [
            {
                "id": 1,
                "amount": 10000,
                "date": "2026-03-01T10:00:00",
                "scheme_id": 123,
                "status": "completed"
            },
            {
                "id": 2,
                "amount": 11000,
                "date": "2026-03-02T10:00:00",
                "scheme_id": 123,
                "status": "completed"
            },
            {
                "id": 3,
                "amount": 500000,
                "date": "2026-03-03T10:00:00",
                "scheme_id": 123,
                "status": "completed"
            }
        ],
        "transfers": [
            {
                "id": "t1",
                "amount": 50000,
                "transfer_date": "2026-01-15T10:00:00",
                "status": "transferred",
                "to_level": "district"
            }
        ]
    }
    """
    
    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions provided")
    
    try:
        # Step 1: Extract features automatically
        extracted_features = feature_extractor.extract_features_from_transactions(transactions)
        
        # Step 2: Extract idle transfers
        idle_transfers = []
        if transfers:
            idle_transfers = feature_extractor.extract_idle_transfers(transfers, days_threshold=30)
        
        # Step 3: Run comprehensive anomaly detection
        result = anomaly_service.detect_anomalies_comprehensive(
            scheme_id=scheme_id,
            spending_data=extracted_features,
            transfers=transfers or []
        )
        
        # Step 4: Add detailed breakdown
        return {
            "scheme_id": scheme_id,
            "status": "success",
            "summary": {
                "total_transactions": len(transactions),
                "total_anomalies_detected": result["total_anomalies"],
                "detectors_used": result["detectors_used"]
            },
            "extracted_features": {
                "transaction_count": len(extracted_features),
                "features_sample": extracted_features[:3] if extracted_features else []  # Show first 3
            },
            "anomalies": result["anomalies"],
            "detector_details": result["detector_results"],
            "idle_funds": idle_transfers,
            "explanations": {
                "z_score": "Detects spending amounts that deviate significantly from average (statistical outliers)",
                "velocity_spike": "Detects sudden changes in transaction amounts (% change > 100%)",
                "isolation_forest": "Detects multidimensional outliers across amount, frequency, variance, velocity",
                "idle_funds": "Detects funds transferred but not spent within 30 days"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly detection error: {str(e)}"
        )


@router.post("/compare-periods/{scheme_id}")
async def compare_transaction_periods(
    scheme_id: int,
    transactions: List[dict],
    current_period_days: int = 30,
    previous_period_days: int = 60
):
    """
    Compare spending patterns between two periods to detect trends
    
    Example:
    - Previous period: Last 60 days (days 60-30 from today)
    - Current period: Last 30 days
    - Detects: volume spikes, frequency spikes, amount changes
    """
    
    try:
        # Get current and previous period transactions
        current = window_analyzer.get_window_transactions(transactions, days=current_period_days)
        previous = window_analyzer.get_window_transactions(transactions, days=previous_period_days)
        
        # Remove current period from previous to get only "previous" data
        previous = [
            t for t in previous
            if not any(
                (isinstance(t.get("date"), str) and isinstance(c.get("date"), str) and t["date"] == c["date"]) or
                (isinstance(t.get("date"), str) and isinstance(c.get("date"), str) and t["date"][:10] == c["date"][:10])
                for c in current
            )
        ]
        
        # Compare windows
        comparison = window_analyzer.compare_windows(current, previous)
        
        return {
            "scheme_id": scheme_id,
            "current_period_days": current_period_days,
            "previous_period_days": previous_period_days,
            "comparison": comparison,
            "anomaly_detected": any(comparison.get("anomaly_flags", {}).values())
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Period comparison error: {str(e)}"
        )


@router.get("/health")
async def check_anomaly_system_health():
    """
    Check health of anomaly detection system including Explainable AI layer
    
    Returns status of both ML anomaly detection and LLM explanation services
    """
    llm_status = check_llm_availability()
    
    return {
        "anomaly_detection": {
            "status": "operational",
            "service": "ML-based anomaly detection"
        },
        "explainable_ai": {
            "status": "operational" if llm_status["available"] else "degraded",
            "llm_available": llm_status["available"],
            "model": llm_status.get("model"),
            "note": "System works without LLM but explanations will be rule-based"
        }
    }
