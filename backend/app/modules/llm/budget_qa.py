"""
Budget Q&A - Natural language interface for querying financial data
"""

from typing import Dict, List, Optional
from .llm_client import LMStudioClient
from .prompt_templates import (
    get_system_message,
    get_qa_prompt,
    format_currency
)


class BudgetQA:
    """
    Natural language Q&A interface for government budget queries
    """
    
    def __init__(self, llm_client: Optional[LMStudioClient] = None):
        """
        Initialize Budget Q&A system
        
        Args:
            llm_client: Optional pre-configured LMStudioClient
        """
        self.llm = llm_client or LMStudioClient()
        self.system_message = get_system_message("budget_qa")
        self.conversation_history: Dict[str, List[Dict]] = {}
    
    def ask_question(
        self,
        question: str,
        context_data: Optional[Dict] = None,
        session_id: Optional[str] = None
    ) -> Dict:
        """
        Answer a natural language question about budget data
        
        Args:
            question: User's question in natural language
            context_data: Relevant financial data to inform the answer
            session_id: Optional session ID for conversation tracking
            
        Returns:
            Dictionary with answer and metadata
        """
        # Prepare context from data
        context_text = self._format_context_data(context_data) if context_data else "No specific data provided. Please provide general guidance."
        
        # Create prompt
        prompt_data = {
            "question": question,
            "data": context_text
        }
        prompt = get_qa_prompt(question, "with_data", prompt_data)
        
        # Get conversation history if session exists
        if session_id and session_id in self.conversation_history:
            answer = self.llm.generate_with_context(
                prompt=prompt,
                context=self.conversation_history[session_id],
                system_message=self.system_message
            )
        else:
            answer = self.llm.generate(
                prompt=prompt,
                system_message=self.system_message,
                temperature=0.6,
                max_tokens=1000
            )
        
        # Store in conversation history
        if session_id:
            if session_id not in self.conversation_history:
                self.conversation_history[session_id] = []
            
            self.conversation_history[session_id].append({
                "role": "user",
                "content": question
            })
            self.conversation_history[session_id].append({
                "role": "assistant",
                "content": answer
            })
            
            # Keep only last 10 exchanges to avoid context overflow
            if len(self.conversation_history[session_id]) > 20:
                self.conversation_history[session_id] = self.conversation_history[session_id][-20:]
        
        return {
            "question": question,
            "answer": answer,
            "session_id": session_id,
            "has_context": context_data is not None
        }
    
    def ask_about_scheme(
        self,
        question: str,
        scheme_data: Dict
    ) -> Dict:
        """
        Answer questions about a specific government scheme
        
        Args:
            question: User's question about the scheme
            scheme_data: Complete scheme information
            
        Returns:
            Dictionary with answer and scheme context
        """
        scheme_context = self._format_scheme_data(scheme_data)
        
        prompt_data = {
            "question": question,
            "scheme_name": scheme_data.get("name", "Unknown Scheme"),
            "scheme_data": scheme_context
        }
        
        prompt = get_qa_prompt(question, "scheme_info", prompt_data)
        
        answer = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.5,
            max_tokens=1000
        )
        
        return {
            "question": question,
            "answer": answer,
            "scheme_name": scheme_data.get("name"),
            "scheme_id": scheme_data.get("id")
        }
    
    def compare_entities(
        self,
        question: str,
        entities_data: List[Dict],
        entity_type: str = "state"
    ) -> Dict:
        """
        Answer comparative questions about multiple entities (states, districts, schemes)
        
        Args:
            question: Comparative question
            entities_data: List of entity data to compare
            entity_type: Type of entity (state, district, scheme, etc.)
            
        Returns:
            Dictionary with comparative analysis
        """
        comparison_text = self._format_comparative_data(entities_data, entity_type)
        
        prompt_data = {
            "question": question,
            "comparison_data": comparison_text
        }
        
        prompt = get_qa_prompt(question, "comparative", prompt_data)
        
        answer = self.llm.generate(
            prompt=prompt,
            system_message=self.system_message,
            temperature=0.6,
            max_tokens=1200
        )
        
        return {
            "question": question,
            "answer": answer,
            "entity_type": entity_type,
            "entities_compared": len(entities_data)
        }
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Get conversation history for a session"""
        return self.conversation_history.get(session_id, [])
    
    def _format_context_data(self, data: Dict) -> str:
        """Format financial data as context for the LLM"""
        formatted_lines = []
        
        # Format different types of financial data
        if "schemes" in data:
            formatted_lines.append("Schemes:")
            for scheme in data["schemes"][:10]:  # Limit to 10
                formatted_lines.append(
                    f"  - {scheme.get('name', 'Unknown')}: "
                    f"Budget: {format_currency(scheme.get('total_budget', 0))}, "
                    f"Ministry: {scheme.get('ministry', 'Unknown')}"
                )
        
        if "fund_flows" in data:
            formatted_lines.append("\nFund Flows:")
            total = sum(ff.get("amount", 0) for ff in data["fund_flows"])
            formatted_lines.append(f"  Total: {format_currency(total)}")
            formatted_lines.append(f"  Transactions: {len(data['fund_flows'])}")
        
        if "financial_metrics" in data:
            metrics = data["financial_metrics"]
            formatted_lines.append("\nFinancial Metrics:")
            formatted_lines.append(f"  Allocated: {format_currency(metrics.get('total_allocated', 0))}")
            formatted_lines.append(f"  Spent: {format_currency(metrics.get('total_spent', 0))}")
            formatted_lines.append(f"  Utilization: {metrics.get('utilization_percentage', 0):.2f}%")
            formatted_lines.append(f"  Remaining: {format_currency(metrics.get('remaining_balance', 0))}")
        
        if "anomalies" in data:
            formatted_lines.append(f"\nAnomalies Detected: {len(data['anomalies'])}")
            for anom in data["anomalies"][:5]:
                formatted_lines.append(
                    f"  - {anom.get('type', 'Unknown').replace('_', ' ').title()}: "
                    f"{anom.get('severity', 'info').upper()}"
                )
        
        return "\n".join(formatted_lines) if formatted_lines else "No data available"
    
    def _format_scheme_data(self, scheme: Dict) -> str:
        """Format scheme information for LLM"""
        lines = [
            f"Scheme Name: {scheme.get('name', 'Unknown')}",
            f"Ministry: {scheme.get('ministry', 'Not specified')}",
            f"Total Budget: {format_currency(scheme.get('total_budget', 0))}",
            f"Coverage: {scheme.get('coverage_type', 'Unknown')}",
            f"Start Date: {scheme.get('start_date', 'Not specified')}",
            f"End Date: {scheme.get('end_date', 'Not specified')}",
        ]
        
        if "description" in scheme:
            lines.append(f"Description: {scheme['description']}")
        
        if "beneficiary_type" in scheme:
            lines.append(f"Beneficiary Type: {scheme['beneficiary_type']}")
        
        return "\n".join(lines)
    
    def _format_comparative_data(self, entities: List[Dict], entity_type: str) -> str:
        """Format multiple entities for comparison"""
        lines = [f"Comparing {len(entities)} {entity_type}s:\n"]
        
        for i, entity in enumerate(entities, 1):
            lines.append(f"{i}. {entity.get('name', entity.get('id', 'Unknown'))}")
            
            if "total_allocated" in entity:
                lines.append(f"   Allocated: {format_currency(entity['total_allocated'])}")
            if "total_spent" in entity:
                lines.append(f"   Spent: {format_currency(entity['total_spent'])}")
            if "utilization_percentage" in entity:
                lines.append(f"   Utilization: {entity['utilization_percentage']:.2f}%")
            
            lines.append("")  # Blank line between entities
        
        return "\n".join(lines)
