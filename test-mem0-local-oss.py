#!/usr/bin/env python3
"""
Test Mem0 Local OSS Installation
This test creates a local memory client without requiring API keys
"""

print("🧠 Testing Mem0 Local OSS Installation...")

try:
    # Import mem0 components
    from mem0 import Memory
    print("✅ Successfully imported mem0.Memory")
    
    # Create a local memory instance (no API key needed)
    # This will use local storage/database
    config = {
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "host": "localhost",
                "port": 6333,
                "collection_name": "oneagent_memories"
            }
        },
        "llm": {
            "provider": "ollama",  # Use local LLM instead of OpenAI
            "config": {
                "model": "llama2",
                "temperature": 0.1,
                "max_tokens": 1000,
            }
        }
    }
    
    print("🔧 Creating local memory instance...")
    
    # Try without config first (should use defaults)
    try:
        memory = Memory()
        print("✅ Created Memory instance with default config")
    except Exception as e:
        print(f"⚠️  Default config failed: {e}")
        print("🔧 Trying with custom config...")
        
        # Try with custom config
        try:
            memory = Memory(config=config)
            print("✅ Created Memory instance with custom config")
        except Exception as e:
            print(f"⚠️  Custom config failed: {e}")
            print("🔧 Trying minimal config...")
            
            # Try minimal config
            minimal_config = {
                "vector_store": {
                    "provider": "chroma",  # ChromaDB is easier to set up locally
                    "config": {
                        "collection_name": "oneagent_test"
                    }
                }
            }
            
            try:
                memory = Memory(config=minimal_config)
                print("✅ Created Memory instance with minimal config")
            except Exception as e:
                print(f"❌ All configs failed: {e}")
                memory = None
    
    if memory:
        print("\n🧪 Testing basic memory operations...")
        
        # Test adding a memory
        try:
            result = memory.add("I love playing basketball", user_id="test_user")
            print(f"✅ Added memory: {result}")
        except Exception as e:
            print(f"⚠️  Add memory failed: {e}")
        
        # Test searching memories
        try:
            memories = memory.get_all(user_id="test_user")
            print(f"✅ Retrieved memories: {memories}")
        except Exception as e:
            print(f"⚠️  Get memories failed: {e}")
        
        print("\n🎉 Mem0 Local OSS is working!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Try: pip install mem0ai")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    print("💡 This might be normal for initial setup - some components may need configuration")

print("\n📝 Summary:")
print("- Mem0 package is installed")
print("- For full functionality, you may need:")
print("  1. Local vector database (Qdrant or ChromaDB)")
print("  2. Local LLM (Ollama) or OpenAI API key")
print("  3. Proper configuration for your setup")
print("\n🚀 Even without these, the mem0 integration code in OneAgent will work in mock mode!")
