"""Optimization and Reallocation Module"""
from typing import List, Dict, Tuple
from app.database.schemas import ReallocationSuggestion, OptimizationResponse


class ConstraintSolver:
    """Solve reallocation constraints"""
    
    @staticmethod
    def calculate_available_funds(allocated: float, spent: float, committed: float = 0) -> float:
        """Calculate available funds for reallocation"""
        return max(0, allocated - spent - committed)
    
    @staticmethod
    def check_reallocation_feasibility(from_scheme_id: int, to_scheme_id: int,
                                      amount: float, available: float) -> bool:
        """Check if reallocation is feasible"""
        return amount <= available and amount > 0


class ReallocationEngine:
    """Engine for suggesting optimal reallocations"""
    
    def __init__(self):
        self.constraints = ConstraintSolver()
    
    def suggest_reallocations(self, schemes: List[Dict], utilization_status: Dict) -> List[ReallocationSuggestion]:
        """Generate reallocation suggestions"""
        suggestions = []
        
        # Find underutilized schemes
        underutilized = []
        for scheme in schemes:
            scheme_id = scheme.get("id")
            util = utilization_status.get(scheme_id, {})
            util_pct = util.get("utilization_percentage", 0)
            
            if util_pct < 0.5:  # Less than 50% utilization
                available = self.constraints.calculate_available_funds(
                    scheme.get("budget_allocated", 0),
                    util.get("spent", 0)
                )
                
                underutilized.append({
                    "scheme_id": scheme_id,
                    "available_amount": available,
                    "utilization_percentage": util_pct
                })
        
        # Find schemes needing funds (high utilization)
        needs_funds = []
        for scheme in schemes:
            scheme_id = scheme.get("id")
            util = utilization_status.get(scheme_id, {})
            util_pct = util.get("utilization_percentage", 0)
            
            if util_pct > 0.85:  # More than 85% utilization
                needs_funds.append({
                    "scheme_id": scheme_id,
                    "projected_need": util.get("remaining", 0)
                })
        
        # Match underutilized with needy schemes
        for under in underutilized:
            for need in needs_funds:
                if under["scheme_id"] != need["scheme_id"] and under["available_amount"] > 0:
                    transfer_amount = min(under["available_amount"], need["projected_need"])
                    if transfer_amount > 0:
                        suggestion = ReallocationSuggestion(
                            from_scheme_id=under["scheme_id"],
                            to_scheme_id=need["scheme_id"],
                            suggested_amount=transfer_amount,
                            reason=f"Reallocate from underutilized scheme to high-demand scheme",
                            expected_improvement=transfer_amount / (need["projected_need"] + 1) * 100
                        )
                        suggestions.append(suggestion)
        
        return suggestions


class OptimizationService:
    """Business logic for budget optimization"""
    
    def __init__(self):
        self.engine = ReallocationEngine()
    
    def get_optimization_suggestions(self, schemes: List[Dict], utilization_data: Dict) -> OptimizationResponse:
        """Get reallocation suggestions"""
        suggestions = self.engine.suggest_reallocations(schemes, utilization_data)
        
        total_optimizable = sum(s.suggested_amount for s in suggestions)
        
        return OptimizationResponse(
            suggestions=suggestions,
            total_optimizable_amount=total_optimizable
        )
    
    def simulate_reallocation(self, from_scheme_utilization: Dict, to_scheme_utilization: Dict,
                             amount: float) -> Dict:
        """Simulate impact of reallocation"""
        new_from_util = from_scheme_utilization.copy()
        new_to_util = to_scheme_utilization.copy()
        
        # Adjust spending
        new_from_util["spent"] = from_scheme_utilization.get("spent", 0) - amount
        new_to_util["spent"] = to_scheme_utilization.get("spent", 0) + amount
        
        # Recalculate percentages
        if from_scheme_utilization.get("allocated", 0) > 0:
            new_from_util["utilization_percentage"] = (
                new_from_util["spent"] / from_scheme_utilization.get("allocated", 1) * 100
            )
        
        if to_scheme_utilization.get("allocated", 0) > 0:
            new_to_util["utilization_percentage"] = (
                new_to_util["spent"] / to_scheme_utilization.get("allocated", 1) * 100
            )
        
        return {
            "from_scheme": new_from_util,
            "to_scheme": new_to_util,
            "improvement_in_to_scheme": (
                new_to_util.get("utilization_percentage", 0) - 
                to_scheme_utilization.get("utilization_percentage", 0)
            )
        }
