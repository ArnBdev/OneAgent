#!/usr/bin/env python3
"""
OneAgent Local Memory Implementation Verification
This script proves that Mem0 + Memgraph can work locally for OneAgent
"""

import sys
import os
import subprocess
import time
from pathlib import Path

def print_status(message, status="INFO"):
    icons = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
    print(f"{icons.get(status, '📌')} {message}")

def check_docker():
    """Verify Docker is installed and running"""
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_status(f"Docker installed: {result.stdout.strip()}", "SUCCESS")
            return True
        else:
            print_status("Docker not found", "ERROR")
            return False
    except FileNotFoundError:
        print_status("Docker not installed", "ERROR")
        return False

def start_memgraph():
    """Start Memgraph locally with Docker"""
    print_status("Starting Memgraph...")
    try:
        # Check if container already exists
        result = subprocess.run(['docker', 'ps', '-a', '--filter', 'name=oneagent-memgraph'], 
                              capture_output=True, text=True)
        
        if 'oneagent-memgraph' in result.stdout:
            print_status("Stopping existing Memgraph container...")
            subprocess.run(['docker', 'stop', 'oneagent-memgraph'], capture_output=True)
            subprocess.run(['docker', 'rm', 'oneagent-memgraph'], capture_output=True)
        
        # Start new container
        cmd = [
            'docker', 'run', '-d',
            '--name', 'oneagent-memgraph',
            '-p', '7687:7687',
            '-p', '7444:7444',
            'memgraph/memgraph-mage:latest',
            '--schema-info-enabled=True'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print_status("Memgraph container started", "SUCCESS")
            time.sleep(5)  # Wait for startup
            return True
        else:
            print_status(f"Failed to start Memgraph: {result.stderr}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Error starting Memgraph: {e}", "ERROR")
        return False

def test_memgraph_connection():
    """Test connection to Memgraph"""
    try:
        # Test with mgconsole inside container
        cmd = ['docker', 'exec', 'oneagent-memgraph', 'mgconsole', 
               '--non-interactive', '--query', 'RETURN "Connected" AS status;']
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and 'Connected' in result.stdout:
            print_status("Memgraph connection verified", "SUCCESS")
            return True
        else:
            print_status(f"Memgraph connection failed: {result.stderr}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Error testing Memgraph: {e}", "ERROR")
        return False

def install_mem0():
    """Install Mem0 with graph support"""
    print_status("Installing Mem0 with graph support...")
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pip', 'install', '"mem0ai[graph]"', 'chromadb', 'neo4j'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print_status("Mem0 dependencies installed", "SUCCESS")
            return True
        else:
            print_status(f"Failed to install Mem0: {result.stderr}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Error installing Mem0: {e}", "ERROR")
        return False

def test_mem0_import():
    """Test Mem0 import and basic functionality"""
    try:
        import mem0
        from mem0 import Memory
        print_status("Mem0 import successful", "SUCCESS")
        return True
    except ImportError as e:
        print_status(f"Mem0 import failed: {e}", "ERROR")
        return False

def test_integration():
    """Test Mem0 + Memgraph integration"""
    print_status("Testing Mem0 + Memgraph integration...")
    try:
        from mem0 import Memory
        
        config = {
            "vector_store": {
                "provider": "chroma",
                "config": {
                    "collection_name": "test_oneagent",
                    "path": "./test_memory"
                }
            },
            "graph_store": {
                "provider": "memgraph",
                "config": {
                    "url": "bolt://localhost:7687",
                    "username": "",
                    "password": ""
                }
            }
        }
        
        # Initialize memory with local configuration
        memory = Memory.from_config(config_dict=config)
        
        # Test basic memory operations
        result = memory.add("This is a test memory for OneAgent", user_id="test_user")
        print_status(f"Memory added: {result}", "SUCCESS")
        
        # Test search
        search_results = memory.search("test memory", user_id="test_user")
        print_status(f"Search results: {len(search_results)} memories found", "SUCCESS")
        
        print_status("✨ Integration test PASSED! Mem0 + Memgraph working locally", "SUCCESS")
        return True
        
    except Exception as e:
        print_status(f"Integration test failed: {e}", "ERROR")
        return False

def create_oneagent_config():
    """Create production-ready OneAgent memory configuration"""
    config_content = '''
# OneAgent Local Memory Configuration
# Place this in: coreagent/config/memory_config.json

{
  "llm": {
    "provider": "gemini",
    "config": {
      "model": "gemini-2.5-flash",
      "api_key": "${GEMINI_API_KEY}"
    }
  },
  "embedder": {
    "provider": "gemini",
    "config": {
      "model": "gemini-embedding-exp-03-07"
    }
  },
  "vector_store": {
    "provider": "chroma",
    "config": {
      "collection_name": "oneagent_memories",
      "path": "./data/memory/vector",
      "host": "localhost",
      "port": 8000
    }
  },
  "graph_store": {
    "provider": "memgraph",
    "config": {
      "url": "bolt://localhost:7687",
      "username": "",
      "password": ""
    }
  }
}
'''
    
    os.makedirs('./config', exist_ok=True)
    with open('./config/oneagent_memory_config.json', 'w') as f:
        f.write(config_content)
    
    print_status("OneAgent memory configuration created: ./config/oneagent_memory_config.json", "SUCCESS")

def cleanup():
    """Clean up test resources"""
    print_status("Cleaning up test resources...")
    try:
        # Remove test memory directory
        import shutil
        if os.path.exists('./test_memory'):
            shutil.rmtree('./test_memory')
        print_status("Test cleanup completed", "SUCCESS")
    except Exception as e:
        print_status(f"Cleanup warning: {e}", "WARNING")

def main():
    print_status("🚀 OneAgent Local Memory Implementation Verification", "INFO")
    print_status("=" * 60, "INFO")
    
    tests = [
        ("Docker Check", check_docker),
        ("Start Memgraph", start_memgraph),
        ("Test Memgraph Connection", test_memgraph_connection),
        ("Install Mem0", install_mem0),
        ("Test Mem0 Import", test_mem0_import),
        ("Test Integration", test_integration),
    ]
    
    results = []
    for test_name, test_func in tests:
        print_status(f"Running: {test_name}")
        result = test_func()
        results.append((test_name, result))
        if not result:
            print_status(f"Test failed: {test_name}", "ERROR")
            break
        print_status("")
    
    print_status("=" * 60, "INFO")
    
    # Summary
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    if passed == total:
        print_status(f"🎉 ALL TESTS PASSED ({passed}/{total})", "SUCCESS")
        print_status("✅ OneAgent local memory system is ready for implementation!", "SUCCESS")
        print_status("", "INFO")
        print_status("Next steps:", "INFO")
        print_status("1. Use the generated config file: ./config/oneagent_memory_config.json", "INFO")
        print_status("2. Integrate with OneAgent core using the local memory API", "INFO")
        print_status("3. Start building advanced collaborative agent features", "INFO")
        
        create_oneagent_config()
        
    else:
        print_status(f"❌ TESTS FAILED ({passed}/{total})", "ERROR")
        print_status("Please check the errors above and retry", "ERROR")
    
    cleanup()
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
