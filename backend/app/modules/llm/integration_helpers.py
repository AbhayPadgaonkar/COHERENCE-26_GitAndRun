"""
LLM Integration Helpers for Explainable AI Layer
Automatically adds natural language explanations to anomalies and analytics
"""

from typing import List, Dict, Optional, Any
from app.modules.llm import AnomalyExplainer, InsightSummarizer, BudgetQA, LMStudioClient
from app.core.logger import logger

# Singleton instances
_client = None
_explainer = None
_summarizer = None
_qa = None


def get_client() -> LMStudioClient:
    """Get or create LLM client singleton"""
    global _client
    if _client is None:
        _client = LMStudioClient()
    return _client


def get_explainer() -> AnomalyExplainer:
    """Get or create anomaly explainer singleton"""
    global _explainer
    if _explainer is None:
        _explainer = AnomalyExplainer(get_client())
    return _explainer


def get_summarizer() -> InsightSummarizer:
    """Get or create insight summarizer singleton"""
    global _summarizer
    if _summarizer is None:
        _summarizer = InsightSummarizer(get_client())
    return _summarizer


def get_qa() -> BudgetQA:
    """Get or create budget QA singleton"""
    global _qa
    if _qa is None:
        _qa = BudgetQA(get_client())
    return _qa


def check_llm_availability() -> Dict[str, Any]:
    """
    Check if LM Studio is available
    
    Returns:
        Dict with 'available' (bool) and 'status' (str)
    """
    try:
        explainer = get_explainer()
        status = explainer.check_llm_status()
        return {
            "available": status.get("llm_available", False),
            "status": status.get("status", "unknown"),
            "model": get_client().model
        }
    except Exception as e:
        logger.error(f"LLM availability check failed: {e}")
        return {
            "available": False,
            "status": "error",
            "error": str(e)
        }


async def add_explanations_to_anomalies(
    anomalies: List[Dict],
    batch: bool = True,
    graceful_degradation: bool = True
) -> Dict[str, Any]:
    """
    Add LLM explanations to detected anomalies (EXPLAINABLE AI LAYER)
    
    This is the core function for making anomalies understandable to government employees.
    Each anomaly gets a natural language explanation of WHY it was flagged.
    
    Args:
        anomalies: List of detected anomaly dictionaries with fields:
                   - id, type, amount, scheme_name, confidence, severity, baseline (optional)
        batch: If True, use batch explanation (more efficient)
        graceful_degradation: If True, returns anomalies without explanations if LLM fails
    
    Returns:
        Dictionary with:
        - anomalies: List with 'ai_explanation' field added to each
        - overall_summary: Batch summary (if batch=True and multiple anomalies)
        - severity_breakdown: Count of anomalies by severity
        - explainable_ai: Status information
    """
    
    if not anomalies:
        return {
            "anomalies": [],
            "overall_summary": None,
            "severity_breakdown": {},
            "explainable_ai": {
                "enabled": False,
                "reason": "no_anomalies"
            }
        }
    
    try:
        explainer = get_explainer()
        
        # Check LLM availability first
        llm_status = check_llm_availability()
        if not llm_status["available"]:
            logger.warning("LLM not available for anomaly explanations")
            if graceful_degradation:
                return _graceful_failure_response(anomalies, "llm_unavailable")
            else:
                raise ConnectionError("LM Studio is not available")
        
        if batch and len(anomalies) > 1:
            # Batch explanation (recommended for multiple anomalies)
            logger.info(f"Generating batch explanations for {len(anomalies)} anomalies")
            
            result = explainer.explain_multiple_anomalies(
                anomalies=[{
                    "anomaly_id": a.get("id") or a.get("anomaly_id"),
                    "type": a.get("type"),
                    "amount": a.get("amount"),
                    "scheme_name": a.get("scheme_name") or a.get("scheme"),
                    "confidence": a.get("confidence", 0.0),
                    "severity": a.get("severity"),
                    "baseline": a.get("baseline"),
                    "details": a.get("details", {})
                } for a in anomalies]
            )
            
            # Add explanations to each anomaly
            for anomaly, explanation_data in zip(anomalies, result["individual_explanations"]):
                anomaly["ai_explanation"] = explanation_data["explanation"]
                anomaly["explanation_confidence"] = explanation_data.get("confidence")
                anomaly["explainable_ai_enabled"] = True
            
            return {
                "anomalies": anomalies,
                "overall_summary": result.get("overall_summary"),
                "severity_breakdown": result.get("severity_breakdown", {}),
                "explainable_ai": {
                    "enabled": True,
                    "mode": "batch",
                    "model": llm_status["model"],
                    "count": len(anomalies)
                }
            }
            
        else:
            # Individual explanations
            logger.info(f"Generating individual explanations for {len(anomalies)} anomaly(ies)")
            
            for anomaly in anomalies:
                result = explainer.explain_anomaly({
                    "anomaly_id": anomaly.get("id") or anomaly.get("anomaly_id"),
                    "type": anomaly.get("type"),
                    "amount": anomaly.get("amount"),
                    "scheme_name": anomaly.get("scheme_name") or anomaly.get("scheme"),
                    "confidence": anomaly.get("confidence", 0.0),
                    "severity": anomaly.get("severity"),
                    "baseline": anomaly.get("baseline"),
                    "details": anomaly.get("details", {})
                })
                
                anomaly["ai_explanation"] = result["explanation"]
                anomaly["explanation_confidence"] = result.get("confidence")
                anomaly["explainable_ai_enabled"] = True
            
            # Calculate severity breakdown
            severity_breakdown = {}
            for anomaly in anomalies:
                severity = anomaly.get("severity", "unknown")
                severity_breakdown[severity] = severity_breakdown.get(severity, 0) + 1
            
            return {
                "anomalies": anomalies,
                "overall_summary": None,  # No summary for individual mode
                "severity_breakdown": severity_breakdown,
                "explainable_ai": {
                    "enabled": True,
                    "mode": "individual",
                    "model": llm_status["model"],
                    "count": len(anomalies)
                }
            }
            
    except Exception as e:
        logger.error(f"Failed to add anomaly explanations: {e}")
        
        if graceful_degradation:
            return _graceful_failure_response(anomalies, "error", str(e))
        else:
            raise


