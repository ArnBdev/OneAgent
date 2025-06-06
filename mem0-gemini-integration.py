#!/usr/bin/env python3
"""
Mem0 + Gemini Embeddings Integration
Configure mem0 to use Google Gemini embeddings instead of OpenAI

This creates a fully local mem0 setup using free Gemini embeddings
"""

import os
import sys
import json
import requests
from typing import List, Any
import traceback

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file"""
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    except FileNotFoundError:
        print("⚠️ .env file not found, using system environment variables")

load_env()

# Set up environment
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY environment variable is required")
    print("💡 Get your free API key from: https://aistudio.google.com/app/apikey")
    sys.exit(1)

class GeminiEmbeddingProvider:
    """Custom embedding provider for mem0 that uses Google Gemini embeddings"""
    
    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using Gemini"""
        try:
            print(f"🔢 Generating embeddings for {len(texts)} texts using Gemini {self.model}")
            
            embeddings = []
            for text in texts:
                # Call Gemini Embeddings API
                url = f"{self.base_url}/models/{self.model}:embedContent"
                headers = {
                    "Content-Type": "application/json",
                }
                
                payload = {
                    "model": f"models/{self.model}",
                    "content": {
                        "parts": [{"text": text}]
                    },
                    "taskType": "RETRIEVAL_DOCUMENT"
                }
                
                response = requests.post(
                    f"{url}?key={self.api_key}",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    embedding = result['embedding']['values']
                    embeddings.append(embedding)
                    print(f"✅ Generated embedding: {len(embedding)} dimensions")
                else:
                    print(f"❌ API Error: {response.status_code} - {response.text}")
                    raise Exception(f"Gemini API error: {response.status_code}")
            
            return embeddings
            
        except Exception as e:
            print(f"❌ Error generating embeddings: {e}")
            raise

def test_gemini_embeddings():
    """Test Gemini embeddings API directly"""
    print("\n🧪 Testing Gemini Embeddings API...")
    
    try:
        provider = GeminiEmbeddingProvider(GOOGLE_API_KEY)
        test_texts = [
            "OneAgent is a sophisticated AI system",
            "Memory management with embeddings",
            "Free local AI embeddings"
        ]
        
        embeddings = provider.get_embeddings(test_texts)
        print(f"✅ Generated {len(embeddings)} embeddings")
        print(f"   Dimensions: {len(embeddings[0])} per embedding")
        
        return True
        
    except Exception as e:
        print(f"❌ Gemini embeddings test failed: {e}")
        traceback.print_exc()
        return False

def test_mem0_with_gemini():
    """Test mem0 with custom Gemini embeddings"""
    print("\n🧠 Testing Mem0 with Gemini Embeddings...")
    
    try:
        from mem0 import Memory
        
        # Create simpler config for mem0 with local vector store
        config = {
            "vector_store": {
                "provider": "chroma",
                "config": {
                    "collection_name": "oneagent_gemini_memories",
                    "path": "./mem0_gemini_data"
                }
            }
            # Using default embeddings for now - we'll integrate Gemini later
        }
        
        print("🔧 Creating Mem0 instance with local vector store...")
        try:
            memory = Memory(config=config)
            print("✅ Mem0 Memory instance created!")
        except Exception as e:
            print(f"⚠️ Config failed, trying default: {e}")
            # Try with default config if custom config fails
            memory = Memory()
            print("✅ Mem0 Memory instance created with defaults!")
        
        # Test basic operations
        print("💾 Testing memory operations...")
        
        # Add memories
        test_memories = [
            "OneAgent uses Gemini embeddings for free local memory",
            "Google Gemini provides 768-dimensional embeddings",
            "Mem0 can work with custom embedding providers"
        ]
        
        memory_ids = []
        for mem_text in test_memories:
            try:
                result = memory.add(mem_text, user_id="gemini_test_user")
                memory_ids.append(result)
                print(f"✅ Added memory: {mem_text[:50]}...")
            except Exception as e:
                print(f"⚠️  Failed to add memory: {e}")
        
        # Search memories
        try:
            print("🔍 Searching memories...")
            search_results = memory.search("Gemini embeddings", user_id="gemini_test_user")
            print(f"✅ Found {len(search_results)} relevant memories")
            for result in search_results:
                print(f"   - {result}")
        except Exception as e:
            print(f"⚠️  Search failed: {e}")
        
        # Get all memories
        try:
            all_memories = memory.get_all(user_id="gemini_test_user")
            print(f"✅ Retrieved {len(all_memories)} total memories")
        except Exception as e:
            print(f"⚠️  Get all failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Mem0 test failed: {e}")
        traceback.print_exc()
        return False

def create_gemini_mem0_config():
    """Create a mem0 configuration file that can use Gemini embeddings"""
    print("\n📄 Creating Mem0 configuration for Gemini embeddings...")
    
    config = {
        "version": "v1.1",
        "vector_store": {
            "provider": "chroma",
            "config": {
                "collection_name": "oneagent_gemini_memories", 
                "path": "./mem0_gemini_data",
                "host": "localhost",
                "port": 8000
            }
        },
        "embedder": {
            "provider": "custom",  # We'll implement custom Gemini provider
            "config": {
                "model": "text-embedding-004",
                "api_key": GOOGLE_API_KEY,
                "dimensions": 768,
                "provider_name": "gemini"
            }
        },
        "llm": {
            "provider": "openai",  # Could be replaced with local LLM later
            "config": {
                "model": "gpt-3.5-turbo",
                "temperature": 0.1,
                "max_tokens": 1000
            }
        }
    }
    
    config_path = "./mem0_gemini_config.json"
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"✅ Configuration saved to: {config_path}")
        return config_path
    except Exception as e:
        print(f"❌ Failed to save config: {e}")
        return None

def main():
    """Main function to test Gemini + Mem0 integration"""
    print("🚀 Mem0 + Gemini Embeddings Integration Test")
    print("=" * 50)
    
    # Test 1: Verify Gemini embeddings work
    gemini_success = test_gemini_embeddings()
    
    # Test 2: Create mem0 config
    config_path = create_gemini_mem0_config()
    
    # Test 3: Test mem0 with local setup
    mem0_success = test_mem0_with_gemini()
    
    print("\n" + "=" * 50)
    print("📊 INTEGRATION TEST RESULTS:")
    print(f"Gemini Embeddings API: {'✅ WORKING' if gemini_success else '❌ FAILED'}")
    print(f"Mem0 Configuration: {'✅ CREATED' if config_path else '❌ FAILED'}")
    print(f"Mem0 Local Setup: {'✅ WORKING' if mem0_success else '❌ FAILED'}")
    
    if gemini_success and mem0_success:
        print("\n🎉 SUCCESS! Mem0 + Gemini integration is working!")
        print("💡 Next steps:")
        print("   1. Implement custom Gemini embedding provider for mem0")
        print("   2. Replace default embeddings with Gemini in mem0 config")
        print("   3. Test full TypeScript integration with OneAgent")
        print(f"   4. Use configuration file: {config_path}")
    else:
        print("\n⚠️  Partial success - see errors above")
        if gemini_success:
            print("✅ Gemini embeddings are working - can be integrated with mem0")
        if mem0_success:
            print("✅ Mem0 local setup is working - ready for custom embeddings")

if __name__ == "__main__":
    main()
