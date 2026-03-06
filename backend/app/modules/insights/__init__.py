"""Insights and Alerts Module"""
from typing import List, Dict
from datetime import datetime


class AlertEngine:
    """Generate alerts from data"""
    
    @staticmethod
    def generate_alerts(anomalies: List[Dict], predictions: List[Dict]) -> List[Dict]:
        """Generate actionable alerts"""
        alerts = []
        
        # Alerts from anomalies
        for anomaly in anomalies:
            alerts.append({
                "type": "anomaly_detected",
                "severity": anomaly.get("severity"),
                "message": f"Anomaly detected: {anomaly.get('description')}",
                "scheme_id": anomaly.get("scheme_id"),
                "timestamp": anomaly.get("detected_date"),
                "action": "Review spending pattern" if anomaly.get("severity") != "critical" else "Immediate investigation required"
            })
        
        # Alerts from predictions
        for prediction in predictions:
            if prediction.get("lapse_probability", 0) > 0.5:
                alerts.append({
                    "type": "fund_lapse_risk",
                    "severity": "warning" if prediction.get("lapse_probability") < 0.7 else "critical",
                    "message": f"Fund lapse risk: {prediction.get('predicted_lapse_amount')} might be wasted",
                    "scheme_id": prediction.get("scheme_id"),
                    "timestamp": prediction.get("prediction_date"),
                    "action": f"Accelerate spending or reallocate funds within {prediction.get('days_to_lapse')} days"
                })
        
        return alerts


class RiskPrioritization:
    """Prioritize risks for decision-makers"""
    
    @staticmethod
    def prioritize_risks(alerts: List[Dict]) -> List[Dict]:
        """Prioritize alerts by impact and urgency"""
        # Score each alert
        scored_alerts = []
        
        for alert in alerts:
            severity_score = {"critical": 3, "warning": 2, "info": 1}.get(alert.get("severity"), 0)
            
            if alert.get("type") == "fund_lapse_risk":
                urgency_score = 3  # High urgency
            elif alert.get("type") == "anomaly_detected":
                urgency_score = 2
            else:
                urgency_score = 1
            
            total_score = severity_score + urgency_score
            scored_alerts.append({
                **alert,
                "priority_score": total_score,
                "priority": "P0" if total_score >= 5 else "P1" if total_score >= 3 else "P2"
            })
        
        # Sort by priority
        return sorted(scored_alerts, key=lambda x: x.get("priority_score"), reverse=True)


class InsightGenerator:
    """Generate insights from data"""
    
    @staticmethod
    def generate_executive_summary(schemes: List[Dict], analytics: Dict) -> Dict:
        """Generate executive summary"""
        total_allocated = sum(s.get("budget_allocated", 0) for s in schemes)
        total_spent = sum(s.get("spent", 0) for s in schemes)
        overall_utilization = (total_spent / total_allocated * 100) if total_allocated > 0 else 0
        
        return {
            "total_schemes": len(schemes),
            "total_allocated": total_allocated,
            "total_spent": total_spent,
            "overall_utilization_percentage": overall_utilization,
            "status": "on_track" if overall_utilization >= 70 else "at_risk" if overall_utilization < 40 else "acceptable",
            "generated_at": datetime.now()
        }
    
    @staticmethod
    def generate_actionable_insights(alerts: List[Dict], suggestions: List[Dict]) -> Dict:
        """Generate actionable insights for decision makers"""
        return {
            "immediate_actions": [a for a in alerts if a.get("priority") == "P0"],
            "optimization_opportunities": suggestions,
            "key_metrics": {
                "total_alerts": len(alerts),
                "critical_alerts": len([a for a in alerts if a.get("severity") == "critical"]),
                "optimization_potential": sum(s.get("suggested_amount", 0) for s in suggestions)
            }
        }


class InsightsService:
    """Business logic for insights"""
    
    def __init__(self):
        self.alert_engine = AlertEngine()
        self.risk_prioritization = RiskPrioritization()
        self.insight_generator = InsightGenerator()
    
    def get_alerts(self, anomalies: List[Dict], predictions: List[Dict]) -> List[Dict]:
        """Get generated alerts"""
        alerts = self.alert_engine.generate_alerts(anomalies, predictions)
        return self.risk_prioritization.prioritize_risks(alerts)
    
    def get_executive_dashboard(self, schemes: List[Dict], analytics_results: Dict) -> Dict:
        """Get executive dashboard data"""
        summary = self.insight_generator.generate_executive_summary(schemes, analytics_results)
        return {
            "summary": summary,
            "last_updated": datetime.now()
        }
    
    def get_actionable_insights(self, alerts: List[Dict], optimization_suggestions: List[Dict]) -> Dict:
        """Get actionable insights"""
        return self.insight_generator.generate_actionable_insights(alerts, optimization_suggestions)
