"""Scheme Management Routes"""
from fastapi import APIRouter, HTTPException, Query
from app.database.schemas import SchemeCreate, SchemeResponse
from app.modules.scheme_management import SchemeService
from typing import List

router = APIRouter(prefix="/schemes", responses={404: {"description": "Not found"}})

# Initialize service (in production, use dependency injection)
scheme_service = SchemeService()


@router.post("/", response_model=SchemeResponse, status_code=201)
async def create_scheme(scheme: SchemeCreate):
    """Create a new government scheme"""
    result = scheme_service.create_scheme(scheme)
    return result


@router.get("/{scheme_id}", response_model=SchemeResponse)
async def get_scheme(scheme_id: int):
    """Get scheme details by ID"""
    scheme = scheme_service.get_scheme_details(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@router.get("/", response_model=List[SchemeResponse])
async def list_schemes(skip: int = Query(0, ge=0), limit: int = Query(100, le=1000)):
    """List all schemes with pagination"""
    return scheme_service.list_schemes(skip, limit)


@router.get("/ministry/{ministry}", response_model=List[SchemeResponse])
async def get_schemes_by_ministry(ministry: str):
    """Get all schemes by ministry"""
    return scheme_service.get_schemes_by_ministry(ministry)


@router.get("/ministry/{ministry}/budget")
async def get_ministry_total_budget(ministry: str):
    """Get total budget allocated to a ministry"""
    total = scheme_service.get_total_budget_by_ministry(ministry)
    if total == 0:
        raise HTTPException(status_code=404, detail="Ministry not found")
    return {
        "ministry": ministry,
        "total_allocated": total,
        "currency": "INR"
    }
