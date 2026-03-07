"""
LM Studio Client - OpenAI-compatible interface for local Qwen 3 4B
"""

from openai import OpenAI
from typing import Optional, List, Dict
import os


class LMStudioClient:
    """
    Client for LM Studio with Qwen 3 4B model
    Uses OpenAI-compatible API running locally
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:1234/v1",
        model: str = "qwen/qwen3-4b",
        temperature: float = 0.7,
        max_tokens: int = 1000
    ):
        """
        Initialize LM Studio client
        
        Args:
            base_url: LM Studio server URL (default: http://localhost:1234/v1)
            model: Model identifier (default: qwen/qwen3-4b)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
        """
        self.client = OpenAI(
            base_url=base_url,
            api_key="lm-studio"  # LM Studio doesn't require real API key
        )
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate text completion from LM Studio
        
        Args:
            prompt: User prompt/question
            system_message: Optional system instruction
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Returns:
            Generated text response
        """
        messages = []
        
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })
        
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def generate_with_context(
        self,
        prompt: str,
        context: List[Dict[str, str]],
        system_message: Optional[str] = None
    ) -> str:
        """
        Generate response with conversation history
        
        Args:
            prompt: Current user prompt
            context: List of previous messages [{"role": "user/assistant", "content": "..."}]
            system_message: Optional system instruction
            
        Returns:
            Generated text response
        """
        messages = []
        
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })
        
        # Add conversation history
        messages.extend(context)
        
        # Add current prompt
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def check_connection(self) -> bool:
        """
        Check if LM Studio server is accessible
        
        Returns:
            True if server is running, False otherwise
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5
            )
            return True
        except Exception:
            return False
