"""
LLM Intelligence API Routes - Natural Language Interface
"""

from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.modules.llm import (
    LMStudioClient,
    AnomalyExplainer,
    BudgetQA,
    InsightSummarizer
)

router = APIRouter(prefix="/llm", tags=["LLM Intelligence"])

# Lazy initialization of LLM components
_llm_client = None
_anomaly_explainer = None
_budget_qa = None
_insight_summarizer = None

def get_llm_client():
    """Get or create LLM client"""
    global _llm_client
    if _llm_client is None:
        _llm_client = LMStudioClient()
    return _llm_client

def get_anomaly_explainer():
    """Get or create anomaly explainer"""
    global _anomaly_explainer
    if _anomaly_explainer is None:
        _anomaly_explainer = AnomalyExplainer(get_llm_client())
    return _anomaly_explainer

def get_budget_qa():
    """Get or create budget QA"""
    global _budget_qa
    if _budget_qa is None:
        _budget_qa = BudgetQA(get_llm_client())
    return _budget_qa

def get_insight_summarizer():
    """Get or create insight summarizer"""
    global _insight_summarizer
    if _insight_summarizer is None:
        _insight_summarizer = InsightSummarizer(get_llm_client())
    return _insight_summarizer


# ==================== Pydantic Models ====================

class AnomalyExplanationRequest(BaseModel):
    anomaly_id: str
    type: str
    amount: float
    scheme_name: Optional[str] = "Unknown Scheme"
    confidence: Optional[float] = 0.0
    severity: Optional[str] = "info"
    detected_at: Optional[str] = None
    baseline: Optional[float] = None
    details: Optional[str] = None


class QuestionRequest(BaseModel):
    question: str
    context_data: Optional[Dict] = None
    session_id: Optional[str] = None


class SchemeQuestionRequest(BaseModel):
    question: str
    scheme_data: Dict


class ComparisonRequest(BaseModel):
    question: str
    entities_data: List[Dict]
    entity_type: str = "state"


class DashboardSummaryRequest(BaseModel):
    dashboard_data: Dict
    dashboard_name: str = "Financial Dashboard"
    level: str = "central"


class AnomalySummaryRequest(BaseModel):
    anomalies: List[Dict]
    time_period: str = "recent"


class ExecutiveBriefRequest(BaseModel):
    analysis_type: str
    findings: Dict
    period: str = "Current FY"
    scope: str = "National"


class RecommendationsRequest(BaseModel):
    issues: List[Dict]
    context: str = "general"


# ==================== Health Check ====================

@router.get("/status")
async def check_llm_status():
    """
    Check if LM Studio is running and accessible
    """
    status = get_anomaly_explainer().check_llm_status()
    return {
        "service": "LLM Intelligence Layer",
        **status,
        "features": ["Anomaly Explanation", "Budget Q&A", "Insight Summarization"]
    }


# ==================== Anomaly Explanation ====================

