"""Insights and Alerts Routes"""
from fastapi import APIRouter
from app.modules.insights import InsightsService
from typing import List, Dict

router = APIRouter(prefix="/insights", responses={404: {"description": "Not found"}})

# Initialize service
insights_service = InsightsService()


@router.post("/alerts")
async def get_alerts(anomalies: List[Dict], predictions: List[Dict]):
    """Generate and prioritize alerts"""
    alerts = insights_service.get_alerts(anomalies, predictions)
    return {
        "alerts_generated": len(alerts),
        "critical_alerts": len([a for a in alerts if a.get("priority") == "P0"]),
        "alerts": alerts
    }


@router.get("/executive-dashboard")
async def get_executive_dashboard():
    """Get executive dashboard with key metrics"""
    return {
        "dashboard_type": "Executive Dashboard",
        "available_widgets": [
            "budget_summary",
            "utilization_trends",
            "anomaly_alerts",
            "lapse_risks",
            "optimization_opportunities"
        ],
        "note": "Provide schemes and analytics data to generate dashboard"
    }


@router.post("/executive-summary")
async def generate_executive_summary(schemes: List[Dict], analytics_results: Dict):
    """Generate executive summary report"""
    summary = insights_service.get_executive_dashboard(schemes, analytics_results)
    return {
        "report_type": "Executive Summary",
        **summary
    }


@router.post("/actionable-insights")
async def get_actionable_insights(alerts: List[Dict], optimization_suggestions: List[Dict]):
    """Get actionable insights for decision-makers"""
    insights = insights_service.get_actionable_insights(alerts, optimization_suggestions)
    return {
        "insights_type": "Actionable Insights",
        **insights
    }


@router.get("/dashboard/live")
async def get_live_dashboard():
    """Get live dashboard data"""
    return {
        "dashboard_type": "Live Dashboard",
        "status": "operational",
        "last_updated": "2024-01-01T00:00:00Z",
        "widgets": {
            "budget_status": "Active",
            "anomaly_detection": "Active",
            "risk_alerts": "Active",
            "optimization_engine": "Active"
        }
    }
