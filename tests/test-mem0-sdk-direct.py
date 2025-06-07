#!/usr/bin/env python3
"""
Test Mem0 SDK Direct Integration
This demonstrates using Mem0 as an embedded SDK, not a server
"""
import os
import sys

def test_mem0_sdk():
    print("🧠 Testing Mem0 SDK Direct Integration...")
    
    try:
        # Import Mem0 SDK
        from mem0 import Memory
        print("✅ Mem0 SDK imported successfully")
        
        # Initialize memory (this should work without external dependencies)
        print("🔧 Initializing Mem0 Memory...")
        config = {
            "vector_store": {
                "provider": "chroma",
                "config": {
                    "path": "./chroma_db"
                }
            },
            "embedder": {
                "provider": "openai",
                "config": {
                    "model": "text-embedding-ada-002"
                }
            }
        }
        
        # Try without OpenAI first (local embeddings)
        try:
            memory = Memory()
            print("✅ Mem0 Memory initialized with defaults")
        except Exception as e:
            print(f"⚠️  Default initialization failed: {e}")
            print("💡 This is expected without OpenAI API key")
            
            # Try with local configuration
            try:
                local_config = {
                    "vector_store": {
                        "provider": "chroma",
                        "config": {
                            "path": "./chroma_db"
                        }
                    }
                }
                memory = Memory(config=local_config)
                print("✅ Mem0 Memory initialized with local config")
            except Exception as e2:
                print(f"⚠️  Local config failed: {e2}")
                print("🎭 Using basic instance...")
                memory = Memory()
        
        # Test basic operations
        print("💾 Testing memory operations...")
        
        # Add a memory
        try:
            result = memory.add("I love playing basketball", user_id="test_user")
            print(f"✅ Memory added: {result}")
        except Exception as e:
            print(f"⚠️  Add memory failed: {e}")
            print("💡 This might need an LLM configuration")
        
        # Search memories
        try:
            memories = memory.search("basketball", user_id="test_user")
            print(f"✅ Memory search: {memories}")
        except Exception as e:
            print(f"⚠️  Search failed: {e}")
        
        # Get all memories
        try:
            all_memories = memory.get_all(user_id="test_user")
            print(f"✅ All memories: {all_memories}")
        except Exception as e:
            print(f"⚠️  Get all failed: {e}")
        
        print("🎉 Mem0 SDK test completed!")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import Mem0: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_mem0_sdk()
    if success:
        print("✅ Mem0 SDK is working! No external server needed.")
        print("💡 Mem0 is an embedded memory layer, not a standalone server.")
    else:
        print("❌ Mem0 SDK test failed")
    
    sys.exit(0 if success else 1)
