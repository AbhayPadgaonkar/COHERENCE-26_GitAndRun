"""
Prompt Templates for Government Financial Analysis
"""

# System messages for different tasks
SYSTEM_MESSAGES = {
    "anomaly_explainer": """You are a financial analyst expert specializing in Indian government budget systems and the Public Financial Management System (PFMS).

Your role is to explain financial anomalies detected in government fund flows in clear, concise language that government officials can understand.

Focus on:
- What the anomaly is
- Why it's significant
- Potential causes
- Recommended actions

Use Indian financial terminology (Crore, Lakh) and reference government processes.""",

    "budget_qa": """You are an AI assistant for the LokNidhi government financial management system.

You help government officials understand budget data, fund flows, scheme information, and financial analytics.

Provide accurate, data-driven answers using the context provided. Cite specific numbers and sources from the data.

Use respectful, professional language appropriate for government officials.""",

    "insight_summarizer": """You are an executive briefing specialist for government finance.

Summarize complex financial data and analytics into clear, actionable executive summaries.

Format your summaries with:
- Key highlights (3-5 bullet points)
- Critical findings
- Recommended actions
- Risk factors

Keep summaries concise and decision-focused."""
}


# Anomaly explanation templates
ANOMALY_TEMPLATES = {
    "sudden_spike": """Analyze this financial anomaly:

Anomaly Type: Sudden Spending Spike
Scheme: {scheme_name}
Amount: ₹{amount} Crore
Baseline Average: ₹{baseline} Crore
Increase: {increase_pct}%
Confidence: {confidence}%
Date: {date}

Additional Context:
{context}

Explain:
1. What caused this spike
2. Is it a legitimate increase or potential concern
3. What actions should be taken""",

    "sudden_drop": """Analyze this financial anomaly:

Anomaly Type: Sudden Spending Drop
Scheme: {scheme_name}
Amount: ₹{amount} Crore
Baseline Average: ₹{baseline} Crore
Decrease: {decrease_pct}%
Confidence: {confidence}%
Date: {date}

Additional Context:
{context}

Explain:
1. Why spending dropped significantly
2. Is this a fund freeze, completion, or problem
3. What should be investigated""",

    "duplicate_payment": """Analyze this financial anomaly:

Anomaly Type: Potential Duplicate Payment
Scheme: {scheme_name}
Amount: ₹{amount} Crore
Occurrences: {count}
Time Window: {timeframe}
Confidence: {confidence}%

Transactions:
{transactions}

Explain:
1. Is this truly a duplicate or legitimate
2. What verification steps are needed
3. Immediate actions required""",

    "fund_idle": """Analyze this financial anomaly:

Anomaly Type: Idle Funds
Agency: {agency_name}
Idle Amount: ₹{amount} Crore
Idle Duration: {days} days
Expected Utilization Date: {expected_date}
Confidence: {confidence}%

Additional Context:
{context}

Explain:
1. Why funds are idle
2. Impact of delayed utilization
3. Steps to accelerate spending""",

    "unusual_pattern": """Analyze this financial anomaly:

Anomaly Type: Unusual Pattern Detected
Scheme: {scheme_name}
Pattern: {pattern_description}
Confidence: {confidence}%
Time Period: {period}

Statistical Details:
{statistics}

Explain:
1. What makes this pattern unusual
2. Possible causes
3. Whether investigation is needed"""
}


# Budget Q&A templates
QA_TEMPLATES = {
    "with_data": """Answer this question about government finances:

Question: {question}

Available Data:
{data}

Provide a clear, accurate answer based on the data. Include specific numbers and calculations.""",

    "scheme_info": """Provide information about this scheme:

Question: {question}
Scheme: {scheme_name}

Scheme Details:
{scheme_data}

Answer comprehensively using the scheme information.""",

    "comparative": """Answer this comparative financial question:

Question: {question}

Data for Comparison:
{comparison_data}

Provide a detailed comparison with percentages and insights."""
}


# Insight summarization templates
SUMMARY_TEMPLATES = {
    "executive_brief": """Create an executive summary for this financial analysis:

Analysis Type: {analysis_type}
Period: {period}
Scope: {scope}

Key Findings:
{findings}

Create a concise executive brief with:
- Top 3-5 highlights
- Critical issues requiring attention
- Recommended actions
- Risk assessment""",

    "anomaly_report": """Summarize these anomaly detection results:

Total Anomalies: {total}
Critical: {critical}
Warning: {warning}
Info: {info}

Top Anomalies:
{anomalies_list}

Provide an executive summary highlighting the most important anomalies and required actions.""",

    "dashboard_summary": """Summarize this dashboard data for executives:

Dashboard: {dashboard_name}
Entity: {entity_name}
Level: {level}

Financial Metrics:
{financial_metrics}

Key Statistics:
{statistics}

Recent Activities:
{activities}

Create a brief executive summary (150-200 words) highlighting key insights and any concerns."""
}


def format_currency(amount: float) -> str:
    """Format amount in Crore/Lakh"""
    # Handle None safely
    amount = float(amount or 0)
    if amount >= 10000000:  # >= 1 Crore
        return f"₹{amount/10000000:.2f} Crore"
    elif amount >= 100000:  # >= 1 Lakh
        return f"₹{amount/100000:.2f} Lakh"
    else:
        return f"₹{amount:,.2f}"


def get_system_message(task: str) -> str:
    """Get system message for a specific task"""
    return SYSTEM_MESSAGES.get(task, SYSTEM_MESSAGES["budget_qa"])


def get_anomaly_prompt(anomaly_type: str, data: dict) -> str:
    """Generate anomaly explanation prompt"""
    template = ANOMALY_TEMPLATES.get(anomaly_type, ANOMALY_TEMPLATES["unusual_pattern"])
    return template.format(**data)


def get_qa_prompt(question: str, context_type: str, data: dict) -> str:
    """Generate Q&A prompt with context"""
    template = QA_TEMPLATES.get(context_type, QA_TEMPLATES["with_data"])
    data["question"] = question
    return template.format(**data)


def get_summary_prompt(summary_type: str, data: dict) -> str:
    """Generate summary prompt"""
    template = SUMMARY_TEMPLATES.get(summary_type, SUMMARY_TEMPLATES["executive_brief"])
    return template.format(**data)
