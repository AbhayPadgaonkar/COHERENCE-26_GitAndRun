"""Analytics Routes - RBAC handled by frontend"""
from fastapi import APIRouter, HTTPException, Query
from app.modules.analytics import AnalyticsService
from app.modules.llm.integration_helpers import add_dashboard_summary
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from typing import List, Dict, Any
from collections import defaultdict

router = APIRouter(prefix="/analytics", responses={404: {"description": "Not found"}})

# Initialize service
analytics_service = AnalyticsService()

# -beta collection names (same as frontend/seed)
SCHEMES_BETA = "schemes-beta"
FUND_FLOWS_BETA = "fund_flows-beta"
BENEFICIARY_PAYMENTS_BETA = "beneficiary_payments-beta"


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
    **Explainable AI**: Automatically includes AI executive summary for government officials
    """
    try:
        dashboard = analytics_service.get_central_dashboard()
        
        # Add AI-generated executive summary
        result = await add_dashboard_summary(
            dashboard_data=dashboard,
            dashboard_name="Central Government Dashboard",
            level="central",
            graceful_degradation=True
        )
        
        return {
            "success": True,
            "dashboard": result.get("dashboard_data", dashboard),
            "executive_summary": result.get("executive_summary"),
            "key_insights": result.get("key_insights", []),
            "explainable_ai": result.get("explainable_ai", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching central dashboard: {str(e)}")


@router.get("/dashboard/central/department/{department_id}")
async def get_central_department_dashboard(department_id: str):
    """
    Get dashboard for specific central department (e.g., Health Ministry) with AI insights
    
    **Access handled by frontend authentication**
    **Explainable AI**: Automatically includes department-specific summary
    """
    try:
        dashboard = analytics_service.get_central_department_dashboard(department_id)
        
        # Add AI executive summary
        result = await add_dashboard_summary(
            dashboard_data=dashboard,
            dashboard_name=f"Central Department Dashboard ({department_id})",
            level="central",
            graceful_degradation=True
        )
        
        return {
            "success": True,
            "dashboard": result.get("dashboard_data", dashboard),
            "executive_summary": result.get("executive_summary"),
            "key_insights": result.get("key_insights", []),
            "explainable_ai": result.get("explainable_ai", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching department dashboard: {str(e)}")


@router.get("/dashboard/state/{state_id}")
async def get_state_dashboard(state_id: str):
    """
    Get dashboard for specific state with AI executive summary
    
    **Access handled by frontend authentication**
    **Explainable AI**: Automatically includes state-level insights
    """
    try:
        dashboard = analytics_service.get_state_dashboard(state_id)
        
        # Add AI executive summary
        result = await add_dashboard_summary(
            dashboard_data=dashboard,
            dashboard_name=f"State Dashboard ({state_id})",
            level="state",
            graceful_degradation=True
        )
        
        return {
            "success": True,
            "dashboard": result.get("dashboard_data", dashboard),
            "executive_summary": result.get("executive_summary"),
            "key_insights": result.get("key_insights", []),
            "explainable_ai": result.get("explainable_ai", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching state dashboard: {str(e)}")


@router.get("/dashboard/state/{state_id}/department/{department_id}")
async def get_state_department_dashboard(state_id: str, department_id: str):
    """
    Get dashboard for specific state department with AI insights
    
    **Access handled by frontend authentication**
    **Explainable AI**: Automatically includes state department summary
    """
    try:
        dashboard = analytics_service.get_state_department_dashboard(state_id, department_id)
        
        # Add AI executive summary
        result = await add_dashboard_summary(
            dashboard_data=dashboard,
            dashboard_name=f"State Department Dashboard ({state_id} - {department_id})",
            level="state",
            graceful_degradation=True
        )
        
        return {
            "success": True,
            "dashboard": result.get("dashboard_data", dashboard),
            "executive_summary": result.get("executive_summary"),
            "key_insights": result.get("key_insights", []),
            "explainable_ai": result.get("explainable_ai", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching state department dashboard: {str(e)}")


@router.get("/dashboard/district/{district_id}")
async def get_district_dashboard(district_id: str):
    """
    Get dashboard for specific district with AI executive summary
    
    **Access handled by frontend authentication**
    **Explainable AI**: Automatically includes district-level insights
    """
    try:
        dashboard = analytics_service.get_district_dashboard(district_id)
        
        # Add AI executive summary
        result = await add_dashboard_summary(
            dashboard_data=dashboard,
            dashboard_name=f"District Dashboard ({district_id})",
            level="district",
            graceful_degradation=True
        )
        
        return {
            "success": True,
            "dashboard": result.get("dashboard_data", dashboard),
            "executive_summary": result.get("executive_summary"),
            "key_insights": result.get("key_insights", []),
            "explainable_ai": result.get("explainable_ai", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching district dashboard: {str(e)}")


@router.get("/charts/beta")
async def get_charts_beta(
    role: str = Query(None, description="Filter by role: CENTRAL_ADMIN, CENTRAL_DEPT, STATE_DDO, DISTRICT_DDO"),
    department: str = Query(None),
    state_code: str = Query(None),
    district_code: str = Query(None),
):
    """
    Fetch -beta collections from Firestore, run analytics, return chart-ready data.
    Frontend uses this for graphs/charts. RBAC filtering via query params.
    """
    db = FirebaseConfig.get_db()
    if not db:
        raise HTTPException(status_code=503, detail="Firebase not connected")
    try:
        schemes_ref = db.collection(SCHEMES_BETA)
        flows_ref = db.collection(FUND_FLOWS_BETA)
        payments_ref = db.collection(BENEFICIARY_PAYMENTS_BETA)

        schemes_snap = list(schemes_ref.stream())
        flows_snap = list(flows_ref.stream())
        payments_snap = list(payments_ref.stream())

        schemes = [{"id": d.id, **d.to_dict()} for d in schemes_snap]
        flows = [{"id": d.id, **d.to_dict()} for d in flows_snap]
        payments = [{"id": d.id, **d.to_dict()} for d in payments_snap]

        # Optional role/department/geography filter (same logic as frontend useBetaData)
        if role and role != "CENTRAL_ADMIN" and department:
            scheme_ids = {s["id"] for s in schemes if s.get("department_id") == department}
            legacy_ids = {s.get("legacy_id") for s in schemes if s.get("department_id") == department and s.get("legacy_id")}
            schemes = [s for s in schemes if s.get("department_id") == department]
            flows = [f for f in flows if f.get("scheme_id") in scheme_ids or str(f.get("scheme_id")) in scheme_ids]
            payments = [p for p in payments if p.get("scheme_id") in legacy_ids or p.get("department_id") == department]
        if state_code:
            flows = [f for f in flows if (f.get("to_entity_code") or "").startswith(state_code) or (f.get("from_entity_code") or "").startswith(state_code) or state_code in (f.get("to_entity_code") or "")]
            payments = [p for p in payments if (p.get("state_code") or "").endswith(state_code) or (p.get("district_code") or "").startswith(state_code)]
        if district_code:
            flows = [f for f in flows if f.get("to_entity_code") == district_code or f.get("from_entity_code") == district_code]
            payments = [p for p in payments if p.get("district_code") == district_code]

        # Analytics: budget by scheme (₹ Cr)
        budget_by_scheme = []
        for s in schemes:
            name = (s.get("scheme_code") or s.get("name") or s["id"])[:16]
            budget = float(s.get("budget_allocated") or 0) / 1e7
            budget_by_scheme.append({"name": name, "budget_cr": round(budget, 2), "scheme_id": s["id"]})

        # Payments by district (₹ Lakhs)
        by_district: Dict[str, float] = defaultdict(float)
        for p in payments:
            key = p.get("district") or p.get("district_code") or "Other"
            by_district[key] += float(p.get("payment_amount") or 0)
        payments_by_district = [{"name": k[:14], "value_lakhs": round(v / 1e5, 2)} for k, v in sorted(by_district.items(), key=lambda x: -x[1])]

        # Fund flows by route (from_level → to_level, ₹ Cr)
        by_route: Dict[str, float] = defaultdict(float)
        for f in flows:
            route = f"{f.get('from_level', '')} → {f.get('to_level', '')}"
            by_route[route] += float(f.get("amount") or 0)
        fund_flows_by_route = [{"route": k, "amount_cr": round(v / 1e7, 2)} for k, v in sorted(by_route.items(), key=lambda x: -x[1])]

        # Latest disbursements (most recent first)
        flows_sorted = sorted(flows, key=lambda x: x.get("created_at") or x.get("transfer_date") or "", reverse=True)
        payments_sorted = sorted(payments, key=lambda x: x.get("created_at") or x.get("payment_date") or "", reverse=True)
        latest_fund_flows = flows_sorted[:15]
        latest_payments = payments_sorted[:15]

        return {
            "success": True,
            "charts": {
                "budget_by_scheme": budget_by_scheme,
                "payments_by_district": payments_by_district,
                "fund_flows_by_route": fund_flows_by_route,
            },
            "latest": {
                "fund_flows": latest_fund_flows,
                "payments": latest_payments,
            },
            "counts": {
                "schemes": len(schemes),
                "fund_flows": len(flows),
                "payments": len(payments),
            },
        }
    except Exception as e:
        logger.exception("charts/beta error")
        raise HTTPException(status_code=500, detail=str(e))


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
