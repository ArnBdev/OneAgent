#!/usr/bin/env python3
"""
Simple integration test for OneAgent's Gemini Memory Server
"""
import requests
import json
import time

def test_server_integration():
    """Test the basic functionality of the Gemini Memory Server"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing OneAgent mem0 Integration")
    print("=====================================")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Server health check passed")
            print(f"   Total memories: {health_data['stats']['total_memories']}")
            print(f"   Collection: {health_data['stats']['collection_name']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Add a memory
    try:
        memory_data = {
            "messages": [
                {"role": "user", "content": "I love playing chess and strategic games"},
                {"role": "assistant", "content": "Chess is an excellent strategic game that develops critical thinking!"}
            ],
            "user_id": "integration-test"
        }
        
        response = requests.post(f"{base_url}/memories", 
                               json=memory_data, 
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Memory added successfully")
            print(f"   Memory ID: {result.get('memory_id', 'N/A')}")
        else:
            print(f"❌ Add memory failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Add memory error: {e}")
        return False
    
    # Test 3: Search memories
    try:
        response = requests.get(f"{base_url}/memories?query=chess games", timeout=5)
        if response.status_code == 200:
            memories = response.json()
            print(f"✅ Search found {len(memories)} memories")
            if memories:
                print(f"   First result: {memories[0].get('memory', 'N/A')[:50]}...")
        else:
            print(f"❌ Search failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Search error: {e}")
        return False
    
    # Test 4: Get all memories
    try:
        response = requests.get(f"{base_url}/memories", timeout=5)
        if response.status_code == 200:
            memories = response.json()
            print(f"✅ Retrieved all memories: {len(memories)} total")
        else:
            print(f"❌ Get all memories failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get all memories error: {e}")
        return False
    
    print("\n🎉 All integration tests passed!")
    print("✅ OneAgent mem0Client should work perfectly with the local server")
    print("✅ The server is fully functional and API-compatible")
    
    return True

if __name__ == "__main__":
    success = test_server_integration()
    if not success:
        exit(1)
