"""Test RPC Connectivity"""
from web3 import Web3
import requests

# Test different RPC providers
rpc_urls = [
    "https://polygon-amoy.g.alchemy.com/v2/demo",
    "https://rpc-amoy.polygon.technology",  
    "https://polygon-amoy-bor-rpc.publicnode.com",
    "https://amoy.polygon.api.onfinality.io/public"
]

def test_rpc_connectivity():
    for rpc_url in rpc_urls:
        try:
            print(f"Testing: {rpc_url}")
            
            # First test basic HTTP connectivity
            response = requests.get(rpc_url, timeout=5)
            print(f"  HTTP Response: {response.status_code}")
            
            # Then test Web3 connection
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            if w3.is_connected():
                chain_id = w3.eth.chain_id
                print(f"  ✅ Connected! Chain ID: {chain_id}")
                return rpc_url
            else:
                print(f"  ❌ Web3 connection failed")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print("No working RPC found")
    return None

if __name__ == "__main__":
    working_rpc = test_rpc_connectivity()
    if working_rpc:
        print(f"\nUse this RPC: {working_rpc}")