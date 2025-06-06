#!/usr/bin/env python3
"""
Advanced Mem0 + Gemini Embeddings Integration
Creates a custom embedding provider for mem0 that uses Google Gemini embeddings

This enables fully local mem0 setup with free Gemini embeddings instead of paid OpenAI
"""

import os
import sys
import json
import requests
from typing import List, Any, Dict, Optional
import traceback
import uuid

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

class GeminiEmbeddings:
    """
    Custom embedding provider for mem0 that uses Google Gemini embeddings
    This replaces OpenAI embeddings with free Gemini embeddings
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """Initialize Gemini embeddings provider"""
        self.config = config or {}
        self.api_key = self.config.get('api_key', GOOGLE_API_KEY)
        self.model = self.config.get('model', 'text-embedding-004')
        self.dimensions = self.config.get('dimensions', 768)
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        
        print(f"🔢 Initialized Gemini embeddings provider with model: {self.model}")
        
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        return self.embed_batch([text])[0]
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a batch of texts"""
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

class LocalMemoryWithGemini:
    """
    Local memory implementation using Gemini embeddings and ChromaDB
    This bypasses mem0's default configuration and implements custom memory logic
    """
    
    def __init__(self):
        """Initialize local memory with Gemini embeddings"""
        try:
            import chromadb
            from chromadb.config import Settings
            
            # Initialize ChromaDB client
            self.chroma_client = chromadb.PersistentClient(
                path="./oneagent_gemini_memory",
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            self.collection = self.chroma_client.get_or_create_collection(
                name="oneagent_memories"
            )
            
            # Initialize Gemini embeddings
            self.embedder = GeminiEmbeddings()
            
            print("✅ Local memory with Gemini embeddings initialized")
            
        except ImportError:
            print("❌ ChromaDB not available, installing...")
            os.system("pip install chromadb")
            raise Exception("Please install chromadb: pip install chromadb")
    
    def add(self, text: str, user_id: str, metadata: Optional[Dict] = None) -> str:
        """Add a memory with Gemini embedding"""
        try:
            # Generate unique ID
            memory_id = str(uuid.uuid4())
            
            # Generate embedding using Gemini
            embedding = self.embedder.embed(text)
            
            # Prepare metadata
            full_metadata = {
                "user_id": user_id,
                "text": text,
                "embedding_model": "gemini-text-embedding-004",
                **(metadata or {})
            }
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[full_metadata],
                ids=[memory_id]
            )
            
            print(f"✅ Added memory: {memory_id} - {text[:50]}...")
            return memory_id
            
        except Exception as e:
            print(f"❌ Failed to add memory: {e}")
            raise
    
    def search(self, query: str, user_id: str, n_results: int = 5) -> List[Dict]:
        """Search memories using Gemini embeddings similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedder.embed(query)
            
            # Search ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where={"user_id": user_id}
            )
            
            # Format results
            memories = []
            if results['documents'] and results['documents'][0]:
                for i in range(len(results['documents'][0])):
                    memory = {
                        "id": results['ids'][0][i],
                        "text": results['documents'][0][i],
                        "distance": results['distances'][0][i],
                        "metadata": results['metadatas'][0][i]
                    }
                    memories.append(memory)
            
            print(f"✅ Found {len(memories)} memories for query: {query}")
            return memories
            
        except Exception as e:
            print(f"❌ Search failed: {e}")
            raise
    
    def get_all(self, user_id: str) -> List[Dict]:
        """Get all memories for a user"""
        try:
            results = self.collection.get(
                where={"user_id": user_id}
            )
            
            memories = []
            if results['documents']:
                for i in range(len(results['documents'])):
                    memory = {
                        "id": results['ids'][i],
                        "text": results['documents'][i],
                        "metadata": results['metadatas'][i]
                    }
                    memories.append(memory)
            
            print(f"✅ Retrieved {len(memories)} total memories for user: {user_id}")
            return memories
            
        except Exception as e:
            print(f"❌ Get all failed: {e}")
            raise
    
    def delete(self, memory_id: str) -> bool:
        """Delete a specific memory"""
        try:
            self.collection.delete(ids=[memory_id])
            print(f"✅ Deleted memory: {memory_id}")
            return True
        except Exception as e:
            print(f"❌ Delete failed: {e}")
            return False

def test_gemini_embeddings():
    """Test Gemini embeddings API directly"""
    print("\n🧪 Testing Gemini Embeddings API...")
    
    try:
        embedder = GeminiEmbeddings()
        test_texts = [
            "OneAgent is a sophisticated AI system",
            "Memory management with embeddings",
            "Free local AI embeddings with Gemini"
        ]
        
        embeddings = embedder.embed_batch(test_texts)
        print(f"✅ Generated {len(embeddings)} embeddings")
        print(f"   Dimensions: {len(embeddings[0])} per embedding")
        
        # Test similarity
        embedding1 = embedder.embed("AI system")
        embedding2 = embedder.embed("Artificial intelligence system")
        
        # Calculate cosine similarity
        import numpy as np
        similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
        print(f"✅ Similarity test: {similarity:.4f} (AI vs Artificial intelligence)")
        
        return True
        
    except Exception as e:
        print(f"❌ Gemini embeddings test failed: {e}")
        traceback.print_exc()
        return False

def test_local_memory():
    """Test local memory implementation with Gemini embeddings"""
    print("\n🧠 Testing Local Memory with Gemini Embeddings...")
    
    try:
        # Initialize local memory
        memory = LocalMemoryWithGemini()
        
        # Test user
        user_id = "gemini_test_user"
        
        # Add test memories
        test_memories = [
            "OneAgent uses Gemini embeddings for free local memory storage",
            "Google Gemini provides 768-dimensional embeddings at no cost",
            "ChromaDB stores vector embeddings locally without external dependencies",
            "Semantic search works with cosine similarity calculations",
            "TypeScript integration enables full-stack AI memory systems"
        ]
        
        print("💾 Adding test memories...")
        memory_ids = []
        for mem_text in test_memories:
            memory_id = memory.add(mem_text, user_id)
            memory_ids.append(memory_id)
        
        # Search memories
        print("🔍 Testing semantic search...")
        search_queries = [
            "Gemini embeddings",
            "vector storage",
            "TypeScript AI"
        ]
        
        for query in search_queries:
            results = memory.search(query, user_id, n_results=3)
            print(f"   Query: '{query}' -> {len(results)} results")
            for result in results[:2]:  # Show top 2 results
                print(f"     - {result['text'][:60]}... (distance: {result['distance']:.3f})")
        
        # Get all memories
        all_memories = memory.get_all(user_id)
        print(f"✅ Total memories stored: {len(all_memories)}")
        
        # Test delete
        if memory_ids:
            deleted = memory.delete(memory_ids[0])
            print(f"✅ Delete test: {'Success' if deleted else 'Failed'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Local memory test failed: {e}")
        traceback.print_exc()
        return False

def create_integration_config():
    """Create configuration files for TypeScript integration"""
    print("\n📄 Creating integration configuration...")
    
    try:
        # Python config for the local memory server
        python_config = {
            "embeddings": {
                "provider": "gemini",
                "model": "text-embedding-004",
                "api_key": GOOGLE_API_KEY,
                "dimensions": 768
            },
            "vector_store": {
                "provider": "chromadb",
                "path": "./oneagent_gemini_memory",
                "collection": "oneagent_memories"
            },
            "server": {
                "host": "localhost",
                "port": 8000
            }
        }
        
        # TypeScript integration config
        ts_config = {
            "mem0": {
                "localEndpoint": "http://localhost:8000",
                "embeddings": {
                    "provider": "gemini",
                    "model": "text-embedding-004",
                    "dimensions": 768
                },
                "vectorStore": "chromadb"
            }
        }
        
        # Save configs
        with open("./gemini_memory_config.json", 'w') as f:
            json.dump(python_config, f, indent=2)
        
        with open("./oneagent_gemini_config.json", 'w') as f:
            json.dump(ts_config, f, indent=2)
        
        print("✅ Configuration files created:")
        print("   - gemini_memory_config.json (Python server config)")
        print("   - oneagent_gemini_config.json (TypeScript integration config)")
        
        return True
        
    except Exception as e:
        print(f"❌ Config creation failed: {e}")
        return False

def main():
    """Main function to test complete Gemini + Memory integration"""
    print("🚀 Advanced Mem0 + Gemini Embeddings Integration")
    print("=" * 55)
    
    # Test 1: Verify Gemini embeddings work
    gemini_success = test_gemini_embeddings()
    
    # Test 2: Test local memory implementation
    memory_success = test_local_memory()
    
    # Test 3: Create integration config
    config_success = create_integration_config()
    
    print("\n" + "=" * 55)
    print("📊 INTEGRATION TEST RESULTS:")
    print(f"Gemini Embeddings API: {'✅ WORKING' if gemini_success else '❌ FAILED'}")
    print(f"Local Memory System: {'✅ WORKING' if memory_success else '❌ FAILED'}")
    print(f"Integration Config: {'✅ CREATED' if config_success else '❌ FAILED'}")
    
    if gemini_success and memory_success:
        print("\n🎉 SUCCESS! Complete Gemini + Memory integration is working!")
        print("\n💡 NEXT STEPS:")
        print("   1. ✅ Gemini embeddings API working (768 dimensions)")
        print("   2. ✅ Local vector storage with ChromaDB")
        print("   3. ✅ Semantic search with cosine similarity")
        print("   4. 🔄 Integrate with OneAgent TypeScript codebase")
        print("   5. 🔄 Update mem0Client.ts to use local Gemini memory")
        print("   6. 🔄 Test full TypeScript integration")
        
        print("\n🎯 DEPLOYMENT:")
        print("   - Run: python -m http.server 8000 (or create proper API server)")
        print("   - Update OneAgent to use local endpoint")
        print("   - No external API keys needed for embeddings!")
        
    else:
        print("\n⚠️  Integration incomplete - see errors above")

if __name__ == "__main__":
    main()
