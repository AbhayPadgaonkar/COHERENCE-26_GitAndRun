#!/usr/bin/env python
"""
Verification Script for MetaMask Authentication Backend Setup
Run this to verify all components are properly configured
"""

import sys
import subprocess
import json
from pathlib import Path

def print_status(message, status="✓"):
    """Print formatted status message"""
    colors = {
        "✓": "\033[92m",      # Green
        "✗": "\033[91m",      # Red
        "⚠": "\033[93m",      # Yellow
        "ℹ": "\033[94m"       # Blue
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}{status}{reset} {message}")

def check_python_version():
    """Verify Python 3.11+ is installed"""
    print("\n1. Checking Python Version...")
    version_info = sys.version_info
    version_str = f"{version_info.major}.{version_info.minor}.{version_info.micro}"
    
    if version_info >= (3, 11):
        print_status(f"Python {version_str} ✓", "✓")
        return True
    else:
        print_status(f"Python {version_str} (Need 3.11+) ✗", "✗")
        return False

def check_required_packages():
    """Verify all required packages are installed"""
    print("\n2. Checking Required Packages...")
    
    required = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "firebase_admin",
        "eth_account",
        "eth_keys",
        "eth_utils",
        "hexbytes",
    ]
    
    all_installed = True
    for package in required:
        try:
            __import__(package.replace("_", "-").split("-")[0].replace("_", "-"))
            print_status(f"{package}", "✓")
        except ImportError:
            print_status(f"{package} (NOT INSTALLED)", "✗")
            all_installed = False
    
    return all_installed

def check_backend_files():
    """Verify backend files exist"""
    print("\n3. Checking Backend Files...")
    
    files = [
        "backend/app/api/metamask_auth_routes.py",
        "backend/requirements.txt",
        "backend/app/main.py",
    ]
    
    all_exist = True
    for file_path in files:
        if Path(file_path).exists():
            print_status(f"{file_path}", "✓")
        else:
            print_status(f"{file_path} (NOT FOUND)", "✗")
            all_exist = False
    
    return all_exist

def test_imports():
    """Test critical imports"""
    print("\n4. Testing Ethereum Library Imports...")
    
    test_imports_list = [
        ("eth_account", "Account"),
        ("eth_keys", "keys"),
        ("eth_utils", "decode_hex, to_checksum_address"),
        ("eth_account.messages", "encode_defunct"),
    ]
    
    all_ok = True
    for module, items in test_imports_list:
        try:
            exec(f"from {module} import {items}")
            print_status(f"from {module} import {items}", "✓")
        except Exception as e:
            print_status(f"from {module} import {items} - {str(e)}", "✗")
            all_ok = False
    
    return all_ok

def check_metamask_routes():
    """Check if MetaMask authentication routes are registered"""
    print("\n5. Checking MetaMask Routes Registration...")
    
    try:
        with open("backend/app/api/__init__.py", "r") as f:
            content = f.read()
            
        checks = [
            ("metamask_auth_routes import", "from app.api.metamask_auth_routes" in content),
            ("metamask_auth_router include", "metamask_auth_router" in content),
            ("MetaMask tag in router", "MetaMask Authentication" in content),
        ]
        
        all_ok = True
        for check_name, result in checks:
            if result:
                print_status(check_name, "✓")
            else:
                print_status(f"{check_name} (NOT FOUND)", "✗")
                all_ok = False
        
        return all_ok
    except Exception as e:
        print_status(f"Error checking routes: {str(e)}", "✗")
        return False

def check_frontend_env():
    """Check frontend environment configuration"""
    print("\n6. Checking Frontend Environment Variables...")
    
    try:
        with open("frontend/.env.local", "r") as f:
            env_content = f.read()
            
        if "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1" in env_content:
            print_status("NEXT_PUBLIC_API_URL set correctly", "✓")
            return True
        else:
            print_status("NEXT_PUBLIC_API_URL not found or incorrect", "⚠")
            print("   Expected: http://127.0.0.1:8000/api/v1")
            return False
    except FileNotFoundError:
        print_status("frontend/.env.local (NOT FOUND)", "⚠")
        return False
    except Exception as e:
        print_status(f"Error checking env: {str(e)}", "✗")
        return False

def main():
    """Run all verification checks"""
    print("\n" + "="*60)
    print("MetaMask Authentication Backend Verification")
    print("="*60)
    
    results = {
        "Python Version": check_python_version(),
        "Required Packages": check_required_packages(),
        "Backend Files": check_backend_files(),
        "Import Tests": test_imports(),
        "MetaMask Routes": check_metamask_routes(),
        "Frontend Environment": check_frontend_env(),
    }
    
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    for check, result in results.items():
        status = "✓" if result else "✗"
        print(f"{status} {check}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*60)
    if all_passed:
        print_status("All checks passed! MetaMask authentication is ready.", "✓")
        print("\nNext steps:")
        print("  1. Start the backend: python -m uvicorn app.main:app --host 127.0.0.1 --port 8000")
        print("  2. Start the frontend: npm run dev")
        print("  3. Go to http://localhost:3000/auth/login")
        print("  4. Click 'Connect with MetaMask' button")
        print("\nRefer to METAMASK_TEST_GUIDE.md for detailed testing instructions.")
    else:
        print_status("Some checks failed. Please review the errors above.", "✗")
        print("\nCommon fixes:")
        print("  - Install missing packages: pip install -r backend/requirements.txt")
        print("  - Check Python version: python --version")
        print("  - Verify file paths are correct")
    
    print("="*60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
