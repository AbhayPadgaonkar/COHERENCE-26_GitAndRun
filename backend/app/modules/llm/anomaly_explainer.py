"""
Anomaly Explainer - Natural language explanations for detected anomalies
"""

from typing import Dict, Optional
from .llm_client import LMStudioClient
from .prompt_templates import (
    get_system_message,
    get_anomaly_prompt,
    format_currency
)


class AnomalyExplainer:
    """
    Generates natural language explanations for financial anomalies
    using LM Studio with Qwen 3 4B
    """
    
    def __init__(self, llm_client: Optional[LMStudioClient] = None):
        """
        Initialize anomaly explainer
        
        Args:
            llm_client: Optional pre-configured LMStudioClient
        """
        self.llm = llm_client or LMStudioClient()
        self.system_message = get_system_message("anomaly_explainer")
    
    def explain_anomaly(
        self,
        anomaly_data: Dict,
        include_recommendations: bool = True
    ) -> Dict[str, str]:
        """
        Generate natural language explanation for an anomaly
        
        Args:
            anomaly_data: Anomaly information from detection system
            include_recommendations: Whether to include action recommendations
            
        Returns:
            Dictionary with explanation, severity assessment, and recommendations
        """
        anomaly_type = anomaly_data.get("type", "unusual_pattern")
        
        # Prepare data for prompt
        prompt_data = self._prepare_anomaly_data(anomaly_data)
        
        # Generate prompt
        prompt = get_anomaly_prompt(anomaly_type, prompt_data)
        
        # Get explanation from LLM
        explanation = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.5,  # Lower temperature for more factual explanations
            max_tokens=800
        )
        
        # Parse and structure the response
        return {
            "anomaly_id": anomaly_data.get("id", "unknown"),
            "type": anomaly_type,
            "explanation": explanation,
            "confidence": anomaly_data.get("confidence", 0),
            "severity": anomaly_data.get("severity", "info"),
            "timestamp": anomaly_data.get("detected_at", "")
        }
    
    def explain_multiple_anomalies(
        self,
        anomalies: list[Dict],
        summary_type: str = "brief"
    ) -> Dict:
        """
        Explain multiple anomalies with a summary
        
        Args:
            anomalies: List of anomaly data dictionaries
            summary_type: "brief" or "detailed"
            
        Returns:
            Dictionary with individual explanations and overall summary
        """
        explanations = []
        
        # Explain each anomaly
        for anomaly in anomalies[:10]:  # Limit to top 10 for performance
            try:
                explanation = self.explain_anomaly(anomaly)
                explanations.append(explanation)
            except Exception as e:
                explanations.append({
                    "anomaly_id": anomaly.get("id", "unknown"),
                    "explanation": f"Error generating explanation: {str(e)}",
                    "error": True
                })
        
        # Generate overall summary if multiple anomalies
        if len(anomalies) > 1:
            summary_prompt = self._create_summary_prompt(anomalies, explanations)
            summary = self.llm.generate(
                prompt=summary_prompt,
                system_message=self.system_message,
                temperature=0.5,
                max_tokens=600
            )
        else:
            summary = explanations[0]["explanation"] if explanations else "No anomalies to explain"
        
        return {
            "total_anomalies": len(anomalies),
            "explained_count": len(explanations),
            "summary": summary,
            "individual_explanations": explanations
        }
    
    def _prepare_anomaly_data(self, anomaly_data: Dict) -> Dict:
        """Prepare and format anomaly data for prompt"""
        anomaly_type = anomaly_data.get("type", "unusual_pattern")
        
        prepared = {
            "scheme_name": anomaly_data.get("scheme_name", "Unknown Scheme"),
            "amount": anomaly_data.get("amount", 0) / 10000000,  # Convert to Crore
            "confidence": anomaly_data.get("confidence", 0) * 100,  # Convert to percentage
            "date": anomaly_data.get("detected_at", "Unknown date"),
            "context": anomaly_data.get("details", "No additional context available")
        }
        
        # Type-specific data
        if anomaly_type == "sudden_spike":
            baseline = anomaly_data.get("baseline", anomaly_data.get("amount", 0) * 0.5)
            prepared["baseline"] = baseline / 10000000
            prepared["increase_pct"] = ((anomaly_data.get("amount", 0) - baseline) / baseline * 100) if baseline > 0 else 0
            
        elif anomaly_type == "sudden_drop":
            baseline = anomaly_data.get("baseline", anomaly_data.get("amount", 0) * 2)
            prepared["baseline"] = baseline / 10000000
            prepared["decrease_pct"] = ((baseline - anomaly_data.get("amount", 0)) / baseline * 100) if baseline > 0 else 0
            
        elif anomaly_type == "duplicate_payment":
            prepared["count"] = anomaly_data.get("count", 2)
            prepared["timeframe"] = anomaly_data.get("timeframe", "same day")
            prepared["transactions"] = anomaly_data.get("transactions", "Details not available")
            
        elif anomaly_type == "fund_idle":
            prepared["agency_name"] = anomaly_data.get("agency_name", "Unknown Agency")
            prepared["days"] = anomaly_data.get("idle_days", 0)
            prepared["expected_date"] = anomaly_data.get("expected_utilization", "Not specified")
            
        else:  # unusual_pattern
            prepared["pattern_description"] = anomaly_data.get("pattern", "Unusual activity detected")
            prepared["period"] = anomaly_data.get("time_period", "Recent period")
            prepared["statistics"] = anomaly_data.get("statistics", "Statistical details not available")
        
        return prepared
    
    def _create_summary_prompt(self, anomalies: list[Dict], explanations: list[Dict]) -> str:
        """Create prompt for summarizing multiple anomalies"""
        anomaly_summary = []
        for i, anom in enumerate(anomalies[:5], 1):  # Top 5 for summary
            anomaly_summary.append(
                f"{i}. {anom.get('type', 'Unknown').replace('_', ' ').title()}: "
                f"₹{anom.get('amount', 0)/10000000:.2f} Crore "
                f"({anom.get('severity', 'info')})"
            )
        
        return f"""Provide an executive summary of these {len(anomalies)} financial anomalies:

{chr(10).join(anomaly_summary)}

Create a brief (150-200 words) summary highlighting:
1. The most critical issues
2. Common patterns or themes
3. Priority actions needed
4. Overall risk assessment"""
    
    def check_llm_status(self) -> Dict:
        """Check if LM Studio is running and accessible"""
        is_connected = self.llm.check_connection()
        return {
            "llm_available": is_connected,
            "model": self.llm.model,
            "endpoint": self.llm.client.base_url,
            "status": "Connected to LM Studio" if is_connected else "LM Studio not accessible"
        }