@router.post("/explain-anomaly")
async def explain_anomaly(request: AnomalyExplanationRequest):
    """
    Generate natural language explanation for a detected anomaly
    
    **Example:**
    ```json
    {
        "anomaly_id": "anom_001",
        "type": "sudden_spike",
        "amount": 5000000000,
        "scheme_name": "PM-KISAN",
        "confidence": 0.95,
        "severity": "critical",
        "baseline": 510000000
    }
    ```
    """
    try:
        anomaly_data = request.dict()
        explanation = get_anomaly_explainer().explain_anomaly(anomaly_data)
        
        return {
            "success": True,
            "explanation": explanation,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining anomaly: {str(e)}")


@router.post("/explain-multiple-anomalies")
async def explain_multiple_anomalies(anomalies: List[Dict] = Body(...), summary_type: str = "brief"):
    """
    Explain multiple anomalies with an overall summary
    
    **Parameters:**
    - anomalies: List of anomaly data dictionaries
    - summary_type: "brief" or "detailed"
    """
    try:
        result = get_anomaly_explainer().explain_multiple_anomalies(anomalies, summary_type)
        
        return {
            "success": True,
            **result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining anomalies: {str(e)}")


# ==================== Budget Q&A ====================

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Ask a natural language question about budget data
    
    **Example:**
    ```json
    {
        "question": "What is the total spending in Maharashtra?",
        "context_data": {
            "financial_metrics": {
                "total_allocated": 100000000000,
                "total_spent": 75000000000
            }
        },
        "session_id": "user123_session1"
    }
    ```
    """
    try:
        answer = get_budget_qa().ask_question(
            question=request.question,
            context_data=request.context_data,
            session_id=request.session_id
        )
        
        return {
            "success": True,
            **answer,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")


@router.post("/ask-about-scheme")
async def ask_about_scheme(request: SchemeQuestionRequest):
    """
    Ask questions about a specific government scheme
    
    **Example:**
    ```json
    {
        "question": "What is the budget allocation for this scheme?",
        "scheme_data": {
            "id": "scheme_001",
            "name": "PM-KISAN",
            "ministry": "Agriculture",
            "total_budget": 750000000000
        }
    }
    ```
    """
    try:
        answer = get_budget_qa().ask_about_scheme(
            question=request.question,
            scheme_data=request.scheme_data
        )
        
        return {
            "success": True,
            **answer,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering scheme question: {str(e)}")


@router.post("/compare")
async def compare_entities(request: ComparisonRequest):
    """
    Compare multiple entities (states, districts, schemes)
    
    **Example:**
    ```json
    {
        "question": "Which state has higher utilization?",
        "entities_data": [
            {"name": "Maharashtra", "utilization_percentage": 85.5},
            {"name": "Karnataka", "utilization_percentage": 78.2}
        ],
        "entity_type": "state"
    }
    ```
    """
    try:
        answer = get_budget_qa().compare_entities(
            question=request.question,
            entities_data=request.entities_data,
            entity_type=request.entity_type
        )
        
        return {
            "success": True,
            **answer,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing entities: {str(e)}")


@router.delete("/session/{session_id}")
async def clear_conversation(session_id: str):
    """
    Clear conversation history for a session
    """
    try:
        get_budget_qa().clear_session(session_id)
        return {
            "success": True,
            "message": f"Session {session_id} cleared",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing session: {str(e)}")


@router.get("/session/{session_id}/history")
async def get_conversation_history(session_id: str):
    """
    Get conversation history for a session
    """
    try:
        history = get_budget_qa().get_conversation_history(session_id)
        return {
            "success": True,
            "session_id": session_id,
            "messages": history,
            "message_count": len(history),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


# ==================== Insight Summarization ====================

@router.post("/summarize-dashboard")
async def summarize_dashboard(request: DashboardSummaryRequest):
    """
    Generate executive summary of dashboard data
    
    **Example:**
    ```json
    {
        "dashboard_data": {
            "financial_metrics": {
                "total_allocated": 1000000000000,
                "total_spent": 850000000000,
                "utilization_percentage": 85.0
            },
            "total_schemes": 50,
            "anomaly_summary": {"total": 5, "critical": 2}
        },
        "dashboard_name": "Central Government Dashboard",
        "level": "central"
    }
    ```
    """
    try:
        summary = get_insight_summarizer().summarize_dashboard(
            dashboard_data=request.dashboard_data,
            dashboard_name=request.dashboard_name,
            level=request.level
        )
        
        return {
            "success": True,
            **summary,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing dashboard: {str(e)}")


@router.post("/summarize-anomalies")
async def summarize_anomalies(request: AnomalySummaryRequest):
    """
    Generate summary of anomaly detection results
    """
    try:
        summary = get_insight_summarizer().summarize_anomalies(
            anomalies=request.anomalies,
            time_period=request.time_period
        )
        
        return {
            "success": True,
            **summary,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing anomalies: {str(e)}")


@router.post("/executive-brief")
async def create_executive_brief(request: ExecutiveBriefRequest):
    """
    Create comprehensive executive brief
    
    **Example:**
    ```json
    {
        "analysis_type": "Quarterly Budget Review",
        "findings": {
            "total_spent": 2500000000000,
            "utilization_rate": 82.5,
            "critical_issues": 3
        },
        "period": "Q3 FY 2025-26",
        "scope": "National"
    }
    ```
    """
    try:
        brief = get_insight_summarizer().create_executive_brief(
            analysis_type=request.analysis_type,
            findings=request.findings,
            period=request.period,
            scope=request.scope
        )
        
        return {
            "success": True,
            **brief,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating executive brief: {str(e)}")


@router.post("/recommendations")
async def generate_recommendations(request: RecommendationsRequest):
    """
    Generate actionable recommendations based on identified issues
    
    **Example:**
    ```json
    {
        "issues": [
            {"title": "Low Utilization", "description": "Maharashtra shows 45% utilization"},
            {"title": "Fund Lapse Risk", "description": "₹500 Cr at risk of lapsing"}
        ],
        "context": "utilization"
    }
    ```
    """
    try:
        recommendations = get_insight_summarizer().generate_recommendations(
            issues=request.issues,
            context=request.context
        )
        
        return {
            "success": True,
            **recommendations,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


# ==================== Utility Endpoints ====================

@router.get("/capabilities")
async def get_capabilities():
    """
    Get list of LLM capabilities and example use cases
    """
    return {
        "service": "LLM Intelligence Layer",
        "model": get_llm_client().model,
        "capabilities": {
            "anomaly_explanation": {
                "description": "Explain financial anomalies in natural language",
                "endpoint": "/llm/explain-anomaly",
                "use_cases": [
                    "Sudden spending spikes",
                    "Duplicate payments",
                    "Idle fund detection",
                    "Unusual patterns"
                ]
            },
            "budget_qa": {
                "description": "Natural language Q&A for budget queries",
                "endpoints": ["/llm/ask", "/llm/ask-about-scheme", "/llm/compare"],
                "use_cases": [
                    "Query scheme budgets",
                    "Compare state spending",
                    "Ask about fund flows",
                    "Conversational analysis"
                ]
            },
            "insight_summarization": {
                "description": "Generate executive summaries and insights",
                "endpoints": [
                    "/llm/summarize-dashboard",
                    "/llm/summarize-anomalies",
                    "/llm/executive-brief"
                ],
                "use_cases": [
                    "Dashboard summaries",
                    "Anomaly reports",
                    "Executive briefings",
                    "Action recommendations"
                ]
            }
        },
        "features": {
            "conversation_memory": True,
            "context_aware": True,
            "government_terminology": True,
            "financial_formatting": True
        }
    }
