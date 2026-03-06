"""Analytics Routes"""
from fastapi import APIRouter
from app.modules.analytics import AnalyticsService
from typing import List, Dict

router = APIRouter(prefix="/analytics", responses={404: {"description": "Not found"}})

# Initialize service
analytics_service = AnalyticsService()


@router.post("/spending-patterns")
async def analyze_spending_patterns(spending_data: List[Dict]):
    """Analyze spending patterns over time"""
    patterns = analytics_service.analyze_spending_patterns(spending_data)
    return {
        "analysis_type": "Spending Pattern Analysis",
        **patterns
    }


@router.post("/scheme-comparison")
async def compare_schemes(scheme_data: List[Dict]):
    """Compare performance across multiple schemes"""
    comparison = analytics_service.compare_scheme_performance(scheme_data)
    return {
        "analysis_type": "Scheme Performance Comparison",
        "schemes_compared": len(scheme_data),
        "schemes": comparison
    }


@router.post("/district-rankings")
async def get_district_rankings(district_data: List[Dict]):
    """Get district performance rankings"""
    rankings = analytics_service.get_district_rankings(district_data)
    return {
        "analysis_type": "District Performance Rankings",
        **rankings
    }


@router.get("/dashboard/summary")
async def get_analytics_summary():
    """Get analytics dashboard summary"""
    return {
        "dashboard_type": "Analytics Summary",
        "available_metrics": [
            "spending_patterns",
            "scheme_comparison",
            "district_rankings",
            "utilization_trends",
            "anomaly_summary"
        ],
        "note": "Use specific endpoints to fetch detailed analytics"
    }
