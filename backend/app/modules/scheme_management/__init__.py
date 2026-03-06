"""Scheme Management Module"""
from typing import List, Optional
from app.database.schemas import SchemeCreate, SchemeResponse


class SchemeRepository:
    """Repository for scheme operations"""
    
    def __init__(self):
        self.schemes = []
        self.id_counter = 1
    
    def create_scheme(self, scheme: SchemeCreate) -> dict:
        """Create a new scheme"""
        scheme_dict = {
            "id": self.id_counter,
            **scheme.model_dump()
        }
        self.schemes.append(scheme_dict)
        self.id_counter += 1
        return scheme_dict
    
    def get_scheme(self, scheme_id: int) -> Optional[dict]:
        """Get scheme by ID"""
        return next((s for s in self.schemes if s["id"] == scheme_id), None)
    
    def list_schemes(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """List all schemes"""
        return self.schemes[skip:skip + limit]
    
    def update_scheme(self, scheme_id: int, updates: dict) -> Optional[dict]:
        """Update scheme"""
        scheme = self.get_scheme(scheme_id)
        if scheme:
            scheme.update(updates)
        return scheme
    
    def delete_scheme(self, scheme_id: int) -> bool:
        """Delete scheme"""
        initial_len = len(self.schemes)
        self.schemes = [s for s in self.schemes if s["id"] != scheme_id]
        return len(self.schemes) < initial_len


class SchemeService:
    """Business logic for scheme management"""
    
    def __init__(self):
        self.repository = SchemeRepository()
    
    def create_scheme(self, scheme: SchemeCreate) -> dict:
        """Create a new scheme"""
        return self.repository.create_scheme(scheme)
    
    def get_scheme_details(self, scheme_id: int) -> Optional[dict]:
        """Get detailed scheme information"""
        return self.repository.get_scheme(scheme_id)
    
    def list_schemes(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """List schemes with pagination"""
        return self.repository.list_schemes(skip, limit)
    
    def get_schemes_by_ministry(self, ministry: str) -> List[dict]:
        """Get schemes by ministry"""
        return [s for s in self.repository.schemes if s.get("ministry") == ministry]
    
    def get_total_budget_by_ministry(self, ministry: str) -> float:
        """Calculate total budget allocated by ministry"""
        schemes = self.get_schemes_by_ministry(ministry)
        return sum(s.get("budget_allocated", 0) for s in schemes)
