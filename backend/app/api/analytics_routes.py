"""Analytics Routes - RBAC handled by frontend"""
from fastapi import APIRouter, HTTPException
from app.modules.analytics import AnalyticsService
from typing import List, Dict

router = APIRouter(prefix="/analytics", responses={404: {"description": "Not found"}})

# Initialize service
analytics_service = AnalyticsService()


# ============= LEGACY ENDPOINTS (kept for backward compatibility) =============

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


# ============= HIERARCHICAL DASHBOARD ENDPOINTS =============

@router.get("/dashboard/central")
async def get_central_dashboard():
    """
    Get complete central government dashboard with aggregated metrics
    
    **Access handled by frontend authentication**
    """
    try:
        dashboard = analytics_service.get_central_dashboard()
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching central dashboard: {str(e)}")


@router.get("/dashboard/central/department/{department_id}")
async def get_central_department_dashboard(department_id: str):
    """
    Get dashboard for specific central department
    
    **Access handled by frontend authentication**
    """
    try:
        dashboard = analytics_service.get_central_department_dashboard(department_id)
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching department dashboard: {str(e)}")


@router.get("/dashboard/state/{state_id}")
async def get_state_dashboard(state_id: str):
    """
    Get dashboard for state government with all districts
    
    **Access handled by frontend authentication**
    """
    try:
        dashboard = analytics_service.get_state_dashboard(state_id)
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching state dashboard: {str(e)}")


@router.get("/dashboard/state/{state_id}/department/{department_id}")
async def get_state_department_dashboard(state_id: str, department_id: str):
    """
    Get dashboard for specific state department
    
    **Access handled by frontend authentication**
    """
    try:
        dashboard = analytics_service.get_state_department_dashboard(state_id, department_id)
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching state department dashboard: {str(e)}")


@router.get("/dashboard/district/{district_id}")
async def get_district_dashboard(district_id: str):
    """
    Get dashboard for specific district
    
    **Access handled by frontend authentication**
    """
    try:
        dashboard = analytics_service.get_district_dashboard(district_id)
        return {
            "success": True,
            "dashboard": dashboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching district dashboard: {str(e)}")


@router.get("/dashboard/summary")
async def get_analytics_summary():
    """
    Get analytics dashboard summary with available endpoints
    
    **Public endpoint** - Authentication handled by frontend
    """
    return {
        "dashboard_type": "Analytics Summary",
        "authentication": "Handled by frontend (Firebase Auth)",
        "hierarchical_structure": {
            "tier_1": {
                "name": "Central Government",
                "endpoint": "/analytics/dashboard/central",
                "description": "Full overview of all states, departments, and districts"
            },
            "tier_2": {
                "name": "Central Department",
                "endpoint": "/analytics/dashboard/central/department/{department_id}",
                "description": "Central ministry/department view (e.g., Health Ministry)"
            },
            "tier_3": {
                "name": "State Government",
                "endpoint": "/analytics/dashboard/state/{state_id}",
                "description": "State-level view with all districts aggregated"
            },
            "tier_4": {
                "name": "State Department",
                "endpoint": "/analytics/dashboard/state/{state_id}/department/{department_id}",
                "description": "State department view (e.g., State Health Department)"
            },
            "tier_5": {
                "name": "District",
                "endpoint": "/analytics/dashboard/district/{district_id}",
                "description": "District-level local data view"
            }
        },
        "legacy_endpoints": {
            "spending_patterns": "/analytics/spending-patterns",
            "scheme_comparison": "/analytics/scheme-comparison",
            "district_rankings": "/analytics/district-rankings"
        }
    }
