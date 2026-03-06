"""Scheme Management Module - Indian Government Schemes with Firebase Integration"""
from typing import List, Optional, Dict
from app.database.schemas import SchemeCreate, SchemeResponse
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.core.constants import (
    SCHEME_TYPES, BENEFICIARY_CATEGORIES, MAJOR_SCHEMES,
    MINISTRIES, INDIAN_STATES, SCHEME_STATUSES
)
from datetime import datetime


class SchemeRepository:
    """Repository for scheme operations with Firebase support"""
    
    COLLECTION_NAME = "schemes"
    
    def __init__(self):
        """Initialize repository with Firebase and fallback in-memory storage"""
        self.firebase = FirebaseConfig.get_db()
        self.schemes = []  # Fallback in-memory storage
        self.id_counter = 1
    
    def create_scheme(self, scheme: SchemeCreate, created_by: str = "system") -> dict:
        """Create a new scheme in Firebase or in-memory storage"""
        scheme_dict = {
            **scheme.model_dump(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "created_by": created_by
        }
        
        # Try to save to Firebase
        if self.firebase:
            try:
                doc_ref = self.firebase.collection(self.COLLECTION_NAME).add(scheme_dict)
                scheme_dict["document_id"] = doc_ref[1].id
                logger.info(f"Scheme created in Firebase: {doc_ref[1].id}")
                return scheme_dict
            except Exception as e:
                logger.warning(f"Firebase error: {e}, using fallback in-memory storage")
        
        # Fallback: in-memory storage
        scheme_dict["id"] = self.id_counter
        self.schemes.append(scheme_dict)
        self.id_counter += 1
        return scheme_dict
    
    def get_scheme(self, scheme_id: Optional[int] = None, document_id: Optional[str] = None) -> Optional[dict]:
        """Get scheme by ID or Firebase document ID"""
        
        # Try Firebase with document_id
        if document_id and self.firebase:
            try:
                doc = self.firebase.collection(self.COLLECTION_NAME).document(document_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Try Firebase by scheme_code
        if scheme_id and self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('scheme_code', '==', str(scheme_id)).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((s for s in self.schemes if s.get("id") == scheme_id), None)
    
    def get_scheme_by_code(self, scheme_code: str) -> Optional[dict]:
        """Get scheme by scheme code"""
        
        # Try Firebase
        if self.firebase:
            try:
                docs = self.firebase.collection(self.COLLECTION_NAME).where('scheme_code', '==', scheme_code).stream()
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        return next((s for s in self.schemes if s.get("scheme_code") == scheme_code), None)
    
    def list_schemes(self, skip: int = 0, limit: int = 100, 
                    filters: Optional[Dict] = None) -> List[dict]:
        """List schemes with optional filters"""
        
        # Try Firebase
        if self.firebase:
            try:
                query = self.firebase.collection(self.COLLECTION_NAME)
                
                # Apply filters if provided
                if filters:
                    if filters.get("ministry"):
                        query = query.where("ministry", "==", filters["ministry"])
                    if filters.get("status"):
                        query = query.where("status", "==", filters["status"])
                    if filters.get("fiscal_year"):
                        query = query.where("fiscal_year", "==", filters["fiscal_year"])
                    if filters.get("scheme_type"):
                        query = query.where("scheme_type", "==", filters["scheme_type"])
                
                docs = query.offset(skip).limit(limit).stream()
                schemes = []
                for doc in docs:
                    data = doc.to_dict()
                    data["document_id"] = doc.id
                    schemes.append(data)
                
                if schemes:
                    return schemes
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage with filters
        filtered_schemes = self.schemes
        if filters:
            if filters.get("ministry"):
                filtered_schemes = [s for s in filtered_schemes if s.get("ministry") == filters["ministry"]]
            if filters.get("status"):
                filtered_schemes = [s for s in filtered_schemes if s.get("status") == filters["status"]]
            if filters.get("fiscal_year"):
                filtered_schemes = [s for s in filtered_schemes if s.get("fiscal_year") == filters["fiscal_year"]]
            if filters.get("scheme_type"):
                filtered_schemes = [s for s in filtered_schemes if s.get("scheme_type") == filters["scheme_type"]]
        
        return filtered_schemes[skip:skip + limit]
    
    def update_scheme(self, document_id: Optional[str] = None, 
                     scheme_id: Optional[int] = None, 
                     updates: dict = None) -> Optional[dict]:
        """Update scheme"""
        updates["updated_at"] = datetime.now().isoformat()
        
        # Try Firebase
        if document_id and self.firebase:
            try:
                self.firebase.collection(self.COLLECTION_NAME).document(document_id).update(updates)
                doc = self.firebase.collection(self.COLLECTION_NAME).document(document_id).get()
                data = doc.to_dict()
                data["document_id"] = doc.id
                logger.info(f"Scheme updated in Firebase: {document_id}")
                return data
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        scheme = self.get_scheme(scheme_id=scheme_id)
        if scheme:
            scheme.update(updates)
        return scheme
    
    def delete_scheme(self, document_id: Optional[str] = None, 
                     scheme_id: Optional[int] = None) -> bool:
        """Delete scheme"""
        
        # Try Firebase
        if document_id and self.firebase:
            try:
                self.firebase.collection(self.COLLECTION_NAME).document(document_id).delete()
                logger.info(f"Scheme deleted from Firebase: {document_id}")
                return True
            except Exception as e:
                logger.warning(f"Firebase error: {e}")
        
        # Fallback: in-memory storage
        initial_len = len(self.schemes)
        self.schemes = [s for s in self.schemes if s.get("id") != scheme_id]
        return len(self.schemes) < initial_len


class SchemeService:
    """Business logic for scheme management following Indian Government structure"""
    
    def __init__(self):
        self.repository = SchemeRepository()
    
    def create_scheme(self, scheme: SchemeCreate, created_by: str = "system") -> dict:
        """Create a new scheme"""
        return self.repository.create_scheme(scheme, created_by)
    
    def get_scheme_details(self, scheme_id: int = None, document_id: str = None) -> Optional[dict]:
        """Get detailed scheme information"""
        return self.repository.get_scheme(scheme_id=scheme_id, document_id=document_id)
    
    def list_schemes(self, skip: int = 0, limit: int = 100, 
                    ministry: str = None, status: str = None, 
                    fiscal_year: int = None, scheme_type: str = None) -> List[dict]:
        """List schemes with optional filters"""
        filters = {}
        if ministry:
            filters["ministry"] = ministry
        if status:
            filters["status"] = status
        if fiscal_year:
            filters["fiscal_year"] = fiscal_year
        if scheme_type:
            filters["scheme_type"] = scheme_type
        
        return self.repository.list_schemes(skip, limit, filters if filters else None)
    
    def get_scheme_by_code(self, scheme_code: str) -> Optional[dict]:
        """Get scheme by scheme code"""
        return self.repository.get_scheme_by_code(scheme_code)
    
    def get_schemes_by_ministry(self, ministry: str) -> List[dict]:
        """Get schemes by ministry"""
        return self.list_schemes(ministry=ministry)
    
    def get_schemes_by_state(self, state: str) -> List[dict]:
        """Get schemes covering a specific state"""
        all_schemes = self.repository.list_schemes(limit=1000)
        return [s for s in all_schemes 
                if state in s.get("coverage_states", [])]
    
    def get_schemes_by_type(self, scheme_type: str) -> List[dict]:
        """Get schemes by type (Health, Water, Employment, etc.)"""
        all_schemes = self.repository.list_schemes(limit=1000)
        return [s for s in all_schemes 
                if s.get("scheme_type") == scheme_type]
    
    def get_total_budget_by_ministry(self, ministry: str) -> float:
        """Calculate total budget allocated by ministry"""
        schemes = self.get_schemes_by_ministry(ministry)
        return sum(s.get("budget_allocated", 0) for s in schemes)
    
    def get_total_budget_by_state(self, state: str) -> float:
        """Calculate total budget allocated to a state"""
        schemes = self.get_schemes_by_state(state)
        return sum(s.get("budget_allocated", 0) for s in schemes)
    
    def get_schemes_by_beneficiary_category(self, category: str) -> List[dict]:
        """Get schemes targeting a specific beneficiary category"""
        all_schemes = self.repository.list_schemes(limit=1000)
        return [s for s in all_schemes 
                if category in s.get("beneficiary_category", [])]
    
    def get_ministry_performance(self) -> Dict:
        """Get budget utilization performance by ministry"""
        all_schemes = self.repository.list_schemes(limit=1000)
        ministry_data = {}
        
        for scheme in all_schemes:
            ministry = scheme.get("ministry")
            if ministry not in ministry_data:
                ministry_data[ministry] = {
                    "total_schemes": 0,
                    "total_budget": 0,
                    "active_schemes": 0,
                    "states_covered": set()
                }
            
            ministry_data[ministry]["total_schemes"] += 1
            ministry_data[ministry]["total_budget"] += scheme.get("budget_allocated", 0)
            
            if scheme.get("status") == "Active":
                ministry_data[ministry]["active_schemes"] += 1
            
            ministry_data[ministry]["states_covered"].update(
                scheme.get("coverage_states", [])
            )
        
        # Convert sets to lists
        for ministry in ministry_data:
            ministry_data[ministry]["states_covered"] = list(
                ministry_data[ministry]["states_covered"]
            )
        
        return ministry_data
    
    def get_scheme_coverage_by_state(self) -> Dict:
        """Get number of schemes covering each state"""
        all_schemes = self.repository.list_schemes(limit=1000)
        state_coverage = {}
        
        for scheme in all_schemes:
            for state in scheme.get("coverage_states", []):
                if state not in state_coverage:
                    state_coverage[state] = {
                        "count": 0,
                        "budget": 0,
                        "schemes": []
                    }
                
                state_coverage[state]["count"] += 1
                state_coverage[state]["budget"] += scheme.get("budget_allocated", 0)
                state_coverage[state]["schemes"].append(scheme.get("name"))
        
        return state_coverage
    
    def get_active_schemes(self) -> List[dict]:
        """Get all active schemes"""
        return self.list_schemes(status="Active")
    
    def get_major_schemes_status(self) -> Dict:
        """Get status of major Pradhan Mantri Yojanas"""
        all_schemes = self.repository.list_schemes(limit=1000)
        major_status = {}
        
        for major_code, major_name in MAJOR_SCHEMES.items():
            matching = [s for s in all_schemes 
                       if major_code in s.get("scheme_code", "")]
            
            if matching:
                scheme = matching[0]
                major_status[major_code] = {
                    "name": major_name,
                    "budget": scheme.get("budget_allocated", 0),
                    "status": scheme.get("status"),
                    "beneficiaries": scheme.get("target_beneficiaries", 0),
                    "implementation_agency": scheme.get("ministry")
                }
        
        return major_status
    
    def get_scheme_analytics(self) -> Dict:
        """Get comprehensive scheme analytics"""
        all_schemes = self.repository.list_schemes(limit=1000)
        
        total_budget = sum(s.get("budget_allocated", 0) for s in all_schemes)
        total_beneficiaries = sum(s.get("target_beneficiaries", 0) for s in all_schemes)
        
        scheme_types = {}
        for scheme in all_schemes:
            scheme_type = scheme.get("scheme_type")
            if scheme_type not in scheme_types:
                scheme_types[scheme_type] = {"count": 0, "budget": 0}
            scheme_types[scheme_type]["count"] += 1
            scheme_types[scheme_type]["budget"] += scheme.get("budget_allocated", 0)
        
        status_distribution = {}
        for scheme in all_schemes:
            status = scheme.get("status")
            if status not in status_distribution:
                status_distribution[status] = 0
            status_distribution[status] += 1
        
        return {
            "total_schemes": len(all_schemes),
            "total_budget": total_budget,
            "total_beneficiaries": total_beneficiaries,
            "avg_budget_per_scheme": total_budget / len(all_schemes) if all_schemes else 0,
            "schemes_by_type": scheme_types,
            "schemes_by_status": status_distribution,
            "states_covered": len(set(state for s in all_schemes 
                                      for state in s.get("coverage_states", []))),
            "ministries_involved": len(set(s.get("ministry") for s in all_schemes))
        }
    
    def update_scheme_status(self, document_id: str, new_status: str) -> Optional[dict]:
        """Update scheme status"""
        if new_status not in SCHEME_STATUSES:
            logger.warning(f"Invalid status: {new_status}")
            return None
        
        return self.repository.update_scheme(
            document_id=document_id,
            updates={"status": new_status}
        )
    
    def search_schemes(self, query: str) -> List[dict]:
        """Search schemes by name or description"""
        all_schemes = self.repository.list_schemes(limit=1000)
        query_lower = query.lower()
        
        return [s for s in all_schemes
                if query_lower in s.get("name", "").lower() or
                   query_lower in s.get("name_hindi", "").lower() or
                   query_lower in s.get("description", "").lower()]
    
    def get_budget_by_state(self, state: str) -> float:
        """Calculate total budget allocated to a state"""
        schemes = self.get_schemes_by_state(state)
        return sum(s.get("budget_allocated", 0) for s in schemes)
    
    def get_scheme_statistics(self) -> dict:
        """Get statistics about schemes"""
        schemes = self.repository.list_schemes(limit=1000)
        
        if not schemes:
            return {
                "total_schemes": 0,
                "total_budget": 0,
                "active_schemes": 0,
                "total_beneficiaries": 0
            }
        
        return {
            "total_schemes": len(schemes),
            "total_budget": sum(s.get("budget_allocated", 0) for s in schemes),
            "active_schemes": len([s for s in schemes if s.get("status") == "Active"]),
            "total_beneficiaries": sum(s.get("target_beneficiaries", 0) for s in schemes),
            "by_ministry": self._group_by_ministry(schemes),
            "by_type": self._group_by_type(schemes),
            "by_status": self._group_by_status(schemes)
        }
    
    @staticmethod
    def _group_by_ministry(schemes: List[dict]) -> dict:
        """Group schemes by ministry"""
        grouped = {}
        for scheme in schemes:
            ministry = scheme.get("ministry", "Unknown")
            if ministry not in grouped:
                grouped[ministry] = {"count": 0, "budget": 0}
            grouped[ministry]["count"] += 1
            grouped[ministry]["budget"] += scheme.get("budget_allocated", 0)
        return grouped
    
    @staticmethod
    def _group_by_type(schemes: List[dict]) -> dict:
        """Group schemes by type"""
        grouped = {}
        for scheme in schemes:
            scheme_type = scheme.get("scheme_type", "Unknown")
            if scheme_type not in grouped:
                grouped[scheme_type] = {"count": 0, "budget": 0}
            grouped[scheme_type]["count"] += 1
            grouped[scheme_type]["budget"] += scheme.get("budget_allocated", 0)
        return grouped
    
    @staticmethod
    def _group_by_status(schemes: List[dict]) -> dict:
        """Group schemes by status"""
        grouped = {}
        for scheme in schemes:
            status = scheme.get("status", "Unknown")
            if status not in grouped:
                grouped[status] = 0
            grouped[status] += 1
        return grouped
    
    def update_scheme_status(self, document_id: str, new_status: str) -> Optional[dict]:
        """Update scheme status"""
        valid_statuses = ["Active", "Inactive", "Paused", "Closed"]
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
        
        return self.repository.update_scheme(document_id=document_id, updates={"status": new_status})

