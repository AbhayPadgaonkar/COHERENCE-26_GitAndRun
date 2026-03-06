"""Analytics Module"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.core.firebase import FirebaseConfig
from app.core.logger import logger
from app.modules.analytics.repository import AnalyticsRepository


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


class HierarchicalAnalyzer:
    """Analyze data with hierarchical aggregation"""
    
    @staticmethod
    def aggregate_financial_metrics(data: List[Dict]) -> Dict:
        """Aggregate financial metrics from data"""
        total_allocated = sum(d.get('allocated', 0) for d in data)
        total_spent = sum(d.get('spent', 0) for d in data)
        total_amount = sum(d.get('amount', 0) for d in data)
        
        return {
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "total_received": total_amount,
            "utilization_percentage": (total_spent / total_allocated * 100) if total_allocated > 0 else 0,
            "remaining_balance": total_allocated - total_spent
        }
    
    @staticmethod
    def categorize_by_status(data: List[Dict], status_field: str = 'status') -> Dict:
        """Categorize data by status"""
        status_counts = {}
        for item in data:
            status = item.get(status_field, 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
        return status_counts
    
    @staticmethod
    def get_recent_activities(data: List[Dict], limit: int = 10) -> List[Dict]:
        """Get most recent activities"""
        sorted_data = sorted(
            data,
            key=lambda x: x.get('created_at', x.get('date', '')),
            reverse=True
        )
        return sorted_data[:limit]


class AnalyticsService:
    """Business logic for analytics"""
    
    def __init__(self):
        self.pattern_analyzer = SpendingPatternAnalyzer()
        self.district_analyzer = DistrictAnalyzer()
        self.hierarchical_analyzer = HierarchicalAnalyzer()
        self.repository = AnalyticsRepository()
    
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
    
    def get_central_dashboard(self) -> Dict:
        """Get complete central government dashboard with all aggregated metrics"""
        logger.info("Fetching central dashboard data")
        
        # Get all data from repository
        data = self.repository.get_central_aggregated_data()
        
        # Aggregate financial metrics
        financial_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(
            data['fund_flows'] + data['utilization']
        )
        
        # Categorize fund flows by status
        flow_status = self.hierarchical_analyzer.categorize_by_status(data['fund_flows'], 'status')
        
        # Get recent activities
        recent_activities = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], limit=10)
        
        # Count schemes by status
        scheme_status = self.hierarchical_analyzer.categorize_by_status(data['schemes'], 'status')
        
        # Anomaly summary
        anomaly_counts = {
            'total': len(data['anomalies']),
            'critical': len([a for a in data['anomalies'] if a.get('severity') == 'critical']),
            'warning': len([a for a in data['anomalies'] if a.get('severity') == 'warning']),
            'info': len([a for a in data['anomalies'] if a.get('severity') == 'info'])
        }
        
        return {
            "role": "central",
            "level": "Central Government",
            "financial_metrics": financial_metrics,
            "fund_flow_status": flow_status,
            "scheme_status": scheme_status,
            "total_schemes": len(data['schemes']),
            "total_fund_flows": len(data['fund_flows']),
            "anomaly_summary": anomaly_counts,
            "recent_activities": recent_activities,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_central_department_dashboard(self, department_id: str) -> Dict:
        """Get dashboard for specific central department"""
        logger.info(f"Fetching dashboard for central department: {department_id}")
        
        # Get department-specific data
        schemes = self.repository.get_schemes_by_level(level='Central', entity_id=department_id)
        fund_flows = self.repository.get_fund_flows_by_entity(level='Central', entity_id=department_id)
        utilization = self.repository.get_utilization_by_entity(level='Central', entity_id=department_id)
        anomalies = self.repository.get_anomalies_by_entity(entity_id=department_id)
        
        # Aggregate metrics
        financial_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(
            fund_flows + utilization
        )
        
        # Status breakdowns
        flow_status = self.hierarchical_analyzer.categorize_by_status(fund_flows, 'status')
        scheme_status = self.hierarchical_analyzer.categorize_by_status(schemes, 'status')
        
        # Recent activities
        recent_activities = self.hierarchical_analyzer.get_recent_activities(fund_flows, limit=10)
        
        return {
            "role": "central_department",
            "level": "Central Department",
            "department_id": department_id,
            "financial_metrics": financial_metrics,
            "fund_flow_status": flow_status,
            "scheme_status": scheme_status,
            "total_schemes": len(schemes),
            "total_fund_flows": len(fund_flows),
            "utilization_records": len(utilization),
            "anomalies": {
                "total": len(anomalies),
                "critical": len([a for a in anomalies if a.get('severity') == 'critical']),
                "warning": len([a for a in anomalies if a.get('severity') == 'warning'])
            },
            "recent_activities": recent_activities,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_state_dashboard(self, state_id: str) -> Dict:
        """Get dashboard for state government with all districts aggregated"""
        logger.info(f"Fetching dashboard for state: {state_id}")
        
        # Get state-aggregated data
        data = self.repository.get_state_aggregated_data(state_id)
        
        # Aggregate financial metrics
        financial_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(
            data['fund_flows'] + data['utilization']
        )
        
        # Status breakdowns
        flow_status = self.hierarchical_analyzer.categorize_by_status(data['fund_flows'], 'status')
        scheme_status = self.hierarchical_analyzer.categorize_by_status(data['schemes'], 'status')
        
        # Recent activities
        recent_activities = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], limit=10)
        
        # Anomaly summary
        anomaly_counts = {
            'total': len(data['anomalies']),
            'critical': len([a for a in data['anomalies'] if a.get('severity') == 'critical']),
            'warning': len([a for a in data['anomalies'] if a.get('severity') == 'warning']),
            'info': len([a for a in data['anomalies'] if a.get('severity') == 'info'])
        }
        
        return {
            "role": "state",
            "level": "State Government",
            "state_id": state_id,
            "financial_metrics": financial_metrics,
            "fund_flow_status": flow_status,
            "scheme_status": scheme_status,
            "total_schemes": len(data['schemes']),
            "total_fund_flows": len(data['fund_flows']),
            "utilization_records": len(data['utilization']),
            "anomaly_summary": anomaly_counts,
            "recent_activities": recent_activities,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_state_department_dashboard(self, state_id: str, department_id: str) -> Dict:
        """Get dashboard for specific state department"""
        logger.info(f"Fetching dashboard for state department: {state_id}/{department_id}")
        
        # Get department-specific data
        schemes = self.repository.get_schemes_by_level(level='State', entity_id=department_id)
        fund_flows = self.repository.get_fund_flows_by_entity(level='State', entity_id=department_id)
        utilization = self.repository.get_utilization_by_entity(level='State', entity_id=department_id)
        anomalies = self.repository.get_anomalies_by_entity(entity_id=department_id)
        
        # Aggregate metrics
        financial_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(
            fund_flows + utilization
        )
        
        # Status breakdowns
        flow_status = self.hierarchical_analyzer.categorize_by_status(fund_flows, 'status')
        scheme_status = self.hierarchical_analyzer.categorize_by_status(schemes, 'status')
        
        # Recent activities
        recent_activities = self.hierarchical_analyzer.get_recent_activities(fund_flows, limit=10)
        
        return {
            "role": "state_department",
            "level": "State Department",
            "state_id": state_id,
            "department_id": department_id,
            "financial_metrics": financial_metrics,
            "fund_flow_status": flow_status,
            "scheme_status": scheme_status,
            "total_schemes": len(schemes),
            "total_fund_flows": len(fund_flows),
            "utilization_records": len(utilization),
            "anomalies": {
                "total": len(anomalies),
                "critical": len([a for a in anomalies if a.get('severity') == 'critical']),
                "warning": len([a for a in anomalies if a.get('severity') == 'warning'])
            },
            "recent_activities": recent_activities,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_district_dashboard(self, district_id: str) -> Dict:
        """Get dashboard for specific district"""
        logger.info(f"Fetching dashboard for district: {district_id}")
        
        # Get district data
        data = self.repository.get_district_data(district_id)
        
        # Aggregate financial metrics
        financial_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(
            data['fund_flows'] + data['utilization']
        )
        
        # Status breakdowns
        flow_status = self.hierarchical_analyzer.categorize_by_status(data['fund_flows'], 'status')
        
        # Recent activities
        recent_activities = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], limit=10)
        
        # Anomaly summary
        anomaly_counts = {
            'total': len(data['anomalies']),
            'critical': len([a for a in data['anomalies'] if a.get('severity') == 'critical']),
            'warning': len([a for a in data['anomalies'] if a.get('severity') == 'warning']),
            'info': len([a for a in data['anomalies'] if a.get('severity') == 'info'])
        }
        
        return {
            "role": "district",
            "level": "District",
            "district_id": district_id,
            "financial_metrics": financial_metrics,
            "fund_flow_status": flow_status,
            "total_fund_flows": len(data['fund_flows']),
            "utilization_records": len(data['utilization']),
            "anomaly_summary": anomaly_counts,
            "recent_activities": recent_activities,
            "timestamp": datetime.now().isoformat()
        }
        data = self.repository.get_central_aggregated_data()
        
        # Aggregate financial metrics
        scheme_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['schemes'])
        flow_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['fund_flows'])
        util_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['utilization'])
        
        # Categorize anomalies by severity
        anomaly_breakdown = self.hierarchical_analyzer.categorize_by_status(data['anomalies'], 'severity')
        
        # Recent activities
        recent_flows = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], 10)
        
        return {
            "level": "Central",
            "total_schemes": len(data['schemes']),
            "total_fund_flows": len(data['fund_flows']),
            "scheme_metrics": scheme_metrics,
            "fund_flow_metrics": flow_metrics,
            "utilization_metrics": util_metrics,
            "anomaly_summary": {
                "total_anomalies": len(data['anomalies']),
                "by_severity": anomaly_breakdown
            },
            "recent_activities": recent_flows
        }
    
    def get_central_department_dashboard(self, department_id: str) -> Dict:
        """Get dashboard for specific central department"""
        schemes = self.repository.get_schemes_by_level(level='National', entity_id=department_id)
        flows = self.repository.get_fund_flows_by_entity(level='National', entity_id=department_id)
        anomalies = self.repository.get_anomalies_by_entity(entity_id=department_id)
        
        scheme_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(schemes)
        flow_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(flows)
        anomaly_breakdown = self.hierarchical_analyzer.categorize_by_status(anomalies, 'severity')
        
        return {
            "level": "Central Department",
            "department_id": department_id,
            "total_schemes": len(schemes),
            "scheme_metrics": scheme_metrics,
            "fund_flow_metrics": flow_metrics,
            "anomaly_summary": {
                "total_anomalies": len(anomalies),
                "by_severity": anomaly_breakdown
            },
            "schemes": schemes
        }
    
    def get_state_dashboard(self, state_id: str) -> Dict:
        """Get dashboard for state government"""
        data = self.repository.get_state_aggregated_data(state_id)
        
        scheme_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['schemes'])
        flow_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['fund_flows'])
        util_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['utilization'])
        anomaly_breakdown = self.hierarchical_analyzer.categorize_by_status(data['anomalies'], 'severity')
        
        recent_flows = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], 10)
        
        return {
            "level": "State",
            "state_id": state_id,
            "total_schemes": len(data['schemes']),
            "scheme_metrics": scheme_metrics,
            "fund_flow_metrics": flow_metrics,
            "utilization_metrics": util_metrics,
            "anomaly_summary": {
                "total_anomalies": len(data['anomalies']),
                "by_severity": anomaly_breakdown
            },
            "recent_activities": recent_flows
        }
    
    def get_state_department_dashboard(self, state_id: str, department_id: str) -> Dict:
        """Get dashboard for specific state department"""
        schemes = self.repository.get_schemes_by_level(level='State', entity_id=department_id)
        flows = self.repository.get_fund_flows_by_entity(level='State', entity_id=department_id)
        utilization = self.repository.get_utilization_by_entity(level='State', entity_id=department_id)
        anomalies = self.repository.get_anomalies_by_entity(entity_id=department_id)
        
        scheme_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(schemes)
        flow_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(flows)
        util_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(utilization)
        anomaly_breakdown = self.hierarchical_analyzer.categorize_by_status(anomalies, 'severity')
        
        return {
            "level": "State Department",
            "state_id": state_id,
            "department_id": department_id,
            "total_schemes": len(schemes),
            "scheme_metrics": scheme_metrics,
            "fund_flow_metrics": flow_metrics,
            "utilization_metrics": util_metrics,
            "anomaly_summary": {
                "total_anomalies": len(anomalies),
                "by_severity": anomaly_breakdown
            },
            "schemes": schemes
        }
    
    def get_district_dashboard(self, district_id: str) -> Dict:
        """Get dashboard for district"""
        data = self.repository.get_district_data(district_id)
        
        flow_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['fund_flows'])
        util_metrics = self.hierarchical_analyzer.aggregate_financial_metrics(data['utilization'])
        anomaly_breakdown = self.hierarchical_analyzer.categorize_by_status(data['anomalies'], 'severity')
        
        recent_flows = self.hierarchical_analyzer.get_recent_activities(data['fund_flows'], 5)
        
        return {
            "level": "District",
            "district_id": district_id,
            "fund_flow_metrics": flow_metrics,
            "utilization_metrics": util_metrics,
            "anomaly_summary": {
                "total_anomalies": len(data['anomalies']),
                "by_severity": anomaly_breakdown
            },
            "recent_activities": recent_flows,
            "total_fund_flows": len(data['fund_flows'])
        }
