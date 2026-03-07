"""
Gemini Client - Google Generative AI interface
"""

import google.generativeai as genai
from typing import Optional, List, Dict
import os


class LMStudioClient:
    """
    Client for Google Gemini model
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gemini-2.5-flash",
        temperature: float = 0.7,
        max_tokens: int = 1000
    ):
        """
        Initialize Gemini client
        
        Args:
            api_key: Google API key (reads from GEMINI_API_KEY env var if not provided)
            model: Model identifier (default: gemini-2.0-flash-exp)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens in response
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key must be provided or set in GEMINI_API_KEY environment variable")
        
        genai.configure(api_key=self.api_key)
        self.model = model  # Keep as 'model' for compatibility
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._genai_model = genai.GenerativeModel(model)
        
        # For backward compatibility with status checks
        self.base_url = "https://generativelanguage.googleapis.com"
    
    def generate(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate text completion from Gemini
        
        Args:
            prompt: User prompt/question
            system_message: Optional system instruction
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Returns:
            Generated text response
        """
        try:
            # Combine system message with prompt if provided
            full_prompt = prompt
            if system_message:
                full_prompt = f"{system_message}\n\n{prompt}"
            
            generation_config = genai.GenerationConfig(
                temperature=temperature or self.temperature,
                max_output_tokens=max_tokens or self.max_tokens
            )
            
            response = self._genai_model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            return response.text.strip()
            
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
        try:
            # Build conversation history
            conversation = []
            if system_message:
                conversation.append(f"System: {system_message}\n")
            
            for msg in context:
                role = "User" if msg["role"] == "user" else "Assistant"
                conversation.append(f"{role}: {msg['content']}\n")
            
            conversation.append(f"User: {prompt}\n")
            conversation.append("Assistant:")
            
            full_prompt = "\n".join(conversation)
            
            generation_config = genai.GenerationConfig(
                temperature=self.temperature,
                max_output_tokens=self.max_tokens
            )
            
            response = self._genai_model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            return response.text.strip()
            
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    def check_connection(self) -> bool:
        """
        Check if Gemini API is accessible
        
        Returns:
            True if API is accessible, False otherwise
        """
        try:
            generation_config = genai.GenerationConfig(
                max_output_tokens=5
            )
            response = self._genai_model.generate_content(
                "test",
                generation_config=generation_config
            )
            return True
        except Exception:
            return False
