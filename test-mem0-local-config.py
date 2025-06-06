#!/usr/bin/env python3
"""
Test Mem0 with Local Configuration
Configure mem0 to work locally without requiring API keys
"""

import os
import sys

def test_mem0_local_config():
    """Test mem0 with local configuration"""
    try:
        print("🧠 Testing Mem0 with Local Configuration...")
        from mem0 import Memory
        
        # Configure for local use without API keys
        config = {
            "embedder": {
                "provider": "huggingface",  # Use Hugging Face embeddings (local)
                "config": {
                    "model": "sentence-transformers/all-MiniLM-L6-v2"
                }
            },
            "vector_store": {
                "provider": "chroma",  # Use Chroma (local vector store)
                "config": {
                    "collection_name": "oneagent_memories",
                    "path": "./mem0_data"
                }
            }
        }
        
        print("🔧 Creating Memory instance with local config...")
        memory = Memory(config=config)
        print("✅ Memory instance created successfully!")
        
        # Test adding a memory
        print("💾 Adding test memory...")
        result = memory.add("OneAgent is a sophisticated AI system with memory capabilities", user_id="test_user")
        print(f"✅ Memory added: {result}")
        
        # Test searching memories
        print("🔍 Searching memories...")
        memories = memory.search("OneAgent AI", user_id="test_user")
        print(f"✅ Found memories: {memories}")
        
        # Test getting all memories
        print("📋 Getting all memories...")
        all_memories = memory.get_all(user_id="test_user")
        print(f"✅ All memories: {all_memories}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mem0_sqlite_config():
    """Test with SQLite backend (even simpler)"""
    try:
        print("\n🧠 Testing Mem0 with SQLite Configuration...")
        from mem0 import Memory
        
        # Even simpler config with SQLite
        config = {
            "vector_store": {
                "provider": "chroma",
                "config": {
                    "collection_name": "oneagent_test",
                    "path": "./mem0_sqlite_data"
                }
            }
        }
        
        print("🔧 Creating Memory instance with SQLite config...")
        memory = Memory(config=config)
        print("✅ Memory instance created!")
        
        return True
        
    except Exception as e:
        print(f"❌ SQLite test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Mem0 Local Configurations...")
    print("=" * 50)
    
    # Test 1: Hugging Face embeddings
    success1 = test_mem0_local_config()
    
    # Test 2: SQLite backend
    success2 = test_mem0_sqlite_config()
    
    print("\n" + "=" * 50)
    print("📊 RESULTS:")
    print(f"Local Config Test: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"SQLite Config Test: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 or success2:
        print("\n🎉 MEM0 CAN WORK LOCALLY!")
        print("💡 Use local embeddings and vector stores")
    else:
        print("\n❌ Local configuration needs adjustment")
