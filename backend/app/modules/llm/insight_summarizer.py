"""
Insight Summarizer - Generate executive summaries of financial analytics
"""

from typing import Dict, List, Optional
from .llm_client import LMStudioClient
from .prompt_templates import (
    get_system_message,
    get_summary_prompt,
    format_currency
)


class InsightSummarizer:
    """
    Generates executive summaries and insights from financial data
    """
    
    def __init__(self, llm_client: Optional[LMStudioClient] = None):
        """
        Initialize Insight Summarizer
        
        Args:
            llm_client: Optional pre-configured LMStudioClient
        """
        self.llm = llm_client or LMStudioClient()
        self.system_message = get_system_message("insight_summarizer")
    
    def summarize_dashboard(
        self,
        dashboard_data: Dict,
        dashboard_name: str = "Financial Dashboard",
        level: str = "central"
    ) -> Dict:
        """
        Generate executive summary of dashboard data
        
        Args:
            dashboard_data: Complete dashboard data
            dashboard_name: Name of the dashboard
            level: Level (central, state, district)
            
        Returns:
            Dictionary with summary and key insights
        """
        # Format dashboard data for LLM
        formatted_data = self._format_dashboard_data(dashboard_data)
        
        # Create summary prompt
        prompt_data = {
            "dashboard_name": dashboard_name,
            "entity_name": dashboard_data.get("entity_name", "Government of India"),
            "level": level.title(),
            "financial_metrics": formatted_data["financial_metrics"],
            "statistics": formatted_data["statistics"],
            "activities": formatted_data["activities"]
        }
        
        prompt = get_summary_prompt("dashboard_summary", prompt_data)
        
        # Generate summary
        summary = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.5,
            max_tokens=500
        )
        
        # Extract key points
        key_points = self._extract_key_points(dashboard_data)
        
        return {
            "summary": summary,
            "key_points": key_points,
            "level": level,
            "dashboard_name": dashboard_name,
            "generated_at": dashboard_data.get("timestamp", "")
        }
    
    def summarize_anomalies(
        self,
        anomalies: List[Dict],
        time_period: str = "recent"
    ) -> Dict:
        """
        Generate summary of anomaly detection results
        
        Args:
            anomalies: List of detected anomalies
            time_period: Time period covered
            
        Returns:
            Dictionary with anomaly summary and recommendations
        """
        # Count by severity
        severity_counts = {
            "critical": 0,
            "warning": 0,
            "info": 0
        }
        
        for anom in anomalies:
            severity = anom.get("severity", "info").lower()
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        # Format top anomalies
        top_anomalies = []
        for anom in sorted(anomalies, key=lambda x: x.get("confidence", 0), reverse=True)[:5]:
            top_anomalies.append(
                f"- {anom.get('type', 'Unknown').replace('_', ' ').title()}: "
                f"₹{anom.get('amount', 0)/10000000:.2f} Crore "
                f"({anom.get('severity', 'info').upper()}, "
                f"{anom.get('confidence', 0)*100:.0f}% confidence)"
            )
        
        prompt_data = {
            "total": len(anomalies),
            "critical": severity_counts["critical"],
            "warning": severity_counts["warning"],
            "info": severity_counts["info"],
            "anomalies_list": "\n".join(top_anomalies)
        }
        
        prompt = get_summary_prompt("anomaly_report", prompt_data)
        
        summary = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.5,
            max_tokens=600
        )
        
        return {
            "summary": summary,
            "total_anomalies": len(anomalies),
            "severity_breakdown": severity_counts,
            "time_period": time_period,
            "top_anomalies": top_anomalies[:3]
        }
    
    def create_executive_brief(
        self,
        analysis_type: str,
        findings: Dict,
        period: str = "Current FY",
        scope: str = "National"
    ) -> Dict:
        """
        Create comprehensive executive brief
        
        Args:
            analysis_type: Type of analysis (spending, utilization, etc.)
            findings: Key findings and data points
            period: Time period covered
            scope: Geographic or administrative scope
            
        Returns:
            Dictionary with executive brief
        """
        # Format findings
        formatted_findings = self._format_findings(findings)
        
        prompt_data = {
            "analysis_type": analysis_type,
            "period": period,
            "scope": scope,
            "findings": formatted_findings
        }
        
        prompt = get_summary_prompt("executive_brief", prompt_data)
        
        brief = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.4,  # Lower temperature for formal briefs
            max_tokens=800
        )
        
        return {
            "executive_brief": brief,
            "analysis_type": analysis_type,
            "period": period,
            "scope": scope,
            "findings_count": len(findings) if isinstance(findings, list) else len(findings.keys())
        }
    
    def generate_recommendations(
        self,
        issues: List[Dict],
        context: str = "general"
    ) -> Dict:
        """
        Generate actionable recommendations based on identified issues
        
        Args:
            issues: List of issues/problems identified
            context: Context (budget, utilization, anomaly, etc.)
            
        Returns:
            Dictionary with prioritized recommendations
        """
        # Format issues
        issues_text = []
        for i, issue in enumerate(issues[:10], 1):
            issues_text.append(
                f"{i}. {issue.get('title', 'Issue')}: {issue.get('description', 'No description')}"
            )
        
        prompt = f"""Based on these financial issues in government fund management:

{chr(10).join(issues_text)}

Context: {context}

Provide:
1. Top 3-5 prioritized recommendations
2. Quick wins (actions that can be taken immediately)
3. Long-term improvements
4. Key stakeholders to involve

Format as a clear action plan."""
        
        recommendations = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.6,
            max_tokens=800
        )
        
        return {
            "recommendations": recommendations,
            "issues_analyzed": len(issues),
            "context": context
        }
    
    def _format_dashboard_data(self, data: Dict) -> Dict:
        """Format dashboard data for summarization"""
        formatted = {
            "financial_metrics": "",
            "statistics": "",
            "activities": ""
        }
        
        # Financial metrics
        if "financial_metrics" in data:
            metrics = data["financial_metrics"]
            formatted["financial_metrics"] = f"""
- Total Allocated: {format_currency(metrics.get('total_allocated', 0))}
- Total Spent: {format_currency(metrics.get('total_spent', 0))}
- Utilization Rate: {metrics.get('utilization_percentage', 0):.2f}%
- Remaining Balance: {format_currency(metrics.get('remaining_balance', 0))}
"""
        
        # Statistics
        stats = []
        if "total_schemes" in data:
            stats.append(f"Active Schemes: {data['total_schemes']}")
        if "total_fund_flows" in data:
            stats.append(f"Fund Flow Transactions: {data['total_fund_flows']}")
        if "anomaly_summary" in data:
            anom = data["anomaly_summary"]
            stats.append(f"Anomalies: {anom.get('total', 0)} ({anom.get('critical', 0)} critical)")
        
        formatted["statistics"] = "\n- ".join(stats) if stats else "No statistics available"
        
        # Recent activities
        if "recent_activities" in data and data["recent_activities"]:
            activities = []
            for activity in data["recent_activities"][:5]:
                activities.append(
                    f"- {activity.get('type', 'Transaction')}: {format_currency(activity.get('amount', 0))}"
                )
            formatted["activities"] = "\n".join(activities)
        else:
            formatted["activities"] = "No recent activities recorded"
        
        return formatted
    
    def _extract_key_points(self, dashboard_data: Dict) -> List[str]:
        """Extract key data points from dashboard"""
        key_points = []
        
        if "financial_metrics" in dashboard_data:
            metrics = dashboard_data["financial_metrics"]
            utilization = metrics.get("utilization_percentage", 0)
            
            if utilization < 50:
                key_points.append(f"Low utilization rate: {utilization:.1f}%")
            elif utilization > 90:
                key_points.append(f"High utilization rate: {utilization:.1f}%")
        
        if "anomaly_summary" in dashboard_data:
            anom = dashboard_data["anomaly_summary"]
            if anom.get("critical", 0) > 0:
                key_points.append(f"{anom['critical']} critical anomalies detected")
        
        if "total_schemes" in dashboard_data:
            key_points.append(f"{dashboard_data['total_schemes']} active schemes being monitored")
        
        return key_points[:5]  # Return top 5 key points
    
    def _format_findings(self, findings: Dict) -> str:
        """Format findings for executive brief"""
        if isinstance(findings, list):
            return "\n".join([f"- {finding}" for finding in findings])
        
        formatted = []
        for key, value in findings.items():
            if isinstance(value, (int, float)):
                formatted.append(f"{key}: {format_currency(value) if value > 100000 else value}")
            else:
                formatted.append(f"{key}: {value}")
        
        return "\n".join(formatted)
