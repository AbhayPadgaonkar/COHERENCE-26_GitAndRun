"""Optimization Routes"""
from fastapi import APIRouter, Query
from app.modules.optimization import OptimizationService
from typing import List, Dict

router = APIRouter(prefix="/optimization", responses={404: {"description": "Not found"}})

# Initialize service
optimization_service = OptimizationService()


@router.post("/suggestions")
async def get_optimization_suggestions(schemes: List[Dict], utilization_data: Dict):
    """Get reallocation suggestions for budget optimization"""
    suggestions = optimization_service.get_optimization_suggestions(schemes, utilization_data)
    return suggestions


@router.post("/simulate-reallocation")
async def simulate_reallocation(from_scheme_utilization: Dict, to_scheme_utilization: Dict,
                               amount: float):
    """Simulate impact of fund reallocation"""
    result = optimization_service.simulate_reallocation(
        from_scheme_utilization, to_scheme_utilization, amount
    )
    return {
        "scenario": "Fund reallocation simulation",
        **result,
        "recommendation": "Proceed with reallocation" if result.get("improvement_in_to_scheme", 0) > 0 else "Reconsider"
    }


@router.get("/optimizable-funds")
async def get_optimizable_funds(schemes: List[Dict], threshold: float = Query(0.5, ge=0, le=1)):
    """Get total funds available for reallocation"""
    # Calculate underutilized amounts
    total_optimizable = 0
    underutilized_schemes = []
    
    for scheme in schemes:
        if scheme.get("utilization_percentage", 0) < threshold:
            available = scheme.get("allocated", 0) - scheme.get("spent", 0)
            if available > 0:
                total_optimizable += available
                underutilized_schemes.append({
                    "scheme_id": scheme.get("id"),
                    "optimizable_amount": available
                })
    
    return {
        "utilization_threshold": threshold * 100,
        "total_optimizable_funds": total_optimizable,
        "schemes_count": len(underutilized_schemes),
        "underutilized_schemes": underutilized_schemes,
        "currency": "INR"
    }