async def add_dashboard_summary(
    dashboard_data: Dict,
    dashboard_name: str = "Dashboard",
    level: str = "central",
    graceful_degradation: bool = True
) -> Dict[str, Any]:
    """
    Add LLM executive summary to dashboard data (EXPLAINABLE AI LAYER)
    
    Government employees get a natural language summary of what the data means.
    
    Args:
        dashboard_data: Dashboard metrics dictionary
        dashboard_name: Name of the dashboard
        level: One of 'central', 'state', 'district'
        graceful_degradation: If True, returns data without summary if LLM fails
    
    Returns:
        Dictionary with original data plus:
        - executive_summary: Natural language summary
        - key_insights: List of important points
        - explainable_ai: Status information
    """
    
    try:
        # Check LLM availability
        llm_status = check_llm_availability()
        if not llm_status["available"]:
            logger.warning("LLM not available for dashboard summary")
            if graceful_degradation:
                return {
                    **dashboard_data,
                    "executive_summary": None,
                    "key_insights": [],
                    "explainable_ai": {
                        "enabled": False,
                        "reason": "llm_unavailable"
                    }
                }
            else:
                raise ConnectionError("LM Studio is not available")
        
        logger.info(f"Generating executive summary for {dashboard_name}")
        
        summarizer = get_summarizer()
        result = summarizer.summarize_dashboard(
            dashboard_data=dashboard_data,
            dashboard_name=dashboard_name,
            level=level
        )
        
        return {
            **dashboard_data,
            "executive_summary": result["summary"],
            "key_insights": result.get("key_points", []),
            "explainable_ai": {
                "enabled": True,
                "model": llm_status["model"],
                "dashboard_type": level
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to add dashboard summary: {e}")
        
        if graceful_degradation:
            return {
                **dashboard_data,
                "executive_summary": None,
                "key_insights": [],
                "explainable_ai": {
                    "enabled": False,
                    "reason": "error",
                    "error": str(e)
                }
            }
        else:
            raise


def _graceful_failure_response(
    anomalies: List[Dict],
    reason: str,
    error: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create response when LLM explanations fail
    Ensures anomalies are still returned to government employees
    """
    
    # Add fallback explanation to each anomaly
    for anomaly in anomalies:
        anomaly["ai_explanation"] = None
        anomaly["explainable_ai_enabled"] = False
        anomaly["fallback_explanation"] = _generate_fallback_explanation(anomaly)
    
    # Calculate severity breakdown
    severity_breakdown = {}
    for anomaly in anomalies:
        severity = anomaly.get("severity", "unknown")
        severity_breakdown[severity] = severity_breakdown.get(severity, 0) + 1
    
    return {
        "anomalies": anomalies,
        "overall_summary": None,
        "severity_breakdown": severity_breakdown,
        "explainable_ai": {
            "enabled": False,
            "reason": reason,
            "error": error,
            "fallback_mode": True
        }
    }


def _generate_fallback_explanation(anomaly: Dict) -> str:
    """
    Generate simple rule-based explanation when LLM is unavailable
    Not as good as LLM, but better than nothing for government employees
    """
    
    anomaly_type = anomaly.get("type", "unknown")
    severity = anomaly.get("severity", "unknown")
    scheme = anomaly.get("scheme_name") or anomaly.get("scheme", "Unknown Scheme")
    amount = anomaly.get("amount", 0)
    
    # Format amount in Crore
    amount_cr = amount / 10000000  # Convert to Crore
    amount_str = f"₹{amount_cr:.2f} Crore"
    
    # Simple template-based explanations
    if anomaly_type == "sudden_spike":
        return f"Sudden increase detected in {scheme} spending ({amount_str}). This {severity} anomaly requires investigation to verify if the surge is legitimate or requires corrective action."
    
    elif anomaly_type == "sudden_drop":
        return f"Sudden decrease detected in {scheme} spending ({amount_str}). This {severity} anomaly may indicate implementation delays or fund diversion requiring attention."
    
    elif anomaly_type == "duplicate_payment":
        return f"Potential duplicate payment detected in {scheme} ({amount_str}). This {severity} issue requires verification to prevent fund misuse."
    
    elif anomaly_type == "fund_idle":
        return f"Funds sitting idle in {scheme} ({amount_str}). This {severity} situation may lead to under-utilization and requires expedited disbursement."
    
    elif anomaly_type == "unusual_pattern":
        return f"Unusual transaction pattern detected in {scheme} ({amount_str}). This {severity} anomaly deviates from expected behavior and needs review."
    
    else:
        return f"{severity.title()} anomaly detected in {scheme} involving {amount_str}. Manual investigation recommended to determine root cause and corrective measures."
