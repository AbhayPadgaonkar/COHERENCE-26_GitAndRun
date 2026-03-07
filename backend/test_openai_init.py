"""Quick test to check OpenAI client initialization"""
from openai import OpenAI

try:
    client = OpenAI(
        base_url="http://localhost:1234/v1",
        api_key="lm-studio"
    )
    print("✅ OpenAI client initialized successfully")
    print(f"Base URL: {client.base_url}")
except Exception as e:
    print(f"❌ Error initializing OpenAI client: {e}")
    import traceback
    traceback.print_exc()
