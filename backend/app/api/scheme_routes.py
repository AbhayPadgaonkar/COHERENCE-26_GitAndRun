"""Scheme Management Routes - Indian Government Schemes with Firebase"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import SchemeCreate, SchemeResponse
from app.modules.scheme_management import SchemeService
from app.core.constants import (
    SCHEME_TYPES, BENEFICIARY_CATEGORIES, MAJOR_SCHEMES,
    MINISTRIES, INDIAN_STATES, SCHEME_STATUSES
)
from typing import List, Optional

router = APIRouter(prefix="/schemes", responses={404: {"description": "Not found"}})

# Initialize service
scheme_service = SchemeService()


# ============ Scheme CRUD Operations ============

@router.post("/", status_code=201)
async def create_scheme(scheme: SchemeCreate, created_by: str = Query("system")):
    """Create a new government scheme following Indian government structure"""
    result = scheme_service.create_scheme(scheme, created_by)
    return {
        "success": True,
        "message": "Scheme created successfully",
        "scheme": result
    }


@router.get("/{scheme_code}")
async def get_scheme(scheme_code: str):
    """Get scheme details by scheme code"""
    scheme = scheme_service.get_scheme_by_code(scheme_code)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme {scheme_code} not found")
    return {
        "success": True,
        "scheme": scheme
    }


@router.get("/")
async def list_schemes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    ministry: Optional[str] = None,
    status: Optional[str] = None,
    fiscal_year: Optional[int] = None,
    scheme_type: Optional[str] = None
):
    """List all schemes with optional filters"""
    schemes = scheme_service.list_schemes(
        skip=skip,
        limit=limit,
        ministry=ministry,
        status=status,
        fiscal_year=fiscal_year,
        scheme_type=scheme_type
    )
    return {
        "success": True,
        "total": len(schemes),
        "skip": skip,
        "limit": limit,
        "schemes": schemes
    }


# ============ Ministry-based Endpoints ============

@router.get("/ministry/{ministry}")
async def get_schemes_by_ministry(ministry: str):
    """Get all schemes implemented by a specific ministry"""
    if ministry not in MINISTRIES:
        raise HTTPException(status_code=400, detail=f"Invalid ministry: {ministry}")
    
    schemes = scheme_service.get_schemes_by_ministry(ministry)
    if not schemes:
        raise HTTPException(status_code=404, detail=f"No schemes found for {ministry}")
    
    return {
        "success": True,
        "ministry": ministry,
        "count": len(schemes),
        "total_budget": sum(s.get("budget_allocated", 0) for s in schemes),
        "schemes": schemes,
        "currency": "INR"
    }


@router.get("/ministry/{ministry}/budget")
async def get_ministry_total_budget(ministry: str):
    """Get total budget allocated to a ministry"""
    total = scheme_service.get_total_budget_by_ministry(ministry)
    if total == 0:
        raise HTTPException(status_code=404, detail=f"Ministry {ministry} not found")
    
    return {
        "success": True,
        "ministry": ministry,
        "total_allocated": total,
        "currency": "INR",
        "fiscal_year": "2024-2025"
    }


@router.get("/analytics/ministry-performance")
async def get_ministry_performance():
    """Get budget and performance metrics by ministry"""
    performance = scheme_service.get_ministry_performance()
    return {
        "success": True,
        "analysis_type": "Ministry Performance",
        "ministries": performance
    }


# ============ State-based Endpoints ============

@router.get("/state/{state}")
async def get_schemes_by_state(state: str):
    """Get all schemes covering a specific Indian state"""
    if state not in INDIAN_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid state: {state}")
    
    schemes = scheme_service.get_schemes_by_state(state)
    if not schemes:
        raise HTTPException(status_code=404, detail=f"No schemes found covering {state}")
    
    return {
        "success": True,
        "state": state,
        "count": len(schemes),
        "total_budget": sum(s.get("budget_allocated", 0) for s in schemes),
        "schemes": schemes,
        "currency": "INR"
    }


@router.get("/state/{state}/budget")
async def get_state_total_budget(state: str):
    """Get total budget allocated to a state across all schemes"""
    if state not in INDIAN_STATES:
        raise HTTPException(status_code=400, detail=f"Invalid state: {state}")
    
    total = scheme_service.get_total_budget_by_state(state)
    if total == 0:
        raise HTTPException(status_code=404, detail=f"No schemes found for {state}")
    
    return {
        "success": True,
        "state": state,
        "total_allocated": total,
        "currency": "INR"
    }


@router.get("/analytics/state-coverage")
async def get_state_coverage():
    """Get scheme coverage and budget allocation by state"""
    coverage = scheme_service.get_scheme_coverage_by_state()
    
    return {
        "success": True,
        "total_states_covered": len(coverage),
        "states": coverage
    }


# ============ Scheme Type Endpoints ============

@router.get("/type/{scheme_type}")
async def get_schemes_by_type(scheme_type: str):
    """Get schemes by type (Health, Education, Water, etc.)"""
    if scheme_type not in SCHEME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid scheme type: {scheme_type}")
    
    schemes = scheme_service.get_schemes_by_type(scheme_type)
    if not schemes:
        raise HTTPException(status_code=404, detail=f"No schemes found of type: {scheme_type}")
    
    return {
        "success": True,
        "scheme_type": scheme_type,
        "count": len(schemes),
        "total_budget": sum(s.get("budget_allocated", 0) for s in schemes),
        "schemes": schemes,
        "currency": "INR"
    }


# ============ Beneficiary Category Endpoints ============

@router.get("/beneficiary/{category}")
async def get_schemes_by_beneficiary(category: str):
    """Get schemes targeting a specific beneficiary category"""
    if category not in BENEFICIARY_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
    
    schemes = scheme_service.get_schemes_by_beneficiary_category(category)
    if not schemes:
        raise HTTPException(status_code=404, detail=f"No schemes for category: {category}")
    
    return {
        "success": True,
        "category": category,
        "count": len(schemes),
        "schemes": schemes
    }


# ============ Major Schemes (Pradhan Mantri Yojanas) ============

@router.get("/major-schemes/list")
async def list_major_schemes():
    """Get list of all major Pradhan Mantri Yojanas"""
    return {
        "success": True,
        "major_schemes": MAJOR_SCHEMES,
        "total_count": len(MAJOR_SCHEMES)
    }


@router.get("/major-schemes/status")
async def get_major_schemes_status():
    """Get current status of major Pradhan Mantri Yojanas"""
    status = scheme_service.get_major_schemes_status()
    
    return {
        "success": True,
        "analysis_type": "Major Schemes Status",
        "schemes": status
    }


# ============ Scheme Status Endpoints ============

@router.get("/status/{status_type}")
async def get_schemes_by_status(status_type: str):
    """Get all schemes with a specific operational status"""
    if status_type not in SCHEME_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status_type}")
    
    schemes = scheme_service.list_schemes(status=status_type)
    
    return {
        "success": True,
        "status": status_type,
        "count": len(schemes),
        "schemes": schemes
    }


@router.get("/active/list")
async def get_active_schemes():
    """Get all currently active schemes"""
    schemes = scheme_service.get_active_schemes()
    
    return {
        "success": True,
        "status": "Active",
        "count": len(schemes),
        "total_budget": sum(s.get("budget_allocated", 0) for s in schemes),
        "schemes": schemes,
        "currency": "INR"
    }


# ============ Analytics & Insights ============

@router.get("/analytics/overview")
async def get_scheme_analytics():
    """Get comprehensive scheme analytics and statistics"""
    analytics = scheme_service.get_scheme_analytics()
    
    return {
        "success": True,
        "analysis_type": "Scheme Portfolio Analytics",
        **analytics
    }


@router.get("/analytics/coverage")
async def get_coverage_analysis():
    """Get geographic coverage analysis"""
    coverage = scheme_service.get_scheme_coverage_by_state()
    
    return {
        "success": True,
        "total_states_covered": len(coverage),
        "states": coverage
    }


# ============ Search & Filter ============

@router.get("/search/")
async def search_schemes(q: str = Query(..., min_length=2)):
    """Search schemes by name or description"""
    results = scheme_service.search_schemes(q)
    
    if not results:
        raise HTTPException(status_code=404, detail="No schemes found matching your search")
    
    return {
        "success": True,
        "query": q,
        "results_count": len(results),
        "schemes": results
    }


# ============ Reference Data ============

@router.get("/reference/ministries")
async def get_ministries():
    """Get list of all implementing ministries"""
    return {
        "success": True,
        "ministries": MINISTRIES,
        "count": len(MINISTRIES)
    }


@router.get("/reference/states")
async def get_states():
    """Get list of all Indian states and union territories"""
    return {
        "success": True,
        "states": INDIAN_STATES,
        "count": len(INDIAN_STATES)
    }


@router.get("/reference/scheme-types")
async def get_scheme_types():
    """Get list of all scheme types/categories"""
    return {
        "success": True,
        "scheme_types": SCHEME_TYPES,
        "count": len(SCHEME_TYPES)
    }


@router.get("/reference/beneficiary-categories")
async def get_beneficiary_categories():
    """Get list of beneficiary categories"""
    return {
        "success": True,
        "beneficiary_categories": BENEFICIARY_CATEGORIES,
        "count": len(BENEFICIARY_CATEGORIES)
    }


@router.get("/reference/statuses")
async def get_statuses():
    """Get list of possible scheme statuses"""
    return {
        "success": True,
        "statuses": SCHEME_STATUSES,
        "count": len(SCHEME_STATUSES)
    }


# ============ Update Operations ============

@router.put("/{document_id}/status")
async def update_scheme_status(document_id: str, new_status: str = Query(...)):
    """Update scheme operational status"""
    result = scheme_service.update_scheme_status(document_id, new_status)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"Scheme {document_id} not found")
    
    return {
        "success": True,
        "message": f"Scheme status updated to {new_status}",
        "scheme": result
    }
