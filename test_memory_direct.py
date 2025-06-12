import requests
import json

# Test memory server write operation with correct data structure
test_data = {
    "content": "test memory write from python",
    "user_id": "test_user", 
    "metadata": {"source": "diagnostic_test"}
}

try:
    # Test health first
    health_response = requests.get("http://127.0.0.1:8000/health")
    print("Health check:", health_response.json())
      # Test memory write using correct endpoint
    write_response = requests.post(
        "http://127.0.0.1:8000/v1/memories",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    print("Write response:", write_response.status_code, write_response.text)
    
    # Test memory read using correct endpoint
    search_response = requests.get(
        "http://127.0.0.1:8000/v1/memories",
        params={"query": "test memory", "userId": "test_user", "limit": 5}
    )
    print("Search response:", search_response.status_code, search_response.text)
    
except Exception as e:
    print("Error:", str(e))
