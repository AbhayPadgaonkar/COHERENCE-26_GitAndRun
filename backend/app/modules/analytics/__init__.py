"""Analytics Module"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.core.firebase import FirebaseConfig
from app.core.logger import logger


class SpendingPatternAnalyzer:
    """Analyze spending patterns"""
    
    @staticmethod
    def analyze_patterns(spending_history: List[Dict]) -> Dict:
        """Analyze spending patterns over time"""
        if not spending_history:
            return {}
        
        amounts = [s.get("amount", 0) for s in spending_history]
        dates = [s.get("date") for s in spending_history]
        
        return {
            "total_spending": sum(amounts),
            "average_spending": sum(amounts) / len(amounts) if amounts else 0,
            "max_spending": max(amounts) if amounts else 0,
            "min_spending": min(amounts) if amounts else 0,
            "spending_count": len(amounts),
            "trend": "increasing" if amounts[-1] > amounts[0] else "decreasing" if len(amounts) > 1 else "stable"
        }
    
    @staticmethod
    def compare_schemes(scheme_data: List[Dict]) -> Dict:
        """Compare performance across schemes"""
        comparison = {}
        
        for scheme in scheme_data:
            scheme_id = scheme.get("id")
            allocated = scheme.get("allocated", 0)
            spent = scheme.get("spent", 0)
            
            comparison[scheme_id] = {
                "allocated": allocated,
                "spent": spent,
                "utilization_percentage": (spent / allocated * 100) if allocated > 0 else 0,
                "remaining": allocated - spent,
                "efficiency_score": (spent / allocated) if allocated > 0 else 0
            }
        
        return comparison


class DistrictAnalyzer:
    """Analyze performance by district"""
    
    @staticmethod
    def analyze_district_performance(district_data: List[Dict]) -> Dict:
        """Analyze spending performance by district"""
        analysis = {}
        
        for district in district_data:
            dist_name = district.get("name")
            allocated = district.get("allocated", 0)
            spent = district.get("spent", 0)
            
            analysis[dist_name] = {
                "allocated": allocated,
                "spent": spent,
                "utilization_percentage": (spent / allocated * 100) if allocated > 0 else 0,
                "implementation_score": min((spent / allocated), 1.0) if allocated > 0 else 0
            }
        
        return analysis
    
    @staticmethod
    def rank_districts(district_analysis: Dict) -> List[tuple]:
        """Rank districts by performance"""
        ranked = sorted(
            district_analysis.items(),
            key=lambda x: x[1].get("utilization_percentage", 0),
            reverse=True
        )
        return ranked


class AnalyticsService:
    """Business logic for analytics"""
    
    def __init__(self):
        self.pattern_analyzer = SpendingPatternAnalyzer()
        self.district_analyzer = DistrictAnalyzer()
    
    def analyze_spending_patterns(self, spending_data: List[Dict]) -> Dict:
        """Analyze spending patterns"""
        return self.pattern_analyzer.analyze_patterns(spending_data)
    
    def compare_scheme_performance(self, scheme_data: List[Dict]) -> Dict:
        """Compare scheme performance"""
        return self.pattern_analyzer.compare_schemes(scheme_data)
    
    def get_district_rankings(self, district_data: List[Dict]) -> Dict:
        """Get district performance rankings"""
        analysis = self.district_analyzer.analyze_district_performance(district_data)
        rankings = self.district_analyzer.rank_districts(analysis)
        
        return {
            "detailed_analysis": analysis,
            "rankings": [{"rank": i+1, "district": name, **data} for i, (name, data) in enumerate(rankings)]
        }
