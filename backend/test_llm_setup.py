"""Test LLM Module Setup
Verify all LLM components are properly configured before starting LM Studio
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_imports():
    """Test if all LLM module imports work"""
    print("Testing LLM module imports...")
    
    try:
        from app.modules.llm import LMStudioClient, AnomalyExplainer, BudgetQA, InsightSummarizer
        print("✅ Core LLM classes imported successfully")
        
        from app.api.llm_routes import router
        print("✅ LLM router imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_initialization():
    """Test if LLM components can be initialized"""
    print("\nTesting LLM component initialization...")
    
    try:
        from app.modules.llm import LMStudioClient, AnomalyExplainer, BudgetQA, InsightSummarizer
        
        # Initialize client (won't connect to LM Studio yet)
        client = LMStudioClient()
        print(f"✅ LMStudioClient initialized (model: {client.model})")
        
        # Initialize feature classes
        explainer = AnomalyExplainer(client)
        print("✅ AnomalyExplainer initialized")
        
        qa = BudgetQA(client)
        print("✅ BudgetQA initialized")
        
        summarizer = InsightSummarizer(client)
        print("✅ InsightSummarizer initialized")
        
        return True
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False

def test_router_setup():
    """Test if router has all expected endpoints"""
    print("\nTesting LLM router configuration...")
    
    try:
        from app.api.llm_routes import router
        
        # Count routes
        route_count = len(router.routes)
        print(f"✅ LLM router has {route_count} endpoints registered")
        
        # List endpoints
        print("\nRegistered endpoints:")
        for route in router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                methods = list(route.methods)
                print(f"  {methods[0]:6} {route.path}")
        
        return True
    except Exception as e:
        print(f"❌ Router error: {e}")
        return False

def main():
    print("="*60)
    print("LLM Intelligence Layer Setup Test")
    print("="*60)
    print()
    
    tests = [
        ("Imports", test_imports),
        ("Initialization", test_initialization),
        ("Router Setup", test_router_setup),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
        print()
    
    # Summary
    print("="*60)
    print("Test Summary:")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All tests passed! LLM module is ready.")
        print("\nNext steps:")
        print("1. Start LM Studio application")
        print("2. Load qwen/qwen3-4b model")
        print("3. Start server on localhost:1234")
        print("4. Start FastAPI backend: python run.bat")
        print("5. Test endpoints: GET http://127.0.0.1:8000/api/v1/llm/status")
    else:
        print("\n❌ Some tests failed. Please fix errors before proceeding.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
